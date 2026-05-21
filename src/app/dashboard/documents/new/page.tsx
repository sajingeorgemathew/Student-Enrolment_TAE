import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStudentsForUpload, getApplicationsForStudent } from "@/features/documents/actions";
import { DocumentUploadForm } from "@/features/documents/document-upload-form";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const { studentId } = await searchParams;
  const [students, initialApps] = await Promise.all([
    getStudentsForUpload(),
    studentId ? getApplicationsForStudent(studentId) : Promise.resolve([]),
  ]);
  const initialApplications = initialApps.map((app) => ({
    id: app.id,
    status: app.status,
    programs: app.programs as unknown as { id: string; program_code: string; program_name: string } | null,
    batches: app.batches as unknown as { id: string; batch_name: string } | null,
  }));

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/documents"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Upload Document
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Upload a document for a student record
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        {students.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center">
            <p className="text-sm text-zinc-500">
              No students found. Create a student record before uploading
              documents.
            </p>
          </div>
        ) : (
          <DocumentUploadForm students={students} defaultStudentId={studentId} initialApplications={initialApplications} />
        )}
      </div>
    </div>
  );
}
