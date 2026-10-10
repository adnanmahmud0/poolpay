import { z } from "zod";

const markNoticeSchema = z.object({
  body: z.object({
    noticeStatus: z.enum(["NONE", "NOTICE"]),
  }),
});

const removeMemberSchema = z.object({
  body: z.object({
    removalNote: z
      .string()
      .min(5, "Removal note must be at least 5 characters"),
  }),
});

export const GroupMemberValidation = {
  markNoticeSchema,
  removeMemberSchema,
};
