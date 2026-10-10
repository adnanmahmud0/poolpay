import { getMessaging } from "firebase-admin/messaging";
import logger from "./logger";
import { Settings } from "../modules/settings/settings.model";
import { User } from "../modules/user/user.model";
import { TEmailTemplateName } from "./emailTemplates";
import { sendEmail } from "./sendEmail";
import { sendSMS } from "./sendSMS";
import { notificationQueue } from "../queues/payment.queue";
import { getIO } from "../socket/socket.server";

export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  userId?: string
) => {
  try {
    const settings = await Settings.findOne();
    if (settings && !settings.isPushNotificationEnabled) {
      logger.info("Push notifications are disabled globally.");
      return null;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token,
    };

    const response = await getMessaging().send(message);
    logger.info(`Successfully sent message: ${response}`);
    return response;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    const errorString = firebaseError?.message || String(error);
    const errorCode = firebaseError?.code;

    const isInvalidToken =
      errorCode === "messaging/registration-token-not-registered" ||
      errorCode === "messaging/invalid-registration-token" ||
      errorString.includes("Requested entity was not found") ||
      errorString.includes(
        "registration token is not a valid FCM registration token"
      );

    if (isInvalidToken) {
      logger.warn(
        `[FCM] Invalid token detected ${userId ? `for user ${userId}` : ""}. Clearing token from database. Error: ${errorString}`
      );
      if (userId) {
        await User.findByIdAndUpdate(userId, { $set: { fcmToken: null } });
      }
    } else {
      logger.error("Error sending push notification:", error);
    }
    return null;
  }
};

export const enqueuePushNotification = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  try {
    await notificationQueue.add(
      "push",
      {
        type: "PUSH",
        userId,
        title,
        body,
        data,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      }
    );
  } catch (error) {
    logger.error(
      `Failed to enqueue push notification for user ${userId}:`,
      error
    );
  }
};

export const sendEmailNotification = async (
  to: string,
  subject: string,
  templateName: TEmailTemplateName,
  templateData?: Record<string, unknown>,
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[]
) => {
  try {
    // Note: Global isEmailNotificationEnabled check is now handled inside sendEmail()
    await sendEmail({ to, subject, templateName, templateData, attachments });
    logger.info(
      `Email notification sent to ${to} using template ${templateName}`
    );
  } catch (error) {
    logger.error(`Error sending email notification to ${to}:`, error);
  }
};

export const enqueueEmailNotification = async (
  email: string,
  subject: string,
  templateName: TEmailTemplateName,
  templateData?: Record<string, unknown>,
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[]
) => {
  try {
    await notificationQueue.add(
      "email",
      {
        type: "EMAIL",
        email,
        subject,
        templateName,
        templateData,
        attachments,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      }
    );
  } catch (error) {
    logger.error(`Failed to enqueue email notification to ${email}:`, error);
  }
};

export const sendSMSNotification = async (to: string, message: string) => {
  try {
    const settings = await Settings.findOne();
    if (settings && !settings.isSMSNotificationEnabled) {
      logger.info("SMS notifications are disabled globally.");
      return;
    }

    await sendSMS(to, message);
  } catch (error) {
    logger.error(`Error sending SMS notification to ${to}:`, error);
  }
};

export const emitRealTimeNotification = (
  userId: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
) => {
  try {
    const io = getIO();
    io.to(userId).emit("notification", {
      title,
      message,
      data: data || {},
      timestamp: new Date(),
    });
    logger.info(`Real-time notification emitted to user ${userId}`);
  } catch (error) {
    logger.error(`Error emitting real-time notification to ${userId}:`, error);
  }
};

export const enqueueSMSNotification = async (phone: string, body: string) => {
  try {
    await notificationQueue.add(
      "sms",
      {
        type: "SMS",
        phone,
        body,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      }
    );
  } catch (error) {
    logger.error(`Failed to enqueue SMS notification to ${phone}:`, error);
  }
};
