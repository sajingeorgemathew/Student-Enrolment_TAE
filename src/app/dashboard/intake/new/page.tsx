import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPrograms } from "@/features/intake/actions";
import { IntakeForm } from "@/features/intake/intake-form";
import { getUserProfile } from "@/lib/profile";
import { isSalesOrAdmin } from "@/lib/roles";

export default async function NewIntakePage() {
  const profile = await getUserProfile();
  const canCreate = isSalesOrAdmin(profile?.role ?? null);

  if (!canCreate) {
    return (
      <div>
        <div className="mb-8">
          <Link
            href="/dashboard/intake"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Intakes
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900">New Intake</h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            You do not have permission to create new intakes. Contact an
            administrator if you need access.
          </p>
        </div>
      </div>
    );
  }

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
