"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const programSchema = z.object({
  program_code: z.string().min(1, "Program code is required"),
  program_name: z.string().min(1, "Program name is required"),
  credential_name: z.string(),
  total_hours: z.string(),
  theory_hours: z.string(),
  practicum_hours: z.string(),
  default_tuition: z.string(),
  default_registration_fee: z.string(),
  default_book_fee: z.string(),
  default_compulsory_fee: z.string(),
  default_professional_exam_fee: z.string(),
  is_active: z.string(),
});

export type ProgramFormState = {
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

function toInt(val: string | undefined): number | null {
  if (!val || !val.trim()) return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

export async function createProgram(
  _prev: ProgramFormState,
  formData: FormData
): Promise<ProgramFormState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }
  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can create programs.",
    };
  }

  const raw: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") raw[key] = value;
  });

  const result = programSchema.safeParse(raw);
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

  const { error } = await supabase.from("programs").insert({
    program_code: d.program_code.trim(),
    program_name: d.program_name.trim(),
    credential_name: emptyToNull(d.credential_name),
    total_hours: toInt(d.total_hours),
    theory_hours: toInt(d.theory_hours),
    practicum_hours: toInt(d.practicum_hours),
    default_tuition: toNumber(d.default_tuition),
    default_registration_fee: toNumber(d.default_registration_fee),
    default_book_fee: toNumber(d.default_book_fee),
    default_compulsory_fee: toNumber(d.default_compulsory_fee),
    default_professional_exam_fee: toNumber(d.default_professional_exam_fee),
    is_active: d.is_active === "true",
  });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "A program with this code already exists.",
      };
    }
    return {
      success: false,
      error: "Could not create the program. Please try again.",
    };
  }

  revalidatePath("/dashboard/programs");
  redirect("/dashboard/programs");
}

export async function updateProgram(
  programId: string,
  _prev: ProgramFormState,
  formData: FormData
): Promise<ProgramFormState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }
  if (profile.role !== "admin") {
    return {
      success: false,
      error: "Only administrators can edit programs.",
    };
  }

  const raw: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") raw[key] = value;
  });

  const result = programSchema.safeParse(raw);
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

  const { error } = await supabase
    .from("programs")
    .update({
      program_code: d.program_code.trim(),
      program_name: d.program_name.trim(),
      credential_name: emptyToNull(d.credential_name),
      total_hours: toInt(d.total_hours),
      theory_hours: toInt(d.theory_hours),
      practicum_hours: toInt(d.practicum_hours),
      default_tuition: toNumber(d.default_tuition),
      default_registration_fee: toNumber(d.default_registration_fee),
      default_book_fee: toNumber(d.default_book_fee),
      default_compulsory_fee: toNumber(d.default_compulsory_fee),
      default_professional_exam_fee: toNumber(d.default_professional_exam_fee),
      is_active: d.is_active === "true",
    })
    .eq("id", programId);

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "A program with this code already exists.",
      };
    }
    return {
      success: false,
      error: "Could not update the program. Please try again.",
    };
  }

  revalidatePath("/dashboard/programs");
  redirect("/dashboard/programs");
}

export async function getPrograms() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select(
      "id, program_code, program_name, credential_name, total_hours, is_active, default_tuition, created_at"
    )
    .order("program_name");
  return data ?? [];
}

export async function getProgramById(programId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("*")
    .eq("id", programId)
    .single();
  return data;
}
