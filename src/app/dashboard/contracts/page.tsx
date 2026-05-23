import Link from "next/link";
import { ScrollText } from "lucide-react";
import { getApplicationsForContracts } from "@/features/contracts/actions";

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

const contractStatusColors: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  generated: "bg-purple-100 text-purple-800",
  signature_pending: "bg-indigo-100 text-indigo-800",
  signed_uploaded: "bg-emerald-100 text-emerald-800",
  signed_external: "bg-emerald-100 text-emerald-800",
  stored: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  archived: "bg-zinc-100 text-zinc-600",
};

function isChecklistItemDone(status: string): boolean {
  return status === "accepted" || status === "not_applicable";
}

function extractFirst<T extends { id: string }>(raw: unknown): T | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return (raw[0] as T) ?? null;
  if (typeof raw === "object" && "id" in (raw as Record<string, unknown>)) {
    return raw as T;
  }
  return null;
}

function computeReadinessSummary(app: {
  fee_schedules: unknown;
  admission_checklists: unknown;
}): { label: string; color: string; missing: string[] } {
  const feeSchedule = extractFirst<{
    id: string;
    status: string;
    total_fees: number;
  }>(app.fee_schedules);
  const checklist = extractFirst<{
    id: string;
    photo_id_status: string;
    address_proof_status: string;
    academic_status: string;
    english_status: string;
  }>(app.admission_checklists);

  const missing: string[] = [];

  const feeApproved = feeSchedule?.status === "approved";
  if (!feeApproved) {
    missing.push(feeSchedule ? "Fee schedule not approved" : "No fee schedule");
  }

  let checklistComplete = false;
  if (!checklist) {
    missing.push("No checklist created");
  } else {
    const items = [
      { label: "Photo ID", done: isChecklistItemDone(checklist.photo_id_status) },
      { label: "Address proof", done: isChecklistItemDone(checklist.address_proof_status) },
      { label: "Academic requirement", done: isChecklistItemDone(checklist.academic_status) },
      { label: "English proficiency", done: isChecklistItemDone(checklist.english_status) },
    ];
    const incomplete = items.filter((i) => !i.done);
    checklistComplete = incomplete.length === 0;
    if (!checklistComplete) {
      missing.push(
        `Checklist: ${incomplete.map((i) => i.label).join(", ")}`
      );
    }
  }

  if (feeApproved && checklistComplete) {
    return { label: "Ready", color: "bg-green-100 text-green-800", missing: [] };
  }
  if (feeApproved || checklistComplete || !!checklist) {
    return { label: "Partial", color: "bg-amber-100 text-amber-800", missing };
  }
  return { label: "Not Ready", color: "bg-zinc-100 text-zinc-600", missing };
}

export default async function ContractsPage() {
  const applications = await getApplicationsForContracts();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Contracts</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Preview and manage enrolment contracts for student applications
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white py-16">
          <ScrollText className="mb-3 h-10 w-10 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-600">
            No applications found
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Contracts will appear once intake applications are created
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
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
                    Application
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Fee Schedule
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Readiness
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Contract
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
                    student_number: string | null;
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
                  const feeSchedule = extractFirst<{
                    id: string;
                    status: string;
                    total_fees: number;
                  }>(app.fee_schedules);
                  const contract = extractFirst<{
                    id: string;
                    status: string;
                    contract_number: string | null;
                    generated_at: string | null;
                    signed_at: string | null;
                  }>(app.contracts);
                  const readiness = computeReadinessSummary(app);

                  return (
                    <tr key={app.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-zinc-900">
                          {student
                            ? `${student.legal_first_name} ${student.legal_last_name}`
                            : "--"}
                        </div>
                        {student?.student_number && (
                          <div className="text-xs text-zinc-400">
                            {student.student_number}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-zinc-900">
                          {program?.program_code ?? "--"}
                        </div>
                        {batch && (
                          <div className="text-xs text-zinc-500">
                            {batch.batch_name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            applicationStatusColors[app.status] ??
                            "bg-zinc-100 text-zinc-600"
                          }`}
                        >
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
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${readiness.color}`}
                        >
                          {readiness.label}
                        </span>
                        {readiness.missing.length > 0 && (
                          <p className="mt-1 text-xs text-zinc-400">
                            {readiness.missing.join("; ")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {contract ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              contractStatusColors[contract.status] ??
                              "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {contractStatusLabels[contract.status] ??
                              contract.status}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">
                            No contract
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/contracts/${app.id}/preview`}
                          className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                        >
                          Preview
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
