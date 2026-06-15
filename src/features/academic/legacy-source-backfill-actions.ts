"use server";

// ACADEMIC-05A: admin-only server action that backfills source sheet/source row
// metadata onto the legacy students that ACADEMIC-04 already imported.
//
// What it does:
//   - re-parses and re-classifies the uploaded master Excel from scratch so the
//     reviewed ACADEMIC-03 decisions are preserved (Tara corrected to PSW125293,
//     Souleyman excluded, 900 Series and ELCE ignored, legend/header rows
//     skipped),
//   - considers PSW monthly sheets only,
//   - matches each PSW data row to an existing legacy student by normalized
//     student number first, then by a safe email fallback (exactly one legacy
//     student with that email and no student-number conflict),
//   - updates only the four legacy source metadata fields on the matched student.
//
// What it never does: it does not create students, delete students, create
// applications, or touch receipts, contracts, fees, or checklists. It only
// updates metadata columns on rows where record_source = 'legacy_import'.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { parseLegacyWorkbook } from "@/lib/legacy-import/parse-workbook";
import {
  classifyLegacyRows,
  type ExistingStudent,
} from "@/lib/legacy-import/classify";
import {
  normalizeStudentNumberForImport,
  normalizeEmailForImport,
  looksLikeEmail,
} from "@/lib/legacy-import/normalize";
import type { PreviewRow } from "@/lib/legacy-import/types";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

export interface BackfillRowResult {
  sheet: string;
  rowNumber: number;
  rawStudentId: string;
  normalizedStudentNumber: string | null;
  legalFullName: string;
  outcome:
    | "updated"
    | "already_had_metadata"
    | "matched_no_change"
    | "unmatched"
    | "ambiguous"
    | "error";
  matchedBy: "student_number" | "email" | null;
  detail: string;
  studentId: string | null;
}

export interface BackfillSummary {
  totalParsedPswRows: number;
  matchedByStudentNumber: number;
  matchedByEmail: number;
  updated: number;
  alreadyHadMetadata: number;
  unmatched: number;
  ambiguous: number;
  skipped900Series: number;
  skippedElce: number;
  skippedLegendHeaderRows: number;
  reviewedExcluded: number;
  errors: number;
}

export interface LegacySourceBackfillState {
  ok: boolean;
  error?: string;
  fileName?: string;
  summary?: BackfillSummary;
  results?: BackfillRowResult[];
}

interface LegacyStudentRow {
  id: string;
  student_number: string | null;
  email: string | null;
  legal_full_name: string | null;
  legacy_source_sheet: string | null;
  legacy_source_row: number | null;
}

function emptyState(error: string): LegacySourceBackfillState {
  return { ok: false, error };
}

// Classified statuses that are not PSW data rows to backfill. Each maps to its
// own reported skip count rather than being matched against a student.
type SkipKind =
  | "skipped900"
  | "skippedElce"
  | "skippedLegendHeader"
  | "reviewedExcluded";

function skipKindFor(row: PreviewRow): SkipKind | null {
  switch (row.matchStatus) {
    case "skipped_reenrolment_duplicate":
      return "skipped900";
    case "separate_program_review":
      return "skippedElce";
    case "skipped_row":
      return "skippedLegendHeader";
    case "reviewed_excluded":
      return "reviewedExcluded";
    default:
      return null;
  }
}

