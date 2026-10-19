import { randomUUID } from "node:crypto";

import { z } from "zod";

import { env } from "@/env";

import { manageAppointment } from "@/server/appointments";
import {
  createPaymentRequest,
  refundPayment,
  stripeClient,
  syncRefunds,
  syncSession
} from "@/server/commerce";
import { COLLECTIONS, getDb } from "@/server/db/client";
import { DEFAULT_ADVERTISEMENTS } from "@/server/db/defaults";
import {
  getServices,
  getSettings,
  getSiteContent,
  initAdvertisementsIfEmpty,
  initServicesIfEmpty,
  logAudit,
  publishContent,
  saveDraftContent
} from "@/server/db/repositories";
import type { KlxContent, KlxPayment } from "@/server/db/types";
import { handle, HttpError, requireAdmin } from "@/server/http";
import { processOutbox } from "@/server/mail";
import { manageOrder } from "@/server/orders";
import {
  adSchema,
  cents,
  contentSchema,
  serviceSchema,
  settingsSchema,
  text,
  transportationPricingSchema
} from "@/server/validation";

export const runtime = "nodejs";

export async function GET() {
  return handle(async () => {
    const user = await requireAdmin();
    const db = await getDb();
    await initServicesIfEmpty();
    await initAdvertisementsIfEmpty();
    const [
      content,
      services,
      settings,
      appointments,
      quotes,
      payments,
      refunds,
      advertisements,
      media,
      audit,
      versions,
      notifications
    ] = await Promise.all([
      getSiteContent("draft"),
      getServices(true),
      getSettings(),
      ...[
        COLLECTIONS.APPOINTMENTS,
        COLLECTIONS.QUOTES,
        COLLECTIONS.PAYMENTS,
        COLLECTIONS.REFUNDS,
        COLLECTIONS.ADVERTISEMENTS,
        COLLECTIONS.MEDIA,
        COLLECTIONS.AUDIT_LOG
      ].map((name) => db.collection(name).find({}).sort({ createdAt: -1 }).limit(200).toArray()),
      db
        .collection(COLLECTIONS.CONTENT)
        .find({ status: "published" })
        .project({ version: 1, publishedAt: 1 })
        .sort({ version: -1 })
        .limit(20)
        .toArray(),
      db
        .collection(COLLECTIONS.OUTBOX)
        .find({ status: { $ne: "sent" } })
        .limit(50)
        .toArray()
    ]);
    return {
      user: { email: user.email, role: user.role },
      content,
      services,
      settings,
      appointments,
      quotes,
      payments,
      refunds,
      advertisements,
      media,
      audit,
      versions,
      notifications,
      stripeMode: env.KLX_STRIPE_MODE
    };
  });
}
export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  return handle(async () => {
    const user = await requireAdmin(request);
    const { resource } = await context.params;
    const input: unknown = await request.json();
    const db = await getDb();
    if (resource === "content") {
      await saveDraftContent(contentSchema.parse(input), user.email);
      return { ok: true };
    }
    if (resource === "publish") return { version: await publishContent(user.email) };
    if (resource === "restore") {
      const { version } = z.object({ version: z.number().int() }).parse(input);
      const saved = await db
        .collection<KlxContent>(COLLECTIONS.CONTENT)
        .findOne({ version, status: "published" });
      if (!saved) throw new HttpError(404, "Version not found.");
      await saveDraftContent(saved.data, user.email);
      return { ok: true };
    }
    if (resource === "services") {
      const data = serviceSchema.parse(input);
      if (data.durationMinutes % 15 || (data.pricingMode === "deposit" && data.depositCents < 1))
        throw new HttpError(400, "Use a duration in 15-minute increments and a positive deposit.");
      await db
        .collection(COLLECTIONS.SERVICES)
        .updateOne(
          { id: data.id },
          { $set: { ...data, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
          { upsert: true }
        );
      await logAudit({
        actorEmail: user.email,
        action: "SERVICE_SAVED",
        entityType: "service",
        entityId: data.id,
        details: { priceCents: data.priceCents }
      });
      return { ok: true };
    }
    if (resource === "settings") {
      const data = settingsSchema.parse(input);
      await db
        .collection(COLLECTIONS.SETTINGS)
        .updateOne({}, { $set: { ...data, updatedAt: new Date() } }, { upsert: true });
      await logAudit({
        actorEmail: user.email,
        action: "SETTINGS_SAVED",
        entityType: "settings",
        entityId: "site",
        details: {}
      });
      return { ok: true };
    }
    if (resource === "transportation-pricing" || resource === "transportation_pricing") {
      const data = transportationPricingSchema.parse(input);
      await db
        .collection(COLLECTIONS.SETTINGS)
        .updateOne(
          {},
          { $set: { transportationPricing: data, updatedAt: new Date() } },
          { upsert: true }
        );
      await logAudit({
        actorEmail: user.email,
        action: "TRANSPORTATION_PRICING_UPDATED",
        entityType: "settings",
        entityId: "transportationPricing",
        details: data
      });
      return { ok: true, transportationPricing: data };
    }
    if (resource === "availability") {
      const scheduling = settingsSchema.shape.scheduling.parse(input);
      if (
        scheduling.openingTime &&
        scheduling.closingTime &&
        scheduling.openingTime >= scheduling.closingTime
      )
        throw new HttpError(400, "Closing time must be later than opening time.");
      await db
        .collection(COLLECTIONS.SETTINGS)
        .updateOne({}, { $set: { scheduling, updatedAt: new Date() } }, { upsert: true });
      await logAudit({
        actorEmail: user.email,
        action: "AVAILABILITY_UPDATED",
        entityType: "settings",
        entityId: "scheduling",
        details: {}
      });
      return { ok: true };
    }
    if (resource === "appointments") return manageAppointment(input, user.email);
    if (resource === "quotes") return createPaymentRequest(input, user.email);
    if (resource === "orders") {
      const data = z.object({ id: text, action: z.enum(["resend", "cancel"]) }).parse(input);
      return manageOrder(data.id, data.action, user.email);
    }
    if (resource === "refunds") {
      if (user.role !== "owner")
        throw new HttpError(403, "Owner permission is required to issue refunds.");
      const data = z
        .object({
          id: text,
          amountCents: cents.refine((n) => n > 0),
          reason: text,
          operationId: z.string().uuid()
        })
        .parse(input);
      return refundPayment(data.id, data.amountCents, data.reason, data.operationId, user.email);
    }
    if (resource === "reconcile") {
      const payments = await db
        .collection<KlxPayment>(COLLECTIONS.PAYMENTS)
        .find({ mode: env.KLX_STRIPE_MODE, stripeSessionId: { $exists: true } })
        .limit(200)
        .toArray();
      for (const payment of payments) {
        if (payment.stripeSessionId)
          await syncSession(
            await stripeClient().checkout.sessions.retrieve(payment.stripeSessionId)
          );
        if (payment.stripePaymentIntentId) await syncRefunds(payment);
      }
      return { ok: true };
    }
    if (resource === "advertisements") {
      const data = adSchema.parse(input);
      const id = data.id || randomUUID();
      const startDate = data.startDate ? new Date(data.startDate) : null;
      const endDate = data.endDate ? new Date(data.endDate) : null;
      if (
        (startDate && Number.isNaN(startDate.getTime())) ||
        (endDate && Number.isNaN(endDate.getTime())) ||
        (startDate && endDate && endDate.getTime() <= startDate.getTime())
      ) {
        throw new HttpError(
          400,
          "Invalid advertisement schedule: end date must be after start date."
        );
      }
      await db.collection(COLLECTIONS.ADVERTISEMENTS).updateOne(
        { id },
        {
          $set: { ...data, id, startDate, endDate, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
      await logAudit({
        actorEmail: user.email,
        action: "AD_SAVED",
        entityType: "advertisement",
        entityId: id,
        details: { active: data.isActive, title: data.title, placement: data.placement }
      });
      return { ok: true, id };
    }
    if (resource === "seed-advertisements") {
      for (const ad of DEFAULT_ADVERTISEMENTS) {
        const { createdAt, ...rest } = ad;
        await db.collection(COLLECTIONS.ADVERTISEMENTS).updateOne(
          { id: ad.id },
          {
            $set: { ...rest, updatedAt: new Date() },
            $setOnInsert: { createdAt: createdAt || new Date() }
          },
          { upsert: true }
        );
      }
      await logAudit({
        actorEmail: user.email,
        action: "ADS_SEEDED",
        entityType: "advertisement",
        entityId: "default",
        details: { count: DEFAULT_ADVERTISEMENTS.length }
      });
      return { ok: true, count: DEFAULT_ADVERTISEMENTS.length };
    }
    if (resource === "notifications") return processOutbox();
    throw new HttpError(404, "Unknown operation.");
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ resource: string }> }) {
  return handle(async () => {
    const user = await requireAdmin(request);
    const { resource } = await context.params;
    const url = new URL(request.url);
    let id: string | null | undefined = url.searchParams.get("id");
    if (!id) {
      try {
        const body = (await request.json()) as { id?: string };
        id = body?.id;
      } catch {
        // no body
      }
    }
    if (!id) throw new HttpError(400, "Item ID is required for deletion.");

    const db = await getDb();

    if (resource === "services") {
      const result = await db.collection(COLLECTIONS.SERVICES).deleteOne({
        $or: [{ id }, { serviceId: id }]
      });
      if (result.deletedCount === 0) throw new HttpError(404, "Service not found.");
      await logAudit({
        actorEmail: user.email,
        action: "SERVICE_DELETED",
        entityType: "service",
        entityId: id,
        details: {}
      });
      return { ok: true, id };
    }

    if (resource === "appointments") {
      const result = await db.collection(COLLECTIONS.APPOINTMENTS).deleteOne({
        $or: [{ id }, { reference: id }]
      });
      if (result.deletedCount === 0) throw new HttpError(404, "Appointment not found.");
      await logAudit({
        actorEmail: user.email,
        action: "APPOINTMENT_DELETED",
        entityType: "appointment",
        entityId: id,
        details: {}
      });
      return { ok: true, id };
    }

    if (resource === "advertisements") {
      const result = await db.collection(COLLECTIONS.ADVERTISEMENTS).deleteOne({ id });
      if (result.deletedCount === 0) throw new HttpError(404, "Advertisement not found.");
      await logAudit({
        actorEmail: user.email,
        action: "AD_DELETED",
        entityType: "advertisement",
        entityId: id,
        details: {}
      });
      return { ok: true, id };
    }

    if (resource === "quotes" || resource === "orders") {
      const result = await db.collection(COLLECTIONS.QUOTES).deleteOne({
        $or: [{ id }, { quoteNumber: id }]
      });
      if (result.deletedCount === 0) throw new HttpError(404, "Order not found.");
      await logAudit({
        actorEmail: user.email,
        action: "ORDER_DELETED",
        entityType: "quote",
        entityId: id,
        details: {}
      });
      return { ok: true, id };
    }

    if (resource === "payments") {
      const result = await db.collection(COLLECTIONS.PAYMENTS).deleteOne({
        $or: [{ id }, { stripePaymentIntentId: id }, { stripeSessionId: id }]
      });
      if (result.deletedCount === 0) throw new HttpError(404, "Payment record not found.");
      await logAudit({
        actorEmail: user.email,
        action: "PAYMENT_DELETED",
        entityType: "payment",
        entityId: id,
        details: {}
      });
      return { ok: true, id };
    }

    if (resource === "refunds") {
      if (user.role !== "owner")
        throw new HttpError(403, "Owner permission is required to delete refund records.");
      const result = await db.collection(COLLECTIONS.REFUNDS).deleteOne({ id });
      if (result.deletedCount === 0) throw new HttpError(404, "Refund record not found.");
      await logAudit({
        actorEmail: user.email,
        action: "REFUND_DELETED",
        entityType: "refund",
        entityId: id,
        details: {}
      });
      return { ok: true, id };
    }

    throw new HttpError(404, "Unknown resource for deletion.");
  });
}
