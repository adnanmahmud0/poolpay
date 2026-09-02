
import logger from "../../utils/logger";
import { Settings, ISettings } from "./settings.model";
import { envVars } from "../../config/env";

const getSettings = async () => {
  const settings = await Settings.findOne();
  if (!settings) {
    // Create default settings if none exist
    return await Settings.create({
      transactionFeePercent: 5,
      creatorCommissionPercent: 1,
      platformCommissionPercent: 1,
      sessionTimeoutMinutes: envVars.SESSION_TIMEOUT_MINUTES || 20,
      lateFeePercent: 5,
      gracePeriodDays: 3,
      maxRetryCount: 3,
    });
  }
  return settings;
};

const updateSettings = async (payload: Partial<ISettings>, userId: string) => {
  // Respect the payload if SMS is enabled in env, otherwise force false
  const isSmsSupported = envVars.TWILIO.SMS_ENABLED;
  const updatedPayload = { 
    ...payload,
    isSMSNotificationEnabled: isSmsSupported ? payload.isSMSNotificationEnabled : false
  };

  const settings = await Settings.findOne();
  if (!settings) {
    return await Settings.create({ ...updatedPayload, updatedBy: userId });
  }

  const updatedSettings = await Settings.findOneAndUpdate(
    {},
    { ...updatedPayload, updatedBy: userId },
    { new: true, runValidators: true }
  );
  return updatedSettings;
};

const updateSupportEmail = async (email: string, userId: string) => {
  const settings = await Settings.findOneAndUpdate(
    {},
    { supportEmail: email, updatedBy: userId },
    { new: true, upsert: true }
  );

  logger.info(`[COMPLIANCE] Support email updated to ${email} by Admin.`);
  
  return settings;
};

const getAuthSettings = async () => {
  const settings = await Settings.findOne().select(
    "platformName isTwoFactorAuthenticationEnabled supportEmail sessionTimeoutMinutes"
  );
  if (!settings) {
    return {
      platformName: "PoolPay",
      isTwoFactorAuthenticationEnabled: true,
      supportEmail: "support@poolpay.com",
      sessionTimeoutMinutes: envVars.SESSION_TIMEOUT_MINUTES || 20,
    };
  }
  return settings;
};

export const SettingsServices = {
  getSettings,
  updateSettings,
  updateSupportEmail,
  getAuthSettings,
};
