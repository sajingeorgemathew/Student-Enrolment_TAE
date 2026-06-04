import Link from "next/link";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { NewReceiptForm } from "@/features/receipts/new-receipt-form";
import {
  getActiveReceiptSignatures,
  getReceiptStudentById,
} from "@/features/receipts/new-receipt-actions";

export default async function NewReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const profile = await getUserProfile();
  const isAdmin = isAdminOrSuper(profile?.role ?? null);

  if (!isAdmin) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">New Receipt</h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Creating receipts is available to admin and super admin users only.
          </p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const studentId =
    typeof params.studentId === "string" ? params.studentId : undefined;

  const [{ signatures, tableMissing: signaturesTableMissing }, initialStudent] =
    await Promise.all([
      getActiveReceiptSignatures(),
      studentId ? getReceiptStudentById(studentId) : Promise.resolve(null),
    ]);

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-zinc-500">
          <Link
            href="/dashboard/admin-tools/finance"
            className="hover:text-zinc-900"
          >
            Finance
          </Link>{" "}
          /{" "}
          <Link
            href="/dashboard/admin-tools/finance/receipts"
            className="hover:text-zinc-900"
          >
            Receipts
          </Link>{" "}
          / New
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          New Receipt
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create a single receipt record and download the generated PDF.
        </p>
      </div>

      <div className="max-w-3xl">
        <NewReceiptForm
          signatures={signatures}
          signaturesTableMissing={signaturesTableMissing}
          initialStudent={initialStudent}
        />
      </div>
    </div>
  );
}
