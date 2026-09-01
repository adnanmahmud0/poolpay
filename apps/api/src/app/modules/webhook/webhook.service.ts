import { stripe } from "../../config/stripe.config";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { Payment, PaymentStatus } from "../payment/payment.model";
import {
  Transaction,
  TransactionStatus,
} from "../transaction/transaction.model";
import {
  Notification,
  NotificationType,
} from "../notification/notification.model";
import { Group } from "../group/group.model";
import logger from "../../utils/logger";
import mongoose from "mongoose";
import { logActivity } from "../../utils/activityLogger";
import { Payout, PayoutStatus } from "../payout/payout.model";
import { Turn } from "../turn/turn.model";
import { TurnStatus } from "../turn/turn.interface";
import { User } from "../user/user.model";
import { MembershipTier, SubscriptionStatus } from "../user/user.interface";
import { Settings } from "../settings/settings.model";
import { Stripe } from "stripe";
import { AuditLog, AuditAction, EntityType } from "../auditLog/auditLog.model";
import { 
  enqueuePushNotification, 
  enqueueEmailNotification, 
  emitRealTimeNotification 
} from "../../utils/notification.utils";
import { generateReceiptPDF } from "../../utils/pdfGenerator";

const handleStripeWebhook = async (payload: Buffer, signature: string) => {
  let event: Stripe.Event;

  logger.info(
    `[Webhook] Received webhook. Payload type: ${typeof payload}, isBuffer: ${Buffer.isBuffer(payload)}`
  );

  try {
    // Attempt verification with the primary secret first
    try {
      event = await stripe.webhooks.constructEventAsync(
        payload,
        signature,
        envVars.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (primaryErr) {
      // If primary fails and we have a connect secret, try that
      if (envVars.STRIPE.CONNECT_WEBHOOK_SECRET) {
        logger.info("[Webhook] Primary secret failed, trying Connect secret...");
        event = await stripe.webhooks.constructEventAsync(
          payload,
          signature,
          envVars.STRIPE.CONNECT_WEBHOOK_SECRET
        );
      } else {
        throw primaryErr;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(`[Webhook] Signature verification failed for all secrets: ${message}`);

    await AuditLog.create({
      entityType: EntityType.SYSTEM,
      entityId: "webhook",
      action: AuditAction.WEBHOOK_REJECTED,
      metadata: { error: message, signature: !!signature },
    });

    throw new AppError(httpStatus.BAD_REQUEST, `Webhook Error: ${message}`);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        // Idempotency check: verify if already processed atomically
        const payment = await Payment.findOneAndUpdate(
          {
            stripePaymentIntentId: paymentIntent.id,
            status: { $ne: PaymentStatus.PAID },
          },
          {
            status: PaymentStatus.PAID,
            paidDate: new Date(),
          },
          { new: true, session }
        );

        if (!payment) {
          logger.info(
            `[Webhook] Payment ${paymentIntent.id} already processed or not found.`
          );
          await session.commitTransaction();
          return { received: true };
        }

        const transaction = await Transaction.findOneAndUpdate(
          {
            referenceId: paymentIntent.id,
            status: { $ne: TransactionStatus.SUCCESS },
          },
          { status: TransactionStatus.SUCCESS },
          { new: true, session }
        );

        if (transaction) {
          // Update group pool amount
          await Group.findByIdAndUpdate(
            transaction.groupId,
            { $inc: { poolAmount: transaction.amount } },
            { session }
          );

          const group = await Group.findById(transaction.groupId).session(
            session
          );
          const title = "Payment Successful";
          const message = `Your payment of $${transaction.amount} for ${group?.name || "the group"} was successful.`;
          await Notification.create(
            [
              {
                userId: transaction.userId,
                title,
                message,
                type: NotificationType.PAYMENT_SUCCESS,
              },
            ],
            { session }
          );
          emitRealTimeNotification(transaction.userId.toString(), title, message);
          enqueuePushNotification(transaction.userId.toString(), title, message);

          logger.info(
            `[Audit] Payment Succeeded: User ${transaction.userId}, Amount ${transaction.amount}, Intent ${paymentIntent.id}`
          );

          await logActivity(
            transaction.userId,
            "PAYMENT_SUCCESS",
            `Payment of ${transaction.amount} succeeded for group ${transaction.groupId}. Stripe ID: ${paymentIntent.id}`
          );
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;

        // Idempotency check: verify if already failed atomically
        const payment = await Payment.findOneAndUpdate(
          {
            stripePaymentIntentId: paymentIntent.id,
            status: { $ne: PaymentStatus.FAILED },
          },
          {
            status: PaymentStatus.FAILED,
          },
          { new: true, session }
        );

        if (!payment) {
          logger.info(
            `[Webhook] Payment failure for ${paymentIntent.id} already processed or not found.`
          );
          await session.commitTransaction();
          return { received: true };
        }

        const transaction = await Transaction.findOneAndUpdate(
          {
            referenceId: paymentIntent.id,
            status: { $ne: TransactionStatus.FAILED },
          },
          { status: TransactionStatus.FAILED },
          { new: true, session }
        );

        if (transaction) {
          const group = await Group.findById(transaction.groupId).session(
            session
          );
          const title = "Payment Failed";
          const message = `Your payment of $${transaction.amount} for ${group?.name || "the group"} failed. Please try again.`;
          await Notification.create(
            [
              {
                userId: transaction.userId,
                title,
                message,
                type: NotificationType.PAYMENT_FAILED,
              },
            ],
            { session }
          );
          emitRealTimeNotification(transaction.userId.toString(), title, message);
          enqueuePushNotification(transaction.userId.toString(), title, message);

          logger.warn(
            `[Audit] Payment Failed: User ${transaction.userId}, Intent ${paymentIntent.id}`
          );
        }
        break;
      }

      case "transfer.created": {
        const transfer = event.data.object;
        logger.info(`[Webhook] Transfer created: ${transfer.id}`);
        // We already mark as success in worker, but we could update metadata here
        break;
      }

      case "transfer.reversed": {
        const transfer = event.data.object;
        logger.error(`[Webhook] Transfer reversed: ${transfer.id}`);

        const transaction = await Transaction.findOneAndUpdate(
          {
            referenceId: transfer.id,
            status: { $ne: TransactionStatus.FAILED },
          },
          { status: TransactionStatus.FAILED },
          { session, new: true }
        );

        if (!transaction) {
          logger.info(
            `[Webhook] Transfer ${transfer.id} already reversed or not found.`
          );
          await session.commitTransaction();
          return { received: true };
        }

        if (transaction) {
          await Payout.findOneAndUpdate(
            { transactionId: transaction._id },
            { status: PayoutStatus.FAILED },
            { session }
          );

          // Find the turn and revert status
          const payout = await Payout.findOne({
            transactionId: transaction._id,
          }).session(session);
          if (payout) {
            await Turn.findByIdAndUpdate(
              payout.turnId,
              { status: TurnStatus.RECOVERY_REQUIRED },
              { session }
            );

            await AuditLog.create(
              [
                {
                  entityType: EntityType.TURN,
                  entityId: payout.turnId,
                  action: AuditAction.MANUAL_REVIEW_ESCALATED,
                  metadata: { reason: "Transfer reversed by Stripe" },
                },
              ],
              { session }
            );
          }

          const title = "Payout Reversed";
          const message = `Your payout of $${transaction.amount} was reversed. Reason: Stripe Transfer Reversed.`;
          await Notification.create(
            [
              {
                userId: transaction.userId,
                title,
                message,
                type: NotificationType.PAYMENT_FAILED,
              },
            ],
            { session }
          );
          emitRealTimeNotification(transaction.userId.toString(), title, message);
          enqueuePushNotification(transaction.userId.toString(), title, message);
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        if (account.payouts_enabled && account.charges_enabled) {
          // Idempotency check: verify if already verified atomically
          const user = await User.findOneAndUpdate(
            {
              stripeConnectedAccountId: account.id,
              stripeConnectStatus: { $ne: "verified" },
            },
            { stripeConnectStatus: "verified" },
            { session, new: true }
          );

          if (!user) {
            logger.info(
              `[Webhook] User account ${account.id} already verified or not found.`
            );
            await session.commitTransaction();
            return { received: true };
          }
          if (user) {
            logger.info(
              `[Webhook] User ${user.email} Stripe Connect verified.`
            );
            const title = "Stripe Connect Verified";
            const message = "Your Stripe Connect account has been successfully verified. You are now eligible for payouts.";
            await Notification.create(
              [
                {
                  userId: user._id,
                  title,
                  message,
                  type: NotificationType.PAYMENT_SUCCESS,
                },
              ],
              { session }
            );
            emitRealTimeNotification(user._id.toString(), title, message);
            enqueuePushNotification(user._id.toString(), title, message);
          }
        }
        break;
      }

      case "payout.failed": {
        const stripePayout = event.data.object;
        logger.error(
          `[Webhook] Connected Account Payout failed: ${stripePayout.id}`
        );
        // This is from connected account to bank. We should notify user.
        break;
      }

      // --- MEMBERSHIP SUBSCRIPTION EVENTS ---

      case "checkout.session.completed": {
        const sessionObj = event.data.object as Stripe.Checkout.Session;
        if (sessionObj.mode === "subscription" && sessionObj.metadata?.userId) {
          const { userId, targetTier } = sessionObj.metadata;
          const subscriptionId = sessionObj.subscription as string;

          const user = await User.findById(userId).session(session);
          if (user) {
            user.membershipTier = targetTier as MembershipTier;
            user.stripeSubscriptionId = subscriptionId;
            user.subscriptionStatus = SubscriptionStatus.ACTIVE;
            user.membershipStartedAt = new Date();
            user.autoRenewEnabled = true;
            await user.save({ session });

            await AuditLog.create(
              [
                {
                  entityType: EntityType.USER,
                  entityId: user._id,
                  action: AuditAction.MEMBERSHIP_UPGRADE,
                  metadata: {
                    targetTier,
                    stripeSubscriptionId: subscriptionId,
                  },
                },
              ],
              { session }
            );

            await Notification.create(
              [
                {
                  userId: user._id,
                  title: "Membership Activated",
                  message: `Welcome to PoolPay ${targetTier.toUpperCase()}! Your membership is now active.`,
                  type: NotificationType.PAYMENT_SUCCESS,
                },
              ],
              { session }
            );
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        if (!userId) break;

        const user = await User.findById(userId).session(session);
        if (!user) break;

        // Sync status
        let newStatus: SubscriptionStatus = SubscriptionStatus.ACTIVE;
        if (
          subscription.status === "past_due" ||
          subscription.status === "unpaid"
        ) {
          newStatus = SubscriptionStatus.GRACE_PERIOD;
        } else if (
          subscription.status === "canceled" ||
          subscription.status === "incomplete_expired"
        ) {
          newStatus = SubscriptionStatus.EXPIRED;
        }

        user.subscriptionStatus = newStatus;
        user.subscriptionExpiry = new Date(
          subscription.current_period_end * 1000
        );
        user.autoRenewEnabled = !subscription.cancel_at_period_end;

        // Handle scheduled downgrades or immediate upgrades
        const targetTier = subscription.metadata.targetTier as MembershipTier;
        if (targetTier && (subscription.status === "active" || subscription.status === "trialing")) {
          const tierPriority: Record<string, number> = {
            [MembershipTier.GUEST]: 0,
            [MembershipTier.REGULAR]: 1,
            [MembershipTier.VIP]: 2,
          };
          const currentTierPriority = tierPriority[user.membershipTier] || 0;
          const targetTierPriority = tierPriority[targetTier] || 0;

          // If current tier is guest, or target is higher (upgrade), or it's an update for the same tier
          if (user.membershipTier === MembershipTier.GUEST || targetTierPriority > currentTierPriority || subscription.metadata.isUpdate === "true") {
            user.membershipTier = targetTier;
            user.stripeSubscriptionId = subscription.id;
            user.pendingMembershipTier = undefined;
            logger.info(
              `[Webhook] Membership tier updated via subscription.updated: ${user.email} -> ${targetTier}`
            );
          }
        }

        await user.save({ session });

        // Notify User of Status Update
        const title = "Membership Updated";
        const body = `Your membership status is now ${newStatus.toUpperCase()} (${user.membershipTier.toUpperCase()}).`;
        
        emitRealTimeNotification(userId, title, body, { tier: user.membershipTier, status: newStatus });
        
        if (user.fcmToken) {
          await enqueuePushNotification(user._id.toString(), title, body, { type: "membership_update" });
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        if (!userId) break;

        const user = await User.findById(userId).session(session);
        if (user) {
          user.membershipTier = MembershipTier.GUEST;
          user.subscriptionStatus = SubscriptionStatus.EXPIRED;
          user.stripeSubscriptionId = undefined;
          await user.save({ session });

          await AuditLog.create(
            [
              {
                entityType: EntityType.USER,
                entityId: user._id,
                action: AuditAction.SUBSCRIPTION_EXPIRY,
                metadata: { subscriptionId: subscription.id },
              },
            ],
            { session }
          );

          await Notification.create(
            [
              {
                userId: user._id,
                title: "Membership Expired",
                message:
                  "Your PoolPay membership has expired. You have been returned to GUEST status.",
                type: NotificationType.PAYMENT_FAILED,
              },
            ],
            { session }
          );

          // Real-time & Push
          const title = "Membership Expired";
          const body = "Your PoolPay membership has expired and you have been returned to GUEST status.";
          
          emitRealTimeNotification(user._id.toString(), title, body);
          if (user.fcmToken) {
            await enqueuePushNotification(user._id.toString(), title, body, { type: "membership_expired" });
          }
          
          await enqueueEmailNotification(user.email, "Membership Expired", "adminAlert", { message: body });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          let userId =
            invoice.subscription_details?.metadata?.userId ||
            invoice.metadata?.userId;
          
          let targetTier = (invoice.subscription_details?.metadata?.targetTier || invoice.metadata?.targetTier) as MembershipTier;

          // Fallback: If metadata is missing from invoice, fetch the subscription
          if (!userId || !targetTier) {
             const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
             userId = userId || subscription.metadata.userId;
             targetTier = targetTier || (subscription.metadata.targetTier as MembershipTier);
          }

          if (userId) {
            const user = await User.findById(userId).session(session);
            if (user) {
              user.subscriptionStatus = SubscriptionStatus.ACTIVE;
              user.lastBillingDate = new Date();
              user.stripeSubscriptionId = invoice.subscription as string;

              // If membershipTier is still GUEST, it means this is a new direct subscription activation
              if (user.membershipTier === MembershipTier.GUEST && targetTier) {
                user.membershipTier = targetTier;
                user.membershipStartedAt = new Date();
                logger.info(`[Webhook] New membership activated via invoice.succeeded: ${user.email} -> ${targetTier}`);
              }

              // Apply scheduled downgrades on successful renewal
              if (user.pendingMembershipTier) {
                logger.info(
                  `[Webhook] Applying scheduled downgrade for ${user.email} to ${user.pendingMembershipTier}`
                );
                user.membershipTier = user.pendingMembershipTier;
                user.pendingMembershipTier = undefined;
              }


              await user.save({ session });

              // Notify User - Receipt & Real-time
              const amount = invoice.amount_paid / 100;
              const currency = invoice.currency.toUpperCase();
              const title = "Membership Payment Successful";
              const body = `Your payment of ${amount} ${currency} for your ${user.membershipTier.toUpperCase()} membership was successful.`;
              
              emitRealTimeNotification(userId, title, body, { subscriptionId: invoice.subscription });

              if (user.fcmToken) {
                await enqueuePushNotification(userId, title, body, { type: "membership_success" });
              }

              // Generate PDF Receipt
              const pdfBuffer = await generateReceiptPDF({
                userName: user.fullName,
                userEmail: user.email,
                amount: `${amount} ${currency}`,
                tier: user.membershipTier,
                transactionId: invoice.id,
                date: new Date().toLocaleDateString(),
              });

              // Email Receipt with Attachment
              await enqueueEmailNotification(
                user.email,
                "Membership Payment Receipt",
                "invoice",
                {
                  name: user.fullName,
                  amount: `${amount} ${currency}`,
                  paymentId: invoice.id,
                },
                [
                  {
                    filename: `PoolPay_Receipt_${invoice.id}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                  },
                ]
              );
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          let userId =
            invoice.subscription_details?.metadata?.userId ||
            invoice.metadata?.userId;

          // Fallback: If metadata is missing from invoice, fetch the subscription
          if (!userId) {
             const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
             userId = subscription.metadata.userId;
          }

          if (userId) {
            const user = await User.findById(userId).session(session);
            if (user) {
              user.subscriptionStatus = SubscriptionStatus.GRACE_PERIOD;
              // Set grace period expiry (e.g., 7 days from now if not already set)
              if (!user.gracePeriodUntil) {
                const settings = await Settings.findOne();
                const days = settings?.gracePeriodDays || 7;
                user.gracePeriodUntil = new Date(
                  Date.now() + days * 24 * 60 * 60 * 1000
                );
              }
              await user.save({ session });

              const title = "Membership Payment Failed";
              const message = "Your membership renewal payment failed. You are now in a grace period.";
              await Notification.create(
                [
                  {
                    userId: user._id,
                    title,
                    message,
                    type: NotificationType.PAYMENT_FAILED,
                  },
                ],
                { session }
              );
              emitRealTimeNotification(user._id.toString(), title, message);
              enqueuePushNotification(user._id.toString(), title, message);
            }
          }
        }
        break;
      }

      default:
        logger.info(`[Webhook] Unhandled event type ${event.type}`);
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    logger.error(`[Webhook] Error processing event ${event?.type}:`, error);
    throw error;
  } finally {
    session.endSession();
  }

  return { received: true };
};

export const WebhookServices = {
  handleStripeWebhook,
};
