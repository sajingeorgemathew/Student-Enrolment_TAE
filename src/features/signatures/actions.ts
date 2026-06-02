"use server";

import { createClient } from "@/lib/supabase/server";

// ADMIN-SIGNATURE-01: read access to signature metadata for the admin-only
// signature management page. RLS already restricts this table to
// admin/super_admin, and the page is gated separately, so this is a plain read.

export type AdminSignature = {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  is_active: boolean;
  is_default: boolean;
  uploaded_by: string;
  created_at: string;
  uploaded_by_name?: string | null;
};

export type SignatureListResult = {
  signatures: AdminSignature[];
  // True when the admin_signatures table is not available yet (for example the
  // ADMIN-SIGNATURE-01 migration has not been applied to this environment).
  tableMissing: boolean;
};

export async function getAdminSignatures(): Promise<SignatureListResult> {
  const supabase = await createClient();

  const { data: signatures, error } = await supabase
    .from("admin_signatures")
    .select(
      "id, name, storage_path, mime_type, file_size_bytes, is_active, is_default, uploaded_by, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    const tableMissing =
      error.code === "42P01" ||
      /admin_signatures/i.test(error.message ?? "");
    return { signatures: [], tableMissing };
  }

  if (!signatures || signatures.length === 0) {
    return { signatures: [], tableMissing: false };
  }

  const uploaderIds = [...new Set(signatures.map((s) => s.uploaded_by))];
  let profileMap: Record<string, string> = {};
  if (uploaderIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", uploaderIds);
    if (profiles) {
      profileMap = Object.fromEntries(
        profiles.map((p) => [p.id, p.full_name || p.email || p.id])
      );
    }
  }

  return {
    signatures: signatures.map((s) => ({
      ...s,
      uploaded_by_name: profileMap[s.uploaded_by] ?? null,
    })),
    tableMissing: false,
  };
}
