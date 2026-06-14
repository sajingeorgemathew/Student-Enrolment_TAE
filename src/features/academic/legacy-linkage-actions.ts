"use server";

// ACADEMIC-05: admin-only linkage of imported legacy students to the PSW
// program and the correct PSW batch.
//
// Safety rules enforced here:
//   - admin/super_admin only (re-checked in the action, not just on the page),
//   - links the PSW program only (ELCE and 900 Series are out of scope),
//   - creates a minimal, inactive legacy application (status "archived",
//     is_legacy true) so the student hub can show program/batch context without
//     pulling the student into the active enrolment workflow,
//   - resolves the batch from the student's recorded source sheet; a missing or
//     ambiguous batch is reported as "needs batch linkage" and never guessed,
//   - never creates batches, programs, fees, checklists, contracts, receipts, or
//     documents, and never edits an existing application.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import {
  resolveBatchForSheet,
  type BatchLike,
} from "@/lib/legacy-import/batch-mapping";

export type LinkageRowState =
  | "linked_with_batch"
  | "linked_needs_batch"
  | "already_linked"
  | "needs_batch"
  | "unlinked";

export interface LegacyLinkageRow {
  studentId: string;
  studentNumber: string | null;
  legalFullName: string;
  sourceSheet: string | null;
  state: LinkageRowState;
  detail: string;
}

export interface LegacyLinkageOverview {
  pswProgramMissing: boolean;
  pswBatchCount: number;
  totalLegacy: number;
  linkedCount: number;
  unlinkedCount: number;
  needsBatchCount: number;
  rows: LegacyLinkageRow[];
}

interface LegacyStudentRow {
  id: string;
  student_number: string | null;
  legal_full_name: string | null;
  source_sheet_name: string | null;
}

async function loadPswContext() {
  const supabase = await createClient();

  const { data: program } = await supabase
    .from("programs")
    .select("id, program_code")
    .eq("program_code", "PSW")
    .maybeSingle();

  const { data: batchData } = await supabase
    .from("batches")
    .select("id, batch_name, batch_code, program_id")
    .eq("is_active", true);

  const batches = ((batchData ?? []) as Array<
    BatchLike & { program_id: string }
  >).filter((b) => !program || b.program_id === program.id);

  return { program: program ?? null, batches };
}

// Read-only snapshot of every legacy student and its current linkage state.
export async function getLegacyLinkageOverview(): Promise<LegacyLinkageOverview | null> {
  const profile = await getUserProfile();
  if (!profile || !isAdminOrSuper(profile.role)) return null;

  const supabase = await createClient();
  const { program, batches } = await loadPswContext();

  const { data: students } = await supabase
    .from("students")
    .select("id, student_number, legal_full_name, source_sheet_name")
    .eq("record_source", "legacy_import")
    .order("created_at", { ascending: true });

  const legacyStudents = (students ?? []) as LegacyStudentRow[];

  // Which legacy students already have any application (legacy or otherwise).
  const studentIds = legacyStudents.map((s) => s.id);
  const linkedSet = new Set<string>();
  if (studentIds.length > 0) {
    const { data: apps } = await supabase
      .from("applications")
      .select("student_id, program_id")
      .in("student_id", studentIds);
    for (const a of apps ?? []) {
      if (a.student_id) linkedSet.add(a.student_id as string);
    }
  }

  let linkedCount = 0;
  let unlinkedCount = 0;
  let needsBatchCount = 0;

  const rows: LegacyLinkageRow[] = legacyStudents.map((s) => {
    const name = s.legal_full_name ?? "(no name)";
    if (linkedSet.has(s.id)) {
      linkedCount++;
      return {
        studentId: s.id,
        studentNumber: s.student_number,
        legalFullName: name,
        sourceSheet: s.source_sheet_name,
        state: "already_linked",
        detail: "Already linked to a program",
      };
    }

    unlinkedCount++;
    const match = resolveBatchForSheet(s.source_sheet_name, batches);
    if (match.status === "matched") {
      return {
        studentId: s.id,
        studentNumber: s.student_number,
        legalFullName: name,
        sourceSheet: s.source_sheet_name,
        state: "unlinked",
        detail: "Ready to link to PSW program and batch",
      };
    }
    needsBatchCount++;
    return {
      studentId: s.id,
      studentNumber: s.student_number,
      legalFullName: name,
      sourceSheet: s.source_sheet_name,
      state: "needs_batch",
      detail: match.reason,
    };
  });

  return {
    pswProgramMissing: !program,
    pswBatchCount: batches.length,
    totalLegacy: legacyStudents.length,
    linkedCount,
    unlinkedCount,
    needsBatchCount,
    rows,
  };
}

