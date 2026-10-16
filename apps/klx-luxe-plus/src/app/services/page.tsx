import Image from "next/image";
import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { SERVICES as CANONICAL_SERVICES } from "@/data/site";

import type { KlxService } from "@/server/db/types";
import { publicData } from "@/server/public-data";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Our services | KLX LUXE PLUS LLC",
  description: "Explore our professional services and book an appointment to discuss your needs.",
  alternates: { canonical: "/services" }
};

const SERVICE_IMAGES: Record<string, string> = {
  taxes: "/images/service-tax.jpg",
  immigration: "/images/service-immigration.jpg",
  translations: "/images/service-translation.jpg",
  transport: "/images/hero-luxury-car.jpg",
  finance: "/images/service-finance.jpg",
  computer: "/images/service-computer.jpg"
};

export default async function ServicesPage() {
  const { services, settings } = await publicData();

  const displayServices: KlxService[] = CANONICAL_SERVICES.map((canonical, idx) => {
    const match = services.find(
      (s) =>
        s.serviceId === canonical.id ||
        s.id === canonical.id ||
        s.id === `svc_${canonical.id}` ||
        s.name.toLowerCase() === canonical.name.toLowerCase()
    );
    if (match) {
      return {
        ...match,
        number: canonical.number,
        name: match.name || canonical.name,
        category: match.category || canonical.category,
        description: match.description || canonical.description,
        action: match.action || canonical.action,
        serviceId: canonical.id
      };
    }
    return {
      id: `svc_${canonical.id}`,
      serviceId: canonical.id,
      number: canonical.number,
      name: canonical.name,
      shortName: canonical.shortName,
      category: canonical.category,
      description: canonical.description,
      action: canonical.action,
      pricingMode: "quote" as const,
      priceCents: 0,
      depositCents: 0,
      durationMinutes: 60,
      isVisible: true,
      sortOrder: idx + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  return (
    <main className="section-shell py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900"
      >
        ← Return to home
      </Link>
      <p className="eyebrow mt-10 text-sky-700">KLX LUXE PLUS LLC · PROFESSIONAL SERVICES</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#14283b] sm:text-5xl">
        Services designed for your next step.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        Six specialized service areas with personalized assistance, reliable scheduling, and
        transparent pricing.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayServices.map((service, i) => {
          const image = SERVICE_IMAGES[service.serviceId];
          return (
            <article
              key={service.id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
            >
              {image && (
                <div className="relative h-52 w-full overflow-hidden bg-slate-900">
                  <Image
                    src={image}
                    alt={service.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <div className="absolute top-4 right-4 rounded-full bg-slate-950/50 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md">
                    / {service.number || String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="absolute bottom-4 left-6">
                    <p className="text-[11px] font-semibold tracking-wider text-sky-200 uppercase">
                      {service.category}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex flex-1 flex-col justify-between p-7">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-[#14283b]">
                    {service.name}
                  </h2>
                  <p className="mt-3 text-xs leading-6 text-slate-600 sm:text-sm sm:leading-7">
                    {service.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                  <span className="text-xs font-semibold text-[#377db1]">
                    {service.pricingMode === "quote"
                      ? "Pricing on request"
                      : "Standard consultation"}
                  </span>
                  <Link
                    href={`/#appointments?service=${service.serviceId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#14283b] transition-colors hover:text-[#377db1]"
                  >
                    {service.action}
                    <ArrowUpRight className="size-4" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-xs text-slate-600 sm:flex sm:items-center sm:justify-between">
        <p>
          Questions about service scope or scheduling? Reach us anytime at{" "}
          <a href={`mailto:${settings.supportEmail}`} className="font-semibold text-sky-700">
            {settings.supportEmail}
          </a>{" "}
          or call{" "}
          <a
            href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
            className="font-semibold text-sky-700"
          >
            {settings.phone}
          </a>
          .
        </p>
        <Link
          href="/#appointments"
          className="mt-3 inline-block font-semibold text-[#14283b] sm:mt-0"
        >
          Book consultation →
        </Link>
      </div>
    </main>
  );
}
