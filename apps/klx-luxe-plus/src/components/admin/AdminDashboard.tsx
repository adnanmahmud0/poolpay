"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowUpRight,
  BriefcaseBusiness,
  Calendar,
  CalendarDays,
  CarFront,
  ChartNoAxesCombined,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  Languages,
  Laptop,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  Paperclip,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Settings,
  Smartphone,
  Sparkles,
  Speech,
  Trash2
} from "lucide-react";

import { BorderBeam, Button } from "@repo/ui";

import type {
  KlxAdvertisement,
  KlxAppointment,
  KlxAuditLog,
  KlxMedia,
  KlxOutbox,
  KlxPayment,
  KlxQuote,
  KlxRefund,
  KlxService,
  KlxSettings,
  SiteContentData
} from "@/server/db/types";

import { timeLabel } from "../AppointmentTimes";
import { BrandMark } from "../Brand";
import { AdvertisementModal } from "./AdvertisementModal";
import { AppointmentCalendar } from "./AppointmentCalendar";
import { Editor } from "./Editor";
import { MediaGallery } from "./MediaGallery";
import { SectionManager } from "./SectionManager";

const SERVICE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  taxes: ReceiptText,
  immigration: FileCheck2,
  interpreter: Speech,
  translations: Languages,
  transport: CarFront,
  computer: Laptop,
  finance: ChartNoAxesCombined
};

interface Snapshot {
  content: SiteContentData;
  services: KlxService[];
  settings: KlxSettings;
  appointments: KlxAppointment[];
  quotes: KlxQuote[];
  payments: KlxPayment[];
  refunds: KlxRefund[];
  advertisements: KlxAdvertisement[];
  media: KlxMedia[];
  audit: KlxAuditLog[];
  versions: { version: number; publishedAt: string }[];
  notifications: KlxOutbox[];
  stripeMode: string;
}

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "content", label: "Page content", icon: FileText },
  { id: "poolpay", label: "PoolPay", icon: Smartphone },
  { id: "services", label: "Services & pricing", icon: BriefcaseBusiness },
  { id: "appointments", label: "Appointments", icon: CalendarDays },
  { id: "payments", label: "Payments & refunds", icon: CreditCard },
  { id: "advertisements", label: "Advertisements", icon: Megaphone },
  { id: "media", label: "Media library", icon: ImageIcon },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "audit-log", label: "Activity log", icon: ListChecks }
];

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n / 100);

