import { z } from "zod";
import { MembershipTier } from "../user/user.interface";

const createSubscriptionSchema = z.object({
  body: z.object({
    targetTier: z.nativeEnum(MembershipTier),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  }),
});

const toggleAutoRenewSchema = z.object({
  body: z.object({
    autoRenew: z.boolean({
      message: "autoRenew must be a boolean",
    }),
  }),
});

export const MembershipValidations = {
  createSubscriptionSchema,
  toggleAutoRenewSchema,
};
