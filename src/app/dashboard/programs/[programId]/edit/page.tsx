import { notFound } from "next/navigation";
import { getProgramById } from "@/features/programs/actions";
import { ProgramForm } from "@/features/programs/program-form";

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const program = await getProgramById(programId);

  if (!program) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Program</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Update {program.program_name}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <ProgramForm program={program} />
      </div>
    </div>
  );
}
