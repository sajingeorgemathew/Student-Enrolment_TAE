import Link from "next/link";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { LegacyImportPreview } from "@/features/academic/legacy-import-preview";

// ACADEMIC-03: admin-only legacy student Excel import preview page under
// Admin Tools > Academic Records. Sales and viewer are blocked here, including
// by direct URL. This page previews only and never writes to the database.

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
          match existing students. This is a preview only - no records are
          created, updated, or deleted.
        </p>
      </div>

      <LegacyImportPreview />
    </div>
  );
}
