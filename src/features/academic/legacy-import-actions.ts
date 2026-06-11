"use server";

// ACADEMIC-03: admin-only server action that parses an uploaded legacy student
// Excel file and previews how its rows compare to existing students.
//
// This is preview only. It performs NO database writes (no insert, update, or
// delete). It only reads the students table to match against parsed rows.

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { parseLegacyWorkbook } from "@/lib/legacy-import/parse-workbook";
import {
  normalizeStudentNumberForImport,
  normalizeNameForImport,
  normalizeEmailForImport,
  looksLikeEmail,
} from "@/lib/legacy-import/normalize";
import type {
  LegacyImportPreviewState,
  PreviewRow,
  PreviewStatus,
} from "@/lib/legacy-import/types";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

interface ExistingStudent {
  id: string;
  student_number: string | null;
  email: string | null;
  legal_full_name: string | null;
}

export async function previewLegacyImport(
  _prev: LegacyImportPreviewState,
  formData: FormData
): Promise<LegacyImportPreviewState> {
  // Authorization is enforced inside the action itself, not only on the page,
  // because server actions are reachable by direct POST.
  const profile = await getUserProfile();
  if (!profile) {
    return { ok: false, error: "You must be logged in." };
  }
  if (!isAdminOrSuper(profile.role)) {
    return {
      ok: false,
      error: "Legacy student import is available to admin and super admin only.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Select an Excel (.xlsx) file to preview." };
  }
  if (!/\.xlsx$/i.test(file.name)) {
    return { ok: false, error: "Only .xlsx files are supported." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: "The file is too large. Maximum size is 15 MB." };
  }

  let parsed;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    parsed = await parseLegacyWorkbook(buffer);
  } catch (err) {
    console.error("Legacy import parse error:", err);
    return {
      ok: false,
      error: "Could not read the Excel file. Confirm it is a valid .xlsx file.",
    };
  }

  // Read existing students for matching. Read only, no writes.
  const supabase = await createClient();
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, student_number, email, legal_full_name");

  if (studentsError) {
    console.error("Legacy import student read error:", studentsError.message);
    return { ok: false, error: "Could not load existing students for matching." };
  }

  const existing = (students ?? []) as ExistingStudent[];

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

  for (const row of parsed.rows) {
    let warnings = [...row.warnings];
    let status: PreviewStatus;
    let matched: ExistingStudent | null = null;

    const hasNumber = !!row.normalizedStudentNumber;
    const hasUsableEmail = looksLikeEmail(row.normalizedEmail);
    const hasName = !!row.normalizedName;

    // A row with neither a usable student number nor a usable email cannot be
    // matched or imported. Classify it as a non-student skip (legend, summary,
    // repeated header, blank) or as invalid when it carries a stray name.
    if (!hasNumber && !hasUsableEmail) {
      if (row.looksLikeLegend || !hasName) {
        status = "skipped_row";
        warnings = [
          row.looksLikeLegend
            ? "Legend or summary row"
            : "Blank or non-student row",
        ];
      } else {
        status = "invalid_row";
        warnings = ["No student number or email - cannot match or import"];
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
        status,
        warnings,
        matchedStudentId: null,
        matchedStudentName: null,
        matchedStudentNumber: null,
      });
      continue;
    }

    if (!hasNumber) {
      warnings.push("Missing student number");
    }

    {
      // Match priority: student number, then email, then name.
      if (
        row.normalizedStudentNumber &&
        byStudentNumber.has(row.normalizedStudentNumber)
      ) {
        matched = byStudentNumber.get(row.normalizedStudentNumber) ?? null;
        status = "matched_student_number";
      } else if (hasUsableEmail && byEmail.has(row.normalizedEmail!)) {
        matched = byEmail.get(row.normalizedEmail!) ?? null;
        status = "matched_email";
      } else if (row.normalizedName && byName.has(row.normalizedName)) {
        const candidates = byName.get(row.normalizedName) ?? [];
        matched = candidates[0] ?? null;
        status = "possible_name_batch_match";
        if (candidates.length > 1) {
          warnings.push(
            `Name matches ${candidates.length} existing students`
          );
        } else {
          warnings.push("Possible match by name only - verify before import");
        }
      } else {
        status = "new_candidate";
      }

      // When matched, flag differing name/email so reviewers can investigate.
      if (matched) {
        if (status === "matched_student_number") {
          const dbName = normalizeNameForImport(matched.legal_full_name);
          if (row.normalizedName && dbName && row.normalizedName !== dbName) {
            warnings.push(
              `Matched by student number but name differs from database (DB: ${
                matched.legal_full_name ?? "unknown"
              })`
            );
          }
          const dbEmail = normalizeEmailForImport(matched.email);
          if (
            row.normalizedEmail &&
            dbEmail &&
            row.normalizedEmail !== dbEmail
          ) {
            warnings.push("Matched by student number but email differs from database");
          }
        }
      }
    }

    // Duplicate-within-workbook detection. This overrides the status so the row
    // is clearly surfaced, while keeping any matched-student context.
    let duplicate = false;
    if (row.normalizedStudentNumber) {
      const prior = seenNumbers.get(row.normalizedStudentNumber);
      if (prior) {
        duplicate = true;
        warnings.push(`Duplicate student number in workbook (first seen ${prior})`);
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
        warnings.push(`Duplicate email in workbook (first seen ${prior})`);
      } else {
        seenEmails.set(
          row.normalizedEmail!,
          `${row.sheet} row ${row.rowNumber}`
        );
      }
    }
    if (duplicate) {
      status = "duplicate_in_excel";
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
      status,
      warnings,
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

  const summary = {
    sheetsScanned: parsed.sheetsScanned.length,
    rowsParsed: rows.length,
    matchedExisting: rows.filter((r) => matchedStatuses.includes(r.status))
      .length,
    newCandidates: rows.filter((r) => r.status === "new_candidate").length,
    possibleDuplicates: rows.filter(
      (r) =>
        r.status === "duplicate_in_excel" ||
        (r.warnings.length > 0 &&
          r.status !== "skipped_row" &&
          r.status !== "invalid_row")
    ).length,
    invalidRows: rows.filter((r) => r.status === "invalid_row").length,
    skippedRows: rows.filter((r) => r.status === "skipped_row").length,
  };

  return {
    ok: true,
    fileName: file.name,
    summary,
    sheetsScanned: parsed.sheetsScanned,
    sheetsSkipped: parsed.sheetsSkipped,
    rows,
  };
}
