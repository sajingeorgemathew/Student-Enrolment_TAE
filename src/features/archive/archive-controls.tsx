"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  archiveRecord,
  restoreRecord,
  hardDeleteRecord,
} from "@/features/archive/actions";

interface Props {
  tableName: string;
  recordId: string;
  recordLabel: string;
  isArchived: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
  canArchive: boolean;
  canHardDelete: boolean;
}

export function ArchiveControls({
  tableName,
  recordId,
  recordLabel,
  isArchived,
  archivedAt,
  archivedBy,
  archiveReason,
  canArchive,
  canHardDelete,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showArchiveForm, setShowArchiveForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  if (!canArchive && !canHardDelete) return null;

  async function handleArchive() {
    if (!reason.trim()) {
      setError("Please provide a reason for archiving.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await archiveRecord(tableName, recordId, reason.trim());
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Could not archive.");
    } else {
      setSuccess(`${recordLabel} has been archived.`);
      setShowArchiveForm(false);
      setReason("");
      router.refresh();
    }
  }

  async function handleRestore() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await restoreRecord(tableName, recordId);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Could not restore.");
    } else {
      setSuccess(`${recordLabel} has been restored.`);
      router.refresh();
    }
  }

  async function handleHardDelete() {
    if (!deleteReason.trim()) {
      setError("Please provide a reason for deletion.");
      return;
    }
    if (deleteConfirmText !== "HARD DELETE") {
      setError("Type HARD DELETE to confirm.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await hardDeleteRecord(tableName, recordId, deleteReason.trim());
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Could not delete.");
    } else {
      setSuccess(`${recordLabel} has been permanently deleted.`);
      setShowDeleteConfirm(false);
      setDeleteReason("");
      setDeleteConfirmText("");
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      {!isArchived && (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-sm font-medium text-zinc-700">What does archiving do?</p>
          <ul className="mt-1 space-y-1 text-xs text-zinc-600">
            <li>- Archiving hides this student from active workflow but keeps all records, documents, contracts, fees, and history.</li>
            <li>- Use archive for: dropped off, duplicate intake, inactive lead, or deferred student.</li>
            <li>- Restore is available for admin and super admin at any time.</li>
          </ul>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="whitespace-pre-line text-sm text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {isArchived && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            This record is archived
          </p>
          {archivedAt && (
            <p className="mt-1 text-xs text-amber-700">
              Archived on {new Date(archivedAt).toLocaleDateString("en-CA")}
              {archivedBy ? ` by ${archivedBy}` : ""}
            </p>
          )}
          {archiveReason && (
            <p className="mt-1 text-xs text-amber-700">
              Reason: {archiveReason}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {canArchive && !isArchived && !showArchiveForm && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setShowArchiveForm(true);
              setShowDeleteConfirm(false);
              setError(null);
              setSuccess(null);
            }}
            className="inline-flex items-center rounded-md border border-amber-600 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            Archive
          </button>
        )}

        {canArchive && isArchived && (
          <button
            type="button"
            disabled={loading}
            onClick={handleRestore}
            className="inline-flex items-center rounded-md border border-green-600 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {loading ? "Restoring..." : "Restore from Archive"}
          </button>
        )}

        {canHardDelete && !showDeleteConfirm && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setShowDeleteConfirm(true);
              setShowArchiveForm(false);
              setError(null);
              setSuccess(null);
            }}
            className="inline-flex items-center rounded-md border border-red-600 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            Hard Delete
          </button>
        )}
      </div>

      {showArchiveForm && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 text-sm font-medium text-amber-800">
            Archive {recordLabel}
          </p>
          <label className="mb-1 block text-xs font-medium text-amber-700">
            Reason for archiving
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason..."
            className="mb-3 w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleArchive}
              className="inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
            >
              {loading ? "Archiving..." : "Confirm Archive"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setShowArchiveForm(false);
                setReason("");
                setError(null);
              }}
              className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="mb-1 text-sm font-medium text-red-800">
            Hard Delete - {recordLabel}
          </p>
          <p className="mb-2 text-xs text-red-700">
            This action is permanent and cannot be undone. Hard delete is intended only for accidental test or duplicate records.
          </p>
          <p className="mb-3 text-xs text-red-700">
            Note: document storage files are not deleted. Storage cleanup is not included yet.
          </p>
          <label className="mb-1 block text-xs font-medium text-red-700">
            Reason for deletion
          </label>
          <input
            type="text"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="Enter reason..."
            className="mb-3 w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
          />
          <label className="mb-1 block text-xs font-medium text-red-700">
            Type HARD DELETE to confirm
          </label>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="HARD DELETE"
            className="mb-3 w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || deleteConfirmText !== "HARD DELETE"}
              onClick={handleHardDelete}
              className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Confirm Hard Delete"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteReason("");
                setDeleteConfirmText("");
                setError(null);
              }}
              className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
