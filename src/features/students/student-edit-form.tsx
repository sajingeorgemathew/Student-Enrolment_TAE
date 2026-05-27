"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateStudent } from "@/features/students/actions";
import type { StudentFormState } from "@/features/students/actions";

interface StudentData {
  id: string;
  student_number: string | null;
  legal_first_name: string;
  legal_middle_name: string | null;
  legal_last_name: string;
  preferred_name: string | null;
  date_of_birth: string | null;
  phone: string | null;
  alternate_phone: string | null;
  email: string | null;
  mailing_address_line_1: string | null;
  mailing_address_line_2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  immigration_status: string | null;
  international_student: boolean | null;
  notes: string | null;
}

interface Props {
  student: StudentData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const initialState: StudentFormState = { success: false };

export function StudentEditForm({ student, onSuccess, onCancel }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateStudent, initialState);

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
      router.refresh();
    }
  }, [state, router, onSuccess]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="student_id" value={student.id} />

      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div>
        <h3 className="mb-4 text-sm font-medium text-zinc-700">Student Information</h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            label="Student Number"
            name="student_number"
            defaultValue={student.student_number}
          />
          <FormField
            label="First Name"
            name="legal_first_name"
            defaultValue={student.legal_first_name}
            required
          />
          <FormField
            label="Middle Name"
            name="legal_middle_name"
            defaultValue={student.legal_middle_name}
          />
          <FormField
            label="Last Name"
            name="legal_last_name"
            defaultValue={student.legal_last_name}
            required
          />
          <FormField
            label="Preferred Name"
            name="preferred_name"
            defaultValue={student.preferred_name}
          />
          <FormField
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            defaultValue={student.date_of_birth}
          />
          <FormField
            label="Immigration Status"
            name="immigration_status"
            defaultValue={student.immigration_status}
          />
          <div>
            <label
              htmlFor="international_student"
              className="block text-xs font-medium text-zinc-500 mb-1"
            >
              International Student
            </label>
            <select
              id="international_student"
              name="international_student"
              defaultValue={
                student.international_student === null
                  ? ""
                  : student.international_student
                    ? "true"
                    : "false"
              }
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
            >
              <option value="">-- Not set --</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-medium text-zinc-700">Contact Information</h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Email" name="email" type="email" defaultValue={student.email} />
          <FormField label="Phone" name="phone" defaultValue={student.phone} />
          <FormField
            label="Alternate Phone"
            name="alternate_phone"
            defaultValue={student.alternate_phone}
          />
          <FormField
            label="Mailing Address Line 1"
            name="mailing_address_line_1"
            defaultValue={student.mailing_address_line_1}
          />
          <FormField
            label="Mailing Address Line 2"
            name="mailing_address_line_2"
            defaultValue={student.mailing_address_line_2}
          />
          <FormField label="City" name="city" defaultValue={student.city} />
          <FormField label="Province" name="province" defaultValue={student.province} />
          <FormField label="Postal Code" name="postal_code" defaultValue={student.postal_code} />
          <FormField label="Country" name="country" defaultValue={student.country} />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-medium text-zinc-700">Notes</h3>
        <textarea
          name="notes"
          rows={4}
          defaultValue={student.notes ?? ""}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-5">
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

function FormField({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string | null | undefined;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-medium text-zinc-500 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
      />
    </div>
  );
}
