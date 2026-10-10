import { Queue } from "bullmq";
import { bullMqRedis } from "../config/ioredis.config";
import logger from "./logger";

const queueNames = [
  "schedulerQueue",
  "reconciliationQueue",
  "paymentQueue",
  "notificationQueue",
  "turnSchedulerQueue",
  "redistributionQueue",
];

export const cleanupRepeatableJobs = async () => {
  logger.info("🧹 Starting global BullMQ repeatable jobs cleanup...");

  for (const queueName of queueNames) {
    const queue = new Queue(queueName, { connection: bullMqRedis });

    try {
      const repeatableJobs = await queue.getRepeatableJobs();

      if (repeatableJobs.length === 0) {
        logger.info(`  - No repeatable jobs found in [${queueName}]`);
      } else {
        logger.info(
          `  - Found ${repeatableJobs.length} repeatable jobs in [${queueName}]. Removing...`
        );
        for (const job of repeatableJobs) {
          await queue.removeRepeatableByKey(job.key);
          logger.info(`    ✅ Removed: ${job.name} (${job.key})`);
        }
      }

      await queue.close();
    } catch (error) {
      logger.error(`  ❌ Error cleaning up [${queueName}]:`, error);
    }
  }

  logger.info(
    "✨ Global cleanup finished. Repeatable jobs are now strictly managed by Native Scheduler."
  );
};

// Function is exported to be called from server.ts
