"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import {
  linkLegacyStudents,
  type LegacyLinkageOverview,
  type LegacyLinkageResultState,
  type LinkageRowState,
} from "./legacy-linkage-actions";

// ACADEMIC-05: admin-only panel to link imported legacy students to the PSW
// program and batch. Shows the current linkage state and runs the linkage
// action. Sales and viewer never reach this component - the page blocks them.

const initialState: LegacyLinkageResultState = {
  ok: false,
  linkedWithBatch: 0,
  linkedNeedsBatch: 0,
  alreadyLinked: 0,
  failed: 0,
  results: [],
};

const STATE_LABELS: Record<LinkageRowState, string> = {
  linked_with_batch: "Linked (program + batch)",
  linked_needs_batch: "Linked (needs batch)",
  already_linked: "Already linked",
  needs_batch: "Needs batch linkage",
  unlinked: "Ready to link",
};

const STATE_COLORS: Record<LinkageRowState, string> = {
  linked_with_batch: "bg-emerald-100 text-emerald-800",
  linked_needs_batch: "bg-amber-100 text-amber-800",
  already_linked: "bg-zinc-100 text-zinc-600",
  needs_batch: "bg-amber-100 text-amber-800",
  unlinked: "bg-blue-100 text-blue-800",
};

export function LegacyLinkagePanel({
  overview,
}: {
  overview: LegacyLinkageOverview;
}) {
  const [state, formAction, pending] = useActionState(
    linkLegacyStudents,
    initialState
  );

  const canLink = overview.unlinkedCount > 0 && !overview.pswProgramMissing;

  return (
    <div className="space-y-6">
      {overview.pswProgramMissing && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">
            The PSW program was not found. It must exist before legacy students
            can be linked. No batch was created or changed.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Legacy students" value={overview.totalLegacy} />
        <SummaryCard label="Already linked" value={overview.linkedCount} />
        <SummaryCard label="Unlinked" value={overview.unlinkedCount} />
        <SummaryCard
          label="Needs batch linkage"
          value={overview.needsBatchCount}
        />
      </div>

      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
        <p className="text-sm text-zinc-700">
          Linking creates a minimal historical application that connects each
          legacy student to the PSW program and, where the source sheet matches
          an existing PSW batch, to that batch. It does not create fees,
          checklists, contracts, receipts, or documents, and it does not move the
          student into the active enrolment workflow.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          {overview.pswBatchCount} active PSW batch
          {overview.pswBatchCount === 1 ? "" : "es"} available for mapping. A
          student whose source sheet does not match a batch is linked to the
          program and reported as needing batch linkage. No batch is created
          automatically.
        </p>
      </div>

      {state.ok && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-medium text-emerald-800">
            Linkage complete
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            {state.linkedWithBatch} linked with batch, {state.linkedNeedsBatch}{" "}
            linked needing batch, {state.alreadyLinked} already linked,{" "}
            {state.failed} failed. Refresh to see the updated counts.
          </p>
        </div>
      )}

      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-800">{state.error}</p>
        </div>
      )}

      <form action={formAction}>
        <button
          type="submit"
          disabled={!canLink || pending}
          className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? "Linking..."
            : `Link unlinked legacy students (${overview.unlinkedCount})`}
        </button>
        {!canLink && !overview.pswProgramMissing && (
          <p className="mt-2 text-xs text-zinc-500">
            No unlinked legacy students. All imported legacy students are already
            linked.
          </p>
        )}
      </form>

      <LinkageTable
        title="Current legacy students"
        rows={overview.rows}
      />

      {state.ok && state.results.length > 0 && (
        <LinkageTable title="Linkage run results" rows={state.results} />
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function LinkageTable({
  title,
  rows,
}: {
  title: string;
  rows: {
    studentId: string;
    studentNumber: string | null;
    legalFullName: string;
    sourceSheet: string | null;
    state: LinkageRowState;
    detail: string;
  }[];
}) {
  if (rows.length === 0) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-medium text-zinc-700">{title}</h3>
        <div className="rounded-md border border-dashed border-zinc-200 px-4 py-6 text-center">
          <p className="text-sm text-zinc-500">No legacy students found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-zinc-700">{title}</h3>
      <div className="overflow-x-auto rounded-md border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <Th>Student</Th>
              <Th>Student No.</Th>
              <Th>Source Sheet</Th>
              <Th>Status</Th>
              <Th>Detail</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.studentId} className="hover:bg-zinc-50">
                <td className="px-4 py-2.5 text-sm text-zinc-900">
                  <Link
                    href={`/dashboard/students/${row.studentId}`}
                    className="font-medium text-zinc-700 hover:text-zinc-900"
                  >
                    {row.legalFullName}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-sm text-zinc-600">
                  {row.studentNumber ?? "--"}
                </td>
                <td className="px-4 py-2.5 text-sm text-zinc-600">
                  {row.sourceSheet ?? "--"}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATE_COLORS[row.state]}`}
                  >
                    {STATE_LABELS[row.state]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-sm text-zinc-500">
                  {row.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
      {children}
    </th>
  );
}
