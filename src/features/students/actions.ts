"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isSalesOrAdmin } from "@/lib/roles";
import { revalidatePath } from "next/cache";

export type StudentFormState = {
  success: boolean;
  error?: string;
};

export async function getStudents(search?: string, batchId?: string) {
  const supabase = await createClient();

  if (batchId) {
    const { data: apps } = await supabase
      .from("applications")
      .select("student_id")
      .eq("batch_id", batchId);

    const studentIds = (apps ?? []).map((a) => a.student_id).filter(Boolean) as string[];

    if (studentIds.length === 0) return [];

    let query = supabase
      .from("students")
      .select(
        `
        id,
        student_number,
        legal_first_name,
        legal_middle_name,
        legal_last_name,
        email,
        phone,
        city,
        province,
        created_at,
        archived_at,
        archive_reason,
        applications (
          id,
          status,
          program_id,
          programs (id, program_name, program_code),
          batches (id, batch_name)
        )
      `
      )
      .in("id", studentIds)
      .order("created_at", { ascending: false });

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(
        `legal_first_name.ilike.${term},legal_last_name.ilike.${term},email.ilike.${term},phone.ilike.${term},student_number.ilike.${term}`
      );
    }

    const { data } = await query;
    return data ?? [];
  }

  let query = supabase
    .from("students")
    .select(
      `
      id,
      student_number,
      legal_first_name,
      legal_middle_name,
      legal_last_name,
      email,
      phone,
      city,
      province,
      created_at,
      archived_at,
      archive_reason,
      applications (
        id,
        status,
        program_id,
        programs (id, program_name, program_code),
        batches (id, batch_name)
      )
    `
    )
    .order("created_at", { ascending: false });

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(
      `legal_first_name.ilike.${term},legal_last_name.ilike.${term},email.ilike.${term},phone.ilike.${term},student_number.ilike.${term}`
    );
  }

  const { data } = await query;
  return data ?? [];
}

