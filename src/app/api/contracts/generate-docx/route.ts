import { NextRequest, NextResponse } from "next/server";
import { getUserProfile } from "@/lib/profile";
import { getContractDetail } from "@/features/contracts/actions";
import { generateContractDocx } from "@/lib/generate-contract-docx";

export async function GET(request: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const student = data.application.students;
  const studentName = student
    ? `${student.legal_first_name} ${student.legal_last_name}`
    : "Student";
  const fileName = `Student Enrolment Contract - ${studentName}.docx`;

  const docxBuffer = generateContractDocx(data);
  const body = new Uint8Array(docxBuffer);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, '\\"')}"`,
    },
  });
}
