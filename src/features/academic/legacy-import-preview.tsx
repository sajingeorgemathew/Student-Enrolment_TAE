"use client";

import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Upload, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { previewLegacyImport } from "./legacy-import-actions";
import { confirmLegacyImport } from "./legacy-import-confirm-actions";
import { isImportableRow, rowKey } from "@/lib/legacy-import/importable";
import type {
  LegacyImportConfirmState,
  LegacyImportPreviewState,
  PreviewRow,
  PreviewStatus,
  WarningLevel,
} from "@/lib/legacy-import/types";

// ACADEMIC-03: admin-only legacy student import preview UI. Uploads an .xlsx
// file to the preview server action and renders summary counts plus a filtered
// table. This is preview only - nothing is written to the database.
// ACADEMIC-03-FIX: every row now shows a warning level, a human-readable
// reason, and detail messages so admin can tell why each row was flagged.

const initialState: LegacyImportPreviewState = { ok: false };

const initialImportState: LegacyImportConfirmState = {
  ok: false,
  created: 0,
  skipped: 0,
  failed: 0,
  results: [],
};

const OUTCOME_COLORS: Record<string, string> = {
  created: "bg-emerald-100 text-emerald-800",
  skipped: "bg-zinc-100 text-zinc-600",
  failed: "bg-red-100 text-red-800",
};

type FilterValue =
  | "all"
  | "clean_new"
  | "matched"
  | "review"
  | "blocking"
  | "skipped"
  | "series_900"
  | "elce"
  | "reviewed";

const STATUS_LABELS: Record<PreviewStatus, string> = {
  matched_student_number: "Matched (student number)",
  matched_email: "Matched (email)",
  possible_name_batch_match: "Possible name match",
  new_candidate: "New candidate",
  invalid_row: "Invalid",
  skipped_row: "Skipped",
  duplicate_in_excel: "Duplicate in file",
  skipped_reenrolment_duplicate: "900 Series - skipped",
  separate_program_review: "ELCE - separate program",
  reviewed_importable: "Reviewed - importable",
  reviewed_excluded: "Reviewed - excluded",
};

const STATUS_COLORS: Record<PreviewStatus, string> = {
  matched_student_number: "bg-emerald-100 text-emerald-800",
  matched_email: "bg-emerald-100 text-emerald-800",
  possible_name_batch_match: "bg-amber-100 text-amber-800",
  new_candidate: "bg-blue-100 text-blue-800",
  invalid_row: "bg-red-100 text-red-800",
  skipped_row: "bg-zinc-100 text-zinc-600",
  duplicate_in_excel: "bg-orange-100 text-orange-800",
  skipped_reenrolment_duplicate: "bg-purple-100 text-purple-800",
  separate_program_review: "bg-indigo-100 text-indigo-800",
  reviewed_importable: "bg-teal-100 text-teal-800",
  reviewed_excluded: "bg-rose-100 text-rose-800",
};

const LEVEL_LABELS: Record<WarningLevel, string> = {
  none: "None",
  info: "Info",
  review: "Review",
  blocking: "Blocking",
};

