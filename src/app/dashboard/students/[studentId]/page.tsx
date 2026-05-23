import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getStudentById } from "@/features/students/actions";
import { StudentEditForm } from "@/features/students/student-edit-form";
import { SalesIntakeForm } from "@/features/students/sales-intake-form";
import { AdminApplicationForm } from "@/features/students/admin-application-form";
import { SalesChecklistForm } from "@/features/students/sales-checklist-form";
import { GenerateWordButton } from "@/features/contracts/generate-word-button";
import { EmbeddedDocumentUpload } from "@/features/documents/embedded-document-upload";
import { InlineReviewStatus } from "@/features/documents/inline-review-status";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper, isSalesOrAdmin } from "@/lib/roles";
import { getHubPrograms, getHubBatches } from "@/features/students/hub-actions";
import { getBatchTransferHistory } from "@/features/students/batch-assignment-actions";
import { BatchAssignmentControls } from "@/features/students/batch-assignment-controls";

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

const feeStatusLabels: Record<string, string> = {
  draft: "Draft",
  admin_review: "Admin Review",
  approved: "Approved",
  archived: "Archived",
};

const feeStatusColors: Record<string, string> = {
  draft: "bg-blue-100 text-blue-800",
  admin_review: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  archived: "bg-zinc-100 text-zinc-600",
};

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const [data, profile] = await Promise.all([
    getStudentById(studentId),
    getUserProfile(),
  ]);

  if (!data) {
    notFound();
  }

  const {
    student,
    applications,
    documents,
    contracts,
    checklists,
    salesChecklists,
    feeSchedules,
    installments,
    ownerProfiles,
  } = data;

  const role = profile?.role ?? null;
  const isAdmin = isAdminOrSuper(role);
  const isSalesOrAbove = isSalesOrAdmin(role);
  const isViewer = role === "viewer";

  const latestApp = applications[0] as (typeof applications)[0] | undefined;

  const program = latestApp?.programs as {
    id: string;
    program_code: string;
    program_name: string;
    credential_name: string | null;
    total_hours: number | null;
    theory_hours: number | null;
    practicum_hours: number | null;
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
    practicum_1_location: string | null;
    practicum_2_location: string | null;
  } | null;

  const latestChecklist = checklists.find(
    (c) => c.application_id === latestApp?.id
  );

  const latestSalesChecklist = salesChecklists.find(
    (c) => c.application_id === latestApp?.id
  ) as {
    application_id: string;
    photo_id: string;
    proof_of_address: string;
    diploma_or_transcript: string;
    english_proof: string;
    immigration_status_document: string;
    payment_proof_deposit: string;
    other_documents: string;
    notes: string | null;
  } | undefined;

  const latestFeeSchedule = feeSchedules.find(
    (f) => f.application_id === latestApp?.id
  ) as Record<string, unknown> | undefined;

  const feeInstallments = latestFeeSchedule
    ? installments.filter(
        (inst) => inst.fee_schedule_id === latestFeeSchedule.id
      )
    : [];

  const latestContract = contracts.find(
    (c) => c.application_id === latestApp?.id
  );

  const practicumLocations = [
    batch?.practicum_1_location,
    batch?.practicum_2_location,
  ]
    .filter(Boolean)
    .join(", ");

  let programs: { id: string; program_code: string; program_name: string }[] =
    [];
  let batchesForProgram: {
    id: string;
    batch_name: string;
    batch_code: string | null;
    start_date: string | null;
  }[] = [];

  let transferHistory: Awaited<ReturnType<typeof getBatchTransferHistory>> = [];

  if (isSalesOrAbove && latestApp) {
    programs = await getHubPrograms();
    if (latestApp.program_id) {
      batchesForProgram = await getHubBatches(latestApp.program_id);
    }
  }

  if (latestApp) {
    transferHistory = await getBatchTransferHistory(studentId);
  }

  const canGenerateContract =
    isAdmin &&
    latestApp &&
    ["ready_for_contract", "contract_generated", "signature_pending", "signed"].includes(
      latestApp.status
    );

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/students"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          All Students
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              {student.legal_first_name}{" "}
              {student.legal_middle_name
                ? `${student.legal_middle_name} `
                : ""}
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
        {/* 1. Student Summary */}
        <Section title="Student Summary">
          <FieldGrid>
            <Field label="Student Number" value={student.student_number} />
            <Field
              label="Legal Full Name"
              value={[
                student.legal_first_name,
                student.legal_middle_name,
                student.legal_last_name,
              ]
                .filter(Boolean)
                .join(" ")}
            />
            <Field label="Preferred Name" value={student.preferred_name} />
            <Field
              label="Date of Birth"
              value={
                student.date_of_birth
                  ? new Date(student.date_of_birth).toLocaleDateString("en-CA")
                  : null
              }
            />
            <Field label="Phone" value={student.phone} />
            <Field label="Alternate Phone" value={student.alternate_phone} />
            <Field label="Email" value={student.email} />
            <Field
              label="Address"
              value={[
                student.mailing_address_line_1,
                student.mailing_address_line_2,
                [student.city, student.province].filter(Boolean).join(", "),
                student.postal_code,
                student.country,
              ]
                .filter(Boolean)
                .join(", ")}
            />
            <Field
              label="Immigration Status"
              value={student.immigration_status}
            />
            <Field
              label="International Student"
              value={
                student.international_student === null
                  ? null
                  : student.international_student
                    ? "Yes"
                    : "No"
              }
            />
            <Field label="Notes" value={student.notes} />
          </FieldGrid>
        </Section>

        {/* 2. Edit Student Information - sales and admin */}
        {isSalesOrAbove && (
          <Section title="Edit Student Information">
            <StudentEditForm student={student} />
          </Section>
        )}

        {/* 3. Sales Intake - editable by sales, viewable by admin */}
        {isSalesOrAbove && latestApp && (
          <Section title="Sales Intake">
            <div className="mb-4 flex items-center gap-3">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[latestApp.status] ?? "bg-zinc-100 text-zinc-600"
                }`}
              >
                {statusLabels[latestApp.status] ?? latestApp.status}
              </span>
              <span className="text-xs text-zinc-400">
                Created{" "}
                {new Date(latestApp.created_at).toLocaleDateString("en-CA")}
              </span>
            </div>
            <FieldGrid>
              <Field
                label="Sales Owner"
                value={
                  latestApp.sales_owner
                    ? ownerProfiles[latestApp.sales_owner] ?? latestApp.sales_owner
                    : null
                }
              />
              <Field
                label="Admin Owner"
                value={
                  latestApp.admin_owner
                    ? ownerProfiles[latestApp.admin_owner] ?? latestApp.admin_owner
                    : null
                }
              />
              {latestApp.submitted_to_admin_at && (
                <Field
                  label="Submitted to Admin"
                  value={new Date(
                    latestApp.submitted_to_admin_at
                  ).toLocaleDateString("en-CA")}
                />
              )}
            </FieldGrid>
            <div className="mt-5 border-t border-zinc-100 pt-5">
              {role === "sales" ? (
                <SalesIntakeForm
                  application={{
                    id: latestApp.id,
                    status: latestApp.status,
                    lead_source: latestApp.lead_source,
                    program_id: latestApp.program_id,
                    batch_id: latestApp.batch_id,
                    price_discussed: latestApp.price_discussed
                      ? Number(latestApp.price_discussed)
                      : null,
                    deposit_discussed: latestApp.deposit_discussed
                      ? Number(latestApp.deposit_discussed)
                      : null,
                    sales_notes: latestApp.sales_notes,
                    student_id: student.id,
                  }}
                  programs={programs}
                  initialBatches={batchesForProgram}
                />
              ) : (
                <FieldGrid>
                  <Field label="Lead Source" value={latestApp.lead_source} />
                  <Field
                    label="Program Interest"
                    value={program?.program_name ?? null}
                  />
                  <Field
                    label="Batch Interest"
                    value={batch?.batch_name ?? null}
                  />
                  <Field
                    label="Price Discussed"
                    value={
                      latestApp.price_discussed != null
                        ? formatCurrency(Number(latestApp.price_discussed))
                        : null
                    }
                  />
                  <Field
                    label="Deposit Discussed"
                    value={
                      latestApp.deposit_discussed != null
                        ? formatCurrency(Number(latestApp.deposit_discussed))
                        : null
                    }
                  />
                  <Field label="Sales Notes" value={latestApp.sales_notes} />
                </FieldGrid>
              )}
            </div>
          </Section>
        )}

        {/* Viewer: read-only intake/application view */}
        {isViewer && latestApp && (
          <Section title="Intake and Application">
            <div className="mb-3 flex items-center gap-3">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[latestApp.status] ?? "bg-zinc-100 text-zinc-600"
                }`}
              >
                {statusLabels[latestApp.status] ?? latestApp.status}
              </span>
              <span className="text-xs text-zinc-400">
                Created{" "}
                {new Date(latestApp.created_at).toLocaleDateString("en-CA")}
              </span>
            </div>
            <FieldGrid>
              <Field label="Lead Source" value={latestApp.lead_source} />
              <Field
                label="Sales Owner"
                value={
                  latestApp.sales_owner
                    ? ownerProfiles[latestApp.sales_owner] ?? latestApp.sales_owner
                    : null
                }
              />
              <Field
                label="Admin Owner"
                value={
                  latestApp.admin_owner
                    ? ownerProfiles[latestApp.admin_owner] ?? latestApp.admin_owner
                    : null
                }
              />
              <Field
                label="Price Discussed"
                value={
                  latestApp.price_discussed != null
                    ? formatCurrency(Number(latestApp.price_discussed))
                    : null
                }
              />
              <Field
                label="Deposit Discussed"
                value={
                  latestApp.deposit_discussed != null
                    ? formatCurrency(Number(latestApp.deposit_discussed))
                    : null
                }
              />
              <Field label="Sales Notes" value={latestApp.sales_notes} />
              {latestApp.submitted_to_admin_at && (
                <Field
                  label="Submitted to Admin"
                  value={new Date(
                    latestApp.submitted_to_admin_at
                  ).toLocaleDateString("en-CA")}
                />
              )}
            </FieldGrid>
          </Section>
        )}

        {/* 4. Sales Checklist */}
        {(isSalesOrAbove || isViewer) && latestApp && (
          <Section title="Sales Checklist">
            <p className="mb-4 text-xs text-zinc-400">
              This is the sales-facing document checklist. The official admin
              checklist is separate.
            </p>
            <SalesChecklistForm
              applicationId={latestApp.id}
              checklist={latestSalesChecklist ?? null}
              readOnly={isViewer}
            />
          </Section>
        )}

        {/* 5. Admin Review - admin only editing */}
        {isAdmin && latestApp && (
          <Section title="Admin Review">
            <AdminApplicationForm
              application={{
                id: latestApp.id,
                status: latestApp.status,
                program_id: latestApp.program_id,
                batch_id: latestApp.batch_id,
                admin_notes: latestApp.admin_notes,
              }}
              programs={programs}
              initialBatches={batchesForProgram}
            />
          </Section>
        )}

        {/* 6. Program and Batch */}
        <Section title="Program and Batch">
          {!program ? (
            <EmptyState message="No program assigned yet." />
          ) : (
            <>
              <FieldGrid>
                <Field label="Program Name" value={program.program_name} />
                <Field label="Program Code" value={program.program_code} />
                <Field label="Credential" value={program.credential_name} />
                <Field
                  label="Total Hours"
                  value={
                    program.total_hours != null
                      ? String(program.total_hours)
                      : null
                  }
                />
                <Field
                  label="Theory Hours"
                  value={
                    program.theory_hours != null
                      ? String(program.theory_hours)
                      : null
                  }
                />
                <Field
                  label="Practicum Hours"
                  value={
                    program.practicum_hours != null
                      ? String(program.practicum_hours)
                      : null
                  }
                />
                <Field label="Batch Name" value={batch?.batch_name ?? null} />
                <Field
                  label="Start Date"
                  value={
                    batch?.start_date
                      ? new Date(batch.start_date).toLocaleDateString("en-CA")
                      : null
                  }
                />
                <Field
                  label="Expected End Date"
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
                <Field
                  label="Training Location"
                  value={batch?.training_location ?? null}
                />
                <Field
                  label="Practicum Locations"
                  value={practicumLocations || null}
                />
              </FieldGrid>
              {batch && latestApp && (
                <BatchAssignmentControls
                  studentId={studentId}
                  applicationId={latestApp.id}
                  currentBatchId={batch.id}
                  batches={batchesForProgram}
                  transferHistory={transferHistory}
                  isAdmin={isAdmin}
                />
              )}
            </>
          )}
        </Section>

        {/* 7. Documents */}
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-6 py-4">
            <h2 className="text-base font-semibold text-zinc-900">Documents</h2>
          </div>
          <div className="px-6 py-5">
            {isSalesOrAbove && (
              <div className="mb-5">
                <EmbeddedDocumentUpload
                  studentId={studentId}
                  applications={(applications ?? []).map((app) => ({
                    id: app.id,
                    status: app.status,
                    programs: app.programs as {
                      id: string;
                      program_code: string;
                      program_name: string;
                    } | null,
                    batches: app.batches as {
                      id: string;
                      batch_name: string;
                    } | null,
                  }))}
                />
              </div>
            )}
            {documents.length === 0 ? (
              <EmptyState message="No documents uploaded yet." />
            ) : (
              <div className="overflow-x-auto rounded-md border border-zinc-200">
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
                        By
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {documents.map((doc) => {
                      const docApp = doc.applications as unknown as {
                        id: string;
                        status: string;
                        programs: {
                          id: string;
                          program_code: string;
                          program_name: string;
                        } | null;
                      } | null;

                      return (
                        <tr key={doc.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-2.5 text-sm text-zinc-900">
                            {documentTypeLabels[doc.document_type] ??
                              doc.document_type.replace(/_/g, " ")}
                          </td>
                          <td className="max-w-48 truncate px-4 py-2.5 text-sm text-zinc-600">
                            {doc.file_name}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-zinc-500">
                            {docApp?.programs?.program_code ?? "--"}
                          </td>
                          <td className="px-4 py-2.5">
                            {isAdmin ? (
                              <InlineReviewStatus
                                documentId={doc.id}
                                currentStatus={doc.review_status}
                              />
                            ) : (
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${documentStatusColors[doc.review_status] ?? "bg-zinc-100 text-zinc-600"}`}
                              >
                                {documentStatusLabels[doc.review_status] ??
                                  doc.review_status}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-zinc-500">
                            {new Date(doc.created_at).toLocaleDateString(
                              "en-CA"
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-zinc-500">
                            {uploadedByTypeLabels[doc.uploaded_by_type] ??
                              doc.uploaded_by_type}
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

        {/* 8. Admission and English Checklist */}
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Official Checklist - Admission and English
            </h2>
            {latestApp && isAdmin && (
              <Link
                href={`/dashboard/checklists/${latestApp.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Edit Checklist
              </Link>
            )}
          </div>
          <div className="px-6 py-5">
            {!latestChecklist ? (
              <EmptyState message="No admission checklist created yet." />
            ) : (
              <FieldGrid>
                <Field
                  label="Photo ID"
                  value={
                    checklistStatusLabels[
                      latestChecklist.photo_id_status as string
                    ] ?? (latestChecklist.photo_id_status as string)
                  }
                />
                <Field
                  label="Address Proof"
                  value={
                    checklistStatusLabels[
                      latestChecklist.address_proof_status as string
                    ] ?? (latestChecklist.address_proof_status as string)
                  }
                />
                <Field
                  label="Academic Route"
                  value={
                    (latestChecklist.academic_route as string)?.replace(
                      /_/g,
                      " "
                    ) ?? null
                  }
                />
                <Field
                  label="Academic Status"
                  value={
                    checklistStatusLabels[
                      latestChecklist.academic_status as string
                    ] ?? (latestChecklist.academic_status as string)
                  }
                />
                <Field
                  label="English Route"
                  value={
                    (latestChecklist.english_route as string)?.replace(
                      /_/g,
                      " "
                    ) ?? null
                  }
                />
                <Field
                  label="English Status"
                  value={
                    checklistStatusLabels[
                      latestChecklist.english_status as string
                    ] ?? (latestChecklist.english_status as string)
                  }
                />
                <Field
                  label="English Score"
                  value={latestChecklist.english_score as string | null}
                />
                {((latestChecklist.academic_notes as string) ||
                  (latestChecklist.english_notes as string)) && (
                  <Field
                    label="Notes"
                    value={
                      [
                        latestChecklist.academic_notes as string | null,
                        latestChecklist.english_notes as string | null,
                      ]
                        .filter(Boolean)
                        .join(" | ") || null
                    }
                  />
                )}
              </FieldGrid>
            )}
          </div>
        </div>

        {/* 9. Fees and Payment Schedule */}
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Fees and Payment Schedule
            </h2>
            {latestApp && isAdmin && (
              <Link
                href={`/dashboard/fees/${latestApp.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Edit Fees
              </Link>
            )}
          </div>
          <div className="px-6 py-5">
            {!latestFeeSchedule ? (
              <EmptyState message="No fee schedule created yet." />
            ) : (
              <>
                <div className="mb-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${feeStatusColors[latestFeeSchedule.status as string] ?? "bg-zinc-100 text-zinc-600"}`}
                  >
                    {feeStatusLabels[latestFeeSchedule.status as string] ??
                      (latestFeeSchedule.status as string)}
                  </span>
                </div>
                <FieldGrid>
                  <Field
                    label="Tuition Fee"
                    value={formatCurrency(
                      latestFeeSchedule.tuition_fee as number | null
                    )}
                  />
                  <Field
                    label="Total Fees"
                    value={formatCurrency(
                      latestFeeSchedule.total_fees as number | null
                    )}
                  />
                  <Field
                    label="Discount"
                    value={formatCurrency(
                      latestFeeSchedule.discount_amount as number | null
                    )}
                  />
                  <Field
                    label="Payment Before Signing"
                    value={formatCurrency(
                      latestFeeSchedule.payment_before_signing as number | null
                    )}
                  />
                  <Field
                    label="Payment After Signing"
                    value={formatCurrency(
                      latestFeeSchedule.payment_after_signing as number | null
                    )}
                  />
                  <Field
                    label="Remaining Balance"
                    value={formatCurrency(
                      latestFeeSchedule.remaining_balance as number | null
                    )}
                  />
                  <Field
                    label="Number of Installments"
                    value={
                      latestFeeSchedule.number_of_installments != null
                        ? String(latestFeeSchedule.number_of_installments)
                        : null
                    }
                  />
                </FieldGrid>

                {feeInstallments.length > 0 && (
                  <div className="mt-4 border-t border-zinc-100 pt-4">
                    <h3 className="mb-3 text-sm font-medium text-zinc-700">
                      Payment Installments
                    </h3>
                    <div className="overflow-x-auto rounded-md border border-zinc-200">
                      <table className="min-w-full divide-y divide-zinc-200">
                        <thead className="bg-zinc-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                              No.
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                              Due Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                              Amount
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {feeInstallments.map((inst) => (
                            <tr key={inst.id as string}>
                              <td className="px-4 py-2 text-sm text-zinc-900">
                                {inst.installment_number as number}
                              </td>
                              <td className="px-4 py-2 text-sm text-zinc-600">
                                {inst.due_date
                                  ? new Date(
                                      inst.due_date as string
                                    ).toLocaleDateString("en-CA")
                                  : "--"}
                              </td>
                              <td className="px-4 py-2 text-sm text-zinc-900">
                                {formatCurrency(inst.amount_due as number)}
                              </td>
                              <td className="px-4 py-2 text-sm text-zinc-500">
                                {(inst.notes as string) || "--"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 10. Contract - Word Export */}
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Contract - Word Export
            </h2>
            {latestApp && isAdmin && (
              <Link
                href={`/dashboard/contracts/${latestApp.id}/preview`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Contract Preview
              </Link>
            )}
          </div>
          <div className="px-6 py-5">
            {!latestContract ? (
              <div>
                <EmptyState message="No contract generated yet. Complete the checklist and fee schedule first." />
                {canGenerateContract && (
                  <div className="mt-4 flex justify-center">
                    <GenerateWordButton applicationId={latestApp.id} />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between rounded-md border border-zinc-200 p-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {latestContract.contract_number ?? "Draft Contract"}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {contractStatusLabels[latestContract.status] ??
                        latestContract.status}
                    </p>
                  </div>
                  <div className="text-right text-xs text-zinc-400">
                    {latestContract.signed_at ? (
                      <span>
                        Signed{" "}
                        {new Date(latestContract.signed_at).toLocaleDateString(
                          "en-CA"
                        )}
                      </span>
                    ) : latestContract.generated_at ? (
                      <span>
                        Generated{" "}
                        {new Date(
                          latestContract.generated_at
                        ).toLocaleDateString("en-CA")}
                      </span>
                    ) : null}
                  </div>
                </div>
                {canGenerateContract && (
                  <div className="mt-4">
                    <GenerateWordButton applicationId={latestApp.id} />
                  </div>
                )}
              </div>
            )}
            <p className="mt-3 text-xs text-zinc-400">
              Official contract output is Word DOCX only.
            </p>
          </div>
        </div>

        {/* 11. Internal Notes Placeholder */}
        {isAdmin && (
          <Section title="Internal Notes">
            <EmptyState message="Internal notes will be available in a future update." />
          </Section>
        )}

        {/* 12. Activity / Audit Placeholder */}
        {isAdmin && (
          <Section title="Activity / Audit Log">
            <EmptyState message="Activity and audit log will be available in a future update." />
          </Section>
        )}
      </div>
    </div>
  );
}

function formatCurrency(value: number | null | undefined): string | null {
  if (value == null) return null;
  return `$${Number(value).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`;
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
