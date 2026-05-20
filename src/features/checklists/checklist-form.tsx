"use client";

import { useActionState } from "react";
import { updateChecklist } from "@/features/checklists/actions";
import type { ChecklistFormState } from "@/features/checklists/actions";

interface Checklist {
  id: string;
  application_id: string;
  photo_id_status: string | null;
  address_proof_status: string | null;
  academic_route: string | null;
  academic_status: string | null;
  academic_notes: string | null;
  english_route: string | null;
  english_status: string | null;
  english_score: string | null;
  english_notes: string | null;
  admin_verified_by: string | null;
  admin_verified_at: string | null;
}

interface Props {
  applicationId: string;
  checklist: Checklist;
}

const idStatusOptions = [
  { value: "not_received", label: "Not Received" },
  { value: "uploaded", label: "Uploaded" },
  { value: "accepted", label: "Accepted" },
  { value: "needs_correction", label: "Needs Correction" },
];

const academicRouteOptions = [
  { value: "", label: "-- Select --" },
  { value: "canadian_secondary", label: "Canadian Secondary School / OSSD" },
  { value: "foreign_credential", label: "Foreign Credential" },
  { value: "mature_student", label: "Mature Student" },
];

const academicStatusOptions = [
  { value: "not_started", label: "Not Started" },
  { value: "in_review", label: "In Review" },
  { value: "accepted", label: "Accepted" },
  { value: "needs_correction", label: "Needs Correction" },
];

const englishRouteOptions = [
  { value: "", label: "-- Select --" },
  { value: "ielts", label: "IELTS" },
  { value: "toefl_ibt", label: "TOEFL iBT" },
  { value: "cael", label: "CAEL" },
  { value: "celpip", label: "CELPIP" },
  { value: "clb", label: "CLB" },
  { value: "duolingo", label: "Duolingo" },
  { value: "pte_academic", label: "PTE Academic" },
  { value: "nacc_written_exam", label: "NACC Written Exam" },
  {
    value: "two_years_canadian_postsecondary_english",
    label: "2 Years Canadian Post-Secondary Study in English",
  },
  {
    value: "two_years_international_postsecondary_english",
    label: "2 Years International Post-Secondary Study in English",
  },
  { value: "not_required", label: "Not Required" },
];

const englishStatusOptions = [
  { value: "not_started", label: "Not Started" },
  { value: "in_review", label: "In Review" },
  { value: "accepted", label: "Accepted" },
  { value: "needs_correction", label: "Needs Correction" },
];

const initialState: ChecklistFormState = { success: false };

export function ChecklistForm({ applicationId, checklist }: Props) {
  const [state, formAction, isPending] = useActionState(
    updateChecklist,
    initialState
  );

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="checklist_id" value={checklist.id} />
      <input type="hidden" name="application_id" value={applicationId} />

      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Checklist updated successfully.
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-zinc-900">
          ID and Address Proof
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            name="photo_id_status"
            label="Photo ID Status"
            options={idStatusOptions}
            defaultValue={checklist.photo_id_status ?? "not_received"}
          />
          <SelectField
            name="address_proof_status"
            label="Address Proof Status"
            options={idStatusOptions}
            defaultValue={checklist.address_proof_status ?? "not_received"}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-zinc-900">
          Academic Requirement
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            name="academic_route"
            label="Academic Route"
            options={academicRouteOptions}
            defaultValue={checklist.academic_route ?? ""}
          />
          <SelectField
            name="academic_status"
            label="Academic Status"
            options={academicStatusOptions}
            defaultValue={checklist.academic_status ?? "not_started"}
          />
        </div>
        <TextareaField
          name="academic_notes"
          label="Academic Notes"
          defaultValue={checklist.academic_notes ?? ""}
        />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-zinc-900">
          English Proficiency Requirement
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            name="english_route"
            label="English Route"
            options={englishRouteOptions}
            defaultValue={checklist.english_route ?? ""}
          />
          <SelectField
            name="english_status"
            label="English Status"
            options={englishStatusOptions}
            defaultValue={checklist.english_status ?? "not_started"}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            name="english_score"
            label="English Score / Result"
            defaultValue={checklist.english_score ?? ""}
          />
        </div>
        <TextareaField
          name="english_notes"
          label="English Notes"
          defaultValue={checklist.english_notes ?? ""}
        />
      </fieldset>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-5">
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

function SelectField({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  defaultValue: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-xs font-medium text-zinc-500 mb-1"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InputField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-xs font-medium text-zinc-500 mb-1"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        defaultValue={defaultValue}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
      />
    </div>
  );
}

function TextareaField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-xs font-medium text-zinc-500 mb-1"
      >
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
      />
    </div>
  );
}
