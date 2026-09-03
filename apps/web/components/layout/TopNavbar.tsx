"use client";

import { Bell, FlaskConical, CheckCircle2 } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAppConfig } from "@/lib/api-auth";

const routeToTitle: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/users": "Users",
  "/dashboard/groups": "Groups",
  "/dashboard/funds": "Funds",
  "/dashboard/payments": "Payments",
  "/dashboard/reports": "Reports",
  "/dashboard/settings": "Settings",
  "/dashboard/notifications": "Notifications",
};

import { useNotifications } from "@/context/NotificationContext";

export function TopNavbar() {
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
    // Refresh environment badge every 30 seconds
    const interval = setInterval(fetchConfig, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10 w-full">
      {/* ── Environment Banner ── */}
      {appEnvironment === "test" && (
        <div className="flex items-center justify-center gap-2 bg-amber-400 text-amber-900 text-xs font-bold py-1.5 px-4">
          <FlaskConical className="w-3.5 h-3.5" />
          <span>TEST MODE — Stripe Sandbox Active. No real payments are processed.</span>
        </div>
      )}
      {appEnvironment === "production" && (
        <div className="flex items-center justify-center gap-2 bg-emerald-500 text-white text-xs font-semibold py-1 px-4">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>LIVE — Production Mode Active</span>
        </div>
      )}

      {/* ── Main Header Row ── */}
      <div className="h-20 flex items-center justify-between px-8">
        {/* Title Area */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 leading-none mb-1">
            {title}
          </h1>
          <p className="text-sm text-gray-500">
            Welcome back! Here&apos;s what&apos;s happening today.
          </p>
        </div>

        {/* Action Area */}
        <div className="flex items-center gap-6">
          {/* Environment quick badge */}
          {appEnvironment && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                appEnvironment === "test"
                  ? "bg-amber-100 text-amber-700 border border-amber-300"
                  : "bg-emerald-100 text-emerald-700 border border-emerald-300"
              }`}
            >
              {appEnvironment === "test" ? (
                <>
                  <FlaskConical className="w-3 h-3" />
                  Sandbox
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Live
                </>
              )}
            </span>
          )}

          <Link href="/dashboard/notifications" className="relative text-gray-600 hover:text-gray-900 transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </Link>
          <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            <span>View Mobile App</span>
          </button>
        </div>
      </div>
    </header>
  );
}
