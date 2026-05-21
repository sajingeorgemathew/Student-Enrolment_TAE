import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getContractDetail } from "@/features/contracts/actions";
import { ContractPreview } from "@/features/contracts/contract-preview";
import { PrintButton } from "@/features/contracts/print-button";

export default async function ContractPreviewPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const data = await getContractDetail(applicationId);

  if (!data) {
    notFound();
  }

  const student = data.application.students;
  const program = data.application.programs;

  return (
    <div>
      <div className="no-print mb-8">
        <Link
          href="/dashboard/contracts"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contracts
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Contract Preview
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {student
                ? `${student.legal_first_name} ${student.legal_last_name}`
                : "Unknown Student"}
              {program ? ` - ${program.program_name}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data.contract && (
              <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                {data.contract.status}
              </span>
            )}
            <PrintButton />
          </div>
        </div>
      </div>

      <ContractPreview data={data} />
    </div>
  );
}
