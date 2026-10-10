import { z } from "zod";

const createDeletionRequestSchema = z.object({
  body: z.object({
    password: z
      .string({
        required_error: "Password is required to confirm account deletion",
      })
      .min(1, "Password cannot be empty"),
    reason: z.string().optional(),
  }),
});

const rejectDeletionRequestSchema = z.object({
  body: z.object({
    adminNote: z.string().optional(),
  }),
});

export const DeletionRequestValidation = {
  createDeletionRequestSchema,
  rejectDeletionRequestSchema,
};
