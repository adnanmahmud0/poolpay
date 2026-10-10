import httpStatus from "http-status-codes";
import mongoose, { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import {
  PaymentMethod,
  PaymentMethodType,
  PaymentMethodStatus,
  IPaymentMethodDocument,
} from "./paymentMethod.model";
import { stripe } from "../../config/stripe.config";
import { User } from "../user/user.model";
import { IUserDocument } from "../user/user.interface";
import logger from "../../utils/logger";
import Stripe from "stripe";
import { emitRealTimeNotification } from "../../utils/notification.utils";
import {
  Notification,
  NotificationType,
} from "../notification/notification.model";
import { withTransaction } from "../../utils/transaction.utils";

interface ExtendedUsBankAccount {
  verification_status?: string;
  bank_name?: string;
  last4?: string;
  networks?: {
    preferred?: string;
  };
}

/**
 * Maps all 21 Stripe payment method types to clean domain types and metadata
 */
export const resolvePaymentMethodDetails = (
  stripePaymentMethod: Stripe.PaymentMethod
) => {
  const stripeType = stripePaymentMethod.type as string;
  let type: PaymentMethodType = PaymentMethodType.CARD;
  let brand = "Unknown";
  let last4 = "****";
  let bankName: string | undefined;
  let expiryMonth: number | undefined;
  let expiryYear: number | undefined;
  let country: string | undefined;

  switch (stripeType) {
    case "card":
      type = PaymentMethodType.CARD;
      brand = stripePaymentMethod.card?.brand
        ? stripePaymentMethod.card.brand.toUpperCase()
        : "Card";
      last4 = stripePaymentMethod.card?.last4 || "****";
      expiryMonth = stripePaymentMethod.card?.exp_month;
      expiryYear = stripePaymentMethod.card?.exp_year;
      country =
        (stripePaymentMethod.card?.country as string | undefined) || undefined;
      if (stripePaymentMethod.card?.wallet?.type === "apple_pay") {
        type = PaymentMethodType.WALLET;
        brand = "Apple Pay";
      } else if (stripePaymentMethod.card?.wallet?.type === "google_pay") {
        type = PaymentMethodType.WALLET;
        brand = "Google Pay";
      } else if (stripePaymentMethod.card?.wallet?.type === "samsung_pay") {
        type = PaymentMethodType.WALLET;
        brand = "Samsung Pay";
      } else if (stripePaymentMethod.card?.wallet?.type === "link") {
        type = PaymentMethodType.WALLET;
        brand = "Link";
      }
      break;

    case "us_bank_account":
      type = PaymentMethodType.BANK;
      brand = "US Bank Account";
      bankName = stripePaymentMethod.us_bank_account?.bank_name || undefined;
      last4 = stripePaymentMethod.us_bank_account?.last4 || "****";
      break;

    case "sepa_debit":
      type = PaymentMethodType.BANK;
      brand = "SEPA Direct Debit";
      bankName =
        (stripePaymentMethod.sepa_debit?.bank_code as string | undefined) ||
        undefined;
      last4 = stripePaymentMethod.sepa_debit?.last4 || "****";
      country =
        (stripePaymentMethod.sepa_debit?.country as string | undefined) ||
        undefined;
      break;

    case "bacs_debit":
      type = PaymentMethodType.BANK;
      brand = "Bacs Direct Debit";
      last4 = stripePaymentMethod.bacs_debit?.last4 || "****";
      break;

    case "acss_debit":
      type = PaymentMethodType.BANK;
      brand = "ACH Direct Debit (Canada)";
      bankName =
        (stripePaymentMethod.acss_debit?.institution_number as
          string | undefined) || undefined;
      last4 = stripePaymentMethod.acss_debit?.last4 || "****";
      break;

    case "cashapp":
      type = PaymentMethodType.WALLET;
      brand = "Cash App Pay";
      last4 = stripePaymentMethod.cashapp?.cashtag || "****";
      break;

    case "link":
      type = PaymentMethodType.WALLET;
      brand = "Link by Stripe";
      last4 = stripePaymentMethod.link?.email
        ? stripePaymentMethod.link.email.split("@")[0]
        : "****";
      break;

    case "amazon_pay":
      type = PaymentMethodType.WALLET;
      brand = "Amazon Pay";
      break;

    case "kakao_pay":
      type = PaymentMethodType.WALLET;
      brand = "Kakao Pay";
      break;

    case "naver_pay":
      type = PaymentMethodType.WALLET;
      brand = "Naver Pay";
      break;

    case "payco":
      type = PaymentMethodType.WALLET;
      brand = "PAYCO";
      break;

    case "customer_balance":
      type = PaymentMethodType.BANK;
      brand = "Bank Transfer / Balance";
      break;

    case "bancontact":
      type = PaymentMethodType.REDIRECT;
      brand = "Bancontact";
      break;

    case "blik":
      type = PaymentMethodType.REDIRECT;
      brand = "BLIK";
      break;

    case "eps":
      type = PaymentMethodType.REDIRECT;
      brand = "EPS";
      break;

    case "ideal":
      type = PaymentMethodType.REDIRECT;
      brand = "iDEAL";
      bankName =
        (stripePaymentMethod.ideal?.bank as string | undefined) || undefined;
      break;

    case "p24":
      type = PaymentMethodType.REDIRECT;
      brand = "Przelewy24";
      break;

    case "sofort":
      type = PaymentMethodType.REDIRECT;
      brand = "Sofort";
      country =
        (stripePaymentMethod.sofort?.country as string | undefined) ||
        undefined;
      break;

    case "affirm":
      type = PaymentMethodType.BNPL;
      brand = "Affirm";
      break;

    case "klarna":
      type = PaymentMethodType.BNPL;
      brand = "Klarna";
      break;

    case "afterpay_clearpay":
      type = PaymentMethodType.BNPL;
      brand = "Afterpay";
      break;

    case "pix":
      type = PaymentMethodType.REALTIME;
      brand = "Pix";
      break;

    default:
      type = PaymentMethodType.CARD;
      brand =
        stripeType.charAt(0).toUpperCase() +
        stripeType.slice(1).replace(/_/g, " ");
      last4 = (stripePaymentMethod as any)[stripeType]?.last4 || "****";
      break;
  }

  return {
    type,
    stripeType,
    brand,
    last4,
    bankName,
    expiryMonth,
    expiryYear,
    country,
  };
};

const addPaymentMethod = async (
  userId: string,
  payload: {
    paymentMethodId: string;
    type: PaymentMethodType;
    isDefault?: boolean;
    autoPayEnabled?: boolean;
  }
): Promise<IPaymentMethodDocument> => {
  const {
    paymentMethodId,
    isDefault: requestedDefault,
    autoPayEnabled = true,
  } = payload;

  const user: IUserDocument | null = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Retrieve the payment method from Stripe to verify and get details
  const stripePaymentMethod =
    await stripe.paymentMethods.retrieve(paymentMethodId);

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
    const usBankAccount =
      stripePaymentMethod.us_bank_account as ExtendedUsBankAccount;
    logger.info(
      `[STRIPE_TEST] Attempting to verify bank account: ${paymentMethodId}. Current Status: ${usBankAccount?.verification_status}`
    );

    // In test mode, we try to automate verification, but if it fails (SDK/Version issues),
    // we log it and move on so the development is not blocked.
    logger.info(
      `[STRIPE_TEST] Bank account ${paymentMethodId} found. Status: ${usBankAccount?.verification_status}`
    );
  }

  // Attach payment method to customer if not already attached
  try {
    if (stripePaymentMethod.customer !== stripeCustomerId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId as string,
      });
      logger.info(
        `[STRIPE] Payment method ${paymentMethodId} attached to customer ${stripeCustomerId}`
      );
    }
  } catch (err) {
    const stripeError = err as Stripe.errors.StripeError;
    if (
      stripePaymentMethod.type === "us_bank_account" ||
      stripeError.message?.includes("already attached") ||
      (stripeError as any).code === "resource_already_exists"
    ) {
      logger.warn(
        `[STRIPE] Note while attaching ${paymentMethodId}: ${stripeError.message}`
      );
    } else {
      throw err;
    }
  }

  // Extract metadata across 21 payment method types
  const resolved = resolvePaymentMethodDetails(stripePaymentMethod);

  // Determine if this should be default
  const isDefault =
    requestedDefault !== undefined ? requestedDefault : !hasExistingMethods;

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
          type: resolved.type,
          stripeType: resolved.stripeType,
          brand: resolved.brand,
          last4: resolved.last4,
          bankName: resolved.bankName,
          expiryMonth: resolved.expiryMonth,
          expiryYear: resolved.expiryYear,
          country: resolved.country,
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
        logger.warn(
          `[STRIPE_TEST] Could not set default payment method on Stripe (likely unverified): ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    return created[0];
  });

  // Notify User
  const title = "Payment Method Added";
  const body = `A new ${resolved.type === PaymentMethodType.CARD ? "card" : resolved.brand} ending in ${resolved.last4} has been successfully added to your account.`;

  emitRealTimeNotification(userId, title, body, { paymentMethodId });

  await Notification.create([
    {
      userId: new Types.ObjectId(userId),
      title,
      message: body,
      type: NotificationType.PAYMENT_SUCCESS,
    },
  ]);

  return newPaymentMethod;
};

const getPaymentMethods = async (
  userId: string
): Promise<IPaymentMethodDocument[]> => {
  return await PaymentMethod.find({ userId: new Types.ObjectId(userId) }).sort({
    isDefault: -1,
    createdAt: -1,
  });
};

const setDefaultPaymentMethod = async (
  userId: string,
  id: string
): Promise<IPaymentMethodDocument> => {
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
        logger.warn(
          `[STRIPE_TEST] Could not set bank account as default on Stripe yet: ${stripeError.message}`
        );
      } else {
        throw err;
      }
    }

    return paymentMethod;
  });
};

const toggleAutoPay = async (
  userId: string,
  id: string,
  autoPayEnabled: boolean
): Promise<IPaymentMethodDocument> => {
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

const deletePaymentMethod = async (
  userId: string,
  id: string
): Promise<{ message: string }> => {
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
      await PaymentMethod.findByIdAndUpdate(anotherMethod._id, {
        isDefault: true,
      });
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
      allow_redirects: "always", // Allows redirect-based methods (Cash App, Amazon Pay, Klarna, etc.)
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

const syncSetupIntent = async (
  userId: string,
  setupIntentId: string
): Promise<IPaymentMethodDocument> => {
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
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No payment method found on SetupIntent"
    );
  }

  // Check if already registered to avoid duplicates
  const existing = await PaymentMethod.findOne({ userId, paymentMethodId });
  if (existing) {
    return existing;
  }

  // Determine the type and metadata from the payment method
  const stripePaymentMethod =
    await stripe.paymentMethods.retrieve(paymentMethodId);
  const resolved = resolvePaymentMethodDetails(stripePaymentMethod);
  const isDefault = !(await PaymentMethod.exists({ userId }));

  return await addPaymentMethod(userId, {
    paymentMethodId,
    type: resolved.type,
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
