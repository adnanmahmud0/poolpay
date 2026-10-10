import { Queue } from "bullmq";
import { bullMqRedis } from "../config/ioredis.config";

const defaultOptions = {
  connection: bullMqRedis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 100, // Keep last 100 failed jobs for debugging
  },
};

// Queues
export const paymentQueue = new Queue("paymentQueue", defaultOptions);

export const notificationQueue = new Queue("notificationQueue", defaultOptions);

export const turnSchedulerQueue = new Queue(
  "turnSchedulerQueue",
  defaultOptions
);

export const redistributionQueue = new Queue(
  "redistributionQueue",
  defaultOptions
);
