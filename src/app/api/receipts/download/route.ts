import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";

// FINANCE-07: stored receipt download.
//
// Admin/super_admin only. Looks up the receipt by id, validates it has a stored
// PDF, downloads it from the private receipt-documents bucket, and returns it as
// an attachment named after the receipt number. Sales, viewer, and
// unauthenticated requests are blocked. This is a dedicated route (not the
// shared /api/documents/download route) so the receipt bucket stays admin-only.

const RECEIPT_STORAGE_BUCKET = "receipt-documents";

export async function GET(request: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminOrSuper(profile.role)) {
    return NextResponse.json(
      { error: "Only admin or super admin users can download receipts." },
      { status: 403 }
    );
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing receipt id." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: receipt, error: receiptError } = await supabase
    .from("receipt_records")
    .select("id, receipt_number, pdf_storage_path")
    .eq("id", id)
    .single();

  if (receiptError || !receipt) {
    return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
  }

  if (!receipt.pdf_storage_path) {
    return NextResponse.json(
      { error: "This receipt does not have a stored PDF." },
      { status: 404 }
    );
  }

  const { data, error } = await supabase.storage
    .from(RECEIPT_STORAGE_BUCKET)
    .download(receipt.pdf_storage_path);

  if (error || !data) {
    return NextResponse.json(
      { error: "Stored receipt PDF not found or access denied." },
      { status: 404 }
    );
  }

  const fileName = `${receipt.receipt_number}.pdf`;
  const headers = new Headers();
  headers.set(
    "Content-Disposition",
    `attachment; filename="${fileName.replace(/"/g, '\\"')}"`
  );
  headers.set("Content-Type", data.type || "application/pdf");

  return new NextResponse(data, { status: 200, headers });
}
