"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Link2, AlertTriangle } from "lucide-react";
import {
  linkLegacyStudents,
  type LegacyLinkageActionState,
  type LinkRowResult,
} from "./legacy-linkage-actions";

// ACADEMIC-05B: admin-only panel that runs the legacy linkage action. It creates
// only minimal application rows linking legacy PSW students to the PSW program
// and their historical batch. No fees, checklists, contracts, documents, or
// receipts are created. The page blocks sales and viewer and the server action
// re-checks admin/super_admin.

const initialState: LegacyLinkageActionState = { ok: false };

const OUTCOME_LABELS: Record<LinkRowResult["outcome"], string> = {
  linked: "Linked",
  already_linked: "Already linked",
  skipped: "Skipped",
  error: "Error",
};

const OUTCOME_COLORS: Record<LinkRowResult["outcome"], string> = {
  linked: "bg-emerald-100 text-emerald-800",
  already_linked: "bg-zinc-100 text-zinc-600",
  skipped: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
};

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-2xl font-semibold text-zinc-900">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

export function LegacyLinkagePanel({
  eligibleCount,
}: {
  eligibleCount: number;
}) {
  const [state, formAction, pending] = useActionState(
    linkLegacyStudents,
    initialState
  );

  const summary = state.summary;

  return (
    <div className="space-y-8">
      <form
        action={formAction}
        className="rounded-lg border border-zinc-200 bg-white p-5"
      >
        <h2 className="text-sm font-semibold text-zinc-900">
          Link unlinked legacy PSW students
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          This creates one minimal application per eligible student, linking the
          student to the PSW program and the correct historical PSW batch. It
          does not create fees, checklists, contracts, documents, or receipts,
          and it never creates duplicate links. It is safe to run more than once.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Link2 className="h-4 w-4" />
            {pending
              ? "Linking legacy students..."
              : `Link ${eligibleCount} eligible student${eligibleCount === 1 ? "" : "s"}`}
          </button>
        </div>

        {state.error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
      </form>

      {state.ok && summary && (
        <>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">
              Linkage result
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <SummaryCard label="Considered" value={summary.considered} />
              <SummaryCard label="Linked" value={summary.linked} />
              <SummaryCard label="Already linked" value={summary.alreadyLinked} />
              <SummaryCard
                label="Skipped (no source)"
                value={summary.skippedMissingSource}
              />
              <SummaryCard
                label="Skipped (no batch)"
                value={summary.skippedNoBatch}
              />
              <SummaryCard label="Errors" value={summary.errors} />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
            <p className="text-xs text-zinc-600">
              This action only created minimal program/batch linkage
              applications. It did not create or delete any students, and it did
              not create any fees, checklists, contracts, documents, or receipts.
            </p>
          </div>

          {state.results && state.results.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      {["Name", "Source sheet", "Outcome", "Detail", "Student"].map(
                        (h) => (
                          <th
                            key={h}
                            className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {state.results.map((r) => (
                      <tr key={r.studentId} className="align-top hover:bg-zinc-50">
                        <td className="px-3 py-2 text-zinc-900">
                          {r.legalFullName || "--"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-zinc-600">
                          {r.sourceSheet || "--"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${OUTCOME_COLORS[r.outcome]}`}
                          >
                            {OUTCOME_LABELS[r.outcome]}
                          </span>
                        </td>
                        <td className="min-w-[16rem] px-3 py-2 text-xs text-zinc-600">
                          {r.detail}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <Link
                            href={`/dashboard/students/${r.studentId}`}
                            className="font-medium text-zinc-700 hover:text-zinc-900 hover:underline"
                          >
                            View student
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
