import { z } from "zod";

export const text = z.string().trim().min(1).max(500);
export const longText = z.string().trim().max(12000);
export const safeLink = z
  .string()
  .max(2048)
  .refine(
    (value) => (value.startsWith("/") && !value.startsWith("//")) || /^https:\/\//.test(value),
    "Use an HTTPS URL or local path."
  );
export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
    "Invalid date"
  );
export const cents = z.number().int().min(0).max(100000000);
export const serviceSchema = z
  .object({
    id: text,
    serviceId: text,
    number: text,
    name: text,
    shortName: text,
    category: text,
    description: longText,
    action: text,
    pricingMode: z.enum(["quote", "fixed", "deposit"]),
    priceCents: cents,
    depositCents: cents,
    durationMinutes: z.number().int().min(15).max(1440),
    isVisible: z.boolean(),
    sortOrder: z.number().int().min(0).max(100)
  })
  .refine(
    (s) => s.depositCents <= s.priceCents && (s.pricingMode === "quote" || s.priceCents > 0),
    "Enter a positive price and a deposit no greater than the price."
  );
export const appointmentSchema = z.object({
  requestId: z.string().uuid().optional(),
  serviceId: text,
  customerName: text,
  customerEmail: z.string().email().max(254),
  customerPhone: z.string().trim().min(7).max(40),
  customerNotes: z.string().max(2000).default(""),
  requestedDate: dateString,
  requestedTimeSlot: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  website: z.string().max(0).optional()
});
export const appointmentUpdateSchema = z.object({
  id: text,
  status: z.enum(["requested", "confirmed", "rescheduled", "cancelled", "declined", "completed"]),
  requestedDate: dateString,
  requestedTimeSlot: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  adminNotes: z.string().max(2000).default(""),
  rejectionReason: z.string().trim().max(1000).default("")
});
export const quoteSchema = z
  .object({
    requestId: z.string().uuid().optional(),
    customerName: text,
    customerEmail: z.string().email(),
    appointmentId: z.string().max(100).optional(),
    serviceName: text,
    description: longText,
    amountCents: cents.refine((n) => n > 0),
    depositCents: cents,
    expiresInDays: z.number().int().min(1).max(90)
  })
  .refine((q) => q.depositCents <= q.amountCents, "Deposit exceeds total.");
export const adSchema = z.object({
  id: z.string().optional(),
  title: text,
  imageUrl: safeLink,
  destinationUrl: safeLink,
  altText: text,
  placement: z.enum(["after_hero", "after_services"]),
  priority: z.number().int().min(0).max(100),
  isActive: z.boolean(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});
export const settingsSchema = z.object({
  seoTitle: text,
  seoDescription: text,
  socialImageUrl: safeLink,
  scheduling: z.object({
    workingDays: z.array(z.number().int().min(0).max(6)).max(7),
    blockedDates: z.array(dateString).max(366),
    openingTime: z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/),
    closingTime: z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/)
  }),
  siteTitle: text,
  supportEmail: z.string().email(),
  ownerEmail: z.string().email(),
  phone: text,
  timezone: text.refine((v) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: v });
      return true;
    } catch {
      return false;
    }
  }, "Use an IANA timezone"),
  currency: z.literal("usd"),
  policies: z.object({
    privacy: longText,
    terms: longText,
    cancellation: longText,
    refund: longText
  }),
  notificationSettings: z.object({
    emailOnRequest: z.boolean(),
    emailOnConfirm: z.boolean(),
    emailOnPayment: z.boolean(),
    emailOnRefund: z.boolean()
  })
});
export const contentSchema = z.object({
  hero: z.object({
    title: text,
    subtitle: text,
    badge: text,
    ctaText: text,
    ctaHref: safeLink.or(z.string().regex(/^#[\w-]+$/)),
    secondaryCtaText: text,
    secondaryCtaHref: z.string().regex(/^#[\w-]+$/)
  }),
  poolpay: z.object({
    title: text,
    subtitle: text,
    description: longText,
    googlePlayUrl: safeLink,
    appStoreComingSoon: z.boolean(),
    appStoreUrl: safeLink.optional().or(z.literal("")),
    features: z.array(text).max(8),
    logoUrl: safeLink.optional(),
    screenshotUrl: safeLink.optional()
  }),
  about: z.object({
    title: text,
    subtitle: text,
    story: z.array(longText).max(8),
    stats: z.array(z.object({ label: text, value: text })).max(8)
  }),
  faqs: z.array(z.object({ question: text, answer: longText })).max(30),
  footer: z.object({ description: longText, copyright: text }),
  sectionOrder: z
    .array(z.enum(["poolpay", "services", "about", "appointments", "faqs"]))
    .length(5)
    .refine(
      (a) => new Set(a).size === 5 && a[0] === "poolpay",
      "Keep PoolPay first and include each section once."
    ),
  sectionVisibility: z.object({
    poolpay: z.literal(true),
    services: z.boolean(),
    about: z.boolean(),
    appointments: z.boolean(),
    faqs: z.boolean()
  }),
  policies: z.object({
    privacy: longText,
    terms: longText,
    cancellation: longText,
    refund: longText
  })
});
