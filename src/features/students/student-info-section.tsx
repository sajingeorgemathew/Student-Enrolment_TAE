"use client";

import { useState, useCallback, useEffect } from "react";
import { StudentEditForm } from "./student-edit-form";

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
  canEdit: boolean;
}

export function StudentInfoSection({ student, canEdit }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = useCallback(() => {
    setIsEditing(false);
    setShowSuccess(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  if (isEditing) {
    return (
      <StudentEditForm
        student={student}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  const address = [
    student.mailing_address_line_1,
    student.mailing_address_line_2,
    [student.city, student.province].filter(Boolean).join(", "),
    student.postal_code,
    student.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      {showSuccess && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Student information updated successfully.
        </div>
      )}
      {canEdit && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Edit
          </button>
        </div>
      )}
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryField label="Student Number" value={student.student_number} />
        <SummaryField
          label="Legal Full Name"
          value={[
            student.legal_first_name,
            student.legal_middle_name,
            student.legal_last_name,
          ]
            .filter(Boolean)
            .join(" ")}
        />
        <SummaryField label="Preferred Name" value={student.preferred_name} />
        <SummaryField
          label="Date of Birth"
          value={
            student.date_of_birth
              ? new Date(student.date_of_birth).toLocaleDateString("en-CA")
              : null
          }
        />
        <SummaryField label="Phone" value={student.phone} />
        <SummaryField label="Alternate Phone" value={student.alternate_phone} />
        <SummaryField label="Email" value={student.email} />
        <SummaryField label="Address" value={address || null} />
        <SummaryField
          label="Immigration Status"
          value={student.immigration_status}
        />
        <SummaryField
          label="International Student"
          value={
            student.international_student === null
              ? null
              : student.international_student
                ? "Yes"
                : "No"
          }
        />
        <SummaryField label="Notes" value={student.notes} />
      </dl>
    </div>
  );
}

function SummaryField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm text-zinc-900">
        {value || <span className="text-zinc-400">--</span>}
      </dd>
    </div>
  );
}
