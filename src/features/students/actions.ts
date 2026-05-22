"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isSalesOrAdmin } from "@/lib/roles";
import { revalidatePath } from "next/cache";

export type StudentFormState = {
  success: boolean;
  error?: string;
};

export async function getStudents(search?: string) {
  const supabase = await createClient();

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
      programs (id, program_code, program_name, credential_name, total_hours),
      batches (id, batch_name, batch_code, start_date, expected_end_date, class_days, class_time, delivery_method, training_location)
    `
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const { data: quotes } = await supabase
    .from("quotes")
    .select("*")
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
    .select("id, contract_number, status, generated_at, signed_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const applicationIds = (applications ?? []).map((a) => a.id);

  let checklists: Array<Record<string, unknown>> = [];
  if (applicationIds.length > 0) {
    const { data: checklistData } = await supabase
      .from("admission_checklists")
      .select("*")
      .in("application_id", applicationIds);
    checklists = checklistData ?? [];
  }

  return {
    student,
    applications: applications ?? [],
    quotes: quotes ?? [],
    documents: documents ?? [],
    contracts: contracts ?? [],
    checklists,
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
