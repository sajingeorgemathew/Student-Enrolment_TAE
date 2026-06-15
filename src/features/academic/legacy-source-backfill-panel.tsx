"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { Upload, FileSpreadsheet, AlertTriangle } from "lucide-react";
import {
  backfillLegacySourceMetadata,
  type BackfillRowResult,
  type LegacySourceBackfillState,
} from "./legacy-source-backfill-actions";

// ACADEMIC-05A: admin-only panel that uploads the master Excel and backfills
// source sheet/source row metadata onto already imported legacy students. It
// never creates students or applications - the page blocks sales and viewer and
// the server action re-checks admin/super_admin.

const initialState: LegacySourceBackfillState = { ok: false };

const OUTCOME_LABELS: Record<BackfillRowResult["outcome"], string> = {
  updated: "Updated",
  already_had_metadata: "Already had metadata",
  matched_no_change: "Matched (no change)",
  unmatched: "Unmatched",
  ambiguous: "Ambiguous",
  error: "Error",
};

const OUTCOME_COLORS: Record<BackfillRowResult["outcome"], string> = {
  updated: "bg-emerald-100 text-emerald-800",
  already_had_metadata: "bg-zinc-100 text-zinc-600",
  matched_no_change: "bg-zinc-100 text-zinc-600",
  unmatched: "bg-amber-100 text-amber-800",
  ambiguous: "bg-orange-100 text-orange-800",
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

export function LegacySourceBackfillPanel() {
  const [state, formAction, pending] = useActionState(
    backfillLegacySourceMetadata,
    initialState
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const summary = state.summary;

  return (
    <div className="space-y-8">
      <form
        action={formAction}
        className="rounded-lg border border-zinc-200 bg-white p-5"
      >
        <h2 className="text-sm font-semibold text-zinc-900">
          Upload PSW masterclass Excel file
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Accepted type: .xlsx. The file is parsed only to match existing legacy
          students. No students or applications are created, and no students are
          deleted. Only source sheet and source row metadata are written.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            accept=".xlsx"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 sm:max-w-md"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {pending ? "Running backfill..." : "Run source backfill"}
          </button>
        </div>

        {fileName && (
          <p className="mt-2 text-xs text-zinc-500">Selected: {fileName}</p>
        )}

        {state.error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
      </form>

      {state.ok && summary && (
        <>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-900">
                Backfill result for {state.fileName}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <SummaryCard
                label="Total parsed PSW rows"
                value={summary.totalParsedPswRows}
              />
              <SummaryCard
                label="Matched by student number"
                value={summary.matchedByStudentNumber}
              />
              <SummaryCard
                label="Matched by email fallback"
                value={summary.matchedByEmail}
              />
              <SummaryCard label="Updated" value={summary.updated} />
              <SummaryCard
                label="Already had metadata"
                value={summary.alreadyHadMetadata}
              />
              <SummaryCard label="Unmatched" value={summary.unmatched} />
              <SummaryCard label="Ambiguous" value={summary.ambiguous} />
              <SummaryCard
                label="Skipped 900 Series"
                value={summary.skipped900Series}
              />
              <SummaryCard label="Skipped ELCE" value={summary.skippedElce} />
              <SummaryCard
                label="Skipped legend/header rows"
                value={summary.skippedLegendHeaderRows}
              />
              <SummaryCard
                label="Reviewed excluded"
                value={summary.reviewedExcluded}
              />
              <SummaryCard label="Errors" value={summary.errors} />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
            <p className="text-xs text-zinc-600">
              This backfill only updates source metadata on existing legacy
              students. It did not create or delete any students, and it did not
              create any applications, fees, checklists, or contracts.
            </p>
          </div>

          {state.results && state.results.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      {[
                        "Sheet",
                        "Row",
                        "Raw ID",
                        "Normalized #",
                        "Name",
                        "Outcome",
                        "Matched by",
                        "Detail",
                        "Student",
                      ].map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {state.results.map((r) => (
                      <tr
                        key={`${r.sheet}-${r.rowNumber}`}
                        className="align-top hover:bg-zinc-50"
                      >
                        <td className="whitespace-nowrap px-3 py-2 text-zinc-600">
                          {r.sheet}
                        </td>
                        <td className="px-3 py-2 text-zinc-500">
                          {r.rowNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-zinc-600">
                          {r.rawStudentId || "--"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-medium text-zinc-900">
                          {r.normalizedStudentNumber || "--"}
                        </td>
                        <td className="px-3 py-2 text-zinc-900">
                          {r.legalFullName || "--"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${OUTCOME_COLORS[r.outcome]}`}
                          >
                            {OUTCOME_LABELS[r.outcome]}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-zinc-600">
                          {r.matchedBy === "student_number"
                            ? "Student number"
                            : r.matchedBy === "email"
                              ? "Email"
                              : "--"}
                        </td>
                        <td className="min-w-[14rem] px-3 py-2 text-xs text-zinc-600">
                          {r.detail}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          {r.studentId ? (
                            <Link
                              href={`/dashboard/students/${r.studentId}`}
                              className="font-medium text-zinc-700 hover:text-zinc-900 hover:underline"
                            >
                              View student
                            </Link>
                          ) : (
                            <span className="text-zinc-400">--</span>
                          )}
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
