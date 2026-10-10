import { z } from "zod";

const flagTransactionSchema = z.object({
  body: z.object({
    flaggedReason: z.string({
      message: "Flagged reason is required",
    }),
  }),
});

export const TransactionValidation = {
  flagTransactionSchema,
};
