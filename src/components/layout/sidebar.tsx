"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth/actions";
import {
  LayoutDashboard,
  ClipboardList,
  ClipboardCheck,
  Users,
  BookOpen,
  Layers,
  DollarSign,
  ScrollText,
  LogOut,
  Settings,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  minRole?: "sales" | "admin";
};

const primaryNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Programs", href: "/dashboard/programs", icon: BookOpen },
  { label: "Batches", href: "/dashboard/batches", icon: Layers },
  { label: "Students", href: "/dashboard/students", icon: Users },
  { label: "Intakes", href: "/dashboard/intake", icon: ClipboardList },
  { label: "Admin", href: "/dashboard/admin", icon: Settings, minRole: "admin" },
];

const secondaryNav: NavItem[] = [
  { label: "Fees", href: "/dashboard/fees", icon: DollarSign },
  { label: "Checklists", href: "/dashboard/checklists", icon: ClipboardCheck },
  { label: "Contracts", href: "/dashboard/contracts", icon: ScrollText },
];

function isNavVisible(item: NavItem, role: string | null): boolean {
  if (!item.minRole) return true;
  if (item.minRole === "admin") {
    return role === "admin" || role === "super_admin";
  }
  if (item.minRole === "sales") {
    return role === "sales" || role === "admin" || role === "super_admin";
  }
  return true;
}

interface SidebarProps {
  userEmail: string;
  userRole: string | null;
  userFullName: string | null;
}

export function Sidebar({ userEmail, userRole, userFullName }: SidebarProps) {
  const pathname = usePathname();

  const initials = userFullName
    ? userFullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : userEmail[0]?.toUpperCase() ?? "U";

  return (
    <aside className="flex h-full w-72 flex-col bg-tae-navy">
      <div className="px-8 pt-10 pb-8">
        <Image
          src="/Blue logo image.jpg"
          alt="Toronto Academy of Education"
          width={1024}
          height={768}
          className="h-auto w-full object-contain"
          priority
        />
        <div className="mt-6 h-px w-12 bg-tae-gold/40" />
      </div>

      <nav className="sidebar-scroll flex-1 overflow-y-auto py-2">
        <div className="mb-8">
          {primaryNav
            .filter((item) => isNavVisible(item, userRole))
            .map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-8 py-3.5 text-sm font-medium tracking-wide transition-all ${
                    isActive
                      ? "border-l-3 border-tae-gold bg-gradient-to-r from-tae-gold-dim to-transparent text-white"
                      : "border-l-3 border-transparent text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      isActive ? "text-tae-gold" : ""
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}
        </div>

        <div className="px-8 mb-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/25">
            Extended Views
          </span>
        </div>
        <div>
          {secondaryNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-8 py-3 text-sm transition-all ${
                  isActive
                    ? "border-l-3 border-tae-gold bg-gradient-to-r from-tae-gold-dim to-transparent text-white"
                    : "border-l-3 border-transparent text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? "text-tae-gold" : ""
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto p-8 bg-black/10">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-tae-gold/30 bg-tae-gold/20 text-tae-gold font-bold text-sm">
            {initials}
          </div>
          <div className="flex min-w-0 flex-col">
            {userFullName && (
              <span className="truncate text-sm font-semibold tracking-wide text-white">
                {userFullName}
              </span>
            )}
            <span className="truncate text-[11px] text-white/40">
              {userEmail}
            </span>
            {userRole && (
              <span className="mt-0.5 text-[11px] capitalize tracking-wider text-white/30">
                {userRole.replace("_", " ")}
              </span>
            )}
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-tae-gold hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
