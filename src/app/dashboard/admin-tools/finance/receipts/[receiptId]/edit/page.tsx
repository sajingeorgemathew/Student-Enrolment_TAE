import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { getActiveReceiptSignatures } from "@/features/receipts/new-receipt-actions";
import {
  EditReceiptForm,
  type EditReceiptInitial,
} from "@/features/receipts/edit-receipt-form";

export default async function EditReceiptPage({
  params,
}: {
  params: Promise<{ receiptId: string }>;
}) {
  const profile = await getUserProfile();
  const isAdmin = isAdminOrSuper(profile?.role ?? null);

  if (!isAdmin) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Edit Receipt</h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Editing receipts is available to admin and super admin users only.
          </p>
        </div>
      </div>
    );
  }

  const { receiptId } = await params;
  const supabase = await createClient();

  const { data: receipt, error } = await supabase
    .from("receipt_records")
    .select(
      "id, student_id, receipt_number, receipt_sequence, student_name_snapshot, student_number_snapshot, amount, payment_date, receipt_date, payment_method, card_type, notes_type, signature_id, pdf_storage_path"
    )
    .eq("id", receiptId)
    .single();

  if (error) {
    if (error.code === "42P01" || /receipt_records/i.test(error.message ?? "")) {
      return (
        <div>
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-zinc-900">
              Edit Receipt
            </h1>
          </div>
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6">
            <p className="text-sm text-zinc-600">
              Receipt records are not available in this environment yet. Apply
              the finance receipt migration to enable editing.
            </p>
          </div>
        </div>
      );
    }
    notFound();
  }

  if (!receipt) {
    notFound();
  }

  const { signatures, tableMissing: signaturesTableMissing } =
    await getActiveReceiptSignatures();

  const initial: EditReceiptInitial = {
    id: receipt.id,
    studentId: receipt.student_id,
    studentName: receipt.student_name_snapshot,
    studentNumber: receipt.student_number_snapshot,
    receiptSequence: Number(receipt.receipt_sequence),
    amount: Number(receipt.amount),
    paymentDate: String(receipt.payment_date).split("T")[0],
    receiptDate: String(receipt.receipt_date).split("T")[0],
    paymentMethod: receipt.payment_method,
    cardType: receipt.card_type,
    notesType: receipt.notes_type,
    signatureId: receipt.signature_id ?? null,
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-zinc-500">
          <Link
            href="/dashboard/admin-tools/finance"
            className="hover:text-zinc-900"
          >
            Finance
          </Link>{" "}
          /{" "}
          <Link
            href="/dashboard/admin-tools/finance/receipts"
            className="hover:text-zinc-900"
          >
            Receipts
          </Link>{" "}
          / Edit
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          Edit Receipt
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Correct a wrong receipt. Saving regenerates the PDF and replaces the
          stored file. Current number: {receipt.receipt_number}
        </p>
      </div>

      <div className="max-w-3xl">
        <EditReceiptForm
          initial={initial}
          signatures={signatures}
          signaturesTableMissing={signaturesTableMissing}
        />
      </div>
    </div>
  );
}
