"use client";

import { useState, useCallback, useEffect } from "react";
import { SalesIntakeForm } from "./sales-intake-form";

interface Program {
  id: string;
  program_code: string;
  program_name: string;
}

interface Batch {
  id: string;
  batch_name: string;
  batch_code: string | null;
  start_date: string | null;
}

interface Application {
  id: string;
  status: string;
  lead_source: string | null;
  program_id: string | null;
  batch_id: string | null;
  price_discussed: number | null;
  deposit_discussed: number | null;
  sales_notes: string | null;
  student_id: string;
}

interface Props {
  application: Application;
  programs: Program[];
  initialBatches: Batch[];
  programName: string | null;
  batchName: string | null;
  canEdit: boolean;
}

function formatCurrency(value: number | null | undefined): string | null {
  if (value == null) return null;
  return `$${Number(value).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`;
}

export function SalesIntakeSection({
  application,
  programs,
  initialBatches,
  programName,
  batchName,
  canEdit,
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

  if (isEditing) {
    return (
      <SalesIntakeForm
        application={application}
        programs={programs}
        initialBatches={initialBatches}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div>
      {showSuccess && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Sales intake updated successfully.
        </div>
      )}
      {canEdit && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Edit
          </button>
        </div>
      )}
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryField label="Lead Source" value={application.lead_source} />
        <SummaryField label="Program Interest" value={programName} />
        <SummaryField label="Batch Interest" value={batchName} />
        <SummaryField
          label="Price Discussed"
          value={formatCurrency(application.price_discussed)}
        />
        <SummaryField
          label="Deposit Discussed"
          value={formatCurrency(application.deposit_discussed)}
        />
        <SummaryField label="Sales Notes" value={application.sales_notes} />
      </dl>
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
