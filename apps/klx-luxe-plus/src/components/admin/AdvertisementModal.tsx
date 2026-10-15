"use client";

import { useState } from "react";
import Image from "next/image";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Link2,
  Megaphone,
  Sparkles,
  X
} from "lucide-react";
import { Dialog } from "radix-ui";

import { Button } from "@repo/ui";

import type { KlxAdvertisement } from "@/server/db/types";

export interface AdvertisementFormValues {
  id?: string;
  title: string;
  imageUrl: string;
  destinationUrl: string;
  altText: string;
  placement: "after_hero" | "after_services";
  priority: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

const TEMPLATES: { label: string; description: string; data: AdvertisementFormValues }[] = [
  {
    label: "PoolPay Mobile App",
    description: "Promote PoolPay group savings & ROSCA circles (Hero placement)",
    data: {
      title: "PoolPay — Modern ROSCA & Group Savings Mobile App",
      imageUrl: "/images/klx-social-card.png",
      destinationUrl: "https://klxluxeplus.poolpay.space/#poolpay",
      altText:
        "Download PoolPay App on Google Play for transparent group savings and financial circles",
      placement: "after_hero",
      priority: 10,
      isActive: true,
      startDate: "",
      endDate: ""
    }
  },
  {
    label: "Tax Consultation",
    description: "Encourage 1-on-1 personal & corporate tax filings (Services placement)",
    data: {
      title: "KLX Tax Services — 1-on-1 Filing & IRS Compliance Consultation",
      imageUrl: "/images/klx-social-card.png",
      destinationUrl: "https://klxluxeplus.poolpay.space/#appointments",
      altText: "Schedule a one-on-one personal and business tax consultation with KLX Luxe Plus",
      placement: "after_services",
      priority: 15,
      isActive: true,
      startDate: "",
      endDate: ""
    }
  },
  {
    label: "Luxury Transportation",
    description: "Highlight premium executive airport & private travel (Hero placement)",
    data: {
      title: "Executive Luxury Transportation — Punctual Airport & Corporate Travel",
      imageUrl: "/images/klx-social-card.png",
      destinationUrl: "https://klxluxeplus.poolpay.space/#appointments",
      altText:
        "Reserve premium executive chauffeur and luxury private transportation tailored to your itinerary",
      placement: "after_hero",
      priority: 20,
      isActive: true,
      startDate: "",
      endDate: ""
    }
  },
  {
    label: "Immigration Documents",
    description: "Offer official petition & paperwork assistance (Services placement)",
    data: {
      title: "Immigration Document Assistance & Certified Translations",
      imageUrl: "/images/klx-social-card.png",
      destinationUrl: "https://klxluxeplus.poolpay.space/#services",
      altText:
        "Get reliable assistance with preparing, organizing, and filing your immigration paperwork",
      placement: "after_services",
      priority: 5,
      isActive: true,
      startDate: "",
      endDate: ""
    }
  }
];

const IMAGE_PRESETS = [
  { label: "KLX Brand Card", url: "/images/klx-social-card.png" },
  { label: "PoolPay App View", url: "/images/poolpay/groups.webp" },
  { label: "PoolPay Logo", url: "/images/poolpay/logo.png" }
];

export function validateAdvertisement(form: AdvertisementFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  // Title validation
  const title = form.title.trim();
  if (!title) {
    errors.title = "Advertisement title is required.";
  } else if (title.length < 3) {
    errors.title = "Title must be at least 3 characters.";
  } else if (title.length > 120) {
    errors.title = "Title cannot exceed 120 characters.";
  }

  // Image URL validation
  const img = form.imageUrl.trim();
  if (!img) {
    errors.imageUrl = "Banner image URL is required.";
  } else if ((!img.startsWith("/") || img.startsWith("//")) && !/^https?:\/\//i.test(img)) {
    errors.imageUrl = "Must be a valid HTTPS URL (https://...) or local path (e.g. /images/...).";
  } else if (img.length > 2048) {
    errors.imageUrl = "Image URL is too long (maximum 2048 characters).";
  }

  // Destination URL validation
  const dest = form.destinationUrl.trim();
  if (!dest) {
    errors.destinationUrl = "Destination URL is required.";
  } else if ((!dest.startsWith("/") || dest.startsWith("//")) && !/^https?:\/\//i.test(dest)) {
    errors.destinationUrl =
      "Must be a valid HTTPS URL (e.g. https://...) or page link (e.g. /#appointments or /#poolpay).";
  } else if (dest.length > 2048) {
    errors.destinationUrl = "Destination URL cannot exceed 2048 characters.";
  }

  // Alt text validation
  const alt = form.altText.trim();
  if (!alt) {
    errors.altText = "Alt text is required for accessibility and SEO.";
  } else if (alt.length < 5) {
    errors.altText = "Alt text must be at least 5 characters.";
  } else if (alt.length > 300) {
    errors.altText = "Alt text cannot exceed 300 characters.";
  }

  // Priority validation
  if (
    Number.isNaN(Number(form.priority)) ||
    !Number.isInteger(Number(form.priority)) ||
    Number(form.priority) < 0 ||
    Number(form.priority) > 100
  ) {
    errors.priority = "Priority must be an integer between 0 and 100.";
  }

  // Placement validation
  if (!["after_hero", "after_services"].includes(form.placement)) {
    errors.placement = "Please select either 'After Hero' or 'After Services'.";
  }

  // Schedule dates validation
  if (form.startDate && form.endDate) {
    const start = new Date(form.startDate).getTime();
    const end = new Date(form.endDate).getTime();
    if (Number.isNaN(start)) {
      errors.startDate = "Invalid start date format.";
    }
    if (Number.isNaN(end)) {
      errors.endDate = "Invalid end date format.";
    }
    if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
      errors.endDate = "End date must be strictly after start date.";
    }
  } else {
    if (form.startDate && Number.isNaN(new Date(form.startDate).getTime())) {
      errors.startDate = "Invalid start date format.";
    }
    if (form.endDate && Number.isNaN(new Date(form.endDate).getTime())) {
      errors.endDate = "Invalid end date format.";
    }
  }

