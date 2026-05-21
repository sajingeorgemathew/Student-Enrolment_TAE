"use server";

import { createClient } from "@/lib/supabase/server";

export async function getApplicationsForContracts() {
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
      fee_schedules (id, status, total_fees),
      admission_checklists (id, photo_id_status, address_proof_status, academic_status, english_status),
      contracts (id, status, contract_number, generated_at, signed_at)
    `
    )
    .order("created_at", { ascending: false });

  return applications ?? [];
}

export type ContractDetailData = {
  application: {
    id: string;
    status: string;
    created_at: string;
    students: {
      id: string;
      student_number: string | null;
      legal_first_name: string;
      legal_middle_name: string | null;
      legal_last_name: string;
      preferred_name: string | null;
      date_of_birth: string | null;
      phone: string | null;
      alternate_phone: string | null;
      email: string | null;
      mailing_address_line_1: string | null;
      mailing_address_line_2: string | null;
      city: string | null;
      province: string | null;
      postal_code: string | null;
      country: string | null;
      immigration_status: string | null;
      international_student: boolean | null;
    } | null;
    programs: {
      id: string;
      program_code: string;
      program_name: string;
      credential_name: string | null;
      total_hours: number | null;
      theory_hours: number | null;
      practicum_hours: number | null;
    } | null;
    batches: {
      id: string;
      batch_name: string;
      batch_code: string | null;
      start_date: string | null;
      expected_end_date: string | null;
      theory_start_date: string | null;
      theory_end_date: string | null;
      practicum_start_date: string | null;
      practicum_end_date: string | null;
      class_days: string | null;
      class_time: string | null;
      delivery_method: string | null;
      training_location: string | null;
      practicum_1_location: string | null;
      practicum_2_location: string | null;
    } | null;
  };
  checklist: {
    id: string;
    photo_id_status: string;
    address_proof_status: string;
    academic_route: string | null;
    academic_status: string;
    academic_notes: string | null;
    english_route: string | null;
    english_status: string;
    english_score: string | null;
    english_notes: string | null;
  } | null;
  feeSchedule: {
    id: string;
    status: string;
    tuition_fee: number;
    book_fee: number;
    compulsory_fee: number;
    field_trip_fee: number;
    uniform_equipment_fee: number;
    professional_exam_fee: number;
    expendable_supplies_fee: number;
    international_fee: number;
    optional_fee: number;
    discount_amount: number;
    total_fees: number;
    payment_before_signing: number;
    payment_after_signing: number;
    remaining_balance: number;
    number_of_installments: number;
  } | null;
  installments: Array<{
    id: string;
    installment_number: number;
    due_date: string | null;
    amount_due: number;
    notes: string | null;
  }>;
  documents: Array<{
    id: string;
    document_type: string;
    file_name: string;
    review_status: string;
    created_at: string;
  }>;
  contract: {
    id: string;
    contract_number: string | null;
    status: string;
    generated_at: string | null;
    signed_at: string | null;
  } | null;
};

export async function getContractDetail(
  applicationId: string
): Promise<ContractDetailData | null> {
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      created_at,
      students (
        id, student_number,
        legal_first_name, legal_middle_name, legal_last_name,
        preferred_name, date_of_birth,
        phone, alternate_phone, email,
        mailing_address_line_1, mailing_address_line_2,
        city, province, postal_code, country,
        immigration_status, international_student
      ),
      programs (
        id, program_code, program_name, credential_name,
        total_hours, theory_hours, practicum_hours
      ),
      batches (
        id, batch_name, batch_code,
        start_date, expected_end_date,
        theory_start_date, theory_end_date,
        practicum_start_date, practicum_end_date,
        class_days, class_time,
        delivery_method, training_location,
        practicum_1_location, practicum_2_location
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

  const { data: feeSchedules } = await supabase
    .from("fee_schedules")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  const feeSchedule = feeSchedules?.[0] ?? null;

  let installments: ContractDetailData["installments"] = [];
  if (feeSchedule) {
    const { data: installmentData } = await supabase
      .from("payment_installments")
      .select("id, installment_number, due_date, amount_due, notes")
      .eq("fee_schedule_id", feeSchedule.id)
      .order("installment_number", { ascending: true });
    installments = installmentData ?? [];
  }

  const studentId = (
    application.students as unknown as { id: string } | null
  )?.id;

  let documents: ContractDetailData["documents"] = [];
  if (studentId) {
    const { data: docs } = await supabase
      .from("student_documents")
      .select("id, document_type, file_name, review_status, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });
    documents = docs ?? [];
  }

  const { data: contracts } = await supabase
    .from("contracts")
    .select("id, contract_number, status, generated_at, signed_at")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  const contract = contracts?.[0] ?? null;

  return {
    application: application as unknown as ContractDetailData["application"],
    checklist: checklist as ContractDetailData["checklist"],
    feeSchedule: feeSchedule as ContractDetailData["feeSchedule"],
    installments,
    documents,
    contract,
  };
}
