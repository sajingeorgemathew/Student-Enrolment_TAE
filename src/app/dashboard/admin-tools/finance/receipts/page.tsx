import Link from "next/link";
import { Receipt, Plus } from "lucide-react";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { getReceiptRecords } from "@/features/receipts/actions";
import { ReceiptFilters } from "@/features/receipts/receipt-filters";
import { ReceiptRowActions } from "@/features/receipts/receipt-row-actions";

const paymentMethodLabels: Record<string, string> = {
  cash: "Cash",
  e_transfer: "E-transfer",
  debit: "Debit",
  master_card: "Master Card",
  visa: "Visa",
  amex: "Amex",
  paypal: "Paypal",
  cheque_bank_draft: "Cheque / Bank draft",
};

const notesTypeLabels: Record<string, string> = {
  enrolment_fee: "Enrolment fee",
  installment_payment: "Installment payment",
  late_fee_payment_installment_payment: "Late fee / Installment payment",
};

function formatDate(value: string | null): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-CA");
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(value);
}

const th =
  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500";

export default async function ReceiptRegistryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const profile = await getUserProfile();
  const isAdmin = isAdminOrSuper(profile?.role ?? null);

  if (!isAdmin) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Receipt Registry
          </h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            The Receipt Registry is available to admin and super admin users
            only.
          </p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const pick = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : undefined;

  const filters = {
    receiptNumber: pick("receiptNumber"),
    studentName: pick("studentName"),
    studentNumber: pick("studentNumber"),
    paymentMethod: pick("paymentMethod"),
    notesType: pick("notesType"),
    voidStatus: pick("voidStatus"),
  };

  const hasFilters = Object.values(filters).some(Boolean);
  const { records, tableMissing } = await getReceiptRecords(filters);

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">
            <Link
              href="/dashboard/admin-tools/finance"
              className="hover:text-zinc-900"
            >
              Finance
            </Link>{" "}
            / Receipts
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            Receipt Registry
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Generated receipt records across all students
          </p>
        </div>
        <Link
          href="/dashboard/admin-tools/finance/receipts/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          New Receipt
        </Link>
      </div>

      <div className="mb-6">
        <ReceiptFilters />
      </div>

      {tableMissing ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white py-16">
          <Receipt className="mb-3 h-10 w-10 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-600">
            Receipt records are not available yet
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            The receipt_records table has not been set up in this environment.
            Apply the finance receipt migration to enable the registry.
          </p>
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white py-16">
          <Receipt className="mb-3 h-10 w-10 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-600">
            {hasFilters
              ? "No receipts match your filters"
              : "No receipt records yet"}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {hasFilters
              ? "Try adjusting or clearing your filters"
              : "Receipts will appear here once they are generated"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className={th}>Receipt No</th>
                  <th className={th}>Student</th>
                  <th className={th}>Student No</th>
                  <th className={th}>Amount</th>
                  <th className={th}>Payment Date</th>
                  <th className={th}>Receipt Date</th>
                  <th className={th}>Method</th>
                  <th className={th}>Notes Type</th>
                  <th className={th}>Generated</th>
                  <th className={th}>Status</th>
                  <th className={th}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {records.map((r) => {
                  const isVoided = Boolean(r.voided_at);
                  return (
                    <tr key={r.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                        {r.receipt_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-700">
                        {r.student_name_snapshot}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {r.student_number_snapshot}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-700">
                        {formatAmount(r.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {formatDate(r.payment_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {formatDate(r.receipt_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {paymentMethodLabels[r.payment_method] ??
                          r.payment_method}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {notesTypeLabels[r.notes_type] ?? r.notes_type}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-zinc-600">
                          {formatDate(r.generated_at)}
                        </div>
                        {r.generated_by_name && (
                          <div className="text-xs text-zinc-400">
                            {r.generated_by_name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isVoided ? (
                          <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            Voided
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ReceiptRowActions
                          receiptId={r.id}
                          receiptNumber={r.receipt_number}
                          hasPdf={Boolean(r.pdf_storage_path)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