  return errors;
}

function AdvertisementModalContent({
  initialData,
  onClose,
  onSave
}: {
  initialData?: KlxAdvertisement | null;
  onClose: () => void;
  onSave: (ad: AdvertisementFormValues) => Promise<void>;
}) {
  const defaultValues: AdvertisementFormValues = TEMPLATES[0].data;

  const [form, setForm] = useState<AdvertisementFormValues>(() => {
    if (!initialData) return defaultValues;
    return {
      id: initialData.id,
      title: initialData.title || "",
      imageUrl: initialData.imageUrl || "/images/klx-social-card.png",
      destinationUrl: initialData.destinationUrl || "https://klxluxeplus.poolpay.space/#poolpay",
      altText: initialData.altText || "",
      placement: initialData.placement || "after_hero",
      priority: typeof initialData.priority === "number" ? initialData.priority : 10,
      isActive: typeof initialData.isActive === "boolean" ? initialData.isActive : true,
      startDate: initialData.startDate
        ? new Date(initialData.startDate).toISOString().slice(0, 10)
        : "",
      endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().slice(0, 10) : ""
    };
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const errors = validateAdvertisement(form);
  const isValid = Object.keys(errors).length === 0;

  function updateField<K extends keyof AdvertisementFormValues>(
    key: K,
    value: AdvertisementFormValues[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setServerError("");
  }

  function markTouched(key: keyof AdvertisementFormValues) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function applyTemplate(template: (typeof TEMPLATES)[0]) {
    setForm((prev) => ({
      ...template.data,
      id: prev.id // preserve id if editing
    }));
    setTouched({});
    setServerError("");
    setImageFailed(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {
      title: true,
      imageUrl: true,
      destinationUrl: true,
      altText: true,
      placement: true,
      priority: true,
      startDate: true,
      endDate: true
    };
    setTouched(allTouched);

    const currentErrors = validateAdvertisement(form);
    if (Object.keys(currentErrors).length > 0) {
      const firstError = Object.values(currentErrors)[0];
      setServerError(firstError || "Please correct the highlighted errors.");
      return;
    }

    setBusy(true);
    setServerError("");
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to save advertisement.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Content className="fixed inset-2 z-50 flex max-h-[96vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:inset-6 md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[90vh] md:w-full md:max-w-4xl md:-translate-x-1/2 md:-translate-y-1/2">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Megaphone className="size-5" />
          </div>
          <div>
            <Dialog.Title className="text-lg font-bold text-slate-900">
              {initialData?.id ? "Edit Advertisement" : "Create New Advertisement"}
            </Dialog.Title>
            <p className="text-xs text-slate-500">
              Configure sponsored banner, valid URLs, target placement, and schedule.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
          aria-label="Close dialog"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Template Presets Bar */}
        <div className="mb-6 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-sky-900">
              <Sparkles className="size-4 text-sky-600" />
              Quick Valid Templates (One-Click Pre-fill)
            </p>
            <span className="text-[11px] text-sky-700">
              All templates pass 100% of validation rules
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => applyTemplate(tmpl)}
                className="flex flex-col items-start rounded-xl border border-sky-200 bg-white p-2.5 text-left transition hover:border-sky-400 hover:bg-sky-50/50 hover:shadow-xs"
              >
                <span className="text-xs font-bold text-slate-800">{tmpl.label}</span>
                <span className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                  {tmpl.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <form id="ad-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Title & Placement */}
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Advertisement Title <span className="text-red-500">*</span>
                </label>
                <span
                  className={`text-[11px] ${
                    form.title.length > 120
                      ? "font-bold text-red-600"
                      : form.title.length >= 3
                        ? "text-emerald-600"
                        : "text-slate-400"
                  }`}
                >
                  {form.title.length}/120
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={120}
                placeholder="e.g. PoolPay — Modern Group Savings"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                onBlur={() => markTouched("title")}
                className={`klx-input mt-1.5 text-sm ${
                  touched.title && errors.title
                    ? "border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-200"
                    : touched.title && !errors.title
                      ? "border-emerald-400 focus:border-emerald-500"
                      : ""
                }`}
              />
              {touched.title && errors.title && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="size-3.5" /> {errors.title}
                </p>
              )}
              <p className="mt-1 text-[11px] text-slate-400">
                Displayed as caption and used for internal management.
              </p>
            </div>

            {/* Placement Selector */}
            <div>
              <label className="text-xs font-bold text-slate-800">
                Display Placement <span className="text-red-500">*</span>
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateField("placement", "after_hero")}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                    form.placement === "after_hero"
                      ? "border-sky-500 bg-sky-50/60 ring-2 ring-sky-200"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">After Hero</span>
                    {form.placement === "after_hero" && <Check className="size-3.5 text-sky-600" />}
                  </div>
                  <span className="mt-1 text-[11px] text-slate-500">
                    Top of landing page directly below hero.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateField("placement", "after_services")}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                    form.placement === "after_services"
                      ? "border-sky-500 bg-sky-50/60 ring-2 ring-sky-200"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">After Services</span>
                    {form.placement === "after_services" && (
                      <Check className="size-3.5 text-sky-600" />
                    )}
                  </div>
                  <span className="mt-1 text-[11px] text-slate-500">
                    Mid-page before appointment booking.
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Destination URL & Alt Text */}
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Destination Target URL <span className="text-red-500">*</span>
                </label>
                {form.destinationUrl && !errors.destinationUrl && (
                  <a
                    href={form.destinationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:underline"
                  >
                    Test link <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
              <div className="relative mt-1.5">
                <Link2 className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="https://... or /#appointments"
                  value={form.destinationUrl}
                  onChange={(e) => updateField("destinationUrl", e.target.value)}
                  onBlur={() => markTouched("destinationUrl")}
                  className={`klx-input pl-9 text-sm ${
                    touched.destinationUrl && errors.destinationUrl
                      ? "border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-200"
                      : touched.destinationUrl && !errors.destinationUrl
                        ? "border-emerald-400 focus:border-emerald-500"
                        : ""
                  }`}
                />
              </div>
              {touched.destinationUrl && errors.destinationUrl ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="size-3.5" /> {errors.destinationUrl}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">
                  Must be https:// or a page section (e.g. /#appointments or /#poolpay).
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Accessibility & SEO Alt Text <span className="text-red-500">*</span>
                </label>
                <span
                  className={`text-[11px] ${
                    form.altText.length > 300
                      ? "font-bold text-red-600"
                      : form.altText.length >= 5
                        ? "text-emerald-600"
                        : "text-slate-400"
                  }`}
                >
                  {form.altText.length}/300
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={300}
                placeholder="Describe the image content for screen readers"
                value={form.altText}
                onChange={(e) => updateField("altText", e.target.value)}
                onBlur={() => markTouched("altText")}
                className={`klx-input mt-1.5 text-sm ${
                  touched.altText && errors.altText
                    ? "border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-200"
                    : touched.altText && !errors.altText
                      ? "border-emerald-400 focus:border-emerald-500"
                      : ""
                }`}
              />
              {touched.altText && errors.altText ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="size-3.5" /> {errors.altText}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">
                  Critical for WCAG accessibility and search indexation.
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Banner Image Configuration & Upload */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Banner Image (URL or Upload) <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Recommended 1200×400 (3:1 ratio)</span>
            </div>

            <div className="mt-2 grid gap-4 md:grid-cols-[1fr_220px]">
              <div className="space-y-3">
                <div className="relative">
                  <ImageIcon className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="/images/klx-social-card.png or https://..."
                    value={form.imageUrl}
                    onChange={(e) => {
                      setImageFailed(false);
                      updateField("imageUrl", e.target.value);
                    }}
                    onBlur={() => markTouched("imageUrl")}
                    className={`klx-input pl-9 text-xs ${
                      touched.imageUrl && errors.imageUrl ? "border-red-400 bg-red-50/30" : ""
                    }`}
                  />
                </div>
                {touched.imageUrl && errors.imageUrl && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="size-3.5" /> {errors.imageUrl}
                  </p>
                )}

                {/* Image Presets */}
                <div>
                  <span className="text-[11px] font-medium text-slate-500">
                    Preset verified assets:
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {IMAGE_PRESETS.map((p) => (
                      <button
                        key={p.url}
                        type="button"
                        onClick={() => {
                          setImageFailed(false);
                          updateField("imageUrl", p.url);
                        }}
                        className={`rounded-lg border px-2 py-0.5 text-xs transition ${
                          form.imageUrl === p.url
                            ? "border-sky-500 bg-sky-50 font-bold text-sky-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <span className="text-[11px] font-medium text-slate-500">
                    Or upload file from device (max 5MB JPEG/PNG/WebP):
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading}
                    className="klx-input mt-1 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1 file:text-xs file:font-semibold hover:file:bg-slate-200"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        setServerError("Image file size must be less than 5 MB.");
                        return;
                      }
                      setUploading(true);
                      setServerError("");
                      try {
                        const data = new FormData();
                        data.set("file", file);
                        const res = await fetch("/api/admin/media", {
                          method: "POST",
                          body: data
                        });
                        const result = await res.json();
                        if (!res.ok) throw new Error(result.error || "Upload failed");
                        setImageFailed(false);
                        updateField("imageUrl", result.url);
                      } catch (err) {
                        setServerError(err instanceof Error ? err.message : "Upload failed.");
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                  {uploading && (
                    <p className="mt-1 text-xs font-medium text-sky-600">Uploading image…</p>
                  )}
                </div>
              </div>

              {/* Thumbnail Preview Box */}
              <div className="flex flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                {form.imageUrl && !imageFailed ? (
                  <div className="relative aspect-[3/1] max-h-36 w-full overflow-hidden rounded-lg bg-slate-100">
                    <Image
                      src={form.imageUrl}
                      alt="Banner preview"
                      fill
                      unoptimized
                      className="object-contain"
                      onError={() => setImageFailed(true)}
                      onLoad={() => setImageFailed(false)}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[3/1] max-h-36 w-full flex-col items-center justify-center gap-1 bg-slate-50 text-slate-400">
                    <ImageIcon className="size-6 text-slate-300" />
                    <span className="text-[10px]">
                      {imageFailed ? "Broken image link" : "Image preview"}
                    </span>
                  </div>
                )}
                <span className="mt-1.5 truncate text-[10px] text-slate-400">
                  {form.imageUrl ? "Preview active" : "No image selected"}
                </span>
              </div>
            </div>
          </div>

          {/* Row 4: Priority & Schedule */}
          <div className="grid gap-5 md:grid-cols-3">
            {/* Priority */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">Priority (0 - 100)</label>
                <span className="text-[11px] font-semibold text-slate-500">
                  Value: {form.priority}
                </span>
              </div>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={form.priority}
                onChange={(e) => updateField("priority", Number(e.target.value) || 0)}
                onBlur={() => markTouched("priority")}
                className="klx-input mt-1.5 text-sm"
              />
              <div className="mt-1.5 flex gap-1">
                {[0, 10, 25, 50].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateField("priority", p)}
                    className={`rounded-md border px-2 py-0.5 text-[10px] ${
                      form.priority === p
                        ? "border-sky-500 bg-sky-50 font-bold text-sky-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Higher priority renders first.</p>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-xs font-bold text-slate-800">Start Date (Optional)</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                className="klx-input mt-1.5 text-sm"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Leave blank to activate immediately.
              </p>
            </div>

            {/* End Date */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">End Date (Optional)</label>
                {(form.startDate || form.endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      updateField("startDate", "");
                      updateField("endDate", "");
                    }}
                    className="text-[10px] font-semibold text-sky-600 hover:underline"
                  >
                    Clear schedule
                  </button>
                )}
              </div>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                className={`klx-input mt-1.5 text-sm ${
                  errors.endDate ? "border-red-400 bg-red-50/30" : ""
                }`}
              />
              {errors.endDate ? (
                <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">Leave blank to run indefinitely.</p>
              )}
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <p className="text-xs font-bold text-slate-800">Advertisement Status</p>
              <p className="text-[11px] text-slate-500">
                {form.isActive
                  ? "Active — Banner is enabled and eligible for display on public website."
                  : "Inactive — Banner is hidden from the public website."}
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField("isActive", e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-300 peer-checked:bg-emerald-600 peer-focus:outline-hidden after:absolute after:top-[2px] after:left-[2px] after:size-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>

          {/* Live Preview Toggle / Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase">
                <Eye className="size-3.5 text-sky-600" /> Live Website Banner Preview
              </p>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
                {form.placement === "after_hero" ? "After Hero Section" : "After Services Section"}
              </span>
            </div>
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
              <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400">
                ADVERTISEMENT
              </p>
              <a
                href={form.destinationUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-2xl bg-white shadow-xs transition hover:opacity-95"
              >
                {form.imageUrl && !imageFailed ? (
                  <div className="relative aspect-[3/1] max-h-56 w-full bg-slate-900/5">
                    <Image
                      src={form.imageUrl}
                      alt={form.altText || form.title || "Advertisement banner"}
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[3/1] max-h-40 w-full items-center justify-center bg-slate-100 text-xs text-slate-400">
                    Banner Image will appear here
                  </div>
                )}
              </a>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-800">
                  {form.title || "Untitled Banner"}
                </span>
                <span className="truncate text-[11px] text-slate-400">{form.destinationUrl}</span>
              </div>
            </div>
          </div>

          {/* Server or Global Error Banner */}
          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <p className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="size-4 shrink-0" /> {serverError}
              </p>
            </div>
          )}
        </form>
      </div>

      {/* Footer Actions */}
      <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
        <span className="text-xs text-slate-500">
          {isValid ? (
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <CheckCircle2 className="size-3.5" /> All inputs valid
            </span>
          ) : (
            <span className="flex items-center gap-1 font-medium text-amber-600">
              <AlertCircle className="size-3.5" /> Complete required fields
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy || uploading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="ad-form"
            disabled={busy || uploading || !isValid}
            className="bg-sky-600 text-white hover:bg-sky-700"
          >
            {busy ? "Saving…" : initialData?.id ? "Update Advertisement" : "Create Advertisement"}
          </Button>
        </div>
      </div>
    </Dialog.Content>
  );
}

export function AdvertisementModal({
  open,
  initialData,
  onClose,
  onSave
}: {
  open: boolean;
  initialData?: KlxAdvertisement | null;
  onClose: () => void;
  onSave: (ad: AdvertisementFormValues) => Promise<void>;
}) {
  if (!open) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity" />
        <AdvertisementModalContent
          key={initialData?.id || "new"}
          initialData={initialData}
          onClose={onClose}
          onSave={onSave}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}
