import Link from "next/link";
import { getApplicationsForFees } from "@/features/fees/actions";

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

const feeStatusLabels: Record<string, string> = {
  draft: "Draft",
  admin_review: "Admin Review",
  approved: "Approved",
  archived: "Archived",
};

const feeStatusColors: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  admin_review: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  archived: "bg-zinc-100 text-zinc-600",
};

export default async function FeesPage() {
  const applications = await getApplicationsForFees();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Fee Schedules</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage fee schedules and payment installments for student applications
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white py-16">
          <p className="text-sm font-medium text-zinc-600">
            No applications found
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Fee schedules will appear once intake applications are created
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Program
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Application Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Fee Schedule
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Total Fees
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {applications.map((app) => {
                const student = app.students as unknown as {
                  id: string;
                  legal_first_name: string;
                  legal_last_name: string;
                  email: string | null;
                } | null;
                const program = app.programs as unknown as {
                  id: string;
                  program_name: string;
                  program_code: string;
                } | null;
                const batch = app.batches as unknown as {
                  id: string;
                  batch_name: string;
                } | null;
                const feeScheduleArr = app.fee_schedules as unknown as Array<{
                  id: string;
                  status: string;
                  total_fees: number;
                  created_at: string;
                }>;
                const feeSchedule = feeScheduleArr?.[0] ?? null;

                return (
                  <tr key={app.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-zinc-900">
                        {student
                          ? `${student.legal_first_name} ${student.legal_last_name}`
                          : "--"}
                      </div>
                      {student?.email && (
                        <div className="text-xs text-zinc-500">
                          {student.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-zinc-900">
                        {program?.program_name ?? "--"}
                      </div>
                      {batch && (
                        <div className="text-xs text-zinc-500">
                          {batch.batch_name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                        {applicationStatusLabels[app.status] ?? app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {feeSchedule ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            feeStatusColors[feeSchedule.status] ??
                            "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {feeStatusLabels[feeSchedule.status] ??
                            feeSchedule.status}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">
                          Not created
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-zinc-900">
                      {feeSchedule
                        ? `$${Number(feeSchedule.total_fees).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`
                        : "--"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/fees/${app.id}`}
                        className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                      >
                        {feeSchedule ? "View" : "Create"}
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
  );
}