export async function backfillLegacySourceMetadata(
  _prev: LegacySourceBackfillState,
  formData: FormData
): Promise<LegacySourceBackfillState> {
  // Authorization is enforced inside the action, not only on the page, because
  // server actions are reachable by direct POST.
  const profile = await getUserProfile();
  if (!profile) {
    return emptyState("You must be logged in.");
  }
  if (!isAdminOrSuper(profile.role)) {
    return emptyState(
      "Legacy source backfill is available to admin and super admin only."
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return emptyState("Select an Excel (.xlsx) file before running the backfill.");
  }
  if (!/\.xlsx$/i.test(file.name)) {
    return emptyState("Only .xlsx files are supported.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return emptyState("The file is too large. Maximum size is 15 MB.");
  }

  let parsed;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    parsed = await parseLegacyWorkbook(buffer);
  } catch (err) {
    console.error("Legacy source backfill parse error:", err);
    return emptyState(
      "Could not read the Excel file. Confirm it is a valid .xlsx file."
    );
  }

  const supabase = await createClient();
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select(
      "id, student_number, email, legal_full_name, legacy_source_sheet, legacy_source_row"
    )
    .eq("record_source", "legacy_import");

  if (studentsError) {
    console.error(
      "Legacy source backfill student read error:",
      studentsError.message
    );
    return emptyState("Could not load legacy students for matching.");
  }

  const legacyStudents = (students ?? []) as LegacyStudentRow[];

  // Index legacy students for matching, normalized the same way as the import
  // rows so 125315 and PSW125315 are treated as one number.
  const byNumber = new Map<string, LegacyStudentRow>();
  const byEmail = new Map<string, LegacyStudentRow[]>();
  for (const s of legacyStudents) {
    const n = normalizeStudentNumberForImport(s.student_number).normalized;
    if (n && !byNumber.has(n)) byNumber.set(n, s);
    const e = normalizeEmailForImport(s.email);
    if (e) {
      const list = byEmail.get(e) ?? [];
      list.push(s);
      byEmail.set(e, list);
    }
  }

  // Classify rows so reviewed decisions (corrections, exclusions) and the 900
  // Series / ELCE / legend handling all match the import preview exactly. The
  // existing-student snapshot is the legacy students themselves.
  const existing: ExistingStudent[] = legacyStudents.map((s) => ({
    id: s.id,
    student_number: s.student_number,
    email: s.email,
    legal_full_name: s.legal_full_name,
  }));
  const { rows: classified } = classifyLegacyRows(
    parsed.rows,
    existing,
    parsed.sheetsScanned.length
  );

  const summary: BackfillSummary = {
    totalParsedPswRows: 0,
    matchedByStudentNumber: 0,
    matchedByEmail: 0,
    updated: 0,
    alreadyHadMetadata: 0,
    unmatched: 0,
    ambiguous: 0,
    skipped900Series: 0,
    skippedElce: 0,
    skippedLegendHeaderRows: 0,
    reviewedExcluded: 0,
    errors: 0,
  };
  const results: BackfillRowResult[] = [];

  // Guard against assigning the same student to two sheets in one run: the first
  // PSW row that matches a student wins, later duplicates are reported as
  // already-matched without a second write.
  const updatedThisRun = new Set<string>();

  for (const row of classified) {
    const skip = skipKindFor(row);
    if (skip === "skipped900") {
      summary.skipped900Series++;
      continue;
    }
    if (skip === "skippedElce") {
      summary.skippedElce++;
      continue;
    }
    if (skip === "skippedLegendHeader") {
      summary.skippedLegendHeaderRows++;
      continue;
    }
    if (skip === "reviewedExcluded") {
      summary.reviewedExcluded++;
      continue;
    }

    // From here every row is a PSW data row that should map to a legacy student.
    summary.totalParsedPswRows++;

    const base = {
      sheet: row.sheet,
      rowNumber: row.rowNumber,
      rawStudentId: row.rawStudentId,
      normalizedStudentNumber: row.normalizedStudentNumber,
      legalFullName: row.legalFullName,
    };

    const effectiveNumber = row.normalizedStudentNumber;
    const usableEmail = looksLikeEmail(row.email) ? row.email : null;

    let student: LegacyStudentRow | null = null;
    let matchedBy: "student_number" | "email" | null = null;

    // Primary match: normalized student number (already corrected by the
    // reviewed decision, for example Tara's PSW125293).
    if (effectiveNumber && byNumber.has(effectiveNumber)) {
      student = byNumber.get(effectiveNumber) ?? null;
      matchedBy = "student_number";
      summary.matchedByStudentNumber++;
    } else if (usableEmail) {
      // Fallback: email, only when exactly one legacy student has that email
      // and there is no student-number conflict.
      const candidates = byEmail.get(usableEmail) ?? [];
      if (candidates.length === 1) {
        const candidate = candidates[0];
        const candidateNumber = normalizeStudentNumberForImport(
          candidate.student_number
        ).normalized;
        const conflict =
          !!effectiveNumber &&
          !!candidateNumber &&
          candidateNumber !== effectiveNumber;
        if (conflict) {
          summary.ambiguous++;
          results.push({
            ...base,
            outcome: "ambiguous",
            matchedBy: null,
            detail:
              "Email matches a legacy student whose student number differs - skipped to avoid a wrong match",
            studentId: null,
          });
          continue;
        }
        student = candidate;
        matchedBy = "email";
        summary.matchedByEmail++;
      } else if (candidates.length > 1) {
        summary.ambiguous++;
        results.push({
          ...base,
          outcome: "ambiguous",
          matchedBy: null,
          detail: `Email matches ${candidates.length} legacy students - skipped`,
          studentId: null,
        });
        continue;
      }
    }

    if (!student) {
      summary.unmatched++;
      results.push({
        ...base,
        outcome: "unmatched",
        matchedBy: null,
        detail: effectiveNumber
          ? "No legacy student matched this student number or email"
          : "Row has no usable student number or email to match",
        studentId: null,
      });
      continue;
    }

    // Already backfilled (either in a previous run or earlier in this run). The
    // first source row a student matched wins; we never overwrite it.
    if (
      student.legacy_source_sheet != null ||
      updatedThisRun.has(student.id)
    ) {
      summary.alreadyHadMetadata++;
      results.push({
        ...base,
        outcome: "already_had_metadata",
        matchedBy,
        detail: "Legacy student already has source metadata - kept as is",
        studentId: student.id,
      });
      continue;
    }

    const { error: updateError } = await supabase
      .from("students")
      .update({
        legacy_source_sheet: row.sheet,
        legacy_source_row: row.rowNumber,
        legacy_raw_student_number: row.rawStudentId || null,
        legacy_normalized_student_number: effectiveNumber,
      })
      .eq("id", student.id)
      .eq("record_source", "legacy_import");

    if (updateError) {
      console.error(
        "Legacy source backfill update error:",
        updateError.message
      );
      summary.errors++;
      results.push({
        ...base,
        outcome: "error",
        matchedBy,
        detail: "Could not update source metadata for this student.",
        studentId: student.id,
      });
      continue;
    }

    updatedThisRun.add(student.id);
    student.legacy_source_sheet = row.sheet;
    student.legacy_source_row = row.rowNumber;
    summary.updated++;
    results.push({
      ...base,
      outcome: "updated",
      matchedBy,
      detail:
        matchedBy === "student_number"
          ? "Source metadata set (matched by student number)"
          : "Source metadata set (matched by email)",
      studentId: student.id,
    });
  }

  if (summary.updated > 0) {
    revalidatePath("/dashboard/students");
    revalidatePath(
      "/dashboard/admin-tools/academic-records/legacy-source-backfill"
    );
  }

  return {
    ok: true,
    fileName: file.name,
    summary,
    results,
  };
}
