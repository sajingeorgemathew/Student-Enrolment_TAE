"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isSalesOrAdmin } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const intakeSchema = z.object({
  legal_first_name: z.string().min(1, "First name is required"),
  legal_middle_name: z.string(),
  legal_last_name: z.string().min(1, "Last name is required"),
  phone: z.string(),
  alternate_phone: z.string(),
  email: z.string(),
  date_of_birth: z.string(),
  mailing_address_line_1: z.string(),
  mailing_address_line_2: z.string(),
  city: z.string(),
  province: z.string(),
  postal_code: z.string(),
  country: z.string(),
  program_id: z.string(),
  batch_id: z.string(),
  lead_source: z.string(),
  price_discussed: z.string(),
  deposit_discussed: z.string(),
  payment_notes: z.string(),
  sales_notes: z.string(),
});

export type IntakeFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function emptyToNull(val: string | undefined): string | null {
  return val && val.trim() ? val.trim() : null;
}

function toNumber(val: string | undefined): number | null {
  if (!val || !val.trim()) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

export async function createIntake(
  _prev: IntakeFormState,
  formData: FormData
): Promise<IntakeFormState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }
  if (!isSalesOrAdmin(profile.role)) {
    return {
      success: false,
      error: "You do not have permission to create intakes.",
    };
  }

  const raw: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") raw[key] = value;
  });

  const result = intakeSchema.safeParse(raw);
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

  const { data: student, error: studentErr } = await supabase
    .from("students")
    .insert({
      legal_first_name: d.legal_first_name.trim(),
      legal_middle_name: emptyToNull(d.legal_middle_name),
      legal_last_name: d.legal_last_name.trim(),
      phone: emptyToNull(d.phone),
      alternate_phone: emptyToNull(d.alternate_phone),
      email: emptyToNull(d.email),
      date_of_birth: emptyToNull(d.date_of_birth),
      mailing_address_line_1: emptyToNull(d.mailing_address_line_1),
      mailing_address_line_2: emptyToNull(d.mailing_address_line_2),
      city: emptyToNull(d.city),
      province: emptyToNull(d.province),
      postal_code: emptyToNull(d.postal_code),
      country: emptyToNull(d.country) ?? "Canada",
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (studentErr || !student) {
    return {
      success: false,
      error: "Could not create the student record. Please try again.",
    };
  }

  const programId = emptyToNull(d.program_id);
  const batchId = emptyToNull(d.batch_id);
  const priceDiscussed = toNumber(d.price_discussed);
  const depositDiscussed = toNumber(d.deposit_discussed);

  const { data: application, error: appErr } = await supabase
    .from("applications")
    .insert({
      student_id: student.id,
      program_id: programId,
      batch_id: batchId,
      lead_source: emptyToNull(d.lead_source),
      sales_owner: profile.id,
      status: "new_intake",
      price_discussed: priceDiscussed,
      deposit_discussed: depositDiscussed,
      sales_notes: emptyToNull(d.sales_notes),
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (appErr || !application) {
    return {
      success: false,
      error: "Could not create the intake record. Please try again.",
    };
  }

  const hasQuoteData =
    priceDiscussed !== null ||
    depositDiscussed !== null ||
    emptyToNull(d.payment_notes);

  if (hasQuoteData) {
    await supabase.from("quotes").insert({
      student_id: student.id,
      application_id: application.id,
      program_id: programId,
      batch_id: batchId,
      quoted_by: profile.id,
      quoted_total: priceDiscussed,
      deposit_discussed: depositDiscussed ?? 0,
      payment_notes: emptyToNull(d.payment_notes),
      status: "draft",
    });
  }

  revalidatePath("/dashboard/intake");
  redirect("/dashboard/intake");
}

export async function submitToAdminReview(applicationId: string) {
  const profile = await getUserProfile();
  if (!profile) return { success: false, error: "You must be logged in." };
  if (!isSalesOrAdmin(profile.role)) {
    return { success: false, error: "You do not have permission." };
  }

  const supabase = await createClient();

  const { data: app } = await supabase
    .from("applications")
    .select("id, status, student_id")
    .eq("id", applicationId)
    .single();

  if (!app) return { success: false, error: "Application not found." };

  if (app.status !== "new_intake" && app.status !== "information_needed") {
    return {
      success: false,
      error: "Can only send to admin review from New Intake or Information Needed status.",
    };
  }

  const { error } = await supabase
    .from("applications")
    .update({
      status: "admin_review",
      submitted_to_admin_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (error) {
    return { success: false, error: "Could not send to admin review." };
  }

  revalidatePath(`/dashboard/students/${app.student_id}`);
  revalidatePath("/dashboard/intake");
  revalidatePath("/dashboard/contracts");
  revalidatePath("/dashboard/checklists");
  revalidatePath("/dashboard/fees");
  return { success: true };
}

export async function getIntakes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      lead_source,
      price_discussed,
      deposit_discussed,
      sales_notes,
      created_at,
      students (id, legal_first_name, legal_last_name, email, phone),
      programs (id, program_name, program_code),
      batches (id, batch_name)
    `
    )
    // ACADEMIC-05: legacy linkage applications are historical and must not enter
    // the active intake queue.
    .eq("is_legacy", false)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getPrograms() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("id, program_code, program_name")
    .eq("is_active", true)
    .order("program_name");
  return data ?? [];
}

export async function getBatchesByProgram(programId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("batches")
    .select("id, batch_name, batch_code, start_date")
    .eq("program_id", programId)
    .eq("is_active", true)
    .order("start_date", { ascending: false });
  return data ?? [];
}
