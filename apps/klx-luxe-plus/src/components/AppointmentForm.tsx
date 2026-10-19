"use client";

import { useEffect, useRef, useState } from "react";

import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  FileCheck2,
  Languages,
  Laptop,
  Mic,
  ReceiptText,
  ShieldCheck,
  Sparkles
} from "lucide-react";

import { Button } from "@repo/ui";

import type { AttachedDocument, KlxService, TransportationPricingConfig } from "@/server/db/types";

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

const REAL_ESTATE_TRANSACTION_TYPES = [
  "Buying (Purchasing a property)",
  "Selling (Listing a property)",
  "Renting / Leasing",
  "Commercial / Investment Advisory",
  "Property Management Consultation"
];

const REAL_ESTATE_PROPERTY_TYPES = [
  "Single-Family Home",
  "Condo / Townhouse",
  "Multi-Family Residential (2-4 units)",
  "Commercial / Retail / Office",
  "Land / Development Lot",
  "Luxury Estate"
];

const REAL_ESTATE_BUDGET_RANGES = [
  "Under $250,000",
  "$250,000 – $500,000",
  "$500,000 – $1,000,000",
  "$1,000,000 – $2,500,000",
  "$2,500,000+"
];

const REAL_ESTATE_TIMELINES = [
  "Immediate / Within 30 days",
  "1 – 3 Months",
  "3 – 6 Months",
  "6+ Months / Planning & Exploring"
];

