"use client";

import { useTransition } from "react";
import { updateDocumentReview } from "@/features/documents/actions";

interface Props {
  documentId: string;
  currentStatus: string;
}

const reviewStatusOptions = [
  { value: "uploaded", label: "Uploaded" },
  { value: "accepted", label: "Accepted" },
  { value: "needs_correction", label: "Needs Correction" },
  { value: "archived", label: "Archived" },
];

export function InlineReviewStatus({ documentId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;

    const fd = new FormData();
    fd.set("document_id", documentId);
    fd.set("review_status", newStatus);
    fd.set("review_notes", "");

    startTransition(async () => {
      await updateDocumentReview({ success: false }, fd);
    });
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <select
        defaultValue={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-xs text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none disabled:opacity-50"
      >
        {reviewStatusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {isPending && <span className="text-xs text-zinc-400">Saving...</span>}
    </div>
  );
}