export function AdminDashboard({
  section,
  appointmentDecision
}: {
  section: string;
  appointmentDecision?: { id: string; status: "confirmed" | "declined" };
}) {
  const router = useRouter();
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("");
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<KlxAdvertisement | null>(null);
  const [adFilter, setAdFilter] = useState<
    "all" | "active" | "after_hero" | "after_services" | "inactive"
  >("all");
  const [adSearch, setAdSearch] = useState("");
  const [editor, setEditor] = useState<{
    title: string;
    initial: unknown;
    save: (value: unknown) => Promise<void>;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/snapshot");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load dashboard.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/snapshot")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (active) setData(result);
      })
      .catch((error) => {
        if (active) setError(error instanceof Error ? error.message : "Could not load dashboard.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function action(resource: string, payload: unknown) {
    const response = await fetch(`/api/admin/${resource}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setNotice("Changes saved.");
    await load();
    return result;
  }

  async function run(resource: string, payload: unknown = {}) {
    setError("");
    try {
      await action(resource, payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    }
  }

  async function deleteItem(resource: string, id: string, name?: string) {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${name || "this item"}? This action cannot be undone.`
      )
    ) {
      return;
    }
    setError("");
    try {
      const response = await fetch(`/api/admin/${resource}?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to delete item.");
      setNotice(name ? `Deleted ${name}.` : "Item deleted successfully.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deletion failed.");
    }
  }

  const edit = (title: string, initial: unknown, resource: string) =>
    setEditor({
      title,
      initial,
      save: async (value) => {
        await action(resource, value);
      }
    });

  function contentEditor(key?: keyof SiteContentData) {
    if (!data) return;
    setEditor({
      title: key ? `${key} content` : "Page content draft",
      initial: key ? data.content[key] : data.content,
      save: async (value) => {
        await action("content", key ? { ...data.content, [key]: value } : value);
      }
    });
  }

  function reviewAppointment(appointment: KlxAppointment, status = appointment.status) {
    edit(
      status === "declined" ? "Reject appointment — reason required" : "Review appointment",
      {
        id: appointment.id,
        status,
        requestedDate: appointment.requestedDate,
        requestedTimeSlot: appointment.requestedTimeSlot,
        adminNotes: appointment.adminNotes || "",
        rejectionReason: appointment.rejectionReason || ""
      },
      "appointments"
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] lg:grid lg:grid-cols-[260px_1fr]">
      {/* Brand-consistent Sidebar */}
      <aside className="border-r border-slate-200 bg-[#14283b] p-6 text-white lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <Link href="/admin" className="flex items-center gap-3">
          <BrandMark className="size-8 text-sky-400" />
          <div>
            <span className="block text-base font-bold tracking-tight text-white">
              KLX <span className="text-sky-300">LUXE</span> PLUS
            </span>
            <span className="block text-[9px] font-semibold tracking-[.2em] text-sky-200 uppercase">
              BUSINESS ADMINISTRATION
            </span>
          </div>
        </Link>

        <div className="mt-8">
          <p className="mb-2.5 px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Navigation
          </p>
          <nav aria-label="Administration" className="flex gap-1.5 overflow-x-auto lg:flex-col">
            {NAV.map((item) => (
              <Link
                key={item.id}
                href={item.id === "overview" ? "/admin" : `/admin/${item.id}`}
                aria-current={section === item.id ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                  section === item.id
                    ? "bg-white/15 font-semibold text-white shadow-xs"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="size-4 text-sky-300" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <Button
          variant="ghost"
          className="mt-8 text-white hover:bg-white/10 hover:text-white"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.replace("/admin/login");
            router.refresh();
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </aside>

      {/* Main Dashboard Canvas */}
      <main className="min-w-0 p-5 sm:p-9 lg:p-12">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow section-eyebrow mb-2">
              <span /> KLX LUXE PLUS LLC · ADMINISTRATION
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[#152231]">
              {NAV.find((n) => n.id === section)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-xs font-semibold text-sky-800">
              <span className="size-1.5 rounded-full bg-sky-500" />
              Stripe {data?.stripeMode || "test"}
            </span>
            <Button variant="outline" asChild>
              <Link href="/" target="_blank">
                View website
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700 shadow-xs">
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mb-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 shadow-xs"
          >
            {notice}
          </p>
        )}

        {!data ? (
          <p className="text-sm text-slate-500">
            {error
              ? "Check the database configuration and refresh to retry."
              : "Loading your business…"}
          </p>
        ) : (
          <>
            {/* OVERVIEW SECTION: MATCHING LANDING PAGE AESTHETICS */}
            {section === "overview" && (
              <>
                {/* Executive Hero Banner */}
                <div className="relative mb-10 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#14283b] via-[#1a334b] to-[#122334] p-8 text-white shadow-xl sm:p-10">
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                    <div>
                      <p className="eyebrow mb-3 flex items-center gap-2.5 text-xs font-semibold tracking-widest text-sky-300">
                        <span className="status-dot" /> EXECUTIVE DASHBOARD · REAL-TIME INSIGHTS
                      </p>
                      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Your Business, at a Glance
                      </h2>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
                        Monitor appointments, customer orders, services, and live landing page
                        sections directly aligned with your public website.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild size="sm" className="bg-sky-500 text-white hover:bg-sky-400">
                        <Link href="/admin/content">
                          Manage Landing Page Sections <ArrowUpRight className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                        asChild
                      >
                        <Link href="/" target="_blank">
                          View Live Site <ArrowUpRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <BorderBeam duration={14} size={250} />
                </div>

                {/* 4 KPI Metrics Cards */}
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: "Awaiting review",
                      value: data.appointments.filter((a) => a.status === "requested").length,
                      icon: CalendarDays,
                      hint: "Pending consultation requests"
                    },
                    {
                      label: "Payments received",
                      value: formatMoney(
                        data.payments
                          .filter((p) =>
                            ["paid", "partially_refunded", "refunded"].includes(p.status)
                          )
                          .reduce((n, p) => n + p.amountCents - p.refundedAmountCents, 0)
                      ),
                      icon: CreditCard,
                      hint: "Net collected balance"
                    },
                    {
                      label: "Visible services",
                      value: data.services.filter((s) => s.isVisible).length,
                      icon: BriefcaseBusiness,
                      hint: "Active on landing page"
                    },
                    {
                      label: "Active advertisements",
                      value: data.advertisements.filter((a) => a.isActive).length,
                      icon: Megaphone,
                      hint: "Live sponsored banners"
                    }
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-xs transition-all hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex size-11 items-center justify-center rounded-2xl bg-sky-50 text-[#377db1]">
                          <card.icon className="size-5" />
                        </span>
                        <span className="size-2 rounded-full bg-emerald-500" />
                      </div>
                      <p className="mt-5 text-3xl font-bold tracking-tight text-[#152231]">
                        {card.value}
                      </p>
                      <p className="mt-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        {card.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
                    </div>
                  ))}
                </div>

                {/* Landing Page Sections Status Widget */}
                <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <p className="eyebrow section-eyebrow mb-2">
                        <span /> PUBLIC WEBSITE STRUCTURE
                      </p>
                      <h3 className="text-xl font-bold tracking-tight text-[#152231]">
                        Landing Page Sections At A Glance
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Active section order and visibility as seen by visitors on your live
                        website.
                      </p>
                    </div>
                    <Button asChild size="sm">
                      <Link href="/admin/content">
                        Edit & Reorder Sections <ArrowUpRight className="size-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {data.content.sectionOrder.map((sectionKey, idx) => {
                      const isLive =
                        data.content.sectionVisibility[
                          sectionKey as keyof typeof data.content.sectionVisibility
                        ] ?? true;
                      const titles: Record<string, string> = {
                        poolpay: "Hero / PoolPay",
                        services: "Services Catalog",
                        about: "About & Story",
                        appointments: "Consultations",
                        faqs: "Frequently Asked"
                      };
                      return (
                        <div
                          key={sectionKey}
                          className="rounded-2xl border border-slate-200 bg-[#fbfbf8] p-4 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-400">
                              /{String(idx + 1).padStart(2, "0")}
                            </span>
                            <span
                              className={`size-2 rounded-full ${
                                isLive ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                            />
                          </div>
                          <p className="mt-3 font-bold text-slate-900">
                            {titles[sectionKey] || sectionKey}
                          </p>
                          <p className="mt-1 text-slate-500">
                            {isLive ? "Visible to public" : "Hidden"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Blocks */}
                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
                    <p className="eyebrow section-eyebrow mb-2">
                      <span /> OPERATIONS & BOOKINGS
                    </p>
                    <h3 className="text-lg font-bold text-[#152231]">Ready for the next step?</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      Review incoming appointment requests, adjust consultation pricing, and keep
                      your business current.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button asChild>
                        <Link href="/admin/appointments">Review appointments</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/admin/services">Manage services</Link>
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
                    <p className="eyebrow section-eyebrow mb-2">
                      <span /> SYSTEM NOTIFICATIONS
                    </p>
                    <h3 className="text-lg font-bold text-[#152231]">Notification queue</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {data.notifications.length} messages awaiting delivery or retry in your
                      business outbox.
                    </p>
                    <Button className="mt-6" variant="outline" onClick={() => run("notifications")}>
                      Process pending emails
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* PAGE CONTENT & POOLPAY: USING FULL VISUAL SectionManager */}
            {["content", "poolpay"].includes(section) && (
              <SectionManager
                content={data.content}
                services={data.services}
                settings={data.settings}
                advertisements={data.advertisements}
                versions={data.versions}
                onAction={action}
                onEditContent={contentEditor}
                onEditResource={edit}
                formatMoney={formatMoney}
                initialFocusSection={section === "poolpay" ? "poolpay" : undefined}
              />
            )}

            {/* SERVICES SECTION: LUXURY LANDING PAGE SERVICE CARDS */}
            {section === "services" && (
              <div className="space-y-8">
                <div className="flex flex-wrap items-end justify-between gap-6">
                  <div>
                    <p className="eyebrow section-eyebrow">
                      <span /> THOUGHTFUL SERVICES. REAL-LIFE NEEDS.
                    </p>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      Service Catalog & Pricing
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Consultation definitions, pricing models, durations, and landing page
                      visibility.
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      edit(
                        "New service",
                        {
                          ...data.services[0],
                          id: crypto.randomUUID(),
                          serviceId: `custom-${Date.now()}`,
                          name: "New service",
                          shortName: "New service",
                          category: "CONSULTING",
                          description: "New professional service description.",
                          action: "Book consultation",
                          pricingMode: "quote",
                          priceCents: 0,
                          depositCents: 0,
                          durationMinutes: 30,
                          isVisible: true,
                          sortOrder: data.services.length + 1
                        },
                        "services"
                      )
                    }
                  >
                    <Plus className="size-4" /> Add service
                  </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {data.services.map((s, i) => {
                    const IconComponent =
                      SERVICE_ICONS[s.serviceId as keyof typeof SERVICE_ICONS] || FileCheck2;
                    return (
                      <article
                        key={s.id}
                        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition-all hover:shadow-xl sm:p-10"
                      >
                        <div className="mb-8 flex items-center justify-between">
                          <span className="rounded-2xl bg-sky-50 p-4 text-[#377db1]">
                            <IconComponent className="size-7" strokeWidth={1.5} />
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                s.isVisible
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border border-slate-200 bg-slate-100 text-slate-500"
                              }`}
                            >
                              {s.isVisible ? "Visible on landing page" : "Hidden"}
                            </span>
                            <span className="text-xs text-slate-400">
                              / {s.number || String(i + 1).padStart(2, "0")}
                            </span>
                          </div>
                        </div>

                        <p className="eyebrow mb-2 text-xs font-semibold text-slate-400 uppercase">
                          {s.category}
                        </p>
                        <h3 className="text-2xl font-bold tracking-tight text-[#152231]">
                          {s.name}
                        </h3>
                        <p className="mt-4 text-sm leading-relaxed text-slate-500">
                          {s.description}
                        </p>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                          <p className="text-sm font-semibold text-[#377db1]">
                            {s.pricingMode === "quote"
                              ? "Pricing on request"
                              : `${formatMoney(s.priceCents)}${
                                  s.pricingMode === "deposit"
                                    ? ` · ${formatMoney(s.depositCents)} deposit`
                                    : ""
                                }`}
                          </p>
                          <span className="text-xs text-slate-400">
                            {s.durationMinutes} minutes · Order #{s.sortOrder}
                          </span>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => edit("Edit service & price", s, "services")}
                          >
                            <Pencil className="size-3.5" /> Edit service
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              action("services", {
                                ...s,
                                isVisible: !s.isVisible
                              })
                            }
                          >
                            {s.isVisible ? (
                              <>
                                <EyeOff className="size-3.5" /> Hide from site
                              </>
                            ) : (
                              <>
                                <Eye className="size-3.5" /> Show on site
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                            onClick={() => deleteItem("services", s.id, `service "${s.name}"`)}
                          >
                            <Trash2 className="size-3.5" /> Delete
                          </Button>
                        </div>

                        {s.serviceId === "transport" && <BorderBeam duration={12} size={150} />}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
            {section === "appointments" && (
              <>
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="font-semibold">Appointment availability</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {data.settings.timezone} ·{" "}
                    {data.settings.scheduling.openingTime
                      ? timeLabel(data.settings.scheduling.openingTime)
                      : "12:00 AM"}
                    –
                    {data.settings.scheduling.closingTime
                      ? timeLabel(data.settings.scheduling.closingTime)
                      : "12:00 AM (next day)"}
                    . Requests reserve the full service duration until accepted or rejected. Uncheck
                    working days to set weekly off days, and add blocked dates for holidays.
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() =>
                      edit("Working hours and off days", data.settings.scheduling, "availability")
                    }
                  >
                    Set working hours & off days
                  </Button>
                </div>
                {appointmentDecision &&
                  (() => {
                    const appointment = data.appointments.find(
                      (item) => item.id === appointmentDecision.id
                    );
                    return appointment ? (
                      <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
                        <p className="mb-3 text-sm">
                          Email action: {appointment.customerName} · {appointment.reference}. Review
                          before submitting.
                        </p>
                        <Button
                          onClick={() => reviewAppointment(appointment, appointmentDecision.status)}
                        >
                          {appointmentDecision.status === "confirmed"
                            ? "Review acceptance"
                            : "Enter rejection reason"}
                        </Button>
                      </div>
                    ) : (
                      <p className="mb-4 text-sm">
                        This appointment is not in the recent list. Search its reference in the
                        administration records.
                      </p>
                    );
                  })()}
                <AppointmentCalendar appointments={data.appointments} onSelect={setFilter} />
                <label className="mb-5 block max-w-sm text-sm">
                  Filter appointments
                  <input
                    className="klx-input mt-2"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Name, reference or status"
                  />
                </label>
                <div className="grid gap-4">
                  {data.appointments
                    .filter((a) =>
                      `${a.customerName} ${a.reference} ${a.status} ${a.requestedDate}`
                        .toLowerCase()
                        .includes(filter.toLowerCase())
                    )
                    .map((a) => (
                      <div
                        key={a.id}
                        className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6"
                      >
                        <div>
                          <p className="text-xs text-sky-700">
                            {a.reference} · {a.status}
                          </p>
                          <h3 className="mt-2 font-semibold">
                            {a.customerName} · {a.serviceName}
                          </h3>
                          <p className="mt-2 text-sm text-slate-500">
                            {a.requestedDate} at {timeLabel(a.requestedTimeSlot)} · {a.timezone}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {a.customerEmail} · {a.customerPhone}
                          </p>
                          <p className="mt-3 text-sm text-slate-500">{a.customerNotes}</p>
                          {(a.sourceLanguage || a.targetLanguage) && (
                            <p className="mt-2 text-xs font-semibold text-slate-800">
                              Language:{" "}
                              <span className="text-sky-700">
                                {a.sourceLanguage || "Specified"} →{" "}
                                {a.targetLanguage || "Specified"}
                              </span>
                              {a.interpretationSetting
                                ? ` · Setting: ${a.interpretationSetting}`
                                : ""}
                            </p>
                          )}
                          {a.translationReason && (
                            <p className="mt-1 text-xs text-slate-700">
                              Reason:{" "}
                              <span className="font-medium text-slate-900">
                                {a.translationReason}
                              </span>
                              {a.documentTypes?.length
                                ? ` · Category: ${a.documentTypes.join(", ")}`
                                : ""}
                            </p>
                          )}
                          {a.attachedDocuments && a.attachedDocuments.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              <p className="text-xs font-semibold text-slate-700">
                                Attached Documents ({a.attachedDocuments.length}):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {a.attachedDocuments.map((doc) => (
                                  <a
                                    key={doc.id}
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50/70 px-2.5 py-1 text-xs font-medium text-sky-800 transition-colors hover:bg-sky-100 hover:text-sky-950"
                                  >
                                    <Paperclip className="size-3" />
                                    <span className="max-w-[180px] truncate">{doc.name}</span>
                                    <span className="text-[10px] text-slate-400">
                                      ({(doc.size / 1024).toFixed(0)} KB)
                                    </span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          {(a.pickupLocation || a.dropoffLocation) && (
                            <div className="mt-3 space-y-1 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-800">
                              <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                                <CarFront className="size-3.5 text-sky-600" />
                                Route: {a.pickupLocation || "Pickup N/A"} →{" "}
                                {a.dropoffLocation || "Drop-off N/A"}
                              </p>
                              <p className="text-slate-600">
                                Vehicle:{" "}
                                <span className="font-medium">{a.vehicleClass || "Standard"}</span>{" "}
                                · {a.passengers || 1} passenger(s)
                                {a.estimatedFareCents
                                  ? ` · Fare: $${(a.estimatedFareCents / 100).toFixed(2)}`
                                  : ""}
                                {a.payNow
                                  ? " · [Paid / Stripe Checkout]"
                                  : " · [Reserve on Invoice]"}
                              </p>
                            </div>
                          )}
                          {a.rejectionReason && (
                            <p className="mt-2 text-sm text-red-700">
                              Rejection reason: {a.rejectionReason}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              edit(
                                "Manage appointment",
                                {
                                  id: a.id,
                                  status: a.status,
                                  requestedDate: a.requestedDate,
                                  requestedTimeSlot: a.requestedTimeSlot,
                                  adminNotes: a.adminNotes || "",
                                  rejectionReason: a.rejectionReason || ""
                                },
                                "appointments"
                              )
                            }
                          >
                            Manage
                          </Button>
                          {a.status === "requested" && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => reviewAppointment(a, "confirmed")}>
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => reviewAppointment(a, "declined")}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                            onClick={() =>
                              deleteItem(
                                "appointments",
                                a.id,
                                `appointment ${a.reference} (${a.customerName})`
                              )
                            }
                          >
                            <Trash2 className="size-3.5" /> Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  {!data.appointments.length && (
                    <p className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                      New appointment requests will appear here.
                    </p>
                  )}
                </div>
              </>
            )}
            {section === "payments" && (
              <>
                <div className="mb-6 flex flex-wrap gap-3">
                  <Button
                    onClick={() =>
                      edit(
                        "Create customer order",
                        {
                          requestId: crypto.randomUUID(),
                          appointmentId: "",
                          customerName: "",
                          customerEmail: "",
                          serviceName: "",
                          description: "",
                          amountCents: 0,
                          depositCents: 0,
                          expiresInDays: 14
                        },
                        "quotes"
                      )
                    }
                  >
                    Create customer order
                  </Button>
                  <Button variant="outline" onClick={() => run("reconcile")}>
                    Sync Stripe status
                  </Button>
                </div>
                <p className="mb-4 text-sm text-slate-500">
                  Create an order after agreeing on the price. A private payment link and short
                  reference are queued for email delivery. Prices are locked; cancel an unused order
                  and create a replacement to change the amount.
                </p>
                <h3 className="mb-4 font-semibold">Customer orders</h3>
                <div className="mb-10 grid gap-4">
                  {data.quotes.map((q) => (
                    <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-6">
                      <div className="flex flex-wrap justify-between gap-3">
                        <span className="font-medium">
                          {q.quoteNumber} · {q.serviceName} · {q.customerName}
                        </span>
                        <span className="text-sm">
                          {formatMoney(q.amountCents)} · {q.status}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        {q.customerEmail} · Balance {formatMoney(q.balanceCents)}
                      </p>
                      <Link
                        target="_blank"
                        href={`/pay/${q.token}`}
                        className="mt-4 inline-block text-xs text-sky-700 underline"
                      >
                        Open customer payment link
                      </Link>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {["pending", "deposit_paid"].includes(q.status) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => run("orders", { id: q.id, action: "resend" })}
                            >
                              Resend payment email
                            </Button>
                            {q.status === "pending" && !q.checkoutStartedAt && !q.checkoutUntil && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Cancel unpaid order ${q.quoteNumber}? Its payment link will stop working.`
                                    )
                                  )
                                    void run("orders", { id: q.id, action: "cancel" });
                                }}
                              >
                                Cancel unpaid order
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                          onClick={() =>
                            deleteItem("quotes", q.id, `order ${q.quoteNumber} (${q.customerName})`)
                          }
                        >
                          <Trash2 className="size-3.5" /> Delete order
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <h3 className="mb-4 font-semibold">Transactions</h3>
                <div className="grid gap-4">
                  {data.payments.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-6">
                      <p className="font-semibold">
                        {formatMoney(p.amountCents)} · {p.status}
                      </p>
                      <p className="mt-3 text-xs text-slate-500">
                        {p.customerEmail} · {p.mode} · Refunded {formatMoney(p.refundedAmountCents)}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        {["paid", "partially_refunded"].includes(p.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const operationId = p.refundOperation || crypto.randomUUID();
                              setEditor({
                                title: "Review refund to original payment method",
                                initial: {
                                  amountCents:
                                    p.reservedRefundCents || p.amountCents - p.refundedAmountCents,
                                  reason: "Requested by customer"
                                },
                                save: async (value) => {
                                  if (!window.confirm("Issue this refund through Stripe?"))
                                    throw new Error("Refund cancelled.");
                                  await action("refunds", {
                                    ...(value as object),
                                    id: p.id,
                                    operationId
                                  });
                                }
                              });
                            }}
                          >
                            Full / partial refund
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                          onClick={() =>
                            deleteItem("payments", p.id, `payment record ${p.id.slice(0, 8)}...`)
                          }
                        >
                          <Trash2 className="size-3.5" /> Delete record
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <h3 className="mt-10 mb-4 font-semibold">Refund history</h3>
                {data.refunds.map((r) => (
                  <p key={r.id} className="mb-3 rounded-xl bg-white p-4 text-sm">
                    {formatMoney(r.amountCents)} · {r.status} · {r.reason}
                  </p>
                ))}
              </>
            )}
            {section === "advertisements" &&
              (() => {
                const activeCount = data.advertisements.filter((a) => a.isActive).length;
                const heroCount = data.advertisements.filter(
                  (a) => a.placement === "after_hero"
                ).length;
                const servicesCount = data.advertisements.filter(
                  (a) => a.placement === "after_services"
                ).length;

                const filteredAds = data.advertisements.filter((ad) => {
                  if (adFilter === "active" && !ad.isActive) return false;
                  if (adFilter === "inactive" && ad.isActive) return false;
                  if (adFilter === "after_hero" && ad.placement !== "after_hero") return false;
                  if (adFilter === "after_services" && ad.placement !== "after_services")
                    return false;
                  if (adSearch.trim()) {
                    const q = adSearch.toLowerCase();
                    return (
                      ad.title.toLowerCase().includes(q) ||
                      ad.destinationUrl.toLowerCase().includes(q) ||
                      ad.altText.toLowerCase().includes(q)
                    );
                  }
                  return true;
                });

                return (
                  <div className="space-y-6">
                    {/* Top Stats & Actions Header */}
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#14283b] via-[#19324a] to-[#122334] p-6 text-white shadow-xl sm:p-8">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="flex size-2 animate-pulse rounded-full bg-emerald-400" />
                            <p className="text-xs font-semibold tracking-widest text-sky-300 uppercase">
                              LANDING PAGE SPONSORED BANNERS
                            </p>
                          </div>
                          <h2 className="mt-1 text-2xl font-bold tracking-tight">
                            Advertisements Manager
                          </h2>
                          <p className="mt-1 max-w-xl text-xs text-slate-300">
                            Configure sponsored banners for PoolPay and professional services with
                            live placement controls, click destinations, and schedule validation.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            onClick={async () => {
                              try {
                                await action("seed-advertisements", {});
                                setNotice("Default verified advertisements loaded.");
                              } catch (e) {
                                setError(e instanceof Error ? e.message : "Failed to seed ads.");
                              }
                            }}
                          >
                            <Sparkles className="size-3.5" /> Load Valid Sample Ads
                          </Button>
                          <Button
                            size="sm"
                            className="bg-sky-500 font-semibold text-white hover:bg-sky-400"
                            onClick={() => {
                              setEditingAd(null);
                              setAdModalOpen(true);
                            }}
                          >
                            <Plus className="size-4" /> Add Advertisement
                          </Button>
                        </div>
                      </div>

                      {/* Metric Cards Grid */}
                      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
                          <span className="text-[11px] font-medium text-slate-300">
                            Total Banners
                          </span>
                          <p className="mt-1 text-2xl font-bold">{data.advertisements.length}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 backdrop-blur-xs">
                          <span className="text-[11px] font-medium text-emerald-300">
                            Active Live
                          </span>
                          <p className="mt-1 text-2xl font-bold text-emerald-300">{activeCount}</p>
                        </div>
                        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 backdrop-blur-xs">
                          <span className="text-[11px] font-medium text-sky-300">After Hero</span>
                          <p className="mt-1 text-2xl font-bold text-sky-300">{heroCount}</p>
                        </div>
                        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 backdrop-blur-xs">
                          <span className="text-[11px] font-medium text-indigo-300">
                            After Services
                          </span>
                          <p className="mt-1 text-2xl font-bold text-indigo-300">{servicesCount}</p>
                        </div>
                      </div>
                    </div>

                    {/* Filter & Search Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(
                          [
                            { id: "all", label: `All (${data.advertisements.length})` },
                            { id: "active", label: `Active (${activeCount})` },
                            { id: "after_hero", label: `Hero Placement (${heroCount})` },
                            {
                              id: "after_services",
                              label: `Services Placement (${servicesCount})`
                            },
                            {
                              id: "inactive",
                              label: `Inactive (${data.advertisements.length - activeCount})`
                            }
                          ] as const
                        ).map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setAdFilter(tab.id)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                              adFilter === tab.id
                                ? "bg-[#14283b] text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="relative min-w-[240px]">
                        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search by title or link…"
                          value={adSearch}
                          onChange={(e) => setAdSearch(e.target.value)}
                          className="klx-input pl-9 text-xs"
                        />
                      </div>
                    </div>

                    {/* Advertisement Cards Grid */}
                    {filteredAds.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                          <Megaphone className="size-7" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-slate-900">
                          No Advertisements Found
                        </h3>
                        <p className="mt-1 max-w-md text-xs text-slate-500">
                          {adSearch
                            ? `No banners match "${adSearch}". Try clearing your search term.`
                            : "Get started by creating a sponsored advertisement banner or loading pre-verified PoolPay & service templates."}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                          <Button
                            size="sm"
                            className="bg-sky-600 text-white hover:bg-sky-700"
                            onClick={() => {
                              setEditingAd(null);
                              setAdModalOpen(true);
                            }}
                          >
                            <Plus className="size-3.5" /> Create Advertisement
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await action("seed-advertisements", {});
                                setNotice("Default advertisements seeded successfully.");
                              } catch (e) {
                                setError(e instanceof Error ? e.message : "Failed to seed ads.");
                              }
                            }}
                          >
                            <Sparkles className="size-3.5" /> Load Valid Sample Ads
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-5 md:grid-cols-2">
                        {filteredAds.map((ad) => {
                          const isScheduled = ad.startDate || ad.endDate;
                          const now = new Date();
                          const isExpired = ad.endDate && new Date(ad.endDate) < now;
                          const isUpcoming = ad.startDate && new Date(ad.startDate) > now;

                          return (
                            <div
                              key={ad.id}
                              className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xs transition hover:shadow-md"
                            >
                              <div>
                                {/* Card Image Preview Banner */}
                                <div className="relative mb-4 aspect-[3/1] max-h-44 w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-900/5">
                                  <Image
                                    src={ad.imageUrl}
                                    alt={ad.altText || ad.title}
                                    fill
                                    unoptimized
                                    className="object-contain"
                                  />
                                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-xs ${
                                        ad.isActive
                                          ? "bg-emerald-500 text-white"
                                          : "bg-slate-700 text-slate-200"
                                      }`}
                                    >
                                      <span
                                        className={`size-1.5 rounded-full ${
                                          ad.isActive ? "animate-pulse bg-white" : "bg-slate-400"
                                        }`}
                                      />
                                      {ad.isActive ? "ACTIVE" : "INACTIVE"}
                                    </span>
                                  </div>
                                </div>

                                {/* Badges Row */}
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                      ad.placement === "after_hero"
                                        ? "border-sky-200 bg-sky-50 text-sky-700"
                                        : "border-indigo-200 bg-indigo-50 text-indigo-700"
                                    }`}
                                  >
                                    {ad.placement === "after_hero"
                                      ? "Placement: After Hero"
                                      : "Placement: After Services"}
                                  </span>

                                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                    Priority: {ad.priority}
                                  </span>

                                  {isScheduled ? (
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-medium ${
                                        isExpired
                                          ? "border-amber-200 bg-amber-50 text-amber-700"
                                          : isUpcoming
                                            ? "border-purple-200 bg-purple-50 text-purple-700"
                                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      }`}
                                    >
                                      <Calendar className="size-3" />
                                      {isExpired
                                        ? "Expired Schedule"
                                        : isUpcoming
                                          ? "Scheduled (Future)"
                                          : "Scheduled (Live)"}
                                    </span>
                                  ) : (
                                    <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-400">
                                      Runs Indefinitely
                                    </span>
                                  )}
                                </div>

                                {/* Title */}
                                <h3 className="text-base leading-snug font-bold text-slate-900">
                                  {ad.title}
                                </h3>

                                {/* Destination URL */}
                                <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                  <span className="truncate pr-2 font-mono text-[11px] text-slate-700">
                                    {ad.destinationUrl}
                                  </span>
                                  <a
                                    href={ad.destinationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-sky-600 hover:underline"
                                  >
                                    Test <ExternalLink className="size-3" />
                                  </a>
                                </div>

                                {/* Alt Text Preview */}
                                {ad.altText && (
                                  <p className="mt-2 line-clamp-1 text-[11px] text-slate-400 italic">
                                    Alt: &ldquo;{ad.altText}&rdquo;
                                  </p>
                                )}
                              </div>

                              {/* Card Footer Actions */}
                              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await action("advertisements", {
                                        ...ad,
                                        isActive: !ad.isActive
                                      });
                                      setNotice(
                                        `Advertisement "${ad.title}" is now ${
                                          !ad.isActive ? "active" : "inactive"
                                        }.`
                                      );
                                    } catch (e) {
                                      setError(
                                        e instanceof Error ? e.message : "Failed to toggle status."
                                      );
                                    }
                                  }}
                                  className="text-xs"
                                >
                                  {ad.isActive ? (
                                    <>
                                      <EyeOff className="size-3.5" /> Pause
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="size-3.5" /> Activate
                                    </>
                                  )}
                                </Button>

                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingAd(ad);
                                      setAdModalOpen(true);
                                    }}
                                    className="text-xs"
                                  >
                                    <Pencil className="size-3.5" /> Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-200 text-xs text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                                    onClick={() =>
                                      deleteItem(
                                        "advertisements",
                                        ad.id,
                                        `advertisement "${ad.title}"`
                                      )
                                    }
                                  >
                                    <Trash2 className="size-3.5" /> Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            {section === "media" && (
              <>
                <MediaGallery refreshKey={data.media[0]?.id || "empty"} onDeleted={load} />
                <form
                  className="mb-7 rounded-2xl border border-slate-200 bg-white p-7"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const response = await fetch("/api/admin/media", {
                        method: "POST",
                        body: new FormData(e.currentTarget)
                      });
                      const result = await response.json();
                      if (!response.ok) throw new Error(result.error);
                      await load();
                      setNotice("Image uploaded. Copy its URL into your page or advertisement.");
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Upload failed.");
                    }
                  }}
                >
                  <label className="block text-sm">
                    Image (JPEG, PNG or WebP, up to 5 MB)
                    <input
                      name="file"
                      type="file"
                      required
                      accept="image/jpeg,image/png,image/webp"
                      className="klx-input mt-3"
                    />
                  </label>
                  <label className="mt-5 block text-sm">
                    Image description
                    <input name="altText" className="klx-input mt-2" />
                  </label>
                  <Button className="mt-5" type="submit">
                    Upload image
                  </Button>
                </form>
              </>
            )}
            {section === "settings" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-7">
                <h3 className="font-semibold">Business settings</h3>
                <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                  <dt>Support email</dt>
                  <dd>{data.settings.supportEmail}</dd>
                  <dt>Phone</dt>
                  <dd>{data.settings.phone}</dd>
                  <dt>Business timezone</dt>
                  <dd>{data.settings.timezone}</dd>
                  <dt>Currency</dt>
                  <dd>{data.settings.currency.toUpperCase()}</dd>
                </dl>
                <Button
                  className="mt-8"
                  onClick={() => edit("Business settings", data.settings, "settings")}
                >
                  Edit settings
                </Button>
                <p className="mt-5 text-xs leading-6 text-slate-500">
                  Publish policy text through Page content. Stripe credentials are configured on the
                  server.
                </p>
              </div>
            )}
            {section === "audit-log" && (
              <div className="space-y-3">
                {data.audit.map((a) => (
                  <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-sm font-medium">{a.action.replaceAll("_", " ")}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {a.actorEmail} · {new Date(a.createdAt).toLocaleString()} · {a.entityType}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {editor && <Editor {...editor} onSave={editor.save} onClose={() => setEditor(null)} />}
        {adModalOpen && (
          <AdvertisementModal
            open={adModalOpen}
            initialData={editingAd}
            onClose={() => {
              setAdModalOpen(false);
              setEditingAd(null);
            }}
            onSave={async (adValues) => {
              await action("advertisements", adValues);
              setNotice(
                editingAd
                  ? `Advertisement "${adValues.title}" updated successfully.`
                  : `Advertisement "${adValues.title}" created successfully.`
              );
            }}
          />
        )}
      </main>
    </div>
  );
}
