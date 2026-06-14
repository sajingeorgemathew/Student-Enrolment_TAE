import Link from "next/link";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { LegacyImportPreview } from "@/features/academic/legacy-import-preview";

// ACADEMIC-03: admin-only legacy student Excel import preview page under
// Admin Tools > Academic Records. Sales and viewer are blocked here, including
// by direct URL.
// ACADEMIC-04: the page now also supports confirming an import, which creates
// legacy student records for selected, approved rows only. Creation is gated to
// admin/super_admin in the server action as well as on this page.

export default async function LegacyImportPage() {
  const profile = await getUserProfile();
  const isAdmin = isAdminOrSuper(profile?.role ?? null);

  if (!isAdmin) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Legacy Student Import
          </h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Legacy Student Import is available to admin and super admin users
            only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-zinc-500">
          <Link
            href="/dashboard/admin-tools/academic-records"
            className="hover:text-zinc-900"
          >
            Academic Records
          </Link>{" "}
          / Legacy Student Import
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          Legacy Student Import
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Preview legacy student rows from an Excel master list and see how they
          match existing students, then select approved rows to create legacy
          student records. Only clean new candidates and reviewed importable
          rows can be imported.
        </p>
      </div>

      <LegacyImportPreview />
    </div>
  );
}
