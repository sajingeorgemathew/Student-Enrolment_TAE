"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { revalidatePath } from "next/cache";

export type FeeFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function getApplicationsForFees() {
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      created_at,
      students (id, legal_first_name, legal_last_name, email),
      programs (id, program_name, program_code),
      batches (id, batch_name),
      fee_schedules (id, status, total_fees, created_at)
    `
    )
    .order("created_at", { ascending: false });

  return applications ?? [];
}

export async function getApplicationFeeDetail(applicationId: string) {
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      price_discussed,
      deposit_discussed,
      sales_notes,
      admin_notes,
      created_at,
      students (
        id, legal_first_name, legal_middle_name, legal_last_name,
        email, phone, student_number
      ),
      programs (
        id, program_code, program_name, credential_name,
        total_hours, default_tuition, default_book_fee,
        default_compulsory_fee, default_professional_exam_fee
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

  const { data: quotes } = await supabase
    .from("quotes")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  const { data: feeSchedules } = await supabase
    .from("fee_schedules")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  const feeSchedule = feeSchedules?.[0] ?? null;

  let installments: Array<{
    id: string;
    installment_number: number;
    due_date: string | null;
    amount_due: number;
    notes: string | null;
  }> = [];

  if (feeSchedule) {
    const { data: installmentData } = await supabase
      .from("payment_installments")
      .select("id, installment_number, due_date, amount_due, notes")
      .eq("fee_schedule_id", feeSchedule.id)
      .order("installment_number", { ascending: true });
    installments = installmentData ?? [];
  }

  return {
    application,
    quote: quotes?.[0] ?? null,
    feeSchedule,
    installments,
  };
}

function toNum(val: string | undefined | null): number {
  if (!val || !val.trim()) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export async function saveFeeSchedule(
  _prev: FeeFormState,
  formData: FormData
): Promise<FeeFormState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }
  if (!isAdminOrSuper(profile.role)) {
    return { success: false, error: "Only admins can manage fee schedules." };
  }

  const applicationId = formData.get("application_id") as string;
  const feeScheduleId = formData.get("fee_schedule_id") as string | null;
  const quoteId = formData.get("quote_id") as string | null;

  const tuitionFee = toNum(formData.get("tuition_fee") as string);
  const bookFee = toNum(formData.get("book_fee") as string);
  const compulsoryFee = toNum(formData.get("compulsory_fee") as string);
  const fieldTripFee = toNum(formData.get("field_trip_fee") as string);
  const uniformEquipmentFee = toNum(
    formData.get("uniform_equipment_fee") as string
  );
  const professionalExamFee = toNum(
    formData.get("professional_exam_fee") as string
  );
  const expendableSuppliesFee = toNum(
    formData.get("expendable_supplies_fee") as string
  );
  const internationalFee = toNum(formData.get("international_fee") as string);
  const optionalFee = toNum(formData.get("optional_fee") as string);
  const discountAmount = toNum(formData.get("discount_amount") as string);
  const paymentBeforeSigning = toNum(
    formData.get("payment_before_signing") as string
  );
  const numberOfInstallments = Math.floor(
    toNum(formData.get("number_of_installments") as string)
  );

  const totalFees =
    tuitionFee +
    bookFee +
    compulsoryFee +
    fieldTripFee +
    uniformEquipmentFee +
    professionalExamFee +
    expendableSuppliesFee +
    internationalFee +
    optionalFee -
    discountAmount;

  const remainingBalance = totalFees - paymentBeforeSigning;
  const paymentAfterSigning = remainingBalance;

  const fieldErrors: Record<string, string[]> = {};

  if (totalFees < 0) {
    fieldErrors.total_fees = ["Total fees cannot be negative."];
  }
  if (paymentBeforeSigning > totalFees) {
    fieldErrors.payment_before_signing = [
      "Payment before signing cannot exceed total fees.",
    ];
  }
  if (numberOfInstallments < 0) {
    fieldErrors.number_of_installments = [
      "Number of installments cannot be negative.",
    ];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const supabase = await createClient();

  const feeData = {
    application_id: applicationId,
    quote_id: quoteId || null,
    tuition_fee: tuitionFee,
    book_fee: bookFee,
    compulsory_fee: compulsoryFee,
    field_trip_fee: fieldTripFee,
    uniform_equipment_fee: uniformEquipmentFee,
    professional_exam_fee: professionalExamFee,
    expendable_supplies_fee: expendableSuppliesFee,
    international_fee: internationalFee,
    optional_fee: optionalFee,
    discount_amount: discountAmount,
    total_fees: totalFees,
    payment_before_signing: paymentBeforeSigning,
    payment_after_signing: paymentAfterSigning,
    remaining_balance: remainingBalance,
    number_of_installments: numberOfInstallments,
    status: "draft" as const,
  };

  let scheduleId = feeScheduleId;

  if (scheduleId) {
    const { error } = await supabase
      .from("fee_schedules")
      .update(feeData)
      .eq("id", scheduleId);
    if (error) {
      return { success: false, error: "Could not update fee schedule." };
    }
  } else {
    const { data, error } = await supabase
      .from("fee_schedules")
      .insert(feeData)
      .select("id")
      .single();
    if (error || !data) {
      return { success: false, error: "Could not create fee schedule." };
    }
    scheduleId = data.id;
  }

  if (numberOfInstallments > 0 && remainingBalance > 0) {
    await supabase
      .from("payment_installments")
      .delete()
      .eq("fee_schedule_id", scheduleId);

    const firstDueDate = formData.get("first_installment_due_date") as string;
    const frequency = formData.get("installment_frequency") as string;
    const installmentAmount = Math.round((remainingBalance / numberOfInstallments) * 100) / 100;
    const lastInstallmentAmount =
      Math.round((remainingBalance - installmentAmount * (numberOfInstallments - 1)) * 100) / 100;

    const rows = [];
    for (let i = 0; i < numberOfInstallments; i++) {
      let dueDate: string | null = null;
      if (firstDueDate) {
        const date = new Date(firstDueDate + "T00:00:00");
        if (frequency === "monthly") {
          date.setMonth(date.getMonth() + i);
        } else if (frequency === "biweekly") {
          date.setDate(date.getDate() + i * 14);
        } else if (frequency === "weekly") {
          date.setDate(date.getDate() + i * 7);
        }
        dueDate = date.toISOString().split("T")[0];
      }

      rows.push({
        fee_schedule_id: scheduleId,
        installment_number: i + 1,
        due_date: dueDate,
        amount_due: i === numberOfInstallments - 1 ? lastInstallmentAmount : installmentAmount,
      });
    }

    const { error: installError } = await supabase
      .from("payment_installments")
      .insert(rows);
    if (installError) {
      return {
        success: false,
        error: "Fee schedule saved but could not generate installments.",
      };
    }
  } else if (scheduleId) {
    await supabase
      .from("payment_installments")
      .delete()
      .eq("fee_schedule_id", scheduleId);
  }

  revalidatePath("/dashboard/fees");
  revalidatePath(`/dashboard/fees/${applicationId}`);

  const { data: appRow } = await supabase
    .from("applications")
    .select("student_id")
    .eq("id", applicationId)
    .single();
  if (appRow?.student_id) {
    revalidatePath(`/dashboard/students/${appRow.student_id}`);
  }

  return { success: true };
}

export async function approveFeeSchedule(
  feeScheduleId: string,
  applicationId: string
): Promise<FeeFormState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }
  if (!isAdminOrSuper(profile.role)) {
    return { success: false, error: "Only admins can approve fee schedules." };
  }

  const supabase = await createClient();

  const { data: schedule } = await supabase
    .from("fee_schedules")
    .select("*")
    .eq("id", feeScheduleId)
    .single();

  if (!schedule) {
    return { success: false, error: "Fee schedule not found." };
  }

  if (Number(schedule.total_fees) < 0) {
    return { success: false, error: "Cannot approve: total fees is negative." };
  }
  if (Number(schedule.payment_before_signing) > Number(schedule.total_fees)) {
    return {
      success: false,
      error: "Cannot approve: payment before signing exceeds total fees.",
    };
  }

  if (Number(schedule.number_of_installments) > 0) {
    const { data: installments } = await supabase
      .from("payment_installments")
      .select("amount_due, due_date")
      .eq("fee_schedule_id", feeScheduleId);

    if (
      !installments ||
      installments.length !== Number(schedule.number_of_installments)
    ) {
      return {
        success: false,
        error: "Cannot approve: installment count does not match.",
      };
    }

    const installmentTotal = installments.reduce(
      (sum, inst) => sum + Number(inst.amount_due),
      0
    );
    const diff = Math.abs(installmentTotal - Number(schedule.remaining_balance));
    if (diff > 0.02) {
      return {
        success: false,
        error: "Cannot approve: installment total does not match remaining balance.",
      };
    }

    const missingDates = installments.some((inst) => !inst.due_date);
    if (missingDates) {
      return {
        success: false,
        error: "Cannot approve: some installments are missing due dates.",
      };
    }
  }

  const { error } = await supabase
    .from("fee_schedules")
    .update({
      status: "approved",
      approved_by: profile.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", feeScheduleId);

  if (error) {
    return { success: false, error: "Could not approve fee schedule." };
  }

  revalidatePath("/dashboard/fees");
  revalidatePath(`/dashboard/fees/${applicationId}`);

  const { data: appRow2 } = await supabase
    .from("applications")
    .select("student_id")
    .eq("id", applicationId)
    .single();
  if (appRow2?.student_id) {
    revalidatePath(`/dashboard/students/${appRow2.student_id}`);
  }

  return { success: true };
}

export async function reopenFeeSchedule(
  feeScheduleId: string,
  applicationId: string
): Promise<FeeFormState> {
  const profile = await getUserProfile();
  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }
  if (!isAdminOrSuper(profile.role)) {
    return { success: false, error: "Only admins can reopen fee schedules." };
  }

  const supabase = await createClient();

  const { data: schedule } = await supabase
    .from("fee_schedules")
    .select("status")
    .eq("id", feeScheduleId)
    .single();

  if (!schedule) {
    return { success: false, error: "Fee schedule not found." };
  }

  if (schedule.status !== "approved") {
    return {
      success: false,
      error: "Only approved fee schedules can be reopened.",
    };
  }

  const { error } = await supabase
    .from("fee_schedules")
    .update({
      status: "reopened",
      approved_by: null,
      approved_at: null,
    })
    .eq("id", feeScheduleId);

  if (error) {
    return { success: false, error: "Could not reopen fee schedule." };
  }

  revalidatePath("/dashboard/fees");
  revalidatePath(`/dashboard/fees/${applicationId}`);

  const { data: appRow3 } = await supabase
    .from("applications")
    .select("student_id")
    .eq("id", applicationId)
    .single();
  if (appRow3?.student_id) {
    revalidatePath(`/dashboard/students/${appRow3.student_id}`);
  }

  return { success: true };
}
