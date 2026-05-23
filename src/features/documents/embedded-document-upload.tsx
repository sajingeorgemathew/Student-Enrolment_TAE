"use client";

import { useActionState, useState, useEffect } from "react";
import { uploadDocument } from "@/features/documents/actions";
import type { DocumentFormState } from "@/features/documents/actions";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";

interface Application {
  id: string;
  status: string;
  programs: { id: string; program_code: string; program_name: string } | null;
  batches: { id: string; batch_name: string } | null;
}

interface Props {
  studentId: string;
  applications: Application[];
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

export function EmbeddedDocumentUpload({ studentId, applications }: Props) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  function handleUploadComplete() {
    setFormKey((k) => k + 1);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
      >
        <Plus className="h-3.5 w-3.5" />
        Upload Document
        {open ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {open && (
        <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-4">
          {showSuccess && (
            <div className="mb-3 rounded-md border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800">
              Document uploaded successfully.
            </div>
          )}
          <EmbeddedUploadForm
            key={formKey}
            studentId={studentId}
            applications={applications}
            onSuccess={handleUploadComplete}
          />
        </div>
      )}
    </div>
  );
}

function EmbeddedUploadForm({
  studentId,
  applications,
  onSuccess,
}: Props & { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(
    uploadDocument,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="student_id" value={studentId} />

      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="emb_document_type"
            className="mb-1 block text-xs font-medium text-zinc-500"
          >
            Document Type
          </label>
          <select
            id="emb_document_type"
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

        {applications.length > 0 && (
          <div>
            <label
              htmlFor="emb_application_id"
              className="mb-1 block text-xs font-medium text-zinc-500"
            >
              Application (optional)
            </label>
            <select
              id="emb_application_id"
              name="application_id"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
            >
              <option value="">-- No application --</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.programs?.program_code ?? "No program"}
                  {app.batches ? ` - ${app.batches.batch_name}` : ""}
                  {` (${app.status.replace(/_/g, " ")})`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="emb_file"
          className="mb-1 block text-xs font-medium text-zinc-500"
        >
          File
        </label>
        <input
          id="emb_file"
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

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isPending ? "Uploading..." : "Upload"}
        </button>
      </div>
    </form>
  );
}
