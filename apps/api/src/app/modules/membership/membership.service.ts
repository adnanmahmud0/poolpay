import { User } from "../user/user.model";
import Stripe from "stripe";
import { MembershipTier, SubscriptionStatus } from "../user/user.interface";
import { Settings } from "../settings/settings.model";
import { stripe } from "../../config/stripe.config";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { AuditLog, AuditAction, EntityType } from "../auditLog/auditLog.model";
import logger from "../../utils/logger";
import { 
  emitRealTimeNotification, 
  enqueuePushNotification,
  enqueueEmailNotification
} from "../../utils/notification.utils";
import { Notification, NotificationType } from "../notification/notification.model";

const getPriceIdForTier = async (tier: MembershipTier) => {
  const settings = await Settings.findOne();
  
  let priceId: string | undefined | null = null;
  if (tier === MembershipTier.REGULAR) {
    priceId = settings?.regularMembershipPriceId || envVars.STRIPE.REGULAR_PRICE_ID;
  } else if (tier === MembershipTier.VIP) {
    priceId = settings?.vipMembershipPriceId || envVars.STRIPE.VIP_PRICE_ID;
  }

  logger.info(`[MEMBERSHIP] Resolved Price ID for ${tier}: ${priceId} (DB: ${settings?.regularMembershipPriceId}, Env: ${envVars.STRIPE.REGULAR_PRICE_ID})`);
  
  return priceId || null;
};

const createSubscription = async (
  userId: string, 
  targetTier: MembershipTier,
  _successUrl?: string,
  _cancelUrl?: string
) => {
  const session = await User.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(userId).select("+stripeSubscriptionId +stripeCustomerId").session(session);
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

    const currentTier = user.membershipTier;
    if (currentTier === targetTier) {
      throw new AppError(httpStatus.BAD_REQUEST, `You are already a ${targetTier} member`);
    }

    const priceId = await getPriceIdForTier(targetTier);
    if (!priceId) throw new AppError(httpStatus.BAD_REQUEST, "Invalid membership tier or Price ID not configured");

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save({ session });
    }

    let subscription;
    let isUpdate = false;

    if (user.stripeSubscriptionId) {
      // UPGRADE / DOWNGRADE FLOW
      isUpdate = true;
      const stripeSub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      const subscriptionItemId = stripeSub.items.data[0].id;

      subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        items: [{
          id: subscriptionItemId,
          price: priceId,
        }],
        payment_behavior: "default_incomplete",
        proration_behavior: "always_invoice",
        expand: ["latest_invoice.payment_intent"],
        metadata: { userId: user._id.toString(), targetTier, isUpdate: "true" },
      });
    } else {
      // NEW SUBSCRIPTION FLOW
      subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
        metadata: { userId: user._id.toString(), targetTier },
      });
    }

    const paymentIntent = (subscription.latest_invoice as Stripe.Invoice).payment_intent as Stripe.PaymentIntent;

    await session.commitTransaction();
    return { 
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret,
      status: subscription.status,
      isUpdate
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const cancelSubscription = async (userId: string) => {
  const session = await User.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(userId).session(session);
    if (!user || !user.stripeSubscriptionId) {
      throw new AppError(httpStatus.BAD_REQUEST, "No active subscription found");
    }

    // Immediately cancel the subscription on Stripe
    await stripe.subscriptions.cancel(user.stripeSubscriptionId);

    user.membershipTier = MembershipTier.GUEST;
    user.subscriptionStatus = SubscriptionStatus.EXPIRED;
    user.autoRenewEnabled = false;
    user.stripeSubscriptionId = undefined; // Clear the ID
    await user.save({ session });

    await AuditLog.create([{
      entityType: EntityType.USER,
      entityId: userId,
      action: AuditAction.MEMBERSHIP_CANCEL,
      metadata: { stripeSubscriptionId: user.stripeSubscriptionId, immediate: true }
    }], { session });

    await session.commitTransaction();

    // Notify User
    const title = "Membership Cancelled";
    const body = "Your membership has been cancelled. You have been returned to GUEST status.";
    
    emitRealTimeNotification(userId, title, body);

    const notificationPromises: Promise<unknown>[] = [
      enqueueEmailNotification(user.email, title, "adminAlert", { message: body }),
      Notification.create([{
        userId: user._id,
        title,
        message: body,
        type: NotificationType.PAYMENT_FAILED
      }])
    ];

    if (user.fcmToken) {
      notificationPromises.push(
        enqueuePushNotification(userId, title, body, { type: "membership_cancelled" })
      );
    }

    await Promise.all(notificationPromises);

    return { message: "Subscription cancelled immediately. You have been returned to GUEST status." };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const toggleAutoRenew = async (userId: string, autoRenew: boolean) => {
  const session = await User.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(userId).session(session);
    if (!user || !user.stripeSubscriptionId) {
      throw new AppError(httpStatus.BAD_REQUEST, "No active subscription found");
    }

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: !autoRenew,
    });

    user.autoRenewEnabled = autoRenew;
    await user.save({ session });

    await session.commitTransaction();

    // Notify User
    const title = autoRenew ? "Auto-Renew Enabled" : "Auto-Renew Disabled";
    const body = `Auto-renewal for your ${user.membershipTier.toUpperCase()} membership has been ${autoRenew ? "enabled" : "disabled"}.`;
    
    emitRealTimeNotification(userId, title, body);

    const notificationPromises: Promise<unknown>[] = [
      Notification.create([{
        userId: user._id,
        title,
        message: body,
        type: NotificationType.NEW_MESSAGE
      }])
    ];

    if (user.fcmToken) {
      notificationPromises.push(
        enqueuePushNotification(userId, title, body, { type: "membership_autorenew" })
      );
    }

    await Promise.all(notificationPromises);

    return { autoRenew };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getMembershipStatus = async (userId: string) => {
  const user = await User.findById(userId).select("firstName lastName membershipTier subscriptionStatus subscriptionExpiry autoRenewEnabled pendingMembershipTier gracePeriodUntil stripeSubscriptionId");
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  return user;
};

export const MembershipServices = {
  createSubscription,
  cancelSubscription,
  toggleAutoRenew,
  getMembershipStatus,
};
