import Link from "next/link";

import { publicData } from "@/server/public-data";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Our services | KLX LUXE PLUS LLC",
  description: "Explore our professional services and book an appointment to discuss your needs.",
  alternates: { canonical: "/services" }
};
export default async function ServicesPage() {
  const { services, settings } = await publicData();
  return (
    <main className="section-shell py-14">
      <Link href="/" className="text-sky-700">
        ← Home
      </Link>
      <p className="eyebrow mt-12 text-sky-700">KLX LUXE PLUS LLC</p>
      <h1 className="mt-4 text-4xl font-semibold">Services for your next step.</h1>
      <p className="mt-5 text-slate-600">
        Book an appointment, call or email to discuss your needs and agree on pricing.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {services.map((service) => (
          <article key={service.id} className="rounded-3xl border border-slate-200 bg-white p-7">
            <h2 className="text-2xl font-semibold">{service.name}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{service.description}</p>
            <Link href="/#appointments" className="mt-5 inline-block font-medium text-sky-700">
              Book an appointment →
            </Link>
          </article>
        ))}
      </div>
      <p className="mt-10">
        <a href={`mailto:${settings.supportEmail}`} className="text-sky-700">
          {settings.supportEmail}
        </a>{" "}
        · <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}>{settings.phone}</a>
      </p>
    </main>
  );
}
