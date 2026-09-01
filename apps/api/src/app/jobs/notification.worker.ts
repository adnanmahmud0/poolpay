import { Worker } from "bullmq";
import { bullMqRedis } from "../config/ioredis.config";
import { sendPushNotification, sendEmailNotification, sendSMSNotification } from "../utils/notification.utils";
import { User } from "../modules/user/user.model";
import logger from "../utils/logger";

export enum NotificationJobType {
  PUSH = "PUSH",
  EMAIL = "EMAIL",
  SMS = "SMS",
}

export const notificationWorker = new Worker(
  "notificationQueue",
  async (job) => {
    const { type, userId, email, phone, title, body, subject, templateName, templateData, data } = job.data;
    
    switch (type) {
      case NotificationJobType.PUSH: {
        const user = await User.findById(userId);
        if (user?.fcmToken) {
          await sendPushNotification(user.fcmToken, title, body, data, userId);
        } else {
          logger.warn(`[NOTIFICATION_WORKER] Skipping push: No FCM token for user ${userId}`);
        }
        break;
      }
      
      case NotificationJobType.EMAIL: {
        await sendEmailNotification(email, subject, templateName, templateData, job.data.attachments);
        break;
      }
      
      case NotificationJobType.SMS: {
        await sendSMSNotification(phone, body);
        break;
      }
      
      default:
        logger.error(`[NOTIFICATION_WORKER] Unknown notification type: ${type}`);
    }
  },
  { 
    connection: bullMqRedis,
    stalledInterval: 600000, 
    lockDuration: 600000,
    drainDelay: 300000,
  }
);

notificationWorker.on("completed", (job) => {
  logger.info(`✅ Notification job ${job.id} (${job.data.type}) completed`);
});

notificationWorker.on("failed", (job, err) => {
  logger.error(`❌ Notification job ${job?.id} (${job?.data?.type}) failed: ${err.message}`);
});
