import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import Link from "next/link";
import {
  ClipboardList,
  Users,
  BookOpen,
  Layers,
  DollarSign,
  ScrollText,
  ClipboardCheck,
  Settings,
  ArrowRight,
} from "lucide-react";

type DashCard = {
  title: string;
  description: string;
  href: string;
  icon: typeof BookOpen;
  cta: string;
  adminOnly?: boolean;
};

const primaryCards: DashCard[] = [
  {
    title: "Programs",
    description: "View and manage academic programs and their associated batches.",
    href: "/dashboard/programs",
    icon: BookOpen,
    cta: "Explore Programs",
  },
  {
    title: "Batches",
    description: "Monitor active batches, schedules, and enrolled students.",
    href: "/dashboard/batches",
    icon: Layers,
    cta: "Manage Batches",
  },
  {
    title: "Students",
    description: "Search student records, open files, and track enrolment status.",
    href: "/dashboard/students",
    icon: Users,
    cta: "Access Students",
  },
  {
    title: "Intakes",
    description: "Review intake applications and admission pipeline activity.",
    href: "/dashboard/intake",
    icon: ClipboardList,
    cta: "Review Intakes",
  },
  {
    title: "Admin",
    description: "System configuration, user management, and administrative tools.",
    href: "/dashboard/admin",
    icon: Settings,
    cta: "Open Admin",
    adminOnly: true,
  },
];

type SecondaryCard = {
  title: string;
  description: string;
  href: string;
  icon: typeof BookOpen;
};

const secondaryCards: SecondaryCard[] = [
  {
    title: "Fees",
    description: "Fee schedules and payment tracking.",
    href: "/dashboard/fees",
    icon: DollarSign,
  },
  {
    title: "Checklists",
    description: "Admission checklists and compliance status.",
    href: "/dashboard/checklists",
    icon: ClipboardCheck,
  },
  {
    title: "Contracts",
    description: "Enrolment contracts and agreement records.",
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
    ? `Signed in as ${profile.role.replace("_", " ")}`
    : "Welcome to the TAE Student Enrolment system";

  const role = profile?.role ?? null;
  const isAdmin = isAdminOrSuper(role);

  const visiblePrimary = primaryCards.filter(
    (card) => !card.adminOnly || isAdmin
  );

  return (
    <div>
      <section className="mb-10 border-l-4 border-tae-gold pl-8 py-2">
        <h1 className="text-3xl font-semibold tracking-tight text-tae-navy">
          {greeting}
        </h1>
        <p className="mt-2 text-sm text-tae-text-muted">{subtitle}</p>
      </section>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        {visiblePrimary.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group relative flex flex-col gap-5 overflow-hidden border border-tae-border/30 bg-white p-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-premium-hover)]"
            >
              <div className="absolute -right-12 -top-12 h-24 w-24 rounded-bl-full bg-tae-navy/5 transition-colors group-hover:bg-tae-gold/10" />
              <div className="flex h-14 w-14 items-center justify-center bg-tae-navy shadow-lg transition-colors duration-300 group-hover:bg-tae-gold">
                <Icon className="h-7 w-7 text-white transition-colors group-hover:text-tae-navy" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-tae-navy">
                  {card.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-tae-text-muted">
                  {card.description}
                </p>
              </div>
              <div className="mt-auto flex items-center gap-3 border-t border-tae-border/20 pt-4 text-xs font-bold uppercase tracking-widest text-tae-navy">
                <span>{card.cta}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </section>

      <div className="mt-12 mb-8 flex items-center gap-6 py-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-tae-navy">
          Extended Views
        </h3>
        <div className="h-px flex-1 bg-tae-border/40" />
      </div>

      <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {secondaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group border border-tae-border/30 bg-white p-8 shadow-sm transition-all duration-300 hover:border-tae-gold hover:shadow-[var(--shadow-premium)]"
            >
              <div className="mb-6">
                <div className="inline-flex p-3 bg-tae-navy/5 transition-colors group-hover:bg-tae-gold">
                  <Icon className="h-5 w-5 text-tae-navy transition-colors group-hover:text-white" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-tae-navy">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-tae-text-muted">
                {card.description}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
