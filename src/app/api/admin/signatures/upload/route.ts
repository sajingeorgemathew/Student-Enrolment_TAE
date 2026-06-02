import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import {
  SIGNATURE_STORAGE_BUCKET,
  MAX_SIGNATURE_SIZE_BYTES,
  MAX_SIGNATURE_NAME_LENGTH,
  isAllowedSignatureMimeType,
  safeSignatureFileName,
} from "@/lib/signatures/signature-constants";

// ADMIN-SIGNATURE-01: admin-only signature image upload.
//
// Accepts a multipart form (name + image file), validates the type and size,
// uploads the image to the private admin-signatures bucket at
// signatures/{signature_id}/{safe_file_name}, then inserts the metadata row.
// The signature id is generated up front so the storage path is stable and the
// not-null storage_path column can be set in a single insert. If the insert
// fails after upload, the uploaded file is removed so no orphan file is left.

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) {
    return bad("Unauthorized.", 401);
  }
  if (!isAdminOrSuper(profile.role)) {
    return bad("Only admin or super admin users can upload signatures.", 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Invalid upload. Expected a multipart form.");
  }

  const name = (form.get("name") ?? "").toString().trim();
  if (!name) {
    return bad("Enter a name for the signature.");
  }
  if (name.length > MAX_SIGNATURE_NAME_LENGTH) {
    return bad(
      `Signature name must be ${MAX_SIGNATURE_NAME_LENGTH} characters or fewer.`
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return bad("Select a signature image to upload.");
  }

  if (!isAllowedSignatureMimeType(file.type)) {
    return bad(
      "Unsupported file type. Upload a PNG, JPG, or WebP image only."
    );
  }

  if (file.size > MAX_SIGNATURE_SIZE_BYTES) {
    return bad("The image is too large. Maximum size is 2 MB.");
  }

  const signatureId = randomUUID();
  const fileName = safeSignatureFileName(file.name);
  const storagePath = `signatures/${signatureId}/${fileName}`;

  const supabase = await createClient();

  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(SIGNATURE_STORAGE_BUCKET)
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    const message = uploadError.message ?? "";
    if (/bucket not found/i.test(message)) {
      return bad(
        "The admin-signatures storage bucket does not exist yet. Create the private admin-signatures bucket in Supabase first. No signature was saved.",
        503
      );
    }
    console.error("Signature upload failed:", message);
    return bad("The signature image could not be stored. Please try again.", 500);
  }

  const { error: insertError } = await supabase
    .from("admin_signatures")
    .insert({
      id: signatureId,
      name,
      storage_path: storagePath,
      mime_type: file.type,
      file_size_bytes: file.size,
      is_active: true,
      is_default: false,
      uploaded_by: profile.id,
    });

  if (insertError) {
    // Roll back the uploaded file so we do not leave an orphan object.
    await supabase.storage.from(SIGNATURE_STORAGE_BUCKET).remove([storagePath]);
    if (
      insertError.code === "42P01" ||
      /admin_signatures/i.test(insertError.message ?? "")
    ) {
      return bad(
        "Signature records are not available in this environment yet. Apply the admin signature migration first.",
        503
      );
    }
    console.error("Signature insert failed:", insertError.message);
    return bad("The signature could not be saved. Please try again.", 500);
  }

  revalidatePath("/dashboard/admin-tools/utilities/signatures");

  return NextResponse.json({ id: signatureId }, { status: 201 });
}
