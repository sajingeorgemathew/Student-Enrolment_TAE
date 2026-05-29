"use client";

import { useActionState, useState, useEffect, useCallback } from "react";
import { saveFeeSchedule, approveFeeSchedule, reopenFeeSchedule } from "@/features/fees/actions";
import type { FeeFormState } from "@/features/fees/actions";
import { useRouter } from "next/navigation";

interface FeeSchedule {
  id: string;
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
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  quote_id: string | null;
}

interface Installment {
  id: string;
  installment_number: number;
  due_date: string | null;
  amount_due: number;
  notes: string | null;
}

interface ProgramDefaults {
  default_tuition: number | null;
  default_book_fee: number | null;
  default_compulsory_fee: number | null;
  default_professional_exam_fee: number | null;
}

interface Props {
  applicationId: string;
  quoteId: string | null;
  feeSchedule: FeeSchedule | null;
  installments: Installment[];
  programDefaults: ProgramDefaults | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const initialState: FeeFormState = { success: false };

const feeFields = [
  { name: "tuition_fee", label: "Tuition Fee" },
  { name: "book_fee", label: "Book Fee" },
  { name: "compulsory_fee", label: "Compulsory Fee" },
  { name: "field_trip_fee", label: "Field Trip Fee" },
  { name: "uniform_equipment_fee", label: "Uniform / Equipment Fee" },
  { name: "professional_exam_fee", label: "Professional Exam Fee" },
  { name: "expendable_supplies_fee", label: "Expendable Supplies Fee" },
  { name: "international_fee", label: "International Fee" },
  { name: "optional_fee", label: "Optional Fee" },
] as const;

type FeeFieldName = (typeof feeFields)[number]["name"];

function getDefaultValue(
  field: FeeFieldName,
  feeSchedule: FeeSchedule | null,
  programDefaults: ProgramDefaults | null
): number {
  if (feeSchedule) return Number(feeSchedule[field]) || 0;
  if (!programDefaults) return 0;
  const mapping: Partial<Record<FeeFieldName, keyof ProgramDefaults>> = {
    tuition_fee: "default_tuition",
    book_fee: "default_book_fee",
    compulsory_fee: "default_compulsory_fee",
    professional_exam_fee: "default_professional_exam_fee",
  };
  const key = mapping[field];
  if (key) return Number(programDefaults[key]) || 0;
  return 0;
}

export function FeeCalculatorForm({
  applicationId,
  quoteId,
  feeSchedule,
  installments,
  programDefaults,
  onSuccess,
  onCancel,
}: Props) {
  const [state, formAction, pending] = useActionState(
    saveFeeSchedule,
    initialState
  );
  const router = useRouter();
  const isApproved = feeSchedule?.status === "approved";
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  const initFees = useCallback((): Record<FeeFieldName, number> => {
    const result = {} as Record<FeeFieldName, number>;
    for (const f of feeFields) {
      result[f.name] = getDefaultValue(f.name, feeSchedule, programDefaults);
    }
    return result;
  }, [feeSchedule, programDefaults]);

  const [fees, setFees] = useState<Record<FeeFieldName, number>>(initFees);
  const [discount, setDiscount] = useState(
    Number(feeSchedule?.discount_amount) || 0
  );
  const [paymentBefore, setPaymentBefore] = useState(
    Number(feeSchedule?.payment_before_signing) || 0
  );
  const [numInstallments, setNumInstallments] = useState(
    Number(feeSchedule?.number_of_installments) || 0
  );
  const [firstDueDate, setFirstDueDate] = useState(
    installments[0]?.due_date ?? ""
  );
  const [frequency, setFrequency] = useState("monthly");

  const totalFees =
    Object.values(fees).reduce((s, v) => s + v, 0) - discount;
  const remainingBalance = totalFees - paymentBefore;
  const installmentAmount =
    numInstallments > 0
      ? Math.round((remainingBalance / numInstallments) * 100) / 100
      : 0;

  const generatedInstallments = [];
  for (let i = 0; i < numInstallments; i++) {
    let dueDate = "";
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
    const amount =
      i === numInstallments - 1
        ? Math.round(
            (remainingBalance - installmentAmount * (numInstallments - 1)) * 100
          ) / 100
        : installmentAmount;
    generatedInstallments.push({ number: i + 1, dueDate, amount });
  }

  const installmentTotal = generatedInstallments.reduce(
    (s, inst) => s + inst.amount,
    0
  );
  const mismatch =
    numInstallments > 0 &&
    remainingBalance > 0 &&
    Math.abs(installmentTotal - remainingBalance) > 0.02;

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
      router.refresh();
    }
  }, [state.success, router, onSuccess]);

  async function handleApprove() {
    if (!feeSchedule) return;
    setApproving(true);
    setApproveError(null);
    const result = await approveFeeSchedule(feeSchedule.id, applicationId);
    setApproving(false);
    if (!result.success) {
      setApproveError(result.error ?? "Approval failed.");
    } else {
      onSuccess?.();
      router.refresh();
    }
  }

  async function handleReopen() {
    if (!feeSchedule) return;
    setApproving(true);
    setApproveError(null);
    const result = await reopenFeeSchedule(feeSchedule.id, applicationId);
    setApproving(false);
    if (!result.success) {
      setApproveError(result.error ?? "Could not reopen fee schedule.");
    } else {
      onSuccess?.();
      router.refresh();
    }
  }

  const inputClass =
    "mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none disabled:bg-zinc-50 disabled:text-zinc-500";
  const labelClass = "block text-sm font-medium text-zinc-700";

  function fmt(val: number): string {
    return val.toLocaleString("en-CA", { minimumFractionDigits: 2 });
  }

  if (isApproved) {
    return (
      <div className="space-y-6">
        {approveError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-800">{approveError}</p>
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Approved
          </span>
          {feeSchedule.approved_at && (
            <span className="text-xs text-zinc-500">
              {new Date(feeSchedule.approved_at).toLocaleDateString("en-CA")}
            </span>
          )}
          <button
            type="button"
            disabled={approving}
            onClick={handleReopen}
            className="inline-flex items-center rounded-md border border-amber-600 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {approving ? "Processing..." : "Reopen for Correction"}
          </button>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">
            Fee Breakdown
          </h3>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {feeFields.map((f) => (
              <div key={f.name}>
                <dt className="text-xs font-medium text-zinc-500">{f.label}</dt>
                <dd className="mt-0.5 text-sm text-zinc-900">
                  ${fmt(Number(feeSchedule[f.name]) || 0)}
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-xs font-medium text-zinc-500">Discount</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">
                ${fmt(Number(feeSchedule.discount_amount) || 0)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-zinc-200 pt-4">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold text-zinc-700">
                Total Fees
              </dt>
              <dd className="mt-0.5 text-base font-semibold text-zinc-900">
                ${fmt(Number(feeSchedule.total_fees) || 0)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">
                Payment Before Signing
              </dt>
              <dd className="mt-0.5 text-sm text-zinc-900">
                ${fmt(Number(feeSchedule.payment_before_signing) || 0)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-zinc-700">
                Remaining Balance
              </dt>
              <dd className="mt-0.5 text-base font-semibold text-zinc-900">
                ${fmt(Number(feeSchedule.remaining_balance) || 0)}
              </dd>
            </div>
          </dl>
        </div>

        {installments.length > 0 && (
          <div className="border-t border-zinc-200 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">
              Payment Installments
            </h3>
            <div className="overflow-hidden rounded-md border border-zinc-200">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      #
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Due Date
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {installments.map((inst) => (
                    <tr key={inst.id}>
                      <td className="px-4 py-2.5 text-sm text-zinc-900">
                        {inst.installment_number}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-zinc-900">
                        {inst.due_date
                          ? new Date(
                              inst.due_date + "T00:00:00"
                            ).toLocaleDateString("en-CA")
                          : "--"}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm text-zinc-900">
                        ${fmt(Number(inst.amount_due))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {onCancel && (
          <div className="flex justify-end border-t border-zinc-200 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="application_id" value={applicationId} />
      {feeSchedule && (
        <input type="hidden" name="fee_schedule_id" value={feeSchedule.id} />
      )}
      {quoteId && <input type="hidden" name="quote_id" value={quoteId} />}

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">{state.error}</p>
        </div>
      )}

      {state.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-medium text-green-800">
            Fee schedule saved as draft.
          </p>
        </div>
      )}

      {approveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">{approveError}</p>
        </div>
      )}

      {feeSchedule && (
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              feeSchedule.status === "draft"
                ? "bg-zinc-100 text-zinc-700"
                : feeSchedule.status === "admin_review"
                  ? "bg-amber-100 text-amber-800"
                  : feeSchedule.status === "reopened"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {feeSchedule.status === "draft"
              ? "Draft"
              : feeSchedule.status === "admin_review"
                ? "Admin Review"
                : feeSchedule.status === "reopened"
                  ? "Reopened"
                  : feeSchedule.status}
          </span>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">
          Fee Breakdown
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {feeFields.map((f) => (
            <div key={f.name}>
              <label htmlFor={f.name} className={labelClass}>
                {f.label}
              </label>
              <input
                id={f.name}
                name={f.name}
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={fees[f.name]}
                onChange={(e) =>
                  setFees((prev) => ({
                    ...prev,
                    [f.name]: Number(e.target.value) || 0,
                  }))
                }
              />
              {state.fieldErrors?.[f.name] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors[f.name][0]}
                </p>
              )}
            </div>
          ))}
          <div>
            <label htmlFor="discount_amount" className={labelClass}>
              Discount Amount
            </label>
            <input
              id="discount_amount"
              name="discount_amount"
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold text-zinc-700">Total Fees</dt>
            <dd
              className={`mt-0.5 text-lg font-semibold ${totalFees < 0 ? "text-red-600" : "text-zinc-900"}`}
            >
              ${fmt(totalFees)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">
              Payment Before Signing
            </dt>
            <dd className="mt-0.5 text-lg text-zinc-900">
              ${fmt(paymentBefore)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-zinc-700">
              Remaining Balance
            </dt>
            <dd
              className={`mt-0.5 text-lg font-semibold ${remainingBalance < 0 ? "text-red-600" : "text-zinc-900"}`}
            >
              ${fmt(remainingBalance)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-zinc-200 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">
          Payment Settings
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="payment_before_signing" className={labelClass}>
              Payment Before Signing ($)
            </label>
            <input
              id="payment_before_signing"
              name="payment_before_signing"
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              value={paymentBefore}
              onChange={(e) => setPaymentBefore(Number(e.target.value) || 0)}
            />
            {state.fieldErrors?.payment_before_signing && (
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.payment_before_signing[0]}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="number_of_installments" className={labelClass}>
              Number of Installments
            </label>
            <input
              id="number_of_installments"
              name="number_of_installments"
              type="number"
              step="1"
              min="0"
              className={inputClass}
              value={numInstallments}
              onChange={(e) =>
                setNumInstallments(Math.floor(Number(e.target.value) || 0))
              }
            />
            {state.fieldErrors?.number_of_installments && (
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.number_of_installments[0]}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="first_installment_due_date" className={labelClass}>
              First Installment Due Date
            </label>
            <input
              id="first_installment_due_date"
              name="first_installment_due_date"
              type="date"
              className={inputClass}
              value={firstDueDate}
              onChange={(e) => setFirstDueDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="installment_frequency" className={labelClass}>
              Installment Frequency
            </label>
            <select
              id="installment_frequency"
              name="installment_frequency"
              className={inputClass}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </div>

      {numInstallments > 0 && remainingBalance > 0 && (
        <div className="border-t border-zinc-200 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">
            Generated Installments
          </h3>
          {mismatch && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                Installment total does not match remaining balance.
              </p>
            </div>
          )}
          <div className="overflow-hidden rounded-md border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    #
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Due Date
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {generatedInstallments.map((inst) => (
                  <tr key={inst.number}>
                    <td className="px-4 py-2.5 text-sm text-zinc-900">
                      {inst.number}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-zinc-900">
                      {inst.dueDate
                        ? new Date(
                            inst.dueDate + "T00:00:00"
                          ).toLocaleDateString("en-CA")
                        : "--"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm text-zinc-900">
                      ${fmt(inst.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-50">
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-2.5 text-sm font-semibold text-zinc-700"
                  >
                    Total
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold text-zinc-700">
                    ${fmt(installmentTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
        <div>
          {feeSchedule && (feeSchedule.status === "draft" || feeSchedule.status === "reopened") && (
            <button
              type="button"
              disabled={approving || pending}
              onClick={handleApprove}
              className="inline-flex items-center rounded-md border border-green-600 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
            >
              {approving ? "Approving..." : "Approve Fee Schedule"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save Draft"}
          </button>
        </div>
      </div>
    </form>
  );
}