const LEVEL_COLORS: Record<WarningLevel, string> = {
  none: "bg-zinc-100 text-zinc-500",
  info: "bg-sky-100 text-sky-800",
  review: "bg-amber-100 text-amber-800",
  blocking: "bg-red-100 text-red-800",
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
    case "clean_new":
      return (
        row.matchStatus === "new_candidate" &&
        (row.warningLevel === "none" || row.warningLevel === "info")
      );
    case "matched":
      return MATCHED_STATUSES.includes(row.matchStatus);
    case "review":
      // 900 Series and ELCE rows carry review-level warnings but have their
      // own filters, so they are not repeated under Review needed.
      return (
        row.warningLevel === "review" &&
        row.matchStatus !== "skipped_reenrolment_duplicate" &&
        row.matchStatus !== "separate_program_review"
      );
    case "blocking":
      return (
        row.warningLevel === "blocking" || row.matchStatus === "invalid_row"
      );
    case "skipped":
      return row.matchStatus === "skipped_row";
    case "series_900":
      return row.matchStatus === "skipped_reenrolment_duplicate";
    case "elce":
      return row.matchStatus === "separate_program_review";
    case "reviewed":
      // Both reviewed-keep/correct (importable) and reviewed-exclude rows.
      return (
        row.matchStatus === "reviewed_importable" ||
        row.matchStatus === "reviewed_excluded"
      );
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
  const [importState, importDispatch, importPending] = useActionState(
    confirmLegacyImport,
    initialImportState
  );
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");
  // ACADEMIC-04: keys (sheet|||row) of importable rows the admin has selected.
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  // Two-step confirmation: the admin reviews the summary before the records are
  // actually created.
  const [confirming, setConfirming] = useState(false);

  const rows = useMemo(() => state.rows ?? [], [state.rows]);
  const visibleRows = rows.filter((row) => rowMatchesFilter(row, filter));

  // ACADEMIC-04: importable rows across the whole preview (not just the current
  // filter), used for selection state and the select-all control.
  const importableKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const row of rows) {
      if (isImportableRow(row)) keys.add(rowKey(row.sheet, row.rowNumber));
    }
    return keys;
  }, [rows]);

  const selectedCount = selectedKeys.size;
  const importableCount = importableKeys.size;
  const allImportableSelected =
    importableCount > 0 && selectedCount === importableCount;
  const importDone = importState.ok;

  function resetSelection() {
    setSelectedKeys(new Set());
    setConfirming(false);
  }

  function handleFileChange(file: File | null) {
    setSelectedFile(file);
    setFileName(file?.name ?? null);
    resetSelection();
  }

  function toggleRow(key: string) {
    setConfirming(false);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelectAll() {
    setConfirming(false);
    setSelectedKeys((prev) =>
      prev.size === importableCount ? new Set() : new Set(importableKeys)
    );
  }

  function submitImport() {
    if (!selectedFile || selectedCount === 0) return;
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("selectedKeys", JSON.stringify(Array.from(selectedKeys)));
    startTransition(() => importDispatch(fd));
    setConfirming(false);
  }

  const filterTabs: { value: FilterValue; label: string }[] = [
    { value: "all", label: "All" },
    { value: "clean_new", label: "Clean new" },
    { value: "matched", label: "Matched" },
    { value: "review", label: "Review needed" },
    { value: "blocking", label: "Blocking issues" },
    { value: "skipped", label: "Skipped" },
    { value: "series_900", label: "900 Series" },
    { value: "elce", label: "ELCE" },
    { value: "reviewed", label: "Reviewed" },
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
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <SummaryCard
                label="Sheets scanned"
                value={state.summary.sheetsScanned}
              />
              <SummaryCard
                label="Rows parsed"
                value={state.summary.rowsParsed}
              />
              <SummaryCard
                label="Clean new candidates"
                value={state.summary.cleanNewCandidates}
              />
              <SummaryCard
                label="Matched existing"
                value={state.summary.matchedExisting}
              />
              <SummaryCard
                label="Review needed"
                value={state.summary.reviewNeeded}
              />
              <SummaryCard
                label="Blocking issues"
                value={state.summary.blockingIssues}
              />
              <SummaryCard
                label="Skipped rows"
                value={state.summary.skippedRows}
              />
              <SummaryCard
                label="900 Series skipped"
                value={state.summary.series900Skipped}
              />
              <SummaryCard
                label="ELCE separate program"
                value={state.summary.elceSeparateProgram}
              />
              <SummaryCard
                label="Reviewed importable"
                value={state.summary.reviewedImportable}
              />
              <SummaryCard
                label="Reviewed excluded"
                value={state.summary.reviewedExcluded}
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

          <div className="rounded-lg border border-amber-300 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-amber-900">
                  Create legacy student records
                </h2>
                <p className="mt-1 text-xs text-amber-800">
                  Importing writes new legacy student records to the database.
                  Only clean new candidates and reviewed importable rows can be
                  selected. Matched existing students, possible matches, invalid
                  and skipped rows, in-file duplicates, 900 Series re-enrolment
                  rows, ELCE rows, and reviewed-excluded rows cannot be selected
                  or imported. There is no import-all.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-amber-900">
                    <input
                      type="checkbox"
                      checked={allImportableSelected}
                      onChange={toggleSelectAll}
                      disabled={importableCount === 0 || importPending}
                      className="h-4 w-4 rounded border-amber-400"
                    />
                    Select all importable rows ({importableCount})
                  </label>
                  <span className="text-xs text-amber-800">
                    {selectedCount} selected
                  </span>
                </div>

                {!confirming ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setConfirming(true)}
                      disabled={selectedCount === 0 || importPending}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Review import ({selectedCount})
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 rounded-md border border-amber-400 bg-white p-4">
                    <p className="text-sm font-medium text-zinc-900">
                      Confirm import of {selectedCount} legacy student{" "}
                      {selectedCount === 1 ? "record" : "records"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Each selected row will be re-validated and duplicate
                      checked on the server. Rows that are no longer importable
                      or already exist will be skipped, not created. This action
                      creates records in the student list marked as Legacy
                      Student.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={submitImport}
                        disabled={importPending}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {importPending
                          ? "Creating records..."
                          : `Confirm and create ${selectedCount} ${
                              selectedCount === 1 ? "record" : "records"
                            }`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        disabled={importPending}
                        className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {importState.error && (
                  <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {importState.error}
                  </div>
                )}

                {importDone && (
                  <div className="mt-3 rounded-md border border-zinc-200 bg-white p-4">
                    <p className="text-sm font-semibold text-zinc-900">
                      Import result for {importState.fileName}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      <span className="text-emerald-700">
                        Created: {importState.created}
                      </span>
                      <span className="text-zinc-600">
                        Skipped: {importState.skipped}
                      </span>
                      <span className="text-red-700">
                        Failed: {importState.failed}
                      </span>
                    </div>
                    {importState.results.length > 0 && (
                      <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full divide-y divide-zinc-200 text-sm">
                          <thead className="bg-zinc-50">
                            <tr>
                              {[
                                "Sheet",
                                "Row",
                                "Student #",
                                "Name",
                                "Outcome",
                                "Reason",
                                "Record",
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
                            {importState.results.map((r) => (
                              <tr key={r.key} className="align-top">
                                <td className="whitespace-nowrap px-3 py-2 text-zinc-600">
                                  {r.sheet || "--"}
                                </td>
                                <td className="px-3 py-2 text-zinc-500">
                                  {r.rowNumber || "--"}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 font-medium text-zinc-900">
                                  {r.studentNumber || "--"}
                                </td>
                                <td className="px-3 py-2 text-zinc-900">
                                  {r.legalFullName || "--"}
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                                      OUTCOME_COLORS[r.outcome] ??
                                      "bg-zinc-100 text-zinc-600"
                                    }`}
                                  >
                                    {r.outcome}
                                  </span>
                                </td>
                                <td className="min-w-[14rem] px-3 py-2 text-xs text-zinc-600">
                                  {r.reason}
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
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

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
                        <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                          Import
                        </th>
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
                          "Level",
                          "Reason",
                          "Details",
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
                      {visibleRows.map((row) => {
                        const key = rowKey(row.sheet, row.rowNumber);
                        const importable = importableKeys.has(key);
                        return (
                        <tr
                          key={key}
                          className="align-top hover:bg-zinc-50"
                        >
                          <td className="whitespace-nowrap px-3 py-2">
                            <input
                              type="checkbox"
                              checked={importable && selectedKeys.has(key)}
                              onChange={() => toggleRow(key)}
                              disabled={!importable || importPending}
                              aria-label={
                                importable
                                  ? `Select ${row.legalFullName || row.normalizedStudentNumber || "row"} for import`
                                  : "Row not importable"
                              }
                              className="h-4 w-4 rounded border-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                            />
                          </td>
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
                                STATUS_COLORS[row.matchStatus]
                              }`}
                            >
                              {STATUS_LABELS[row.matchStatus]}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {row.warningLevel === "none" ? (
                              <span className="text-xs text-zinc-400">--</span>
                            ) : (
                              <span
                                className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                                  LEVEL_COLORS[row.warningLevel]
                                }`}
                              >
                                {LEVEL_LABELS[row.warningLevel]}
                              </span>
                            )}
                          </td>
                          <td className="min-w-[14rem] px-3 py-2 text-xs text-zinc-700">
                            {row.reason}
                          </td>
                          <td className="min-w-[14rem] px-3 py-2 text-xs text-zinc-500">
                            {row.warningMessages.length > 0 ? (
                              <ul className="list-disc space-y-0.5 pl-4">
                                {row.warningMessages.map((message, i) => (
                                  <li key={i}>{message}</li>
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
                        );
                      })}
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
