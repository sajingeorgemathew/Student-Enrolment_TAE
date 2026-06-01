import {
  DollarSign,
  GraduationCap,
  Briefcase,
  BarChart3,
  Wrench,
} from "lucide-react";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";

const modules = [
  {
    title: "Finance",
    description: "Module prepared for future finance and receipt tools.",
    href: "/dashboard/admin-tools/finance",
    icon: DollarSign,
  },
  {
    title: "Academic Records",
    description: "Module prepared for future transcript and record tools.",
    href: "/dashboard/admin-tools/academic-records",
    icon: GraduationCap,
  },
  {
    title: "Placement",
    description: "Module prepared for future placement tools.",
    href: "/dashboard/admin-tools/placement",
    icon: Briefcase,
  },
  {
    title: "Reports",
    description: "Module prepared for future operational reports.",
    href: "/dashboard/admin-tools/reports",
    icon: BarChart3,
  },
  {
    title: "Utilities",
    description: "Module prepared for future admin utilities.",
    href: "/dashboard/admin-tools/utilities",
    icon: Wrench,
  },
];

export default async function AdminToolsPage() {
  const profile = await getUserProfile();
  const isAdmin = isAdminOrSuper(profile?.role ?? null);

  if (!isAdmin) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Admin Tools</h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Admin Tools are available to admin and super admin users only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Admin Tools</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Modules prepared for future production tools
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <a
              key={module.href}
              href={module.href}
              className="group rounded-lg border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 group-hover:bg-zinc-200 transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-900">
                {module.title}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">{module.description}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
