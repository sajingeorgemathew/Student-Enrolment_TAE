import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDocumentDetail } from "@/features/documents/actions";
import { DocumentReviewForm } from "@/features/documents/document-review-form";
import { DocumentPreview } from "@/features/documents/document-preview";
import { getUserProfile } from "@/lib/profile";

const reviewStatusLabels: Record<string, string> = {
  uploaded: "Uploaded",
  accepted: "Accepted",
  needs_correction: "Needs Correction",
  archived: "Archived",
};

const reviewStatusColors: Record<string, string> = {
  uploaded: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  needs_correction: "bg-orange-100 text-orange-800",
  archived: "bg-zinc-100 text-zinc-600",
};

const documentTypeLabels: Record<string, string> = {
  photo_id: "Photo ID",
  address_proof: "Address Proof",
  academic_transcript: "Academic Transcript",
  diploma_certificate: "Diploma / Certificate",
  english_test: "English Test",
  immigration_status: "Immigration Status",
  payment_proof: "Payment Proof",
  placement_document: "Placement Document",
  plar: "PLAR",
  readmission: "Readmission",
  withdrawal: "Withdrawal",
  transcript_moodle_export: "Transcript / Moodle Export",
  contract_document: "Contract Document",
  other: "Other",
};

const uploadedByTypeLabels: Record<string, string> = {
  sales_user: "Sales",
  admin_user: "Admin",
  student_link: "Student",
  staff: "Staff",
};

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const doc = await getDocumentDetail(documentId);

  if (!doc) {
    notFound();
  }

  const profile = await getUserProfile();
  const isAdmin = profile?.role === "admin";

  const student = doc.students as unknown as {
    id: string;
    legal_first_name: string;
    legal_last_name: string;
    student_number: string | null;
    email: string | null;
  } | null;

  const application = doc.applications as unknown as {
    id: string;
    status: string;
    programs: { id: string; program_code: string; program_name: string } | null;
    batches: { id: string; batch_name: string } | null;
  } | null;

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/documents"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Document Detail
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {documentTypeLabels[doc.document_type] ??
                doc.document_type?.replace(/_/g, " ")}
              {student
                ? ` - ${student.legal_first_name} ${student.legal_last_name}`
                : ""}
            </p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              reviewStatusColors[doc.review_status] ??
              "bg-zinc-100 text-zinc-600"
            }`}
          >
            {reviewStatusLabels[doc.review_status] ?? doc.review_status}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <Section title="Student Information">
          {student ? (
            <FieldGrid>
              <Field
                label="Name"
                value={`${student.legal_first_name} ${student.legal_last_name}`}
              />
              <Field label="Student Number" value={student.student_number} />
              <Field label="Email" value={student.email} />
            </FieldGrid>
          ) : (
            <EmptyState message="No student information available." />
          )}
        </Section>

        <Section title="Application">
          {application ? (
            <FieldGrid>
              <Field
                label="Program"
                value={
                  application.programs
                    ? `${application.programs.program_code} - ${application.programs.program_name}`
                    : null
                }
              />
              <Field
                label="Batch"
                value={application.batches?.batch_name ?? null}
              />
              <Field
                label="Status"
                value={application.status?.replace(/_/g, " ") ?? null}
              />
            </FieldGrid>
          ) : (
            <EmptyState message="No application linked to this document." />
          )}
        </Section>

        <Section title="File Details">
          <FieldGrid>
            <Field
              label="Document Type"
              value={
                documentTypeLabels[doc.document_type] ??
                doc.document_type?.replace(/_/g, " ")
              }
            />
            <Field label="File Name" value={doc.file_name} />
            <Field
              label="Uploaded By"
              value={
                doc.uploadedByName
                  ? `${doc.uploadedByName} (${uploadedByTypeLabels[doc.uploaded_by_type] ?? doc.uploaded_by_type})`
                  : uploadedByTypeLabels[doc.uploaded_by_type] ??
                    doc.uploaded_by_type
              }
            />
            <Field
              label="Uploaded At"
              value={new Date(doc.created_at).toLocaleString("en-CA")}
            />
            <Field
              label="Last Updated"
              value={new Date(doc.updated_at).toLocaleString("en-CA")}
            />
          </FieldGrid>
          <div className="mt-4">
            <DocumentPreview
              bucket={doc.storage_bucket}
              storagePath={doc.storage_path}
              fileName={doc.file_name}
            />
          </div>
        </Section>

        <Section title="Review">
          {isAdmin ? (
            <div>
              {doc.reviewed_by && doc.reviewed_at && (
                <div className="mb-4 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-xs text-zinc-500">
                    Last reviewed by{" "}
                    <span className="font-medium text-zinc-700">
                      {doc.reviewedByName ?? "Unknown"}
                    </span>{" "}
                    on{" "}
                    {new Date(doc.reviewed_at).toLocaleString("en-CA")}
                  </p>
                </div>
              )}
              <DocumentReviewForm
                documentId={doc.id}
                currentStatus={doc.review_status}
                currentNotes={doc.review_notes}
              />
            </div>
          ) : (
            <div>
              <FieldGrid>
                <Field
                  label="Review Status"
                  value={
                    reviewStatusLabels[doc.review_status] ?? doc.review_status
                  }
                />
                <Field label="Review Notes" value={doc.review_notes} />
                {doc.reviewed_at && (
                  <Field
                    label="Reviewed At"
                    value={new Date(doc.reviewed_at).toLocaleString("en-CA")}
                  />
                )}
                {doc.reviewedByName && (
                  <Field label="Reviewed By" value={doc.reviewedByName} />
                )}
              </FieldGrid>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-6 py-4">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </dl>
  );
}

function Field({
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center">
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}
