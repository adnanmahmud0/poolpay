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
import {
  getServices,
  getSettings,
  getSiteContent,
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
  text
} from "@/server/validation";

export const runtime = "nodejs";

export async function GET() {
  return handle(async () => {
    const user = await requireAdmin();
    const db = await getDb();
    await initServicesIfEmpty();
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
        (startDate && endDate && endDate <= startDate)
      )
        throw new HttpError(400, "Invalid advertisement schedule.");
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
        details: { active: data.isActive }
      });
      return { ok: true };
    }
    if (resource === "notifications") return processOutbox();
    throw new HttpError(404, "Unknown operation.");
  });
}
