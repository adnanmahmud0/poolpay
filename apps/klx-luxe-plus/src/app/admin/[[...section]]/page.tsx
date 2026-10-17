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
  searchParams: Promise<{ appointment?: string; decision?: string; token?: string }>;
}) {
  const query = await searchParams;
  const sectionParam = (await params).section?.[0];
  const section = sectionParam || "overview";
  if (!SECTIONS.includes(section)) notFound();

  const appointmentDecision =
    query.appointment && ["confirmed", "declined"].includes(query.decision || "")
      ? { id: query.appointment, status: query.decision as "confirmed" | "declined" }
      : undefined;

  if (!(await currentUser())) {
    if (query.token) {
      const targetUrl = appointmentDecision
        ? `/admin/appointments?appointment=${encodeURIComponent(appointmentDecision.id)}&decision=${appointmentDecision.status}`
        : sectionParam && sectionParam !== "overview"
          ? `/admin/${sectionParam}`
          : "/admin/appointments";
      redirect(
        `/api/auth/magic?token=${encodeURIComponent(query.token)}&next=${encodeURIComponent(targetUrl)}`
      );
    }

    const next = appointmentDecision
      ? `/admin/appointments?appointment=${encodeURIComponent(appointmentDecision.id)}&decision=${appointmentDecision.status}`
      : sectionParam && sectionParam !== "overview"
        ? `/admin/${sectionParam}`
        : "/admin";
    redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }

  return <AdminDashboard section={section} appointmentDecision={appointmentDecision} />;
}
