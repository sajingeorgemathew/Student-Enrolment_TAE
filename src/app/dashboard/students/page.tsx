import Link from "next/link";
import { Users } from "lucide-react";
import { getStudents } from "@/features/students/actions";
import { StudentSearch } from "@/features/students/student-search";

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

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { search, batchId } = await searchParams;
  const searchTerm = typeof search === "string" ? search : undefined;
  const batchFilter = typeof batchId === "string" ? batchId : undefined;
  const students = await getStudents(searchTerm, batchFilter);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Students</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Search students and open student files
        </p>
        {batchFilter && (
          <p className="mt-1 text-xs text-zinc-400">
            Showing batch students.{" "}
            <Link
              href="/dashboard/students"
              className="font-medium text-zinc-600 hover:text-zinc-900"
            >
              Show all students
            </Link>
          </p>
        )}
      </div>

      <div className="mb-6">
        <StudentSearch />
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white py-16">
          <Users className="mb-3 h-10 w-10 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-600">
            {searchTerm ? "No students match your search" : "No student records yet"}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Students are created through the intake process"}
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
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Location
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
                {students.map((student) => {
                  const apps = student.applications as unknown as
                    | Array<{
                        id: string;
                        status: string;
                        program_id: string | null;
                        programs: { id: string; program_name: string; program_code: string } | null;
                        batches: { id: string; batch_name: string } | null;
                      }>
                    | null;
                  const latestApp = apps?.[0];

                  return (
                    <tr key={student.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/students/${student.id}`}
                            className="text-sm font-medium text-zinc-900 hover:text-zinc-700 hover:underline"
                          >
                            {student.legal_first_name} {student.legal_last_name}
                          </Link>
                          {student.archived_at && (
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              {student.archive_reason
                                ? `Archived - ${student.archive_reason}`
                                : "Archived"}
                            </span>
                          )}
                        </div>
                        {student.student_number && (
                          <div className="text-xs text-zinc-400">
                            {student.student_number}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {student.email && (
                          <div className="text-sm text-zinc-600">
                            {student.email}
                          </div>
                        )}
                        {student.phone && (
                          <div className="text-xs text-zinc-400">
                            {student.phone}
                          </div>
                        )}
                        {!student.email && !student.phone && (
                          <span className="text-sm text-zinc-400">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {student.city || student.province ? (
                          <div className="text-sm text-zinc-600">
                            {[student.city, student.province]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-400">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {latestApp?.programs ? (
                          <div>
                            <div className="text-sm text-zinc-900">
                              {latestApp.programs.program_code}
                            </div>
                            {latestApp.batches && (
                              <div className="text-xs text-zinc-500">
                                {latestApp.batches.batch_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-400">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {latestApp ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              statusColors[latestApp.status] ??
                              "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {statusLabels[latestApp.status] ?? latestApp.status}
                          </span>
                        ) : (
                          <span className="text-sm text-zinc-400">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500">
                        {new Date(student.created_at).toLocaleDateString(
                          "en-CA"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/students/${student.id}`}
                          className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                        >
                          Open Student File
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
