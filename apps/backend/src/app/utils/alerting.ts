import { envVars } from "../config/env";
import logger from "./logger";

/**
 * Structured alerting utility for dispatching critical system alerts.
 * Interfaces with Slack if SLACK_WEBHOOK_URL is provided in .env.
 */

const sendToSlack = async (channel: string, message: string) => {
  if (!envVars.SLACK_WEBHOOK_URL) return;

  try {
    await fetch(envVars.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[${channel}] ${message}`,
      }),
    });
  } catch (err) {
    logger.error(`[ALERT_ERROR] Failed to send to Slack: ${err}`);
  }
};

export const alertPaymentFailure = (paymentId: string, errorMsg: string) => {
  const msg = `Payment ${paymentId} failed: ${errorMsg}`;
  logger.error(`[ALERT: PAYMENT_FAILURE] ${msg}`);
  sendToSlack("ALERTS-PAYMENTS", msg);
};

export const alertPayoutFailure = (turnId: string, errorMsg: string) => {
  const msg = `Payout (Turn) ${turnId} failed: ${errorMsg}`;
  logger.error(`[ALERT: PAYOUT_FAILURE] ${msg}`);
  sendToSlack("ALERTS-PAYOUTS", msg);
};

export const alertStuckQueue = (queueName: string, stalledJobId: string) => {
  const msg = `Job ${stalledJobId} stalled in queue ${queueName}.`;
  logger.warn(`[ALERT: STUCK_QUEUE] ${msg}`);
  sendToSlack("ALERTS-INFRA", msg);
};

export const alertRedisDisconnect = (errorMsg: string) => {
  const msg = `Redis Disconnected: ${errorMsg}`;
  logger.error(`[ALERT: CRITICAL_INFRA] ${msg}`);
  sendToSlack("ALERTS-INFRA", msg);
};

export const alertManualReviewRequired = (
  entityType: string,
  entityId: string,
  reason: string
) => {
  const msg = `${entityType.toUpperCase()} ${entityId} requires manual review. Reason: ${reason}`;
  logger.error(`[ALERT: MANUAL_REVIEW] ${msg}`);
  sendToSlack("ALERTS-MANUAL-REVIEW", msg);
};

export const alertStripeVerificationMismatch = (
  entityId: string,
  dbState: string,
  stripeState: string
) => {
  const msg = `Reconciliation failure on ${entityId}. DB: ${dbState}, Stripe: ${stripeState}`;
  logger.error(`[ALERT: STRIPE_MISMATCH] ${msg}`);
  sendToSlack("ALERTS-RECONCILIATION", msg);
};
