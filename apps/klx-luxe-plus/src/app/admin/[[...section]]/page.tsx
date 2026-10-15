import { notFound, redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { currentUser } from "@/server/http";

const SECTIONS = [
  "overview",
  "content",
  "poolpay",
  "services",
  "appointments",
  "payments",
  "advertisements",
  "media",
  "settings",
  "audit-log"
];
export default async function AdminPage({
  params,
  searchParams
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ appointment?: string; decision?: string }>;
}) {
  const query = await searchParams;
  const appointmentDecision =
    query.appointment && ["confirmed", "declined"].includes(query.decision || "")
      ? { id: query.appointment, status: query.decision as "confirmed" | "declined" }
      : undefined;
  if (!(await currentUser())) {
    const next = appointmentDecision
      ? `/admin/appointments?appointment=${encodeURIComponent(appointmentDecision.id)}&decision=${appointmentDecision.status}`
      : "/admin";
    redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }
  const section = (await params).section?.[0] || "overview";
  if (!SECTIONS.includes(section)) notFound();
  return <AdminDashboard section={section} appointmentDecision={appointmentDecision} />;
}
