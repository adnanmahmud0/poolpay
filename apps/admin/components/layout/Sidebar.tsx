"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BarChart3,
  Component,
  CreditCard,
  DollarSign,
  History,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
  X
} from "lucide-react";

import { logout } from "@/lib/api-auth";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";

export const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Groups", href: "/dashboard/groups", icon: Component },
  { name: "Funds", href: "/dashboard/funds", icon: DollarSign },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { name: "Advertisements", href: "/dashboard/ads", icon: Megaphone },
  { name: "Audit Logs", href: "/dashboard/audit-logs", icon: History },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Legal & Policies", href: "/dashboard/legal", icon: ShieldCheck },
  { name: "Settings", href: "/dashboard/settings", icon: Settings }
];

interface SidebarContentProps {
  onNavigate?: () => void;
  showCloseButton?: boolean;
}

function SidebarNavContent({ onNavigate, showCloseButton = false }: SidebarContentProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-full flex-col bg-[#1A227F] text-white">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/15 px-6 sm:h-20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-lg font-black text-white">
            P
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider">POOLPAY</h1>
            <span className="block text-[10px] font-semibold tracking-widest text-white/60 uppercase">
              Admin Portal
            </span>
          </div>
        </div>

        {showCloseButton && (
          <button
            onClick={onNavigate}
            className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="custom-scrollbar flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-4 sm:py-6">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "translate-x-1 bg-white font-semibold text-[#1A227F] shadow-sm"
                  : "text-white/80 hover:translate-x-0.5 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${isActive ? "text-[#1A227F]" : "text-white/80"}`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-white/15 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-red-500/20 hover:text-red-200"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

interface SidebarProps {
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export function Sidebar({ isMobileOpen = false, setIsMobileOpen }: SidebarProps) {
  return (
    <>
      {/* ── Desktop Permanent Sidebar (lg and up) ── */}
      <aside className="fixed top-0 left-0 z-30 hidden h-screen w-64 flex-col shadow-xl lg:flex">
        <SidebarNavContent />
      </aside>

      {/* ── Mobile Slide-out Drawer Sheet (< lg) ── */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent
          side="left"
          hideCloseButton
          className="w-72 border-r border-white/15 bg-[#1A227F] p-0 text-white focus:outline-none sm:w-80"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Main navigation menu for PoolPay Admin</SheetDescription>
          </SheetHeader>
          <SidebarNavContent onNavigate={() => setIsMobileOpen?.(false)} showCloseButton />
        </SheetContent>
      </Sheet>
    </>
  );
}
