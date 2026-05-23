import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { getApplicationsForChecklists } from "@/features/checklists/actions";
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

const checklistItemStatusLabels: Record<string, string> = {
  not_received: "Not Received",
  uploaded: "Uploaded",
  accepted: "Accepted",
  needs_correction: "Needs Correction",
  not_started: "Not Started",
  in_review: "In Review",
  not_applicable: "Not Applicable",
};

type ChecklistRow = {
  id: string;
  photo_id_status: string | null;
  address_proof_status: string | null;
  academic_route: string | null;
  academic_status: string | null;
  english_route: string | null;
  english_status: string | null;
};

function extractChecklist(raw: unknown): ChecklistRow | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return (raw[0] as ChecklistRow) ?? null;
  }
  if (typeof raw === "object" && "id" in (raw as Record<string, unknown>)) {
    return raw as ChecklistRow;
  }
  return null;
}

function computeReadiness(checklist: ChecklistRow | null): {
  label: string;
  color: string;
} {
  if (!checklist) {
    return { label: "Not Created", color: "bg-zinc-100 text-zinc-600" };
  }

  const statuses = [
    checklist.photo_id_status,
    checklist.address_proof_status,
    checklist.academic_status,
    checklist.english_status,
  ];

  const allAccepted = statuses.every(
    (s) => s === "accepted" || s === "not_applicable"
  );
  const hasCorrection = statuses.some((s) => s === "needs_correction");

  if (allAccepted) {
    return { label: "Ready", color: "bg-green-100 text-green-800" };
  }
  if (hasCorrection) {
    return {
      label: "Needs Correction",
      color: "bg-orange-100 text-orange-800",
    };
  }
  return { label: "In Progress", color: "bg-amber-100 text-amber-800" };
}

export default async function ChecklistsPage() {
  const [applications, profile] = await Promise.all([
    getApplicationsForChecklists(),
    getUserProfile(),
  ]);
  const isAdmin = isAdminOrSuper(profile?.role ?? null);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Admission Checklists
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Track admission readiness for student applications
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white py-16">
          <ClipboardCheck className="mb-3 h-10 w-10 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-600">
            No applications found
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Checklists will appear once intake applications are created
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
                    Application Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Photo ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Academic
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    English
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Readiness
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
                  const checklist = extractChecklist(
                    app.admission_checklists
                  );
                  const readiness = computeReadiness(checklist);

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
                        <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                          {applicationStatusLabels[app.status] ?? app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-zinc-600">
                          {checklist
                            ? (checklistItemStatusLabels[
                                checklist.photo_id_status ?? ""
                              ] ?? "--")
                            : "--"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-zinc-600">
                          {checklist
                            ? (checklistItemStatusLabels[
                                checklist.academic_status ?? ""
                              ] ?? "--")
                            : "--"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-zinc-600">
                          {checklist
                            ? (checklistItemStatusLabels[
                                checklist.english_status ?? ""
                              ] ?? "--")
                            : "--"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${readiness.color}`}
                        >
                          {readiness.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/checklists/${app.id}`}
                          className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                        >
                          {checklist
                            ? isAdmin
                              ? "Edit"
                              : "View"
                            : isAdmin
                              ? "Create"
                              : "View"}
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
