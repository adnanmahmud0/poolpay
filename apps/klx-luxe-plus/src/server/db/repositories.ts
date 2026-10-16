import crypto from "node:crypto";

import { COLLECTIONS, getDb } from "./client";
import {
  DEFAULT_ADVERTISEMENTS,
  DEFAULT_SERVICES,
  DEFAULT_SETTINGS,
  DEFAULT_SITE_CONTENT
} from "./defaults";
import {
  AppointmentStatus,
  KlxAdvertisement,
  KlxAppointment,
  KlxAuditLog,
  KlxContent,
  KlxMedia,
  KlxOutbox,
  KlxPayment,
  KlxQuote,
  KlxRefund,
  KlxService,
  KlxSettings,
  SiteContentData
} from "./types";

// Content Management Repository
export async function getSiteContent(
  status: "published" | "draft" = "published"
): Promise<SiteContentData> {
  try {
    const db = await getDb();
    const doc = await db
      .collection<KlxContent>(COLLECTIONS.CONTENT)
      .findOne({ status }, { sort: { version: -1 } });

    if (doc?.data) {
      return { ...DEFAULT_SITE_CONTENT, ...doc.data };
    }

    if (status === "draft") {
      // If no draft exists, check for published
      const published = await db
        .collection<KlxContent>(COLLECTIONS.CONTENT)
        .findOne({ status: "published" }, { sort: { version: -1 } });
      if (published?.data) {
        return { ...DEFAULT_SITE_CONTENT, ...published.data };
      }
    }
  } catch (err) {
    console.warn("Could not retrieve site content from DB, returning defaults:", err);
  }
  return DEFAULT_SITE_CONTENT;
}

