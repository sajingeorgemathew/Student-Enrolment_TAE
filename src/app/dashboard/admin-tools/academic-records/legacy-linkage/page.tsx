import Link from "next/link";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { getLegacyLinkageOverview } from "@/features/academic/legacy-linkage-actions";
import { LegacyLinkagePanel } from "@/features/academic/legacy-linkage-panel";

// ACADEMIC-05: admin-only page to link imported legacy students to the PSW
// program and batch. Sales and viewer are blocked here, including by direct URL.
// The linkage action is independently re-checked for admin/super_admin.

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

  const overview = await getLegacyLinkageOverview();

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
          PSW batch, based on the source sheet they were imported from. This adds
          program and batch context to the student hub without starting the
          active enrolment workflow.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        {overview ? (
          <LegacyLinkagePanel overview={overview} />
        ) : (
          <p className="text-sm text-zinc-600">
            Could not load legacy student linkage data.
          </p>
        )}
      </div>
    </div>
  );
}
