import { z } from "zod";

const verifyGoogleSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Google purchase token is required and cannot be empty"),
    productId: z.string().min(1, "Product ID is required and cannot be empty"),
  }),
});

const verifyAppleSchema = z.object({
  body: z.object({
    receiptData: z.string().min(1, "Apple receipt data is required and cannot be empty"),
  }),
});

export const MobileMembershipValidations = {
  verifyGoogleSchema,
  verifyAppleSchema,
};
