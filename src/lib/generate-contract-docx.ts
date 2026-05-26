import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { ContractDetailData } from "@/features/contracts/actions";

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

// ---------------------------------------------------------------------------
// XML-level text replacement
// ---------------------------------------------------------------------------

interface TextRun {
  fullMatch: string;
  prefix: string;
  text: string;
  suffix: string;
  start: number;
  end: number;
}

function getTextRuns(paragraphXml: string): TextRun[] {
  const runs: TextRun[] = [];
  const re = /(<w:t[^>]*>)([^<]*)(<\/w:t>)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(paragraphXml)) !== null) {
    runs.push({
      fullMatch: m[0],
      prefix: m[1],
      text: m[2],
      suffix: m[3],
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return runs;
}

function replaceTextAcrossRuns(
  paragraphXml: string,
  searchText: string,
  replacement: string
): string {
  const runs = getTextRuns(paragraphXml);
  const combined = runs.map((r) => r.text).join("");
  const idx = combined.indexOf(searchText);
  if (idx === -1) return paragraphXml;

  let charOffset = 0;
  let result = paragraphXml;
  let xmlDelta = 0;
  let placed = false;

  for (const run of runs) {
    const runStart = charOffset;
    const runEnd = charOffset + run.text.length;

    if (runEnd <= idx || runStart >= idx + searchText.length) {
      charOffset = runEnd;
      continue;
    }

    const overlapStart = Math.max(idx, runStart) - runStart;
    const overlapEnd = Math.min(idx + searchText.length, runEnd) - runStart;

    let newText: string;
    if (!placed) {
      const before = run.text.substring(0, overlapStart);
      const after = run.text.substring(overlapEnd);
      newText = before + replacement + after;
      placed = true;
    } else {
      const before = run.text.substring(0, overlapStart);
      const after = run.text.substring(overlapEnd);
      newText = before + after;
    }

    const newRun = run.prefix + newText + run.suffix;
    const adjustedStart = run.start + xmlDelta;
    const adjustedEnd = run.end + xmlDelta;
    result =
      result.substring(0, adjustedStart) + newRun + result.substring(adjustedEnd);
    xmlDelta += newRun.length - (run.end - run.start);

    charOffset = runEnd;
  }

  return result;
}

function findParagraph(
  xml: string,
  searchText: string,
  startFrom = 0
): { start: number; end: number; content: string } | null {
  const paraOpenRe = /<w:p[ >]/g;
  paraOpenRe.lastIndex = startFrom;
  let match: RegExpExecArray | null;
  while ((match = paraOpenRe.exec(xml)) !== null) {
    const paraStart = match.index;
    const paraEndTag = xml.indexOf("</w:p>", paraStart);
    if (paraEndTag === -1) continue;
    const paraEnd = paraEndTag + 6;
    const paraContent = xml.substring(paraStart, paraEnd);
    const textRe = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let textMatch: RegExpExecArray | null;
    let combinedText = "";
    while ((textMatch = textRe.exec(paraContent)) !== null) {
      combinedText += textMatch[1];
    }
    if (combinedText.includes(searchText)) {
      return { start: paraStart, end: paraEnd, content: paraContent };
    }
  }
  return null;
}

function replaceParagraphText(
  xml: string,
  contextLabel: string,
  searchText: string,
  replacement: string,
  startFrom = 0
): string {
  let searchPos = startFrom;
  for (;;) {
    const para = findParagraph(xml, contextLabel, searchPos);
    if (!para) return xml;
    const updated = replaceTextAcrossRuns(para.content, searchText, replacement);
    if (updated !== para.content) {
      return xml.substring(0, para.start) + updated + xml.substring(para.end);
    }
    searchPos = para.end;
  }
}

// ---------------------------------------------------------------------------
// Marker constants
// ---------------------------------------------------------------------------

const ACADEMIC_MARKERS = [
  { value: "canadian_secondary", text: "Grade 12 Ontario Secondary School Diploma" },
  { value: "foreign_credential", text: "International Student and/or Applicant with foreign credentials" },
  { value: "mature_student", text: "Mature student status may be granted" },
];

const ENGLISH_MARKERS = [
  { value: "ielts", text: "IELTS" },
  { value: "toefl_ibt", text: "TOEFL" },
  { value: "cael", text: "CAEL" },
  { value: "celpip", text: "Canadian English Language Proficiency Index Program" },
  { value: "clb", text: "Canadian Language Benchmark Tests" },
  { value: "duolingo", text: "Duolingo English Test" },
  { value: "pte_academic", text: "Pearson PTE Academic" },
  { value: "nacc_written_exam", text: "NACC Written Entrance Exam" },
  { value: "two_years_canadian_postsecondary_english", text: "post-secondary study in English at a Canadian institution" },
  { value: "two_years_international_postsecondary_english", text: "post-secondary study in English at an institution outside of Canada" },
];

const WINGDINGS_CHECK_RUN =
  '<w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:sym w:font="Wingdings" w:char="F0FE"/></w:r>';

const CHECKED = "[X]";
const UNCHECKED = "[ ]";

// ---------------------------------------------------------------------------
// Marker helper functions
// ---------------------------------------------------------------------------

function removeWingdingsRuns(paragraphXml: string): string {
  let result = paragraphXml;
  const marker = '<w:sym w:font="Wingdings"';
  let pos = result.indexOf(marker);
  while (pos !== -1) {
    const rSpace = result.lastIndexOf("<w:r ", pos);
    const rAngle = result.lastIndexOf("<w:r>", pos);
    const runStart = Math.max(rSpace, rAngle);
    const runEnd = result.indexOf("</w:r>", pos);
    if (runStart === -1 || runEnd === -1) break;
    result = result.substring(0, runStart) + result.substring(runEnd + 6);
    pos = result.indexOf(marker);
  }
  return result;
}

function removeBoldFormatting(paragraphXml: string): string {
  return paragraphXml.replace(/<w:b\/>/g, "").replace(/<w:bCs\/>/g, "");
}

function addBoldFormatting(paragraphXml: string): string {
  let result = paragraphXml;
  result = result.replace(/<w:rPr>/g, "<w:rPr><w:b/><w:bCs/>");
  const insertions: number[] = [];
  const re = /<w:r[ >]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(result)) !== null) {
    const tagEnd = result.indexOf(">", m.index + 3);
    if (tagEnd === -1) continue;
    const after = result.substring(tagEnd + 1, tagEnd + 8);
    if (!after.startsWith("<w:rPr")) {
      insertions.push(tagEnd + 1);
    }
  }
  for (let i = insertions.length - 1; i >= 0; i--) {
    const p = insertions[i];
    result =
      result.substring(0, p) +
      "<w:rPr><w:b/><w:bCs/></w:rPr>" +
      result.substring(p);
  }
  return result;
}

