import { notFound } from "next/navigation";
import { getBatchById, getActivePrograms } from "@/features/batches/actions";
import { BatchForm } from "@/features/batches/batch-form";

export default async function EditBatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const [batch, programs] = await Promise.all([
    getBatchById(batchId),
    getActivePrograms(),
  ]);

  if (!batch) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Batch</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Update {batch.batch_name}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <BatchForm programs={programs} batch={batch} />
      </div>
    </div>
  );
}
