import { z } from "zod";

const createAdvertisementSchema = z.object({
  body: z
    .object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      bannerImage: z.string().optional(),
      redirectUrl: z.string().optional().or(z.literal("")),
      actionType: z
        .enum(["none", "link", "email", "phone", "whatsapp"])
        .optional()
        .default("none"),
      actionValue: z.string().optional().or(z.literal("")),
      isActive: z
        .preprocess((val) => {
          if (typeof val === "string") return val === "true";
          return val;
        }, z.boolean())
        .optional(),
      priority: z
        .preprocess((val) => {
          if (typeof val === "string") return parseInt(val, 10);
          return val;
        }, z.number())
        .optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return new Date(data.startDate) < new Date(data.endDate);
        }
        return true;
      },
      {
        message: "Start date must be before end date",
        path: ["startDate"],
      }
    ),
});

const updateAdvertisementSchema = z.object({
  body: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      bannerImage: z.string().optional(),
      redirectUrl: z.string().optional().or(z.literal("")),
      actionType: z
        .enum(["none", "link", "email", "phone", "whatsapp"])
        .optional(),
      actionValue: z.string().optional().or(z.literal("")),
      isActive: z
        .preprocess((val) => {
          if (typeof val === "string") return val === "true";
          return val;
        }, z.boolean())
        .optional(),
      priority: z
        .preprocess((val) => {
          if (typeof val === "string") return parseInt(val, 10);
          return val;
        }, z.number())
        .optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return new Date(data.startDate) < new Date(data.endDate);
        }
        return true;
      },
      {
        message: "Start date must be before end date",
        path: ["startDate"],
      }
    ),
});

export const AdvertisementValidation = {
  createAdvertisementSchema,
  updateAdvertisementSchema,
};
