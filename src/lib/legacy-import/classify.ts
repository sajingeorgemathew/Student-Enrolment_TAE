// ACADEMIC-03-FIX: pure classification logic for the legacy student import
// preview. Takes parsed workbook rows plus a snapshot of existing students and
// produces fully classified preview rows and summary counts. No database
// access and no writes happen here, which also makes the matching rules easy
// to exercise outside the server action.

import {
  normalizeStudentNumberForImport,
  normalizeNameForImport,
  normalizeEmailForImport,
  looksLikeEmail,
} from "./normalize";
import type {
  ParsedLegacyRow,
  PreviewRow,
  PreviewStatus,
  PreviewSummary,
  RowWarning,
  WarningLevel,
} from "./types";

export interface ExistingStudent {
  id: string;
  student_number: string | null;
  email: string | null;
  legal_full_name: string | null;
}

const LEVEL_ORDER: Record<WarningLevel, number> = {
  none: 0,
  info: 1,
  review: 2,
  blocking: 3,
};

// The row's overall warning level is the highest severity among its warnings.
function highestLevel(warnings: RowWarning[]): WarningLevel {
  let max: WarningLevel = "none";
  for (const w of warnings) {
    if (LEVEL_ORDER[w.level] > LEVEL_ORDER[max]) max = w.level;
  }
  return max;
}

function firstMessageAtLevel(
  warnings: RowWarning[],
  level: WarningLevel
): string | null {
  return warnings.find((w) => w.level === level)?.message ?? null;
}