export async function getStudentById(studentId: string) {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .single();

  if (!student) return null;

  const { data: applications } = await supabase
    .from("applications")
    .select(
      `
      *,
      programs (
        id, program_code, program_name, credential_name,
        total_hours, theory_hours, practicum_hours
      ),
      batches (
        id, batch_name, batch_code, start_date, expected_end_date,
        class_days, class_time, delivery_method, training_location,
        practicum_1_location, practicum_2_location
      )
    `
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const { data: documents } = await supabase
    .from("student_documents")
    .select(
      `
      id,
      document_type,
      file_name,
      review_status,
      uploaded_by_type,
      created_at,
      application_id,
      applications (id, status, programs (id, program_code, program_name))
    `
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const { data: contracts } = await supabase
    .from("contracts")
    .select(
      "id, contract_number, status, generated_at, signed_at, application_id"
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const applicationIds = (applications ?? []).map((a) => a.id);

  let checklists: Array<Record<string, unknown>> = [];
  let salesChecklists: Array<Record<string, unknown>> = [];
  if (applicationIds.length > 0) {
    const { data: checklistData } = await supabase
      .from("admission_checklists")
      .select("*")
      .in("application_id", applicationIds);
    checklists = checklistData ?? [];

    const { data: salesChecklistData } = await supabase
      .from("sales_checklists")
      .select("*")
      .in("application_id", applicationIds);
    salesChecklists = salesChecklistData ?? [];
  }

  let feeSchedules: Array<Record<string, unknown>> = [];
  let installments: Array<Record<string, unknown>> = [];
  if (applicationIds.length > 0) {
    const { data: feeData } = await supabase
      .from("fee_schedules")
      .select("*")
      .in("application_id", applicationIds)
      .order("created_at", { ascending: false });
    feeSchedules = feeData ?? [];

    const feeIds = (feeData ?? []).map((f) => f.id);
    if (feeIds.length > 0) {
      const { data: installmentData } = await supabase
        .from("payment_installments")
        .select("*")
        .in("fee_schedule_id", feeIds)
        .order("installment_number", { ascending: true });
      installments = installmentData ?? [];
    }
  }

  const ownerIds = new Set<string>();
  for (const app of applications ?? []) {
    if (app.sales_owner) ownerIds.add(app.sales_owner);
    if (app.admin_owner) ownerIds.add(app.admin_owner);
  }
  for (const fee of feeSchedules) {
    if (fee.approved_by) ownerIds.add(fee.approved_by as string);
  }
  let ownerProfiles: Record<string, string> = {};
  if (ownerIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", Array.from(ownerIds));
    if (profiles) {
      ownerProfiles = Object.fromEntries(
        profiles.map((p) => [p.id, p.full_name || p.email || p.id])
      );
    }
  }

  const { data: contractGenerations } = await supabase
    .from("contract_generations")
    .select("id, student_id, application_id, generated_by, generated_at, file_name, storage_path, status, created_at")
    .eq("student_id", studentId)
    .order("generated_at", { ascending: false });

  const generatorIds = new Set<string>();
  for (const gen of contractGenerations ?? []) {
    if (gen.generated_by) generatorIds.add(gen.generated_by);
  }
  let generatorProfiles: Record<string, string> = {};
  if (generatorIds.size > 0) {
    const { data: genProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", Array.from(generatorIds));
    if (genProfiles) {
      generatorProfiles = Object.fromEntries(
        genProfiles.map((p) => [p.id, p.full_name || p.email || p.id])
      );
    }
  }

  const contractGenerationsWithNames = (contractGenerations ?? []).map((r) => ({
    ...r,
    generated_by_name: generatorProfiles[r.generated_by] ?? null,
  }));

  return {
    student,
    applications: applications ?? [],
    documents: documents ?? [],
    contracts: contracts ?? [],
    checklists,
    salesChecklists,
    feeSchedules,
    installments,
    ownerProfiles,
    contractGenerations: contractGenerationsWithNames,
  };
}

export async function updateStudent(
  _prev: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }
  if (!isSalesOrAdmin(profile.role)) {
    return { success: false, error: "Only admin or sales users can edit students." };
  }

  const studentId = formData.get("student_id") as string;
  if (!studentId) {
    return { success: false, error: "Missing student ID." };
  }

  const legalFirstName = (formData.get("legal_first_name") as string)?.trim();
  const legalLastName = (formData.get("legal_last_name") as string)?.trim();

  if (!legalFirstName) {
    return { success: false, error: "First name is required." };
  }
  if (!legalLastName) {
    return { success: false, error: "Last name is required." };
  }

  const updates = {
    student_number: (formData.get("student_number") as string)?.trim() || null,
    legal_first_name: legalFirstName,
    legal_middle_name: (formData.get("legal_middle_name") as string)?.trim() || null,
    legal_last_name: legalLastName,
    preferred_name: (formData.get("preferred_name") as string)?.trim() || null,
    date_of_birth: (formData.get("date_of_birth") as string) || null,
    phone: (formData.get("phone") as string)?.trim() || null,
    alternate_phone: (formData.get("alternate_phone") as string)?.trim() || null,
    email: (formData.get("email") as string)?.trim() || null,
    mailing_address_line_1: (formData.get("mailing_address_line_1") as string)?.trim() || null,
    mailing_address_line_2: (formData.get("mailing_address_line_2") as string)?.trim() || null,
    city: (formData.get("city") as string)?.trim() || null,
    province: (formData.get("province") as string)?.trim() || null,
    postal_code: (formData.get("postal_code") as string)?.trim() || null,
    country: (formData.get("country") as string)?.trim() || null,
    immigration_status: (formData.get("immigration_status") as string)?.trim() || null,
    international_student: formData.get("international_student") === ""
      ? null
      : formData.get("international_student") === "true",
    notes: (formData.get("notes") as string)?.trim() || null,
  };

  const supabase = await createClient();

  const { error } = await supabase
    .from("students")
    .update(updates)
    .eq("id", studentId);

  if (error) {
    console.error("Student update error:", error.message);
    if (error.message.includes("duplicate key") && error.message.includes("student_number")) {
      return { success: false, error: "This student number is already in use." };
    }
    return { success: false, error: "Could not update student." };
  }

  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath("/dashboard/students");

  return { success: true };
}
