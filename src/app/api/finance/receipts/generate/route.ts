import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { generateReceiptPdf } from "@/lib/receipts/generate-receipt-pdf";
import { formatReceiptNumber } from "@/lib/receipts/receipt-formatters";
import {
  isCardPaymentMethod,
  type ReceiptNotesType,
  type ReceiptPaymentMethod,
  type ReceiptSignatureVariant,
} from "@/lib/receipts/receipt-types";

// FINANCE-06: admin-only single receipt generation.
// FINANCE-07: permanent storage and re-download.
//
// Creates one receipt_records row, generates the PDF with the FINANCE-04
// generator, uploads it to the private receipt-documents bucket, records the
// storage path on the receipt, and streams the PDF bytes back for immediate
// download. The flow is all-or-nothing: if generation, upload, or the path
// update fails, the reserved record and any uploaded file are rolled back so
// no broken receipt state is left behind.

const RECEIPT_STORAGE_BUCKET = "receipt-documents";

const PAYMENT_METHODS: ReceiptPaymentMethod[] = [
  "cash",
  "e_transfer",
  "debit",
  "master_card",
  "visa",
  "amex",
  "paypal",
  "cheque_bank_draft",
];

const NOTES_TYPES: ReceiptNotesType[] = [
  "enrolment_fee",
  "installment_payment",
  "late_fee_payment_installment_payment",
];

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime());
}

type ApplicationContext = {
  applicationId: string | null;
  programId: string | null;
  batchId: string | null;
  programName: string | null;
};

async function resolveApplicationContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string
): Promise<ApplicationContext> {
  const { data } = await supabase
    .from("applications")
    .select("id, status, created_at, program_id, batch_id, programs (program_name)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    status: string | null;
    program_id: string | null;
    batch_id: string | null;
    programs: { program_name: string | null } | null;
  }>;

  if (rows.length === 0) {
    return { applicationId: null, programId: null, batchId: null, programName: null };
  }

  const chosen = rows.find((r) => r.status !== "archived") ?? rows[0];
  return {
    applicationId: chosen.id,
    programId: chosen.program_id,
    batchId: chosen.batch_id,
    programName: chosen.programs?.program_name ?? null,
  };
}

