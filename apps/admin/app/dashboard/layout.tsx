"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { NotificationProvider } from "@/context/NotificationContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const isDemo =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("demo") === "true";

    if (!token && !isDemo) {
      router.push("/login");
    } else {
      if (isDemo && !token) {
        localStorage.setItem("accessToken", "demo-token");
        localStorage.setItem(
          "user",
          JSON.stringify({
            fullName: "Admin User",
            email: "admin@poolpay.com",
            role: "SUPER_ADMIN"
          })
        );
      }
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return null; // Or a loading spinner
  }

  return (
    <NotificationProvider>
      <div className="flex min-h-screen bg-[#F4F5F7] font-sans">
        {/* ── Sidebar (Desktop Persistent + Mobile Drawer) ── */}
        <Sidebar isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />

        {/* ── Content Area with Responsive Gutter ── */}
        <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col lg:pl-64">
          <TopNavbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
          <main className="max-w-full min-w-0 flex-1 overflow-x-hidden p-3.5 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
