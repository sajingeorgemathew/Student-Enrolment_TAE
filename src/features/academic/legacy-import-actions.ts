"use server";

// ACADEMIC-03: admin-only server action that parses an uploaded legacy student
// Excel file and previews how its rows compare to existing students.
//
// This is preview only. It performs NO database writes (no insert, update, or
// delete). It only reads the students table to match against parsed rows.
//
// ACADEMIC-03-FIX: row classification (match status, warning level, reasons)
// lives in src/lib/legacy-import/classify.ts so the rules are pure and
// testable. This action handles auth, upload validation, parsing, and the
// read-only student snapshot.

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { parseLegacyWorkbook } from "@/lib/legacy-import/parse-workbook";
import {
  classifyLegacyRows,
  type ExistingStudent,
} from "@/lib/legacy-import/classify";
import type { LegacyImportPreviewState } from "@/lib/legacy-import/types";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

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

  const { rows, summary } = classifyLegacyRows(
    parsed.rows,
    existing,
    parsed.sheetsScanned.length
  );

  return {
    ok: true,
    fileName: file.name,
    summary,
    sheetsScanned: parsed.sheetsScanned,
    sheetsSkipped: parsed.sheetsSkipped,
    rows,
  };
}
