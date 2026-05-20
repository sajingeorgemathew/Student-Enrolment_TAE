"use server";

import { createClient } from "@/lib/supabase/server";

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
    .select("id, document_type, file_name, review_status, created_at")
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
