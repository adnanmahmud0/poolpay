import { z } from "zod";

const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(["active", "inactive", "suspended", "deleted", "blocked", "pending"]),
  }),
});

const updateGroupStatusSchema = z.object({
  body: z.object({
    status: z.enum(["active", "inactive", "completed"]),
  }),
});

const updateSettingsSchema = z.object({
  body: z.object({
    transactionFeePercent: z.number().min(0).max(100).optional(),
    creatorCommissionPercent: z.number().min(0).max(100).optional(),
    platformCommissionPercent: z.number().min(0).max(100).optional(),
    sessionTimeoutMinutes: z.number().min(1).max(1440).optional(),
    lateFeePercent: z.number().min(0).max(100).optional(),
    gracePeriodDays: z.number().min(0).optional(),
    maxRetryCount: z.number().min(1).optional(),
    supportEmail: z.string().email().optional(),
    supportPhone: z.string().optional(),
    supportWhatsapp: z.string().optional(),
    minContribution: z.number().min(0).optional(),
    maxContribution: z.number().min(0).optional(),
    isUserRegistrationEnabled: z.boolean().optional(),
    isTwoFactorAuthenticationEnabled: z.boolean().optional(),
    isEmailNotificationEnabled: z.boolean().optional(),
    isSMSNotificationEnabled: z.boolean().optional(),
    isPushNotificationEnabled: z.boolean().optional(),
  }).passthrough(),
});

const updateGeneralSettingsSchema = z.object({
  body: z.object({
    platformName: z.string().optional(),
    supportEmail: z.string().email().optional(),
  }),
});

const updateFinancialSettingsSchema = z.object({
  body: z.object({
    transactionFeePercent: z.number().min(0).max(100).optional(),
    lateFeePercent: z.number().min(0).max(100).optional(),
    gracePeriodDays: z.number().min(0).optional(),
    maxRetryCount: z.number().min(1).optional(),
    minimumStripeBalance: z.number().min(0).optional(),
  }),
});

const updateContributionSettingsSchema = z.object({
  body: z.object({
    minContribution: z.number().min(0).optional(),
    maxContribution: z.number().min(0).optional(),
  }),
});

const updateAccessAuthSettingsSchema = z.object({
  body: z.object({
    sessionTimeoutMinutes: z.number().min(1).max(1440).optional(),
    isUserRegistrationEnabled: z.boolean().optional(),
    isTwoFactorAuthenticationEnabled: z.boolean().optional(),
  }),
});

const updateNotificationSettingsSchema = z.object({
  body: z.object({
    isEmailNotificationEnabled: z.boolean().optional(),
    isPushNotificationEnabled: z.boolean().optional(),
  }),
});

const updateContactSettingsSchema = z.object({
  body: z.object({
    supportEmail: z.string().email().optional(),
    supportPhone: z.string().optional(),
    supportWhatsapp: z.string().optional(),
  }),
});

export const AdminValidation = {
  updateUserStatusSchema,
  updateGroupStatusSchema,
  updateSettingsSchema,
  updateGeneralSettingsSchema,
  updateFinancialSettingsSchema,
  updateContributionSettingsSchema,
  updateAccessAuthSettingsSchema,
  updateNotificationSettingsSchema,
  updateContactSettingsSchema,
};
