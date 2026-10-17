import { randomBytes, randomUUID } from "node:crypto";

import { env } from "@/env";

import { createPaymentRequest } from "./commerce";
import { COLLECTIONS, getDb } from "./db/client";
import { DEFAULT_SERVICES } from "./db/defaults";
import { enqueueOutbox, getSettings, logAudit } from "./db/repositories";
import type { KlxAppointment, KlxService } from "./db/types";
import {
  renderAdminAppointmentRequestEmail,
  renderCustomerAppointmentConfirmedEmail,
  renderCustomerAppointmentDeclinedEmail,
  renderCustomerAppointmentReceivedEmail
} from "./emailTemplates";
import { HttpError } from "./http";
import { processOutbox } from "./mail";
import { queueIntents, type NotificationIntent } from "./notifications";
import { appointmentSchema, appointmentUpdateSchema } from "./validation";

async function appointmentResult(appointment: KlxAppointment) {
  if (!appointment.servicePriceCents) return { reference: appointment.reference, paymentUrl: "" };
  const quote = await createPaymentRequest(
    {
      requestId: appointment.id,
      appointmentId: appointment.id,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      serviceName: appointment.serviceName,
      description: `Payment for ${appointment.serviceName}. Appointment time remains subject to confirmation.`,
      amountCents: appointment.servicePriceCents,
      depositCents: appointment.serviceDepositCents || 0,
      expiresInDays: 14
    },
    "system"
  );
  return { reference: appointment.reference, paymentUrl: quote.link };
}

export function localInstant(date: string, time: string, timezone: string) {
  const target = Date.parse(`${date}T${time}:00Z`);
  let instant = target;
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });
  for (let i = 0; i < 3; i++) {
    const formatted = formatter.format(new Date(instant)).replace(" ", "T");
    instant += target - Date.parse(`${formatted}:00Z`);
  }
  if (formatter.format(new Date(instant)).replace(" ", "T") !== `${date}T${time}`)
    throw new HttpError(400, "This local time does not exist. Choose another time.");
  return new Date(instant);
}
export function occupiedSlots(start: Date, duration: number) {
  return Array.from(
    { length: Math.ceil(duration / 15) },
    (_, i) => `${Math.floor(start.getTime() / 900000) + i}`
  );
}
const minuteOfDay = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

export function fitsSchedule(
  date: string,
  time: string,
  duration: number,
  schedule: Awaited<ReturnType<typeof getSettings>>["scheduling"]
) {
  const minutes = minuteOfDay(time);
  return (
    !schedule.blockedDates.includes(date) &&
    schedule.workingDays.includes(new Date(date).getUTCDay()) &&
    minutes % 15 === 0 &&
    minutes >= minuteOfDay(schedule.openingTime || "00:00") &&
    minutes + duration <= (schedule.closingTime ? minuteOfDay(schedule.closingTime) : 1440)
  );
}
async function resolveService(
  db: Awaited<ReturnType<typeof getDb>>,
  serviceId: string
): Promise<KlxService | null> {
  let service: KlxService | null = await db
    .collection<KlxService>(COLLECTIONS.SERVICES)
    .findOne({ $or: [{ id: serviceId }, { serviceId: serviceId }], isVisible: true });
  if (!service) {
    const fallback = DEFAULT_SERVICES.find(
      (s) => (s.id === serviceId || s.serviceId === serviceId) && s.isVisible
    );
    if (fallback) {
      service = fallback as unknown as KlxService;
      try {
        await db
          .collection<KlxService>(COLLECTIONS.SERVICES)
          .updateOne({ id: fallback.id }, { $setOnInsert: fallback }, { upsert: true });
      } catch {
        /* ignore background seed error */
      }
    }
  }
  return service;
}

