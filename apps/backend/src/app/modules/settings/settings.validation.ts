import { z } from "zod";

const updateSupportEmailSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

const updateSettingsSchema = z.object({
  body: z.object({
    platformName: z.string().optional(),
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
    isUserAutoApprovalEnabled: z.boolean().optional(),
    isSocialLoginEnabled: z.boolean().optional(),
    isTwoFactorAuthenticationEnabled: z.boolean().optional(),
    isEmailNotificationEnabled: z.boolean().optional(),
    isSMSNotificationEnabled: z.boolean().optional(),
    isPushNotificationEnabled: z.boolean().optional(),
  }),
});

export const SettingsValidation = {
  updateSupportEmailSchema,
  updateSettingsSchema,
};
