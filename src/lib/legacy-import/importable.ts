// ACADEMIC-04: single source of truth for which preview rows may be imported.
// Shared by the client preview (to enable/disable checkboxes) and the server
// import action (to re-validate every selected row). Keeping this pure and in
// one place means the client and the server can never disagree about what is
// importable, and the rule cannot be bypassed from the client.

import type { PreviewRow } from "./types";

// A row is importable only when it has a usable normalized student number and
// is either:
//   - a clean new candidate (new_candidate at level none or info), or
//   - an admin-reviewed importable row (reviewed_importable, which also covers
//     the Tara correction to PSW125293).
//
// Everything else is blocked: matched existing students, possible name matches,
// invalid rows, skipped legend/blank rows, in-file duplicates, 900 Series
// re-enrolment rows, ELCE separate-program rows, and reviewed-excluded rows
// (for example Souleyman Issa, June 01).
export function isImportableRow(row: PreviewRow): boolean {
  if (!row.normalizedStudentNumber) return false;
  if (row.matchStatus === "reviewed_importable") return true;
  return (
    row.matchStatus === "new_candidate" &&
    (row.warningLevel === "none" || row.warningLevel === "info")
  );
}

// ACADEMIC-04: reviewed-importable rows carry an explicit admin decision and
// are allowed to bypass the email-duplicate guard (valid re-enrolments such as
// Chandrashekar Sriramalu and Alvin Saji reuse an earlier email).
export function isReviewedImportableRow(row: PreviewRow): boolean {
  return row.matchStatus === "reviewed_importable";
}

// Stable key identifying a preview row within one workbook (sheet + row number).
// Used to pass the client's selection back to the server, which re-parses the
// same file and re-validates each keyed row.
export function rowKey(sheet: string, rowNumber: number): string {
  return `${sheet}|||${rowNumber}`;
}
