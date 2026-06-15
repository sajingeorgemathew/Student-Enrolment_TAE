import { FileSpreadsheet, DatabaseBackup } from "lucide-react";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";

// ACADEMIC-03: Academic Records landing now links to the Legacy Student Import
// preview. Other transcript/record tools will be added here later.
// ACADEMIC-05A: replaced the premature Legacy Student Linkage card (which created
// applications) with Legacy Source Backfill, which only records source sheet/row
// metadata onto already imported legacy students.

const tools = [
  {
    title: "Legacy Student Import",
    description:
      "Preview legacy student rows from an Excel master list and match them against existing students.",
    href: "/dashboard/admin-tools/academic-records/legacy-import",
    icon: FileSpreadsheet,
  },
  {
    title: "Legacy Source Backfill",
    description:
      "Re-upload the PSW masterclass Excel to record which sheet and row each imported legacy student came from. No students or applications are created.",
    href: "/dashboard/admin-tools/academic-records/legacy-source-backfill",
    icon: DatabaseBackup,
  },
];

export default async function AcademicRecordsPage() {
  const profile = await getUserProfile();
  const isAdmin = isAdminOrSuper(profile?.role ?? null);

  if (!isAdmin) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Academic Records
          </h1>
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
        <h1 className="text-2xl font-semibold text-zinc-900">
          Academic Records
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Transcript and academic record tools
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
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 transition-colors group-hover:bg-zinc-200">
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
