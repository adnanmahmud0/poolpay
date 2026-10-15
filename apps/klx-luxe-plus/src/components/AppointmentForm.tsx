"use client";

import { useRef, useState } from "react";

import { ArrowUpRight, CalendarDays, CheckCircle2 } from "lucide-react";

import { Button } from "@repo/ui";

import type { KlxService } from "@/server/db/types";

import { AppointmentTimes } from "./AppointmentTimes";

export function AppointmentForm({
  services,
  timezone
}: {
  services: KlxService[];
  timezone: string;
}) {
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const requestId = useRef("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (!requestId.current) requestId.current = crypto.randomUUID();
    data.requestId = requestId.current;
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setReference(result.reference);
      setPaymentUrl(result.paymentUrl || "");
      requestId.current = "";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
      setAvailabilityVersion((value) => value + 1);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id="appointments"
      className="section-shell my-24 grid overflow-hidden rounded-[32px] bg-[#14283b] text-white lg:grid-cols-[0.85fr_1.15fr]"
    >
      <div className="p-7 sm:p-12 lg:p-14" data-reveal>
        <CalendarDays className="mb-8 size-9 text-sky-300" />
        <p className="eyebrow mb-5 text-sky-200">YOUR NEXT STEP STARTS HERE</p>
        <h2>
          A little time.
          <br />A lot of
          <br />
          <span className="text-sky-300">possibilities.</span>
        </h2>
        <p className="mt-6 max-w-xs text-sm leading-7 text-slate-300">
          Tell us what you need and when works for you. Our team will review your request and
          confirm availability.
        </p>
        <p className="mt-8 text-xs text-sky-200">
          Appointments use {timezone.replaceAll("_", " ")}.
        </p>
      </div>
      <div className="m-3 rounded-[24px] bg-white p-6 text-slate-800 sm:m-6 sm:p-9">
        {reference ? (
          <div className="flex min-h-96 flex-col items-start justify-center" role="status">
            <CheckCircle2 className="mb-5 size-10 text-emerald-600" />
            <h3 className="text-2xl font-semibold">Request received.</h3>
            <p className="mt-4 text-sm leading-7">
              Your reference is <strong>{reference}</strong>. Your requested time is awaiting
              confirmation from our team.
            </p>
            {paymentUrl && (
              <Button asChild className="mt-6">
                <a href={paymentUrl}>
                  Review price and pay online
                  <ArrowUpRight />
                </a>
              </Button>
            )}
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => {
                setReference("");
                setPaymentUrl("");
              }}
            >
              Make another request
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              Service
              <select
                name="serviceId"
                required
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                className="klx-input mt-2"
              >
                {services.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Your name
              <input
                name="customerName"
                required
                maxLength={100}
                autoComplete="name"
                className="klx-input mt-2"
              />
            </label>
            <label>
              Email
              <input
                name="customerEmail"
                type="email"
                required
                autoComplete="email"
                className="klx-input mt-2"
              />
            </label>
            <label>
              Phone
              <input
                name="customerPhone"
                type="tel"
                required
                minLength={7}
                maxLength={40}
                autoComplete="tel"
                className="klx-input mt-2"
              />
            </label>
            <label>
              Preferred date
              <input
                name="requestedDate"
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="klx-input mt-2"
              />
            </label>
            <AppointmentTimes key={availabilityVersion} date={date} serviceId={serviceId} />
            <label className="sm:col-span-2">
              Anything we should know? <span className="text-slate-400">(optional)</span>
              <textarea
                name="customerNotes"
                maxLength={2000}
                rows={3}
                className="klx-input mt-2"
                placeholder="Please do not include sensitive documents or financial details."
              />
            </label>
            <div className="hidden" aria-hidden="true">
              <input name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <p className="text-xs leading-5 text-slate-500 sm:col-span-2">
              Submitting requests an appointment; it does not confirm a booking. We use these
              details to respond to your request.
            </p>
            {message && (
              <p role="alert" className="text-sm text-red-700 sm:col-span-2">
                {message}
              </p>
            )}
            <Button type="submit" disabled={busy} className="h-12 sm:col-span-2">
              {busy ? "Sending…" : "Request an appointment"}
              <ArrowUpRight className="size-4" />
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
