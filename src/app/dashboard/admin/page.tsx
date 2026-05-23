import {
  ClipboardCheck,
  FileText,
  DollarSign,
  ScrollText,
  BookOpen,
  Layers,
} from "lucide-react";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";

const tools = [
  {
    title: "Programs",
    description: "Manage academic programs",
    href: "/dashboard/programs",
    icon: BookOpen,
  },
  {
    title: "Batches",
    description: "Manage batches and schedules",
    href: "/dashboard/batches",
    icon: Layers,
  },
  {
    title: "Checklists",
    description: "Admission and English checklists",
    href: "/dashboard/checklists",
    icon: ClipboardCheck,
  },
  {
    title: "Documents",
    description: "Review student documents",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    title: "Fees",
    description: "Fee schedules and installments",
    href: "/dashboard/fees",
    icon: DollarSign,
  },
  {
    title: "Contracts",
    description: "Enrolment contracts",
    href: "/dashboard/contracts",
    icon: ScrollText,
  },
];

export default async function AdminPage() {
  const profile = await getUserProfile();
  const isAdmin = isAdminOrSuper(profile?.role ?? null);

  if (!isAdmin) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Admin</h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Admin tools are available to admin and super admin users only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Admin</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Admin tools for programs, checklists, fees, and contracts
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <a
              key={tool.href}
              href={tool.href}
              className="group rounded-lg border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 group-hover:bg-zinc-200 transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-900">
                {tool.title}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">{tool.description}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
