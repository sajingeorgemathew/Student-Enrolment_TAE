"use client";

import { useState, useCallback, useEffect } from "react";
import { SalesChecklistForm } from "./sales-checklist-form";

interface SalesChecklist {
  application_id: string;
  photo_id: string;
  proof_of_address: string;
  diploma_or_transcript: string;
  english_proof: string;
  immigration_status_document: string;
  payment_proof_deposit: string;
  other_documents: string;
  notes: string | null;
}

interface Props {
  applicationId: string;
  checklist: SalesChecklist | null;
  canEdit: boolean;
}

const checklistItems: { name: string; label: string }[] = [
  { name: "photo_id", label: "Photo ID" },
  { name: "proof_of_address", label: "Proof of Address" },
  { name: "diploma_or_transcript", label: "Diploma or Transcript" },
  { name: "english_proof", label: "English Proof" },
  { name: "immigration_status_document", label: "Immigration / Status Document" },
  { name: "payment_proof_deposit", label: "Payment Proof / Deposit" },
  { name: "other_documents", label: "Other Documents" },
];

const statusColors: Record<string, string> = {
  received: "bg-green-100 text-green-800",
  not_received: "bg-red-100 text-red-800",
  not_sure: "bg-amber-100 text-amber-800",
  not_applicable: "bg-zinc-100 text-zinc-600",
};

const statusLabels: Record<string, string> = {
  received: "Received",
  not_received: "Not Received",
  not_sure: "Not Sure",
  not_applicable: "Not Applicable",
};

export function SalesChecklistSection({ applicationId, checklist, canEdit }: Props) {
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
      <SalesChecklistForm
        key={checklist?.application_id ?? "new"}
        applicationId={applicationId}
        checklist={checklist}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div>
      {showSuccess && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Sales checklist saved successfully.
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
      <div className="space-y-3">
        {checklistItems.map((item) => {
          const value = checklist
            ? (checklist as unknown as Record<string, string>)[item.name]
            : "not_received";
          return (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-md border border-zinc-100 px-4 py-2.5"
            >
              <span className="text-sm text-zinc-700">{item.label}</span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[value] ?? "bg-zinc-100 text-zinc-600"}`}
              >
                {statusLabels[value] ?? value}
              </span>
            </div>
          );
        })}
        {checklist?.notes && (
          <div className="mt-2 rounded-md border border-zinc-100 px-4 py-2.5">
            <span className="text-xs font-medium text-zinc-500">Notes</span>
            <p className="mt-1 text-sm text-zinc-700">{checklist.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
