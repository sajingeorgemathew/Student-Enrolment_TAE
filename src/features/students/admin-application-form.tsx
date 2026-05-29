"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updateApplicationAdmin,
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
  program_id: string | null;
  batch_id: string | null;
}

interface Props {
  application: Application;
  programs: Program[];
  initialBatches: Batch[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

const initialState: HubFormState = { success: false };

export function AdminApplicationForm({
  application,
  programs,
  initialBatches,
  onSuccess,
  onCancel,
}: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updateApplicationAdmin,
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
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="application_id" value={application.id} />

      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}
      {state.success && !onSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Application updated successfully.
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="admin_program_id"
            className="mb-1 block text-xs font-medium text-zinc-500"
          >
            Assign Program
          </label>
          <select
            id="admin_program_id"
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
            htmlFor="admin_batch_id"
            className="mb-1 block text-xs font-medium text-zinc-500"
          >
            Assign Batch
          </label>
          <select
            id="admin_batch_id"
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
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
