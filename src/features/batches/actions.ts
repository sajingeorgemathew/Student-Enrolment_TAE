"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const batchSchema = z.object({
  program_id: z.string().min(1, "Program is required"),
  batch_name: z.string().min(1, "Batch name is required"),
  batch_code: z.string(),
  start_date: z.string(),
  expected_end_date: z.string(),
  theory_start_date: z.string(),
  theory_end_date: z.string(),
  practicum_start_date: z.string(),
  practicum_end_date: z.string(),
  class_days: z.string(),
  class_time: z.string(),
  delivery_method: z.string(),
  training_location: z.string(),
  practicum_1_location: z.string(),
  practicum_2_location: z.string(),
  notes: z.string(),
  is_active: z.string(),
});

export type BatchFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function emptyToNull(val: string | undefined): string | null {
  return val && val.trim() ? val.trim() : null;
}

export async function createBatch(
  _prev: BatchFormState,
  formData: FormData
): Promise<BatchFormState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }
  if (!isAdminOrSuper(profile.role)) {
    return {
      success: false,
      error: "Only administrators can create batches.",
    };
  }

  const raw: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") raw[key] = value;
  });

  const result = batchSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[] | undefined
      >,
    };
  }

  const d = result.data;
  const supabase = await createClient();

  const deliveryMethod = emptyToNull(d.delivery_method);
  if (
    deliveryMethod &&
    !["in_person", "hybrid", "online"].includes(deliveryMethod)
  ) {
    return { success: false, error: "Invalid delivery method." };
  }

  const { error } = await supabase.from("batches").insert({
    program_id: d.program_id,
    batch_name: d.batch_name.trim(),
    batch_code: emptyToNull(d.batch_code),
    start_date: emptyToNull(d.start_date),
    expected_end_date: emptyToNull(d.expected_end_date),
    theory_start_date: emptyToNull(d.theory_start_date),
    theory_end_date: emptyToNull(d.theory_end_date),
    practicum_start_date: emptyToNull(d.practicum_start_date),
    practicum_end_date: emptyToNull(d.practicum_end_date),
    class_days: emptyToNull(d.class_days),
    class_time: emptyToNull(d.class_time),
    delivery_method: deliveryMethod,
    training_location: emptyToNull(d.training_location),
    practicum_1_location: emptyToNull(d.practicum_1_location),
    practicum_2_location: emptyToNull(d.practicum_2_location),
    notes: emptyToNull(d.notes),
    is_active: d.is_active === "true",
  });

  if (error) {
    return {
      success: false,
      error: "Could not create the batch. Please try again.",
    };
  }

  revalidatePath("/dashboard/batches");
  redirect("/dashboard/batches");
}

export async function updateBatch(
  batchId: string,
  _prev: BatchFormState,
  formData: FormData
): Promise<BatchFormState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }
  if (!isAdminOrSuper(profile.role)) {
    return {
      success: false,
      error: "Only administrators can edit batches.",
    };
  }

  const raw: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") raw[key] = value;
  });

  const result = batchSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[] | undefined
      >,
    };
  }

  const d = result.data;
  const supabase = await createClient();

  const deliveryMethod = emptyToNull(d.delivery_method);
  if (
    deliveryMethod &&
    !["in_person", "hybrid", "online"].includes(deliveryMethod)
  ) {
    return { success: false, error: "Invalid delivery method." };
  }

  const { error } = await supabase
    .from("batches")
    .update({
      program_id: d.program_id,
      batch_name: d.batch_name.trim(),
      batch_code: emptyToNull(d.batch_code),
      start_date: emptyToNull(d.start_date),
      expected_end_date: emptyToNull(d.expected_end_date),
      theory_start_date: emptyToNull(d.theory_start_date),
      theory_end_date: emptyToNull(d.theory_end_date),
      practicum_start_date: emptyToNull(d.practicum_start_date),
      practicum_end_date: emptyToNull(d.practicum_end_date),
      class_days: emptyToNull(d.class_days),
      class_time: emptyToNull(d.class_time),
      delivery_method: deliveryMethod,
      training_location: emptyToNull(d.training_location),
      practicum_1_location: emptyToNull(d.practicum_1_location),
      practicum_2_location: emptyToNull(d.practicum_2_location),
      notes: emptyToNull(d.notes),
      is_active: d.is_active === "true",
    })
    .eq("id", batchId);

  if (error) {
    return {
      success: false,
      error: "Could not update the batch. Please try again.",
    };
  }

  revalidatePath("/dashboard/batches");
  redirect("/dashboard/batches");
}

export async function getBatches(programId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("batches")
    .select(
      "id, batch_name, batch_code, start_date, expected_end_date, delivery_method, is_active, created_at, programs (id, program_name, program_code)"
    )
    .order("start_date", { ascending: false });

  if (programId) {
    query = query.eq("program_id", programId);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getBatchById(batchId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("batches")
    .select("*")
    .eq("id", batchId)
    .single();
  return data;
}

export async function getActivePrograms() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("id, program_code, program_name")
    .eq("is_active", true)
    .order("program_name");
  return data ?? [];
}
