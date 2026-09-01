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
    lateFeePercent: z.number().min(0).max(100).optional(),
    gracePeriodDays: z.number().min(0).optional(),
    maxRetryCount: z.number().min(1).optional(),
    supportEmail: z.string().email().optional(),
    supportPhone: z.string().optional(),
  }),
});

export const AdminValidation = {
  updateUserStatusSchema,
  updateGroupStatusSchema,
  updateSettingsSchema,
};
