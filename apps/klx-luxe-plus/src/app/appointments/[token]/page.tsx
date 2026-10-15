import Link from "next/link";
import { notFound } from "next/navigation";

import { getAppointmentByToken } from "@/server/db/repositories";

export const metadata = {
  title: "Appointment status | KLX LUXE PLUS LLC",
  robots: { index: false, follow: false }
};
export const dynamic = "force-dynamic";
export default async function AppointmentStatus({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) notFound();
  const appointment = await getAppointmentByToken(token);
  if (!appointment) notFound();
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <Link href="/" className="text-sm text-sky-700">
        ← KLX LUXE PLUS LLC
      </Link>
      <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8">
        <p className="eyebrow text-sky-700">{appointment.reference}</p>
        <h1 className="mt-4 text-3xl font-semibold">{appointment.serviceName}</h1>
        <p className="mt-6 text-sm capitalize">Status: {appointment.status}</p>
        <p className="mt-4 text-sm text-slate-500">
          {appointment.requestedDate} · {appointment.requestedTimeSlot} · {appointment.timezone}
        </p>
        <p className="mt-6 text-sm leading-7 text-slate-500">
          Requested times await confirmation. Contact support@poolpay.space for assistance.
        </p>
      </div>
    </main>
  );
}
