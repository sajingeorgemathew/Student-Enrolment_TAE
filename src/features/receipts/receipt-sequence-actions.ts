"use server";

import { revalidatePath } from "next/cache";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { generateReceiptPdf } from "@/lib/receipts/generate-receipt-pdf";
import { formatReceiptNumber } from "@/lib/receipts/receipt-formatters";
import type {
  ReceiptNotesType,
  ReceiptPaymentMethod,
  ReceiptSignatureImage,
} from "@/lib/receipts/receipt-types";
import { SIGNATURE_STORAGE_BUCKET } from "@/lib/signatures/signature-constants";

// FINANCE-11: admin-only receipt sequence correction.
//
// Changes only receipt_sequence and receipt_number (plus the stored PDF path
// that is keyed by the number). Student, application, amount, dates, payment
// method, notes, and signature stay exactly as issued.
//
// The receipt number is printed on the PDF and the stored file path is built
// from it, so the PDF is regenerated from the stored snapshot values and
// re-uploaded. The flow mirrors the FINANCE-09 PUT route so a failure never
// leaves a half-corrected receipt:
// validate -> regenerate PDF -> upload new PDF -> update row -> delete old PDF.

const RECEIPT_STORAGE_BUCKET = "receipt-documents";
const DUPLICATE_MESSAGE = "This receipt number is already used";

export type UpdateReceiptSequenceResult =
  | { ok: true; receiptNumber: string; receiptSequence: number; warning?: string }
  | { ok: false; error: string };

type ReceiptRow = {
  id: string;
  student_id: string;
  receipt_number: string;
  receipt_sequence: number;
  student_name_snapshot: string;
  student_number_snapshot: string;
  amount: number | string;
  receipt_date: string;
  payment_method: ReceiptPaymentMethod;
  notes_type: ReceiptNotesType;
  pdf_storage_path: string | null;
  signature_id?: string | null;
};

const RECEIPT_COLUMNS =
  "id, student_id, receipt_number, receipt_sequence, student_name_snapshot, student_number_snapshot, amount, receipt_date, payment_method, notes_type, pdf_storage_path";

async function loadReceipt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  receiptId: string
): Promise<{ receipt: ReceiptRow | null; tableMissing: boolean }> {
  // signature_id comes from the FINANCE-08 migration. Fall back to a select
  // without it on environments where the column does not exist yet.
  let { data, error } = await supabase
    .from("receipt_records")
    .select(`${RECEIPT_COLUMNS}, signature_id`)
    .eq("id", receiptId)
    .single();

  if (error && (error.code === "42703" || /signature_id/i.test(error.message ?? ""))) {
    ({ data, error } = await supabase
      .from("receipt_records")
      .select(RECEIPT_COLUMNS)
      .eq("id", receiptId)
      .single());
  }

  if (error) {
    const tableMissing =
      error.code === "42P01" || /receipt_records/i.test(error.message ?? "");
    return { receipt: null, tableMissing };
  }
  return { receipt: (data as ReceiptRow | null) ?? null, tableMissing: false };
}

// Load the signature already attached to the receipt so the regenerated PDF
// looks the same as the issued one. Unlike a new or edited receipt, the
// signature does not have to be active: it was valid when the receipt was
// issued and only the number is changing.
async function loadIssuedSignature(
  supabase: Awaited<ReturnType<typeof createClient>>,
  signatureId: string | null | undefined
): Promise<
  { ok: true; image: ReceiptSignatureImage | undefined } | { ok: false; error: string }
