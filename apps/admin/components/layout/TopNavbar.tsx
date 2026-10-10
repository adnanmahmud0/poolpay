"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Bell, CheckCircle2, FlaskConical, Menu } from "lucide-react";

import { getAppConfig } from "@/lib/api-auth";

import { useNotifications } from "@/context/NotificationContext";

const routeToTitle: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/users": "Users",
  "/dashboard/groups": "Groups",
  "/dashboard/funds": "Funds",
  "/dashboard/payments": "Payments",
  "/dashboard/ads": "Advertisements",
  "/dashboard/audit-logs": "Audit Logs",
  "/dashboard/reports": "Reports",
  "/dashboard/legal": "Legal & Policies",
  "/dashboard/settings": "Settings",
  "/dashboard/notifications": "Notifications"
};

interface TopNavbarProps {
  onOpenMobileMenu?: () => void;
}

export function TopNavbar({ onOpenMobileMenu }: TopNavbarProps) {
  const pathname = usePathname();
  const title = routeToTitle[pathname] || "Dashboard";
  const { unreadCount } = useNotifications();
  const [appEnvironment, setAppEnvironment] = useState<"test" | "production" | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchConfig() {
      try {
        const res = await getAppConfig();
        if (mounted && res?.data?.appEnvironment) {
          setAppEnvironment(res.data.appEnvironment);
        }
      } catch {
        // Silently fail — don't block the UI
      }
    }

    fetchConfig();
    const interval = setInterval(fetchConfig, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 w-full border-b border-gray-100 bg-white shadow-xs">
      {/* ── Environment Banner ── */}
      {appEnvironment === "test" && (
        <div className="flex items-center justify-center gap-1.5 bg-amber-400 px-3 py-1 text-center text-[11px] font-bold text-amber-950 sm:gap-2 sm:text-xs">
          <FlaskConical className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">TEST MODE — Stripe Sandbox Active (No real charges)</span>
        </div>
      )}
      {appEnvironment === "production" && (
        <div className="flex items-center justify-center gap-1.5 bg-emerald-600 px-3 py-1 text-center text-[11px] font-semibold text-white sm:gap-2 sm:text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>LIVE — Production Mode Active</span>
        </div>
      )}

      {/* ── Main Header Row ── */}
      <div className="flex h-16 items-center justify-between gap-2 px-3 sm:h-20 sm:gap-4 sm:px-6 lg:px-8">
        {/* Left Side: Mobile Menu Button + Title Area */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open sidebar menu"
            className="-ml-1 shrink-0 rounded-xl p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 lg:hidden"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg leading-tight font-bold text-gray-900 sm:text-2xl">
              {title}
            </h1>
            <p className="mt-0.5 hidden truncate text-xs text-gray-500 sm:block">
              Welcome back! Here&apos;s what&apos;s happening today.
            </p>
          </div>
        </div>

        {/* Right Side: Action Area */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* Environment quick badge */}
          {appEnvironment && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold sm:px-2.5 sm:text-xs ${
                appEnvironment === "test"
                  ? "border border-amber-300 bg-amber-100 text-amber-800"
                  : "border border-emerald-300 bg-emerald-100 text-emerald-800"
              }`}
            >
              {appEnvironment === "test" ? (
                <>
                  <FlaskConical className="h-3 w-3 shrink-0" />
                  <span>Sandbox</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span>Live</span>
                </>
              )}
            </span>
          )}

          {/* Notifications */}
          <Link
            href="/dashboard/notifications"
            className="relative rounded-xl p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"></span>
            )}
          </Link>

          {/* Mobile App quick button (hidden on phone, visible on tablet/desktop) */}
          <button
            type="button"
            className="hidden items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-indigo-50/60 hover:text-[#1A227F] sm:text-sm md:flex"
          >
            <span>Mobile App</span>
          </button>
        </div>
      </div>
    </header>
  );
}
