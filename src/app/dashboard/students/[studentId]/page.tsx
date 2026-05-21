import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { getStudentById } from "@/features/students/actions";
import { StudentEditForm } from "@/features/students/student-edit-form";

const statusLabels: Record<string, string> = {
  new_intake: "New Intake",
  admin_review: "Admin Review",
  information_needed: "Information Needed",
  ready_for_contract: "Ready for Contract",
  contract_generated: "Contract Generated",
  signature_pending: "Signature Pending",
  signed: "Signed",
  archived: "Archived",
};

const statusColors: Record<string, string> = {
  new_intake: "bg-blue-100 text-blue-800",
  admin_review: "bg-amber-100 text-amber-800",
  information_needed: "bg-orange-100 text-orange-800",
  ready_for_contract: "bg-green-100 text-green-800",
  contract_generated: "bg-purple-100 text-purple-800",
  signature_pending: "bg-indigo-100 text-indigo-800",
  signed: "bg-emerald-100 text-emerald-800",
  archived: "bg-zinc-100 text-zinc-600",
};

const checklistStatusLabels: Record<string, string> = {
  not_received: "Not Received",
  uploaded: "Uploaded",
  accepted: "Accepted",
  needs_correction: "Needs Correction",
  not_started: "Not Started",
  in_review: "In Review",
};

const documentStatusLabels: Record<string, string> = {
  uploaded: "Uploaded",
  accepted: "Accepted",
  needs_correction: "Needs Correction",
  archived: "Archived",
};

