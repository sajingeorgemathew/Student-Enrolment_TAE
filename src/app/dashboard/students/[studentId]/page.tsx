import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, ExternalLink } from "lucide-react";
import { getStudentById } from "@/features/students/actions";
import { StudentEditForm } from "@/features/students/student-edit-form";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper, isSalesOrAdmin } from "@/lib/roles";

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
    feeSchedules,
    installments,
    ownerProfiles,
  } = data;

  const role = profile?.role ?? null;
  const isAdmin = isAdminOrSuper(role);
  const isSalesOrAbove = isSalesOrAdmin(role);

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

        {/* Student Edit Form - visible to sales and admin */}
        {isSalesOrAbove && (
          <Section title="Edit Student Information">
            <StudentEditForm student={student} />
          </Section>
        )}

        {/* 2. Intake and Application */}
        <Section title="Intake and Application">
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
                      Created{" "}
                      {new Date(app.created_at).toLocaleDateString("en-CA")}
                    </span>
                  </div>
                  <FieldGrid>
                    <Field label="Lead Source" value={app.lead_source} />
                    <Field
                      label="Sales Owner"
                      value={
                        app.sales_owner
                          ? ownerProfiles[app.sales_owner] ?? app.sales_owner
                          : null
                      }
                    />
                    <Field
                      label="Admin Owner"
                      value={
                        app.admin_owner
                          ? ownerProfiles[app.admin_owner] ?? app.admin_owner
                          : null
                      }
                    />
                    <Field
                      label="Price Discussed"
                      value={
                        app.price_discussed != null
                          ? `$${Number(app.price_discussed).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`
                          : null
                      }
                    />
                    <Field
                      label="Deposit Discussed"
                      value={
                        app.deposit_discussed != null
                          ? `$${Number(app.deposit_discussed).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`
                          : null
                      }
                    />
                    <Field label="Sales Notes" value={app.sales_notes} />
                    {isAdmin && (
                      <Field label="Admin Notes" value={app.admin_notes} />
                    )}
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

        {/* 3. Program and Batch */}
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
              {batch && isAdmin && (
                <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-4">
                  <Link
                    href={`/dashboard/batches/${batch.id}/edit`}
                    className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                  >
                    Edit Batch
                  </Link>
                </div>
              )}
            </>
          )}
        </Section>

        {/* 4. Documents */}
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
            <h2 className="text-base font-semibold text-zinc-900">Documents</h2>
            {isSalesOrAbove && (
              <Link
                href={`/dashboard/documents/new?studentId=${studentId}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
              >
                <Plus className="h-3.5 w-3.5" />
                Upload Document
              </Link>
            )}
          </div>
          <div className="px-6 py-5">
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
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-2.5 text-sm text-zinc-900">
                          {documentTypeLabels[doc.document_type] ??
                            doc.document_type.replace(/_/g, " ")}
                        </td>
                        <td className="max-w-48 truncate px-4 py-2.5 text-sm text-zinc-600">
                          {doc.file_name}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${documentStatusColors[doc.review_status] ?? "bg-zinc-100 text-zinc-600"}`}
                          >
                            {documentStatusLabels[doc.review_status] ??
                              doc.review_status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-zinc-500">
                          {new Date(doc.created_at).toLocaleDateString("en-CA")}
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 5. Admission and English Checklist */}
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Admission and English Checklist
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
                {(latestChecklist.academic_notes as string ||
                  latestChecklist.english_notes as string) ? (
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
                ) : null}
              </FieldGrid>
            )}
          </div>
        </div>

        {/* 6. Fees and Payment Schedule */}
        {(isAdmin || role === "viewer") && (
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
                        latestFeeSchedule.payment_before_signing as
                          | number
                          | null
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
        )}

        {/* 7. Contract Word Export */}
        {(isAdmin || role === "viewer") && (
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
                <EmptyState message="No contract generated yet. Complete the checklist and fee schedule first." />
              ) : (
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
              )}
              <p className="mt-3 text-xs text-zinc-400">
                Official contract output is Word DOCX only.
              </p>
            </div>
          </div>
        )}

        {/* 8. Internal Notes Placeholder */}
        {isAdmin && (
          <Section title="Internal Notes">
            <EmptyState message="Internal notes will be available in a future update." />
          </Section>
        )}

        {/* 9. Activity / Audit Placeholder */}
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
