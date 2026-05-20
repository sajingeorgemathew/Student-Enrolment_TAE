import Link from "next/link";
import { Plus } from "lucide-react";
import { getIntakes } from "@/features/intake/actions";
import { SendToAdminButton } from "@/features/intake/intake-status-action";

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

export default async function IntakePage() {
  const intakes = await getIntakes();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Intakes</h1>
          <p className="mt-1 text-sm text-zinc-500">
            View and manage student intake records
          </p>
        </div>
        <Link
          href="/dashboard/intake/new"
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Intake
        </Link>
      </div>

      {intakes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white py-16">
          <p className="text-sm font-medium text-zinc-600">
            No intake records yet
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Create your first intake to get started
          </p>
          <Link
            href="/dashboard/intake/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            New Intake
          </Link>
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
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {intakes.map((intake) => {
                const student = intake.students as unknown as {
                  id: string;
                  legal_first_name: string;
                  legal_last_name: string;
                  email: string | null;
                  phone: string | null;
                } | null;
                const program = intake.programs as unknown as {
                  id: string;
                  program_name: string;
                  program_code: string;
                } | null;
                const batch = intake.batches as unknown as {
                  id: string;
                  batch_name: string;
                } | null;

                return (
                  <tr key={intake.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-zinc-900">
                        {student
                          ? `${student.legal_first_name} ${student.legal_last_name}`
                          : "—"}
                      </div>
                      {student?.email && (
                        <div className="text-xs text-zinc-500">
                          {student.email}
                        </div>
                      )}
                      {student?.phone && (
                        <div className="text-xs text-zinc-400">
                          {student.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-zinc-900">
                        {program ? program.program_name : "—"}
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
                          statusColors[intake.status] ?? "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {statusLabels[intake.status] ?? intake.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {new Date(intake.created_at).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-4 py-3">
                      {intake.status === "new_intake" && (
                        <SendToAdminButton applicationId={intake.id} />
                      )}
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
