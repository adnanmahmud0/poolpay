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
import { logActivity } from "../../utils/activityLogger";
import { Payout, PayoutStatus } from "../payout/payout.model";
import { Turn } from "../turn/turn.model";
import { TurnStatus } from "../turn/turn.interface";
import { User } from "../user/user.model";
import { Stripe } from "stripe";
import { AuditLog, AuditAction, EntityType } from "../auditLog/auditLog.model";
import { 
  enqueuePushNotification, 
  emitRealTimeNotification 
} from "../../utils/notification.utils";
import { withTransaction } from "../../utils/transaction.utils";

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
      if (envVars.STRIPE?.CONNECT_WEBHOOK_SECRET) {
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
  } catch (err: unknown) {
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

  return await withTransaction(async (session) => {
    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const payment = await Payment.findOneAndUpdate(
          {
            stripePaymentIntentId: paymentIntent.id,
            status: { $ne: PaymentStatus.PAID },
          },
          {
            status: PaymentStatus.PAID,
            paidDate: new Date(),
          },
          { new: true, session: session || undefined }
        );

        if (!payment) {
          logger.info(
            `[Webhook] Payment ${paymentIntent.id} already processed or not found.`
          );
          return { received: true };
        }

        const transaction = await Transaction.findOneAndUpdate(
          {
            referenceId: paymentIntent.id,
            status: { $ne: TransactionStatus.SUCCESS },
          },
          { status: TransactionStatus.SUCCESS },
          { new: true, session: session || undefined }
        );

        if (transaction) {
          // Update group pool amount
          await Group.findByIdAndUpdate(
            transaction.groupId,
            { $inc: { poolAmount: transaction.amount } },
            { session: session || undefined }
          );

          const group = await Group.findById(transaction.groupId).session(
            session || null
          );

          await Notification.create([{
            userId: payment.userId,
            title: "Payment Succeeded",
            message: `Your payment of $${payment.amount} for group ${group?.name || ""} was successful.`,
            type: NotificationType.PAYMENT_SUCCESS,
          }], session ? { session } : undefined);

          // Push Notifications
          const title = "Payment Successful";
          const message = `Your payment of $${transaction.amount} for ${group?.name || "the group"} was successful.`;
          emitRealTimeNotification(transaction.userId.toString(), title, message);
          enqueuePushNotification(transaction.userId.toString(), title, message);

          logger.info(
            `[Audit] Payment Succeeded: User ${transaction.userId}, Amount ${transaction.amount}, Intent ${paymentIntent.id}`
          );

          await logActivity(
            transaction.userId,
            "PAYMENT_SUCCESS",
            `Payment of ${transaction.amount} succeeded for group ${transaction.groupId}. Stripe ID: ${paymentIntent.id}`,
            session
          );
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Idempotency check: verify if already failed atomically
        const payment = await Payment.findOneAndUpdate(
          {
            stripePaymentIntentId: paymentIntent.id,
            status: { $ne: PaymentStatus.FAILED },
          },
          {
            status: PaymentStatus.FAILED,
          },
          { new: true, session: session || undefined }
        );

        if (!payment) {
          logger.info(
            `[Webhook] Payment failure for ${paymentIntent.id} already processed or not found.`
          );
          return { received: true };
        }

        const transaction = await Transaction.findOneAndUpdate(
          {
            referenceId: paymentIntent.id,
            status: { $ne: TransactionStatus.FAILED },
          },
          { status: TransactionStatus.FAILED },
          { new: true, session: session || undefined }
        );

        if (transaction) {
          const group = await Group.findById(transaction.groupId).session(
            session || null
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
            session ? { session } : undefined
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
          { session: session || undefined, new: true }
        );

        if (!transaction) {
          logger.info(
            `[Webhook] Transfer ${transfer.id} already reversed or not found.`
          );
          return { received: true };
        }

        if (transaction) {
          await Payout.findOneAndUpdate(
            { transactionId: transaction._id },
            { status: PayoutStatus.FAILED },
            { session: session || undefined }
          );

          // Find the turn and revert status
          const payout = await Payout.findOne({
            transactionId: transaction._id,
          }).session(session || null);
          if (payout) {
            await Turn.findByIdAndUpdate(
              payout.turnId,
              { status: TurnStatus.RECOVERY_REQUIRED },
              { session: session || undefined }
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
              session ? { session } : undefined
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
            session ? { session } : undefined
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
            { session: session || undefined, new: true }
          );

          if (!user) {
            logger.info(
              `[Webhook] User account ${account.id} already verified or not found.`
            );
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
              session ? { session } : undefined
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

      default:
        logger.info(`[Webhook] Unhandled event type ${event.type}`);
    }

    return { received: true };
  });
};

export const WebhookServices = {
  handleStripeWebhook,
};
