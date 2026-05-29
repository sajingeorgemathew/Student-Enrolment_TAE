"use client";

import { useState, useCallback, useEffect } from "react";
import { AdminApplicationForm } from "./admin-application-form";

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
  program_id: string | null;
  batch_id: string | null;
}

interface Props {
  application: Application;
  programs: Program[];
  initialBatches: Batch[];
  programName: string | null;
  batchName: string | null;
  canEdit: boolean;
}

export function AdminProgramSection({
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
      <AdminApplicationForm
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
          Program and batch assignment updated successfully.
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
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <SummaryField label="Assigned Program" value={programName} />
        <SummaryField label="Assigned Batch" value={batchName} />
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
