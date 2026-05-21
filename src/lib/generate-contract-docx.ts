import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { ContractDetailData } from "@/features/contracts/actions";

const MAX_TEMPLATE_INSTALLMENTS = 6;

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "";
  const num = Number(amount);
  if (num === 0) return "";
  return num.toLocaleString("en-CA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function buildStudentFullName(
  student: ContractDetailData["application"]["students"]
): string {
  if (!student) return "";
  return [
    student.legal_first_name,
    student.legal_middle_name,
    student.legal_last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
}

export function generateContractDocx(data: ContractDetailData): Buffer {
  const templatePath = path.join(
    process.cwd(),
    "src/templates/contracts/student-enrolment-template.docx"
  );
  const templateContent = fs.readFileSync(templatePath);
  const zip = new PizZip(templateContent);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter() {
      return "";
    },
  });

  const student = data.application.students;
  const program = data.application.programs;
  const batch = data.application.batches;
  const feeSchedule = data.feeSchedule;
  const installments = data.installments;

  const practicumHours1 = program?.practicum_hours
    ? Math.round((Number(program.practicum_hours) * 2) / 3)
    : null;
  const practicumHours2 = program?.practicum_hours
    ? Math.round(Number(program.practicum_hours) / 3)
    : null;
  const totalPracticumHours = program?.practicum_hours
    ? Number(program.practicum_hours)
    : null;

  const hoursPerDay = batch?.class_time
    ? parseHoursFromTime(batch.class_time)
    : null;

  const installmentTotal = installments.reduce(
    (sum, inst) => sum + Number(inst.amount_due),
    0
  );

  const templateData: Record<string, string> = {
    contract_date: formatDate(data.application.created_at),
    student_full_name: buildStudentFullName(student),
    student_number: student?.student_number || "",
    mailing_address: student?.mailing_address_line_1 || "",
    city: student?.city || "",
    province: student?.province || "",
    postal_code: student?.postal_code || "",
    phone: student?.phone || "",
    email: student?.email || "",
    date_of_birth: formatDate(student?.date_of_birth),
    program_name: program?.program_name || "",
    program_start_date: formatDate(batch?.start_date),
    expected_completion_date: formatDate(batch?.expected_end_date),
    credential_name: program?.credential_name || "",
    training_location: batch?.training_location || "",
    practicum_1_location:
      batch?.practicum_1_location || "(To be determined as per availability)",
    practicum_2_location:
      batch?.practicum_2_location || "(To be determined as per availability)",
    practicum_1_hours: practicumHours1 != null ? String(practicumHours1) : "",
    practicum_2_hours: practicumHours2 != null ? String(practicumHours2) : "",
    total_practicum_hours:
      totalPracticumHours != null ? String(totalPracticumHours) : "",
    program_hours: program?.total_hours ? String(program.total_hours) : "",
    class_time: batch?.class_time || "",
    hours_per_day: hoursPerDay != null ? String(hoursPerDay) : "",
    tuition_fee: formatCurrency(feeSchedule?.tuition_fee),
    book_fee: formatCurrency(feeSchedule?.book_fee),
    compulsory_fee: formatCurrency(feeSchedule?.compulsory_fee),
    field_trip_fee: formatCurrency(feeSchedule?.field_trip_fee),
    uniform_equipment_fee: formatCurrency(feeSchedule?.uniform_equipment_fee),
    professional_exam_fee: formatCurrency(feeSchedule?.professional_exam_fee),
    expendable_supplies_fee: formatCurrency(
      feeSchedule?.expendable_supplies_fee
    ),
    international_fee: formatCurrency(feeSchedule?.international_fee),
    optional_fee: formatCurrency(feeSchedule?.optional_fee),
    total_fees: formatCurrency(feeSchedule?.total_fees),
    payment_before_signing: formatCurrency(
      feeSchedule?.payment_before_signing
    ),
    payment_after_signing:
      feeSchedule && Number(feeSchedule.payment_after_signing) === 0
        ? "NIL"
        : formatCurrency(feeSchedule?.payment_after_signing),
    installment_total: formatCurrency(installmentTotal || null),
    total_payments: formatCurrency(feeSchedule?.total_fees),
  };

  for (let i = 1; i <= MAX_TEMPLATE_INSTALLMENTS; i++) {
    const inst = installments.find((inst) => inst.installment_number === i);
    templateData[`installment_${i}_due_date`] = inst
      ? formatDate(inst.due_date)
      : "";
    templateData[`installment_${i}_amount`] = inst
      ? formatCurrency(inst.amount_due)
      : "";
  }

  doc.render(templateData);

  const buf = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return buf;
}

function parseHoursFromTime(classTime: string): number | null {
  const match = classTime.match(
    /(\d{1,2}):?(\d{2})?\s*(AM|PM)\s*-\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)/i
  );
  if (!match) return null;
  const [, sh, sm, sap, eh, em, eap] = match;
  let startH = parseInt(sh);
  const startM = parseInt(sm || "0");
  let endH = parseInt(eh);
  const endM = parseInt(em || "0");
  if (sap.toUpperCase() === "PM" && startH !== 12) startH += 12;
  if (sap.toUpperCase() === "AM" && startH === 12) startH = 0;
  if (eap.toUpperCase() === "PM" && endH !== 12) endH += 12;
  if (eap.toUpperCase() === "AM" && endH === 12) endH = 0;
  const diff = (endH * 60 + endM - (startH * 60 + startM)) / 60;
  return diff > 0 ? diff : null;
}
