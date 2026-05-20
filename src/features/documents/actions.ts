"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { revalidatePath } from "next/cache";

export type DocumentFormState = {
  success: boolean;
  error?: string;
};

export async function getDocuments() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("student_documents")
    .select(
      `
      id,
      document_type,
      file_name,
      review_status,
      created_at,
      uploaded_by_type,
      student_id,
      application_id,
      students (id, legal_first_name, legal_last_name, student_number),
      applications (id, status, programs (id, program_code, program_name))
    `
    )
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getDocumentDetail(documentId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("student_documents")
    .select(
      `
      id,
      student_id,
      application_id,
      document_type,
      file_name,
      storage_bucket,
      storage_path,
      uploaded_by,
      uploaded_by_type,
      review_status,
      review_notes,
      reviewed_by,
      reviewed_at,
      created_at,
      updated_at,
      students (id, legal_first_name, legal_last_name, student_number, email),
      applications (id, status, programs (id, program_code, program_name), batches (id, batch_name))
    `
    )
    .eq("id", documentId)
    .single();

  if (!data) return null;

  let uploadedByName: string | null = null;
  if (data.uploaded_by) {
    const { data: uploader } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", data.uploaded_by)
      .single();
    uploadedByName = uploader?.full_name ?? null;
  }

  let reviewedByName: string | null = null;
  if (data.reviewed_by) {
    const { data: reviewer } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", data.reviewed_by)
      .single();
    reviewedByName = reviewer?.full_name ?? null;
  }

  return { ...data, uploadedByName, reviewedByName };
}

export async function getStudentsForUpload() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("students")
    .select("id, legal_first_name, legal_last_name, student_number, email")
    .order("legal_last_name", { ascending: true });

  return data ?? [];
}

export async function getApplicationsForStudent(studentId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      programs (id, program_code, program_name),
      batches (id, batch_name)
    `
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function uploadDocument(
  _prev: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }
  if (profile.role !== "admin" && profile.role !== "sales") {
    return { success: false, error: "Only admin or sales users can upload documents." };
  }

  const studentId = formData.get("student_id") as string;
  const applicationId = (formData.get("application_id") as string) || null;
  const documentType = formData.get("document_type") as string;
  const file = formData.get("file") as File | null;

  if (!studentId) {
    return { success: false, error: "Please select a student." };
  }
  if (!documentType) {
    return { success: false, error: "Please select a document type." };
  }
  if (!file || file.size === 0) {
    return { success: false, error: "Please select a file to upload." };
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "File type not allowed. Please upload PDF, JPG, PNG, or DOCX.",
    };
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { success: false, error: "File size must be under 10 MB." };
  }

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = applicationId
    ? `students/${studentId}/applications/${applicationId}/${documentType}/${timestamp}-${sanitizedName}`
    : `students/${studentId}/${documentType}/${timestamp}-${sanitizedName}`;

  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from("student-documents")
    .upload(storagePath, file);

  if (uploadError) {
    console.error("Supabase storage upload error:", uploadError.message);
    const detail =
      process.env.NODE_ENV === "development"
        ? `File upload failed: ${uploadError.message}`
        : "File upload failed. Please try again.";
    return { success: false, error: detail };
  }

  const uploadedByType =
    profile.role === "sales" ? "sales_user" : profile.role === "admin" ? "admin_user" : "staff";

  const { error: insertError } = await supabase
    .from("student_documents")
    .insert({
      student_id: studentId,
      application_id: applicationId,
      document_type: documentType,
      file_name: file.name,
      storage_bucket: "student-documents",
      storage_path: storagePath,
      uploaded_by: profile.id,
      uploaded_by_type: uploadedByType,
      review_status: "uploaded",
    });

  if (insertError) {
    console.error("Document insert error:", insertError.message);
    await supabase.storage.from("student-documents").remove([storagePath]);
    const detail =
      process.env.NODE_ENV === "development"
        ? `Could not save document record: ${insertError.message}`
        : "Could not save document record.";
    return { success: false, error: detail };
  }

  revalidatePath("/dashboard/documents");

  return { success: true };
}

export async function updateDocumentReview(
  _prev: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }
  if (profile.role !== "admin") {
    return { success: false, error: "Only admins can review documents." };
  }

  const documentId = formData.get("document_id") as string;
  const reviewStatus = formData.get("review_status") as string;
  const reviewNotes = formData.get("review_notes") as string;

  if (!documentId) {
    return { success: false, error: "Missing document ID." };
  }

  const validStatuses = ["uploaded", "accepted", "needs_correction", "archived"];
  if (!validStatuses.includes(reviewStatus)) {
    return { success: false, error: "Invalid review status." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("student_documents")
    .update({
      review_status: reviewStatus,
      review_notes: reviewNotes || null,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  if (error) {
    console.error("Document review update error:", error.message);
    return { success: false, error: "Could not update document review." };
  }

  revalidatePath("/dashboard/documents");
  revalidatePath(`/dashboard/documents/${documentId}`);

  return { success: true };
}

export async function getDocumentSignedUrl(
  bucket: string,
  path: string
): Promise<{ url: string | null; error: string | null }> {
  const profile = await getUserProfile();
  if (!profile) {
    return { url: null, error: "You must be logged in." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    if (error) console.error("Signed URL error:", error.message);
    return { url: null, error: "Could not generate download link." };
  }

  return { url: data.signedUrl, error: null };
}
