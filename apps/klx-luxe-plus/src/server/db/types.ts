export type UserRole = "owner" | "admin";

export interface KlxUser {
  _id?: import("mongodb").ObjectId;
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface KlxSession {
  _id?: import("mongodb").ObjectId;
  tokenHash: string;
  userId: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
  createdAt: Date;
}

export interface KlxSetupToken {
  _id?: import("mongodb").ObjectId;
  token: string;
  email: string;
  expiresAt: Date;
  usedAt?: Date;
  purpose?: "setup" | "recovery";
  createdAt: Date;
}

export interface SiteContentData {
  hero: {
    title: string;
    subtitle: string;
    badge: string;
    ctaText: string;
    ctaHref: string;
    secondaryCtaText: string;
    secondaryCtaHref: string;
  };
  poolpay: {
    title: string;
    subtitle: string;
    description: string;
    googlePlayUrl: string;
    appStoreComingSoon: boolean;
    appStoreUrl?: string;
    features: string[];
    logoUrl?: string;
    screenshotUrl?: string;
  };
  about: {
    title: string;
    subtitle: string;
    story: string[];
    stats: { label: string; value: string }[];
  };
  faqs: { question: string; answer: string }[];
  footer: {
    description: string;
    copyright: string;
  };
  sectionOrder: string[];
  sectionVisibility: {
    poolpay: boolean;
    services: boolean;
    about: boolean;
    appointments: boolean;
    faqs: boolean;
  };
  policies: {
    privacy: string;
    terms: string;
    cancellation: string;
    refund: string;
  };
}

export interface KlxContent {
  _id?: import("mongodb").ObjectId;
  version: number;
  status: "draft" | "published";
  publishedAt?: Date;
  data: SiteContentData;
  createdAt: Date;
  updatedAt: Date;
}

export type PricingMode = "quote" | "fixed" | "deposit";

export interface KlxService {
  _id?: import("mongodb").ObjectId;
  id: string;
  serviceId: string;
  number: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  action: string;
  pricingMode: PricingMode;
  priceCents: number;
  depositCents: number;
  durationMinutes: number;
  isVisible: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentStatus =
  "requested" | "confirmed" | "rescheduled" | "cancelled" | "declined" | "completed";

export interface AttachedDocument {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  filename?: string;
  originalName?: string;
  uploadedAt?: Date;
}

export interface KlxAppointment {
  rejectionReason?: string;
  _id?: import("mongodb").ObjectId;
  id: string;
  reference: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
  requestedDate: string; // YYYY-MM-DD
  requestedTimeSlot: string; // HH:mm
  timezone: string;
  durationMinutes?: number;
  status: AppointmentStatus;
  adminNotes?: string;
  servicePriceCents?: number;
  serviceDepositCents?: number;
  token: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  interpretationSetting?: string;
  translationReason?: string;
  documentTypes?: string[];
  attachedDocuments?: AttachedDocument[];
  pickupLocation?: string;
  dropoffLocation?: string;
  vehicleClass?: string;
  passengers?: number;
  estimatedFareCents?: number;
  payNow?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type QuoteStatus = "pending" | "deposit_paid" | "fully_paid" | "cancelled" | "expired";

export interface KlxQuote {
  checkoutStartedAt?: Date;
  checkoutUntil?: Date;
  _id?: import("mongodb").ObjectId;
  id: string;
  quoteNumber: string;
  appointmentId?: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  description: string;
  amountCents: number;
  depositCents: number;
  balanceCents: number;
  token?: string;
  currency: string;
  status: QuoteStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentStatus = "pending" | "paid" | "failed" | "partially_refunded" | "refunded";

export interface KlxPayment {
  _id?: import("mongodb").ObjectId;
  id: string;
  quoteId: string;
  appointmentId?: string;
  customerEmail: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  amountCents: number;
  refundedAmountCents: number;
  currency: string;
  status: PaymentStatus;
  mode: "test" | "live";
  receiptUrl?: string;
  reservedRefundCents?: number;
  refundOperation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RefundStatus = "pending" | "succeeded" | "failed" | "cancelled";

export interface KlxRefund {
  _id?: import("mongodb").ObjectId;
  id: string;
  paymentId: string;
  stripeRefundId?: string;
  amountCents: number;
  reason: string;
  status: RefundStatus;
  idempotencyKey: string;
  adminEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KlxAdvertisement {
  _id?: import("mongodb").ObjectId;
  id: string;
  title: string;
  imageUrl: string;
  destinationUrl: string;
  altText: string;
  placement: "after_hero" | "after_services";
  priority: number;
  isActive: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KlxMedia {
  _id?: import("mongodb").ObjectId;
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  altText?: string;
  createdAt: Date;
}

export type OutboxType =
  | "customer_otp"
  | "appointment_requested"
  | "appointment_confirmed"
  | "appointment_rescheduled"
  | "quote_sent"
  | "payment_received"
  | "refund_processed";

export interface KlxOutbox {
  _id?: import("mongodb").ObjectId;
  id: string;
  type: OutboxType;
  recipient: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  status: "pending" | "sent" | "failed";
  attempts: number;
  lastError?: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface KlxSettings {
  _id?: import("mongodb").ObjectId;
  siteTitle: string;
  supportEmail: string;
  ownerEmail: string;
  phone: string;
  timezone: string;
  currency: string;
  seoTitle: string;
  seoDescription: string;
  socialImageUrl: string;
  scheduling: {
    workingDays: number[];
    blockedDates: string[];
    openingTime: string;
    closingTime: string;
  };
  policies: {
    privacy: string;
    terms: string;
    cancellation: string;
    refund: string;
  };
  notificationSettings: {
    emailOnRequest: boolean;
    emailOnConfirm: boolean;
    emailOnPayment: boolean;
    emailOnRefund: boolean;
  };
  updatedAt: Date;
}

export type PublicSettings = Pick<
  KlxSettings,
  | "siteTitle"
  | "supportEmail"
  | "phone"
  | "timezone"
  | "currency"
  | "seoTitle"
  | "seoDescription"
  | "socialImageUrl"
>;

export interface KlxAuditLog {
  _id?: import("mongodb").ObjectId;
  id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}