function insertCheckmarkAfterPPr(paragraphXml: string): string {
  const tag = "</w:pPr>";
  const pos = paragraphXml.indexOf(tag);
  if (pos === -1) return paragraphXml;
  const at = pos + tag.length;
  return (
    paragraphXml.substring(0, at) +
    WINGDINGS_CHECK_RUN +
    paragraphXml.substring(at)
  );
}

// ---------------------------------------------------------------------------
// Academic/English marker application
// ---------------------------------------------------------------------------

function applyAcademicMarkers(
  xml: string,
  academicRoute: string | null
): string {
  for (const option of ACADEMIC_MARKERS) {
    const para = findParagraph(xml, option.text);
    if (!para) continue;
    let content = para.content;
    content = removeWingdingsRuns(content);
    content = removeBoldFormatting(content);
    if (academicRoute === option.value) {
      content = addBoldFormatting(content);
      content = insertCheckmarkAfterPPr(content);
    }
    xml = xml.substring(0, para.start) + content + xml.substring(para.end);
  }
  return xml;
}

function applyEnglishMarkers(
  xml: string,
  englishRoute: string | null
): string {
  for (const option of ENGLISH_MARKERS) {
    const headingPos = xml.indexOf("English Language Proficiency");
    if (headingPos === -1) continue;
    const feesPos = xml.indexOf(">Fees<", headingPos);
    const para = findParagraph(xml, option.text, headingPos);
    if (!para) continue;
    if (feesPos !== -1 && para.start >= feesPos) continue;
    let content = para.content;
    content = removeWingdingsRuns(content);
    content = removeBoldFormatting(content);
    if (englishRoute === option.value) {
      content = addBoldFormatting(content);
      content = insertCheckmarkAfterPPr(content);
    }
    xml = xml.substring(0, para.start) + content + xml.substring(para.end);
  }
  return xml;
}


