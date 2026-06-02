import { NextRequest, NextResponse } from "next/server";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { SIGNATURE_STORAGE_BUCKET } from "@/lib/signatures/signature-constants";

// ADMIN-SIGNATURE-01: admin-only signature image preview.
//
// Streams a stored signature image from the private admin-signatures bucket so
// it can be shown inline on the management page. Admin/super_admin only;
// unauthenticated returns 401 and sales/viewer return 403. The bucket stays
// private; the image is only reachable through this role-guarded route. Storage
// RLS independently blocks sales/viewer at the database layer.

export async function GET(request: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminOrSuper(profile.role)) {
    return NextResponse.json(
      { error: "Only admin or super admin users can view signatures." },
      { status: 403 }
    );
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing signature id." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: signature, error: lookupError } = await supabase
    .from("admin_signatures")
    .select("id, storage_path, mime_type")
    .eq("id", id)
    .single();

  if (lookupError || !signature) {
    return NextResponse.json({ error: "Signature not found." }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from(SIGNATURE_STORAGE_BUCKET)
    .download(signature.storage_path);

  if (error || !data) {
    return NextResponse.json(
      { error: "Signature image not found or access denied." },
      { status: 404 }
    );
  }

  const headers = new Headers();
  headers.set("Content-Type", signature.mime_type || data.type || "image/png");
  headers.set("Cache-Control", "private, max-age=60");

  return new NextResponse(data, { status: 200, headers });
}