export function AppointmentForm({
  services,
  timezone,
  selectedServiceId,
  onServiceChange,
  transportationPricing
}: {
  services: KlxService[];
  timezone: string;
  selectedServiceId?: string;
  onServiceChange?: (id: string) => void;
  transportationPricing?: TransportationPricingConfig;
}) {
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState("");
  const [internalServiceId, setInternalServiceId] = useState(() => {
    if (typeof window === "undefined") return "";
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    let target = "";
    if (hash.includes("service=")) {
      target = hash.split("service=")[1]?.split("&")[0]?.split("#")[0] || "";
    } else if (search.includes("service=")) {
      const params = new URLSearchParams(search);
      target = params.get("service") || "";
    }
    if (target) {
      const match = services.find(
        (s) =>
          s.serviceId === target ||
          s.id === target ||
          s.id === `svc_${target}` ||
          s.name.toLowerCase().includes(target.toLowerCase())
      );
      if (match) return match.id;
    }
    return "";
  });
  const serviceId = selectedServiceId || internalServiceId || services[0]?.id || "";
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
  const [estimatedFareCents, setEstimatedFareCents] = useState(0);

  // Real Estate States
  const [reTransactionType, setReTransactionType] = useState(REAL_ESTATE_TRANSACTION_TYPES[0]!);
  const [rePropertyType, setRePropertyType] = useState(REAL_ESTATE_PROPERTY_TYPES[0]!);
  const [reLocation, setReLocation] = useState("");
  const [reBudget, setReBudget] = useState(REAL_ESTATE_BUDGET_RANGES[1]!);
  const [reTimeline, setReTimeline] = useState(REAL_ESTATE_TIMELINES[1]!);

  // Sync service from URL hash/query on hashchange and smoothly scroll to section
  useEffect(() => {
    const handleHash = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash;
      const search = window.location.search;
      let target = "";
      if (hash.includes("service=")) {
        target = hash.split("service=")[1]?.split("&")[0]?.split("#")[0] || "";
      } else if (search.includes("service=")) {
        const params = new URLSearchParams(search);
        target = params.get("service") || "";
      }

      if (target) {
        const match = services.find(
          (s) =>
            s.serviceId === target ||
            s.id === target ||
            s.id === `svc_${target}` ||
            s.name.toLowerCase().includes(target.toLowerCase())
        );
        if (match) {
          setInternalServiceId(match.id);
          onServiceChange?.(match.id);
        }
      }

      if (hash.startsWith("#appointments")) {
        const el = document.getElementById("appointments");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    if (window.location.hash.startsWith("#appointments")) {
      const el = document.getElementById("appointments");
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    }

    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [services, onServiceChange]);

  const activeService = services.find((s) => s.id === serviceId) || services[0];
  const serviceKey = activeService?.serviceId || "";
  const serviceNameLower = activeService?.name.toLowerCase() || "";

  const isInterpreter = serviceKey === "interpreter" || serviceNameLower.includes("interpreter");
  const isTranslation = serviceKey === "translations" || serviceNameLower.includes("translation");
  const isTransportation = serviceKey === "transport" || serviceNameLower.includes("transport");
  const isTax = serviceKey === "taxes" || serviceNameLower.includes("tax");
  const isImmigration = serviceKey === "immigration" || serviceNameLower.includes("immigration");
  const isFinance = serviceKey === "finance" || serviceNameLower.includes("finance");
  const isComputer = serviceKey === "computer" || serviceNameLower.includes("computer");
  const isRealEstate =
    serviceKey === "real_estate" ||
    serviceNameLower.includes("real estate") ||
    serviceNameLower.includes("property");

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
    }

    if (isTransportation) {
      payload.pickupLocation = pickupLocation;
      payload.dropoffLocation = dropoffLocation;
      payload.vehicleClass = selectedTier.name;
      payload.passengers = passengers;
      payload.estimatedFareCents = estimatedFareCents;
      payload.payNow = Boolean(estimatedFareCents && estimatedFareCents > 0);
    }

    if (isRealEstate) {
      payload.realEstateTransactionType = reTransactionType;
      payload.realEstatePropertyType = rePropertyType;
      payload.realEstateLocation = reLocation;
      payload.realEstateBudget = reBudget;
      payload.realEstateTimeline = reTimeline;
    }

    // Attach documents for any service where files were uploaded
    if (attachedDocs.length > 0) {
      payload.attachedDocuments = attachedDocs;
    }
    if (selectedDocTypes.length > 0) {
      payload.documentTypes = selectedDocTypes;
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
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      }
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
      className="section-shell my-16 grid overflow-hidden rounded-[24px] bg-[#14283b] text-white sm:my-24 sm:rounded-[32px] lg:grid-cols-[0.82fr_1.18fr]"
    >
      <div className="p-5 sm:p-12 lg:p-14" data-reveal>
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
          professional interpreters, real estate, and luxury private transportation.
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

      <div className="m-2 rounded-[20px] bg-white p-4 text-slate-800 sm:m-6 sm:rounded-[24px] sm:p-9">
        {reference ? (
          <div className="flex min-h-96 flex-col items-start justify-center" role="status">
            <CheckCircle2 className="mb-5 size-10 text-emerald-600" />
            <h3 className="text-2xl font-semibold">
              {isTransportation
                ? "Transportation Reservation Request Received!"
                : "Appointment Request Received!"}
            </h3>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              Your booking reference is <strong>{reference}</strong>. A confirmation email has been
              dispatched to your inbox with all your request details.
              {isTransportation
                ? " Our private chauffeur dispatch team has been notified and will verify vehicle availability and confirm your route shortly."
                : " Our administration team has been notified and will confirm availability shortly."}
            </p>

            {paymentUrl ? (
              <div className="mt-6 w-full rounded-2xl border border-sky-200 bg-sky-50 p-5">
                <p className="text-xs font-semibold tracking-wide text-sky-900 uppercase">
                  Online Payment Ready
                </p>
                <p className="mt-1 text-sm text-sky-800">
                  {isTransportation
                    ? "Your reservation is registered. Complete your payment online to secure your vehicle."
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
                onChange={(event) => {
                  setInternalServiceId(event.target.value);
                  onServiceChange?.(event.target.value);
                }}
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

                <DocumentUploader
                  documents={attachedDocs}
                  onChange={setAttachedDocs}
                  label="Attach hearing notice or context documents (optional)"
                  hint="(Hearing notices, USCIS interview letters, medical referrals, deposition notes)"
                />
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
                <DocumentUploader
                  documents={attachedDocs}
                  onChange={setAttachedDocs}
                  label="Attach documents to translate"
                  hint="(Birth certificates, marriage licenses, diplomas, etc.)"
                />
              </div>
            )}

            {/* TAX SERVICE SECTION */}
            {isTax && (
              <div className="space-y-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 sm:col-span-2 sm:p-5">
                <div className="flex items-center justify-between border-b border-sky-100/80 pb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-sky-950">
                    <ReceiptText className="size-4 text-sky-600" />
                    <span>Tax Filing Documents &amp; Upload</span>
                  </div>
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
                    Tax Services
                  </span>
                </div>

                <DocumentUploader
                  documents={attachedDocs}
                  onChange={setAttachedDocs}
                  label="Attach tax documents (optional)"
                  hint="(W-2, 1099, 1098, prior filings, receipts, IRS notices)"
                />
              </div>
            )}

            {/* IMMIGRATION SERVICE SECTION */}
            {isImmigration && (
              <div className="space-y-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 sm:col-span-2 sm:p-5">
                <div className="flex items-center justify-between border-b border-sky-100/80 pb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-sky-950">
                    <FileCheck2 className="size-4 text-sky-600" />
                    <span>Immigration Paperwork &amp; File Upload</span>
                  </div>
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
                    Document Assistance
                  </span>
                </div>

                <DocumentUploader
                  documents={attachedDocs}
                  onChange={setAttachedDocs}
                  label="Upload your immigration documents (optional)"
                  hint="(Passports, USCIS notices, petition forms, visas, certificates)"
                />
              </div>
            )}

            {/* FINANCE SERVICE SECTION */}
            {isFinance && (
              <div className="space-y-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 sm:col-span-2 sm:p-5">
                <div className="flex items-center justify-between border-b border-sky-100/80 pb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-sky-950">
                    <ChartNoAxesCombined className="size-4 text-sky-600" />
                    <span>Financial Consultation &amp; Document Upload</span>
                  </div>
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
                    Finance Agent
                  </span>
                </div>

                <DocumentUploader
                  documents={attachedDocs}
                  onChange={setAttachedDocs}
                  label="Attach financial documents (optional)"
                  hint="(Bank statements, pay stubs, agency records, business balance sheets, ID verification)"
                />
              </div>
            )}

            {/* COMPUTER SUPPORT SERVICE SECTION */}
            {isComputer && (
              <div className="space-y-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 sm:col-span-2 sm:p-5">
                <div className="flex items-center justify-between border-b border-sky-100/80 pb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-sky-950">
                    <Laptop className="size-4 text-sky-600" />
                    <span>Technical Support &amp; Screenshots Upload</span>
                  </div>
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
                    Computer Support
                  </span>
                </div>

                <DocumentUploader
                  documents={attachedDocs}
                  onChange={setAttachedDocs}
                  label="Upload error screenshots or logs (optional)"
                  hint="(Photos of error screens, system specs, logs, crash reports, device details)"
                />
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
                  pricing={transportationPricing}
                  onEstimatedFareChange={setEstimatedFareCents}
                />
              </div>
            )}

            {/* REAL ESTATE SERVICE SECTION */}
            {isRealEstate && (
              <div className="space-y-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 sm:col-span-2 sm:p-5">
                <div className="flex items-center justify-between border-b border-sky-100/80 pb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-sky-950">
                    <Building2 className="size-4 text-sky-600" />
                    <span>Real Estate Consultation &amp; Property Details</span>
                  </div>
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
                    Property Advisory
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-slate-700">
                    Transaction Interest *
                    <select
                      value={reTransactionType}
                      onChange={(e) => setReTransactionType(e.target.value)}
                      className="klx-input mt-1 text-xs"
                    >
                      {REAL_ESTATE_TRANSACTION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-medium text-slate-700">
                    Property Type *
                    <select
                      value={rePropertyType}
                      onChange={(e) => setRePropertyType(e.target.value)}
                      className="klx-input mt-1 text-xs"
                    >
                      {REAL_ESTATE_PROPERTY_TYPES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-slate-700">
                    Estimated Budget / Price Range *
                    <select
                      value={reBudget}
                      onChange={(e) => setReBudget(e.target.value)}
                      className="klx-input mt-1 text-xs"
                    >
                      {REAL_ESTATE_BUDGET_RANGES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-medium text-slate-700">
                    Timeline / Readiness *
                    <select
                      value={reTimeline}
                      onChange={(e) => setReTimeline(e.target.value)}
                      className="klx-input mt-1 text-xs"
                    >
                      {REAL_ESTATE_TIMELINES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block text-xs font-medium text-slate-700">
                  Target Location / Area (City, Neighborhood, or Zip Code)
                  <input
                    type="text"
                    value={reLocation}
                    onChange={(e) => setReLocation(e.target.value)}
                    placeholder="e.g. Binghamton, Vestal, Broome County, NY or Zip Code"
                    className="klx-input mt-1 text-xs"
                  />
                </label>

                <DocumentUploader
                  documents={attachedDocs}
                  onChange={setAttachedDocs}
                  label="Attach property documents (optional)"
                  hint="(Pre-approval letter, property deed, inspection report, listing notes, or photos)"
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
                : isTransportation
                  ? estimatedFareCents > 0
                    ? `Submit & Pay (${(estimatedFareCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })})`
                    : "Submit Reservation Request"
                  : "Submit appointment request"}
              <ArrowUpRight className="size-4" />
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
