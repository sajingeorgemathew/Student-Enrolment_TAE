"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";

// FINANCE-06: server actions backing the new receipt form.
//
// These actions only support the new receipt flow:
// - search/select a student
// - resolve the next per-student receipt sequence for the number preview
//
// The actual record insert and PDF generation happen in the admin-only POST
// route src/app/api/finance/receipts/generate/route.ts, following the contract
// generation precedent (a route can stream the file bytes back for download,
// which a server action cannot do cleanly).

export type ReceiptStudentResult = {
  id: string;
  studentNumber: string | null;
  studentName: string;
  // Latest active application context, if it can be resolved safely.
  applicationId: string | null;
  programId: string | null;
  batchId: string | null;
  programName: string | null;
  batchName: string | null;
  applicationStatus: string | null;
};

type ApplicationRow = {
  id: string;
  status: string | null;
  created_at: string;
  program_id: string | null;
  batch_id: string | null;
  programs: { program_name: string | null } | null;
  batches: { batch_name: string | null } | null;
};

// Pick the latest active application for a student.
//
// "Latest active" rule: applications are ordered newest first. The first
// application whose status is not "archived" is used. If every application is
// archived, the newest one is used so the receipt still carries context. If the
// student has no applications, all application fields stay null and the receipt
// is created without an application link (application_id is nullable).
function pickLatestApplication(
  applications: ApplicationRow[]
): ApplicationRow | null {
  if (applications.length === 0) return null;
  const active = applications.find((a) => a.status !== "archived");
  return active ?? applications[0];
}

async function loadApplicationContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string
): Promise<ApplicationRow | null> {
  const { data } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      created_at,
      program_id,
      batch_id,
      programs (program_name),
      batches (batch_name)
    `
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return pickLatestApplication((data ?? []) as unknown as ApplicationRow[]);
}

// FINANCE-08: a selectable admin signature for the receipt form.
export type ReceiptSignatureOption = {
  id: string;
  name: string;
  isDefault: boolean;
};

export type ReceiptSignatureListResult = {
  signatures: ReceiptSignatureOption[];
  // True when the admin_signatures table is not available yet (the
  // ADMIN-SIGNATURE-01 migration has not been applied in this environment).
  tableMissing: boolean;
};

// Load active admin signatures for the receipt form. Admin/super_admin only;
// for any other role this returns an empty list so the form never offers a
// signature. The default active signature (if any) is ordered first so the form
// can preselect it.
export async function getActiveReceiptSignatures(): Promise<ReceiptSignatureListResult> {
  const profile = await getUserProfile();
  if (!profile || !isAdminOrSuper(profile.role)) {
    return { signatures: [], tableMissing: false };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("admin_signatures")
    .select("id, name, is_default")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    const tableMissing =
      error.code === "42P01" || /admin_signatures/i.test(error.message ?? "");
    return { signatures: [], tableMissing };
  }

  return {
    signatures: (data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      isDefault: Boolean(s.is_default),
    })),
    tableMissing: false,
  };
}

// FINANCE-10: resolve a single student by id for the new receipt form, so the
// student hub can deep-link with ?studentId={id} and have the student
// preselected. Admin/super_admin only; any other role gets null so the form
// never preselects a student for them (and the page already blocks non-admins).
export async function getReceiptStudentById(
  studentId: string
): Promise<ReceiptStudentResult | null> {
  const profile = await getUserProfile();
  if (!profile || !isAdminOrSuper(profile.role)) {
    return null;
  }

  if (!studentId) return null;

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, student_number, legal_full_name")
    .eq("id", studentId)
    .maybeSingle();

  if (!student) return null;

  const app = await loadApplicationContext(supabase, student.id);

  return {
    id: student.id,
    studentNumber: student.student_number,
    studentName: student.legal_full_name ?? "",
    applicationId: app?.id ?? null,
    programId: app?.program_id ?? null,
    batchId: app?.batch_id ?? null,
    programName: app?.programs?.program_name ?? null,
    batchName: app?.batches?.batch_name ?? null,
    applicationStatus: app?.status ?? null,
  };
}

const MAX_RESULTS = 20;

// Search students by legal name or student number for the receipt form.
export async function searchReceiptStudents(
  query: string
): Promise<ReceiptStudentResult[]> {
  const profile = await getUserProfile();
  if (!profile || !isAdminOrSuper(profile.role)) {
    return [];
  }

  const term = query.trim();
  if (!term) return [];

  const supabase = await createClient();

  const like = `%${term}%`;
  const { data: students } = await supabase
    .from("students")
    .select("id, student_number, legal_full_name")
    .or(`legal_full_name.ilike.${like},student_number.ilike.${like}`)
    .order("legal_full_name", { ascending: true })
    .limit(MAX_RESULTS);

  if (!students || students.length === 0) return [];

  const results: ReceiptStudentResult[] = [];
  for (const student of students) {
    const app = await loadApplicationContext(supabase, student.id);
    results.push({
      id: student.id,
      studentNumber: student.student_number,
      studentName: student.legal_full_name ?? "",
      applicationId: app?.id ?? null,
      programId: app?.program_id ?? null,
      batchId: app?.batch_id ?? null,
      programName: app?.programs?.program_name ?? null,
      batchName: app?.batches?.batch_name ?? null,
      applicationStatus: app?.status ?? null,
    });
  }

  return results;
}

// Resolve the next available receipt sequence for a student (max + 1).
// Used to preview the receipt number. The admin may still override the
// sequence in the form; uniqueness is enforced by the database constraints.
export async function getNextReceiptSequence(
  studentId: string
): Promise<{ nextSequence: number; tableMissing: boolean }> {
  const profile = await getUserProfile();
  if (!profile || !isAdminOrSuper(profile.role)) {
    return { nextSequence: 1, tableMissing: false };
  }

  if (!studentId) return { nextSequence: 1, tableMissing: false };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("receipt_records")
    .select("receipt_sequence")
    .eq("student_id", studentId)
    .order("receipt_sequence", { ascending: false })
    .limit(1);

  if (error) {
    const tableMissing =
      error.code === "42P01" || /receipt_records/i.test(error.message ?? "");
    return { nextSequence: 1, tableMissing };
  }

  const highest = data && data.length > 0 ? data[0].receipt_sequence : 0;
  return { nextSequence: Number(highest) + 1, tableMissing: false };
}
