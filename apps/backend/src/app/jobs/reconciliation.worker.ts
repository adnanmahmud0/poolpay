import { Worker } from "bullmq";
import { bullMqRedis } from "../config/ioredis.config";
import { Payment, PaymentStatus } from "../modules/payment/payment.model";
import { Turn } from "../modules/turn/turn.model";
import { TurnStatus } from "../modules/turn/turn.interface";
import { User } from "../modules/user/user.model";
import { stripe } from "../config/stripe.config";
import logger from "../utils/logger";
import { paymentQueue, turnSchedulerQueue } from "../queues/payment.queue";
import { AuditAction, EntityType } from "../modules/auditLog/auditLog.model";
import { safeAuditLog } from "../modules/auditLog/auditLog.utils";
import {
  alertManualReviewRequired,
  alertStripeVerificationMismatch,
} from "../utils/alerting";

/**
 * Shared logic for reconciliation jobs
 */
export const processReconciliation = async () => {
  logger.info("🔍 Running Financial Reconciliation Checks...");

  // Check records updated in the last 24 hours, but older than 15 minutes
  const now = Date.now();
  const fifteenMinsAgo = new Date(now - 15 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

  // 1. Audit PROCESSING Payments (Stuck processing recovery)
  const stuckPaymentsCursor = Payment.find({
    status: PaymentStatus.PROCESSING,
    updatedAt: { $lt: fifteenMinsAgo, $gte: twentyFourHoursAgo },
  }).cursor();

  for await (const payment of stuckPaymentsCursor) {
    if (payment.recoveryAttempts >= 3) {
      await Payment.findByIdAndUpdate(payment._id, {
        status: PaymentStatus.MANUAL_REVIEW,
      });
      alertManualReviewRequired(
        "payment",
        payment._id.toString(),
        "Exceeded maximum recovery attempts"
      );
      await safeAuditLog({
        entityType: EntityType.PAYMENT,
        entityId: payment._id,
        action: AuditAction.MANUAL_REVIEW_ESCALATED,
        metadata: { reason: "Max recovery attempts exceeded" },
      });
      continue;
    }

    try {
      if (payment.stripePaymentIntentId) {
        const intent = await stripe.paymentIntents.retrieve(
          payment.stripePaymentIntentId
        );
        if (intent.status === "succeeded") {
          // DB says PROCESSING, but Stripe says SUCCEEDED. We safely funnel back to paymentWorker for DB completion.
          await Payment.findByIdAndUpdate(payment._id, {
            status: PaymentStatus.PENDING,
            $inc: { recoveryAttempts: 1 },
          });
          await paymentQueue.add(
            "processPayment",
            { paymentId: payment._id },
            { jobId: `recovery_${payment._id}` }
          );
          await safeAuditLog({
            entityType: EntityType.PAYMENT,
            entityId: payment._id,
            action: AuditAction.RECOVERY_SUCCESS,
            metadata: { reason: "Stripe Succeeded, pushed to queue" },
          });
          logger.info(
            `[RECONCILIATION] Recovered stuck payment ${payment._id} to PENDING for finalization.`
          );
        } else if (
          intent.status === "requires_payment_method" ||
          intent.status === "canceled"
        ) {
          await Payment.findByIdAndUpdate(payment._id, {
            status: PaymentStatus.FAILED,
          });
          await safeAuditLog({
            entityType: EntityType.PAYMENT,
            entityId: payment._id,
            action: AuditAction.RECOVERY_FAIL,
            metadata: { reason: "Stripe Failed, marked FAILED" },
          });
          logger.info(
            `[RECONCILIATION] Marked stuck payment ${payment._id} as FAILED.`
          );
        } else {
          // Ambiguous status (processing, requires_action)
          await Payment.findByIdAndUpdate(payment._id, {
            status: PaymentStatus.MANUAL_REVIEW,
          });
          alertManualReviewRequired(
            "payment",
            payment._id.toString(),
            `Ambiguous Stripe status: ${intent.status}`
          );
          await safeAuditLog({
            entityType: EntityType.PAYMENT,
            entityId: payment._id,
            action: AuditAction.MANUAL_REVIEW_ESCALATED,
            metadata: { reason: `Ambiguous status: ${intent.status}` },
          });
        }
      } else {
        // No Intent ID, means it crashed before Stripe even responded.
        await Payment.findByIdAndUpdate(payment._id, {
          status: PaymentStatus.FAILED,
        });
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      // Stripe API error/timeout
      await Payment.findByIdAndUpdate(payment._id, {
        status: PaymentStatus.MANUAL_REVIEW,
      });
      alertManualReviewRequired(
        "payment",
        payment._id.toString(),
        `Stripe check failed: ${errorMessage}`
      );
      await safeAuditLog({
        entityType: EntityType.PAYMENT,
        entityId: payment._id,
        action: AuditAction.MANUAL_REVIEW_ESCALATED,
        metadata: { reason: "Stripe verification error" },
      });
    }
  }

  // 2. Audit PROCESSING Turns
  const stuckTurnsCursor = Turn.find({
    status: TurnStatus.PROCESSING,
    updatedAt: { $lt: fifteenMinsAgo, $gte: twentyFourHoursAgo },
  }).cursor();

  for await (const turn of stuckTurnsCursor) {
    if ((turn.recoveryAttempts || 0) >= 3) {
      await Turn.findByIdAndUpdate(turn._id, {
        status: TurnStatus.MANUAL_REVIEW,
      });
      alertManualReviewRequired(
        "turn",
        turn._id.toString(),
        "Exceeded maximum recovery attempts"
      );
      await safeAuditLog({
        entityType: EntityType.TURN,
        entityId: turn._id,
        action: AuditAction.MANUAL_REVIEW_ESCALATED,
        metadata: { reason: "Max recovery attempts exceeded" },
      });
      continue;
    }

    try {
      let succeeded = false;

      if (turn.stripeTransferId) {
        const transfer = await stripe.transfers.retrieve(turn.stripeTransferId);
        if (transfer) succeeded = true;
      } else {
        const user = await User.findById(turn.userId);
        if (user?.stripeConnectedAccountId) {
          const transfers = await stripe.transfers.list({
            destination: user.stripeConnectedAccountId,
            limit: 10,
          });
          const transfer = transfers.data.find(
            (t) => t.metadata?.turnId === turn._id.toString()
          );
          if (transfer) succeeded = true;
        }
      }

      if (succeeded) {
        await Turn.findByIdAndUpdate(turn._id, {
          status: TurnStatus.PENDING,
          $inc: { recoveryAttempts: 1 },
        });
        await turnSchedulerQueue.add(
          "processPayout",
          { turnId: turn._id },
          { jobId: `recovery_${turn._id}` }
        );
        await safeAuditLog({
          entityType: EntityType.TURN,
          entityId: turn._id,
          action: AuditAction.RECOVERY_SUCCESS,
          metadata: { reason: "Transfer found, queued" },
        });
        logger.info(`[RECONCILIATION] Recovered turn ${turn._id} to PENDING.`);
      } else {
        // If we couldn't confidently find it, we MUST move it to MANUAL_REVIEW to prevent duplicate payouts.
        await Turn.findByIdAndUpdate(turn._id, {
          status: TurnStatus.MANUAL_REVIEW,
        });
        alertManualReviewRequired(
          "turn",
          turn._id.toString(),
          "Transfer not found in Stripe. Review required before retry."
        );
        await safeAuditLog({
          entityType: EntityType.TURN,
          entityId: turn._id,
          action: AuditAction.MANUAL_REVIEW_ESCALATED,
          metadata: { reason: "Transfer unverified" },
        });
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      await Turn.findByIdAndUpdate(turn._id, {
        status: TurnStatus.MANUAL_REVIEW,
      });
      alertManualReviewRequired(
        "turn",
        turn._id.toString(),
        `Stripe check failed: ${errorMessage}`
      );
      await safeAuditLog({
        entityType: EntityType.TURN,
        entityId: turn._id,
        action: AuditAction.MANUAL_REVIEW_ESCALATED,
        metadata: { reason: "Stripe error" },
      });
    }
  }

  // 3. Audit FAILED Payments (Detect missed funds!)
  const failedPaymentsCursor = Payment.find({
    status: PaymentStatus.FAILED,
    stripePaymentIntentId: { $exists: true },
    updatedAt: { $lt: fifteenMinsAgo, $gte: twentyFourHoursAgo },
  }).cursor();

  for await (const payment of failedPaymentsCursor) {
    try {
      if (!payment.stripePaymentIntentId) continue;
      const intent = await stripe.paymentIntents.retrieve(
        payment.stripePaymentIntentId
      );
      if (intent.status === "succeeded") {
        // CRITICAL MISMATCH: DB says FAILED, Stripe collected funds!
        await Payment.findByIdAndUpdate(payment._id, {
          status: PaymentStatus.RECOVERY_REQUIRED,
        });
        alertStripeVerificationMismatch(
          payment._id.toString(),
          "FAILED",
          "succeeded"
        );
        await safeAuditLog({
          entityType: EntityType.PAYMENT,
          entityId: payment._id,
          action: AuditAction.RECONCILIATION_MISMATCH,
          metadata: { db: "FAILED", stripe: "succeeded" },
        });
      }
    } catch (_e) {
      // Ignore errors for now
    }
  }

  logger.info("✅ Reconciliation checks complete.");
};

export const reconciliationWorker = new Worker(
  "reconciliationQueue",
  async (_job) => {
    await processReconciliation();
  },
  {
    connection: bullMqRedis,
    concurrency: 1,
    stalledInterval: 600000,
    lockDuration: 600000,
    drainDelay: 60000,
  }
);

reconciliationWorker.on("failed", (_job, err) => {
  logger.error(`❌ Reconciliation job failed: ${err.message}`);
});
