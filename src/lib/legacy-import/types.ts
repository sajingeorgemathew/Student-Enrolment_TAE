// ACADEMIC-03: shared types for the legacy student Excel import preview.
// This file contains types only (no runtime imports) so it can be imported by
// both the server parser/action and the client preview component without
// pulling server-only dependencies into the client bundle.

// ACADEMIC-03-FIX: severity of a warning attached to a preview row.
// - none: nothing to review
// - info: worth knowing, import still allowed (for example missing email)
// - review: valid row, but admin should confirm before automatic import
// - blocking: row cannot be matched or imported as-is
export type WarningLevel = "none" | "info" | "review" | "blocking";

// ACADEMIC-03-FIX: machine-readable warning categories. Each warning attached
// to a row carries one of these so rows can be filtered and counted by cause.
export type WarningType =
  | "student_number_suffix"
  | "duplicate_student_number_in_excel"
  | "duplicate_email_in_excel"
  | "name_only_match"
  | "name_matches_multiple_students"
  | "name_mismatch_existing_student"
  | "email_mismatch_existing_student"
  | "missing_student_number"
  | "invalid_student_number"
  | "missing_name"
  | "missing_email"
  | "missing_phone"
  | "invalid_email_format"
  | "special_sheet_review"
  | "reenrolment_900_series"
  | "legend_or_summary_row"
  | "blank_row";

// A single classified warning: what happened, how serious it is, and a
// human-readable explanation for the admin.
export interface RowWarning {
  type: WarningType;
  level: Exclude<WarningLevel, "none">;
  message: string;
}

// A single data row extracted from the workbook before it is compared against
// the database. Produced by the parser.
export interface ParsedLegacyRow {
  sheet: string;
  rowNumber: number;
  rawStudentId: string;
  normalizedStudentNumber: string | null;
  studentNumberSuffix: string | null;
  legalFirstName: string;
  legalMiddleName: string;
  legalLastName: string;
  legalFullName: string;
  normalizedName: string;
  dateOfBirth: string | null;
  phone: string | null;
  rawEmail: string | null;
  normalizedEmail: string | null;
  statusText: string | null;
  address: string | null;
  isElce: boolean;
  // ACADEMIC-03-RULES: true when the row is a 900 Series re-enrolment row
  // (900-prefixed id digits or a 900 Series sheet). These are skipped, never
  // imported as new legacy students.
  is900Series: boolean;
  looksLikeLegend: boolean;
  warnings: RowWarning[];
}

export interface SkippedSheet {
  name: string;
  reason: string;
}

export interface ParseResult {
  rows: ParsedLegacyRow[];
  sheetsScanned: string[];
  sheetsSkipped: SkippedSheet[];
}

export type PreviewStatus =
  | "matched_student_number"
  | "matched_email"
  | "possible_name_batch_match"
  | "new_candidate"
  | "invalid_row"
  | "skipped_row"
  | "duplicate_in_excel"
  // ACADEMIC-03-RULES: 900 Series re-enrolment row - skipped, the original
  // student/batch record should be kept.
  | "skipped_reenrolment_duplicate"
  // ACADEMIC-03-RULES: ELCE row - belongs to a separate program and needs its
  // own import, never mixed into PSW monthly batches.
  | "separate_program_review";

// A row as shown in the preview table, after matching against the database.
export interface PreviewRow {
  sheet: string;
  rowNumber: number;
  rawStudentId: string;
  normalizedStudentNumber: string | null;
  legalFullName: string;
  email: string | null;
  phone: string | null;
  proposedBatch: string;
  matchStatus: PreviewStatus;
  // Highest severity among this row's warnings ("none" when there are none).
  warningLevel: WarningLevel;
  warningTypes: WarningType[];
  warningMessages: string[];
  // One human-readable line explaining the classification, shown in the
  // Reason column (for example "Clean new candidate" or "Skipped legend row").
  reason: string;
  // Why the row was skipped, when matchStatus is skipped_row.
  skipReason: string | null;
  // How the row matched an existing student, when one was found.
  matchReason: string | null;
  matchedStudentId: string | null;
  matchedStudentName: string | null;
  matchedStudentNumber: string | null;
}

export interface PreviewSummary {
  sheetsScanned: number;
  rowsParsed: number;
  cleanNewCandidates: number;
  matchedExisting: number;
  reviewNeeded: number;
  blockingIssues: number;
  skippedRows: number;
  // ACADEMIC-03-RULES: 900 Series re-enrolment rows skipped (not importable).
  series900Skipped: number;
  // ACADEMIC-03-RULES: ELCE rows held for a separate program import.
  elceSeparateProgram: number;
}

export interface LegacyImportPreviewState {
  ok: boolean;
  error?: string;
  fileName?: string;
  summary?: PreviewSummary;
  sheetsScanned?: string[];
  sheetsSkipped?: SkippedSheet[];
  rows?: PreviewRow[];
}
