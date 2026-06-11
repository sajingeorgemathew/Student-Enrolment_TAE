// ACADEMIC-03: shared types for the legacy student Excel import preview.
// This file contains types only (no runtime imports) so it can be imported by
// both the server parser/action and the client preview component without
// pulling server-only dependencies into the client bundle.

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
  looksLikeLegend: boolean;
  warnings: string[];
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
  | "duplicate_in_excel";

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
  status: PreviewStatus;
  warnings: string[];
  matchedStudentId: string | null;
  matchedStudentName: string | null;
  matchedStudentNumber: string | null;
}

export interface PreviewSummary {
  sheetsScanned: number;
  rowsParsed: number;
  matchedExisting: number;
  newCandidates: number;
  possibleDuplicates: number;
  invalidRows: number;
  skippedRows: number;
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
