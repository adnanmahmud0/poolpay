"use client";

import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

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

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10 w-full">
      {/* Title Area */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 leading-none mb-1">
          {title}
        </h1>
        <p className="text-sm text-gray-500">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-6">
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
    </header>
  );
}
