"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Component,
  DollarSign,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Megaphone,
  History
} from "lucide-react";
import { logout } from "@/lib/api-auth";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/dashboard/users", icon: Users },
    { name: "Groups", href: "/dashboard/groups", icon: Component },
    { name: "Funds", href: "/dashboard/funds", icon: DollarSign },
    { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
    { name: "Advertisements", href: "/dashboard/ads", icon: Megaphone },
    { name: "Audit Logs", href: "/dashboard/audit-logs", icon: History },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="w-64 bg-[#1A227F] h-screen flex flex-col fixed left-0 top-0 text-white z-20">
      {/* Brand */}
      <div className="h-16 flex items-center mt-4 px-6 border-b rounded-l-4xl border-white shrink-0">
        <h1 className="text-2xl font-medium tracking-wide">POOLPAY</h1>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-4 flex flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? "bg-white text-[#1A227F] font-medium shadow-sm"
                : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-white rounded-l-4xl">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors text-sm"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
