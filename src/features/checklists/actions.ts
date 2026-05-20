"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { revalidatePath } from "next/cache";

export type ChecklistFormState = {
  success: boolean;
  error?: string;
};

export async function getApplicationsForChecklists() {
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      created_at,
      students (id, legal_first_name, legal_last_name, email, student_number),
      programs (id, program_name, program_code),
      batches (id, batch_name),
      admission_checklists (
        id,
        photo_id_status,
        address_proof_status,
        academic_route,
        academic_status,
        english_route,
        english_status
      )
    `
    )
    .order("created_at", { ascending: false });

  return applications ?? [];
}

export async function getChecklistDetail(applicationId: string) {
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      created_at,
      students (
        id, legal_first_name, legal_middle_name, legal_last_name,
        email, phone, student_number, date_of_birth,
        immigration_status, international_student
      ),
      programs (
        id, program_code, program_name, credential_name, total_hours
      ),
      batches (
        id, batch_name, batch_code, start_date, expected_end_date,
        delivery_method
      )
    `
    )
    .eq("id", applicationId)
    .single();

  if (!application) return null;

  const { data: checklist } = await supabase
    .from("admission_checklists")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  const studentId = (
    application.students as unknown as { id: string } | null
  )?.id;

  let documents: Array<{
    id: string;
    document_type: string | null;
    file_name: string | null;
    review_status: string | null;
    created_at: string;
  }> = [];

  if (studentId) {
    const { data: docs } = await supabase
      .from("student_documents")
      .select("id, document_type, file_name, review_status, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });
    documents = docs ?? [];
  }

  return {
    application,
    checklist,
    documents,
  };
}

export async function createChecklist(
  applicationId: string
): Promise<ChecklistFormState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }
  if (profile.role !== "admin") {
    return { success: false, error: "Only admins can create checklists." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("admission_checklists")
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Checklist already exists." };
  }

  const { error } = await supabase.from("admission_checklists").insert({
    application_id: applicationId,
    photo_id_status: "not_received",
    address_proof_status: "not_received",
    academic_status: "not_started",
    english_status: "not_started",
  });

  if (error) {
    return { success: false, error: "Could not create checklist." };
  }

  revalidatePath("/dashboard/checklists");
  revalidatePath(`/dashboard/checklists/${applicationId}`);

  return { success: true };
}

export async function updateChecklist(
  _prev: ChecklistFormState,
  formData: FormData
): Promise<ChecklistFormState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }
  if (profile.role !== "admin") {
    return { success: false, error: "Only admins can update checklists." };
  }

  const checklistId = formData.get("checklist_id") as string;
  const applicationId = formData.get("application_id") as string;

  if (!checklistId || !applicationId) {
    return { success: false, error: "Missing checklist or application ID." };
  }

  const photoIdStatus = formData.get("photo_id_status") as string;
  const addressProofStatus = formData.get("address_proof_status") as string;
  const academicRoute = formData.get("academic_route") as string | null;
  const academicStatus = formData.get("academic_status") as string;
  const academicNotes = formData.get("academic_notes") as string;
  const englishRoute = formData.get("english_route") as string | null;
  const englishStatus = formData.get("english_status") as string;
  const englishScore = formData.get("english_score") as string;
  const englishNotes = formData.get("english_notes") as string;

  const supabase = await createClient();

  const { error } = await supabase
    .from("admission_checklists")
    .update({
      photo_id_status: photoIdStatus || "not_received",
      address_proof_status: addressProofStatus || "not_received",
      academic_route: academicRoute || null,
      academic_status: academicStatus || "not_started",
      academic_notes: academicNotes || null,
      english_route: englishRoute || null,
      english_status: englishStatus || "not_started",
      english_score: englishScore || null,
      english_notes: englishNotes || null,
      admin_verified_by: profile.id,
      admin_verified_at: new Date().toISOString(),
    })
    .eq("id", checklistId);

  if (error) {
    return { success: false, error: "Could not update checklist." };
  }

  revalidatePath("/dashboard/checklists");
  revalidatePath(`/dashboard/checklists/${applicationId}`);

  return { success: true };
}
