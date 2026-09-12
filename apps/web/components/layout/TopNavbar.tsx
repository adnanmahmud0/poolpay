"use client";

import { Bell, FlaskConical, CheckCircle2, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  "/dashboard/notifications": "Notifications",
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
    <header className="bg-white border-b border-gray-100 sticky top-0 z-20 w-full shadow-xs">
      {/* ── Environment Banner ── */}
      {appEnvironment === "test" && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 bg-amber-400 text-amber-950 text-[11px] sm:text-xs font-bold py-1 px-3 text-center">
          <FlaskConical className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">TEST MODE — Stripe Sandbox Active (No real charges)</span>
        </div>
      )}
      {appEnvironment === "production" && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 bg-emerald-600 text-white text-[11px] sm:text-xs font-semibold py-1 px-3 text-center">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>LIVE — Production Mode Active</span>
        </div>
      )}

      {/* ── Main Header Row ── */}
      <div className="h-16 sm:h-20 flex items-center justify-between px-3 sm:px-6 lg:px-8 gap-2 sm:gap-4">
        {/* Left Side: Mobile Menu Button + Title Area */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open sidebar menu"
            className="lg:hidden p-2 -ml-1 text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors shrink-0"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight truncate">
              {title}
            </h1>
            <p className="hidden sm:block text-xs text-gray-500 truncate mt-0.5">
              Welcome back! Here&apos;s what&apos;s happening today.
            </p>
          </div>
        </div>

        {/* Right Side: Action Area */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Environment quick badge */}
          {appEnvironment && (
            <span
              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold ${
                appEnvironment === "test"
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
              }`}
            >
              {appEnvironment === "test" ? (
                <>
                  <FlaskConical className="w-3 h-3 shrink-0" />
                  <span>Sandbox</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Live</span>
                </>
              )}
            </span>
          )}

          {/* Notifications */}
          <Link
            href="/dashboard/notifications"
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </Link>

          {/* Mobile App quick button (hidden on phone, visible on tablet/desktop) */}
          <button
            type="button"
            className="hidden md:flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#1A227F] bg-gray-50 hover:bg-indigo-50/60 px-3 py-2 rounded-xl border border-gray-200 transition-colors"
          >
            <span>Mobile App</span>
          </button>
        </div>
      </div>
    </header>
  );
}
