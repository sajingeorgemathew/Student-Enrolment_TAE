"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { revalidatePath } from "next/cache";

export type BatchAssignmentState = {
  success: boolean;
  error?: string;
};

export async function changeBatch(
  _prev: BatchAssignmentState,
  formData: FormData
): Promise<BatchAssignmentState> {
  const profile = await getUserProfile();
  if (!profile) return { success: false, error: "You must be logged in." };
  if (!isAdminOrSuper(profile.role)) {
    return { success: false, error: "Only admin users can change batch assignment." };
  }

  const applicationId = formData.get("application_id") as string;
  const newBatchId = formData.get("new_batch_id") as string;
  const studentId = formData.get("student_id") as string;

  if (!applicationId || !newBatchId || !studentId) {
    return { success: false, error: "Missing required fields." };
  }

  const supabase = await createClient();

  const { data: app } = await supabase
    .from("applications")
    .select("id, batch_id, student_id")
    .eq("id", applicationId)
    .single();

  if (!app) return { success: false, error: "Application not found." };

  const previousBatchId = app.batch_id;

  if (previousBatchId === newBatchId) {
    return { success: false, error: "New batch is the same as the current batch." };
  }

  const { error: updateError } = await supabase
    .from("applications")
    .update({ batch_id: newBatchId })
    .eq("id", applicationId);

  if (updateError) {
    console.error("Change batch error:", updateError.message);
    return { success: false, error: "Could not update batch assignment." };
  }

  await supabase.from("batch_transfer_history").insert({
    student_id: studentId,
    application_id: applicationId,
    previous_batch_id: previousBatchId,
    new_batch_id: newBatchId,
    transfer_type: "change",
    transferred_by: profile.id,
  });

  revalidatePath(`/dashboard/students/${studentId}`);
  return { success: true };
}

export async function transferBatch(
  _prev: BatchAssignmentState,
  formData: FormData
): Promise<BatchAssignmentState> {
  const profile = await getUserProfile();
  if (!profile) return { success: false, error: "You must be logged in." };
  if (!isAdminOrSuper(profile.role)) {
    return { success: false, error: "Only admin users can transfer batch." };
  }

  const applicationId = formData.get("application_id") as string;
  const newBatchId = formData.get("new_batch_id") as string;
  const studentId = formData.get("student_id") as string;
  const reason = (formData.get("reason") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!applicationId || !newBatchId || !studentId) {
    return { success: false, error: "Missing required fields." };
  }

  if (!reason) {
    return { success: false, error: "Transfer reason is required." };
  }

  const supabase = await createClient();

  const { data: app } = await supabase
    .from("applications")
    .select("id, batch_id, student_id")
    .eq("id", applicationId)
    .single();

  if (!app) return { success: false, error: "Application not found." };

  const previousBatchId = app.batch_id;

  if (previousBatchId === newBatchId) {
    return { success: false, error: "New batch is the same as the current batch." };
  }

  const { error: updateError } = await supabase
    .from("applications")
    .update({ batch_id: newBatchId })
    .eq("id", applicationId);

  if (updateError) {
    console.error("Transfer batch error:", updateError.message);
    return { success: false, error: "Could not update batch assignment." };
  }

  const { error: historyError } = await supabase
    .from("batch_transfer_history")
    .insert({
      student_id: studentId,
      application_id: applicationId,
      previous_batch_id: previousBatchId,
      new_batch_id: newBatchId,
      transfer_type: "transfer",
      reason,
      notes,
      transferred_by: profile.id,
    });

  if (historyError) {
    console.error("Transfer history insert error:", historyError.message);
  }

  revalidatePath(`/dashboard/students/${studentId}`);
  return { success: true };
}

export type TransferHistoryRecord = {
  id: string;
  transfer_type: string;
  reason: string | null;
  notes: string | null;
  transferred_at: string;
  previous_batch: { id: string; batch_name: string } | null;
  new_batch: { id: string; batch_name: string } | null;
};

export async function getBatchTransferHistory(
  studentId: string
): Promise<TransferHistoryRecord[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("batch_transfer_history")
    .select(
      `
      id,
      transfer_type,
      reason,
      notes,
      transferred_at,
      previous_batch_id,
      new_batch_id,
      previous_batch:batches!batch_transfer_history_previous_batch_id_fkey (
        id, batch_name
      ),
      new_batch:batches!batch_transfer_history_new_batch_id_fkey (
        id, batch_name
      )
    `
    )
    .eq("student_id", studentId)
    .order("transferred_at", { ascending: false });

  if (!data) return [];

  return data.map((row) => {
    const prev = row.previous_batch as unknown;
    const next = row.new_batch as unknown;
    return {
      id: row.id,
      transfer_type: row.transfer_type,
      reason: row.reason,
      notes: row.notes,
      transferred_at: row.transferred_at,
      previous_batch: Array.isArray(prev)
        ? (prev[0] as { id: string; batch_name: string } | undefined) ?? null
        : (prev as { id: string; batch_name: string } | null),
      new_batch: Array.isArray(next)
        ? (next[0] as { id: string; batch_name: string } | undefined) ?? null
        : (next as { id: string; batch_name: string } | null),
    };
  });
}
