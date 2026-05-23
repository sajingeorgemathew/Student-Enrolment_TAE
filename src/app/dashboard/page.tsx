import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import {
  ClipboardList,
  Users,
  BookOpen,
  Layers,
  FileText,
  DollarSign,
  ScrollText,
  ClipboardCheck,
  Settings,
} from "lucide-react";

type DashCard = {
  title: string;
  description: string;
  href: string;
  icon: typeof BookOpen;
  adminOnly?: boolean;
};

const primaryCards: DashCard[] = [
  {
    title: "Programs",
    description: "View programs and their batches",
    href: "/dashboard/programs",
    icon: BookOpen,
  },
  {
    title: "Batches",
    description: "View batches and batch students",
    href: "/dashboard/batches",
    icon: Layers,
  },
  {
    title: "Students",
    description: "Search students and open student files",
    href: "/dashboard/students",
    icon: Users,
  },
  {
    title: "Intakes",
    description: "View intake applications",
    href: "/dashboard/intake",
    icon: ClipboardList,
  },
  {
    title: "Admin",
    description: "Checklists, fees, and admin tools",
    href: "/dashboard/admin",
    icon: Settings,
    adminOnly: true,
  },
];

const secondaryCards: DashCard[] = [
  {
    title: "Documents",
    description: "All student documents",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    title: "Fees",
    description: "All fee schedules",
    href: "/dashboard/fees",
    icon: DollarSign,
  },
  {
    title: "Checklists",
    description: "All admission checklists",
    href: "/dashboard/checklists",
    icon: ClipboardCheck,
  },
  {
    title: "Contracts",
    description: "All enrolment contracts",
    href: "/dashboard/contracts",
    icon: ScrollText,
  },
];

export default async function DashboardPage() {
  const profile = await getUserProfile();

  const greeting = profile?.full_name
    ? `Welcome, ${profile.full_name}`
    : "Dashboard";

  const subtitle = profile
    ? `Signed in as ${profile.role}`
    : "Welcome to the TAE Student Enrolment system";

  const role = profile?.role ?? null;
  const isAdmin = isAdminOrSuper(role);

  const visiblePrimary = primaryCards.filter(
    (card) => !card.adminOnly || isAdmin
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">{greeting}</h1>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visiblePrimary.map((card) => {
          const Icon = card.icon;
          return (
            <a
              key={card.href}
              href={card.href}
              className="group rounded-lg border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 group-hover:bg-zinc-200 transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-900">
                {card.title}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">{card.description}</p>
            </a>
          );
        })}
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-400">
          Module Views
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {secondaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.href}
                href={card.href}
                className="group rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-zinc-50 text-zinc-500 group-hover:bg-zinc-100 transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-medium text-zinc-700">
                  {card.title}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {card.description}
                </p>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
