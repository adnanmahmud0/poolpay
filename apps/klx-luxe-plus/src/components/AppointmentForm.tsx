"use client";

import { useEffect, useRef, useState } from "react";

import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  Languages,
  Mic,
  ShieldCheck,
  Sparkles
} from "lucide-react";

import { Button } from "@repo/ui";

import type { AttachedDocument, KlxService } from "@/server/db/types";

import { AppointmentTimes } from "./AppointmentTimes";
import { DocumentUploader } from "./DocumentUploader";
import { TransportationBooking, VEHICLE_TIERS } from "./TransportationBooking";

const COMMON_LANGUAGES = [
  "English",
  "Spanish (Español)",
  "Haitian Creole (Kreyòl)",
  "French (Français)",
  "Portuguese (Português)",
  "Arabic (العربية)",
  "Mandarin Chinese (中文)",
  "Russian (Русский)",
  "Vietnamese (Tiếng Việt)",
  "Other"
];

const TRANSLATION_REASONS = [
  "Immigration (USCIS)",
  "Court / Legal Proceedings",
  "Academic / University Evaluation",
  "Employment / Work Authorization",
  "Personal Records & Identification",
  "Other"
];

const COMMON_DOC_TYPES = [
  "Birth Certificate",
  "Marriage Certificate",
  "Divorce Decree",
  "Passport / ID",
  "Academic Diploma / Transcripts",
  "Court Records / Judgments",
  "Medical Records",
  "Affidavit / Legal Document"
];

