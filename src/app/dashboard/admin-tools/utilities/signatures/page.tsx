import Link from "next/link";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { getAdminSignatures } from "@/features/signatures/actions";
import { SignatureManager } from "@/features/signatures/signature-manager";

// ADMIN-SIGNATURE-01: admin-only signature management page under
// Admin Tools > Utilities. Sales and viewer are blocked here even by direct URL.

export default async function SignatureManagementPage() {
  const profile = await getUserProfile();
  const isAdmin = isAdminOrSuper(profile?.role ?? null);

  if (!isAdmin) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Signature Management
          </h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Signature Management is available to admin and super admin users
            only.
          </p>
        </div>
      </div>
    );
  }

  const { signatures, tableMissing } = await getAdminSignatures();

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-zinc-500">
          <Link
            href="/dashboard/admin-tools/utilities"
            className="hover:text-zinc-900"
          >
            Utilities
          </Link>{" "}
          / Signature Management
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          Signature Management
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Upload and manage signature images. Signatures are not yet connected
          to receipt generation.
        </p>
      </div>

      {tableMissing ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white py-16 text-center">
          <p className="text-sm font-medium text-zinc-600">
            Signature records are not available yet
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            The admin_signatures table has not been set up in this environment.
            Apply the admin signature migration to enable management.
          </p>
        </div>
      ) : (
        <SignatureManager signatures={signatures} />
      )}
    </div>
  );
}
