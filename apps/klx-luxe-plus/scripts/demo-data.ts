import { randomBytes } from "node:crypto";

import { env } from "../src/env";
import { localInstant, occupiedSlots } from "../src/server/appointments";
import { COLLECTIONS, getDb } from "../src/server/db/client";
import { DEFAULT_SERVICES, DEFAULT_SETTINGS } from "../src/server/db/defaults";
import { getServices } from "../src/server/db/repositories";
import type { KlxAppointment, KlxPayment, KlxQuote } from "../src/server/db/types";

// Called only by the temporary review server. Never connect this seed to production.
function requireReviewDatabase() {
  if (
    env.KLX_DB_NAME !== "klx_review" ||
    env.KLX_SITE_URL !== "http://127.0.0.1:5003" ||
    !/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\//.test(env.KLX_DATABASE_URL || "")
  ) {
    throw new Error("Demo data is restricted to the temporary local review database.");
  }
}

export async function seedReviewServices() {
  requireReviewDatabase();
  const db = await getDb();
  for (const service of DEFAULT_SERVICES) {
    await db.collection(COLLECTIONS.SERVICES).updateOne(
      { id: service.id },
      {
        $set: {
          ...service,
          pricingMode: "quote",
          priceCents: 0,
          depositCents: 0,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
  }
  process.stdout.write(
    "Demo services updated: all six services matching client card. All use consultation pricing.\n"
  );
}

export async function seedReviewDemo() {
  requireReviewDatabase();
  await seedReviewServices();
  const db = await getDb();
  await db.collection(COLLECTIONS.SETTINGS).updateOne(
    {},
    {
      $setOnInsert: {
        ...DEFAULT_SETTINGS,
        scheduling: {
          workingDays: [1, 2, 3, 4, 5, 6],
          blockedDates: [],
          openingTime: "09:00",
          closingTime: "17:00"
        }
      }
    },
    { upsert: true }
  );
  const services = (await getServices()).filter((service) => service.isVisible);
  const names = [
    "Alex Morgan",
    "Jamie Taylor",
    "Jordan Lee",
    "Casey Rivera",
    "Sam Parker",
    "Robin Chen"
  ];
  const statuses: KlxAppointment["status"][] = [
    "requested",
    "confirmed",
    "rescheduled",
    "completed",
    "cancelled",
    "requested"
  ];
  const now = new Date();
  for (let index = 0; index < names.length; index++) {
    const service = services[index % services.length];
    if (!service) break;
    const date = new Date(now.getTime() + (index + 1) * 86400000);
    if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
    const startsAt = localInstant(
      date.toISOString().slice(0, 10),
      `${10 + index}:00`,
      "America/New_York"
    );
    const appointment: KlxAppointment & {
      startsAt: Date;
      durationMinutes: number;
      occupiedSlots?: string[];
    } = {
      id: `demo-appointment-${index}`,
      reference: `DEMO-A${100 + index}`,
      serviceId: service.serviceId,
      serviceName: service.name,
      customerName: `${names[index]} (Demo)`,
      customerEmail: `demo${index + 1}@example.com`,
      customerPhone: "+1 (202) 555-0100",
      customerNotes: "Fictional review data — no actual customer or booking.",
      requestedDate: date.toISOString().slice(0, 10),
      requestedTimeSlot: `${10 + index}:00`,
      timezone: "America/New_York",
      status: statuses[index],
      startsAt,
      durationMinutes: service.durationMinutes,
      ...(["requested", "confirmed", "rescheduled"].includes(statuses[index])
        ? { occupiedSlots: occupiedSlots(startsAt, service.durationMinutes) }
        : {}),
      token: randomBytes(32).toString("hex"),
      createdAt: now,
      updatedAt: now
    };
    await db
      .collection(COLLECTIONS.APPOINTMENTS)
      .updateOne({ id: appointment.id }, { $setOnInsert: appointment }, { upsert: true });
  }
  const states: KlxQuote["status"][] = [
    "pending",
    "deposit_paid",
    "fully_paid",
    "cancelled",
    "expired"
  ];
  for (let index = 0; index < states.length; index++) {
    const quote: KlxQuote = {
      id: `demo-order-${index}`,
      quoteNumber: `DEMO-${200001 + index}`,
      appointmentId: `demo-appointment-${index}`,
      customerName: `${names[index]} (Demo)`,
      customerEmail: `demo${index + 1}@example.com`,
      serviceName: services[index % services.length]?.name || "Consultation",
      description:
        "DEMO ONLY — fictional agreed-price service. Do not pay. No Stripe transaction exists.",
      amountCents: 15000 + index * 5000,
      depositCents: index === 1 ? 5000 : 0,
      balanceCents: index === 2 ? 0 : index === 1 ? 15000 : 15000 + index * 5000,
      currency: "usd",
      status: states[index],
      token: randomBytes(32).toString("hex"),
      expiresAt: new Date(now.getTime() + (index === 4 ? -1 : 14) * 86400000),
      createdAt: now,
      updatedAt: now
    };
    await db
      .collection(COLLECTIONS.QUOTES)
      .updateOne({ id: quote.id }, { $setOnInsert: quote }, { upsert: true });
  }
  const paymentStates: KlxPayment["status"][] = [
    "paid",
    "partially_refunded",
    "refunded",
    "failed"
  ];
  for (let index = 0; index < paymentStates.length; index++) {
    const payment: KlxPayment = {
      id: `demo-payment-${index}`,
      quoteId: `demo-order-${index === 0 ? 1 : 2}`,
      customerEmail: `demo${index + 1}@example.com`,
      amountCents: 5000,
      refundedAmountCents: index === 1 ? 2000 : index === 2 ? 5000 : 0,
      currency: "usd",
      status: paymentStates[index],
      mode: "test",
      createdAt: now,
      updatedAt: now
    };
    await db
      .collection(COLLECTIONS.PAYMENTS)
      .updateOne({ id: payment.id }, { $setOnInsert: payment }, { upsert: true });
  }
  await db.collection(COLLECTIONS.ADVERTISEMENTS).updateOne(
    { id: "demo-ad" },
    {
      $setOnInsert: {
        id: "demo-ad",
        title: "Demo advertisement — your business here",
        imageUrl: "/images/klx-social-card.png",
        destinationUrl: "/#appointments",
        altText: "Demo advertising placement for KLX services",
        placement: "after_services",
        priority: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    },
    { upsert: true }
  );
  process.stdout.write(
    "Demo data ready: 6 appointments, 5 orders, 4 simulated payments, 1 advertisement. No emails or Stripe calls.\n"
  );
}
