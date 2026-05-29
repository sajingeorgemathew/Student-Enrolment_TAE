"use client";

import { useState, useCallback, useEffect } from "react";
import { ChecklistForm } from "./checklist-form";

interface Checklist {
  id: string;
  application_id: string;
  photo_id_status: string | null;
  address_proof_status: string | null;
  academic_route: string | null;
  academic_status: string | null;
  academic_notes: string | null;
  english_route: string | null;
  english_status: string | null;
  english_score: string | null;
  english_notes: string | null;
  admin_verified_by: string | null;
  admin_verified_at: string | null;
}

interface Props {
  applicationId: string;
  checklist: Checklist | null;
  canEdit: boolean;
}

const checklistStatusLabels: Record<string, string> = {
  not_received: "Not Received",
  uploaded: "Uploaded",
  accepted: "Accepted",
  needs_correction: "Needs Correction",
  not_started: "Not Started",
  in_review: "In Review",
  not_applicable: "Not Applicable",
};

export function OfficialChecklistSection({ applicationId, checklist, canEdit }: Props) {
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
      <ChecklistForm
        key={checklist?.admin_verified_at ?? "new"}
        applicationId={applicationId}
        checklist={checklist}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  if (!checklist) {
    return (
      <div>
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
        <div className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center">
          <p className="text-sm text-zinc-500">No admission checklist created yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {showSuccess && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Official checklist saved successfully.
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
        <SummaryField
          label="Photo ID"
          value={
            checklistStatusLabels[checklist.photo_id_status as string] ??
            (checklist.photo_id_status as string)
          }
        />
        <SummaryField
          label="Address Proof"
          value={
            checklistStatusLabels[checklist.address_proof_status as string] ??
            (checklist.address_proof_status as string)
          }
        />
        <SummaryField
          label="Academic Route"
          value={checklist.academic_route?.replace(/_/g, " ") ?? null}
        />
        <SummaryField
          label="Academic Status"
          value={
            checklistStatusLabels[checklist.academic_status as string] ??
            (checklist.academic_status as string)
          }
        />
        <SummaryField
          label="English Route"
          value={checklist.english_route?.replace(/_/g, " ") ?? null}
        />
        <SummaryField
          label="English Status"
          value={
            checklistStatusLabels[checklist.english_status as string] ??
            (checklist.english_status as string)
          }
        />
        <SummaryField
          label="English Score"
          value={checklist.english_score}
        />
        {(checklist.academic_notes || checklist.english_notes) && (
          <SummaryField
            label="Notes"
            value={
              [checklist.academic_notes, checklist.english_notes]
                .filter(Boolean)
                .join(" | ") || null
            }
          />
        )}
      </dl>
      {checklist.admin_verified_at && (
        <p className="mt-4 text-xs text-zinc-400">
          Last verified:{" "}
          {new Date(checklist.admin_verified_at).toLocaleString("en-CA")}
        </p>
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
