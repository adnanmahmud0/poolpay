import { z } from "zod";

const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(["active", "inactive", "suspended", "deleted"]),
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
    minContribution: z.number().min(0).optional(),
    maxContribution: z.number().min(0).optional(),
    isUserRegistrationEnabled: z.boolean().optional(),
    isTwoFactorAuthenticationEnabled: z.boolean().optional(),
    isEmailNotificationEnabled: z.boolean().optional(),
    isSMSNotificationEnabled: z.boolean().optional(),
    isPushNotificationEnabled: z.boolean().optional(),
  }).passthrough(),
});

export const AdminValidation = {
  updateUserStatusSchema,
  updateGroupStatusSchema,
  updateSettingsSchema,
};
