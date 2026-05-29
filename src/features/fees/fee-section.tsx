"use client";

import { useState, useCallback, useEffect } from "react";
import { FeeCalculatorForm } from "./fee-calculator-form";
import { FeeApprovalControls } from "./fee-approval-controls";

interface FeeScheduleData {
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

interface InstallmentData {
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
  feeSchedule: FeeScheduleData | null;
  installments: InstallmentData[];
  programDefaults: ProgramDefaults | null;
  approvedByName: string | null;
  canEdit: boolean;
  isAdmin: boolean;
  isStudentArchived: boolean;
  priceDiscussed: number | null;
  depositDiscussed: number | null;
  showSalesInfo: boolean;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "--";
  return `$${Number(value).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`;
}

export function FeeSection({
  applicationId,
  feeSchedule,
  installments,
  programDefaults,
  approvedByName,
  canEdit,
  isAdmin,
  isStudentArchived,
  priceDiscussed,
  depositDiscussed,
  showSalesInfo,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = useCallback(() => {
    setIsEditing(false);
    setShowSuccess(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  const canShowEdit =
    canEdit && (!feeSchedule || feeSchedule.status !== "approved");

  if (isEditing) {
    return (
      <FeeCalculatorForm
        applicationId={applicationId}
        quoteId={feeSchedule?.quote_id ?? null}
        feeSchedule={feeSchedule}
        installments={installments}
        programDefaults={programDefaults}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  if (!feeSchedule && !canEdit) {
    return (
      <div className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center">
        <p className="text-sm text-zinc-500">No fee schedule created yet.</p>
      </div>
    );
  }

  return (
    <div>
      {showSuccess && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Fee schedule saved successfully.
        </div>
      )}

      {canShowEdit && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {feeSchedule ? "Edit" : "Create Fee Schedule"}
          </button>
        </div>
      )}

      {!feeSchedule ? (
        <div className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center">
          <p className="text-sm text-zinc-500">No fee schedule created yet.</p>
        </div>
      ) : (
        <>
          {showSalesInfo && (priceDiscussed != null || depositDiscussed != null) && (
            <div className="mb-4">
              <div className="text-xs text-zinc-500">
                {priceDiscussed != null && (
                  <span className="mr-4">
                    Price discussed: {formatCurrency(priceDiscussed)}
                  </span>
                )}
                {depositDiscussed != null && (
                  <span>
                    Deposit discussed: {formatCurrency(depositDiscussed)}
                  </span>
                )}
              </div>
            </div>
          )}

          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryField label="Tuition Fee" value={formatCurrency(feeSchedule.tuition_fee)} />
            <SummaryField label="Total Fees" value={formatCurrency(feeSchedule.total_fees)} />
            <SummaryField label="Discount" value={formatCurrency(feeSchedule.discount_amount)} />
            <SummaryField label="Payment Before Signing" value={formatCurrency(feeSchedule.payment_before_signing)} />
            <SummaryField label="Payment After Signing" value={formatCurrency(feeSchedule.payment_after_signing)} />
            <SummaryField label="Remaining Balance" value={formatCurrency(feeSchedule.remaining_balance)} />
            <SummaryField
              label="Number of Installments"
              value={
                feeSchedule.number_of_installments != null
                  ? String(feeSchedule.number_of_installments)
                  : null
              }
            />
          </dl>

          {installments.length > 0 && (
            <div className="mt-4 border-t border-zinc-100 pt-4">
              <h3 className="mb-3 text-sm font-medium text-zinc-700">
                Payment Installments
              </h3>
              <div className="overflow-x-auto rounded-md border border-zinc-200">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        No.
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Due Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Amount
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {installments.map((inst) => (
                      <tr key={inst.id}>
                        <td className="px-4 py-2 text-sm text-zinc-900">
                          {inst.installment_number}
                        </td>
                        <td className="px-4 py-2 text-sm text-zinc-600">
                          {inst.due_date
                            ? new Date(inst.due_date).toLocaleDateString("en-CA")
                            : "--"}
                        </td>
                        <td className="px-4 py-2 text-sm text-zinc-900">
                          {formatCurrency(inst.amount_due)}
                        </td>
                        <td className="px-4 py-2 text-sm text-zinc-500">
                          {inst.notes || "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isStudentArchived && (
            <FeeApprovalControls
              feeScheduleId={feeSchedule.id}
              applicationId={applicationId}
              status={feeSchedule.status}
              approvedBy={approvedByName}
              approvedAt={feeSchedule.approved_at}
              isAdmin={isAdmin}
            />
          )}
        </>
      )}
    </div>
  );
}

function SummaryField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm text-zinc-900">
        {value || <span className="text-zinc-400">--</span>}
      </dd>
    </div>
  );
}