export interface LegacyLinkageResultState {
  ok: boolean;
  error?: string;
  linkedWithBatch: number;
  linkedNeedsBatch: number;
  alreadyLinked: number;
  failed: number;
  results: LegacyLinkageRow[];
}

function emptyResult(error: string): LegacyLinkageResultState {
  return {
    ok: false,
    error,
    linkedWithBatch: 0,
    linkedNeedsBatch: 0,
    alreadyLinked: 0,
    failed: 0,
    results: [],
  };
}

// Link every unlinked legacy student to the PSW program. The batch is set when
// the source sheet resolves to exactly one PSW batch; otherwise the student is
// linked to the program with no batch and reported as needing batch linkage.
export async function linkLegacyStudents(
  _prev: LegacyLinkageResultState,
  _formData: FormData
): Promise<LegacyLinkageResultState> {
  // This action links every unlinked legacy student; it reads neither the prior
  // action state nor any form fields.
  void _prev;
  void _formData;

  const profile = await getUserProfile();
  if (!profile) return emptyResult("You must be logged in.");
  if (!isAdminOrSuper(profile.role)) {
    return emptyResult(
      "Legacy linkage is available to admin and super admin only."
    );
  }

  const supabase = await createClient();
  const { program, batches } = await loadPswContext();

  if (!program) {
    return emptyResult(
      "PSW program not found. The PSW program must exist before linking legacy students."
    );
  }

  const { data: students } = await supabase
    .from("students")
    .select("id, student_number, legal_full_name, source_sheet_name")
    .eq("record_source", "legacy_import")
    .order("created_at", { ascending: true });

  const legacyStudents = (students ?? []) as LegacyStudentRow[];
  const studentIds = legacyStudents.map((s) => s.id);

  const linkedSet = new Set<string>();
  if (studentIds.length > 0) {
    const { data: apps } = await supabase
      .from("applications")
      .select("student_id")
      .in("student_id", studentIds);
    for (const a of apps ?? []) {
      if (a.student_id) linkedSet.add(a.student_id as string);
    }
  }

  let linkedWithBatch = 0;
  let linkedNeedsBatch = 0;
  let alreadyLinked = 0;
  let failed = 0;
  const results: LegacyLinkageRow[] = [];

  for (const s of legacyStudents) {
    const name = s.legal_full_name ?? "(no name)";
    const base = {
      studentId: s.id,
      studentNumber: s.student_number,
      legalFullName: name,
      sourceSheet: s.source_sheet_name,
    };

    if (linkedSet.has(s.id)) {
      alreadyLinked++;
      results.push({
        ...base,
        state: "already_linked",
        detail: "Already linked - skipped",
      });
      continue;
    }

    const match = resolveBatchForSheet(s.source_sheet_name, batches);
    const batchId = match.status === "matched" ? match.batchId : null;
    const batchReason =
      match.status === "matched" ? "" : match.reason;

    // status "archived" is the safest existing application status: it keeps the
    // legacy record out of the active workflow without adding a new status. The
    // is_legacy flag additionally excludes it from the active work queues.
    const { error } = await supabase.from("applications").insert({
      student_id: s.id,
      program_id: program.id,
      batch_id: batchId,
      status: "archived",
      is_legacy: true,
      record_source: "legacy_import",
      created_by: profile.id,
    });

    if (error) {
      console.error("Legacy linkage insert error:", error.message);
      failed++;
      results.push({
        ...base,
        state: "unlinked",
        detail: "Could not create the legacy application.",
      });
      continue;
    }

    // Guard against double submit creating two applications in one run.
    linkedSet.add(s.id);

    if (batchId) {
      linkedWithBatch++;
      results.push({
        ...base,
        state: "linked_with_batch",
        detail: "Linked to PSW program and batch",
      });
    } else {
      linkedNeedsBatch++;
      results.push({
        ...base,
        state: "linked_needs_batch",
        detail: `Linked to PSW program - needs batch linkage (${batchReason})`,
      });
    }
  }

  if (linkedWithBatch > 0 || linkedNeedsBatch > 0) {
    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/admin-tools/academic-records/legacy-linkage");
  }

  return {
    ok: true,
    linkedWithBatch,
    linkedNeedsBatch,
    alreadyLinked,
    failed,
    results,
  };
}
