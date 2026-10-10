import { z } from "zod";

const sendMessageSchema = z.object({
  body: z.object({
    message: z.string().optional(),
    messageType: z.enum(["text", "image", "video", "media"]).optional(),
  }),
});

export const ChatValidation = {
  sendMessageSchema,
};
