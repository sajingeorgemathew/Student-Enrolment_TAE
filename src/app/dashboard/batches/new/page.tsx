import { getActivePrograms } from "@/features/batches/actions";
import { BatchForm } from "@/features/batches/batch-form";

export default async function NewBatchPage() {
  const programs = await getActivePrograms();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">New Batch</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create a new program batch with schedule and location details
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <BatchForm programs={programs} />
      </div>
    </div>
  );
}
