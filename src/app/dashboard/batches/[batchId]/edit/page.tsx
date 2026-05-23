import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getBatchById, getActivePrograms } from "@/features/batches/actions";
import { BatchForm } from "@/features/batches/batch-form";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";

export default async function EditBatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const [batch, programs, profile] = await Promise.all([
    getBatchById(batchId),
    getActivePrograms(),
    getUserProfile(),
  ]);

  if (!batch) {
    notFound();
  }

  if (!isAdminOrSuper(profile?.role ?? null)) {
    return (
      <div>
        <div className="mb-8">
          <Link
            href="/dashboard/batches"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Batches
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900">Edit Batch</h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Only admin users can edit batches.
          </p>
        </div>
      </div>
    );
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
