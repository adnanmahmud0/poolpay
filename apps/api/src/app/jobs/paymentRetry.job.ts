import { Worker } from "bullmq";
import { bullMqRedis } from "../config/ioredis.config";
import { Payment, PaymentStatus } from "../modules/payment/payment.model";
import { PaymentMethod } from "../modules/paymentMethod/paymentMethod.model";
import { stripe } from "../config/stripe.config";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "../modules/transaction/transaction.model";
import { Revenue, FeeType } from "../modules/revenue/revenue.model";
import { Settings } from "../modules/settings/settings.model";
import { GroupMember } from "../modules/groupMember/groupMember.model";
import logger from "../utils/logger";
import {
  sendPushNotification,
  sendEmailNotification,
  emitRealTimeNotification
} from "../utils/notification.utils";
import { alertPaymentFailure } from "../utils/alerting";
import { withTransaction } from "../utils/transaction.utils";

const getSystemSettings = async () => {
  const settings = await Settings.findOne();
  return {
    transactionFeePercent: settings?.transactionFeePercent || 5,
    lateFeePercent: settings?.lateFeePercent || 3,
    maxRetryCount: settings?.maxRetryCount || 3,
  };
};

import { User } from "../modules/user/user.model";
import { UserStatus } from "../modules/user/user.interface";

logger.info("[PAYMENT_FLOW] Payment Retry Job module initialized");

export const paymentWorker = new Worker(
  "paymentQueue",
  async (job) => {
    logger.info(
      `[PAYMENT_FLOW] Worker received job ${job.id} for payment ${job.data.paymentId}`
    );
    const { paymentId } = job.data;

    const payment = await Payment.findOneAndUpdate(
      { _id: paymentId, status: { $in: [PaymentStatus.PENDING, PaymentStatus.FAILED] } },
      { $set: { status: PaymentStatus.PROCESSING } },
      { new: true }
    );

    if (!payment) {
      logger.info(`[PAYMENT_FLOW] Payment ${paymentId} is already processing, paid, or not found. Skipping.`);
      return;
    }

    const user = await User.findById(payment.userId);
    if (user?.status === UserStatus.SUSPENDED) {
      throw new Error(
        `User ${user.email} is suspended. Contribution payment cancelled.`
      );
    }

    const settings = await getSystemSettings();
    const paymentMethod = await PaymentMethod.findOne({
      userId: payment.userId,
      isDefault: true,
    });

    if (!paymentMethod) {
      payment.status = PaymentStatus.FAILED;
      await payment.save();
      throw new Error("No default payment method found");
    }

    logger.info(
      `[PAYMENT_FLOW] Starting payment processing for job ${job.id}, payment ${paymentId}`
    );

    try {
      // Execute Stripe Charge across all supported payment method types
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: Math.round(payment.amount * 100), // Stripe expects cents
          currency: "usd",
          customer: paymentMethod.stripeCustomerId,
          payment_method: paymentMethod.paymentMethodId,
          off_session: true, // AutoPay
          confirm: true,
        },
        {
          idempotencyKey: `payment_${payment._id}`,
        }
      );

      // Save Stripe ID immediately if available
      if (paymentIntent.id) {
        payment.stripePaymentIntentId = paymentIntent.id;
        await payment.save();
      }

      if (paymentIntent.status === "succeeded") {
        await withTransaction(async (session) => {
          await Payment.findByIdAndUpdate(
            paymentId,
            {
              $set: {
                status: PaymentStatus.PAID,
                paidDate: new Date(),
                stripePaymentIntentId: paymentIntent.id,
                recoveryAttempts: 0,
              },
            },
            { new: true, session: session || undefined }
          );

          // Log transaction
          const transaction = await Transaction.create(
            [
              {
                userId: payment.userId,
                groupId: payment.groupId,
                paymentMethodId: paymentMethod._id,
                type: TransactionType.CONTRIBUTION,
                amount: payment.amount,
                fee: payment.fee,
                platformFee: payment.fee,
                platformFeePercent: settings.transactionFeePercent,
                stripeFee: Math.round((payment.amount * 0.029 + 0.30) * 100) / 100,
                stripeFeePercent: 2.9,
                netAmount: payment.netAmount,
                status: TransactionStatus.SUCCESS,
                referenceId: paymentIntent.id,
              },
            ],
            session ? { session } : undefined
          );

          // Log Revenue
          await Revenue.create(
            [
              {
                transactionId: transaction[0]._id,
                amount: payment.fee,
                feeType: FeeType.TRANSACTION_FEE,
              },
            ],
            session ? { session } : undefined
          );

          // STEP 6: Reset Notice Status & Update Stats after successful payment
          await GroupMember.findOneAndUpdate(
            { groupId: payment.groupId, userId: payment.userId },
            {
              noticeStatus: "NONE",
              $inc: { totalPaidAmount: payment.amount },
            },
            { session: session || undefined }
          );

          logger.info(
            `[PAYMENT_FLOW] Payment database updates committed for user ${user?.email}.`
          );
        });

          // Notifications (Outside Transaction)
          if (user?.fcmToken) {
            await sendPushNotification(
              user.fcmToken,
              "Payment Successful",
              "Thank you for your contribution.",
              undefined,
              user._id.toString()
            );
          }

          // Real-time
          emitRealTimeNotification(
            user?._id.toString() || "",
            "Payment Successful",
            "Thank you for your contribution."
          );

          await sendEmailNotification(
            user?.email || "",
            "Payment Confirmation",
            "invoice",
            {
              name: user?.firstName ? `${user.firstName} ${user.lastName}`.trim() : "Member",
              amount: payment.amount.toString(),
              paymentId: paymentIntent.id,
            }
          );
      } else if (paymentIntent.status === "processing") {
        // ACH or other async payment methods
        payment.status = PaymentStatus.PROCESSING;
        await payment.save();
        logger.info(
          `[PAYMENT_FLOW] Payment ${paymentIntent.id} is processing (async).`
        );
      } else {
        throw new Error(
          `Payment intent failed with status: ${paymentIntent.status}`
        );
      }
    } catch (error) {
      // Payment Failed Logic
      logger.error(
        `[PAYMENT_FLOW] Payment failed for user ${user?.email}:`,
        error
      );

      payment.retryCount += 1;

      if (payment.retryCount >= settings.maxRetryCount) {
        payment.status = PaymentStatus.LATE;
        payment.lateFee = (payment.amount * settings.lateFeePercent) / 100;
      } else {
        payment.status = PaymentStatus.FAILED;
      }

      await payment.save();
      throw error; // Let BullMQ know it failed
    }
  },
  { 
    connection: bullMqRedis, 
    concurrency: 5,
    stalledInterval: 600000,
    lockDuration: 600000,
    drainDelay: 300000,
  }
);

paymentWorker.on("completed", (job) => {
  logger.info(`✅ [PAYMENT_FLOW] Payment job ${job.id} has completed!`);
});

paymentWorker.on("failed", (job, err) => {
  logger.error(
    `❌ [PAYMENT_FLOW] Payment job ${job?.id} has failed with ${err.message}`
  );
  if (job?.data?.paymentId) {
    alertPaymentFailure(job.data.paymentId, err.message);
  }
});
