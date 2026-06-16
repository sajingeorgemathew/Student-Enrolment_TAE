"use server";

// ACADEMIC-05B: admin-only server logic that links imported legacy PSW students
// to the PSW program and their correct historical PSW batch by creating a single
// minimal "application" row per student.
//
// What it does:
//   - finds legacy students (record_source = 'legacy_import'),
//   - maps each student's legacy_source_sheet to a historical PSW batch,
//   - inserts a minimal application (student_id, PSW program_id, batch_id) that
//     is flagged is_legacy = true and record_source = 'legacy_import' with status
//     'archived', so it never enters the active enrolment workflow.
//
// What it never does: it does not create students, delete students, or create
// fees, checklists, contracts, documents, or receipts. It is safe to run more
// than once - a student already linked to the same program/batch is skipped.
//
// Application status choice: the applications status check constraint only allows
// the active workflow statuses (new_intake .. signed, archived). There is no
// dedicated "historical" status. 'archived' is the safest existing value because
// it is the terminal, non-active status: the active work queues already exclude
// it (and is_legacy applications), the receipt picker treats a non-archived
// application as the active one, and the archive count helpers ignore archived
// applications. So a legacy linkage row stays out of every active surface.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import {
  resolveHistoricalBatchForSourceSheet,
  type BatchLike,
} from "@/lib/legacy-import/batch-mapping";

// The minimal, safe status used for every legacy linkage application.
const LEGACY_APPLICATION_STATUS = "archived";
const LEGACY_APPLICATION_NOTE =
  "Legacy historical application created from legacy import";

interface LegacyStudentRow {
  id: string;
  legal_full_name: string | null;
  student_number: string | null;
  legacy_source_sheet: string | null;
}

interface ExistingApplicationRow {
  student_id: string;
  program_id: string | null;
  batch_id: string | null;
}

// Per-student classification used by both the status page and the link action.
type LinkageCategory =
  | "already_linked"
  | "eligible"
  | "missing_source_metadata"
  | "missing_batch_mapping";

interface ClassifiedStudent {
  student: LegacyStudentRow;
  category: LinkageCategory;
  batchId: string | null;
  reason: string | null;
}

export interface LegacyLinkageCounts {
  totalLegacy: number;
  withSourceMetadata: number;
  alreadyLinked: number;
  unlinked: number;
  missingSourceMetadata: number;
  missingBatchMapping: number;
  eligibleForLinkage: number;
}

export interface LegacyLinkageStatus {
  ok: boolean;
  error?: string;
  pswProgramMissing?: boolean;
  counts?: LegacyLinkageCounts;
}

export interface LinkRowResult {
  studentId: string;
  legalFullName: string;
  sourceSheet: string | null;
  outcome: "linked" | "already_linked" | "skipped" | "error";
  detail: string;
}

export interface LinkSummary {
  considered: number;
  linked: number;
  alreadyLinked: number;
  skippedMissingSource: number;
  skippedNoBatch: number;
  errors: number;
}

export interface LegacyLinkageActionState {
  ok: boolean;
  error?: string;
  summary?: LinkSummary;
  results?: LinkRowResult[];
}

// Loads the PSW program, its batches, the legacy students, and their existing
// applications, then classifies each legacy student. Shared by the page (for the
// counts) and the link action (to decide who to insert).
async function loadAndClassify(): Promise<
  | { ok: true; pswProgramId: string; classified: ClassifiedStudent[] }
  | { ok: false; pswProgramMissing?: boolean; error: string }
> {
  const supabase = await createClient();

  const { data: program, error: programError } = await supabase
    .from("programs")
    .select("id")
    .eq("program_code", "PSW")
    .maybeSingle();

  if (programError) {
    return { ok: false, error: "Could not load the PSW program." };
  }
  if (!program) {
    return {
      ok: false,
      pswProgramMissing: true,
      error: "The PSW program (program_code = PSW) was not found.",
    };
  }
  const pswProgramId = program.id as string;

  const { data: batchData, error: batchError } = await supabase
    .from("batches")
    .select("id, batch_name, batch_code")
    .eq("program_id", pswProgramId);

  if (batchError) {
    return { ok: false, error: "Could not load PSW batches." };
  }
  const batches = (batchData ?? []) as BatchLike[];

  const { data: studentData, error: studentError } = await supabase
    .from("students")
    .select("id, legal_full_name, student_number, legacy_source_sheet")
    .eq("record_source", "legacy_import");

  if (studentError) {
    return { ok: false, error: "Could not load legacy students." };
  }
  const students = (studentData ?? []) as LegacyStudentRow[];

  // Existing applications for these students, used to detect duplicates by
  // student/program/batch. Restricted to the legacy students we loaded.
  const studentIds = students.map((s) => s.id);
  let existing: ExistingApplicationRow[] = [];
  if (studentIds.length > 0) {
    const { data: appData, error: appError } = await supabase
      .from("applications")
      .select("student_id, program_id, batch_id")
      .in("student_id", studentIds);
    if (appError) {
      return { ok: false, error: "Could not load existing applications." };
    }
    existing = (appData ?? []) as ExistingApplicationRow[];
  }

  const linkKey = (
    studentId: string,
    programId: string | null,
    batchId: string | null
  ) => `${studentId}:${programId ?? ""}:${batchId ?? ""}`;
  const existingKeys = new Set(
    existing.map((a) => linkKey(a.student_id, a.program_id, a.batch_id))
  );

  const classified: ClassifiedStudent[] = students.map((student) => {
    if (!student.legacy_source_sheet) {
      return {
        student,
        category: "missing_source_metadata",
        batchId: null,
        reason: "No source sheet recorded",
      };
    }

    const match = resolveHistoricalBatchForSourceSheet(
      student.legacy_source_sheet,
      batches
    );
    if (match.status !== "matched") {
      return {
        student,
        category: "missing_batch_mapping",
        batchId: null,
        reason: match.reason,
      };
    }

    if (existingKeys.has(linkKey(student.id, pswProgramId, match.batchId))) {
      return {
        student,
        category: "already_linked",
        batchId: match.batchId,
        reason: "Already linked to this PSW program and batch",
      };
    }

    return {
      student,
      category: "eligible",
      batchId: match.batchId,
      reason: null,
    };
  });

  return { ok: true, pswProgramId, classified };
}

