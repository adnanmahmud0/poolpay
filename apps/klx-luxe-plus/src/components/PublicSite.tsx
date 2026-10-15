"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  ArrowUpRight,
  CarFront,
  ChartNoAxesCombined,
  FileCheck2,
  Languages,
  Laptop,
  ReceiptText
} from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { BorderBeam, Button } from "@repo/ui";

import type {
  KlxAdvertisement,
  KlxService,
  PublicSettings,
  SiteContentData
} from "@/server/db/types";

import { AppDownload } from "./AppDownload";
import { AppointmentForm } from "./AppointmentForm";
import { Brand } from "./Brand";
import { OrderLookup } from "./OrderLookup";

gsap.registerPlugin(useGSAP, ScrollTrigger);
const ICONS = {
  taxes: ReceiptText,
  immigration: FileCheck2,
  translations: Languages,
  transport: CarFront,
  computer: Laptop,
  finance: ChartNoAxesCombined
};
function Advertisements({ ads }: { ads: KlxAdvertisement[] }) {
  return ads.map((ad) => (
    <aside key={ad.id} className="section-shell my-12">
      <p className="mb-2 text-[10px] tracking-widest text-slate-500">ADVERTISEMENT</p>
      <a
        href={ad.destinationUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block overflow-hidden rounded-2xl"
      >
        <figure>
          <Image
            src={ad.imageUrl}
            alt={ad.altText}
            width={1200}
            height={300}
            className="max-h-72 w-full object-contain"
          />
          <figcaption className="sr-only">{ad.title}</figcaption>
        </figure>
      </a>
    </aside>
  ));
}
export function PublicSite({
  content,
  services,
  settings,
  advertisements,
  preview = false
}: {
  content: SiteContentData;
  services: KlxService[];
  settings: PublicSettings;
  advertisements: KlxAdvertisement[];
  preview?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) =>
          gsap.from(el, {
            y: 24,
            autoAlpha: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 94%", once: true }
          })
        );
      });
      return () => media.revert();
    },
    { scope: root }
  );
  const sections: Record<string, React.ReactNode> = {
    poolpay: (
      <>
        <AppDownload content={content} featured />
        <Advertisements ads={advertisements.filter((a) => a.placement === "after_hero")} />
      </>
    ),
    services: (
      <>
        <section id="services" className="section-shell py-24">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6" data-reveal>
            <div>
              <p className="eyebrow section-eyebrow">
                <span /> THOUGHTFUL SERVICES. REAL-LIFE NEEDS.
              </p>
              <h2>
                Life moves.
                <br />
                Let&apos;s make it <span className="text-blue-600">easier.</span>
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-7 text-slate-500">
              From paperwork to your next journey. Personal assistance starts with one conversation.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {services.map((s, i) => {
              const Icon = ICONS[s.serviceId as keyof typeof ICONS] || FileCheck2;
              return (
                <article
                  key={s.id}
                  data-reveal
                  className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-lg sm:p-10"
                >
                  <div className="mb-10 flex items-center justify-between">
                    <span className="rounded-2xl bg-sky-50 p-4 text-[#377db1]">
                      <Icon className="size-7" strokeWidth={1.5} />
                    </span>
                    <span className="text-xs text-slate-400">
                      / {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="eyebrow mb-3 text-slate-500">{s.category}</p>
                  <h3 className="text-2xl font-semibold tracking-tight">{s.name}</h3>
                  <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">{s.description}</p>
                  <p className="mt-4 text-xs font-medium text-[#377db1]">
                    {s.pricingMode === "quote"
                      ? "Pricing on request"
                      : `${new Intl.NumberFormat("en-US", { style: "currency", currency: settings.currency }).format(s.priceCents / 100)}${s.pricingMode === "deposit" ? ` · ${new Intl.NumberFormat("en-US", { style: "currency", currency: settings.currency }).format(s.depositCents / 100)} deposit` : ""}`}
                  </p>
                  <a
                    href="#appointments"
                    className="mt-7 inline-flex items-center gap-2 text-sm font-semibold"
                  >
                    {s.action}
                    <ArrowUpRight className="size-4" />
                  </a>
                  {s.serviceId === "transport" && <BorderBeam duration={12} size={150} />}
                </article>
              );
            })}
          </div>
        </section>
        <Advertisements ads={advertisements.filter((a) => a.placement === "after_services")} />
      </>
    ),
    about: (
      <section id="about" className="border-y border-slate-200 bg-[#f0f4f4] py-24">
        <div className="section-shell grid gap-12 lg:grid-cols-2">
          <div data-reveal>
            <p className="eyebrow section-eyebrow">
              <span /> THE PLUS IS PERSONAL
            </p>
            <h2>{content.about.title}</h2>
            <p className="mt-6 text-lg text-[#377db1]">{content.about.subtitle}</p>
          </div>
          <div data-reveal>
            {content.about.story.map((p, i) => (
              <p key={i} className="mb-5 text-sm leading-8 text-slate-600">
                {p}
              </p>
            ))}
            <div className="mt-8 grid grid-cols-2 gap-5">
              {content.about.stats.map((stat) => (
                <div key={stat.label} className="border-t border-slate-300 pt-4">
                  <p className="font-semibold">{stat.value}</p>
                  <p className="mt-2 text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    ),
    appointments: <AppointmentForm services={services} timezone={settings.timezone} />,
    faqs: (
      <section
        className="section-shell grid gap-10 py-14 pb-24 lg:grid-cols-[.7fr_1.3fr]"
        id="faqs"
      >
        <div data-reveal>
          <p className="eyebrow section-eyebrow">
            <span /> A FEW GOOD QUESTIONS
          </p>
          <h2>
            Before we
            <br />
            say hello.
          </h2>
        </div>
        <div>
          {content.faqs.map((faq) => (
            <details key={faq.question} className="group border-b border-slate-200 py-5">
              <summary className="cursor-pointer text-sm font-semibold">{faq.question}</summary>
              <p className="mt-4 text-sm leading-7 text-slate-500">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    )
  };
  return (
    <div ref={root} className="overflow-clip">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {preview && (
        <div className="bg-amber-100 p-3 text-center text-sm">
          Private draft preview ·{" "}
          <Link href="/admin/content" className="underline">
            Return to editor
          </Link>
        </div>
      )}
      <header className="section-shell flex flex-wrap items-center justify-between gap-5 py-6">
        <Brand />
        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center gap-5 text-xs font-medium"
        >
          <a href="#download">PoolPay</a>
          <Link href="/services">Services</Link>
          <a href="#about">About</a>
          <a href="#pay-order">Pay an order</a>
          <Button asChild size="sm">
            <a href="#appointments">
              Book an appointment
              <ArrowUpRight />
            </a>
          </Button>
        </nav>
      </header>
      <main id="main">
        {content.sectionOrder.map(
          (section) =>
            content.sectionVisibility[section as keyof typeof content.sectionVisibility] && (
              <div key={section}>{sections[section]}</div>
            )
        )}
        <OrderLookup />
      </main>
      <footer className="bg-[#14283b] py-14 text-white">
        <div className="section-shell">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <Brand light />
              <p className="mt-5 max-w-xs text-sm leading-7 text-slate-300">
                {content.footer.description}
              </p>
            </div>
            <div>
              <p className="eyebrow mb-5 text-sky-200">LET&apos;S CONNECT</p>
              <a className="block text-sm" href={`mailto:${settings.supportEmail}`}>
                {settings.supportEmail}
              </a>
              <a
                className="mt-4 block text-sm"
                href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
              >
                {settings.phone}
              </a>
            </div>
            <div className="flex flex-col gap-4 text-xs text-slate-300">
              {(["privacy", "terms", "cancellation", "refund"] as const)
                .filter((p) => content.policies[p])
                .map((p) => (
                  <Link key={p} href={`/policies/${p}`} className="capitalize">
                    {p} policy
                  </Link>
                ))}
              <Link href="/admin">Administration</Link>
            </div>
          </div>
          <p className="mt-12 border-t border-white/10 pt-6 text-[11px] text-slate-400">
            {content.footer.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}
