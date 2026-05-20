"use client";

import { useActionState } from "react";
import { updateDocumentReview } from "@/features/documents/actions";
import type { DocumentFormState } from "@/features/documents/actions";

interface Props {
  documentId: string;
  currentStatus: string;
  currentNotes: string | null;
}

const reviewStatusOptions = [
  { value: "uploaded", label: "Uploaded" },
  { value: "accepted", label: "Accepted" },
  { value: "needs_correction", label: "Needs Correction" },
  { value: "archived", label: "Archived" },
];

const initialState: DocumentFormState = { success: false };

export function DocumentReviewForm({ documentId, currentStatus, currentNotes }: Props) {
  const [state, formAction, isPending] = useActionState(updateDocumentReview, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="document_id" value={documentId} />

      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Review updated successfully.
        </div>
      )}

      <div>
        <label
          htmlFor="review_status"
          className="block text-xs font-medium text-zinc-500 mb-1"
        >
          Review Status
        </label>
        <select
          id="review_status"
          name="review_status"
          defaultValue={currentStatus}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
        >
          {reviewStatusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="review_notes"
          className="block text-xs font-medium text-zinc-500 mb-1"
        >
          Review Notes
        </label>
        <textarea
          id="review_notes"
          name="review_notes"
          rows={4}
          defaultValue={currentNotes ?? ""}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Review"}
        </button>
      </div>
    </form>
  );
}
