import { ScrollText } from "lucide-react";

export default function ContractsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Contracts</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Generate and manage enrolment contracts
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white py-16">
        <ScrollText className="mb-3 h-10 w-10 text-zinc-400" />
        <p className="text-sm font-medium text-zinc-600">
          Contract management coming soon
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          This section will generate enrolment contracts
        </p>
      </div>
    </div>
  );
}
