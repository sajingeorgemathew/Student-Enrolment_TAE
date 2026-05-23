import Link from "next/link";
import { Plus, Layers } from "lucide-react";
import { getBatches } from "@/features/batches/actions";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";

const deliveryLabels: Record<string, string> = {
  in_person: "In Person",
  hybrid: "Hybrid",
  online: "Online",
};

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { programId } = await searchParams;
  const programFilter = typeof programId === "string" ? programId : undefined;
  const [batches, profile] = await Promise.all([
    getBatches(programFilter),
    getUserProfile(),
  ]);
  const isAdmin = isAdminOrSuper(profile?.role ?? null);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Batches</h1>
          <p className="mt-1 text-sm text-zinc-500">
            View batches and batch students
          </p>
          {programFilter && (
            <p className="mt-1 text-xs text-zinc-400">
              Filtered by program.{" "}
              <Link
                href="/dashboard/batches"
                className="font-medium text-zinc-600 hover:text-zinc-900"
              >
                Show all batches
              </Link>
            </p>
          )}
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/batches/new"
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Batch
          </Link>
        )}
      </div>

      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white py-16">
          <Layers className="mb-3 h-10 w-10 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-600">No batches yet</p>
          <p className="mt-1 text-xs text-zinc-400">
            {isAdmin
              ? "Create your first batch to get started"
              : "Batches will appear once they are created"}
          </p>
          {isAdmin && (
            <Link
              href="/dashboard/batches/new"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              New Batch
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Batch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Program
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    End Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Delivery
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
                {batches.map((batch) => {
                  const program = batch.programs as unknown as {
                    id: string;
                    program_name: string;
                    program_code: string;
                  } | null;

                  return (
                    <tr key={batch.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-zinc-900">
                          {batch.batch_name}
                        </div>
                        {batch.batch_code && (
                          <div className="text-xs text-zinc-500">
                            {batch.batch_code}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {program
                          ? `${program.program_name} (${program.program_code})`
                          : "--"}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {batch.start_date ?? "--"}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {batch.expected_end_date ?? "--"}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {batch.delivery_method
                          ? (deliveryLabels[batch.delivery_method] ??
                            batch.delivery_method)
                          : "--"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            batch.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {batch.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/dashboard/students?batchId=${batch.id}`}
                            className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                          >
                            Batch Students
                          </Link>
                          {isAdmin && (
                            <Link
                              href={`/dashboard/batches/${batch.id}/edit`}
                              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                            >
                              Edit
                            </Link>
                          )}
                        </div>
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
