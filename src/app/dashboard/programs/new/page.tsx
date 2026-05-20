import { ProgramForm } from "@/features/programs/program-form";

export default function NewProgramPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">New Program</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Add a new academic program to the system
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <ProgramForm />
      </div>
    </div>
  );
}
