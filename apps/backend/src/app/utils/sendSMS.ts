import { envVars } from "../config/env";
import logger from "./logger";

/**
 * Sends an SMS message using Twilio.
 * Note: Requires 'twilio' package to be installed.
 * If TWILIO config is missing, it logs to console as a fallback (mock mode).
 */
export const sendSMS = async (to: string, message: string) => {
  const {
    ACCOUNT_SID,
    AUTH_TOKEN,
    PHONE_NUMBER,
    MESSAGING_SERVICE_SID,
    SMS_ENABLED,
  } = envVars.TWILIO;

  if (!SMS_ENABLED) {
    logger.info(`[SMS_DISABLED] To: ${to}, Message: ${message}`);
    return;
  }

  if (
    !ACCOUNT_SID ||
    !AUTH_TOKEN ||
    (!PHONE_NUMBER && !MESSAGING_SERVICE_SID)
  ) {
    logger.warn(`[SMS_MOCK] To: ${to}, Message: ${message}`);
    return;
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(ACCOUNT_SID, AUTH_TOKEN);

    const messagePayload: {
      body: string;
      to: string;
      messagingServiceSid?: string;
      from?: string;
    } = {
      body: message,
      to: to,
    };

    // Prioritize Messaging Service SID over plain phone number for better international delivery
    if (MESSAGING_SERVICE_SID) {
      messagePayload.messagingServiceSid = MESSAGING_SERVICE_SID;
    } else {
      messagePayload.from = PHONE_NUMBER;
    }

    const result = await client.messages.create(messagePayload);

    logger.info(`[SMS_SENT] SID: ${result.sid} to ${to}`);
  } catch (error) {
    logger.error(`[SMS_ERROR] Failed to send SMS to ${to}:`, error);
    // Silent fail for SMS in dev, but log it properly
  }
};