export async function saveDraftContent(data: SiteContentData, actorEmail: string): Promise<number> {
  const db = await getDb();
  const counter = await db
    .collection("klx_counters")
    .findOneAndUpdate(
      { key: "content" },
      { $inc: { value: 1 } },
      { upsert: true, returnDocument: "after" }
    );
  const nextVersion = Number(counter?.value);

  await db.collection<KlxContent>(COLLECTIONS.CONTENT).updateOne(
    { status: "draft" },
    {
      $set: {
        version: nextVersion,
        status: "draft",
        data,
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    { upsert: true }
  );

  await logAudit({
    actorEmail,
    action: "CONTENT_DRAFT_SAVED",
    entityType: "content",
    entityId: `v${nextVersion}`,
    details: { version: nextVersion }
  });

  return nextVersion;
}

export async function publishContent(actorEmail: string): Promise<number> {
  const db = await getDb();
  const draft = await db.collection<KlxContent>(COLLECTIONS.CONTENT).findOne({ status: "draft" });

  const contentToPublish = draft?.data || (await getSiteContent("published"));

  const counter = await db
    .collection("klx_counters")
    .findOneAndUpdate(
      { key: "content" },
      { $inc: { value: 1 } },
      { upsert: true, returnDocument: "after" }
    );
  const version = Number(counter?.value);

  await db.collection<KlxContent>(COLLECTIONS.CONTENT).insertOne({
    version,
    status: "published",
    publishedAt: new Date(),
    data: contentToPublish,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await logAudit({
    actorEmail,
    action: "CONTENT_PUBLISHED",
    entityType: "content",
    entityId: `v${version}`,
    details: { version }
  });

  return version;
}

// Services Repository
export async function getServices(includeHidden = false): Promise<KlxService[]> {
  try {
    const db = await getDb();
    const query = includeHidden ? {} : { isVisible: true };
    let docs: KlxService[] = await db
      .collection<KlxService>(COLLECTIONS.SERVICES)
      .find(query)
      .sort({ sortOrder: 1 })
      .toArray();

    // Auto-seed or supplement missing default services so all 6 services are always present in DB and results
    const allDbDocs = await db.collection<KlxService>(COLLECTIONS.SERVICES).find({}).toArray();
    const existingIds = new Set(allDbDocs.map((d) => d.serviceId || d.id));
    const missing = DEFAULT_SERVICES.filter(
      (def) => !existingIds.has(def.serviceId) && !existingIds.has(def.id)
    );
    if (missing.length > 0) {
      try {
        for (const m of missing) {
          await db
            .collection<KlxService>(COLLECTIONS.SERVICES)
            .updateOne({ id: m.id }, { $setOnInsert: m }, { upsert: true });
        }
      } catch (err) {
        console.warn("Could not auto-seed missing services to DB:", err);
      }
      if (includeHidden) {
        docs = [...docs, ...missing];
      } else {
        docs = [...docs, ...missing.filter((s) => s.isVisible)];
      }
      docs.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }

    if (docs.length > 0 || allDbDocs.length > 0) {
      return docs;
    }
  } catch (err) {
    console.warn("Could not retrieve services from DB, falling back to defaults:", err);
  }

  return (includeHidden ? DEFAULT_SERVICES : DEFAULT_SERVICES.filter((s) => s.isVisible)).map(
    (s) => ({
      ...s,
      _id: undefined
    })
  );
}

export async function initServicesIfEmpty(): Promise<void> {
  try {
    const db = await getDb();
    for (const service of DEFAULT_SERVICES) {
      await db
        .collection<KlxService>(COLLECTIONS.SERVICES)
        .updateOne({ id: service.id }, { $setOnInsert: service }, { upsert: true });
    }
  } catch (err) {
    console.warn("Could not seed default services:", err);
  }
}

export async function updateService(
  id: string,
  updates: Partial<KlxService>,
  actorEmail: string
): Promise<boolean> {
  const db = await getDb();
  const res = await db.collection<KlxService>(COLLECTIONS.SERVICES).updateOne(
    { id },
    {
      $set: {
        ...updates,
        updatedAt: new Date()
      }
    }
  );

  await logAudit({
    actorEmail,
    action: "SERVICE_UPDATED",
    entityType: "service",
    entityId: id,
    details: updates
  });

  return res.matchedCount > 0;
}

// Appointments Repository
export async function createAppointment(
  data: Omit<
    KlxAppointment,
    "_id" | "id" | "reference" | "token" | "status" | "createdAt" | "updatedAt"
  >
): Promise<KlxAppointment> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const reference = `KLX-APT-${Date.now().toString().slice(-4)}-${randNum}`;
  const token = crypto.randomBytes(24).toString("hex");

  const appointment: KlxAppointment = {
    ...data,
    id,
    reference,
    token,
    status: "requested",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.collection<KlxAppointment>(COLLECTIONS.APPOINTMENTS).insertOne(appointment);

  // Enqueue notification to business and customer
  await enqueueOutbox({
    type: "appointment_requested",
    recipient: appointment.customerEmail,
    subject: `Appointment Request Received — ${appointment.reference}`,
    bodyHtml: `<p>Dear ${appointment.customerName},</p><p>We have received your appointment request for <strong>${appointment.serviceName}</strong> on <strong>${appointment.requestedDate} at ${appointment.requestedTimeSlot} (${appointment.timezone})</strong>.</p><p>Reference: <strong>${appointment.reference}</strong></p><p>Our team will review your request and confirm shortly.</p><p>Best regards,<br/>KLX LUXE PLUS LLC</p>`,
    bodyText: `Dear ${appointment.customerName},\n\nWe have received your appointment request for ${appointment.serviceName} on ${appointment.requestedDate} at ${appointment.requestedTimeSlot} (${appointment.timezone}).\nReference: ${appointment.reference}\n\nOur team will review your request and confirm shortly.\n\nKLX LUXE PLUS LLC`
  });

  return appointment;
}

export async function getAppointments(
  filter: { status?: AppointmentStatus } = {}
): Promise<KlxAppointment[]> {
  const db = await getDb();
  return db
    .collection<KlxAppointment>(COLLECTIONS.APPOINTMENTS)
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getAppointmentById(id: string): Promise<KlxAppointment | null> {
  const db = await getDb();
  return db.collection<KlxAppointment>(COLLECTIONS.APPOINTMENTS).findOne({ id });
}

export async function getAppointmentByToken(token: string): Promise<KlxAppointment | null> {
  const db = await getDb();
  return db
    .collection<KlxAppointment>(COLLECTIONS.APPOINTMENTS)
    .findOne({ token, createdAt: { $gt: new Date(Date.now() - 90 * 86400000) } });
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  adminNotes?: string,
  actorEmail?: string
): Promise<boolean> {
  const db = await getDb();
  const apt = await db.collection<KlxAppointment>(COLLECTIONS.APPOINTMENTS).findOne({ id });
  if (!apt) return false;

  await db.collection<KlxAppointment>(COLLECTIONS.APPOINTMENTS).updateOne(
    { id },
    {
      $set: {
        status,
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        updatedAt: new Date()
      }
    }
  );

  if (actorEmail) {
    await logAudit({
      actorEmail,
      action: `APPOINTMENT_${status.toUpperCase()}`,
      entityType: "appointment",
      entityId: id,
      details: { status, adminNotes }
    });
  }

  if (status === "confirmed") {
    await enqueueOutbox({
      type: "appointment_confirmed",
      recipient: apt.customerEmail,
      subject: `Appointment Confirmed — ${apt.reference}`,
      bodyHtml: `<p>Dear ${apt.customerName},</p><p>Your appointment for <strong>${apt.serviceName}</strong> has been <strong>CONFIRMED</strong> for <strong>${apt.requestedDate} at ${apt.requestedTimeSlot} (${apt.timezone})</strong>.</p><p>${adminNotes ? `Note: ${adminNotes}` : ""}</p><p>We look forward to serving you.<br/>KLX LUXE PLUS LLC</p>`,
      bodyText: `Dear ${apt.customerName},\n\nYour appointment for ${apt.serviceName} has been CONFIRMED for ${apt.requestedDate} at ${apt.requestedTimeSlot} (${apt.timezone}).\n\nKLX LUXE PLUS LLC`
    });
  }

  return true;
}

// Quotes & Orders
export async function createQuote(
  data: Omit<KlxQuote, "_id" | "id" | "quoteNumber" | "status" | "createdAt" | "updatedAt">,
  actorEmail: string
): Promise<KlxQuote> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const quoteNumber = `KLX-QUO-${Date.now().toString().slice(-4)}-${randNum}`;

  const quote: KlxQuote = {
    ...data,
    id,
    quoteNumber,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.collection<KlxQuote>(COLLECTIONS.QUOTES).insertOne(quote);

  await logAudit({
    actorEmail,
    action: "QUOTE_CREATED",
    entityType: "quote",
    entityId: id,
    details: { quoteNumber, amountCents: quote.amountCents, customerEmail: quote.customerEmail }
  });

  return quote;
}

export async function getQuotes(): Promise<KlxQuote[]> {
  const db = await getDb();
  return db.collection<KlxQuote>(COLLECTIONS.QUOTES).find({}).sort({ createdAt: -1 }).toArray();
}

export async function getQuoteById(id: string): Promise<KlxQuote | null> {
  const db = await getDb();
  return db.collection<KlxQuote>(COLLECTIONS.QUOTES).findOne({ id });
}

// Payments & Refunds
export async function getPayments(): Promise<KlxPayment[]> {
  const db = await getDb();
  return db.collection<KlxPayment>(COLLECTIONS.PAYMENTS).find({}).sort({ createdAt: -1 }).toArray();
}

export async function getPaymentById(id: string): Promise<KlxPayment | null> {
  const db = await getDb();
  return db.collection<KlxPayment>(COLLECTIONS.PAYMENTS).findOne({ id });
}

export async function getRefunds(): Promise<KlxRefund[]> {
  const db = await getDb();
  return db.collection<KlxRefund>(COLLECTIONS.REFUNDS).find({}).sort({ createdAt: -1 }).toArray();
}

// Advertisements Repository
export async function getAds(
  placement?: "after_hero" | "after_services",
  activeOnly = true
): Promise<KlxAdvertisement[]> {
  try {
    const db = await getDb();
    const query: import("mongodb").Filter<KlxAdvertisement> = {};
    if (placement) query.placement = placement;
    if (activeOnly) {
      query.isActive = true;
      const now = new Date();
      query.$and = [
        {
          $or: [
            { startDate: null },
            { startDate: { $exists: false } },
            { startDate: { $lte: now } }
          ]
        },
        {
          $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gt: now } }]
        }
      ];
    }

    return await db
      .collection<KlxAdvertisement>(COLLECTIONS.ADVERTISEMENTS)
      .find(query)
      .sort({ priority: -1, createdAt: -1 })
      .toArray();
  } catch (err) {
    console.warn("Could not retrieve advertisements:", err);
    return [];
  }
}

export async function initAdvertisementsIfEmpty(): Promise<void> {
  try {
    const db = await getDb();
    const count = await db
      .collection<KlxAdvertisement>(COLLECTIONS.ADVERTISEMENTS)
      .countDocuments();
    if (count === 0) {
      for (const ad of DEFAULT_ADVERTISEMENTS) {
        await db
          .collection<KlxAdvertisement>(COLLECTIONS.ADVERTISEMENTS)
          .updateOne(
            { id: ad.id },
            { $setOnInsert: { ...ad, createdAt: new Date(), updatedAt: new Date() } },
            { upsert: true }
          );
      }
    }
  } catch (err) {
    console.warn("Could not seed default advertisements:", err);
  }
}

export async function saveAd(
  data: Omit<KlxAdvertisement, "_id" | "id" | "createdAt" | "updatedAt">,
  actorEmail: string,
  existingId?: string
): Promise<string> {
  const db = await getDb();
  if (existingId) {
    await db.collection<KlxAdvertisement>(COLLECTIONS.ADVERTISEMENTS).updateOne(
      { id: existingId },
      {
        $set: {
          ...data,
          updatedAt: new Date()
        }
      }
    );
    await logAudit({
      actorEmail,
      action: "AD_UPDATED",
      entityType: "advertisement",
      entityId: existingId,
      details: data
    });
    return existingId;
  }

  const id = crypto.randomUUID();
  const ad: KlxAdvertisement = {
    ...data,
    id,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  await db.collection<KlxAdvertisement>(COLLECTIONS.ADVERTISEMENTS).insertOne(ad);

  await logAudit({
    actorEmail,
    action: "AD_CREATED",
    entityType: "advertisement",
    entityId: id,
    details: data
  });

  return id;
}

export async function deleteAd(id: string, actorEmail: string): Promise<boolean> {
  const db = await getDb();
  const res = await db.collection<KlxAdvertisement>(COLLECTIONS.ADVERTISEMENTS).deleteOne({ id });
  await logAudit({
    actorEmail,
    action: "AD_DELETED",
    entityType: "advertisement",
    entityId: id,
    details: {}
  });
  return res.deletedCount > 0;
}

// Settings Repository
export async function getSettings(): Promise<KlxSettings> {
  try {
    const db = await getDb();
    const doc = await db.collection<KlxSettings>(COLLECTIONS.SETTINGS).findOne({});
    if (doc) return { ...DEFAULT_SETTINGS, ...doc };
  } catch (err) {
    console.warn("Could not get settings from DB, returning defaults:", err);
  }
  return DEFAULT_SETTINGS as KlxSettings;
}

export async function updateSettings(
  updates: Partial<KlxSettings>,
  actorEmail: string
): Promise<void> {
  const db = await getDb();
  await db.collection<KlxSettings>(COLLECTIONS.SETTINGS).updateOne(
    {},
    {
      $set: {
        ...updates,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  await logAudit({
    actorEmail,
    action: "SETTINGS_UPDATED",
    entityType: "settings",
    entityId: "global",
    details: updates
  });
}

// Media Repository
export async function getMediaLibrary(): Promise<KlxMedia[]> {
  try {
    const db = await getDb();
    return await db
      .collection<KlxMedia>(COLLECTIONS.MEDIA)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
  } catch (err) {
    console.warn("Could not retrieve media:", err);
    return [];
  }
}

export async function saveMediaItem(
  media: Omit<KlxMedia, "_id">,
  actorEmail: string
): Promise<void> {
  const db = await getDb();
  await db.collection<KlxMedia>(COLLECTIONS.MEDIA).insertOne(media);
  await logAudit({
    actorEmail,
    action: "MEDIA_UPLOADED",
    entityType: "media",
    entityId: media.id,
    details: { filename: media.filename, size: media.size }
  });
}

// Outbox Repository
export async function enqueueOutbox(
  item: Omit<KlxOutbox, "_id" | "id" | "status" | "attempts" | "createdAt">,
  id: string = crypto.randomUUID()
): Promise<string> {
  try {
    const db = await getDb();
    const outboxItem: KlxOutbox = {
      ...item,
      id,
      status: "pending",
      attempts: 0,
      createdAt: new Date()
    };
    await db
      .collection<KlxOutbox>(COLLECTIONS.OUTBOX)
      .updateOne({ id }, { $setOnInsert: outboxItem }, { upsert: true });
    return id;
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === 11000) return id;
    throw new Error("Notification could not be queued.");
  }
}

export async function getPendingOutbox(limit = 10): Promise<KlxOutbox[]> {
  try {
    const db = await getDb();
    return await db
      .collection<KlxOutbox>(COLLECTIONS.OUTBOX)
      .find({ status: "pending", attempts: { $lt: 5 } })
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();
  } catch {
    return [];
  }
}

export async function markOutboxProcessed(
  id: string,
  success: boolean,
  lastError?: string
): Promise<void> {
  try {
    const db = await getDb();
    await db.collection<KlxOutbox>(COLLECTIONS.OUTBOX).updateOne(
      { id },
      {
        $set: {
          status: success ? "sent" : "failed",
          ...(lastError ? { lastError } : {}),
          processedAt: new Date()
        },
        $inc: { attempts: 1 }
      }
    );
  } catch (err) {
    console.warn("Could not update outbox status:", err);
  }
}

// Audit Log Repository
export async function logAudit(
  entry: Omit<KlxAuditLog, "_id" | "id" | "createdAt">
): Promise<void> {
  try {
    const db = await getDb();
    const id = crypto.randomUUID();
    const doc: KlxAuditLog = {
      ...entry,
      id,
      createdAt: new Date()
    };
    await db.collection<KlxAuditLog>(COLLECTIONS.AUDIT_LOG).insertOne(doc);
  } catch (err) {
    console.warn("Could not write audit log entry:", err);
  }
}

export async function getAuditLogs(limit = 100): Promise<KlxAuditLog[]> {
  try {
    const db = await getDb();
    return await db
      .collection<KlxAuditLog>(COLLECTIONS.AUDIT_LOG)
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  } catch {
    return [];
  }
}
