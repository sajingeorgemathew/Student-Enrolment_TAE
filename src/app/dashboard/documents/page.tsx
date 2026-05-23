import Link from "next/link";
import { FileText } from "lucide-react";
import { getDocuments } from "@/features/documents/actions";

const reviewStatusLabels: Record<string, string> = {
  uploaded: "Uploaded",
  accepted: "Accepted",
  needs_correction: "Needs Correction",
  archived: "Archived",
};

const reviewStatusColors: Record<string, string> = {
  uploaded: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  needs_correction: "bg-orange-100 text-orange-800",
  archived: "bg-zinc-100 text-zinc-600",
};

const documentTypeLabels: Record<string, string> = {
  photo_id: "Photo ID",
  address_proof: "Address Proof",
  academic_transcript: "Academic Transcript",
  diploma_certificate: "Diploma / Certificate",
  english_test: "English Test",
  immigration_status: "Immigration Status",
  payment_proof: "Payment Proof",
  placement_document: "Placement Document",
  plar: "PLAR",
  readmission: "Readmission",
  withdrawal: "Withdrawal",
  transcript_moodle_export: "Transcript / Moodle Export",
  contract_document: "Contract Document",
  other: "Other",
};

export default async function DocumentsPage() {
  const documents = await getDocuments();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Documents</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track and manage student documents
          </p>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white py-16">
          <FileText className="mb-3 h-10 w-10 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-600">
            No documents uploaded yet
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Documents are uploaded from the student file page.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    File Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Program
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Uploaded
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {documents.map((doc) => {
                  const student = doc.students as unknown as {
                    id: string;
                    legal_first_name: string;
                    legal_last_name: string;
                    student_number: string | null;
                  } | null;
                  const application = doc.applications as unknown as {
                    id: string;
                    status: string;
                    programs: {
                      id: string;
                      program_code: string;
                      program_name: string;
                    } | null;
                  } | null;

                  return (
                    <tr key={doc.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-zinc-900">
                          {student
                            ? `${student.legal_first_name} ${student.legal_last_name}`
                            : "--"}
                        </div>
                        {student?.student_number && (
                          <div className="text-xs text-zinc-400">
                            {student.student_number}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900">
                        {documentTypeLabels[doc.document_type] ??
                          doc.document_type?.replace(/_/g, " ") ??
                          "--"}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 max-w-48 truncate">
                        {doc.file_name ?? "--"}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {application?.programs?.program_code ?? "--"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            reviewStatusColors[doc.review_status] ??
                            "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {reviewStatusLabels[doc.review_status] ??
                            doc.review_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {new Date(doc.created_at).toLocaleDateString("en-CA")}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/documents/${doc.id}`}
                          className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
