import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getChecklistDetail } from "@/features/checklists/actions";
import { ChecklistForm } from "@/features/checklists/checklist-form";
import { CreateChecklistButton } from "@/features/checklists/create-checklist-button";

const applicationStatusLabels: Record<string, string> = {
  new_intake: "New Intake",
  admin_review: "Admin Review",
  information_needed: "Information Needed",
  ready_for_contract: "Ready for Contract",
  contract_generated: "Contract Generated",
  signature_pending: "Signature Pending",
  signed: "Signed",
  archived: "Archived",
};

const applicationStatusColors: Record<string, string> = {
  new_intake: "bg-blue-100 text-blue-800",
  admin_review: "bg-amber-100 text-amber-800",
  information_needed: "bg-orange-100 text-orange-800",
  ready_for_contract: "bg-green-100 text-green-800",
  contract_generated: "bg-purple-100 text-purple-800",
  signature_pending: "bg-indigo-100 text-indigo-800",
  signed: "bg-emerald-100 text-emerald-800",
  archived: "bg-zinc-100 text-zinc-600",
};

const docStatusLabels: Record<string, string> = {
  uploaded: "Uploaded",
  accepted: "Accepted",
  needs_correction: "Needs Correction",
  archived: "Archived",
};

const docStatusColors: Record<string, string> = {
  uploaded: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  needs_correction: "bg-orange-100 text-orange-800",
  archived: "bg-zinc-100 text-zinc-600",
};

function computeReadiness(checklist: {
  photo_id_status: string | null;
  address_proof_status: string | null;
  academic_status: string | null;
  english_status: string | null;
}): Array<{ label: string; status: string; ready: boolean }> {
  return [
    {
      label: "Photo ID",
      status: checklist.photo_id_status ?? "not_received",
      ready: checklist.photo_id_status === "accepted",
    },
    {
      label: "Address Proof",
      status: checklist.address_proof_status ?? "not_received",
      ready: checklist.address_proof_status === "accepted",
    },
    {
      label: "Academic Requirement",
      status: checklist.academic_status ?? "not_started",
      ready: checklist.academic_status === "accepted",
    },
    {
      label: "English Proficiency",
      status: checklist.english_status ?? "not_started",
      ready:
        checklist.english_status === "accepted" ||
        checklist.english_status === "not_required",
    },
  ];
}

const readinessStatusLabels: Record<string, string> = {
  not_received: "Not Received",
  uploaded: "Uploaded",
  accepted: "Accepted",
  needs_correction: "Needs Correction",
  not_started: "Not Started",
  in_review: "In Review",
  not_required: "Not Required",
};

