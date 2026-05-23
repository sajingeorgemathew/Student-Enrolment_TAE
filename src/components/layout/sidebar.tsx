"use client";

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
  FileText,
  DollarSign,
  ScrollText,
  LogOut,
  Settings,
} from "lucide-react";

const primaryNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Programs", href: "/dashboard/programs", icon: BookOpen },
  { label: "Batches", href: "/dashboard/batches", icon: Layers },
  { label: "Students", href: "/dashboard/students", icon: Users },
  { label: "Intakes", href: "/dashboard/intake", icon: ClipboardList },
  { label: "Admin", href: "/dashboard/admin", icon: Settings },
];

const secondaryNav = [
  { label: "Documents", href: "/dashboard/documents", icon: FileText },
  { label: "Fees", href: "/dashboard/fees", icon: DollarSign },
  { label: "Checklists", href: "/dashboard/checklists", icon: ClipboardCheck },
  { label: "Contracts", href: "/dashboard/contracts", icon: ScrollText },
];

interface SidebarProps {
  userEmail: string;
  userRole: string | null;
  userFullName: string | null;
}

export function Sidebar({ userEmail, userRole, userFullName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-6 py-5">
        <h2 className="text-lg font-semibold text-zinc-900">TAE Admin</h2>
        <p className="text-xs text-zinc-500">
          Toronto Academy of Education
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {primaryNav.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 border-t border-zinc-100 pt-4">
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
            Module Views
          </p>
          <ul className="space-y-1">
            {secondaryNav.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="border-t border-zinc-200 px-4 py-4">
        <div className="mb-3 px-2">
          {userFullName && (
            <p className="truncate text-sm font-medium text-zinc-900">
              {userFullName}
            </p>
          )}
          <p className="truncate text-xs text-zinc-500">{userEmail}</p>
          {userRole && (
            <p className="mt-0.5 text-xs text-zinc-400 capitalize">
              {userRole}
            </p>
          )}
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
