import Link from "next/link";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { LegacySourceBackfillPanel } from "@/features/academic/legacy-source-backfill-panel";

// ACADEMIC-05A: admin-only page to backfill source sheet/source row metadata
// onto already imported legacy students. Sales and viewer are blocked here,
// including by direct URL. The backfill action is independently re-checked for
// admin/super_admin and never creates students or applications.

async function getBackfillStatus(): Promise<{
  totalLegacy: number;
  withMetadata: number;
  withoutMetadata: number;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, legacy_source_sheet")
    .eq("record_source", "legacy_import");
  if (error) return null;
  const rows = data ?? [];
  const withMetadata = rows.filter(
    (r) => (r as { legacy_source_sheet: string | null }).legacy_source_sheet != null
  ).length;
  return {
    totalLegacy: rows.length,
    withMetadata,
    withoutMetadata: rows.length - withMetadata,
  };
}

export default async function LegacySourceBackfillPage() {
  const profile = await getUserProfile();
  const isAdmin = isAdminOrSuper(profile?.role ?? null);

  if (!isAdmin) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Legacy Source Backfill
          </h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Legacy Source Backfill is available to admin and super admin users
            only.
          </p>
        </div>
      </div>
    );
  }

  const status = await getBackfillStatus();

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
          / Legacy Source Backfill
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          Legacy Source Backfill
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Re-upload the PSW masterclass Excel to record which sheet and row each
          already imported legacy student came from. This only updates source
          metadata fields. It does not create students, delete students, or
          create applications.
        </p>
      </div>

      {status && (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-2xl font-semibold text-zinc-900">
              {status.totalLegacy}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Legacy students</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-2xl font-semibold text-zinc-900">
              {status.withMetadata}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Have source metadata
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-2xl font-semibold text-zinc-900">
              {status.withoutMetadata}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Still missing source metadata
            </p>
          </div>
        </div>
      )}

      <LegacySourceBackfillPanel />
    </div>
  );
}