// Reference data that will be replaced with actual student data
const REF_STUDENT_NAME = "CHIDI GLORIA AROWOLO";
const REF_START_DATE = "27/04/2026";
const REF_END_DATE = "25/10/2026";

export function generateContractDocx(data: ContractDetailData): Buffer {
  const templatePath = path.join(
    process.cwd(),
    "src/templates/contracts/student-enrolment-template.docx"
  );
  const templateContent = fs.readFileSync(templatePath);
  const zip = new PizZip(templateContent);

  const student = data.application.students;
  const program = data.application.programs;
  const batch = data.application.batches;
  const feeSchedule = data.feeSchedule;
  const installments = data.installments;
  const checklist = data.checklist;

  // ---------------------------------------------------------------
  // International Student & Delivery: rendered via docxtemplater
  // ---------------------------------------------------------------
  const deliveryMethod = batch?.delivery_method ?? null;
  const isInternational = student?.international_student ?? null;

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render({
    international_yes: isInternational === true ? CHECKED : UNCHECKED,
    international_no: isInternational === false ? CHECKED : UNCHECKED,
    delivery_in_person: deliveryMethod === "in_person" ? CHECKED : UNCHECKED,
    delivery_hybrid: deliveryMethod === "hybrid" ? CHECKED : UNCHECKED,
    delivery_online: deliveryMethod === "online" ? CHECKED : UNCHECKED,
  });

  const docXmlFile = zip.file("word/document.xml");
  if (!docXmlFile) throw new Error("Template missing document.xml");
  let xml = docXmlFile.asText();

  const studentFullName =
    buildStudentFullName(student) || "________________________";
  const mailingAddress =
    [student?.mailing_address_line_1, student?.mailing_address_line_2]
      .filter(Boolean)
      .join(", ") || "________________";
  const programName = program?.program_name || "________________________";

  const practicumHours1 = program?.practicum_hours
    ? Math.round((Number(program.practicum_hours) * 2) / 3)
    : null;
  const practicumHours2 = program?.practicum_hours
    ? Math.round(Number(program.practicum_hours) / 3)
    : null;

  const hoursPerDay = batch?.class_time
    ? parseHoursFromTime(batch.class_time)
    : null;

  // ---------------------------------------------------------------
  // Dynamic markers: academic, English (Wingdings-based)
  // ---------------------------------------------------------------
  xml = applyAcademicMarkers(xml, checklist?.academic_route ?? null);
  xml = applyEnglishMarkers(xml, checklist?.english_route ?? null);

  // ---------------------------------------------------------------
  // Page 1: Student information
  // ---------------------------------------------------------------
  xml = replaceParagraphText(
    xml,
    "Name of Student",
    REF_STUDENT_NAME,
    studentFullName
  );
  xml = replaceParagraphText(
    xml,
    "Student No",
    "PSW 125300",
    student?.student_number || "________________"
  );
  xml = replaceParagraphText(
    xml,
    "Mailing Address",
    "109 PRESTON MEADOW AVENUE",
    mailingAddress
  );
  xml = replaceParagraphText(
    xml,
    "City:",
    "DRYDEN",
    student?.city || "__________________"
  );
  xml = replaceParagraphText(
    xml,
    "Province:",
    "ONTARIO",
    student?.province || "________"
  );
  xml = replaceParagraphText(
    xml,
    "Postal Code:",
    "L4Z OC3",
    student?.postal_code || "__________"
  );
  xml = replaceParagraphText(
    xml,
    "Phone:",
    "437-225-8728",
    student?.phone || "___________________"
  );
  xml = replaceParagraphText(
    xml,
    "Email Address",
    "ladyglowin@gmail.com",
    student?.email || "________________________"
  );
  xml = replaceParagraphText(
    xml,
    "Date of Birth",
    "01/11/1976",
    formatDate(student?.date_of_birth) || "____/____/________"
  );

  // ---------------------------------------------------------------
  // Page 1: Program information
  // ---------------------------------------------------------------
  xml = replaceParagraphText(
    xml,
    "Name of Program",
    "NACC PERSONAL SUPPORT WORKER (PSW) DE 2022 (Accelerated)",
    programName
  );
  xml = replaceParagraphText(
    xml,
    "Commencing on",
    "27/04/2026",
    formatDate(batch?.start_date) || "____/____/________"
  );
  xml = replaceParagraphText(
    xml,
    "Expected Completion Date",
    "25/10/2026",
    formatDate(batch?.expected_end_date) || "____/____/________"
  );
  xml = replaceParagraphText(
    xml,
    "Credential to be Awarded",
    "PSW Certificate",
    program?.credential_name || "________________"
  );
  xml = replaceParagraphText(
    xml,
    "Training Location",
    "25 Watline Avenue, Unit 204",
    batch?.training_location || "________________________"
  );

  // Practicum 1
  const prac1Para = findParagraph(xml, "Practicum-1");
  if (prac1Para) {
    let p = prac1Para.content;
    p = replaceTextAcrossRuns(
      p,
      "200",
      practicumHours1 != null ? String(practicumHours1) : "___"
    );
    p = replaceTextAcrossRuns(
      p,
      "EXTENDICARE (To be determined as per availability)",
      batch?.practicum_1_location || "(To be determined as per availability)"
    );
    xml = xml.substring(0, prac1Para.start) + p + xml.substring(prac1Para.end);
  }

  // Practicum 2
  const prac2Start = xml.indexOf("practicum-2");
  const prac2Para = prac2Start !== -1 ? findParagraph(xml, "practicum-2") : null;
  if (prac2Para) {
    let p = prac2Para.content;
    p = replaceTextAcrossRuns(
      p,
      "100",
      practicumHours2 != null ? String(practicumHours2) : "___"
    );
    p = replaceTextAcrossRuns(
      p,
      "CHARTWELL OR EXTENDICARE (To be determined as per availability)",
      batch?.practicum_2_location || "(To be determined as per availability)"
    );
    // Also try without CHARTWELL prefix
    p = replaceTextAcrossRuns(
      p,
      "(To be determined as per availability)",
      batch?.practicum_2_location || "(To be determined as per availability)"
    );
    xml = xml.substring(0, prac2Para.start) + p + xml.substring(prac2Para.end);
  }

  // Program hours
  xml = replaceParagraphText(
    xml,
    "Program length",
    "700",
    program?.total_hours ? String(program.total_hours) : "____"
  );

  // ---------------------------------------------------------------
  // Class schedule table
  // ---------------------------------------------------------------
  const csLabelPos = xml.indexOf("Class Schedule");
  if (csLabelPos !== -1) {
    const tblStart = xml.indexOf("<w:tbl>", csLabelPos);
    if (tblStart !== -1) {
      const tblEnd = xml.indexOf("</w:tbl>", tblStart) + 8;
      let tbl = xml.substring(tblStart, tblEnd);
      const classTime = batch?.class_time || "";
      const hpd = hoursPerDay != null ? String(hoursPerDay) : "";
      tbl = tbl.replace(/>8:00AM-2:00PM</g, ">" + classTime + "<");
      tbl = tbl.replace(
        /(<w:t[^>]*>)6(<\/w:t>)/g,
        "$1" + hpd + "$2"
      );
      xml = xml.substring(0, tblStart) + tbl + xml.substring(tblEnd);
    }
  }

  // ---------------------------------------------------------------
  // Fees section
  // ---------------------------------------------------------------
  const feeLabelPos = xml.indexOf(">Fees<");
  if (feeLabelPos !== -1) {
    // Tuition fee: "___5365______________" -> new value
    xml = replaceParagraphText(
      xml,
      "Tuition fee",
      "___5365______________",
      formatCurrencyUnderlined(feeSchedule?.tuition_fee),
      feeLabelPos
    );
    // Other fees are blank underlines in the reference
    // They appear as "___________________" in w:t elements
    const feeFields = [
      ["Book fees", feeSchedule?.book_fee],
      ["Compulsory fees", feeSchedule?.compulsory_fee],
      ["Field Trips", feeSchedule?.field_trip_fee],
      ["Uniform", feeSchedule?.uniform_equipment_fee],
      ["Professional Exam", feeSchedule?.professional_exam_fee],
      ["Expendable supplies", feeSchedule?.expendable_supplies_fee],
      ["International fees", feeSchedule?.international_fee],
      ["Optional fees", feeSchedule?.optional_fee],
    ] as const;

    for (const [label, amount] of feeFields) {
      const newVal = formatCurrencyUnderlined(amount as number | null | undefined);
      xml = replaceParagraphText(
        xml,
        label,
        "___________________",
        newVal,
        feeLabelPos
      );
    }
  }

  // Total fees
  xml = replaceParagraphText(
    xml,
    "Total fees",
    "____5365_______________",
    formatCurrencyUnderlined(feeSchedule?.total_fees),
    feeLabelPos > 0 ? feeLabelPos : 0
  );

  // ---------------------------------------------------------------
  // Payment schedule
  // ---------------------------------------------------------------
  xml = replaceParagraphText(
    xml,
    "Payments prior to signing",
    "865",
    formatCurrencyPlain(feeSchedule?.payment_before_signing) || "___________"
  );
  xml = replaceParagraphText(
    xml,
    "Payments after signing",
    "NIL",
    feeSchedule && Number(feeSchedule.payment_after_signing) === 0
      ? "NIL"
      : formatCurrencyPlain(feeSchedule?.payment_after_signing) || "___________"
  );

  // ---------------------------------------------------------------
  // Installment table
  // ---------------------------------------------------------------
  const refInstallments = [
    { date: "01/06/2026", amount: "900" },
    { date: "01/07/2026", amount: "900" },
    { date: "01/08/2026", amount: "900" },
    { date: "01/09/2026", amount: "900" },
    { date: "01/10/2026", amount: "900" },
  ];

  const instLabelPos = xml.indexOf("Instalment");
  if (instLabelPos !== -1) {
    const instTblStart = xml.lastIndexOf("<w:tbl>", instLabelPos);
    if (instTblStart !== -1) {
      const instTblEnd = xml.indexOf("</w:tbl>", instTblStart) + 8;
      let tbl = xml.substring(instTblStart, instTblEnd);

      for (let i = 0; i < refInstallments.length; i++) {
        const inst = installments.find((inst) => inst.installment_number === i + 1);
        const newDate = inst ? formatDate(inst.due_date) : "";
        const newAmount = inst ? formatCurrencyPlain(inst.amount_due) : "";

        tbl = replaceTextAcrossRuns(tbl, refInstallments[i].date, newDate);
        tbl = replaceTextAcrossRuns(tbl, refInstallments[i].amount, newAmount);
      }

      xml = xml.substring(0, instTblStart) + tbl + xml.substring(instTblEnd);
    }
  }

  // Installment total
  const installmentTotal = installments.reduce(
    (sum, inst) => sum + Number(inst.amount_due),
    0
  );
  xml = replaceParagraphText(
    xml,
    "nstallment",
    "4500",
    formatCurrencyPlain(installmentTotal || null)
  );

  // Total payments
  xml = replaceParagraphText(
    xml,
    "Total payments",
    "5365",
    formatCurrencyPlain(feeSchedule?.total_fees) || "___________"
  );

  // ---------------------------------------------------------------
  // Remaining batch dates (e.g. practicum schedule summary page)
  // ---------------------------------------------------------------
  const newStartDate =
    formatDate(batch?.start_date) || "____/____/________";
  const newEndDate =
    formatDate(batch?.expected_end_date) || "____/____/________";
  let prev: string;
  do {
    prev = xml;
    xml = replaceParagraphText(xml, REF_START_DATE, REF_START_DATE, newStartDate);
  } while (xml !== prev);
  do {
    prev = xml;
    xml = replaceParagraphText(xml, REF_END_DATE, REF_END_DATE, newEndDate);
  } while (xml !== prev);

  // ---------------------------------------------------------------
  // Contract body: Student name (9 remaining occurrences)
  // ---------------------------------------------------------------
  const nameRe = new RegExp(
    "(<w:t[^>]*>)" + REF_STUDENT_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(</w:t>)",
    "g"
  );
  xml = xml.replace(nameRe, "$1" + studentFullName + "$2");

  // ---------------------------------------------------------------
  // Contract body: Program name references
  // ---------------------------------------------------------------
  const refProgram = "NACC Personal Support Worker (PSW)";
  const progRe = new RegExp(
    "(<w:t[^>]*>)" + refProgram.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(</w:t>)",
    "g"
  );
  xml = xml.replace(progRe, "$1" + programName + "$2");

  // ---------------------------------------------------------------
  // Save the modified XML back
  // ---------------------------------------------------------------
  zip.file("word/document.xml", xml);

  const buf = zip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return buf;
}