export async function availableTimes(date: string, serviceId: string) {
  const db = await getDb();
  const settings = await getSettings();
  const service = await resolveService(db, serviceId);
  if (!service) throw new HttpError(400, "Choose an available service.");
  const dayStart = localInstant(date, "00:00", settings.timezone);
  const lower = Math.floor(dayStart.getTime() / 900000) - 96;
  const candidates = await db
    .collection(COLLECTIONS.APPOINTMENTS)
    .find(
      {
        status: { $in: ["requested", "confirmed", "rescheduled"] },
        startsAt: {
          $gte: new Date(lower * 900000),
          $lt: new Date(dayStart.getTime() + 2 * 86400000)
        }
      },
      { projection: { occupiedSlots: 1, startsAt: 1, durationMinutes: 1 } }
    )
    .toArray();
  const taken = new Set(
    candidates.flatMap(
      (record) =>
        record.occupiedSlots || occupiedSlots(record.startsAt, record.durationMinutes || 60)
    )
  );
  const slots: string[] = [];
  for (let minute = 0; minute < 1440; minute += 15) {
    const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    if (!fitsSchedule(date, time, service.durationMinutes, settings.scheduling)) continue;
    try {
      const start = localInstant(date, time, settings.timezone);
      if (
        start.getTime() > Date.now() &&
        occupiedSlots(start, service.durationMinutes).every((slot) => !taken.has(slot))
      )
        slots.push(time);
    } catch {
      /* Nonexistent daylight-saving times are unavailable. */
    }
  }
  return { slots, timezone: settings.timezone, durationMinutes: service.durationMinutes };
}
export async function requestAppointment(input: unknown) {
  const data = appointmentSchema.parse(input);
  const db = await getDb();
  const settings = await getSettings();
  const service = await resolveService(db, data.serviceId);
  if (!service) throw new HttpError(400, "Please choose an available service.");
  const startsAt = localInstant(data.requestedDate, data.requestedTimeSlot, settings.timezone);
  const schedule = settings.scheduling;
  if (
    !fitsSchedule(data.requestedDate, data.requestedTimeSlot, service.durationMinutes, schedule) ||
    schedule.blockedDates.includes(data.requestedDate) ||
    !schedule.workingDays.includes(new Date(data.requestedDate).getUTCDay()) ||
    (schedule.openingTime && data.requestedTimeSlot < schedule.openingTime) ||
    (schedule.closingTime && data.requestedTimeSlot >= schedule.closingTime)
  )
    throw new HttpError(400, "This time is outside the available appointment request schedule.");
  if (startsAt.getTime() <= Date.now()) throw new HttpError(400, "Choose a future date and time.");
  const id = data.requestId || randomUUID();
  const existing = await db.collection<KlxAppointment>(COLLECTIONS.APPOINTMENTS).findOne({ id });
  if (existing) {
    await queueIntents(COLLECTIONS.APPOINTMENTS, id).catch(() => undefined);
    return appointmentResult(existing);
  }
  if (
    !(await availableTimes(data.requestedDate, service.id)).slots.includes(data.requestedTimeSlot)
  )
    throw new HttpError(409, "This time is no longer available. Choose another time.");
  const priceCents =
    service.pricingMode === "quote"
      ? data.payNow && data.estimatedFareCents
        ? data.estimatedFareCents
        : 0
      : service.priceCents;

  const adminToken = randomBytes(32).toString("hex");

  const appointment: KlxAppointment = {
    ...data,
    id,
    reference: `KLX-${id.replaceAll("-", "").slice(0, 12).toUpperCase()}`,
    serviceName: service.name,
    timezone: settings.timezone,
    status: "requested",
    servicePriceCents: priceCents,
    serviceDepositCents: service.pricingMode === "deposit" ? service.depositCents : 0,
    token: randomBytes(32).toString("hex"),
    adminToken,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const adminEmail = renderAdminAppointmentRequestEmail({
    appointment,
    service,
    settings,
    siteUrl: env.KLX_SITE_URL
  });

  const customerEmail = renderCustomerAppointmentReceivedEmail({
    appointment,
    service,
    settings,
    siteUrl: env.KLX_SITE_URL
  });

  const notificationIntents: NotificationIntent[] = [
    {
      id: `appointment-${id}-customer`,
      type: "appointment_requested",
      recipient: data.customerEmail,
      replyTo: "no-reply",
      subject: customerEmail.subject,
      bodyHtml: customerEmail.html,
      bodyText: customerEmail.text
    }
  ];
  if (settings.notificationSettings.emailOnRequest)
    notificationIntents.push({
      id: `appointment-${id}-business`,
      type: "appointment_requested",
      recipient: settings.supportEmail,
      replyTo: "no-reply",
      noReply: true,
      subject: adminEmail.subject,
      bodyHtml: adminEmail.html,
      bodyText: adminEmail.text
    });
  try {
    await db.collection(COLLECTIONS.APPOINTMENTS).updateOne(
      { id },
      {
        $setOnInsert: {
          ...appointment,
          startsAt,
          durationMinutes: service.durationMinutes,
          occupiedSlots: occupiedSlots(startsAt, service.durationMinutes),
          notificationIntents,
          notificationQueued: false
        }
      },
      { upsert: true }
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000)
      throw new HttpError(409, "This time was just booked. Please choose another available time.");
    throw error;
  }
  // A durable intent survives interruption between saving the request and creating its email jobs.
  await queueIntents(COLLECTIONS.APPOINTMENTS, id).catch(() => undefined);
  void processOutbox().catch(() => undefined);
  return appointmentResult(appointment);
}
export async function manageAppointment(input: unknown, actorEmail: string) {
  const data = appointmentUpdateSchema.parse(input);
  const db = await getDb();
  const appointment = await db
    .collection<KlxAppointment & { durationMinutes: number }>(COLLECTIONS.APPOINTMENTS)
    .findOne({ id: data.id });
  if (!appointment) throw new HttpError(404, "Appointment not found.");
  const durationMinutes = data.durationMinutes || appointment.durationMinutes || 60;
  appointment.durationMinutes = durationMinutes;
  if (data.status === "declined" && !data.rejectionReason)
    throw new HttpError(400, "Enter a reason for rejecting this appointment.");
  const startsAt = localInstant(data.requestedDate, data.requestedTimeSlot, appointment.timezone);
  const preferences = await getSettings();
  const reserving = ["requested", "confirmed", "rescheduled"].includes(data.status);
  if (
    reserving &&
    (!fitsSchedule(
      data.requestedDate,
      data.requestedTimeSlot,
      durationMinutes,
      preferences.scheduling
    ) ||
      startsAt <= new Date())
  )
    throw new HttpError(400, "Choose a future time within working hours, excluding off days.");
  if (["confirmed", "rescheduled"].includes(data.status) && startsAt.getMinutes() % 15 !== 0)
    throw new HttpError(400, "Choose a quarter-hour time.");
  const slots = reserving ? occupiedSlots(startsAt, durationMinutes) : [];
  try {
    await db.collection(COLLECTIONS.APPOINTMENTS).updateOne(
      { id: data.id },
      {
        $set: {
          ...data,
          durationMinutes,
          startsAt,
          updatedAt: new Date(),
          ...(reserving ? { occupiedSlots: slots } : {})
        },
        ...(!reserving ? { $unset: { occupiedSlots: "" } } : {})
      }
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000)
      throw new HttpError(409, "This time overlaps a confirmed appointment.");
    throw error;
  }
  await logAudit({
    actorEmail,
    action: "APPOINTMENT_UPDATED",
    entityType: "appointment",
    entityId: data.id,
    details: { status: data.status, durationMinutes }
  });
  if (preferences.notificationSettings.emailOnConfirm) {
    if (data.status === "confirmed") {
      const email = renderCustomerAppointmentConfirmedEmail({
        appointment: { ...appointment, ...data, durationMinutes },
        durationMinutes,
        adminNotes: data.adminNotes,
        settings: preferences,
        siteUrl: env.KLX_SITE_URL
      });
      await enqueueOutbox({
        type: "appointment_confirmed",
        recipient: appointment.customerEmail,
        subject: email.subject,
        bodyHtml: email.html,
        bodyText: email.text
      });
    } else if (data.status === "declined") {
      const email = renderCustomerAppointmentDeclinedEmail({
        appointment: { ...appointment, ...data },
        rejectionReason: data.rejectionReason,
        settings: preferences,
        siteUrl: env.KLX_SITE_URL
      });
      await enqueueOutbox({
        type: "appointment_confirmed",
        recipient: appointment.customerEmail,
        subject: email.subject,
        bodyHtml: email.html,
        bodyText: email.text
      });
    }
  }
  void processOutbox().catch(() => undefined);
  return { ok: true };
}
