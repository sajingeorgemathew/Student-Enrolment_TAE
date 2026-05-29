"use client";

import { useActionState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveSalesChecklist } from "@/features/students/hub-actions";
import type { HubFormState } from "@/features/students/hub-actions";

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
  onSuccess?: () => void;
  onCancel?: () => void;
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

const statusOptions = [
  { value: "received", label: "Received" },
  { value: "not_received", label: "Not Received" },
  { value: "not_sure", label: "Not Sure" },
  { value: "not_applicable", label: "Not Applicable" },
];

const initialState: HubFormState = { success: false };

export function SalesChecklistForm({ applicationId, checklist, onSuccess, onCancel }: Props) {
  const router = useRouter();

  const wrappedAction = useCallback(
    async (prev: HubFormState, formData: FormData) => {
      const result = await saveSalesChecklist(prev, formData);
      if (result.success) {
        onSuccess?.();
        router.refresh();
      }
      return result;
    },
    [onSuccess, router]
  );

  const [state, formAction, isPending] = useActionState(
    wrappedAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="application_id" value={applicationId} />

      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}
      {state.success && !onSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Sales checklist saved.
        </div>
      )}

      <div className="space-y-2">
        {checklistItems.map((item) => {
          const value = checklist
            ? (checklist as unknown as Record<string, string>)[item.name]
            : "not_received";
          return (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-md border border-zinc-100 px-4 py-2.5"
            >
              <label
                htmlFor={`sc_${item.name}`}
                className="text-sm text-zinc-700"
              >
                {item.label}
              </label>
              <select
                id={`sc_${item.name}`}
                name={item.name}
                defaultValue={value}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div>
        <label
          htmlFor="sc_notes"
          className="mb-1 block text-xs font-medium text-zinc-500"
        >
          Notes
        </label>
        <textarea
          id="sc_notes"
          name="notes"
          rows={2}
          defaultValue={checklist?.notes ?? ""}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Checklist"}
        </button>
      </div>
    </form>
  );
}
