"use client";

import { useActionState } from "react";
import {
  createProgram,
  updateProgram,
} from "@/features/programs/actions";
import type { ProgramFormState } from "@/features/programs/actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

type ProgramData = {
  id: string;
  program_code: string;
  program_name: string;
  credential_name: string | null;
  total_hours: number | null;
  theory_hours: number | null;
  practicum_hours: number | null;
  default_tuition: number | null;
  default_registration_fee: number | null;
  default_book_fee: number | null;
  default_compulsory_fee: number | null;
  default_professional_exam_fee: number | null;
  is_active: boolean;
};

const initialState: ProgramFormState = { success: false };

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

export function ProgramForm({ program }: { program?: ProgramData }) {
  const action = program
    ? updateProgram.bind(null, program.id)
    : createProgram;
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
          Program Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="program_code" className={labelClass}>
              Program Code <span className="text-red-500">*</span>
            </label>
            <input
              id="program_code"
              name="program_code"
              type="text"
              required
              className={inputClass}
              placeholder="PSW"
              defaultValue={program?.program_code ?? ""}
            />
            <FieldError errors={state.fieldErrors} name="program_code" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="program_name" className={labelClass}>
              Program Name <span className="text-red-500">*</span>
            </label>
            <input
              id="program_name"
              name="program_name"
              type="text"
              required
              className={inputClass}
              placeholder="NACC Personal Support Worker (PSW) DE 2022"
              defaultValue={program?.program_name ?? ""}
            />
            <FieldError errors={state.fieldErrors} name="program_name" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="credential_name" className={labelClass}>
              Credential Name
            </label>
            <input
              id="credential_name"
              name="credential_name"
              type="text"
              className={inputClass}
              placeholder="PSW Certificate"
              defaultValue={program?.credential_name ?? ""}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Program Hours
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="total_hours" className={labelClass}>
              Total Hours
            </label>
            <input
              id="total_hours"
              name="total_hours"
              type="number"
              min="0"
              className={inputClass}
              placeholder="0"
              defaultValue={program?.total_hours ?? ""}
            />
          </div>
          <div>
            <label htmlFor="theory_hours" className={labelClass}>
              Theory Hours
            </label>
            <input
              id="theory_hours"
              name="theory_hours"
              type="number"
              min="0"
              className={inputClass}
              placeholder="0"
              defaultValue={program?.theory_hours ?? ""}
            />
          </div>
          <div>
            <label htmlFor="practicum_hours" className={labelClass}>
              Practicum Hours
            </label>
            <input
              id="practicum_hours"
              name="practicum_hours"
              type="number"
              min="0"
              className={inputClass}
              placeholder="0"
              defaultValue={program?.practicum_hours ?? ""}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Default Fees
        </h2>
        <p className="mb-4 text-sm text-zinc-500">
          These defaults are used when generating contracts and fee schedules for
          new enrolments.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="default_tuition" className={labelClass}>
              Tuition ($)
            </label>
            <input
              id="default_tuition"
              name="default_tuition"
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="0.00"
              defaultValue={program?.default_tuition ?? ""}
            />
          </div>
          <div>
            <label htmlFor="default_registration_fee" className={labelClass}>
              Registration Fee ($)
            </label>
            <input
              id="default_registration_fee"
              name="default_registration_fee"
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="0.00"
              defaultValue={program?.default_registration_fee ?? ""}
            />
          </div>
          <div>
            <label htmlFor="default_book_fee" className={labelClass}>
              Book Fee ($)
            </label>
            <input
              id="default_book_fee"
              name="default_book_fee"
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="0.00"
              defaultValue={program?.default_book_fee ?? ""}
            />
          </div>
          <div>
            <label htmlFor="default_compulsory_fee" className={labelClass}>
              Compulsory Fee ($)
            </label>
            <input
              id="default_compulsory_fee"
              name="default_compulsory_fee"
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="0.00"
              defaultValue={program?.default_compulsory_fee ?? ""}
            />
          </div>
          <div>
            <label
              htmlFor="default_professional_exam_fee"
              className={labelClass}
            >
              Professional Exam Fee ($)
            </label>
            <input
              id="default_professional_exam_fee"
              name="default_professional_exam_fee"
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="0.00"
              defaultValue={program?.default_professional_exam_fee ?? ""}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Status</h2>
        <div>
          <label htmlFor="is_active" className={labelClass}>
            Program Status
          </label>
          <select
            id="is_active"
            name="is_active"
            className={inputClass}
            defaultValue={program ? String(program.is_active) : "true"}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </section>

      <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
        <Link
          href="/dashboard/programs"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          <span className="inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Programs
          </span>
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {pending
            ? "Saving..."
            : program
              ? "Update Program"
              : "Create Program"}
        </button>
      </div>
    </form>
  );
}
