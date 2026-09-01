import { Queue } from "bullmq";
import { bullMqRedis } from "../config/ioredis.config";
import logger from "../utils/logger";

export const schedulerQueue = new Queue("schedulerQueue", {
  connection: bullMqRedis,
});

export const reconciliationQueue = new Queue("reconciliationQueue", {
  connection: bullMqRedis,
});

/**
 * @deprecated Moved to native.scheduler.ts to save Redis commands
 */
export const initScheduler = async () => {
  logger.info("ℹ️ BullMQ repeatable jobs are now handled by Native Node.js Scheduler.");
  // We no longer add repeatable jobs here to save Redis command quota.
  // The logic is moved to src/app/schedulers/native.scheduler.ts
};
