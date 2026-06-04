"use server";

import { createClient } from "@/lib/supabase/server";

export type ReceiptRecord = {
  id: string;
  receipt_number: string;
  student_id: string;
  student_name_snapshot: string;
  student_number_snapshot: string;
  amount: number;
  payment_date: string;
  receipt_date: string;
  payment_method: string;
  notes_type: string;
  pdf_storage_path: string | null;
  generated_by: string;
  generated_at: string;
  voided_at: string | null;
  generated_by_name?: string | null;
};

export type ReceiptFilters = {
  receiptNumber?: string;
  studentName?: string;
  studentNumber?: string;
  paymentMethod?: string;
  notesType?: string;
  voidStatus?: string;
  studentId?: string;
};

export type ReceiptRegistryResult = {
  records: ReceiptRecord[];
  // True when the receipt_records table is not available yet (for example the
  // FINANCE-02 migration has not been applied to this environment).
  tableMissing: boolean;
};

// Cap the registry page size to keep the query bounded for large data sets.
const MAX_ROWS = 200;

export async function getReceiptRecords(
  filters: ReceiptFilters = {}
): Promise<ReceiptRegistryResult> {
  const supabase = await createClient();

  let query = supabase
    .from("receipt_records")
    .select(
      "id, receipt_number, student_id, student_name_snapshot, student_number_snapshot, amount, payment_date, receipt_date, payment_method, notes_type, pdf_storage_path, generated_by, generated_at, voided_at"
    )
    .order("generated_at", { ascending: false })
    .limit(MAX_ROWS);

  if (filters.receiptNumber) {
    query = query.ilike("receipt_number", `%${filters.receiptNumber}%`);
  }
  if (filters.studentName) {
    query = query.ilike("student_name_snapshot", `%${filters.studentName}%`);
  }
  if (filters.studentNumber) {
    query = query.ilike(
      "student_number_snapshot",
      `%${filters.studentNumber}%`
    );
  }
  if (filters.paymentMethod) {
    query = query.eq("payment_method", filters.paymentMethod);
  }
  if (filters.notesType) {
    query = query.eq("notes_type", filters.notesType);
  }
  if (filters.voidStatus === "voided") {
    query = query.not("voided_at", "is", null);
  } else if (filters.voidStatus === "active") {
    query = query.is("voided_at", null);
  }
  if (filters.studentId) {
    query = query.eq("student_id", filters.studentId);
  }

  const { data: records, error } = await query;

  if (error) {
    // Postgres "undefined_table" is 42P01. If the table has not been created
    // yet (migration not applied), fail gracefully with a setup message rather
    // than throwing. Any other error also falls back to the empty state.
    const tableMissing =
      error.code === "42P01" ||
      /receipt_records/i.test(error.message ?? "");
    return { records: [], tableMissing };
  }

  if (!records || records.length === 0) {
    return { records: [], tableMissing: false };
  }

  const generatorIds = [...new Set(records.map((r) => r.generated_by))];
  let profileMap: Record<string, string> = {};
  if (generatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", generatorIds);
    if (profiles) {
      profileMap = Object.fromEntries(
        profiles.map((p) => [p.id, p.full_name || p.email || p.id])
      );
    }
  }

  return {
    records: records.map((r) => ({
      ...r,
      generated_by_name: profileMap[r.generated_by] ?? null,
    })),
    tableMissing: false,
  };
}

// FINANCE-10: student hub receipt summary.
//
// Returns only the receipts that belong to one student, plus the totals the
// student hub section shows. The receipt_records select RLS already allows all
// staff roles (super_admin, admin, sales, viewer) to read, so this summary is
// safe to render read-only for every role. Download, generation, edit, and
// delete stay gated elsewhere (admin/super_admin only).
export type StudentReceiptSummary = {
  // Recent receipts, newest first, capped at recentLimit.
  recent: ReceiptRecord[];
  // The most recently generated receipt for this student, if any.
  latest: ReceiptRecord | null;
  // Count of all receipts for this student (including voided, for audit).
  totalCount: number;
  // Sum of non-voided receipt amounts (voided receipts are excluded).
  totalAmount: number;
  tableMissing: boolean;
};

// Keep the per-student query bounded. A single student should never have a huge
// number of receipts, but this guards against a runaway query just in case.
const STUDENT_RECEIPT_CAP = 100;

export async function getStudentReceiptSummary(
  studentId: string,
  recentLimit = 5
): Promise<StudentReceiptSummary> {
  const empty: StudentReceiptSummary = {
    recent: [],
    latest: null,
    totalCount: 0,
    totalAmount: 0,
    tableMissing: false,
  };

  if (!studentId) return empty;

  const supabase = await createClient();

  const { data: records, error } = await supabase
    .from("receipt_records")
    .select(
      "id, receipt_number, student_id, student_name_snapshot, student_number_snapshot, amount, payment_date, receipt_date, payment_method, notes_type, pdf_storage_path, generated_by, generated_at, voided_at"
    )
    .eq("student_id", studentId)
    .order("generated_at", { ascending: false })
    .limit(STUDENT_RECEIPT_CAP);

  if (error) {
    const tableMissing =
      error.code === "42P01" ||
      /receipt_records/i.test(error.message ?? "");
    return { ...empty, tableMissing };
  }

  if (!records || records.length === 0) {
    return empty;
  }

  const totalCount = records.length;
  const totalAmount = records.reduce(
    (sum, r) => (r.voided_at ? sum : sum + Number(r.amount || 0)),
    0
  );

  // Resolve generator display names for the recent rows only.
  const recentRaw = records.slice(0, recentLimit);
  const generatorIds = [...new Set(recentRaw.map((r) => r.generated_by))];
  let profileMap: Record<string, string> = {};
  if (generatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", generatorIds);
    if (profiles) {
      profileMap = Object.fromEntries(
        profiles.map((p) => [p.id, p.full_name || p.email || p.id])
      );
    }
  }

  const recent: ReceiptRecord[] = recentRaw.map((r) => ({
    ...r,
    generated_by_name: profileMap[r.generated_by] ?? null,
  }));

  return {
    recent,
    latest: recent[0] ?? null,
    totalCount,
    totalAmount,
    tableMissing: false,
  };
}
