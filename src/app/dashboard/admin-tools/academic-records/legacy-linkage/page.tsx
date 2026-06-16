import Link from "next/link";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { getLegacyLinkageStatus } from "@/features/academic/legacy-linkage-actions";
import { LegacyLinkagePanel } from "@/features/academic/legacy-linkage-panel";

// ACADEMIC-05B: admin-only page that links imported legacy PSW students to the
// PSW program and their historical PSW batch by creating minimal application
// rows. Sales and viewer are blocked here, including by direct URL. The link
// action is independently re-checked for admin/super_admin and never creates
// students, fees, checklists, contracts, documents, or receipts.

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-2xl font-semibold text-zinc-900">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

export default async function LegacyLinkagePage() {
  const profile = await getUserProfile();
  const isAdmin = isAdminOrSuper(profile?.role ?? null);

  if (!isAdmin) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Legacy Student Linkage
          </h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Legacy Student Linkage is available to admin and super admin users
            only.
          </p>
        </div>
      </div>
    );
  }

  const status = await getLegacyLinkageStatus();
  const counts = status.counts;

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
          / Legacy Student Linkage
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          Legacy Student Linkage
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Link imported legacy PSW students to the PSW program and the correct
          historical PSW batch. This only creates minimal application records for
          program and batch context. It does not create fees, checklists,
          contracts, documents, or receipts, and it does not pull legacy students
          into the active enrolment workflow.
        </p>
      </div>

      {status.pswProgramMissing ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">
            The PSW program (program_code = PSW) was not found. Linkage cannot run
            until the PSW program exists.
          </p>
        </div>
      ) : !counts ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm text-amber-700">
            {status.error ?? "Could not load legacy linkage status."}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Total legacy students" value={counts.totalLegacy} />
            <StatCard
              label="With source metadata"
              value={counts.withSourceMetadata}
            />
            <StatCard label="Already linked" value={counts.alreadyLinked} />
            <StatCard label="Unlinked" value={counts.unlinked} />
            <StatCard
              label="Missing source metadata"
              value={counts.missingSourceMetadata}
            />
            <StatCard
              label="Missing batch mapping"
              value={counts.missingBatchMapping}
            />
            <StatCard
              label="Eligible for linkage"
              value={counts.eligibleForLinkage}
            />
          </div>

          {counts.missingSourceMetadata > 0 && (
            <div className="mb-8 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs text-zinc-600">
                {counts.missingSourceMetadata} legacy student
                {counts.missingSourceMetadata === 1 ? "" : "s"} still have no
                source sheet recorded. Run the{" "}
                <Link
                  href="/dashboard/admin-tools/academic-records/legacy-source-backfill"
                  className="font-medium text-zinc-700 underline hover:text-zinc-900"
                >
                  Legacy Source Backfill
                </Link>{" "}
                first so they can be mapped to a batch.
              </p>
            </div>
          )}

          <LegacyLinkagePanel eligibleCount={counts.eligibleForLinkage} />
        </>
      )}
    </div>
  );
}
