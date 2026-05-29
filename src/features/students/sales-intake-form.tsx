"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updateApplicationSales,
  getHubBatches,
} from "@/features/students/hub-actions";
import type { HubFormState } from "@/features/students/hub-actions";

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
  onSuccess?: () => void;
  onCancel?: () => void;
}

const initialState: HubFormState = { success: false };

export function SalesIntakeForm({ application, programs, initialBatches, onSuccess, onCancel }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updateApplicationSales,
    initialState
  );
  const [selectedProgram, setSelectedProgram] = useState(
    application.program_id ?? ""
  );
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [loadingBatches, setLoadingBatches] = useState(false);

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
      router.refresh();
    }
  }, [state, router, onSuccess]);

  function handleProgramChange(programId: string) {
    setSelectedProgram(programId);
    if (!programId) {
      setBatches([]);
      return;
    }
    if (programId === application.program_id) {
      setBatches(initialBatches);
      return;
    }
    setLoadingBatches(true);
    getHubBatches(programId).then((data) => {
      setBatches(data);
      setLoadingBatches(false);
    });
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="application_id" value={application.id} />

        {state.error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {state.error}
          </div>
        )}
        {state.success && !onSuccess && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Intake updated successfully.
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label
              htmlFor="lead_source"
              className="mb-1 block text-xs font-medium text-zinc-500"
            >
              Lead Source
            </label>
            <input
              id="lead_source"
              name="lead_source"
              type="text"
              defaultValue={application.lead_source ?? ""}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="sales_program_id"
              className="mb-1 block text-xs font-medium text-zinc-500"
            >
              Program Interest
            </label>
            <select
              id="sales_program_id"
              name="program_id"
              value={selectedProgram}
              onChange={(e) => handleProgramChange(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
            >
              <option value="">-- Select program --</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.program_name} ({p.program_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="sales_batch_id"
              className="mb-1 block text-xs font-medium text-zinc-500"
            >
              Batch Interest
            </label>
            <select
              id="sales_batch_id"
              name="batch_id"
              defaultValue={application.batch_id ?? ""}
              disabled={loadingBatches}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">-- Select batch --</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_name}
                  {b.start_date ? ` (${b.start_date})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="price_discussed"
              className="mb-1 block text-xs font-medium text-zinc-500"
            >
              Price Discussed
            </label>
            <input
              id="price_discussed"
              name="price_discussed"
              type="number"
              step="0.01"
              min="0"
              defaultValue={
                application.price_discussed != null
                  ? String(application.price_discussed)
                  : ""
              }
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="deposit_discussed"
              className="mb-1 block text-xs font-medium text-zinc-500"
            >
              Deposit Discussed
            </label>
            <input
              id="deposit_discussed"
              name="deposit_discussed"
              type="number"
              step="0.01"
              min="0"
              defaultValue={
                application.deposit_discussed != null
                  ? String(application.deposit_discussed)
                  : ""
              }
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="sales_notes"
            className="mb-1 block text-xs font-medium text-zinc-500"
          >
            Sales Notes
          </label>
          <textarea
            id="sales_notes"
            name="sales_notes"
            rows={3}
            defaultValue={application.sales_notes ?? ""}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-4">
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
            {isPending ? "Saving..." : "Save Intake"}
          </button>
        </div>
      </form>
    </div>
  );
}
