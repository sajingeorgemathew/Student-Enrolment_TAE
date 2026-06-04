import Link from "next/link";
import { Download, ExternalLink, Plus } from "lucide-react";
import type { ReceiptRecord, StudentReceiptSummary } from "./actions";

// FINANCE-10: student hub receipt summary section.
//
// Read-only summary of one student's receipts. The section is rendered for all
// roles (receipt_records select RLS allows all staff to read). Only
// admin/super_admin get the download, Generate Receipt, and registry links.
// Edit, hard delete, void, and regenerate stay in the Finance module only.

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
  }).format(Number(value) || 0);
}

const th =
  "px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500";

export function StudentReceiptSummarySection({
  studentId,
  summary,
  isAdmin,
}: {
  studentId: string;
  summary: StudentReceiptSummary;
  // Admin/super_admin. Controls download, Generate Receipt, and registry links.
  isAdmin: boolean;
}) {
  const { recent, latest, totalCount, totalAmount, tableMissing } = summary;

  const generateHref = `/dashboard/admin-tools/finance/receipts/new?studentId=${studentId}`;
  const registryHref = `/dashboard/admin-tools/finance/receipts?studentId=${studentId}`;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-zinc-900">Receipts</h2>
          {!tableMissing && totalCount > 0 && (
            <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
              {totalCount} {totalCount === 1 ? "receipt" : "receipts"}
            </span>
          )}
        </div>
        {isAdmin && !tableMissing && (
          <Link
            href={registryHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View all in Finance
          </Link>
        )}
      </div>

      <div className="px-6 py-5">
        {tableMissing ? (
          <div className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center">
            <p className="text-sm text-zinc-500">
              Receipt records are not available in this environment yet.
            </p>
          </div>
        ) : (
          <>
            {/* Totals */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SummaryStat label="Total receipts" value={String(totalCount)} />
              <SummaryStat
                label="Total receipted amount"
                value={formatAmount(totalAmount)}
              />
              <SummaryStat
                label="Latest receipt"
                value={latest ? latest.receipt_number : "--"}
              />
            </div>

            {/* Latest receipt detail */}
            {latest && (
              <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Latest receipt
                </p>
                <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
                  <MiniField
                    label="Receipt No"
                    value={latest.receipt_number}
                  />
                  <MiniField
                    label="Payment date"
                    value={formatDate(latest.payment_date)}
                  />
                  <MiniField
                    label="Amount"
                    value={formatAmount(latest.amount)}
                  />
                  <MiniField
                    label="Method"
                    value={
                      paymentMethodLabels[latest.payment_method] ??
                      latest.payment_method
                    }
                  />
                </div>
                {latest.voided_at && (
                  <p className="mt-2 text-xs font-medium text-red-700">
                    This receipt is voided and is excluded from the total
                    receipted amount.
                  </p>
                )}
              </div>
            )}

            {/* Recent receipts list */}
            <div className="mt-5">
              <h3 className="mb-3 text-sm font-medium text-zinc-700">
                Recent receipts
              </h3>
              {recent.length === 0 ? (
                <div className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center">
                  <p className="text-sm text-zinc-500">
                    No receipts have been generated for this student yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border border-zinc-200">
                  <table className="min-w-full divide-y divide-zinc-200">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className={th}>Receipt No</th>
                        <th className={th}>Payment Date</th>
                        <th className={th}>Amount</th>
                        <th className={th}>Method</th>
                        <th className={th}>Notes Type</th>
                        <th className={th}>Generated</th>
                        <th className={th}>Status</th>
                        <th className={th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {recent.map((r) => (
                        <ReceiptRow key={r.id} receipt={r} isAdmin={isAdmin} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Admin actions */}
            {isAdmin && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href={generateHref}
                  className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  <Plus className="h-4 w-4" />
                  Generate Receipt
                </Link>
                <Link
                  href={registryHref}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View all receipts in Finance
                </Link>
              </div>
            )}

            <p className="mt-4 text-xs text-zinc-400">
              Receipt generation, edit, and delete are managed in the Finance
              module.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function ReceiptRow({
  receipt,
  isAdmin,
}: {
  receipt: ReceiptRecord;
  isAdmin: boolean;
}) {
  const isVoided = Boolean(receipt.voided_at);
  const canDownload = isAdmin && Boolean(receipt.pdf_storage_path);

  return (
    <tr className="hover:bg-zinc-50">
      <td className="px-4 py-2.5 text-sm font-medium text-zinc-900">
        {receipt.receipt_number}
      </td>
      <td className="px-4 py-2.5 text-sm text-zinc-600">
        {formatDate(receipt.payment_date)}
      </td>
      <td className="px-4 py-2.5 text-sm text-zinc-700">
        {formatAmount(receipt.amount)}
      </td>
      <td className="px-4 py-2.5 text-sm text-zinc-600">
        {paymentMethodLabels[receipt.payment_method] ?? receipt.payment_method}
      </td>
      <td className="px-4 py-2.5 text-sm text-zinc-600">
        {notesTypeLabels[receipt.notes_type] ?? receipt.notes_type}
      </td>
      <td className="px-4 py-2.5">
        <div className="text-sm text-zinc-600">
          {formatDate(receipt.generated_at)}
        </div>
        {receipt.generated_by_name && (
          <div className="text-xs text-zinc-400">
            {receipt.generated_by_name}
          </div>
        )}
      </td>
      <td className="px-4 py-2.5">
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
      <td className="px-4 py-2.5">
        {canDownload ? (
          <a
            href={`/api/receipts/download?id=${receipt.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        ) : isAdmin ? (
          <span className="text-xs text-zinc-400">Download unavailable</span>
        ) : (
          <span className="text-xs text-zinc-400">--</span>
        )}
      </td>
    </tr>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 px-4 py-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-900">{value}</dd>
    </div>
  );
}
