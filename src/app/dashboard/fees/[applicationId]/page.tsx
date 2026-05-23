import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getApplicationFeeDetail } from "@/features/fees/actions";
import { FeeCalculatorForm } from "@/features/fees/fee-calculator-form";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";

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

export default async function FeeDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const [data, profile] = await Promise.all([
    getApplicationFeeDetail(applicationId),
    getUserProfile(),
  ]);

  if (!data) {
    notFound();
  }

  const isAdmin = isAdminOrSuper(profile?.role ?? null);
  const { application, quote, feeSchedule, installments } = data;

  const student = application.students as unknown as {
    id: string;
    legal_first_name: string;
    legal_middle_name: string | null;
    legal_last_name: string;
    email: string | null;
    phone: string | null;
    student_number: string | null;
  } | null;

  const program = application.programs as unknown as {
    id: string;
    program_code: string;
    program_name: string;
    credential_name: string | null;
    total_hours: number | null;
    default_tuition: number | null;
    default_book_fee: number | null;
    default_compulsory_fee: number | null;
    default_professional_exam_fee: number | null;
  } | null;

  const batch = application.batches as unknown as {
    id: string;
    batch_name: string;
    batch_code: string | null;
    start_date: string | null;
    expected_end_date: string | null;
    delivery_method: string | null;
  } | null;

  function fmt(val: number | null | undefined): string {
    if (val == null) return "--";
    return `$${Number(val).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`;
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/fees"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Fee Schedules
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Fee Schedule
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
        {/* Student Context */}
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
            </FieldGrid>
          ) : (
            <EmptyState message="No student information available." />
          )}
        </Section>

        {/* Program & Batch Context */}
        <Section title="Program and Batch">
          {program ? (
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
              <Field
                label="Delivery Method"
                value={batch?.delivery_method?.replace("_", " ") ?? null}
              />
            </FieldGrid>
          ) : (
            <EmptyState message="No program assigned yet." />
          )}
        </Section>

        {/* Sales Quote Reference */}
        <Section title="Sales Quote (Reference)">
          {quote ? (
            <div>
              <p className="mb-4 text-xs text-zinc-500">
                The values below were recorded during the sales intake and are
                shown for reference only. The admin fee schedule below is the
                official record.
              </p>
              <FieldGrid>
                <Field label="Quoted Total" value={fmt(quote.quoted_total)} />
                <Field
                  label="Discount Discussed"
                  value={
                    Number(quote.discount_amount) > 0
                      ? fmt(quote.discount_amount)
                      : null
                  }
                />
                <Field
                  label="Deposit Discussed"
                  value={
                    Number(quote.deposit_discussed) > 0
                      ? fmt(quote.deposit_discussed)
                      : null
                  }
                />
                <Field label="Payment Notes" value={quote.payment_notes} />
                <Field label="Quote Notes" value={quote.quote_notes} />
                <Field
                  label="Quote Status"
                  value={quote.status?.replace(/_/g, " ") ?? null}
                />
              </FieldGrid>
            </div>
          ) : (
            <div>
              {application.price_discussed != null ||
              application.deposit_discussed != null ? (
                <div>
                  <p className="mb-4 text-xs text-zinc-500">
                    No formal quote was created, but price information was
                    recorded on the application.
                  </p>
                  <FieldGrid>
                    <Field
                      label="Price Discussed"
                      value={fmt(application.price_discussed)}
                    />
                    <Field
                      label="Deposit Discussed"
                      value={fmt(application.deposit_discussed)}
                    />
                    <Field
                      label="Sales Notes"
                      value={application.sales_notes}
                    />
                  </FieldGrid>
                </div>
              ) : (
                <EmptyState message="No sales quote or price discussion recorded for this application." />
              )}
            </div>
          )}
        </Section>

        {/* Fee Calculator */}
        <Section title={isAdmin ? "Fee Calculator" : "Fee Schedule"}>
          {isAdmin ? (
            <FeeCalculatorForm
              applicationId={applicationId}
              quoteId={quote?.id ?? null}
              feeSchedule={feeSchedule}
              installments={installments}
              programDefaults={
                program
                  ? {
                      default_tuition: program.default_tuition,
                      default_book_fee: program.default_book_fee,
                      default_compulsory_fee: program.default_compulsory_fee,
                      default_professional_exam_fee:
                        program.default_professional_exam_fee,
                    }
                  : null
              }
            />
          ) : feeSchedule ? (
            <div>
              <FieldGrid>
                <Field label="Tuition Fee" value={fmt(feeSchedule.tuition_fee)} />
                <Field label="Book Fee" value={fmt(feeSchedule.book_fee)} />
                <Field label="Compulsory Fee" value={fmt(feeSchedule.compulsory_fee)} />
                <Field label="Total Fees" value={fmt(feeSchedule.total_fees)} />
                <Field label="Discount" value={fmt(feeSchedule.discount_amount)} />
                <Field label="Payment Before Signing" value={fmt(feeSchedule.payment_before_signing)} />
                <Field label="Remaining Balance" value={fmt(feeSchedule.remaining_balance)} />
                <Field
                  label="Status"
                  value={feeSchedule.status?.replace(/_/g, " ") ?? null}
                />
              </FieldGrid>
              {installments.length > 0 && (
                <div className="mt-4 border-t border-zinc-100 pt-4">
                  <h3 className="mb-3 text-sm font-medium text-zinc-700">
                    Payment Installments
                  </h3>
                  <div className="overflow-x-auto rounded-md border border-zinc-200">
                    <table className="min-w-full divide-y divide-zinc-200">
                      <thead className="bg-zinc-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">No.</th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Due Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {installments.map((inst) => (
                          <tr key={inst.id}>
                            <td className="px-4 py-2 text-sm text-zinc-900">{inst.installment_number}</td>
                            <td className="px-4 py-2 text-sm text-zinc-600">
                              {inst.due_date ? new Date(inst.due_date).toLocaleDateString("en-CA") : "--"}
                            </td>
                            <td className="px-4 py-2 text-sm text-zinc-900">{fmt(inst.amount_due)}</td>
                            <td className="px-4 py-2 text-sm text-zinc-500">{inst.notes || "--"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState message="No fee schedule has been created for this application." />
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
