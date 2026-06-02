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
  type ReceiptSignatureImage,
  type ReceiptSignatureMimeType,
} from "@/lib/receipts/receipt-types";
import { SIGNATURE_STORAGE_BUCKET } from "@/lib/signatures/signature-constants";

// FINANCE-09: admin-only receipt edit and hard delete.
//
// PUT  - correct a wrong receipt: edit metadata and sequence, recalculate the
//        receipt number, regenerate the PDF, and replace the stored PDF. The
//        flow is ordered so a failure never leaves a half-corrected receipt:
//        validate -> regenerate PDF -> upload/replace stored PDF -> update
//        metadata. If PDF generation or upload fails, metadata is not changed.
//
// DELETE - hard delete a wrong receipt: remove the stored PDF first (so a row is
//        never left pointing at a deleted file by mistake), then delete the
//        receipt_records row, which frees the receipt number and the student
//        sequence for reuse. Requires a reason and a typed confirmation.

const RECEIPT_STORAGE_BUCKET = "receipt-documents";
const DELETE_CONFIRMATION = "DELETE RECEIPT";

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

// Load and validate a selected signature into embeddable bytes, mirroring the
// generate route. Returns either the image, undefined (no signature requested),
// or an error response to return to the caller.
async function resolveSignatureImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  signatureId: string | null
): Promise<
  | { ok: true; image: ReceiptSignatureImage | undefined }
  | { ok: false; response: NextResponse }
