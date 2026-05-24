import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUserProfile } from "@/lib/profile";
import { isAdminOrSuper } from "@/lib/roles";
import { getContractDetail } from "@/features/contracts/actions";
import { generateContractDocx } from "@/lib/generate-contract-docx";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminOrSuper(profile.role)) {
    return NextResponse.json(
      { error: "Only admin users can generate contracts." },
      { status: 403 }
    );
  }

  const applicationId = request.nextUrl.searchParams.get("applicationId");
  if (!applicationId) {
    return NextResponse.json(
      { error: "Missing applicationId" },
      { status: 400 }
    );
  }

  const data = await getContractDetail(applicationId);
  if (!data) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 }
    );
  }

  const appStatus = data.application.status;
  if (
    appStatus !== "ready_for_contract" &&
    appStatus !== "contract_generated" &&
    appStatus !== "signature_pending" &&
    appStatus !== "signed"
  ) {
    return NextResponse.json(
      { error: "Application must be marked ready for contract first." },
      { status: 400 }
    );
  }

  const student = data.application.students;
  const studentName = student
    ? `${student.legal_first_name} ${student.legal_last_name}`
    : "Student";
  const fileName = `Student Enrolment Contract - ${studentName}.docx`;

  const docxBuffer = generateContractDocx(data);
  const body = new Uint8Array(docxBuffer);

  const supabase = await createClient();
  const now = new Date().toISOString();

  if (appStatus === "ready_for_contract") {
    await supabase
      .from("applications")
      .update({
        status: "contract_generated",
        contract_generated_at: now,
      })
      .eq("id", applicationId);
  } else {
    await supabase
      .from("applications")
      .update({ contract_generated_at: now })
      .eq("id", applicationId);
  }

  const studentId = student?.id;
  if (studentId) {
    revalidatePath(`/dashboard/students/${studentId}`);
  }
  revalidatePath("/dashboard/contracts");
  revalidatePath(`/dashboard/contracts/${applicationId}/preview`);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, '\\"')}"`,
    },
  });
}
