"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Pencil, Trash2 } from "lucide-react";

// FINANCE-09: registry row actions for admin/super_admin.
// Download (stored PDF), Edit (correction route), and Hard Delete (with a
// required reason and a typed DELETE RECEIPT confirmation).

const DELETE_CONFIRMATION = "DELETE RECEIPT";

const actionButtonClass =
  "inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50";

export function ReceiptRowActions({
  receiptId,
  receiptNumber,
  hasPdf,
}: {
  receiptId: string;
  receiptNumber: string;
  hasPdf: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm =
    reason.trim() !== "" && confirmation === DELETE_CONFIRMATION && !deleting;

  function closeModal() {
    if (deleting) return;
    setOpen(false);
    setReason("");
    setConfirmation("");
    setError(null);
  }

  async function handleDelete() {
    setError(null);
    if (!canConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/finance/receipts/${receiptId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim(),
          confirmation,
        }),
      });
      const data = await res
        .json()
        .catch(() => ({ error: "Could not delete the receipt." }));
      if (!res.ok) {
        setError(data.error || "Could not delete the receipt.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {hasPdf ? (
        <a href={`/api/receipts/download?id=${receiptId}`} className={actionButtonClass}>
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      ) : (
        <span className="text-xs text-zinc-400">Download unavailable</span>
      )}

      <Link
        href={`/dashboard/admin-tools/finance/receipts/${receiptId}/edit`}
        className={actionButtonClass}
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Link>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Hard Delete
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-zinc-900">
              Hard delete receipt
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              This permanently deletes receipt {receiptNumber} and its stored
              PDF. The receipt number and sequence are freed for reuse. This
              cannot be undone.
            </p>

            <div className="mt-4">
              <label
                className="block text-sm font-medium text-zinc-700"
                htmlFor="delete-reason"
              >
                Reason for deletion
              </label>
              <textarea
                id="delete-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Why is this receipt being deleted?"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            <div className="mt-4">
              <label
                className="block text-sm font-medium text-zinc-700"
                htmlFor="delete-confirm"
              >
                Type {DELETE_CONFIRMATION} to confirm
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={DELETE_CONFIRMATION}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            {error && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={deleting}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canConfirm}
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete receipt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
