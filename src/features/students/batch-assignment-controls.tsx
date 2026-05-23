"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  changeBatch,
  transferBatch,
  type BatchAssignmentState,
  type TransferHistoryRecord,
} from "@/features/students/batch-assignment-actions";

interface Batch {
  id: string;
  batch_name: string;
  batch_code: string | null;
  start_date: string | null;
}

interface Props {
  studentId: string;
  applicationId: string;
  currentBatchId: string | null;
  batches: Batch[];
  transferHistory: TransferHistoryRecord[];
  isAdmin: boolean;
}

const initialState: BatchAssignmentState = { success: false };

export function BatchAssignmentControls({
  studentId,
  applicationId,
  currentBatchId,
  batches,
  transferHistory,
  isAdmin,
}: Props) {
  const [activePanel, setActivePanel] = useState<
    "none" | "change" | "transfer"
  >("none");

  const [changeState, changeAction, changePending] = useActionState(
    async (prev: BatchAssignmentState, formData: FormData) => {
      const result = await changeBatch(prev, formData);
      if (result.success) {
        setActivePanel("none");
      }
      return result;
    },
    initialState
  );

  const [transferState, transferAction, transferPending] = useActionState(
    async (prev: BatchAssignmentState, formData: FormData) => {
      const result = await transferBatch(prev, formData);
      if (result.success) {
        setActivePanel("none");
      }
      return result;
    },
    initialState
  );

  const availableBatches = batches.filter((b) => b.id !== currentBatchId);

  return (
    <div className="mt-4 border-t border-zinc-100 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        {currentBatchId && (
          <Link
            href={`/dashboard/batches/${currentBatchId}/edit`}
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
          >
            View Batch
          </Link>
        )}

        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() =>
                setActivePanel(activePanel === "change" ? "none" : "change")
              }
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
            >
              Change Batch
            </button>
            <button
              type="button"
              onClick={() =>
                setActivePanel(
                  activePanel === "transfer" ? "none" : "transfer"
                )
              }
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
            >
              Transfer Batch
            </button>
          </>
        )}
      </div>

      {activePanel === "change" && isAdmin && (
        <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <h3 className="mb-1 text-sm font-medium text-zinc-900">
            Change Batch Assignment
          </h3>
          <p className="mb-3 text-xs text-zinc-500">
            Use this when the wrong batch was selected by mistake.
          </p>

          {changeState.error && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {changeState.error}
            </div>
          )}
          {changeState.success && (
            <div className="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              Batch assignment updated.
            </div>
          )}

          <form action={changeAction}>
            <input type="hidden" name="application_id" value={applicationId} />
            <input type="hidden" name="student_id" value={studentId} />

            <div className="mb-3">
              <label
                htmlFor="change_new_batch_id"
                className="mb-1 block text-xs font-medium text-zinc-500"
              >
                New Batch
              </label>
              <select
                id="change_new_batch_id"
                name="new_batch_id"
                required
                className="w-full max-w-sm rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
              >
                <option value="">-- Select batch --</option>
                {availableBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_name}
                    {b.start_date ? ` (${b.start_date})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={changePending}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {changePending ? "Saving..." : "Change Batch"}
              </button>
              <button
                type="button"
                onClick={() => setActivePanel("none")}
                className="text-sm text-zinc-500 hover:text-zinc-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {activePanel === "transfer" && isAdmin && (
        <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <h3 className="mb-1 text-sm font-medium text-zinc-900">
            Transfer to Another Batch
          </h3>
          <p className="mb-3 text-xs text-zinc-500">
            Use this when the student is officially transferring from one batch
            to another.
          </p>

          {transferState.error && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {transferState.error}
            </div>
          )}
          {transferState.success && (
            <div className="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              Batch transfer completed.
            </div>
          )}

          <form action={transferAction}>
            <input type="hidden" name="application_id" value={applicationId} />
            <input type="hidden" name="student_id" value={studentId} />

            <div className="mb-3">
              <label
                htmlFor="transfer_new_batch_id"
                className="mb-1 block text-xs font-medium text-zinc-500"
              >
                New Batch
              </label>
              <select
                id="transfer_new_batch_id"
                name="new_batch_id"
                required
                className="w-full max-w-sm rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
              >
                <option value="">-- Select batch --</option>
                {availableBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_name}
                    {b.start_date ? ` (${b.start_date})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label
                htmlFor="transfer_reason"
                className="mb-1 block text-xs font-medium text-zinc-500"
              >
                Reason (required)
              </label>
              <input
                id="transfer_reason"
                name="reason"
                type="text"
                required
                className="w-full max-w-sm rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
                placeholder="e.g. Schedule conflict, student request"
              />
            </div>

            <div className="mb-3">
              <label
                htmlFor="transfer_notes"
                className="mb-1 block text-xs font-medium text-zinc-500"
              >
                Notes (optional)
              </label>
              <textarea
                id="transfer_notes"
                name="notes"
                rows={2}
                className="w-full max-w-sm rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={transferPending}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {transferPending ? "Transferring..." : "Transfer Batch"}
              </button>
              <button
                type="button"
                onClick={() => setActivePanel("none")}
                className="text-sm text-zinc-500 hover:text-zinc-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {transferHistory.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-zinc-700">
            Batch Transfer History
          </h3>
          <div className="overflow-x-auto rounded-md border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    From
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    To
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {transferHistory.map((record) => (
                  <tr key={record.id}>
                    <td className="px-3 py-2 text-sm text-zinc-600">
                      {new Date(record.transferred_at).toLocaleDateString(
                        "en-CA"
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-zinc-600">
                      {record.transfer_type === "change"
                        ? "Change"
                        : "Transfer"}
                    </td>
                    <td className="px-3 py-2 text-sm text-zinc-600">
                      {record.previous_batch?.batch_name ?? "--"}
                    </td>
                    <td className="px-3 py-2 text-sm text-zinc-600">
                      {record.new_batch?.batch_name ?? "--"}
                    </td>
                    <td className="px-3 py-2 text-sm text-zinc-500">
                      {record.reason || record.notes || "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