> {
  if (!signatureId) return { ok: true, image: undefined };

  const { data: signature, error: signatureError } = await supabase
    .from("admin_signatures")
    .select("id, storage_path, mime_type, is_active")
    .eq("id", signatureId)
    .single();

  if (signatureError) {
    if (
      signatureError.code === "42P01" ||
      /admin_signatures/i.test(signatureError.message ?? "")
    ) {
      return {
        ok: false,
        response: bad(
          "Signature records are not available in this environment yet. Save the receipt without a signature, or apply the admin signature migration first.",
          503
        ),
      };
    }
    if (signatureError.code === "PGRST116") {
      return { ok: false, response: bad("The selected signature could not be found.", 404) };
    }
    console.error("Signature lookup failed:", signatureError.message);
    return { ok: false, response: bad("Could not load the selected signature.", 500) };
  }
  if (!signature) {
    return { ok: false, response: bad("The selected signature could not be found.", 404) };
  }
  if (!signature.is_active) {
    return {
      ok: false,
      response: bad(
        "The selected signature is not active. Choose an active signature or save the receipt without one."
      ),
    };
  }
  if (signature.mime_type !== "image/png" && signature.mime_type !== "image/jpeg") {
    return {
      ok: false,
      response: bad(
        `The selected signature is a ${signature.mime_type} image, which cannot be overlaid on a receipt. Use a PNG or JPEG signature.`
      ),
    };
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from(SIGNATURE_STORAGE_BUCKET)
    .download(signature.storage_path);

  if (downloadError || !file) {
    console.error("Signature download failed:", downloadError?.message ?? "no file");
    return {
      ok: false,
      response: bad(
        "The selected signature image file is missing or could not be read. The receipt was not changed.",
        502
      ),
    };
  }

  return {
    ok: true,
    image: {
      bytes: new Uint8Array(await file.arrayBuffer()),
      mimeType: signature.mime_type as ReceiptSignatureMimeType,
    },
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  const profile = await getUserProfile();
  if (!profile) {
    return bad("Unauthorized.", 401);
  }
  if (!isAdminOrSuper(profile.role)) {
    return bad("Only admin or super admin users can edit receipts.", 403);
  }

  const { receiptId } = await params;
  if (!receiptId) {
    return bad("Missing receipt id.");
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  const studentId = typeof body.studentId === "string" ? body.studentId : "";
  if (!studentId) {
    return bad("Select a student for the receipt.");
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return bad("Enter a valid amount greater than zero.");
  }

  const paymentDate = typeof body.paymentDate === "string" ? body.paymentDate : "";
  if (!isValidDate(paymentDate)) {
    return bad("Enter a valid payment date.");
  }

  const receiptDate = typeof body.receiptDate === "string" ? body.receiptDate : "";
  if (!isValidDate(receiptDate)) {
    return bad("Enter a valid receipt date.");
  }

  const paymentMethod = body.paymentMethod as ReceiptPaymentMethod;
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return bad("Select a valid payment method.");
  }

  const notesType = body.notesType as ReceiptNotesType;
  if (!NOTES_TYPES.includes(notesType)) {
    return bad("Select a valid notes type.");
  }

  const signatureId =
    typeof body.signatureId === "string" && body.signatureId.trim() !== ""
      ? body.signatureId.trim()
      : null;

  let receiptSequence: number;
  if (
    body.receiptSequence !== undefined &&
    body.receiptSequence !== null &&
    body.receiptSequence !== ""
  ) {
    receiptSequence = Number(body.receiptSequence);
    if (!Number.isInteger(receiptSequence) || receiptSequence < 1) {
      return bad("Receipt sequence must be a whole number of 1 or more.");
    }
  } else {
    return bad("Enter a receipt sequence.");
  }

  const cardType = isCardPaymentMethod(paymentMethod) ? paymentMethod : null;

  const supabase = await createClient();

  // Load the existing receipt so we know the current stored PDF path and can
  // exclude it from the duplicate checks.
  const { data: existing, error: existingError } = await supabase
    .from("receipt_records")
    .select("id, pdf_storage_path")
    .eq("id", receiptId)
    .single();

  if (existingError || !existing) {
    if (
      existingError &&
      (existingError.code === "42P01" ||
        /receipt_records/i.test(existingError.message ?? ""))
    ) {
      return bad(
        "Receipt records are not available in this environment yet. Apply the finance receipt migration first.",
        503
      );
    }
    return bad("Receipt not found.", 404);
  }

  // Load the (possibly newly selected) student for snapshots and the number.
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
      "This student does not have a student number. Add a student number before editing the receipt."
    );
  }

  const receiptNumber = formatReceiptNumber(student.student_number, receiptSequence);

  // Duplicate checks, ignoring the record being edited so it can keep its own
  // current number and sequence. The unique constraints are still the final
  // guard; these pre-checks give clear, specific messages.
  const { data: numberClash } = await supabase
    .from("receipt_records")
    .select("id")
    .eq("receipt_number", receiptNumber)
    .neq("id", receiptId)
    .limit(1);
  if (numberClash && numberClash.length > 0) {
    return bad(
      `Receipt number ${receiptNumber} already exists on another receipt. Choose a different sequence.`,
      409
    );
  }

  const { data: sequenceClash } = await supabase
    .from("receipt_records")
    .select("id")
    .eq("student_id", studentId)
    .eq("receipt_sequence", receiptSequence)
    .neq("id", receiptId)
    .limit(1);
  if (sequenceClash && sequenceClash.length > 0) {
    return bad(
      `Receipt sequence ${receiptSequence} is already used for this student. Choose a different sequence.`,
      409
    );
  }

  const signatureResult = await resolveSignatureImage(supabase, signatureId);
  if (!signatureResult.ok) {
    return signatureResult.response;
  }

  const appContext = await resolveApplicationContext(supabase, studentId);

  // 1. Regenerate the PDF. If this fails, nothing has changed yet, so just
  // return the error and leave the receipt untouched. The receipt_date drives
  // the "Date of Receipt" line on the PDF.
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateReceiptPdf({
      receiptNumber,
      studentName: student.legal_full_name,
      studentNumber: student.student_number,
      programInformation: appContext.programName ?? "",
      amountPaid: amount,
      paymentDate: receiptDate,
      paymentMethod,
      notesType,
      signatureImage: signatureResult.image,
    });
  } catch (err) {
    console.error("Receipt PDF regeneration failed:", err);
    return bad(
      "The receipt PDF could not be generated. The receipt was not changed. Please try again.",
      500
    );
  }

  // 2. Upload/replace the stored PDF.
  const oldPath = existing.pdf_storage_path;
  const newPath = `${studentId}/receipts/${receiptNumber}.pdf`;
  const pathChanged = oldPath !== newPath;
  const uploadBody = new Uint8Array(pdfBytes);

  if (pathChanged) {
    // New number/path: upload the new file. upsert is false so we never silently
    // clobber another receipt's stored PDF; a real conflict fails clearly.
    const { error: uploadError } = await supabase.storage
      .from(RECEIPT_STORAGE_BUCKET)
      .upload(newPath, uploadBody, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (uploadError) {
      const message = uploadError.message ?? "";
      if (/bucket not found/i.test(message)) {
        return bad(
          "The receipt-documents storage bucket does not exist yet. Create the private receipt-documents bucket in Supabase first. The receipt was not changed.",
          503
        );
      }
      if (/exists|duplicate|already/i.test(message)) {
        return bad(
          `A stored receipt PDF already exists at ${newPath}. The receipt was not changed. Choose a different sequence.`,
          409
        );
      }
      console.error("Receipt PDF upload failed:", message);
      return bad(
        "The receipt PDF could not be stored. The receipt was not changed. Please try again.",
        500
      );
    }
  } else {
    // Same number/path: replace the existing file in place. upsert is supported
    // by the receipt-documents update policy, so the issued path stays stable.
    const { error: replaceError } = await supabase.storage
      .from(RECEIPT_STORAGE_BUCKET)
      .upload(newPath, uploadBody, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (replaceError) {
      const message = replaceError.message ?? "";
      if (/bucket not found/i.test(message)) {
        return bad(
          "The receipt-documents storage bucket does not exist yet. Create the private receipt-documents bucket in Supabase first. The receipt was not changed.",
          503
        );
      }
      console.error("Receipt PDF replace failed:", message);
      return bad(
        "The receipt PDF could not be stored. The receipt was not changed. Please try again.",
        500
      );
    }
  }

  // 3. Update the metadata. signature_id is only set when the FINANCE-08 column
  // is available; sending it always could fail on environments without it, so
  // we update it but fall back to a retry without it on the unknown-column code.
  const updatePayload: Record<string, unknown> = {
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
    receipt_date: receiptDate,
    payment_method: paymentMethod,
    card_type: cardType,
    notes_type: notesType,
    signature_id: signatureId,
    pdf_storage_path: newPath,
  };

  let { error: updateError } = await supabase
    .from("receipt_records")
    .update(updatePayload)
    .eq("id", receiptId);

  if (
    updateError &&
    (updateError.code === "42703" || /signature_id/i.test(updateError.message ?? ""))
  ) {
    // Environment without the FINANCE-08 signature_id column: retry without it.
    const { signature_id: _omit, ...withoutSignature } = updatePayload;
    void _omit;
    ({ error: updateError } = await supabase
      .from("receipt_records")
      .update(withoutSignature)
      .eq("id", receiptId));
  }

  if (updateError) {
    // Roll back a newly uploaded file so we do not leave an orphan. For the
    // same-path replace case the file was overwritten in place and the metadata
    // still describes the previous values; we report the error so the admin can
    // retry rather than silently accept a mismatch.
    if (pathChanged) {
      await supabase.storage.from(RECEIPT_STORAGE_BUCKET).remove([newPath]);
    }
    if (updateError.code === "23505") {
      if (/student_sequence/i.test(updateError.message)) {
        return bad(
          `Receipt sequence ${receiptSequence} is already used for this student. Choose a different sequence.`,
          409
        );
      }
      if (/receipt_number/i.test(updateError.message)) {
        return bad(
          `Receipt number ${receiptNumber} already exists. Choose a different sequence.`,
          409
        );
      }
      return bad("This edit would duplicate an existing record.", 409);
    }
    console.error("Receipt update error:", updateError.message);
    return bad("Could not save the receipt changes. Please try again.", 500);
  }

  // 4. Metadata is saved. If the path changed, delete the old stored PDF. A
  // failure here only leaves an orphan file, not a broken receipt, so the edit
  // still succeeds and we surface a warning.
  let warning: string | undefined;
  if (pathChanged && oldPath) {
    const { error: removeError } = await supabase.storage
      .from(RECEIPT_STORAGE_BUCKET)
      .remove([oldPath]);
    if (removeError) {
      console.error("Old receipt PDF cleanup failed:", removeError.message);
      warning = `The receipt was updated, but the previous PDF at ${oldPath} could not be deleted. Remove it manually if needed.`;
    }
  }

  revalidatePath("/dashboard/admin-tools/finance/receipts");
  revalidatePath(`/dashboard/admin-tools/finance/receipts/${receiptId}/edit`);

  return NextResponse.json({
    ok: true,
    receiptId,
    receiptNumber,
    ...(warning ? { warning } : {}),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  const profile = await getUserProfile();
  if (!profile) {
    return bad("Unauthorized.", 401);
  }
  if (!isAdminOrSuper(profile.role)) {
    return bad("Only admin or super admin users can delete receipts.", 403);
  }

  const { receiptId } = await params;
  if (!receiptId) {
    return bad("Missing receipt id.");
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  const reason =
    typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return bad("A reason for deletion is required.");
  }

  const confirmation =
    typeof body.confirmation === "string" ? body.confirmation : "";
  if (confirmation !== DELETE_CONFIRMATION) {
    return bad(`Type ${DELETE_CONFIRMATION} to confirm the hard delete.`);
  }

  const supabase = await createClient();

  const { data: receipt, error: receiptError } = await supabase
    .from("receipt_records")
    .select("id, receipt_number, pdf_storage_path")
    .eq("id", receiptId)
    .single();

  if (receiptError || !receipt) {
    if (
      receiptError &&
      (receiptError.code === "42P01" ||
        /receipt_records/i.test(receiptError.message ?? ""))
    ) {
      return bad(
        "Receipt records are not available in this environment yet. Apply the finance receipt migration first.",
        503
      );
    }
    return bad("Receipt not found.", 404);
  }

  // There is no receipt audit table in this ticket, so the deletion reason is
  // logged for traceability rather than stored.
  console.info(
    `Receipt hard delete: ${receipt.receipt_number} (id ${receipt.id}) by ${profile.id}. Reason: ${reason}`
  );

  // Delete the row first, which frees the receipt number and the student
  // sequence. We .select() the deleted rows back: under RLS a delete that no
  // policy permits affects zero rows and returns NO error, so checking only
  // `deleteError` would let us falsely report success while the row survives.
  // Verifying a row actually came back is the real proof the delete happened.
  const { data: deletedRows, error: deleteError } = await supabase
    .from("receipt_records")
    .delete()
    .eq("id", receiptId)
    .select("id");

  if (deleteError) {
    console.error("Receipt delete failed:", deleteError.message);
    return bad(
      "The receipt record could not be deleted. Please try again.",
      500
    );
  }

  if (!deletedRows || deletedRows.length === 0) {
    // No error but nothing deleted: RLS blocked the delete (the receipt_records
    // delete policy is missing in this environment) or the row vanished between
    // the lookup and the delete. Do NOT claim success.
    console.error(
      `Receipt delete affected 0 rows for id ${receiptId}. The receipt_records delete policy is likely missing; apply the FINANCE-09 migration.`
    );
    return bad(
      "The receipt could not be deleted. Deleting receipt records is not permitted in this environment yet. Apply the FINANCE-09 receipt delete policy migration in Supabase, then try again.",
      500
    );
  }

  // The row is gone, so the receipt number and sequence are already free for
  // reuse. Clean up the stored PDF as a best-effort step: a missing file or a
  // storage error now only leaves an orphan file, never a broken/half-deleted
  // receipt, so we surface it as a warning instead of failing the delete.
  let warning: string | undefined;
  if (receipt.pdf_storage_path) {
    const { error: removeError } = await supabase.storage
      .from(RECEIPT_STORAGE_BUCKET)
      .remove([receipt.pdf_storage_path]);
    if (removeError) {
      console.error("Receipt PDF cleanup failed:", removeError.message);
      warning = `The receipt record was deleted, but its stored PDF at ${receipt.pdf_storage_path} could not be removed. Delete it manually if needed.`;
    }
  }

  revalidatePath("/dashboard/admin-tools/finance/receipts");
  revalidatePath(`/dashboard/admin-tools/finance/receipts/${receiptId}/edit`);

  return NextResponse.json({
    ok: true,
    receiptId,
    receiptNumber: receipt.receipt_number,
    ...(warning ? { warning } : {}),
  });
}
