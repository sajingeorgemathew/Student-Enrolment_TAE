"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument, getApplicationsForStudent } from "@/features/documents/actions";
import type { DocumentFormState } from "@/features/documents/actions";

interface Student {
  id: string;
  legal_first_name: string;
  legal_last_name: string;
  student_number: string | null;
  email: string | null;
}

interface Application {
  id: string;
  status: string;
  programs: { id: string; program_code: string; program_name: string } | null;
  batches: { id: string; batch_name: string } | null;
}

interface Props {
  students: Student[];
  defaultStudentId?: string;
  initialApplications?: Application[];
}

const documentTypeOptions = [
  { value: "", label: "-- Select document type --" },
  { value: "photo_id", label: "Photo ID" },
  { value: "address_proof", label: "Address Proof" },
  { value: "academic_transcript", label: "Academic Transcript" },
  { value: "diploma_certificate", label: "Diploma / Certificate" },
  { value: "english_test", label: "English Test" },
  { value: "immigration_status", label: "Immigration Status" },
  { value: "payment_proof", label: "Payment Proof" },
  { value: "placement_document", label: "Placement Document" },
  { value: "plar", label: "PLAR" },
  { value: "readmission", label: "Readmission" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "transcript_moodle_export", label: "Transcript / Moodle Export" },
  { value: "contract_document", label: "Contract Document" },
  { value: "other", label: "Other" },
];

const allowedExtensions = ".pdf,.jpg,.jpeg,.png,.docx";

const initialState: DocumentFormState = { success: false };

export function DocumentUploadForm({ students, defaultStudentId, initialApplications }: Props) {
  const [state, formAction, isPending] = useActionState(uploadDocument, initialState);
  const [applications, setApplications] = useState<Application[]>(initialApplications ?? []);
  const [loadingApps, startLoadApps] = useTransition();
  const router = useRouter();

  function handleStudentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const studentId = e.target.value;
    setApplications([]);
    if (!studentId) return;

    startLoadApps(async () => {
      const apps = await getApplicationsForStudent(studentId);
      const parsed = apps.map((app) => ({
        id: app.id,
        status: app.status,
        programs: app.programs as unknown as Application["programs"],
        batches: app.batches as unknown as Application["batches"],
      }));
      setApplications(parsed);
    });
  }

  if (state.success) {
    router.push("/dashboard/documents");
    return (
      <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        Document uploaded successfully. Redirecting...
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="student_id" className="block text-xs font-medium text-zinc-500 mb-1">
          Student
        </label>
        <select
          id="student_id"
          name="student_id"
          required
          defaultValue={defaultStudentId ?? ""}
          onChange={handleStudentChange}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
        >
          <option value="">-- Select student --</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.legal_first_name} {s.legal_last_name}
              {s.student_number ? ` (${s.student_number})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="application_id" className="block text-xs font-medium text-zinc-500 mb-1">
          Application (optional)
        </label>
        <select
          id="application_id"
          name="application_id"
          disabled={applications.length === 0}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none disabled:bg-zinc-50 disabled:text-zinc-400"
        >
          <option value="">
            {loadingApps
              ? "Loading applications..."
              : applications.length === 0
                ? "No applications available"
                : "-- Select application --"}
          </option>
          {applications.map((app) => (
            <option key={app.id} value={app.id}>
              {app.programs?.program_code ?? "No program"}{" "}
              {app.batches ? `- ${app.batches.batch_name}` : ""}{" "}
              ({app.status.replace(/_/g, " ")})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="document_type" className="block text-xs font-medium text-zinc-500 mb-1">
          Document Type
        </label>
        <select
          id="document_type"
          name="document_type"
          required
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
        >
          {documentTypeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="file" className="block text-xs font-medium text-zinc-500 mb-1">
          File
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept={allowedExtensions}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-zinc-700 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-zinc-400">
          PDF, JPG, PNG, or DOCX. Max 10 MB.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-5">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isPending ? "Uploading..." : "Upload Document"}
        </button>
      </div>
    </form>
  );
}
