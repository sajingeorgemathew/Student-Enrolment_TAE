"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { Upload, FileSpreadsheet } from "lucide-react";
import { previewLegacyImport } from "./legacy-import-actions";
import type {
  LegacyImportPreviewState,
  PreviewRow,
  PreviewStatus,
} from "@/lib/legacy-import/types";

// ACADEMIC-03: admin-only legacy student import preview UI. Uploads an .xlsx
// file to the preview server action and renders summary counts plus a filtered
// table. This is preview only - nothing is written to the database.

const initialState: LegacyImportPreviewState = { ok: false };

type FilterValue = "all" | "matched" | "new" | "warnings" | "invalid";

const STATUS_LABELS: Record<PreviewStatus, string> = {
  matched_student_number: "Matched (student number)",
  matched_email: "Matched (email)",
  possible_name_batch_match: "Possible name match",
  new_candidate: "New candidate",
  invalid_row: "Invalid",
  skipped_row: "Skipped",
  duplicate_in_excel: "Duplicate in file",
};

const STATUS_COLORS: Record<PreviewStatus, string> = {
  matched_student_number: "bg-emerald-100 text-emerald-800",
  matched_email: "bg-emerald-100 text-emerald-800",
  possible_name_batch_match: "bg-amber-100 text-amber-800",
  new_candidate: "bg-blue-100 text-blue-800",
  invalid_row: "bg-red-100 text-red-800",
  skipped_row: "bg-zinc-100 text-zinc-600",
  duplicate_in_excel: "bg-orange-100 text-orange-800",
};

const MATCHED_STATUSES: PreviewStatus[] = [
  "matched_student_number",
  "matched_email",
  "possible_name_batch_match",
];

function rowMatchesFilter(row: PreviewRow, filter: FilterValue): boolean {
  switch (filter) {
    case "all":
      return true;
    case "matched":
      return MATCHED_STATUSES.includes(row.status);
    case "new":
      return row.status === "new_candidate";
    case "warnings":
      return (
        row.status === "duplicate_in_excel" ||
        (row.warnings.length > 0 &&
          row.status !== "skipped_row" &&
          row.status !== "invalid_row")
      );
    case "invalid":
      return row.status === "invalid_row" || row.status === "skipped_row";
    default:
      return true;
  }
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-2xl font-semibold text-zinc-900">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

export function LegacyImportPreview() {
  const [state, formAction, pending] = useActionState(
    previewLegacyImport,
    initialState
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");

  const rows = state.rows ?? [];
  const visibleRows = rows.filter((row) => rowMatchesFilter(row, filter));

  const filterTabs: { value: FilterValue; label: string }[] = [
    { value: "all", label: "All" },
    { value: "matched", label: "Matched" },
    { value: "new", label: "New candidates" },
    { value: "warnings", label: "Warnings" },
    { value: "invalid", label: "Invalid / skipped" },
  ];

  return (
    <div className="space-y-8">
      <form
        action={formAction}
        className="rounded-lg border border-zinc-200 bg-white p-5"
      >
        <h2 className="text-sm font-semibold text-zinc-900">
          Upload legacy student Excel file
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Accepted type: .xlsx. The file is parsed for preview only. No student
          records are created, updated, or deleted.
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
            {pending ? "Parsing..." : "Preview import"}
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

      {state.ok && state.summary && (
        <>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-900">
                Preview for {state.fileName}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <SummaryCard
                label="Sheets scanned"
                value={state.summary.sheetsScanned}
              />
              <SummaryCard
                label="Rows parsed"
                value={state.summary.rowsParsed}
              />
              <SummaryCard
                label="Matched existing"
                value={state.summary.matchedExisting}
              />
              <SummaryCard
                label="New candidates"
                value={state.summary.newCandidates}
              />
              <SummaryCard
                label="Rows with warnings"
                value={state.summary.possibleDuplicates}
              />
              <SummaryCard
                label="Skipped rows"
                value={state.summary.skippedRows}
              />
            </div>
          </div>

          {state.sheetsScanned && state.sheetsScanned.length > 0 && (
            <p className="text-xs text-zinc-500">
              Scanned sheets: {state.sheetsScanned.join(", ")}
            </p>
          )}
          {state.sheetsSkipped && state.sheetsSkipped.length > 0 && (
            <p className="text-xs text-amber-700">
              Skipped sheets:{" "}
              {state.sheetsSkipped
                .map((s) => `${s.name} (${s.reason})`)
                .join(", ")}
            </p>
          )}

          <div>
            <div className="mb-3 inline-flex flex-wrap rounded-md border border-zinc-200 bg-white p-0.5">
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setFilter(tab.value)}
                  className={`rounded px-3 py-1.5 text-xs font-medium ${
                    filter === tab.value
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {visibleRows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-white py-12 text-center">
                <p className="text-sm font-medium text-zinc-600">
                  No rows match this filter
                </p>
              </div>
            ) : (
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
                          "Legal full name",
                          "Email",
                          "Phone",
                          "Proposed batch",
                          "Status",
                          "Warnings / reason",
                          "Matched student",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {visibleRows.map((row) => (
                        <tr
                          key={`${row.sheet}-${row.rowNumber}`}
                          className="align-top hover:bg-zinc-50"
                        >
                          <td className="whitespace-nowrap px-3 py-2 text-zinc-600">
                            {row.sheet}
                          </td>
                          <td className="px-3 py-2 text-zinc-500">
                            {row.rowNumber}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-zinc-600">
                            {row.rawStudentId || "--"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-medium text-zinc-900">
                            {row.normalizedStudentNumber || "--"}
                          </td>
                          <td className="px-3 py-2 text-zinc-900">
                            {row.legalFullName || "--"}
                          </td>
                          <td className="px-3 py-2 text-zinc-600">
                            {row.email || "--"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-zinc-600">
                            {row.phone || "--"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-zinc-600">
                            {row.proposedBatch}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                                STATUS_COLORS[row.status]
                              }`}
                            >
                              {STATUS_LABELS[row.status]}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-zinc-500">
                            {row.warnings.length > 0 ? (
                              <ul className="list-disc space-y-0.5 pl-4">
                                {row.warnings.map((w, i) => (
                                  <li key={i}>{w}</li>
                                ))}
                              </ul>
                            ) : (
                              "--"
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            {row.matchedStudentId ? (
                              <Link
                                href={`/dashboard/students/${row.matchedStudentId}`}
                                className="font-medium text-zinc-700 hover:text-zinc-900 hover:underline"
                              >
                                {row.matchedStudentName ||
                                  row.matchedStudentNumber ||
                                  "View student"}
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
          </div>
        </>
      )}
    </div>
  );
}