const documentStatusColors: Record<string, string> = {
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

const contractStatusLabels: Record<string, string> = {
  draft: "Draft",
  generated: "Generated",
  signature_pending: "Signature Pending",
  signed_uploaded: "Signed (Uploaded)",
  signed_external: "Signed (External)",
  stored: "Stored",
  cancelled: "Cancelled",
  archived: "Archived",
};

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const data = await getStudentById(studentId);

  if (!data) {
    notFound();
  }

  const { student, applications, quotes, documents, contracts, checklists } =
    data;

  const latestApp = applications[0] as
    | (typeof applications)[0]
    | undefined;

  const program = latestApp?.programs as {
    id: string;
    program_code: string;
    program_name: string;
    credential_name: string | null;
    total_hours: number | null;
  } | null;

  const batch = latestApp?.batches as {
    id: string;
    batch_name: string;
    batch_code: string | null;
    start_date: string | null;
    expected_end_date: string | null;
    class_days: string | null;
    class_time: string | null;
    delivery_method: string | null;
    training_location: string | null;
  } | null;

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/students"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Students
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              {student.legal_first_name}{" "}
              {student.legal_middle_name ? `${student.legal_middle_name} ` : ""}
              {student.legal_last_name}
            </h1>
            {student.student_number && (
              <p className="mt-1 text-sm text-zinc-500">
                Student No. {student.student_number}
              </p>
            )}
          </div>
          {latestApp && (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                statusColors[latestApp.status] ?? "bg-zinc-100 text-zinc-600"
              }`}
            >
              {statusLabels[latestApp.status] ?? latestApp.status}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Student Edit Form */}
        <Section title="Student Information - Edit">
          <StudentEditForm student={student} />
        </Section>

        {/* Application / Intake Summary */}
        <Section title="Application / Intake Summary">
          {applications.length === 0 ? (
            <EmptyState message="No applications found for this student." />
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-md border border-zinc-200 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[app.status] ?? "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {statusLabels[app.status] ?? app.status}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(app.created_at).toLocaleDateString("en-CA")}
                    </span>
                  </div>
                  <FieldGrid>
                    <Field label="Lead Source" value={app.lead_source} />
                    <Field label="Sales Notes" value={app.sales_notes} />
                    <Field label="Admin Notes" value={app.admin_notes} />
                    <Field
                      label="Submitted to Admin"
                      value={
                        app.submitted_to_admin_at
                          ? new Date(
                              app.submitted_to_admin_at
                            ).toLocaleDateString("en-CA")
                          : null
                      }
                    />
                  </FieldGrid>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Program and Batch */}
        <Section title="Program and Batch">
          {!program ? (
            <EmptyState message="No program assigned yet." />
          ) : (
            <FieldGrid>
              <Field label="Program" value={program.program_name} />
              <Field label="Program Code" value={program.program_code} />
              <Field label="Credential" value={program.credential_name} />
              <Field
                label="Total Hours"
                value={
                  program.total_hours ? String(program.total_hours) : null
                }
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
              <Field label="Class Days" value={batch?.class_days ?? null} />
              <Field label="Class Time" value={batch?.class_time ?? null} />
              <Field
                label="Delivery Method"
                value={batch?.delivery_method?.replace("_", " ") ?? null}
              />
              <Field
                label="Training Location"
                value={batch?.training_location ?? null}
              />
            </FieldGrid>
          )}
        </Section>

        {/* Quote / Price Discussed */}
        <Section title="Quote / Price Discussed">
          {quotes.length === 0 ? (
            <EmptyState message="No quotes recorded yet." />
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="rounded-md border border-zinc-200 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 capitalize">
                      {quote.status?.replace("_", " ") ?? "Draft"}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(quote.created_at).toLocaleDateString("en-CA")}
                    </span>
                  </div>
                  <FieldGrid>
                    <Field
                      label="Quoted Total"
                      value={
                        quote.quoted_total != null
                          ? `$${Number(quote.quoted_total).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`
                          : null
                      }
                    />
                    <Field
                      label="Discount"
                      value={
                        quote.discount_amount != null &&
                        Number(quote.discount_amount) > 0
                          ? `$${Number(quote.discount_amount).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`
                          : null
                      }
                    />
                    <Field
                      label="Deposit Discussed"
                      value={
                        quote.deposit_discussed != null &&
                        Number(quote.deposit_discussed) > 0
                          ? `$${Number(quote.deposit_discussed).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`
                          : null
                      }
                    />
                    <Field
                      label="Payment Notes"
                      value={quote.payment_notes}
                    />
                    <Field label="Quote Notes" value={quote.quote_notes} />
                  </FieldGrid>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Admission Checklist */}
        <Section title="Admission Checklist">
          {checklists.length === 0 ? (
            <EmptyState message="No admission checklist created yet. This will be available once the application is reviewed." />
          ) : (
            <div className="space-y-4">
              {checklists.map((checklist) => (
                <div
                  key={checklist.id as string}
                  className="rounded-md border border-zinc-200 p-4"
                >
                  <FieldGrid>
                    <Field
                      label="Photo ID"
                      value={
                        checklistStatusLabels[
                          checklist.photo_id_status as string
                        ] ?? (checklist.photo_id_status as string)
                      }
                    />
                    <Field
                      label="Address Proof"
                      value={
                        checklistStatusLabels[
                          checklist.address_proof_status as string
                        ] ?? (checklist.address_proof_status as string)
                      }
                    />
                    <Field
                      label="Academic Route"
                      value={
                        (checklist.academic_route as string)?.replace(
                          /_/g,
                          " "
                        ) ?? null
                      }
                    />
                    <Field
                      label="Academic Status"
                      value={
                        checklistStatusLabels[
                          checklist.academic_status as string
                        ] ?? (checklist.academic_status as string)
                      }
                    />
                    <Field
                      label="English Route"
                      value={
                        (checklist.english_route as string)?.replace(
                          /_/g,
                          " "
                        ) ?? null
                      }
                    />
                    <Field
                      label="English Status"
                      value={
                        checklistStatusLabels[
                          checklist.english_status as string
                        ] ?? (checklist.english_status as string)
                      }
                    />
                    <Field
                      label="English Score"
                      value={checklist.english_score as string | null}
                    />
                  </FieldGrid>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Documents */}
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
            <h2 className="text-base font-semibold text-zinc-900">Documents</h2>
            <Link
              href={`/dashboard/documents/new?studentId=${studentId}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Upload Document
            </Link>
          </div>
          <div className="px-6 py-5">
            {documents.length === 0 ? (
              <EmptyState message="No documents uploaded yet. Documents will appear here once uploaded." />
            ) : (
              <div className="overflow-hidden rounded-md border border-zinc-200">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Type
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        File Name
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Application
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Uploaded
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Uploaded By
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {documents.map((doc) => {
                      const appInfo = doc.applications as unknown as {
                        id: string;
                        status: string;
                        programs: { id: string; program_code: string; program_name: string } | null;
                      } | null;
                      return (
                        <tr key={doc.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-2.5 text-sm text-zinc-900">
                            {documentTypeLabels[doc.document_type] ?? doc.document_type.replace(/_/g, " ")}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-zinc-600 max-w-48 truncate">
                            {doc.file_name}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-zinc-600">
                            {appInfo?.programs?.program_code ?? "--"}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${documentStatusColors[doc.review_status] ?? "bg-zinc-100 text-zinc-600"}`}>
                              {documentStatusLabels[doc.review_status] ??
                                doc.review_status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-zinc-500">
                            {new Date(doc.created_at).toLocaleDateString("en-CA")}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-zinc-500">
                            {uploadedByTypeLabels[doc.uploaded_by_type] ?? doc.uploaded_by_type}
                          </td>
                          <td className="px-4 py-2.5">
                            <Link
                              href={`/dashboard/documents/${doc.id}`}
                              className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Contract Readiness */}
        <Section title="Contract Readiness">
          {contracts.length === 0 ? (
            <EmptyState message="No contracts generated yet. Contracts will be created once the application is ready." />
          ) : (
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between rounded-md border border-zinc-200 p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {contract.contract_number ?? "Draft Contract"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {contractStatusLabels[contract.status] ??
                        contract.status}
                    </p>
                  </div>
                  <div className="text-right text-xs text-zinc-400">
                    {contract.signed_at ? (
                      <span>
                        Signed{" "}
                        {new Date(contract.signed_at).toLocaleDateString(
                          "en-CA"
                        )}
                      </span>
                    ) : contract.generated_at ? (
                      <span>
                        Generated{" "}
                        {new Date(contract.generated_at).toLocaleDateString(
                          "en-CA"
                        )}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
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
