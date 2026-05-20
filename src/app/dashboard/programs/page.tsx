import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { getPrograms } from "@/features/programs/actions";

export default async function ProgramsPage() {
  const programs = await getPrograms();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Programs</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage academic programs and their default fees
          </p>
        </div>
        <Link
          href="/dashboard/programs/new"
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Program
        </Link>
      </div>

      {programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white py-16">
          <BookOpen className="mb-3 h-10 w-10 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-600">
            No programs yet
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Create your first program to get started
          </p>
          <Link
            href="/dashboard/programs/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            New Program
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Program Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Credential
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Hours
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Tuition
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {programs.map((program) => (
                  <tr key={program.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                      {program.program_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-900">
                      {program.program_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {program.credential_name ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {program.total_hours != null
                        ? `${program.total_hours}h`
                        : "--"}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {program.default_tuition != null
                        ? `$${Number(program.default_tuition).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`
                        : "--"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          program.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {program.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/programs/${program.id}/edit`}
                        className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
