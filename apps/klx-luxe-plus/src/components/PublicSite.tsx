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
  ReceiptText,
  Speech
} from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { BorderBeam, Button, cn } from "@repo/ui";

import type {
  KlxAdvertisement,
  KlxService,
  PublicSettings,
  SiteContentData
} from "@/server/db/types";

import { AppDownload } from "./AppDownload";
import { AppointmentForm } from "./AppointmentForm";
import { Brand } from "./Brand";
import { Hero } from "./Hero";
import { OrderLookup } from "./OrderLookup";
import { Testimonials } from "./Testimonials";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const SERVICE_IMAGES: Record<string, string | null> = {
  taxes: "/images/service-tax.jpg",
  immigration: "/images/service-immigration.jpg",
  translations: "/images/service-translation.jpg",
  transport: "/images/hero-luxury-car.jpg",
  interpreter: "/images/service-translation.jpg",
  computer: null,
  finance: null
};

const ICONS = {
  taxes: ReceiptText,
  immigration: FileCheck2,
  interpreter: Speech,
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
          <div className="grid gap-6 md:grid-cols-2">
            {services.map((s, i) => {
              const Icon = ICONS[s.serviceId as keyof typeof ICONS] || FileCheck2;
              const serviceImage = SERVICE_IMAGES[s.serviceId];
              const isTransport = s.serviceId === "transport";
              return (
                <article
                  key={s.id}
                  data-reveal
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl",
                    isTransport && "md:col-span-2 md:flex-row"
                  )}
                >
                  {serviceImage ? (
                    <div
                      className={cn(
                        "relative overflow-hidden bg-slate-900",
                        isTransport
                          ? "h-64 min-h-[280px] shrink-0 md:h-auto md:w-1/2"
                          : "h-56 w-full"
                      )}
                    >
                      <Image
                        src={serviceImage}
                        alt={s.name}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                      <div className="absolute top-4 right-4 rounded-full bg-slate-950/50 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md">
                        / {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="absolute bottom-4 left-6 flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-white/90 text-[#14283b] shadow-md backdrop-blur-md">
                          <Icon className="size-5" strokeWidth={1.5} />
                        </span>
                        <p className="text-[11px] font-semibold tracking-wider text-sky-200 uppercase">
                          {s.category}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 pb-0 sm:p-10 sm:pb-0">
                      <div className="mb-6 flex items-center justify-between">
                        <span className="rounded-2xl bg-sky-50 p-4 text-[#377db1]">
                          <Icon className="size-7" strokeWidth={1.5} />
                        </span>
                        <span className="text-xs text-slate-400">
                          / {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="eyebrow mb-2 text-slate-500">{s.category}</p>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col justify-between p-8 sm:p-10">
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight text-[#14283b]">
                        {s.name}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{s.description}</p>
                    </div>
                    <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
                      <p className="text-xs font-semibold text-[#377db1]">
                        {s.pricingMode === "quote"
                          ? "Pricing on request"
                          : `${new Intl.NumberFormat("en-US", { style: "currency", currency: settings.currency }).format(s.priceCents / 100)}${s.pricingMode === "deposit" ? ` · ${new Intl.NumberFormat("en-US", { style: "currency", currency: settings.currency }).format(s.depositCents / 100)} deposit` : ""}`}
                      </p>
                      <a
                        href={`#appointments?service=${s.serviceId}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#14283b] transition-colors hover:text-[#377db1]"
                      >
                        {s.action}
                        <ArrowUpRight className="size-4" />
                      </a>
                    </div>
                  </div>
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
      <section id="about" className="border-y border-slate-200 bg-[#f4f7f8] py-24">
        <div className="section-shell">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div
              className="about-photo-wrap group relative overflow-hidden rounded-3xl shadow-2xl"
              data-reveal
            >
              <Image
                src="/images/about-portrait.jpg"
                alt="KLX LUXE PLUS professional standing beside a luxury sedan"
                width={900}
                height={675}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="about-portrait-badge absolute bottom-6 left-6 flex items-center gap-2.5 rounded-full border border-white/20 bg-slate-950/70 px-4 py-2 text-[11px] font-semibold text-white backdrop-blur-md">
                <span className="status-dot" />
                <span>ONE CONNECTION. MANY POSSIBILITIES.</span>
              </div>
              <div className="about-portrait-services absolute top-5 right-5 flex max-w-[200px] flex-wrap justify-end gap-2">
                {services.slice(0, 4).map((s) => {
                  const SIcon = ICONS[s.serviceId as keyof typeof ICONS] || FileCheck2;
                  return (
                    <span
                      key={s.id}
                      className="flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/60 px-3 py-1 text-[10px] font-medium text-slate-200 backdrop-blur-md"
                    >
                      <SIcon className="size-3 text-sky-300" strokeWidth={1.5} />
                      {s.name.split(" ")[0]}
                    </span>
                  );
                })}
              </div>
            </div>
            <div data-reveal>
              <p className="eyebrow section-eyebrow">
                <span /> THE PLUS IS PERSONAL
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#14283b] sm:text-4xl">
                {content.about.title}
              </h2>
              <p className="mt-4 text-lg font-medium text-[#377db1]">{content.about.subtitle}</p>
              <div className="mt-6 space-y-4 text-sm leading-8 text-slate-600">
                {content.about.story.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="mt-8 grid grid-cols-2 gap-5 border-t border-slate-200 pt-6">
                {content.about.stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xl font-bold text-[#14283b]">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-[#14283b] text-white hover:bg-[#1e3b56]"
                >
                  <a href="#appointments">
                    Let&apos;s have a conversation <ArrowUpRight className="ml-2 size-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-20 border-t border-slate-200 pt-10" data-reveal>
            <div className="mb-8 flex items-center justify-between">
              <span className="eyebrow text-slate-500">FROM HELLO TO WHAT&apos;S NEXT</span>
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="size-2 rounded-full bg-emerald-500" /> Getting started is simple
              </span>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Say hello",
                  text: "Reach out by booking an appointment, calling, or emailing our team."
                },
                {
                  number: "02",
                  title: "Talk it through",
                  text: "Discuss your specific needs, timing, pricing, and required documentation."
                },
                {
                  number: "03",
                  title: "Take the next step",
                  text: "We confirm your schedule, file your paperwork, or prepare your vehicle."
                }
              ].map((step) => (
                <div
                  key={step.number}
                  className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <span className="text-xs font-bold text-[#377db1]">{step.number}</span>
                  <h3 className="mt-2 text-base font-semibold text-[#14283b]">{step.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-500">{step.text}</p>
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
        <Hero content={content.hero} />
        {content.sectionOrder.map(
          (section) =>
            content.sectionVisibility[section as keyof typeof content.sectionVisibility] && (
              <div key={section}>{sections[section]}</div>
            )
        )}
        <Testimonials />
        <OrderLookup />
      </main>
      <div id="contact" className="contact-bg-section">
        <div className="contact-bg-image" aria-hidden="true" />
        <div className="contact-bg-overlay" aria-hidden="true" />
        <footer className="site-footer-inner relative z-10 py-14 text-white">
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
    </div>
  );
}
