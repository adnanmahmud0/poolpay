import logger from "../utils/logger";

/**
 * Native Node.js Scheduler
 * This replaces BullMQ repeatable jobs to save Redis commands.
 * It triggers the logic directly without hitting Redis for scheduling.
 */
export const initNativeScheduler = () => {
  logger.info("⏰ Initializing Native Node.js Scheduler (Redis-free)...");

  // 1. Daily Checks & Stripe Monitoring - Every 10 minutes
  setInterval(
    async () => {
      try {
        logger.info("🔄 Triggering scheduled checks (Native)...");
        // Use dynamic import to avoid loading the entire worker module at top-level
        const { processSchedulerJobs } =
          await import("../jobs/scheduler.worker");
        await processSchedulerJobs("daily-checks");
        await processSchedulerJobs("stripe-monitoring");
      } catch (error) {
        logger.error("❌ Native Scheduler Error (Daily Checks):", error);
      }
    },
    10 * 60 * 1000
  ); // 10 minutes

  // 2. Financial Reconciliation - Every 12 hours
  setInterval(
    async () => {
      try {
        logger.info("🔄 Triggering Financial Reconciliation (Native)...");
        // Use dynamic import to avoid loading the entire worker module at top-level
        const { processReconciliation } =
          await import("../jobs/reconciliation.worker");
        await processReconciliation();
      } catch (error) {
        logger.error("❌ Native Scheduler Error (Reconciliation):", error);
      }
    },
    12 * 60 * 60 * 1000
  ); // 12 hours
};
