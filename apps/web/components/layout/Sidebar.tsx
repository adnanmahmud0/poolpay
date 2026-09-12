"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  History,
  ShieldCheck,
  X
} from "lucide-react";
import { logout } from "@/lib/api-auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
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
    <div className="flex flex-col h-full bg-[#1A227F] text-white">
      {/* Brand */}
      <div className="h-16 sm:h-20 flex items-center justify-between px-6 border-b border-white/15 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-black text-lg text-white border border-white/20">
            P
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider">POOLPAY</h1>
            <span className="text-[10px] text-white/60 tracking-widest font-semibold uppercase block">
              Admin Portal
            </span>
          </div>
        </div>

        {showCloseButton && (
          <button
            onClick={onNavigate}
            className="lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 sm:py-6 px-4 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                isActive
                  ? "bg-white text-[#1A227F] shadow-sm font-semibold translate-x-1"
                  : "text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-0.5"
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#1A227F]" : "text-white/80"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/15 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-white/80 hover:bg-red-500/20 hover:text-red-200 transition-colors text-sm font-medium"
        >
          <LogOut className="w-5 h-5 shrink-0" />
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
      <aside className="hidden lg:flex w-64 h-screen fixed left-0 top-0 z-30 flex-col shadow-xl">
        <SidebarNavContent />
      </aside>

      {/* ── Mobile Slide-out Drawer Sheet (< lg) ── */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent
          side="left"
          hideCloseButton
          className="p-0 w-72 sm:w-80 bg-[#1A227F] text-white border-r border-white/15 focus:outline-none"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Main navigation menu for PoolPay Admin</SheetDescription>
          </SheetHeader>
          <SidebarNavContent
            onNavigate={() => setIsMobileOpen?.(false)}
            showCloseButton
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