> {
  if (!signatureId) return { ok: true, image: undefined };

  const { data: signature, error } = await supabase
    .from("admin_signatures")
    .select("id, storage_path, mime_type")
    .eq("id", signatureId)
    .single();

  if (error || !signature) {
    return {
      ok: false,
      error:
        "The signature on this receipt could not be loaded, so the PDF cannot be regenerated. The receipt was not changed.",
    };
  }
  if (signature.mime_type !== "image/png" && signature.mime_type !== "image/jpeg") {
    return {
      ok: false,
      error: `The signature on this receipt is a ${signature.mime_type} image and cannot be overlaid. The receipt was not changed.`,
    };
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from(SIGNATURE_STORAGE_BUCKET)
    .download(signature.storage_path);

  if (downloadError || !file) {
    console.error("Signature download failed:", downloadError?.message ?? "no file");
    return {
      ok: false,
      error:
        "The signature image on this receipt is missing or could not be read. The receipt was not changed.",
    };
  }

  return {
    ok: true,
    image: {
      bytes: new Uint8Array(await file.arrayBuffer()),
      mimeType: signature.mime_type,
    },
  };
}

export async function updateReceiptSequence(
  receiptId: string,
  sequenceInput: number | string
): Promise<UpdateReceiptSequenceResult> {
  const profile = await getUserProfile();
  if (!profile) {
    return { ok: false, error: "Unauthorized." };
  }
  if (!isAdminOrSuper(profile.role)) {
    return {
      ok: false,
      error: "Only admin or super admin users can update receipt sequences.",
    };
  }

  if (typeof receiptId !== "string" || !receiptId) {
    return { ok: false, error: "Missing receipt id." };
  }

  const raw = String(sequenceInput ?? "").trim();
  const receiptSequence = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(receiptSequence) || receiptSequence < 1) {
    return { ok: false, error: "Receipt sequence must be a whole number of 1 or more." };
  }

  const supabase = await createClient();

  const { receipt, tableMissing } = await loadReceipt(supabase, receiptId);
  if (!receipt) {
    return {
      ok: false,
      error: tableMissing
        ? "Receipt records are not available in this environment yet. Apply the finance receipt migration first."
        : "Receipt not found.",
    };
  }
  if (!receipt.student_number_snapshot) {
    return {
      ok: false,
      error: "This receipt has no student number, so the receipt number cannot be recomputed.",
    };
  }

  // Recompute with the same helper and the same student number that is printed
  // on the receipt, so only the sequence part of the number changes.
  const receiptNumber = formatReceiptNumber(
    receipt.student_number_snapshot,
    receiptSequence
  );

  if (
    receiptNumber === receipt.receipt_number &&
    receiptSequence === Number(receipt.receipt_sequence)
  ) {
    return { ok: true, receiptNumber, receiptSequence };
  }

  // Duplicate checks within the existing unique scopes (receipt_number, and
  // student_id + receipt_sequence), excluding this receipt. A sequence freed by
  // another edit or a hard delete, including this receipt's original one, is
  // available again. The unique constraints remain the final guard.
  const { data: numberClash, error: numberClashError } = await supabase
    .from("receipt_records")
    .select("id")
    .eq("receipt_number", receiptNumber)
    .neq("id", receiptId)
    .limit(1);
  const { data: sequenceClash, error: sequenceClashError } = await supabase
    .from("receipt_records")
    .select("id")
    .eq("student_id", receipt.student_id)
    .eq("receipt_sequence", receiptSequence)
    .neq("id", receiptId)
    .limit(1);

  if (numberClashError || sequenceClashError) {
    console.error(
      "Receipt duplicate check failed:",
      numberClashError?.message ?? sequenceClashError?.message
    );
    return { ok: false, error: "Could not check for duplicate receipt numbers. Please try again." };
  }
  if ((numberClash && numberClash.length > 0) || (sequenceClash && sequenceClash.length > 0)) {
    return { ok: false, error: DUPLICATE_MESSAGE };
  }

  const signature = await loadIssuedSignature(supabase, receipt.signature_id);
  if (!signature.ok) {
    return { ok: false, error: signature.error };
  }

  // 1. Regenerate the PDF from the stored snapshot values. The receipt_date
  // drives the date lines, matching the generate and edit routes.
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateReceiptPdf({
      receiptNumber,
      studentName: receipt.student_name_snapshot,
      studentNumber: receipt.student_number_snapshot,
      // Program information is preprinted on the template and not overlaid.
      programInformation: "",
      amountPaid: Number(receipt.amount),
      paymentDate: String(receipt.receipt_date).split("T")[0],
      paymentMethod: receipt.payment_method,
      notesType: receipt.notes_type,
      signatureImage: signature.image,
    });
  } catch (err) {
    console.error("Receipt PDF regeneration failed:", err);
    return {
      ok: false,
      error: "The receipt PDF could not be generated. The receipt was not changed. Please try again.",
    };
  }

  // 2. Upload the PDF under the new number. upsert is false so another
  // receipt's stored file is never overwritten.
  const oldPath = receipt.pdf_storage_path;
  const newPath = `${receipt.student_id}/receipts/${receiptNumber}.pdf`;
  const pathChanged = oldPath !== newPath;

  const { error: uploadError } = await supabase.storage
    .from(RECEIPT_STORAGE_BUCKET)
    .upload(newPath, new Uint8Array(pdfBytes), {
      contentType: "application/pdf",
      upsert: !pathChanged,
    });
  if (uploadError) {
    const message = uploadError.message ?? "";
    if (/bucket not found/i.test(message)) {
      return {
        ok: false,
        error:
          "The receipt-documents storage bucket does not exist yet. The receipt was not changed.",
      };
    }
    if (/exists|duplicate|already/i.test(message)) {
      return { ok: false, error: DUPLICATE_MESSAGE };
    }
    console.error("Receipt PDF upload failed:", message);
    return {
      ok: false,
      error: "The receipt PDF could not be stored. The receipt was not changed. Please try again.",
    };
  }

  // 3. Update only the sequence, number, and stored path.
  const { error: updateError } = await supabase
    .from("receipt_records")
    .update({
      receipt_sequence: receiptSequence,
      receipt_number: receiptNumber,
      pdf_storage_path: newPath,
    })
    .eq("id", receiptId);

  if (updateError) {
    if (pathChanged) {
      await supabase.storage.from(RECEIPT_STORAGE_BUCKET).remove([newPath]);
    }
    if (updateError.code === "23505") {
      return { ok: false, error: DUPLICATE_MESSAGE };
    }
    console.error("Receipt sequence update error:", updateError.message);
    return { ok: false, error: "Could not update the receipt sequence. Please try again." };
  }

  // 4. Remove the old stored PDF. A failure only leaves an orphan file.
  let warning: string | undefined;
  if (pathChanged && oldPath) {
    const { error: removeError } = await supabase.storage
      .from(RECEIPT_STORAGE_BUCKET)
      .remove([oldPath]);
    if (removeError) {
      console.error("Old receipt PDF cleanup failed:", removeError.message);
      warning = `The previous PDF at ${oldPath} could not be deleted. Remove it manually if needed.`;
    }
  }

  revalidatePath("/dashboard/admin-tools/finance/receipts");
  revalidatePath(`/dashboard/admin-tools/finance/receipts/${receiptId}/edit`);
  revalidatePath(`/dashboard/students/${receipt.student_id}`);

  return { ok: true, receiptNumber, receiptSequence, ...(warning ? { warning } : {}) };
}