function countCategories(classified: ClassifiedStudent[]): LegacyLinkageCounts {
  const total = classified.length;
  let alreadyLinked = 0;
  let eligible = 0;
  let missingSourceMetadata = 0;
  let missingBatchMapping = 0;

  for (const c of classified) {
    switch (c.category) {
      case "already_linked":
        alreadyLinked++;
        break;
      case "eligible":
        eligible++;
        break;
      case "missing_source_metadata":
        missingSourceMetadata++;
        break;
      case "missing_batch_mapping":
        missingBatchMapping++;
        break;
    }
  }

  return {
    totalLegacy: total,
    withSourceMetadata: total - missingSourceMetadata,
    alreadyLinked,
    unlinked: total - alreadyLinked,
    missingSourceMetadata,
    missingBatchMapping,
    eligibleForLinkage: eligible,
  };
}

// Read-only status for the linkage page. Available to admin/super_admin only.
export async function getLegacyLinkageStatus(): Promise<LegacyLinkageStatus> {
  const profile = await getUserProfile();
  if (!profile || !isAdminOrSuper(profile.role)) {
    return { ok: false, error: "Not authorized." };
  }

  const loaded = await loadAndClassify();
  if (!loaded.ok) {
    return {
      ok: false,
      error: loaded.error,
      pswProgramMissing: loaded.pswProgramMissing,
    };
  }

  return { ok: true, counts: countCategories(loaded.classified) };
}

// Admin-only server action: link every eligible unlinked legacy PSW student by
// inserting one minimal application row. Safe to run repeatedly - already-linked
// students are skipped, never duplicated.
export async function linkLegacyStudents(): Promise<LegacyLinkageActionState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { ok: false, error: "You must be logged in." };
  }
  if (!isAdminOrSuper(profile.role)) {
    return {
      ok: false,
      error: "Legacy linkage is available to admin and super admin only.",
    };
  }

  const loaded = await loadAndClassify();
  if (!loaded.ok) {
    return { ok: false, error: loaded.error };
  }

  const supabase = await createClient();
  const { pswProgramId, classified } = loaded;

  const summary: LinkSummary = {
    considered: classified.length,
    linked: 0,
    alreadyLinked: 0,
    skippedMissingSource: 0,
    skippedNoBatch: 0,
    errors: 0,
  };
  const results: LinkRowResult[] = [];

  for (const c of classified) {
    const base = {
      studentId: c.student.id,
      legalFullName: c.student.legal_full_name ?? "",
      sourceSheet: c.student.legacy_source_sheet,
    };

    if (c.category === "already_linked") {
      summary.alreadyLinked++;
      results.push({
        ...base,
        outcome: "already_linked",
        detail: "Already linked to this PSW program and batch - skipped",
      });
      continue;
    }
    if (c.category === "missing_source_metadata") {
      summary.skippedMissingSource++;
      results.push({
        ...base,
        outcome: "skipped",
        detail: "No source sheet recorded - run the source backfill first",
      });
      continue;
    }
    if (c.category === "missing_batch_mapping") {
      summary.skippedNoBatch++;
      results.push({
        ...base,
        outcome: "skipped",
        detail: c.reason ?? "No matching PSW batch",
      });
      continue;
    }

    // Eligible: insert the minimal linkage application. The insert is guarded by
    // a final existence check so a concurrent or repeated run cannot duplicate.
    const { data: dupe } = await supabase
      .from("applications")
      .select("id")
      .eq("student_id", c.student.id)
      .eq("program_id", pswProgramId)
      .eq("batch_id", c.batchId as string)
      .limit(1)
      .maybeSingle();

    if (dupe) {
      summary.alreadyLinked++;
      results.push({
        ...base,
        outcome: "already_linked",
        detail: "Already linked to this PSW program and batch - skipped",
      });
      continue;
    }

    const { error: insertError } = await supabase.from("applications").insert({
      student_id: c.student.id,
      program_id: pswProgramId,
      batch_id: c.batchId,
      status: LEGACY_APPLICATION_STATUS,
      is_legacy: true,
      record_source: "legacy_import",
      admin_notes: LEGACY_APPLICATION_NOTE,
      created_by: profile.id,
    });

    if (insertError) {
      console.error("Legacy linkage insert error:", insertError.message);
      summary.errors++;
      results.push({
        ...base,
        outcome: "error",
        detail: "Could not create the linkage application for this student.",
      });
      continue;
    }

    summary.linked++;
    results.push({
      ...base,
      outcome: "linked",
      detail: "Linked to PSW program and historical batch",
    });
  }

  if (summary.linked > 0) {
    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/admin-tools/academic-records/legacy-linkage");
  }

  return { ok: true, summary, results };
}
