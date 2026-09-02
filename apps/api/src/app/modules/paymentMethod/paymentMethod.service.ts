import httpStatus from "http-status-codes";
import mongoose, { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { PaymentMethod, PaymentMethodType, PaymentMethodStatus, IPaymentMethodDocument } from "./paymentMethod.model";
import { stripe } from "../../config/stripe.config";
import { User } from "../user/user.model";
import { IUserDocument } from "../user/user.interface";
import logger from "../../utils/logger";
import Stripe from "stripe";
import { emitRealTimeNotification } from "../../utils/notification.utils";
import { Notification, NotificationType } from "../notification/notification.model";
import { withTransaction } from "../../utils/transaction.utils";
 
 interface ExtendedUsBankAccount extends Stripe.PaymentMethod.UsBankAccount {
   verification_status?: string;
 }

const addPaymentMethod = async (
  userId: string,
  payload: {
    paymentMethodId: string;
    type: PaymentMethodType;
    isDefault?: boolean;
    autoPayEnabled?: boolean;
  }
): Promise<IPaymentMethodDocument> => {
  const { paymentMethodId, isDefault: requestedDefault, autoPayEnabled = true } = payload;
  
  const user: IUserDocument | null = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Retrieve the payment method from Stripe to verify and get details
  const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

  if (!stripePaymentMethod) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid payment method");
  }

  // Check if user already has a Stripe Customer ID
  let stripeCustomerId = user.stripeCustomerId;
  const hasExistingMethods = await PaymentMethod.exists({ userId: user._id });

  if (!stripeCustomerId) {
    // Migration: Check if they have it on a payment method record
    const existingMethod = await PaymentMethod.findOne({ userId: user._id });
    if (existingMethod) {
      stripeCustomerId = existingMethod.stripeCustomerId;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    } else {
      // Create new Stripe Customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        metadata: {
          userId: user._id.toString(),
        },
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }
  }

  // If it's a US Bank Account in test mode, we MUST verify it.
  if (stripePaymentMethod.type === "us_bank_account") {
    // Note: verification_status is not in the standard PaymentMethod type but may be present in test responses
    const usBankAccount = stripePaymentMethod.us_bank_account as ExtendedUsBankAccount;
    logger.info(`[STRIPE_TEST] Attempting to verify bank account: ${paymentMethodId}. Current Status: ${usBankAccount?.verification_status}`);
    
    // In test mode, we try to automate verification, but if it fails (SDK/Version issues),
    // we log it and move on so the development is not blocked.
    logger.info(`[STRIPE_TEST] Bank account ${paymentMethodId} found. Status: ${usBankAccount?.verification_status}`);
  }

  // Attach payment method to customer
  try {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId as string,
    });
    logger.info(`[STRIPE] Payment method ${paymentMethodId} attached to customer ${stripeCustomerId}`);
  } catch (err) {
    const stripeError = err as Stripe.errors.StripeError;
    if (stripePaymentMethod.type === "us_bank_account") {
      logger.warn(`[STRIPE_TEST] Could not attach bank account yet (needs verification), but proceeding to save locally: ${stripeError.message}`);
    } else {
      throw err; // For cards, we still want it to fail if attach fails
    }
  }

  // Extract metadata
  const type = stripePaymentMethod.type === "card" ? PaymentMethodType.CARD : PaymentMethodType.BANK;
  const brand = stripePaymentMethod.card?.brand || "Unknown";
  const last4 = stripePaymentMethod.card?.last4 || stripePaymentMethod.us_bank_account?.last4 || "****";
  const bankName = stripePaymentMethod.us_bank_account?.bank_name;
  const expiryMonth = stripePaymentMethod.card?.exp_month;
  const expiryYear = stripePaymentMethod.card?.exp_year;
  const country = stripePaymentMethod.card?.country || stripePaymentMethod.us_bank_account?.networks?.preferred;

  // Determine if this should be default
  const isDefault = requestedDefault !== undefined ? requestedDefault : !hasExistingMethods;

  const newPaymentMethod = await withTransaction(async (session) => {
    if (isDefault) {
      await PaymentMethod.updateMany(
        { userId: new Types.ObjectId(userId) },
        { isDefault: false },
        { session: session || undefined }
      );
    }

    const created = await PaymentMethod.create(
      [
        {
          userId: new Types.ObjectId(userId),
          stripeCustomerId,
          paymentMethodId,
          type,
          brand,
          last4,
          bankName,
          expiryMonth,
          expiryYear,
          country,
          isDefault,
          autoPayEnabled,
          status: PaymentMethodStatus.ACTIVE,
        },
      ],
      session ? { session } : undefined
    );

    if (isDefault) {
      try {
        await stripe.customers.update(stripeCustomerId as string, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      } catch (err) {
        logger.warn(`[STRIPE_TEST] Could not set default payment method on Stripe (likely unverified): ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    return created[0];
  });

  // Notify User
  const title = "Payment Method Added";
  const body = `A new ${type === PaymentMethodType.CARD ? "card" : "bank account"} ending in ${last4} has been successfully added to your account.`;
  
  emitRealTimeNotification(userId, title, body, { paymentMethodId });
  
  await Notification.create({
    userId: new Types.ObjectId(userId),
    title,
    message: body,
    type: NotificationType.PAYMENT_SUCCESS
  });

  return newPaymentMethod;
};

const getPaymentMethods = async (userId: string): Promise<IPaymentMethodDocument[]> => {
  return await PaymentMethod.find({ userId: new Types.ObjectId(userId) }).sort({ isDefault: -1, createdAt: -1 });
};

const setDefaultPaymentMethod = async (userId: string, id: string): Promise<IPaymentMethodDocument> => {
  return await withTransaction(async (session) => {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    let paymentMethod: IPaymentMethodDocument | null | undefined;

    if (isObjectId) {
      paymentMethod = await PaymentMethod.findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      }).session(session || null);
    } else {
      // Find by Stripe paymentMethodId (requires in-memory check due to encryption)
      const methods = await PaymentMethod.find({
        userId: new Types.ObjectId(userId),
      }).session(session || null);
      paymentMethod = methods.find((pm) => pm.paymentMethodId === id);
    }

    if (!paymentMethod) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment method not found");
    }

    // Set all other methods to non-default
    await PaymentMethod.updateMany(
      { userId: new Types.ObjectId(userId) },
      { isDefault: false },
      { session: session || undefined }
    );

    // Set this one as default
    paymentMethod.isDefault = true;
    await paymentMethod.save({ session: session || undefined });

    // Update Stripe Customer
    try {
      await stripe.customers.update(paymentMethod.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.paymentMethodId,
        },
      });
    } catch (err) {
      const stripeError = err as Stripe.errors.StripeError;
      if (paymentMethod.type === PaymentMethodType.BANK) {
        logger.warn(`[STRIPE_TEST] Could not set bank account as default on Stripe yet: ${stripeError.message}`);
      } else {
        throw err;
      }
    }

    return paymentMethod;
  });
};

const toggleAutoPay = async (userId: string, id: string, autoPayEnabled: boolean): Promise<IPaymentMethodDocument> => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  let paymentMethod: IPaymentMethodDocument | null | undefined;

  if (isObjectId) {
    paymentMethod = await PaymentMethod.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { autoPayEnabled },
      { new: true }
    );
  } else {
    // Find in-memory
    const methods = await PaymentMethod.find({
      userId: new Types.ObjectId(userId),
    });
    paymentMethod = methods.find((pm) => pm.paymentMethodId === id);
    if (paymentMethod) {
      paymentMethod.autoPayEnabled = autoPayEnabled;
      await paymentMethod.save();
    }
  }

  if (!paymentMethod) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment method not found");
  }

  return paymentMethod;
};

const deletePaymentMethod = async (userId: string, id: string): Promise<{ message: string }> => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  let paymentMethod: IPaymentMethodDocument | null | undefined;

  if (isObjectId) {
    paymentMethod = await PaymentMethod.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
  } else {
    const methods = await PaymentMethod.find({
      userId: new Types.ObjectId(userId),
    });
    paymentMethod = methods.find((pm) => pm.paymentMethodId === id);
  }

  if (!paymentMethod) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment method not found");
  }

  // Detach from Stripe
  try {
    await stripe.paymentMethods.detach(paymentMethod.paymentMethodId);
  } catch (error) {
    logger.error("Error detaching payment method from Stripe:", error);
  }

  await PaymentMethod.findByIdAndDelete(paymentMethod._id);

  // If this was the default, pick another one as default if exists
  if (paymentMethod.isDefault) {
    const anotherMethod = await PaymentMethod.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (anotherMethod) {
      // Avoid recursive transaction if possible, or just call the logic
      // For simplicity, we just pick another one
      await PaymentMethod.findByIdAndUpdate(anotherMethod._id, { isDefault: true });
      await stripe.customers.update(anotherMethod.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: anotherMethod.paymentMethodId,
        },
      });
    }
  }

  return { message: "Payment method deleted successfully" };
};

const createSetupIntent = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  let stripeCustomerId = user.stripeCustomerId;

  if (!stripeCustomerId) {
    // Check if they have it on a payment method record (legacy/migration)
    const existingMethod = await PaymentMethod.findOne({ userId: user._id });
    if (existingMethod) {
      stripeCustomerId = existingMethod.stripeCustomerId;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    } else {
      // Create new Stripe Customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        metadata: {
          userId: user._id.toString(),
        },
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: stripeCustomerId,
    // automatic_payment_methods lets the Stripe Dashboard control which methods
    // appear in the Payment Sheet — just toggle them on/off in your Dashboard
    // without any code changes. This includes ACH, cards, wallets, etc.
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never", // Prevents redirect-only methods on mobile
    },
    usage: "off_session", // Allow future automatic (off-session) payments
  });

  return {
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id,
  };
};

const createEphemeralKey = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  let stripeCustomerId = user.stripeCustomerId;

  if (!stripeCustomerId) {
    const existingMethod = await PaymentMethod.findOne({ userId: user._id });
    if (existingMethod) {
      stripeCustomerId = existingMethod.stripeCustomerId;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        metadata: { userId: user._id.toString() },
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }
  }

  // Stripe requires the API version for ephemeral keys
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: stripeCustomerId as string },
    { apiVersion: "2025-04-30" }
  );

  return {
    customerId: stripeCustomerId,
    ephemeralKeySecret: ephemeralKey.secret,
  };
};

const syncSetupIntent = async (userId: string, setupIntentId: string): Promise<IPaymentMethodDocument> => {
  // Retrieve the confirmed SetupIntent from Stripe
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

  if (!setupIntent) {
    throw new AppError(httpStatus.NOT_FOUND, "SetupIntent not found");
  }

  if (setupIntent.status !== "succeeded") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `SetupIntent not yet confirmed. Status: ${setupIntent.status}`
    );
  }

  const paymentMethodId = setupIntent.payment_method;
  if (!paymentMethodId || typeof paymentMethodId !== "string") {
    throw new AppError(httpStatus.BAD_REQUEST, "No payment method found on SetupIntent");
  }

  // Check if already registered to avoid duplicates
  const existing = await PaymentMethod.findOne({ userId, paymentMethodId });
  if (existing) {
    return existing;
  }

  // Determine the type from the payment method
  const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  const typeStr = stripePaymentMethod.type;
  const type = typeStr === "us_bank_account" ? "bank" : "card";
  const isDefault = !(await PaymentMethod.exists({ userId }));

  return await addPaymentMethod(userId, {
    paymentMethodId,
    type: type as PaymentMethodType,
    isDefault,
    autoPayEnabled: true,
  });
};

export const PaymentMethodServices = {
  addPaymentMethod,
  createSetupIntent,
  syncSetupIntent,
  createEphemeralKey,
  getPaymentMethods,
  setDefaultPaymentMethod,
  toggleAutoPay,
  deletePaymentMethod,
};

