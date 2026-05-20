"use client";

import { useActionState } from "react";
import { createBatch, updateBatch } from "@/features/batches/actions";
import type { BatchFormState } from "@/features/batches/actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

type Program = { id: string; program_code: string; program_name: string };

type BatchData = {
  id: string;
  program_id: string;
  batch_name: string;
  batch_code: string | null;
  start_date: string | null;
  expected_end_date: string | null;
  theory_start_date: string | null;
  theory_end_date: string | null;
  practicum_start_date: string | null;
  practicum_end_date: string | null;
  class_days: string | null;
  class_time: string | null;
  delivery_method: string | null;
  training_location: string | null;
  practicum_1_location: string | null;
  practicum_2_location: string | null;
  notes: string | null;
  is_active: boolean;
};

const deliveryMethods = [
  { value: "in_person", label: "In Person" },
  { value: "hybrid", label: "Hybrid" },
  { value: "online", label: "Online" },
];

const initialState: BatchFormState = { success: false };

function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string[] | undefined>;
  name: string;
}) {
  const msgs = errors?.[name];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msgs[0]}</p>;
}

export function BatchForm({
  programs,
  batch,
}: {
  programs: Program[];
  batch?: BatchData;
}) {
  const action = batch ? updateBatch.bind(null, batch.id) : createBatch;
  const [state, formAction, pending] = useActionState(action, initialState);

  const inputClass =
    "mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none disabled:bg-zinc-50 disabled:text-zinc-500";
  const labelClass = "block text-sm font-medium text-zinc-700";

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">{state.error}</p>
        </div>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Batch Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="program_id" className={labelClass}>
              Program <span className="text-red-500">*</span>
            </label>
            <select
              id="program_id"
              name="program_id"
              required
              className={inputClass}
              defaultValue={batch?.program_id ?? ""}
            >
              <option value="">Select a program</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.program_name} ({p.program_code})
                </option>
              ))}
            </select>
            <FieldError errors={state.fieldErrors} name="program_id" />
          </div>
          <div>
            <label htmlFor="batch_name" className={labelClass}>
              Batch Name <span className="text-red-500">*</span>
            </label>
            <input
              id="batch_name"
              name="batch_name"
              type="text"
              required
              className={inputClass}
              placeholder="PSW Batch 2026-A"
              defaultValue={batch?.batch_name ?? ""}
            />
            <FieldError errors={state.fieldErrors} name="batch_name" />
          </div>
          <div>
            <label htmlFor="batch_code" className={labelClass}>
              Batch Code
            </label>
            <input
              id="batch_code"
              name="batch_code"
              type="text"
              className={inputClass}
              placeholder="PSW-2026A"
              defaultValue={batch?.batch_code ?? ""}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Program Dates
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="start_date" className={labelClass}>
              Start Date
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              className={inputClass}
              defaultValue={batch?.start_date ?? ""}
            />
          </div>
          <div>
            <label htmlFor="expected_end_date" className={labelClass}>
              Expected End Date
            </label>
            <input
              id="expected_end_date"
              name="expected_end_date"
              type="date"
              className={inputClass}
              defaultValue={batch?.expected_end_date ?? ""}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Theory Schedule
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="theory_start_date" className={labelClass}>
              Theory Start Date
            </label>
            <input
              id="theory_start_date"
              name="theory_start_date"
              type="date"
              className={inputClass}
              defaultValue={batch?.theory_start_date ?? ""}
            />
          </div>
          <div>
            <label htmlFor="theory_end_date" className={labelClass}>
              Theory End Date
            </label>
            <input
              id="theory_end_date"
              name="theory_end_date"
              type="date"
              className={inputClass}
              defaultValue={batch?.theory_end_date ?? ""}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Practicum Schedule
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="practicum_start_date" className={labelClass}>
              Practicum Start Date
            </label>
            <input
              id="practicum_start_date"
              name="practicum_start_date"
              type="date"
              className={inputClass}
              defaultValue={batch?.practicum_start_date ?? ""}
            />
          </div>
          <div>
            <label htmlFor="practicum_end_date" className={labelClass}>
              Practicum End Date
            </label>
            <input
              id="practicum_end_date"
              name="practicum_end_date"
              type="date"
              className={inputClass}
              defaultValue={batch?.practicum_end_date ?? ""}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Class Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="class_days" className={labelClass}>
              Class Days
            </label>
            <input
              id="class_days"
              name="class_days"
              type="text"
              className={inputClass}
              placeholder="Monday to Friday"
              defaultValue={batch?.class_days ?? ""}
            />
          </div>
          <div>
            <label htmlFor="class_time" className={labelClass}>
              Class Time
            </label>
            <input
              id="class_time"
              name="class_time"
              type="text"
              className={inputClass}
              placeholder="9:00 AM - 3:00 PM"
              defaultValue={batch?.class_time ?? ""}
            />
          </div>
          <div>
            <label htmlFor="delivery_method" className={labelClass}>
              Delivery Method
            </label>
            <select
              id="delivery_method"
              name="delivery_method"
              className={inputClass}
              defaultValue={batch?.delivery_method ?? ""}
            >
              <option value="">Select delivery method</option>
              {deliveryMethods.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Locations</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="training_location" className={labelClass}>
              Training Location
            </label>
            <input
              id="training_location"
              name="training_location"
              type="text"
              className={inputClass}
              placeholder="Main campus"
              defaultValue={batch?.training_location ?? ""}
            />
          </div>
          <div>
            <label htmlFor="practicum_1_location" className={labelClass}>
              Practicum 1 Location
            </label>
            <input
              id="practicum_1_location"
              name="practicum_1_location"
              type="text"
              className={inputClass}
              placeholder="Practicum site 1"
              defaultValue={batch?.practicum_1_location ?? ""}
            />
          </div>
          <div>
            <label htmlFor="practicum_2_location" className={labelClass}>
              Practicum 2 Location
            </label>
            <input
              id="practicum_2_location"
              name="practicum_2_location"
              type="text"
              className={inputClass}
              placeholder="Practicum site 2"
              defaultValue={batch?.practicum_2_location ?? ""}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Notes</h2>
        <div>
          <label htmlFor="notes" className={labelClass}>
            Batch Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className={inputClass}
            placeholder="Additional notes about this batch..."
            defaultValue={batch?.notes ?? ""}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Status</h2>
        <div>
          <label htmlFor="is_active" className={labelClass}>
            Batch Status
          </label>
          <select
            id="is_active"
            name="is_active"
            className={inputClass}
            defaultValue={batch ? String(batch.is_active) : "true"}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </section>

      <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
        <Link
          href="/dashboard/batches"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          <span className="inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Batches
          </span>
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {pending ? "Saving..." : batch ? "Update Batch" : "Create Batch"}
        </button>
      </div>
    </form>
  );
}
