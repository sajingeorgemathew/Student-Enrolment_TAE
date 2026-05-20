import { getPrograms } from "@/features/intake/actions";
import { IntakeForm } from "@/features/intake/intake-form";

export default async function NewIntakePage() {
  const programs = await getPrograms();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">New Intake</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter student details and program interest to create a new intake
          record.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <IntakeForm programs={programs} />
      </div>
    </div>
  );
}
