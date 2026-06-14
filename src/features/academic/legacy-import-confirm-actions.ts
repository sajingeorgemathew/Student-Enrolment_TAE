"use server";

// ACADEMIC-04: admin-only server action that creates legacy student records
// from selected, approved rows of an uploaded legacy student Excel file.
//
// This is the first ticket that writes legacy rows to the database. Safety is
// enforced server-side and never trusts the client:
//   - admin/super_admin only (re-checked here, not just on the page),
//   - the file is re-parsed and re-classified from scratch,
//   - every selected row is re-validated with isImportableRow,
//   - duplicate student numbers are re-checked against the database and within
//     the selection before each insert,
//   - rows are inserted one at a time with a per-row result so a single bad row
//     never silently aborts the rest.
//
// It creates student records only. No applications, batches, or programs are
// created (see the ticket notes - application linking is deferred to a later
// ticket). Receipts, contracts, and the student hub workflow are untouched.

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
  isImportableRow,
  isReviewedImportableRow,
  rowKey,
} from "@/lib/legacy-import/importable";
import {
  normalizeStudentNumberForImport,
  normalizeEmailForImport,
} from "@/lib/legacy-import/normalize";
import type {
  ImportRowResult,
  LegacyImportConfirmState,
  ParsedLegacyRow,
  PreviewRow,
} from "@/lib/legacy-import/types";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

function emptyState(error: string): LegacyImportConfirmState {
  return { ok: false, error, created: 0, skipped: 0, failed: 0, results: [] };
}

// Derive the required not-null name fields for public.students. PSW sheets have
// First/Middle/Last columns, but some rows only fill part of them. We fall back
// to splitting the combined legal full name so legal_first_name and
// legal_last_name are never empty. Returns null when no usable name exists.
function deriveNameParts(
  parsed: ParsedLegacyRow
): { first: string; middle: string | null; last: string } | null {
  const first = parsed.legalFirstName.replace(/_/g, " ").trim();
  const middle = parsed.legalMiddleName.replace(/_/g, " ").trim();
  const last = parsed.legalLastName.replace(/_/g, " ").trim();

  if (first && last) {
    return { first, middle: middle || null, last };
  }

  // Fall back to the combined name when the split columns are incomplete.
  const tokens = parsed.legalFullName
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (tokens.length === 0) return null;
  if (tokens.length === 1) {
    // Only one name token. Use it as the first name and a placeholder last name
    // so the not-null constraint is satisfied without inventing data.
    return { first: first || tokens[0], middle: null, last: last || "." };
  }

  return {
    first: first || tokens[0],
    middle: middle || null,
    last: last || tokens[tokens.length - 1],
  };
}