export default async function ChecklistDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const data = await getChecklistDetail(applicationId);

  if (!data) {
    notFound();
  }

  const { application, checklist, documents } = data;

  const student = application.students as unknown as {
    id: string;
    legal_first_name: string;
    legal_middle_name: string | null;
    legal_last_name: string;
    email: string | null;
    phone: string | null;
    student_number: string | null;
    date_of_birth: string | null;
    immigration_status: string | null;
    international_student: boolean | null;
  } | null;

  const program = application.programs as unknown as {
    id: string;
    program_code: string;
    program_name: string;
    credential_name: string | null;
    total_hours: number | null;
  } | null;

  const batch = application.batches as unknown as {
    id: string;
    batch_name: string;
    batch_code: string | null;
    start_date: string | null;
    expected_end_date: string | null;
    delivery_method: string | null;
  } | null;

  const readinessItems = checklist ? computeReadiness(checklist) : null;
  const allReady = readinessItems?.every((item) => item.ready) ?? false;

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/checklists"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Checklists
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Admission Checklist
              {student
                ? ` - ${student.legal_first_name} ${student.legal_last_name}`
                : ""}
            </h1>
            {student?.student_number && (
              <p className="mt-1 text-sm text-zinc-500">
                Student No. {student.student_number}
              </p>
            )}
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              applicationStatusColors[application.status] ??
              "bg-zinc-100 text-zinc-600"
            }`}
          >
            {applicationStatusLabels[application.status] ?? application.status}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <Section title="Student Information">
          {student ? (
            <FieldGrid>
              <Field
                label="Name"
                value={
                  [
                    student.legal_first_name,
                    student.legal_middle_name,
                    student.legal_last_name,
                  ]
                    .filter(Boolean)
                    .join(" ") || null
                }
              />
              <Field label="Email" value={student.email} />
              <Field label="Phone" value={student.phone} />
              <Field label="Student Number" value={student.student_number} />
              <Field
                label="Date of Birth"
                value={
                  student.date_of_birth
                    ? new Date(student.date_of_birth).toLocaleDateString(
                        "en-CA"
                      )
                    : null
                }
              />
              <Field
                label="Immigration Status"
                value={student.immigration_status?.replace(/_/g, " ") ?? null}
              />
              <Field
                label="International Student"
                value={
                  student.international_student != null
                    ? student.international_student
                      ? "Yes"
                      : "No"
                    : null
                }
              />
            </FieldGrid>
          ) : (
            <EmptyState message="No student information available." />
          )}
        </Section>

        <Section title="Program and Batch">
          {program ? (
            <FieldGrid>
              <Field label="Program" value={program.program_name} />
              <Field label="Program Code" value={program.program_code} />
              <Field label="Credential" value={program.credential_name} />
              <Field
                label="Total Hours"
                value={program.total_hours ? String(program.total_hours) : null}
              />
              <Field label="Batch" value={batch?.batch_name ?? null} />
              <Field label="Batch Code" value={batch?.batch_code ?? null} />
              <Field
                label="Start Date"
                value={
                  batch?.start_date
                    ? new Date(batch.start_date).toLocaleDateString("en-CA")
                    : null
                }
              />
              <Field
                label="End Date"
                value={
                  batch?.expected_end_date
                    ? new Date(batch.expected_end_date).toLocaleDateString(
                        "en-CA"
                      )
                    : null
                }
              />
              <Field
                label="Delivery Method"
                value={batch?.delivery_method?.replace(/_/g, " ") ?? null}
              />
            </FieldGrid>
          ) : (
            <EmptyState message="No program assigned yet." />
          )}
        </Section>

        <Section title="Readiness Summary">
          {readinessItems ? (
            <div>
              <div className="mb-4">
                {allReady ? (
                  <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3">
                    <p className="text-sm font-medium text-green-800">
                      All admission requirements are met. This application is
                      ready for contract preparation.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm font-medium text-amber-800">
                      Some admission requirements are not yet complete.
                    </p>
                  </div>
                )}
              </div>
              <div className="divide-y divide-zinc-100">
                {readinessItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="text-sm text-zinc-700">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">
                        {readinessStatusLabels[item.status] ?? item.status}
                      </span>
                      <span
                        className={`inline-flex h-2 w-2 rounded-full ${
                          item.ready ? "bg-green-500" : "bg-zinc-300"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {checklist?.admin_verified_at && (
                <p className="mt-4 text-xs text-zinc-400">
                  Last verified:{" "}
                  {new Date(checklist.admin_verified_at).toLocaleString("en-CA")}
                </p>
              )}
            </div>
          ) : (
            <EmptyState message="Checklist has not been created yet." />
          )}
        </Section>

        <Section title="Document Summary">
          {documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      File Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Uploaded
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-3 py-2 text-sm text-zinc-900">
                        {doc.document_type?.replace(/_/g, " ") ?? "--"}
                      </td>
                      <td className="px-3 py-2 text-sm text-zinc-600">
                        {doc.file_name ?? "--"}
                      </td>
                      <td className="px-3 py-2">
                        {doc.review_status ? (
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              docStatusColors[doc.review_status] ??
                              "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {docStatusLabels[doc.review_status] ??
                              doc.review_status}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">--</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-500">
                        {new Date(doc.created_at).toLocaleDateString("en-CA")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No documents uploaded for this student." />
          )}
        </Section>

        <Section title="Admission Checklist">
          {checklist ? (
            <ChecklistForm applicationId={applicationId} checklist={checklist} />
          ) : (
            <div className="text-center py-8">
              <p className="mb-4 text-sm text-zinc-500">
                No checklist exists for this application yet.
              </p>
              <CreateChecklistButton applicationId={applicationId} />
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
