import { z } from "zod";
import { ContributionFrequency } from "./group.interface";

const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Group name is required"),
    description: z.string().optional(),
    contributionAmount: z.coerce
      .number()
      .min(1, "Contribution amount must be positive"),
    contributionFrequency: z.nativeEnum(ContributionFrequency),
    totalMembers: z.coerce.number().min(2, "Minimum 2 members required"),
    totalCycles: z.coerce
      .number()
      .min(1, "Minimum 1 cycle required")
      .optional(),
    startDate: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          const date = new Date(val);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return !isNaN(date.getTime()) && date >= today;
        },
        {
          message: "Start date must be today or in the future",
        }
      ),
    groupPhoto: z.string().optional(),
    creatorCommissionPercent: z.coerce.number().min(0).max(1).optional(),
  }),
});

const joinGroupSchema = z.object({
  body: z.object({
    inviteCode: z.string().min(1, "Invite code is required"),
  }),
});

export const GroupValidation = {
  createGroupSchema,
  joinGroupSchema,
};