export function classifyLegacyRows(
  parsedRows: ParsedLegacyRow[],
  existing: ExistingStudent[],
  sheetsScannedCount: number
): { rows: PreviewRow[]; summary: PreviewSummary } {
  const byStudentNumber = new Map<string, ExistingStudent>();
  const byEmail = new Map<string, ExistingStudent>();
  const byName = new Map<string, ExistingStudent[]>();

  for (const student of existing) {
    const normNumber = normalizeStudentNumberForImport(
      student.student_number
    ).normalized;
    if (normNumber && !byStudentNumber.has(normNumber)) {
      byStudentNumber.set(normNumber, student);
    }
    const normEmail = normalizeEmailForImport(student.email);
    if (normEmail && !byEmail.has(normEmail)) {
      byEmail.set(normEmail, student);
    }
    const normName = normalizeNameForImport(student.legal_full_name);
    if (normName) {
      const list = byName.get(normName) ?? [];
      list.push(student);
      byName.set(normName, list);
    }
  }

  // Track the first occurrence within the workbook to flag in-file duplicates.
  const seenNumbers = new Map<string, string>(); // normNumber -> "Sheet row N"
  const seenEmails = new Map<string, string>();

  const rows: PreviewRow[] = [];

  for (const row of parsedRows) {
    const warnings: RowWarning[] = [...row.warnings];
    let matchStatus: PreviewStatus;
    let matched: ExistingStudent | null = null;
    let skipReason: string | null = null;
    let matchReason: string | null = null;

    const hasNumber = !!row.normalizedStudentNumber;
    const hasUsableEmail = looksLikeEmail(row.normalizedEmail);
    const hasName = !!row.normalizedName;

    // Non-student rows: nothing usable to match on and either flagged as
    // legend/summary text or carrying no name at all. These are skipped, not
    // warned - they are part of the workbook layout, not dirty data.
    if (!hasNumber && !hasUsableEmail && (row.looksLikeLegend || !hasName)) {
      skipReason = row.looksLikeLegend
        ? "Skipped legend or summary row"
        : "Skipped blank row";
      rows.push({
        sheet: row.sheet,
        rowNumber: row.rowNumber,
        rawStudentId: row.rawStudentId,
        normalizedStudentNumber: row.normalizedStudentNumber,
        legalFullName: row.legalFullName,
        email: null,
        phone: row.phone,
        proposedBatch: row.sheet,
        matchStatus: "skipped_row",
        warningLevel: "none",
        warningTypes: [
          row.looksLikeLegend ? "legend_or_summary_row" : "blank_row",
        ],
        warningMessages: [],
        reason: skipReason,
        skipReason,
        matchReason: null,
        matchedStudentId: null,
        matchedStudentName: null,
        matchedStudentNumber: null,
      });
      continue;
    }

    // ACADEMIC-03-RULES: 900 Series rows are re-enrolled/reappearing
    // students. They are skipped, never counted as clean new candidates, and
    // the original student/batch record is kept. The normalized number is
    // still looked up so the admin can see which existing record to keep.
    if (row.is900Series) {
      const matched900 = row.normalizedStudentNumber
        ? byStudentNumber.get(row.normalizedStudentNumber) ?? null
        : null;
      const reason =
        "900 Series re-enrolment row - original batch record should be kept";
      rows.push({
        sheet: row.sheet,
        rowNumber: row.rowNumber,
        rawStudentId: row.rawStudentId,
        normalizedStudentNumber: row.normalizedStudentNumber,
        legalFullName: row.legalFullName,
        email: looksLikeEmail(row.normalizedEmail) ? row.normalizedEmail : null,
        phone: row.phone,
        proposedBatch: row.sheet,
        matchStatus: "skipped_reenrolment_duplicate",
        warningLevel: highestLevel(warnings),
        warningTypes: warnings.map((w) => w.type),
        warningMessages: warnings.map((w) => w.message),
        reason,
        skipReason: reason,
        matchReason: matched900
          ? "Existing student found by student number - original record kept"
          : null,
        matchedStudentId: matched900?.id ?? null,
        matchedStudentName: matched900?.legal_full_name ?? null,
        matchedStudentNumber: matched900?.student_number ?? null,
      });
      continue;
    }

    // ACADEMIC-03-RULES: ELCE rows belong to a separate program. They are
    // never mixed into PSW monthly batches or counted as PSW candidates.
    // Their ids are already ELCE-normalized by the parser, so an existing
    // ELCE student can still be linked for reference.
    if (row.isElce) {
      let matchedElce: ExistingStudent | null = null;
      let elceMatchReason: string | null = null;
      if (
        row.normalizedStudentNumber &&
        byStudentNumber.has(row.normalizedStudentNumber)
      ) {
        matchedElce = byStudentNumber.get(row.normalizedStudentNumber) ?? null;
        elceMatchReason = "Matched existing student by student number";
      } else if (
        looksLikeEmail(row.normalizedEmail) &&
        byEmail.has(row.normalizedEmail!)
      ) {
        matchedElce = byEmail.get(row.normalizedEmail!) ?? null;
        elceMatchReason = "Matched existing student by email";
      }
      rows.push({
        sheet: row.sheet,
        rowNumber: row.rowNumber,
        rawStudentId: row.rawStudentId,
        normalizedStudentNumber: row.normalizedStudentNumber,
        legalFullName: row.legalFullName,
        email: looksLikeEmail(row.normalizedEmail) ? row.normalizedEmail : null,
        phone: row.phone,
        proposedBatch: row.sheet,
        matchStatus: "separate_program_review",
        warningLevel: highestLevel(warnings),
        warningTypes: warnings.map((w) => w.type),
        warningMessages: warnings.map((w) => w.message),
        reason: "ELCE row - separate program import required",
        skipReason: null,
        matchReason: elceMatchReason,
        matchedStudentId: matchedElce?.id ?? null,
        matchedStudentName: matchedElce?.legal_full_name ?? null,
        matchedStudentNumber: matchedElce?.student_number ?? null,
      });
      continue;
    }

    // Blocking identity problems. A row that cannot be matched or safely
    // imported is invalid, with a blocking warning explaining exactly why.
    if (!hasNumber && !hasUsableEmail) {
      // Has a name but no student number and no usable email.
      matchStatus = "invalid_row";
      warnings.push({
        type: "missing_student_number",
        level: "blocking",
        message: "No student number or email - cannot match or import",
      });
    } else if (!hasNumber && !hasName) {
      // Has a usable email but neither a student number nor a name.
      matchStatus = "invalid_row";
      warnings.push({
        type: "missing_name",
        level: "blocking",
        message: "Missing student number and name",
      });
    } else {
      // Matchable row. Flag missing optional fields first - these never block.
      // When a raw id exists but could not be read, the parser already added
      // an invalid_student_number warning, so only flag truly empty ids here.
      if (!hasNumber && !row.rawStudentId) {
        warnings.push({
          type: "missing_student_number",
          level: "review",
          message: "Missing student number - can only match by email or name",
        });
      }
      if (!hasName) {
        warnings.push({
          type: "missing_name",
          level: "review",
          message: "Missing student name - verify before import",
        });
      }
      if (!row.rawEmail) {
        warnings.push({
          type: "missing_email",
          level: "info",
          message: "Missing email, import still allowed",
        });
      }
      if (!row.phone) {
        warnings.push({
          type: "missing_phone",
          level: "info",
          message: "Missing phone, import still allowed",
        });
      }

      // Match priority: student number, then email, then name.
      if (
        row.normalizedStudentNumber &&
        byStudentNumber.has(row.normalizedStudentNumber)
      ) {
        matched = byStudentNumber.get(row.normalizedStudentNumber) ?? null;
        matchStatus = "matched_student_number";
        matchReason = "Matched existing student by student number";
      } else if (hasUsableEmail && byEmail.has(row.normalizedEmail!)) {
        matched = byEmail.get(row.normalizedEmail!) ?? null;
        matchStatus = "matched_email";
        matchReason = "Matched existing student by email";
      } else if (row.normalizedName && byName.has(row.normalizedName)) {
        const candidates = byName.get(row.normalizedName) ?? [];
        matched = candidates[0] ?? null;
        matchStatus = "possible_name_batch_match";
        if (candidates.length > 1) {
          matchReason = `Name matches ${candidates.length} existing students - verify before import`;
          warnings.push({
            type: "name_matches_multiple_students",
            level: "review",
            message: matchReason,
          });
        } else {
          matchReason = "Possible match by name only - verify before import";
          warnings.push({
            type: "name_only_match",
            level: "review",
            message: matchReason,
          });
        }
      } else {
        matchStatus = "new_candidate";
      }

      // When matched by student number, flag differing name/email so the
      // reviewer can investigate before any future import.
      if (matched && matchStatus === "matched_student_number") {
        const dbName = normalizeNameForImport(matched.legal_full_name);
        if (row.normalizedName && dbName && row.normalizedName !== dbName) {
          warnings.push({
            type: "name_mismatch_existing_student",
            level: "review",
            message: `Matched by student number but name differs from database (DB: ${
              matched.legal_full_name ?? "unknown"
            })`,
          });
        }
        const dbEmail = normalizeEmailForImport(matched.email);
        if (
          row.normalizedEmail &&
          dbEmail &&
          row.normalizedEmail !== dbEmail
        ) {
          warnings.push({
            type: "email_mismatch_existing_student",
            level: "review",
            message:
              "Matched by student number but email differs from database",
          });
        }
      }

      // Duplicate-within-workbook detection. This overrides the status so the
      // row is clearly surfaced, while keeping any matched-student context.
      let duplicate = false;
      if (row.normalizedStudentNumber) {
        const prior = seenNumbers.get(row.normalizedStudentNumber);
        if (prior) {
          duplicate = true;
          warnings.push({
            type: "duplicate_student_number_in_excel",
            level: "review",
            message: `Same student number appears more than once in this workbook (first seen ${prior})`,
          });
        } else {
          seenNumbers.set(
            row.normalizedStudentNumber,
            `${row.sheet} row ${row.rowNumber}`
          );
        }
      }
      if (hasUsableEmail) {
        const prior = seenEmails.get(row.normalizedEmail!);
        if (prior) {
          duplicate = true;
          warnings.push({
            type: "duplicate_email_in_excel",
            level: "review",
            message: `Same email appears more than once in this workbook (first seen ${prior})`,
          });
        } else {
          seenEmails.set(
            row.normalizedEmail!,
            `${row.sheet} row ${row.rowNumber}`
          );
        }
      }
      if (duplicate) {
        matchStatus = "duplicate_in_excel";
      }
    }

    const warningLevel = highestLevel(warnings);

    // One human-readable line for the Reason column. Priority: blocking
    // problem, in-file duplicate, match explanation, then the most serious
    // remaining warning. A new candidate with at most info-level notes is a
    // clean new candidate.
    let reason: string;
    if (matchStatus === "invalid_row") {
      reason = firstMessageAtLevel(warnings, "blocking") ?? "Invalid row";
    } else if (matchStatus === "duplicate_in_excel") {
      reason =
        warnings.find(
          (w) =>
            w.type === "duplicate_student_number_in_excel" ||
            w.type === "duplicate_email_in_excel"
        )?.message ?? "Duplicate row in workbook";
    } else if (matchReason) {
      reason = matchReason;
    } else if (warningLevel === "review") {
      reason = firstMessageAtLevel(warnings, "review") ?? "Needs review";
    } else {
      reason = "Clean new candidate";
    }

    rows.push({
      sheet: row.sheet,
      rowNumber: row.rowNumber,
      rawStudentId: row.rawStudentId,
      normalizedStudentNumber: row.normalizedStudentNumber,
      legalFullName: row.legalFullName,
      email: hasUsableEmail ? row.normalizedEmail : null,
      phone: row.phone,
      proposedBatch: row.sheet,
      matchStatus,
      warningLevel,
      warningTypes: warnings.map((w) => w.type),
      warningMessages: warnings.map((w) => w.message),
      reason,
      skipReason: null,
      matchReason,
      matchedStudentId: matched?.id ?? null,
      matchedStudentName: matched?.legal_full_name ?? null,
      matchedStudentNumber: matched?.student_number ?? null,
    });
  }

  const matchedStatuses: PreviewStatus[] = [
    "matched_student_number",
    "matched_email",
    "possible_name_batch_match",
  ];

  const summary: PreviewSummary = {
    sheetsScanned: sheetsScannedCount,
    rowsParsed: rows.length,
    cleanNewCandidates: rows.filter(
      (r) =>
        r.matchStatus === "new_candidate" &&
        (r.warningLevel === "none" || r.warningLevel === "info")
    ).length,
    matchedExisting: rows.filter((r) => matchedStatuses.includes(r.matchStatus))
      .length,
    // 900 Series and ELCE rows carry review-level warnings but have their own
    // counts below, so they are excluded here to avoid double counting.
    reviewNeeded: rows.filter(
      (r) =>
        r.warningLevel === "review" &&
        r.matchStatus !== "skipped_reenrolment_duplicate" &&
        r.matchStatus !== "separate_program_review"
    ).length,
    blockingIssues: rows.filter(
      (r) => r.warningLevel === "blocking" || r.matchStatus === "invalid_row"
    ).length,
    skippedRows: rows.filter((r) => r.matchStatus === "skipped_row").length,
    series900Skipped: rows.filter(
      (r) => r.matchStatus === "skipped_reenrolment_duplicate"
    ).length,
    elceSeparateProgram: rows.filter(
      (r) => r.matchStatus === "separate_program_review"
    ).length,
  };

  return { rows, summary };
}
