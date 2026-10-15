"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CarFront,
  ChartNoAxesCombined,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  HelpCircle,
  History,
  Languages,
  Laptop,
  Layers,
  Megaphone,
  Pencil,
  ReceiptText,
  RotateCcw,
  Smartphone,
  UsersRound
} from "lucide-react";

import { BorderBeam, Button } from "@repo/ui";

import type { KlxAdvertisement, KlxService, KlxSettings, SiteContentData } from "@/server/db/types";

import { BrandMark } from "../Brand";

const SERVICE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  taxes: ReceiptText,
  immigration: FileCheck2,
  translations: Languages,
  transport: CarFront,
  computer: Laptop,
  finance: ChartNoAxesCombined
};

interface SectionManagerProps {
  content: SiteContentData;
  services: KlxService[];
  settings: KlxSettings;
  advertisements: KlxAdvertisement[];
  versions: { version: number; publishedAt: string }[];
  onAction: (resource: string, payload: unknown) => Promise<unknown>;
  onEditContent: (key?: keyof SiteContentData) => void;
  onEditResource: (title: string, initial: unknown, resource: string) => void;
  formatMoney: (cents: number) => string;
  initialFocusSection?: string;
}

export function SectionManager({
  content,
  services,
  settings,
  advertisements,
  versions,
  onAction,
  onEditContent,
  onEditResource,
  formatMoney,
  initialFocusSection
}: SectionManagerProps) {
  const [activeFilter, setActiveFilter] = useState<string>(initialFocusSection || "all");
  const [showVersions, setShowVersions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState("");

  const sectionOrder = content.sectionOrder || [
    "poolpay",
    "services",
    "about",
    "appointments",
    "faqs"
  ];
  const sectionVisibility = content.sectionVisibility || {
    poolpay: true,
    services: true,
    about: true,
    appointments: true,
    faqs: true
  };

  async function handleToggleVisibility(sectionKey: keyof SiteContentData["sectionVisibility"]) {
    if (sectionKey === "poolpay") return;
    setIsUpdating(true);
    setFeedback("");
    try {
      const nextVisibility = {
        ...sectionVisibility,
        [sectionKey]: !sectionVisibility[sectionKey]
      };
      await onAction("content", {
        ...content,
        sectionVisibility: nextVisibility
      });
      setFeedback(
        `Section "${sectionKey}" is now ${nextVisibility[sectionKey] ? "visible" : "hidden"}.`
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to toggle visibility.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleMoveSection(sectionKey: string, direction: "up" | "down") {
    const currentIndex = sectionOrder.indexOf(sectionKey);
    if (currentIndex <= 0) return; // PoolPay must remain first

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex <= 0 || targetIndex >= sectionOrder.length) return;

    setIsUpdating(true);
    setFeedback("");
    try {
      const nextOrder = [...sectionOrder];
      [nextOrder[currentIndex], nextOrder[targetIndex]] = [
        nextOrder[targetIndex],
        nextOrder[currentIndex]
      ];
      await onAction("content", {
        ...content,
        sectionOrder: nextOrder
      });
      setFeedback(`Section order updated.`);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to reorder sections.");
    } finally {
      setIsUpdating(false);
    }
  }

  const SECTION_METADATA: Record<
    string,
    { label: string; number: string; icon: typeof Smartphone; description: string }
  > = {
    poolpay: {
      label: "Hero & PoolPay Partnership",
      number: "01",
      icon: Smartphone,
      description:
        "Primary hero section with PoolPay app showcases, store links, and feature highlights."
    },
    services: {
      label: "Services & Consultations",
      number: "02",
      icon: BriefcaseBusiness,
      description: "Luxury service cards, consultation booking actions, and transparent pricing."
    },
    about: {
      label: "The Plus is Personal (About)",
      number: "03",
      icon: FileText,
      description: "Company story, core mission, personal touch, and trust statistics."
    },
    appointments: {
      label: "Appointment Booking",
      number: "04",
      icon: CalendarDays,
      description: "Interactive scheduling calendar with live timezone and working hours."
    },
    faqs: {
      label: "Frequently Asked Questions",
      number: "05",
      icon: HelpCircle,
      description: "Accordion-style answers to common visitor and client questions."
    }
  };

  return (
    <div className="space-y-10">
      {/* Top Banner / Header with Landing Page Aesthetic */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#14283b] via-[#19324a] to-[#122334] p-8 text-white shadow-xl sm:p-10">
        <div className="relative z-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <p className="eyebrow flex items-center gap-2.5 text-xs font-semibold tracking-widest text-sky-300">
              <span className="status-dot" /> LANDING PAGE LIVE SECTIONS
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={() => setShowVersions((prev) => !prev)}
              >
                <History className="size-4" />
                Version History ({versions.length})
              </Button>
              <Button
                size="sm"
                className="bg-sky-500 text-white hover:bg-sky-400"
                onClick={() => onAction("publish", {})}
              >
                <CheckCircle2 className="size-4" />
                Publish Saved Draft
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                asChild
              >
                <Link href="/preview" target="_blank">
                  Preview Draft <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Match & Manage Public Sections
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            Every section below is rendered in the exact visual design of your public landing page.
            Reorder, toggle visibility, and edit content in real time before publishing to your live
            visitors.
          </p>

          {/* Quick Filter Navigation */}
          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-white/10 pt-6">
            <span className="mr-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Jump to section:
            </span>
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                activeFilter === "all"
                  ? "bg-white text-[#14283b] shadow-sm"
                  : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              All Sections (5)
            </button>
            {sectionOrder.map((key, i) => {
              const meta = SECTION_METADATA[key];
              if (!meta) return null;
              const isVisible = sectionVisibility[key as keyof typeof sectionVisibility] ?? true;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFilter(key)}
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    activeFilter === key
                      ? "bg-white text-[#14283b] shadow-sm"
                      : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      isVisible ? "bg-emerald-400" : "bg-slate-400"
                    }`}
                  />
                  <span>
                    /{String(i + 1).padStart(2, "0")} {meta.label.split(" ")[0]}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setActiveFilter("footer")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                activeFilter === "footer"
                  ? "bg-white text-[#14283b] shadow-sm"
                  : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              Footer & Policies
            </button>
          </div>
        </div>

        <BorderBeam duration={14} size={220} />
      </div>

      {feedback && (
        <div className="flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 shadow-sm">
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-4 text-sky-600" />
            {feedback}
          </p>
          <button
            type="button"
            className="text-xs text-sky-700 underline"
            onClick={() => setFeedback("")}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Published Versions Drawer */}
      {showVersions && (
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Published Content History</h3>
              <p className="text-xs text-slate-500">
                Restore any previously published version back into your private draft.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowVersions(false)}>
              Close
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            {versions.length > 0 ? (
              versions.map((v) => (
                <div
                  key={v.version}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-[#14283b] text-xs font-bold text-white">
                      v{v.version}
                    </span>
                    <span className="font-medium text-slate-700">
                      Published on {new Date(v.publishedAt).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (
                        window.confirm(
                          `Restore version ${v.version}? Your current unpublished draft will be replaced with this version.`
                        )
                      ) {
                        await onAction("restore", { version: v.version });
                        setFeedback(`Restored version ${v.version} to active draft.`);
                      }
                    }}
                  >
                    <RotateCcw className="size-3.5" />
                    Restore to Draft
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Publish your first version to create restore checkpoints.
              </p>
            )}
          </div>
        </div>
      )}

      {/* SECTIONS LIST ORDERED BY sectionOrder */}
      <div className="space-y-12">
        {sectionOrder.map((sectionKey, index) => {
          if (activeFilter !== "all" && activeFilter !== sectionKey) return null;

          const meta = SECTION_METADATA[sectionKey];
          if (!meta) return null;

          const isVisible = sectionVisibility[sectionKey as keyof typeof sectionVisibility] ?? true;
          const SectionIcon = meta.icon;
          const isFirstMovable = index === 1;
          const isLastMovable = index === sectionOrder.length - 1;

          return (
            <div
              key={sectionKey}
              id={`section-${sectionKey}`}
              className="relative rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all hover:border-slate-300 sm:p-8"
            >
              {/* Section Control Header */}
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-3.5">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-sky-50 text-[#377db1]">
                    <SectionIcon className="size-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-semibold tracking-wider text-slate-400">
                        /{String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-lg font-bold tracking-tight text-slate-900">
                        {meta.label}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          isVisible
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-slate-200 bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            isVisible ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {isVisible ? "Visible on Site" : "Hidden from Visitors"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{meta.description}</p>
                  </div>
                </div>

                {/* Section Action Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Reordering */}
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      disabled={isUpdating || index <= 1}
                      onClick={() => handleMoveSection(sectionKey, "up")}
                      className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
                      title={
                        index === 0
                          ? "PoolPay stays as primary hero"
                          : isFirstMovable
                            ? "Already at top of movable sections"
                            : "Move section up"
                      }
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating || index === 0 || isLastMovable}
                      onClick={() => handleMoveSection(sectionKey, "down")}
                      className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
                      title={
                        index === 0
                          ? "PoolPay stays as primary hero"
                          : isLastMovable
                            ? "Already at bottom"
                            : "Move section down"
                      }
                    >
                      <ArrowDown className="size-4" />
                    </button>
                  </div>

                  {/* Visibility Toggle */}
                  {sectionKey !== "poolpay" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() =>
                        handleToggleVisibility(
                          sectionKey as keyof SiteContentData["sectionVisibility"]
                        )
                      }
                      className={
                        isVisible
                          ? "border-slate-200 text-slate-700"
                          : "border-emerald-300 bg-emerald-50 text-emerald-800"
                      }
                    >
                      {isVisible ? (
                        <>
                          <EyeOff className="size-3.5" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="size-3.5" />
                          Show on site
                        </>
                      )}
                    </Button>
                  ) : (
                    <span className="rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-400">
                      Primary Hero (Always Live)
                    </span>
                  )}

                  {/* Edit Content Button */}
                  <Button
                    size="sm"
                    onClick={() => {
                      if (sectionKey === "poolpay") onEditContent("poolpay");
                      else if (sectionKey === "about") onEditContent("about");
                      else if (sectionKey === "faqs") onEditContent("faqs");
                      else if (sectionKey === "services") {
                        onEditResource(
                          "Add new service",
                          {
                            ...services[0],
                            id: crypto.randomUUID(),
                            serviceId: `custom-${Date.now()}`,
                            name: "New service",
                            shortName: "New service",
                            isVisible: true,
                            sortOrder: services.length + 1
                          },
                          "services"
                        );
                      } else if (sectionKey === "appointments") {
                        onEditResource(
                          "Working hours and off days",
                          settings.scheduling,
                          "availability"
                        );
                      }
                    }}
                  >
                    <Pencil className="size-3.5" />
                    Edit {sectionKey === "services" ? "Catalog" : "Content"}
                  </Button>
                </div>
              </div>

              {/* SECTION VISUAL PREVIEWS (IDENTICAL TO LANDING PAGE) */}

              {/* 1. POOLPAY & HERO SECTION */}
              {sectionKey === "poolpay" && (
                <div className="space-y-6">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#fbfbf8] p-6 lg:p-10">
                    <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                      <div>
                        <p className="eyebrow section-eyebrow">
                          <span /> KLX LUXE PLUS · POOLPAY PARTNERSHIP
                        </p>
                        <h2 className="text-3xl font-bold tracking-tight text-[#152231] sm:text-4xl">
                          {content.poolpay.title || "PoolPay in your pocket."}
                        </h2>
                        <p className="mt-3 text-lg font-medium text-[#377db1]">
                          {content.poolpay.subtitle || "Seamless group contributions."}
                        </p>
                        <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
                          {content.poolpay.description}
                        </p>

                        {/* Feature Pills */}
                        <div className="mt-6 flex flex-wrap gap-2.5">
                          {content.poolpay.features.map((feature, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-[#24445e]"
                            >
                              <Check className="size-3 text-sky-600" />
                              {feature}
                            </span>
                          ))}
                        </div>

                        {/* Store Links Preview */}
                        <div className="mt-8 flex flex-wrap items-center gap-4">
                          <div className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                            Google Play: {content.poolpay.googlePlayUrl ? "Configured" : "Missing"}
                          </div>
                          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
                            <Smartphone className="size-4 text-slate-500" />
                            <span>
                              {content.poolpay.appStoreComingSoon
                                ? "iPhone: Coming soon badge"
                                : content.poolpay.appStoreUrl
                                  ? "iPhone: Active store link"
                                  : "iOS configuration pending"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Phone Mockup Preview */}
                      <div className="relative mx-auto flex w-full max-w-[340px] flex-col items-center justify-center py-6">
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 overflow-hidden rounded-[32px] bg-[radial-gradient(ellipse_at_center,#d0e6f3_0%,#e9f2f8_55%,transparent_75%)]"
                        >
                          <div className="absolute top-1/2 left-1/2 size-[260px] -translate-1/2 rounded-full border border-white/80" />
                          <div className="absolute top-1/2 left-1/2 size-[180px] -translate-1/2 rounded-full border border-white/80" />
                        </div>

                        <div className="relative w-[190px] rotate-3 rounded-[26px] border border-slate-600 bg-[#152231] p-[6px] shadow-2xl transition-transform hover:rotate-0">
                          <Image
                            src={content.poolpay.screenshotUrl || "/images/poolpay/groups.webp"}
                            width={664}
                            height={1440}
                            alt="PoolPay preview"
                            className="h-auto w-full rounded-[20px]"
                          />
                        </div>

                        <div className="absolute top-6 left-0 flex items-center gap-2.5 rounded-2xl border border-white bg-white/95 px-3 py-2 shadow-lg">
                          <span className="flex size-8 items-center justify-center rounded-xl bg-[#e9f2f8] text-[#377db1]">
                            <UsersRound className="size-4" />
                          </span>
                          <div>
                            <p className="text-[8px] font-semibold tracking-wider text-slate-500 uppercase">
                              CREATE & CONNECT
                            </p>
                            <p className="text-[11px] font-semibold text-slate-900">
                              Your circle starts here.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Placement: After Hero Advertisements Preview */}
                  {advertisements.filter((ad) => ad.placement === "after_hero" && ad.isActive)
                    .length > 0 && (
                    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
                          <Megaphone className="size-3.5 text-sky-600" /> SPONSORED BANNER (AFTER
                          HERO)
                        </p>
                        <Link
                          href="/admin/advertisements"
                          className="text-xs font-medium text-sky-600 hover:underline"
                        >
                          Manage Banners
                        </Link>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {advertisements
                          .filter((ad) => ad.placement === "after_hero" && ad.isActive)
                          .map((ad) => (
                            <div
                              key={ad.id}
                              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
                            >
                              <div className="min-w-0 pr-3">
                                <p className="truncate text-xs font-bold text-slate-800">
                                  {ad.title}
                                </p>
                                <p className="truncate text-[11px] text-slate-400">
                                  {ad.destinationUrl}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                Active
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. SERVICES SECTION */}
              {sectionKey === "services" && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="eyebrow section-eyebrow">
                        <span /> THOUGHTFUL SERVICES. REAL-LIFE NEEDS.
                      </p>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Life moves. Let&apos;s make it{" "}
                        <span className="text-blue-600">easier.</span>
                      </h2>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/admin/services">
                        Go to Catalog View <ArrowUpRight className="size-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {services.map((s, i) => {
                      const IconComponent =
                        SERVICE_ICONS[s.serviceId as keyof typeof SERVICE_ICONS] || FileCheck2;
                      return (
                        <article
                          key={s.id}
                          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 transition-all hover:shadow-lg sm:p-9"
                        >
                          <div className="mb-8 flex items-center justify-between">
                            <span className="rounded-2xl bg-sky-50 p-3.5 text-[#377db1]">
                              <IconComponent className="size-6" strokeWidth={1.5} />
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  s.isVisible
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {s.isVisible ? "Visible" : "Hidden"}
                              </span>
                              <span className="text-xs text-slate-400">
                                / {s.number || String(i + 1).padStart(2, "0")}
                              </span>
                            </div>
                          </div>

                          <p className="eyebrow mb-2 text-xs font-semibold text-slate-400 uppercase">
                            {s.category}
                          </p>
                          <h3 className="text-xl font-bold tracking-tight text-slate-900">
                            {s.name}
                          </h3>
                          <p className="mt-3 text-sm leading-relaxed text-slate-500">
                            {s.description}
                          </p>

                          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                            <span className="text-xs font-semibold text-[#377db1]">
                              {s.pricingMode === "quote"
                                ? "Pricing on request"
                                : `${formatMoney(s.priceCents)}${
                                    s.pricingMode === "deposit"
                                      ? ` · ${formatMoney(s.depositCents)} deposit`
                                      : ""
                                  }`}
                            </span>
                            <span className="text-xs text-slate-400">
                              {s.durationMinutes} min consultation
                            </span>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => onEditResource("Edit service & price", s, "services")}
                            >
                              Edit Service Details
                            </Button>
                          </div>

                          {s.serviceId === "transport" && <BorderBeam duration={12} size={150} />}
                        </article>
                      );
                    })}
                  </div>

                  {/* Placement: After Services Advertisements Preview */}
                  {advertisements.filter((ad) => ad.placement === "after_services" && ad.isActive)
                    .length > 0 && (
                    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
                          <Megaphone className="size-3.5 text-sky-600" /> SPONSORED BANNER (AFTER
                          SERVICES)
                        </p>
                        <Link
                          href="/admin/advertisements"
                          className="text-xs font-medium text-sky-600 hover:underline"
                        >
                          Manage Banners
                        </Link>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {advertisements
                          .filter((ad) => ad.placement === "after_services" && ad.isActive)
                          .map((ad) => (
                            <div
                              key={ad.id}
                              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
                            >
                              <div className="min-w-0 pr-3">
                                <p className="truncate text-xs font-bold text-slate-800">
                                  {ad.title}
                                </p>
                                <p className="truncate text-[11px] text-slate-400">
                                  {ad.destinationUrl}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                Active
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. ABOUT SECTION */}
              {sectionKey === "about" && (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#f0f4f4] p-8 sm:p-10">
                  <div className="grid gap-10 lg:grid-cols-2">
                    <div>
                      <p className="eyebrow section-eyebrow">
                        <span /> THE PLUS IS PERSONAL
                      </p>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        {content.about.title}
                      </h2>
                      <p className="mt-4 text-base font-medium text-[#377db1]">
                        {content.about.subtitle}
                      </p>
                      <Button className="mt-6" size="sm" onClick={() => onEditContent("about")}>
                        <Pencil className="size-3.5" /> Edit About Story & Stats
                      </Button>
                    </div>

                    <div>
                      {content.about.story.map((paragraph, i) => (
                        <p key={i} className="mb-4 text-sm leading-relaxed text-slate-600">
                          {paragraph}
                        </p>
                      ))}

                      {/* Stats Grid */}
                      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-300 pt-5">
                        {content.about.stats.map((stat, i) => (
                          <div key={i} className="rounded-xl bg-white/60 p-3.5 backdrop-blur-xs">
                            <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                            <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. APPOINTMENTS SECTION */}
              {sectionKey === "appointments" && (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <p className="eyebrow section-eyebrow">
                        <span /> YOUR TIME. OUR COMMITMENT.
                      </p>
                      <h3 className="text-xl font-bold tracking-tight text-slate-900">
                        Appointment Consultation Engine
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Visitors select services and requested consultation slots directly from your
                        calendar.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onEditResource(
                            "Working hours and off days",
                            settings.scheduling,
                            "availability"
                          )
                        }
                      >
                        <Clock className="size-3.5" /> Working Hours & Off Days
                      </Button>
                      <Button size="sm" asChild>
                        <Link href="/admin/appointments">
                          Review Requests <ArrowUpRight className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-medium text-slate-500 uppercase">
                        Active Timezone
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {settings.timezone}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Displayed on public forms</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-medium text-slate-500 uppercase">
                        Operating Hours
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {settings.scheduling.openingTime || "12:00 AM"} –{" "}
                        {settings.scheduling.closingTime || "11:59 PM"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Configurable slots</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-medium text-slate-500 uppercase">
                        Active Services
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {services.filter((s) => s.isVisible).length} Consultations
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Available to choose</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. FAQS SECTION */}
              {sectionKey === "faqs" && (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <p className="eyebrow section-eyebrow">
                        <span /> A FEW GOOD QUESTIONS
                      </p>
                      <h3 className="text-xl font-bold tracking-tight text-slate-900">
                        Before we say hello.
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Frequently asked questions and clear answers for client peace of mind.
                      </p>
                    </div>
                    <Button size="sm" onClick={() => onEditContent("faqs")}>
                      <Pencil className="size-3.5" /> Edit FAQ Questions ({content.faqs.length})
                    </Button>
                  </div>

                  <div className="mt-6 divide-y divide-slate-100">
                    {content.faqs.map((faq, i) => (
                      <div key={i} className="py-4">
                        <p className="text-sm font-semibold text-slate-800">{faq.question}</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* FOOTER & POLICIES CARD */}
        {(activeFilter === "all" || activeFilter === "footer") && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#14283b] p-8 text-white shadow-lg sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-sky-300">
                  <Layers className="size-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-white">
                    Footer & Legal Policies
                  </h3>
                  <p className="mt-1 text-xs text-slate-300">
                    Global company description, contacts, and legal policy declarations.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-white/10 text-white hover:bg-white/20"
                  onClick={() => onEditContent("footer")}
                >
                  <Pencil className="size-3.5" /> Edit Footer
                </Button>
                <Button
                  size="sm"
                  className="bg-white/10 text-white hover:bg-white/20"
                  onClick={() => onEditContent("policies")}
                >
                  <Pencil className="size-3.5" /> Edit Policies
                </Button>
              </div>
            </div>

            <div className="mt-8 grid gap-8 sm:grid-cols-3">
              <div>
                <BrandMark className="size-8 text-sky-400" />
                <p className="mt-4 text-xs leading-relaxed text-slate-300">
                  {content.footer.description}
                </p>
                <p className="mt-4 text-[11px] text-slate-400">{content.footer.copyright}</p>
              </div>

              <div>
                <p className="eyebrow mb-3 text-xs font-semibold text-sky-200">
                  LET&apos;S CONNECT
                </p>
                <p className="text-sm text-white">{settings.supportEmail}</p>
                <p className="mt-2 text-sm text-white">{settings.phone}</p>
              </div>

              <div>
                <p className="eyebrow mb-3 text-xs font-semibold text-sky-200">LEGAL POLICIES</p>
                <div className="flex flex-col gap-2 text-xs text-slate-300">
                  <span className="flex items-center gap-2">
                    <Check className="size-3 text-emerald-400" /> Privacy Policy
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="size-3 text-emerald-400" /> Terms & Conditions
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="size-3 text-emerald-400" /> Cancellation Policy
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="size-3 text-emerald-400" /> Refund Policy
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