export async function confirmLegacyImport(
  _prev: LegacyImportConfirmState,
  formData: FormData
): Promise<LegacyImportConfirmState> {
  // Authorization is enforced inside the action, because server actions are
  // reachable by direct POST regardless of what the page rendered.
  const profile = await getUserProfile();
  if (!profile) {
    return emptyState("You must be logged in.");
  }
  if (!isAdminOrSuper(profile.role)) {
    return emptyState(
      "Legacy student import is available to admin and super admin only."
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return emptyState("Select an Excel (.xlsx) file before importing.");
  }
  if (!/\.xlsx$/i.test(file.name)) {
    return emptyState("Only .xlsx files are supported.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return emptyState("The file is too large. Maximum size is 15 MB.");
  }

  let selectedKeys: string[];
  try {
    const raw = formData.get("selectedKeys");
    selectedKeys = typeof raw === "string" ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return emptyState("Could not read the selected rows. Please try again.");
  }
  if (!Array.isArray(selectedKeys) || selectedKeys.length === 0) {
    return emptyState("Select at least one importable row before importing.");
  }
  const selectedSet = new Set(selectedKeys);

  // Re-parse and re-classify the uploaded file from scratch. The client's
  // classification is never trusted; only keys (sheet + row number) are.
  let parsed;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    parsed = await parseLegacyWorkbook(buffer);
  } catch (err) {
    console.error("Legacy import parse error:", err);
    return emptyState(
      "Could not read the Excel file. Confirm it is a valid .xlsx file."
    );
  }

  const supabase = await createClient();
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, student_number, email, legal_full_name");

  if (studentsError) {
    console.error("Legacy import student read error:", studentsError.message);
    return emptyState("Could not load existing students for duplicate checks.");
  }

  const existing = (students ?? []) as ExistingStudent[];

  // Fresh duplicate maps built from the current database, normalized the same
  // way as the import rows so 125315 and PSW125315 are treated as one number.
  const existingNumbers = new Set<string>();
  const existingEmails = new Set<string>();
  for (const s of existing) {
    const n = normalizeStudentNumberForImport(s.student_number).normalized;
    if (n) existingNumbers.add(n);
    const e = normalizeEmailForImport(s.email);
    if (e) existingEmails.add(e);
  }

  const { rows: classified } = classifyLegacyRows(
    parsed.rows,
    existing,
    parsed.sheetsScanned.length
  );

  // Index parsed rows (for the name/address fields) and classified rows (for
  // the importability decision) by the same stable key.
  const parsedByKey = new Map<string, ParsedLegacyRow>();
  for (const p of parsed.rows) {
    parsedByKey.set(rowKey(p.sheet, p.rowNumber), p);
  }
  const classifiedByKey = new Map<string, PreviewRow>();
  for (const c of classified) {
    classifiedByKey.set(rowKey(c.sheet, c.rowNumber), c);
  }

  // Track numbers/emails inserted during this run so two selected rows can never
  // create duplicate records, even before the database reflects the first one.
  const insertedNumbers = new Set<string>();
  const insertedEmails = new Set<string>();

  const results: ImportRowResult[] = [];
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const key of selectedSet) {
    const row = classifiedByKey.get(key);
    const parsedRow = parsedByKey.get(key);

    if (!row || !parsedRow) {
      failed++;
      results.push({
        key,
        sheet: "",
        rowNumber: 0,
        studentNumber: null,
        legalFullName: "",
        outcome: "failed",
        reason: "Row not found in the uploaded file. Re-upload and try again.",
        studentId: null,
      });
      continue;
    }

    const base = {
      key,
      sheet: row.sheet,
      rowNumber: row.rowNumber,
      studentNumber: row.normalizedStudentNumber,
      legalFullName: row.legalFullName,
    };

    // Re-validate importability server-side. This blocks matched existing
    // students, possible matches, invalid/skipped rows, in-file duplicates,
    // 900 Series, ELCE, and reviewed-excluded rows regardless of the client.
    if (!isImportableRow(row)) {
      skipped++;
      results.push({
        ...base,
        outcome: "skipped",
        reason: `Row is not importable: ${row.reason}`,
        studentId: null,
      });
      continue;
    }

    const studentNumber = row.normalizedStudentNumber!;
    const email = row.email ? normalizeEmailForImport(row.email) : null;
    const reviewed = isReviewedImportableRow(row);

    // Duplicate student number: existing database record.
    if (existingNumbers.has(studentNumber)) {
      skipped++;
      results.push({
        ...base,
        outcome: "skipped",
        reason: `Student number ${studentNumber} already exists - existing record kept`,
        studentId: null,
      });
      continue;
    }
    // Duplicate student number: another row already inserted in this run.
    if (insertedNumbers.has(studentNumber)) {
      skipped++;
      results.push({
        ...base,
        outcome: "skipped",
        reason: `Student number ${studentNumber} appears more than once in the selected rows`,
        studentId: null,
      });
      continue;
    }

    // Duplicate email is blocked unless the row was explicitly reviewed and
    // allowed (valid re-enrolments reuse an earlier email on purpose).
    if (email && !reviewed) {
      if (existingEmails.has(email)) {
        skipped++;
        results.push({
          ...base,
          outcome: "skipped",
          reason: `Email already exists for another student - review needed`,
          studentId: null,
        });
        continue;
      }
      if (insertedEmails.has(email)) {
        skipped++;
        results.push({
          ...base,
          outcome: "skipped",
          reason: `Email appears more than once in the selected rows - review needed`,
          studentId: null,
        });
        continue;
      }
    }

    const nameParts = deriveNameParts(parsedRow);
    if (!nameParts) {
      failed++;
      results.push({
        ...base,
        outcome: "failed",
        reason: "Missing student name - cannot create a record",
        studentId: null,
      });
      continue;
    }

    // Preserve the source WP/status value as a note rather than forcing it into
    // immigration_status, which expects controlled values. This keeps the
    // information without risking bad data in a structured field.
    const noteParts: string[] = [];
    if (parsedRow.statusText) {
      noteParts.push(`Legacy import status: ${parsedRow.statusText}`);
    }
    const notes = noteParts.length > 0 ? noteParts.join("\n") : null;

    // legal_full_name is a generated column in public.students, so it is never
    // inserted directly - the database computes it from the name parts.
    const { data: inserted, error: insertError } = await supabase
      .from("students")
      .insert({
        student_number: studentNumber,
        legal_first_name: nameParts.first,
        legal_middle_name: nameParts.middle,
        legal_last_name: nameParts.last,
        date_of_birth: parsedRow.dateOfBirth,
        phone: parsedRow.phone,
        email: email,
        mailing_address_line_1: parsedRow.address,
        notes,
        is_legacy: true,
        record_source: "legacy_import",
        source_file_name: file.name,
        // ACADEMIC-05: record the source sheet (for example "17th March") so the
        // legacy linkage action can later map this student to the matching PSW
        // batch. Additive and safe - it does not affect student creation.
        source_sheet_name: parsedRow.sheet,
        legacy_imported_at: new Date().toISOString(),
        legacy_imported_by: profile.id,
        created_by: profile.id,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      // A unique-violation here means a concurrent import already created the
      // number; report it as skipped rather than failed.
      const isUnique =
        insertError?.message?.includes("duplicate key") &&
        insertError.message.includes("student_number");
      if (isUnique) {
        skipped++;
        results.push({
          ...base,
          outcome: "skipped",
          reason: `Student number ${studentNumber} already exists - existing record kept`,
          studentId: null,
        });
      } else {
        console.error(
          "Legacy import insert error:",
          insertError?.message ?? "unknown"
        );
        failed++;
        results.push({
          ...base,
          outcome: "failed",
          reason: "Could not create the student record.",
          studentId: null,
        });
      }
      continue;
    }

    insertedNumbers.add(studentNumber);
    if (email) insertedEmails.add(email);
    created++;
    results.push({
      ...base,
      outcome: "created",
      reason: "Legacy student record created",
      studentId: inserted.id,
    });
  }

  if (created > 0) {
    revalidatePath("/dashboard/students");
  }

  return {
    ok: true,
    fileName: file.name,
    created,
    skipped,
    failed,
    results,
  };
}