const INTERPRETATION_SETTINGS = [
  "Court Hearing / Trial",
  "USCIS Asylum / Green Card Interview",
  "Medical Appointment / Hospital",
  "Legal Deposition / Attorney Consultation",
  "Business Conference / Meeting",
  "Remote Phone / Zoom Conference"
];

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

  // Interpreter & Translation Language States
  const [sourceLang, setSourceLang] = useState("Spanish (Español)");
  const [targetLang, setTargetLang] = useState("English");
  const [customSourceLang, setCustomSourceLang] = useState("");
  const [customTargetLang, setCustomTargetLang] = useState("");
  const [interpSetting, setInterpSetting] = useState(INTERPRETATION_SETTINGS[0]!);

  // Translation Reason & Documents
  const [transReason, setTransReason] = useState(TRANSLATION_REASONS[0]!);
  const [customReason, setCustomReason] = useState("");
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>(["Birth Certificate"]);
  const [attachedDocs, setAttachedDocs] = useState<AttachedDocument[]>([]);

  // Transportation States
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [vehicleClass, setVehicleClass] = useState("executive_sedan");
  const [passengers, setPassengers] = useState(1);
  const [payNow, setPayNow] = useState(true);

  // Sync service from URL hash if clicked from service card
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.includes("service=")) {
        const target = hash.split("service=")[1]?.split("&")[0];
        const match = services.find((s) => s.serviceId === target || s.id === target);
        if (match) setServiceId(match.id);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [services]);

  const activeService = services.find((s) => s.id === serviceId) || services[0];
  const serviceKey = activeService?.serviceId || "";
  const serviceNameLower = activeService?.name.toLowerCase() || "";

  const isInterpreter = serviceKey === "interpreter" || serviceNameLower.includes("interpreter");
  const isTranslation = serviceKey === "translations" || serviceNameLower.includes("translation");
  const isTransportation = serviceKey === "transport" || serviceNameLower.includes("transport");

  const effectiveSourceLang = sourceLang === "Other" ? customSourceLang || "Other" : sourceLang;
  const effectiveTargetLang = targetLang === "Other" ? customTargetLang || "Other" : targetLang;
  const effectiveReason = transReason === "Other" ? customReason || "Other" : transReason;

  const selectedTier = VEHICLE_TIERS.find((t) => t.id === vehicleClass) || VEHICLE_TIERS[0]!;

  function toggleDocType(type: string) {
    setSelectedDocTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const formElements = Object.fromEntries(new FormData(event.currentTarget));
    if (!requestId.current) requestId.current = crypto.randomUUID();

    const payload: Record<string, unknown> = {
      ...formElements,
      requestId: requestId.current,
      serviceId
    };

    if (isInterpreter) {
      payload.sourceLanguage = effectiveSourceLang;
      payload.targetLanguage = effectiveTargetLang;
      payload.interpretationSetting = interpSetting;
    }

    if (isTranslation) {
      payload.sourceLanguage = effectiveSourceLang;
      payload.targetLanguage = effectiveTargetLang;
      payload.translationReason = effectiveReason;
      payload.documentTypes = selectedDocTypes;
      payload.attachedDocuments = attachedDocs;
    }

    if (isTransportation) {
      payload.pickupLocation = pickupLocation;
      payload.dropoffLocation = dropoffLocation;
      payload.vehicleClass = selectedTier.name;
      payload.passengers = passengers;
      payload.estimatedFareCents = selectedTier.baseFareCents;
      payload.payNow = payNow;
    }

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
      className="section-shell my-24 grid overflow-hidden rounded-[32px] bg-[#14283b] text-white lg:grid-cols-[0.82fr_1.18fr]"
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
          Personalized assistance for taxes, immigration documents, certified translations,
          professional interpreters, and luxury private transportation.
        </p>
        <div className="mt-8 max-w-xs space-y-3 text-xs text-sky-200/90">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
            <span>Encrypted document processing & secure Stripe checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-amber-300" />
            <span>Dual email confirmations for client & customer</span>
          </div>
        </div>
        <p className="mt-8 text-xs text-sky-200">
          Appointments use {timezone.replaceAll("_", " ")}.
        </p>
      </div>

      <div className="m-3 rounded-[24px] bg-white p-6 text-slate-800 sm:m-6 sm:p-9">
        {reference ? (
          <div className="flex min-h-96 flex-col items-start justify-center" role="status">
            <CheckCircle2 className="mb-5 size-10 text-emerald-600" />
            <h3 className="text-2xl font-semibold">Appointment Request Received!</h3>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              Your booking reference is <strong>{reference}</strong>. A confirmation email has been
              dispatched to your inbox with all your request details. Our administration team has
              been notified and will confirm availability shortly.
            </p>

            {paymentUrl ? (
              <div className="mt-6 w-full rounded-2xl border border-sky-200 bg-sky-50 p-5">
                <p className="text-xs font-semibold tracking-wide text-sky-900 uppercase">
                  Online Payment Ready
                </p>
                <p className="mt-1 text-sm text-sky-800">
                  {isTransportation
                    ? `Your ride fare is estimated at $${(selectedTier.baseFareCents / 100).toFixed(2)}. Complete your payment online via Stripe for instant ride lock.`
                    : "You can review price details and pay online now via Stripe."}
                </p>
                <Button asChild className="mt-4 w-full sm:w-auto">
                  <a href={paymentUrl}>
                    Pay securely with Stripe
                    <ArrowUpRight className="size-4" />
                  </a>
                </Button>
              </div>
            ) : null}

            <Button
              className="mt-6"
              variant="outline"
              onClick={() => {
                setReference("");
                setPaymentUrl("");
                setAttachedDocs([]);
              }}
            >
              Make another request
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-xs font-medium text-slate-700">Select Service *</span>
              <select
                name="serviceId"
                required
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                className="klx-input mt-2"
              >
                {services.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.number ? `${s.number} · ` : ""}
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            {/* INTERPRETER SERVICE SECTION */}
            {isInterpreter && (
              <div className="space-y-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 sm:col-span-2 sm:p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-sky-950">
                  <Mic className="size-4 text-sky-600" />
                  <span>Interpreter Spoken Languages & Setting</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-slate-700">
                    From Language (Source) *
                    <select
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                      className="klx-input mt-1 text-xs"
                    >
                      {COMMON_LANGUAGES.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-medium text-slate-700">
                    To Language (Target) *
                    <select
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="klx-input mt-1 text-xs"
                    >
                      {COMMON_LANGUAGES.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {(sourceLang === "Other" || targetLang === "Other") && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sourceLang === "Other" && (
                      <input
                        type="text"
                        placeholder="Specify source language"
                        value={customSourceLang}
                        onChange={(e) => setCustomSourceLang(e.target.value)}
                        className="klx-input text-xs"
                        required
                      />
                    )}
                    {targetLang === "Other" && (
                      <input
                        type="text"
                        placeholder="Specify target language"
                        value={customTargetLang}
                        onChange={(e) => setCustomTargetLang(e.target.value)}
                        className="klx-input text-xs"
                        required
                      />
                    )}
                  </div>
                )}

                <label className="block text-xs font-medium text-slate-700">
                  Interpretation Setting / Appointment Context *
                  <select
                    value={interpSetting}
                    onChange={(e) => setInterpSetting(e.target.value)}
                    className="klx-input mt-1 text-xs"
                  >
                    {INTERPRETATION_SETTINGS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {/* TRANSLATION SERVICE SECTION */}
            {isTranslation && (
              <div className="space-y-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 sm:col-span-2 sm:p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-sky-950">
                  <Languages className="size-4 text-sky-600" />
                  <span>Translation Document Details & Upload</span>
                </div>

                {/* Languages */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-slate-700">
                    Translate From Language *
                    <select
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                      className="klx-input mt-1 text-xs"
                    >
                      {COMMON_LANGUAGES.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-medium text-slate-700">
                    Translate To Language *
                    <select
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="klx-input mt-1 text-xs"
                    >
                      {COMMON_LANGUAGES.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {(sourceLang === "Other" || targetLang === "Other") && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sourceLang === "Other" && (
                      <input
                        type="text"
                        placeholder="Specify source language"
                        value={customSourceLang}
                        onChange={(e) => setCustomSourceLang(e.target.value)}
                        className="klx-input text-xs"
                        required
                      />
                    )}
                    {targetLang === "Other" && (
                      <input
                        type="text"
                        placeholder="Specify target language"
                        value={customTargetLang}
                        onChange={(e) => setCustomTargetLang(e.target.value)}
                        className="klx-input text-xs"
                        required
                      />
                    )}
                  </div>
                )}

                {/* Reason for Translation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Reason for Translation (e.g., Immigration, Court, Academic) *
                  </label>
                  <select
                    value={transReason}
                    onChange={(e) => setTransReason(e.target.value)}
                    className="klx-input text-xs"
                  >
                    {TRANSLATION_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {transReason === "Other" && (
                    <input
                      type="text"
                      placeholder="Enter specific purpose (e.g. consulate, bank, job)"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="klx-input mt-2 text-xs"
                      required
                    />
                  )}
                </div>

                {/* Common Document Types */}
                <div className="space-y-1.5">
                  <span className="block text-xs font-medium text-slate-700">
                    Document Category (Select all that apply)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_DOC_TYPES.map((type) => {
                      const isChecked = selectedDocTypes.includes(type);
                      return (
                        <button
                          type="button"
                          key={type}
                          onClick={() => toggleDocType(type)}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                            isChecked
                              ? "bg-sky-600 text-white shadow-xs"
                              : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Document Uploader */}
                <DocumentUploader documents={attachedDocs} onChange={setAttachedDocs} />
              </div>
            )}

            {/* TRANSPORTATION SERVICE SECTION */}
            {isTransportation && (
              <div className="sm:col-span-2">
                <TransportationBooking
                  pickupLocation={pickupLocation}
                  onPickupChange={setPickupLocation}
                  dropoffLocation={dropoffLocation}
                  onDropoffChange={setDropoffLocation}
                  vehicleClass={vehicleClass}
                  onVehicleChange={setVehicleClass}
                  passengers={passengers}
                  onPassengersChange={setPassengers}
                  payNow={payNow}
                  onPayNowChange={setPayNow}
                />
              </div>
            )}

            {/* Customer Details */}
            <label>
              Your name *
              <input
                name="customerName"
                required
                maxLength={100}
                autoComplete="name"
                className="klx-input mt-2"
                placeholder="Full Name"
              />
            </label>
            <label>
              Email *
              <input
                name="customerEmail"
                type="email"
                required
                autoComplete="email"
                className="klx-input mt-2"
                placeholder="you@example.com"
              />
            </label>
            <label>
              Phone *
              <input
                name="customerPhone"
                type="tel"
                required
                minLength={7}
                maxLength={40}
                autoComplete="tel"
                className="klx-input mt-2"
                placeholder="+1 (555) 000-0000"
              />
            </label>
            <label>
              Preferred date *
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
              Additional instructions or requests <span className="text-slate-400">(optional)</span>
              <textarea
                name="customerNotes"
                maxLength={2000}
                rows={3}
                className="klx-input mt-2"
                placeholder="Any special requests, flight numbers, or notes for our team."
              />
            </label>

            <div className="hidden" aria-hidden="true">
              <input name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <p className="text-xs leading-5 text-slate-500 sm:col-span-2">
              Submitting registers your appointment request. You will receive an instant booking
              confirmation email, and our team will verify dispatch and schedule availability.
            </p>

            {message && (
              <p role="alert" className="text-sm text-red-700 sm:col-span-2">
                {message}
              </p>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="h-12 text-sm font-semibold sm:col-span-2"
            >
              {busy
                ? "Processing request…"
                : isTransportation && payNow
                  ? "Continue to Stripe Checkout"
                  : "Submit appointment request"}
              <ArrowUpRight className="size-4" />
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
