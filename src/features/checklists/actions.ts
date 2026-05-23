"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
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
      student_id,
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

export async function saveAdmissionChecklist(
  _prev: ChecklistFormState,
  formData: FormData
): Promise<ChecklistFormState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }
  if (!isAdminOrSuper(profile.role)) {
    return { success: false, error: "Only admins can update checklists." };
  }

  const applicationId = formData.get("application_id") as string;
  if (!applicationId) {
    return { success: false, error: "Missing application ID." };
  }

  const supabase = await createClient();

  const { data: app } = await supabase
    .from("applications")
    .select("id, student_id")
    .eq("id", applicationId)
    .single();

  if (!app) {
    return { success: false, error: "Application not found." };
  }

  const photoIdStatus = (formData.get("photo_id_status") as string) || "not_received";
  const addressProofStatus = (formData.get("address_proof_status") as string) || "not_received";
  const academicRoute = (formData.get("academic_route") as string) || null;
  const academicStatus = (formData.get("academic_status") as string) || "not_started";
  const academicNotes = (formData.get("academic_notes") as string) || null;
  const englishRoute = (formData.get("english_route") as string) || null;
  const englishStatus = (formData.get("english_status") as string) || "not_started";
  const englishScore = (formData.get("english_score") as string) || null;
  const englishNotes = (formData.get("english_notes") as string) || null;

  const row = {
    application_id: applicationId,
    photo_id_status: photoIdStatus,
    address_proof_status: addressProofStatus,
    academic_route: academicRoute,
    academic_status: academicStatus,
    academic_notes: academicNotes,
    english_route: englishRoute,
    english_status: englishStatus,
    english_score: englishScore,
    english_notes: englishNotes,
    admin_verified_by: profile.id,
    admin_verified_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("admission_checklists").upsert(row, {
    onConflict: "application_id",
  });

  if (error) {
    console.error("Admission checklist save error:", error.message);
    return { success: false, error: "Could not save checklist." };
  }

  revalidatePath("/dashboard/checklists");
  revalidatePath(`/dashboard/checklists/${applicationId}`);
  revalidatePath("/dashboard/contracts");
  revalidatePath(`/dashboard/contracts/${applicationId}/preview`);
  if (app.student_id) {
    revalidatePath(`/dashboard/students/${app.student_id}`);
  }

  return { success: true };
}

export async function createChecklist(
  applicationId: string
): Promise<ChecklistFormState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }
  if (!isAdminOrSuper(profile.role)) {
    return { success: false, error: "Only admins can create checklists." };
  }

  const supabase = await createClient();

  const { data: app } = await supabase
    .from("applications")
    .select("id, student_id")
    .eq("id", applicationId)
    .single();

  if (!app) {
    return { success: false, error: "Application not found." };
  }

  const { error } = await supabase.from("admission_checklists").upsert(
    {
      application_id: applicationId,
      photo_id_status: "not_received",
      address_proof_status: "not_received",
      academic_status: "not_started",
      english_status: "not_started",
    },
    { onConflict: "application_id", ignoreDuplicates: true }
  );

  if (error) {
    console.error("Checklist create error:", error.message);
    return { success: false, error: "Could not create checklist." };
  }

  revalidatePath("/dashboard/checklists");
  revalidatePath(`/dashboard/checklists/${applicationId}`);
  revalidatePath("/dashboard/contracts");
  revalidatePath(`/dashboard/contracts/${applicationId}/preview`);
  if (app.student_id) {
    revalidatePath(`/dashboard/students/${app.student_id}`);
  }

  return { success: true };
}

export async function updateChecklist(
  _prev: ChecklistFormState,
  formData: FormData
): Promise<ChecklistFormState> {
  return saveAdmissionChecklist(_prev, formData);
}
