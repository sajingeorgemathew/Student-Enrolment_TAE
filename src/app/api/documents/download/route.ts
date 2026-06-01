import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";

export async function GET(request: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const bucket = searchParams.get("bucket");
  const path = searchParams.get("path");
  const fileName = searchParams.get("fileName");

  if (!bucket || !path || !fileName) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const isContractFile = path.includes("/contracts/");
  if (isContractFile && !isAdminOrSuper(profile.role)) {
    return NextResponse.json(
      { error: "Only admin users can download generated contracts." },
      { status: 403 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error || !data) {
    return NextResponse.json(
      { error: "File not found or access denied" },
      { status: 404 },
    );
  }

  const headers = new Headers();
  headers.set(
    "Content-Disposition",
    `attachment; filename="${fileName.replace(/"/g, '\\"')}"`,
  );
  headers.set("Content-Type", data.type || "application/octet-stream");

  return new NextResponse(data, { status: 200, headers });
}
