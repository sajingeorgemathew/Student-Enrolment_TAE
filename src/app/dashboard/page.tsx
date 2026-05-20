import { getUserProfile } from "@/lib/profile";
import {
  ClipboardList,
  Users,
  Layers,
  FileText,
  DollarSign,
  ScrollText,
} from "lucide-react";

const cards = [
  {
    title: "Intake",
    description: "Manage intake applications",
    href: "/dashboard/intake",
    icon: ClipboardList,
  },
  {
    title: "Students",
    description: "View and manage student records",
    href: "/dashboard/students",
    icon: Users,
  },
  {
    title: "Batches",
    description: "Organize student batches",
    href: "/dashboard/batches",
    icon: Layers,
  },
  {
    title: "Documents",
    description: "Track required documents",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    title: "Fees",
    description: "Calculate and manage fees",
    href: "/dashboard/fees",
    icon: DollarSign,
  },
  {
    title: "Contracts",
    description: "Generate enrolment contracts",
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">{greeting}</h1>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
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
    </div>
  );
}
