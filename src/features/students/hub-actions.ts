"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper, isSalesOrAdmin } from "@/lib/roles";
import { revalidatePath } from "next/cache";

export type HubFormState = {
  success: boolean;
  error?: string;
};

function emptyToNull(val: string | undefined | null): string | null {
  return val && val.trim() ? val.trim() : null;
}

function toNumber(val: string | undefined | null): number | null {
  if (!val || !val.trim()) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

export async function updateApplicationSales(
  _prev: HubFormState,
  formData: FormData
): Promise<HubFormState> {
  const profile = await getUserProfile();
  if (!profile) return { success: false, error: "You must be logged in." };
  if (!isSalesOrAdmin(profile.role)) {
    return { success: false, error: "You do not have permission." };
  }

  const applicationId = formData.get("application_id") as string;
  if (!applicationId) return { success: false, error: "Missing application ID." };

  const supabase = await createClient();

  const { data: app } = await supabase
    .from("applications")
    .select("id, status, student_id")
    .eq("id", applicationId)
    .single();

  if (!app) return { success: false, error: "Application not found." };

  if (
    profile.role === "sales" &&
    app.status !== "new_intake" &&
    app.status !== "information_needed"
  ) {
    return {
      success: false,
      error: "Sales can only edit intakes in New Intake or Information Needed status.",
    };
  }

  const updates: Record<string, unknown> = {
    lead_source: emptyToNull(formData.get("lead_source") as string),
    program_id: emptyToNull(formData.get("program_id") as string),
    batch_id: emptyToNull(formData.get("batch_id") as string),
    price_discussed: toNumber(formData.get("price_discussed") as string),
    deposit_discussed: toNumber(formData.get("deposit_discussed") as string),
    sales_notes: emptyToNull(formData.get("sales_notes") as string),
  };

  const { error } = await supabase
    .from("applications")
    .update(updates)
    .eq("id", applicationId);

  if (error) {
    console.error("Application sales update error:", error.message);
    return { success: false, error: "Could not update application." };
  }

  revalidatePath(`/dashboard/students/${app.student_id}`);
  return { success: true };
}

export async function updateApplicationAdmin(
  _prev: HubFormState,
  formData: FormData
): Promise<HubFormState> {
  const profile = await getUserProfile();
  if (!profile) return { success: false, error: "You must be logged in." };
  if (!isAdminOrSuper(profile.role)) {
    return { success: false, error: "Only admin users can update this." };
  }

  const applicationId = formData.get("application_id") as string;
  if (!applicationId) return { success: false, error: "Missing application ID." };

  const supabase = await createClient();

  const { data: app } = await supabase
    .from("applications")
    .select("id, student_id")
    .eq("id", applicationId)
    .single();

  if (!app) return { success: false, error: "Application not found." };

  const newStatus = emptyToNull(formData.get("status") as string);

  const updates: Record<string, unknown> = {
    status: newStatus ?? undefined,
    program_id: emptyToNull(formData.get("program_id") as string),
    batch_id: emptyToNull(formData.get("batch_id") as string),
    admin_notes: emptyToNull(formData.get("admin_notes") as string),
    admin_owner: profile.id,
  };

  if (newStatus === "ready_for_contract") {
    updates.ready_for_contract_at = new Date().toISOString();
  }

  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });

  const { error } = await supabase
    .from("applications")
    .update(updates)
    .eq("id", applicationId);

  if (error) {
    console.error("Application admin update error:", error.message);
    return { success: false, error: "Could not update application." };
  }

  revalidatePath(`/dashboard/students/${app.student_id}`);
  return { success: true };
}

export async function saveSalesChecklist(
  _prev: HubFormState,
  formData: FormData
): Promise<HubFormState> {
  const profile = await getUserProfile();
  if (!profile) return { success: false, error: "You must be logged in." };
  if (!isSalesOrAdmin(profile.role)) {
    return { success: false, error: "You do not have permission." };
  }

  const applicationId = formData.get("application_id") as string;
  if (!applicationId) return { success: false, error: "Missing application ID." };

  const supabase = await createClient();

  const { data: app } = await supabase
    .from("applications")
    .select("id, student_id")
    .eq("id", applicationId)
    .single();

  if (!app) return { success: false, error: "Application not found." };

  const row = {
    application_id: applicationId,
    photo_id: (formData.get("photo_id") as string) || "not_received",
    proof_of_address: (formData.get("proof_of_address") as string) || "not_received",
    diploma_or_transcript:
      (formData.get("diploma_or_transcript") as string) || "not_received",
    english_proof: (formData.get("english_proof") as string) || "not_received",
    immigration_status_document:
      (formData.get("immigration_status_document") as string) || "not_received",
    payment_proof_deposit:
      (formData.get("payment_proof_deposit") as string) || "not_received",
    other_documents: (formData.get("other_documents") as string) || "not_received",
    notes: emptyToNull(formData.get("notes") as string),
    updated_by: profile.id,
  };

  const { error } = await supabase.from("sales_checklists").upsert(row, {
    onConflict: "application_id",
  });

  if (error) {
    console.error("Sales checklist save error:", error.message);
    return { success: false, error: "Could not save sales checklist." };
  }

  revalidatePath(`/dashboard/students/${app.student_id}`);
  return { success: true };
}

export async function getHubPrograms() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("id, program_code, program_name")
    .eq("is_active", true)
    .order("program_name");
  return data ?? [];
}

export async function getHubBatches(programId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("batches")
    .select("id, batch_name, batch_code, start_date")
    .eq("program_id", programId)
    .eq("is_active", true)
    .order("start_date", { ascending: false });
  return data ?? [];
}
