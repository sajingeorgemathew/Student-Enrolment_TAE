import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { ContractDetailData } from "@/features/contracts/actions";

const MAX_TEMPLATE_INSTALLMENTS = 5;
const CONTRACT_DATE_CONSTANT = "02/05/2024";

const ACADEMIC_MARKERS: Record<string, string> = {
  canadian_secondary: "Grade 12 Ontario Secondary School Diploma",
  foreign_credential:
    "International Student and/or Applicant with foreign credentials",
  mature_student: "Mature student status may be granted",
};

const ENGLISH_MARKERS: Record<string, string> = {
  ielts: "IELTS",
  toefl_ibt: "TOEFL",
  cael: "CAEL",
  celpip: "Canadian English Language Proficiency Index Program",
  clb: "Canadian Language Benchmark Tests",
  duolingo: "Duolingo English Test",
  pte_academic: "Pearson PTE Academic",
  nacc_written_exam: "NACC Written Entrance Exam",
  two_years_canadian_postsecondary_english:
    "post-secondary study in English at a Canadian institution",
  two_years_international_postsecondary_english:
    "post-secondary study in English at an institution outside of Canada",
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const dateOnly = dateStr.split("T")[0];
  const d = new Date(dateOnly + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatCurrencyUnderlined(amount: number | null | undefined): string {
  const blank = "___________________";
  if (amount == null) return blank;
  const num = Number(amount);
  if (num === 0) return blank;
  const formatted = num.toLocaleString("en-CA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const totalWidth = 22;
  const leftPad = 3;
  const rightPad = Math.max(1, totalWidth - leftPad - formatted.length);
  return "_".repeat(leftPad) + formatted + "_".repeat(rightPad);
}

function formatCurrencyPlain(amount: number | null | undefined): string {
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

function extractParagraph(
  xml: string,
  textPosition: number
): { start: number; end: number; content: string } | null {
  const start = xml.lastIndexOf("<w:p ", textPosition);
  if (start === -1) return null;
  const end = xml.indexOf("</w:p>", start);
  if (end === -1) return null;
  return { start, end: end + 6, content: xml.substring(start, end + 6) };
}

function removeWingdingsFromParagraph(paragraphXml: string): string {
  return paragraphXml.replace(
    /<w:r[^>]*><w:rPr>[\s\S]*?<\/w:rPr><w:sym w:font="Wingdings"[^/]*\/><\/w:r>/g,
    ""
  );
}

function removeNumPrFromParagraph(paragraphXml: string): string {
  return paragraphXml.replace(/<w:numPr>[\s\S]*?<\/w:numPr>/g, "");
}

function removeBoldFromParagraph(paragraphXml: string): string {
  return paragraphXml
    .replace(/<w:b\s*\/>/g, "")
    .replace(/<w:bCs\s*\/>/g, "");
}

function addBoldToParagraph(paragraphXml: string): string {
  return paragraphXml.replace(
    /<w:rPr>([\s\S]*?)<\/w:rPr>/g,
    (match, inner) => {
      if (inner.includes("<w:b") || match.includes("Wingdings")) return match;
      return `<w:rPr><w:b/><w:bCs/>${inner}</w:rPr>`;
    }
  );
}

function addCheckmarkToParagraph(paragraphXml: string): string {
  const checkmarkRun =
    '<w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>' +
    '<w:sym w:font="Wingdings" w:char="F0FE"/></w:r>';

  const pPrEnd = paragraphXml.indexOf("</w:pPr>");
  if (pPrEnd !== -1) {
    const insertPos = pPrEnd + 8;
    return (
      paragraphXml.substring(0, insertPos) +
      checkmarkRun +
      paragraphXml.substring(insertPos)
    );
  }

  return paragraphXml;
}

function addPageBreakBeforeEnglish(docXml: string): string {
  const marker = "English Language Proficiency";
  const idx = docXml.indexOf(marker);
  if (idx === -1) return docXml;

  const para = extractParagraph(docXml, idx);
  if (!para) return docXml;

  if (para.content.includes("<w:pageBreakBefore/>")) return docXml;

  const pPrEnd = para.content.indexOf("</w:pPr>");
  if (pPrEnd === -1) return docXml;

  const updated =
    para.content.substring(0, pPrEnd) +
    "<w:pageBreakBefore/>" +
    para.content.substring(pPrEnd);

  return (
    docXml.substring(0, para.start) + updated + docXml.substring(para.end)
  );
}

function applyCheckmarks(
  docXml: string,
  data: ContractDetailData
): string {
  for (const [route, marker] of Object.entries(ACADEMIC_MARKERS)) {
    const markerIdx = docXml.indexOf(marker);
    if (markerIdx === -1) continue;

    const para = extractParagraph(docXml, markerIdx);
    if (!para) continue;

    let cleaned = removeWingdingsFromParagraph(para.content);
    cleaned = removeBoldFromParagraph(cleaned);
    cleaned = removeNumPrFromParagraph(cleaned);

    if (data.checklist?.academic_route === route) {
      cleaned = addCheckmarkToParagraph(cleaned);
    }

    docXml =
      docXml.substring(0, para.start) + cleaned + docXml.substring(para.end);
  }

  docXml = addPageBreakBeforeEnglish(docXml);

  const englishStart = docXml.indexOf("English Language Proficiency");
  const feesStart = docXml.indexOf(">Fees<");

  for (const [route, marker] of Object.entries(ENGLISH_MARKERS)) {
    const searchFrom = englishStart !== -1 ? englishStart : 0;
    const searchTo = feesStart !== -1 ? feesStart : docXml.length;

    const markerIdx = docXml.indexOf(marker, searchFrom);
    if (markerIdx === -1 || markerIdx > searchTo) continue;

    const para = extractParagraph(docXml, markerIdx);
    if (!para) continue;

    let cleaned = removeWingdingsFromParagraph(para.content);
    cleaned = removeBoldFromParagraph(cleaned);

    if (data.checklist?.english_route === route) {
      cleaned = addCheckmarkToParagraph(cleaned);
      cleaned = addBoldToParagraph(cleaned);
    }

    docXml =
      docXml.substring(0, para.start) + cleaned + docXml.substring(para.end);
  }

  return docXml;
}

export function generateContractDocx(data: ContractDetailData): Buffer {
  const templatePath = path.join(
    process.cwd(),
    "src/templates/contracts/student-enrolment-template.docx"
  );
  const templateContent = fs.readFileSync(templatePath);
  const zip = new PizZip(templateContent);

  const docXmlFile = zip.file("word/document.xml");
  if (docXmlFile) {
    const docXml = applyCheckmarks(docXmlFile.asText(), data);
    zip.file("word/document.xml", docXml);
  }

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
    contract_date: CONTRACT_DATE_CONSTANT,
    student_full_name: buildStudentFullName(student) || "________________________",
    student_number: student?.student_number || "________________",
    mailing_address: student?.mailing_address_line_1 || "________________",
    city: student?.city || "__________________",
    province: student?.province || "________",
    postal_code: student?.postal_code || "__________",
    phone: student?.phone || "___________________",
    email: student?.email || "________________________",
    date_of_birth: formatDate(student?.date_of_birth) || "____/____/________",
    program_name: program?.program_name || "________________________",
    program_start_date: formatDate(batch?.start_date) || "____/____/________",
    expected_completion_date: formatDate(batch?.expected_end_date) || "____/____/________",
    credential_name: program?.credential_name || "________________",
    training_location: batch?.training_location || "________________________",
    practicum_1_location:
      batch?.practicum_1_location || "(To be determined as per availability)",
    practicum_2_location:
      batch?.practicum_2_location || "(To be determined as per availability)",
    practicum_1_hours: practicumHours1 != null ? String(practicumHours1) : "___",
    practicum_2_hours: practicumHours2 != null ? String(practicumHours2) : "___",
    total_practicum_hours:
      totalPracticumHours != null ? String(totalPracticumHours) : "___",
    program_hours: program?.total_hours ? String(program.total_hours) : "________________",
    class_time: batch?.class_time || "",
    hours_per_day: hoursPerDay != null ? String(hoursPerDay) : "",
    tuition_fee: formatCurrencyUnderlined(feeSchedule?.tuition_fee),
    book_fee: formatCurrencyUnderlined(feeSchedule?.book_fee),
    compulsory_fee: formatCurrencyUnderlined(feeSchedule?.compulsory_fee),
    field_trip_fee: formatCurrencyUnderlined(feeSchedule?.field_trip_fee),
    uniform_equipment_fee: formatCurrencyUnderlined(feeSchedule?.uniform_equipment_fee),
    professional_exam_fee: formatCurrencyUnderlined(feeSchedule?.professional_exam_fee),
    expendable_supplies_fee: formatCurrencyUnderlined(
      feeSchedule?.expendable_supplies_fee
    ),
    international_fee: formatCurrencyUnderlined(feeSchedule?.international_fee),
    optional_fee: formatCurrencyUnderlined(feeSchedule?.optional_fee),
    total_fees: formatCurrencyUnderlined(feeSchedule?.total_fees),
    payment_before_signing: formatCurrencyPlain(feeSchedule?.payment_before_signing),
    payment_after_signing:
      feeSchedule && Number(feeSchedule.payment_after_signing) === 0
        ? "NIL"
        : formatCurrencyPlain(feeSchedule?.payment_after_signing),
    installment_total: formatCurrencyPlain(installmentTotal || null),
    total_payments: formatCurrencyPlain(feeSchedule?.total_fees),
  };

  for (let i = 1; i <= MAX_TEMPLATE_INSTALLMENTS; i++) {
    const inst = installments.find((inst) => inst.installment_number === i);
    templateData[`installment_${i}_due_date`] = inst
      ? formatDate(inst.due_date)
      : "";
    templateData[`installment_${i}_amount`] = inst
      ? formatCurrencyPlain(inst.amount_due)
      : "";
  }

  doc.render(templateData);

  const buf = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return buf;
}
