import { z } from "zod";

const addPaymentMethodSchema = z.object({
  body: z.object({
    paymentMethodId: z.string().min(1, "Stripe Payment Method ID is required"),
    type: z.enum(["card", "bank"]),
    isDefault: z.boolean().optional(),
    autoPayEnabled: z.boolean().optional(),
  }),
});

const toggleAutoPaySchema = z.object({
  body: z.object({
    autoPayEnabled: z.boolean(),
  }),
});

export const PaymentMethodValidation = {
  addPaymentMethodSchema,
  toggleAutoPaySchema,
};