export async function POST(request: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) {
    return bad("Unauthorized.", 401);
  }
  if (!isAdminOrSuper(profile.role)) {
    return bad("Only admin or super admin users can create receipts.", 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  const studentId = typeof body.studentId === "string" ? body.studentId : "";
  if (!studentId) {
    return bad("Select a student before creating a receipt.");
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return bad("Enter a valid amount greater than zero.");
  }

  const paymentDate = typeof body.paymentDate === "string" ? body.paymentDate : "";
  if (!isValidDate(paymentDate)) {
    return bad("Enter a valid payment date.");
  }

  const paymentMethod = body.paymentMethod as ReceiptPaymentMethod;
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return bad("Select a valid payment method.");
  }

  const notesType = body.notesType as ReceiptNotesType;
  if (!NOTES_TYPES.includes(notesType)) {
    return bad("Select a valid notes type.");
  }

  const signatureVariant: ReceiptSignatureVariant =
    body.signatureVariant === "B" ? "B" : "A";

  // card_type is stored only for card-based methods. The payment method itself
  // already encodes the card brand, so card_type mirrors it for record-keeping.
  const cardType = isCardPaymentMethod(paymentMethod) ? paymentMethod : null;

  const supabase = await createClient();

  // Load the student for the snapshots and number remainder.
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, student_number, legal_full_name")
    .eq("id", studentId)
    .single();

  if (studentError || !student) {
    return bad("Student not found.", 404);
  }
  if (!student.student_number) {
    return bad(
      "This student does not have a student number. Add a student number before creating a receipt."
    );
  }

  const appContext = await resolveApplicationContext(supabase, studentId);

  // Resolve the sequence: use the admin override if provided and valid,
  // otherwise compute the next available sequence (max + 1).
  let receiptSequence: number;
  if (body.receiptSequence !== undefined && body.receiptSequence !== null && body.receiptSequence !== "") {
    receiptSequence = Number(body.receiptSequence);
    if (!Number.isInteger(receiptSequence) || receiptSequence < 1) {
      return bad("Receipt sequence must be a whole number of 1 or more.");
    }
  } else {
    const { data: seqRows, error: seqError } = await supabase
      .from("receipt_records")
      .select("receipt_sequence")
      .eq("student_id", studentId)
      .order("receipt_sequence", { ascending: false })
      .limit(1);
    if (seqError) {
      if (
        seqError.code === "42P01" ||
        /receipt_records/i.test(seqError.message ?? "")
      ) {
        return bad(
          "Receipt records are not available in this environment yet. Apply the finance receipt migration first.",
          503
        );
      }
      return bad("Could not determine the next receipt sequence.", 500);
    }
    const highest = seqRows && seqRows.length > 0 ? Number(seqRows[0].receipt_sequence) : 0;
    receiptSequence = highest + 1;
  }

  const receiptNumber = formatReceiptNumber(student.student_number, receiptSequence);
  const now = new Date().toISOString();

  // Insert the receipt record first so the receipt number is reserved by the
  // unique constraints before the PDF is generated.
  const { data: inserted, error: insertError } = await supabase
    .from("receipt_records")
    .insert({
      student_id: studentId,
      application_id: appContext.applicationId,
      program_id: appContext.programId,
      batch_id: appContext.batchId,
      receipt_number: receiptNumber,
      receipt_sequence: receiptSequence,
      student_name_snapshot: student.legal_full_name,
      student_number_snapshot: student.student_number,
      amount,
      payment_date: paymentDate,
      receipt_date: paymentDate,
      payment_method: paymentMethod,
      card_type: cardType,
      notes_type: notesType,
      pdf_storage_path: null,
      generated_by: profile.id,
      generated_at: now,
    })
    .select("id")
    .single();

  if (insertError) {
    // 23505 is a unique violation. Distinguish the two unique constraints so
    // the admin gets a clear, specific message.
    if (insertError.code === "23505") {
      if (/student_sequence/i.test(insertError.message)) {
        return bad(
          `Receipt sequence ${receiptSequence} is already used for this student. Choose a different sequence.`,
          409
        );
      }
      if (/receipt_number/i.test(insertError.message)) {
        return bad(
          `Receipt number ${receiptNumber} already exists. Choose a different sequence.`,
          409
        );
      }
      return bad("This receipt would duplicate an existing record.", 409);
    }
    if (
      insertError.code === "42P01" ||
      /receipt_records/i.test(insertError.message ?? "")
    ) {
      return bad(
        "Receipt records are not available in this environment yet. Apply the finance receipt migration first.",
        503
      );
    }
    console.error("Receipt insert error:", insertError.message);
    return bad("Could not save the receipt record.", 500);
  }

  // Generate the PDF. If generation fails, remove the just-inserted record so
  // we do not leave an orphan metadata row with no downloadable PDF. (Permanent
  // storage and a re-download path arrive in FINANCE-07.)
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateReceiptPdf({
      receiptNumber,
      studentName: student.legal_full_name,
      studentNumber: student.student_number,
      programInformation: appContext.programName ?? "",
      amountPaid: amount,
      paymentDate,
      paymentMethod,
      notesType,
      signatureVariant,
    });
  } catch (err) {
    console.error("Receipt PDF generation failed:", err);
    if (inserted?.id) {
      await supabase.from("receipt_records").delete().eq("id", inserted.id);
    }
    return bad(
      "The receipt PDF could not be generated. No receipt was saved. Please try again.",
      500
    );
  }

  // Upload the generated PDF to the private receipt-documents bucket. The path
  // is student-linked and uses the receipt number as a safe file name. upsert is
  // false so an existing receipt PDF is never silently overwritten; a conflict
  // fails clearly. On any upload failure the reserved record is rolled back.
  const storagePath = `${studentId}/receipts/${receiptNumber}.pdf`;
  const uploadBody = new Uint8Array(pdfBytes);
  const { error: uploadError } = await supabase.storage
    .from(RECEIPT_STORAGE_BUCKET)
    .upload(storagePath, uploadBody, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    if (inserted?.id) {
      await supabase.from("receipt_records").delete().eq("id", inserted.id);
    }
    const message = uploadError.message ?? "";
    if (/bucket not found/i.test(message)) {
      return bad(
        "The receipt-documents storage bucket does not exist yet. Create the private receipt-documents bucket in Supabase first. No receipt was saved.",
        503
      );
    }
    if (/exists|duplicate|already/i.test(message)) {
      return bad(
        `A stored receipt PDF already exists at ${storagePath}. No receipt was saved. Choose a different sequence.`,
        409
      );
    }
    console.error("Receipt PDF upload failed:", message);
    return bad(
      "The receipt PDF could not be stored. No receipt was saved. Please try again.",
      500
    );
  }

  // Link the stored file to the record. If this update fails the PDF is already
  // in storage, so remove it and the record to avoid an orphan file and a
  // receipt with a missing storage path.
  const { error: pathError } = await supabase
    .from("receipt_records")
    .update({ pdf_storage_path: storagePath })
    .eq("id", inserted.id);

  if (pathError) {
    await supabase.storage.from(RECEIPT_STORAGE_BUCKET).remove([storagePath]);
    await supabase.from("receipt_records").delete().eq("id", inserted.id);
    console.error("Receipt storage path update failed:", pathError.message);
    return bad(
      "The receipt PDF was stored but could not be linked to its record. No receipt was saved. Please try again.",
      500
    );
  }

  revalidatePath("/dashboard/admin-tools/finance/receipts");

  const fileName = `${receiptNumber}.pdf`;
  // Copy into a clean ArrayBuffer-backed body for the response.
  const responseBytes = new Uint8Array(pdfBytes);
  return new NextResponse(responseBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "X-Receipt-Number": receiptNumber,
    },
  });
}
