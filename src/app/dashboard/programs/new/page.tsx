import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProgramForm } from "@/features/programs/program-form";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";

export default async function NewProgramPage() {
  const profile = await getUserProfile();

  if (!isAdminOrSuper(profile?.role ?? null)) {
    return (
      <div>
        <div className="mb-8">
          <Link
            href="/dashboard/programs"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Programs
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900">New Program</h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Only admin users can create programs.
          </p>
        </div>
      </div>
    );
  }

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
