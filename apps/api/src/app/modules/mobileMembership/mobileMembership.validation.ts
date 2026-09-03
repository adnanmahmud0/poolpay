import { z } from "zod";

const verifyGoogleSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Google purchase token is required and cannot be empty"),
    productId: z.string().min(1, "Product ID is required and cannot be empty"),
  }),
});

const verifyAppleSchema = z.object({
  body: z
    .object({
      receiptData: z.string().optional(),
      transactionId: z.string().optional(),
      productId: z.string().optional(),
    })
    .refine((data) => data.receiptData || data.transactionId, {
      message: "Either receiptData or transactionId is required",
    }),
});

export const MobileMembershipValidations = {
  verifyGoogleSchema,
  verifyAppleSchema,
};
