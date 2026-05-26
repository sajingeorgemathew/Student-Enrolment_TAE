import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import { generateContractDocx } from "../src/lib/generate-contract-docx";
import type { ContractDetailData } from "../src/features/contracts/actions";

const testData: ContractDetailData = {
  application: {
    id: "test-app-001",
    status: "contract_generated",
    created_at: "2026-05-25T10:00:00Z",
    contract_generated_at: "2026-05-25T10:00:00Z",
    ready_for_contract_at: "2026-05-24T10:00:00Z",
    students: {
      id: "test-student-001",
      student_number: "PSW 125301",
      legal_first_name: "Jane",
      legal_middle_name: "Marie",
      legal_last_name: "Doe",
      preferred_name: null,
      date_of_birth: "1995-03-15",
      phone: "416-555-0100",
      alternate_phone: null,
      email: "jane.doe@example.com",
      mailing_address_line_1: "123 Test Street",
      mailing_address_line_2: "Unit 4B",
      city: "Toronto",
      province: "Ontario",
      postal_code: "M5V 2T6",
      country: "Canada",
      permanent_address_line_1: null,
      permanent_city: null,
      permanent_province: null,
      permanent_postal_code: null,
      permanent_country: null,
      immigration_status: null,
      international_student: true,
    },
    programs: {
      id: "test-prog-001",
      program_code: "PSW-ACC",
      program_name: "NACC Personal Support Worker (PSW)",
      credential_name: "PSW Certificate",
      total_hours: 700,
      theory_hours: 400,
      practicum_hours: 300,
    },
    batches: {
      id: "test-batch-001",
      batch_name: "PSW Batch 5 - Morning",
      batch_code: "PSW-B5-AM",
      start_date: "2026-06-01",
      expected_end_date: "2026-12-15",
      theory_start_date: "2026-06-01",
      theory_end_date: "2026-09-30",
      practicum_start_date: "2026-10-01",
      practicum_end_date: "2026-12-15",
      class_days: "monday,tuesday,wednesday,thursday,friday",
      class_time: "8:00AM-2:00PM",
      delivery_method: "in_person",
      training_location: "25 Watline Avenue, Unit 204",
      practicum_1_location: "(To be determined as per availability)",
      practicum_2_location: "(To be determined as per availability)",
    },
  },
  checklist: {
    id: "test-check-001",
    photo_id_status: "approved",
    address_proof_status: "approved",
    academic_route: "canadian_secondary",
    academic_status: "approved",
    academic_notes: null,
    english_route: "ielts",
    english_status: "approved",
    english_score: "6.5",
    english_notes: null,
  },
  feeSchedule: {
    id: "test-fee-001",
    status: "approved",
    tuition_fee: 5365,
    book_fee: 0,
    compulsory_fee: 0,
    field_trip_fee: 0,
    uniform_equipment_fee: 0,
    professional_exam_fee: 0,
    expendable_supplies_fee: 0,
    international_fee: 0,
    optional_fee: 0,
    discount_amount: 0,
    total_fees: 5365,
    payment_before_signing: 865,
    payment_after_signing: 0,
    remaining_balance: 4500,
    number_of_installments: 5,
  },
  installments: [
    { id: "inst-1", installment_number: 1, due_date: "2026-07-01", amount_due: 900, notes: null },
    { id: "inst-2", installment_number: 2, due_date: "2026-08-01", amount_due: 900, notes: null },
    { id: "inst-3", installment_number: 3, due_date: "2026-09-01", amount_due: 900, notes: null },
    { id: "inst-4", installment_number: 4, due_date: "2026-10-01", amount_due: 900, notes: null },
    { id: "inst-5", installment_number: 5, due_date: "2026-11-01", amount_due: 900, notes: null },
  ],
  documents: [],
  contract: null,
};

const CHECKED = "☒";
const UNCHECKED = "☐";

function verifyXml(buf: Buffer, label: string, checks: Array<{ name: string; test: (xml: string) => boolean }>) {
  const zip = new PizZip(buf);
  const xml = zip.file("word/document.xml")!.asText();

  console.log(`\n--- ${label} ---`);
  for (const check of checks) {
    const pass = check.test(xml);
    console.log(`  ${pass ? "PASS" : "FAIL"}: ${check.name}`);
  }
}

function hasWingdingsInParagraph(xml: string, textMarker: string): boolean {
  const paraOpenRe = /<w:p[ >]/g;
  let m: RegExpExecArray | null;
  while ((m = paraOpenRe.exec(xml)) !== null) {
    const paraStart = m.index;
    const paraEnd = xml.indexOf("</w:p>", paraStart);
    if (paraEnd === -1) continue;
    const para = xml.substring(paraStart, paraEnd + 6);
    const textRe = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let tm: RegExpExecArray | null;
    let combined = "";
    while ((tm = textRe.exec(para)) !== null) combined += tm[1];
    if (combined.includes(textMarker) && para.includes('<w:sym w:font="Wingdings"')) {
      return true;
    }
  }
  return false;
}

function hasNoWingdingsInParagraph(xml: string, textMarker: string): boolean {
  const paraOpenRe = /<w:p[ >]/g;
  let m: RegExpExecArray | null;
  while ((m = paraOpenRe.exec(xml)) !== null) {
    const paraStart = m.index;
    const paraEnd = xml.indexOf("</w:p>", paraStart);
    if (paraEnd === -1) continue;
    const para = xml.substring(paraStart, paraEnd + 6);
    const textRe = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let tm: RegExpExecArray | null;
    let combined = "";
    while ((tm = textRe.exec(para)) !== null) combined += tm[1];
    if (combined.includes(textMarker)) {
      return !para.includes('<w:sym w:font="Wingdings"');
    }
  }
  return true;
}

function getParaCombinedText(xml: string, searchText: string): string {
  const re = /<w:p[ >]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const pEnd = xml.indexOf("</w:p>", m.index);
    if (pEnd === -1) continue;
    const para = xml.substring(m.index, pEnd + 6);
    const tRe = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let tm: RegExpExecArray | null;
    let combined = "";
    while ((tm = tRe.exec(para)) !== null) combined += tm[1];
    if (combined.includes(searchText)) return combined;
  }
  return "";
}

// Test 1: canadian_secondary + ielts + in_person + international=true
console.log("=== Test 1: canadian_secondary + ielts + in_person + international=true ===");
const buf1 = generateContractDocx(testData);
const outPath1 = path.join(process.cwd(), "test-output-markers-1.docx");
fs.writeFileSync(outPath1, buf1);
console.log(`Written: ${outPath1}`);

verifyXml(buf1, "Academic markers", [
  { name: "canadian_secondary HAS checkmark", test: (xml) => hasWingdingsInParagraph(xml, "Grade 12 Ontario Secondary School Diploma") },
  { name: "foreign_credential NO checkmark", test: (xml) => hasNoWingdingsInParagraph(xml, "International Student and/or Applicant with foreign credentials") },
  { name: "mature_student NO checkmark", test: (xml) => hasNoWingdingsInParagraph(xml, "Mature student status may be granted") },
]);

verifyXml(buf1, "English markers", [
  { name: "IELTS HAS checkmark", test: (xml) => {
    const engPos = xml.indexOf("English Language Proficiency");
    const feesPos = xml.indexOf(">Fees<", engPos);
    const section = xml.substring(engPos, feesPos);
    return section.includes("IELTS") && hasWingdingsInParagraph(xml.substring(engPos, feesPos + 1000), "IELTS");
  }},
  { name: "NACC NO checkmark", test: (xml) => {
    const engPos = xml.indexOf("English Language Proficiency");
    const feesPos = xml.indexOf(">Fees<", engPos);
    return hasNoWingdingsInParagraph(xml.substring(engPos, feesPos + 1000), "NACC Written Entrance Exam");
  }},
]);

verifyXml(buf1, "Delivery method", [
  { name: "in-person shows CHECKED marker", test: (xml) => {
    const text = getParaCombinedText(xml, "Method of program delivery");
    return text.includes(CHECKED + " in-person") && text.includes(UNCHECKED + " Hybrid") && text.includes(UNCHECKED + " Online");
  }},
  { name: "delivery has NO Wingdings", test: (xml) => hasNoWingdingsInParagraph(xml, "Method of program delivery") },
]);

verifyXml(buf1, "International student", [
  { name: "Yes shows CHECKED, No shows UNCHECKED", test: (xml) => {
    const text = getParaCombinedText(xml, "International Student");
    return text.includes(CHECKED + " Yes") && text.includes(UNCHECKED + " No");
  }},
  { name: "international has NO Wingdings", test: (xml) => hasNoWingdingsInParagraph(xml, "International Student:") },
]);

verifyXml(buf1, "English heading page break", [
  { name: "page break before English Language Proficiency", test: (xml) => {
    return xml.includes('<w:br w:type="page"/><w:t>English Language Proficiency');
  }},
]);

// Test 2: mature_student + nacc_written_exam + online + international=false
const testData2 = JSON.parse(JSON.stringify(testData)) as ContractDetailData;
testData2.checklist!.academic_route = "mature_student";
testData2.checklist!.english_route = "nacc_written_exam";
testData2.application.batches!.delivery_method = "online";
testData2.application.students!.international_student = false;

console.log("\n=== Test 2: mature_student + nacc_written_exam + online + international=false ===");
const buf2 = generateContractDocx(testData2);
const outPath2 = path.join(process.cwd(), "test-output-markers-2.docx");
fs.writeFileSync(outPath2, buf2);
console.log(`Written: ${outPath2}`);

verifyXml(buf2, "Academic markers", [
  { name: "mature_student HAS checkmark", test: (xml) => hasWingdingsInParagraph(xml, "Mature student status may be granted") },
  { name: "canadian_secondary NO checkmark", test: (xml) => hasNoWingdingsInParagraph(xml, "Grade 12 Ontario Secondary School Diploma") },
]);

verifyXml(buf2, "English markers", [
  { name: "NACC HAS checkmark", test: (xml) => {
    const engPos = xml.indexOf("English Language Proficiency");
    return hasWingdingsInParagraph(xml.substring(engPos), "NACC Written Entrance Exam");
  }},
  { name: "IELTS NO checkmark", test: (xml) => {
    const engPos = xml.indexOf("English Language Proficiency");
    const feesPos = xml.indexOf(">Fees<", engPos);
    return hasNoWingdingsInParagraph(xml.substring(engPos, feesPos + 1000), "IELTS");
  }},
]);

verifyXml(buf2, "Delivery method", [
  { name: "online shows CHECKED marker", test: (xml) => {
    const text = getParaCombinedText(xml, "Method of program delivery");
    return text.includes(UNCHECKED + " in-person") && text.includes(UNCHECKED + " Hybrid") && text.includes(CHECKED + " Online");
  }},
]);

verifyXml(buf2, "International student", [
  { name: "No shows CHECKED, Yes shows UNCHECKED", test: (xml) => {
    const text = getParaCombinedText(xml, "International Student");
    return text.includes(UNCHECKED + " Yes") && text.includes(CHECKED + " No");
  }},
]);

// Test 3: foreign_credential + duolingo + hybrid + international=null
const testData3 = JSON.parse(JSON.stringify(testData)) as ContractDetailData;
testData3.checklist!.academic_route = "foreign_credential";
testData3.checklist!.english_route = "duolingo";
testData3.application.batches!.delivery_method = "hybrid";
testData3.application.students!.international_student = null;

console.log("\n=== Test 3: foreign_credential + duolingo + hybrid + international=null ===");
const buf3 = generateContractDocx(testData3);
const outPath3 = path.join(process.cwd(), "test-output-markers-3.docx");
fs.writeFileSync(outPath3, buf3);
console.log(`Written: ${outPath3}`);

verifyXml(buf3, "Academic markers", [
  { name: "foreign_credential HAS checkmark", test: (xml) => hasWingdingsInParagraph(xml, "International Student and/or Applicant with foreign credentials") },
  { name: "mature_student NO checkmark", test: (xml) => hasNoWingdingsInParagraph(xml, "Mature student status may be granted") },
  { name: "canadian_secondary NO checkmark", test: (xml) => hasNoWingdingsInParagraph(xml, "Grade 12 Ontario Secondary School Diploma") },
]);

verifyXml(buf3, "English markers", [
  { name: "Duolingo HAS checkmark", test: (xml) => {
    const engPos = xml.indexOf("English Language Proficiency");
    return hasWingdingsInParagraph(xml.substring(engPos), "Duolingo English Test");
  }},
]);

verifyXml(buf3, "Delivery method", [
  { name: "hybrid shows CHECKED marker", test: (xml) => {
    const text = getParaCombinedText(xml, "Method of program delivery");
    return text.includes(UNCHECKED + " in-person") && text.includes(CHECKED + " Hybrid") && text.includes(UNCHECKED + " Online");
  }},
]);

verifyXml(buf3, "International student", [
  { name: "null: both UNCHECKED", test: (xml) => {
    const text = getParaCombinedText(xml, "International Student");
    return text.includes(UNCHECKED + " Yes") && text.includes(UNCHECKED + " No");
  }},
]);

// Test 4: null routes (all unmarked)
const testData4 = JSON.parse(JSON.stringify(testData)) as ContractDetailData;
testData4.checklist!.academic_route = null;
testData4.checklist!.english_route = null;
testData4.application.batches!.delivery_method = null;
testData4.application.students!.international_student = null;

console.log("\n=== Test 4: null routes (all unmarked) ===");
const buf4 = generateContractDocx(testData4);
const outPath4 = path.join(process.cwd(), "test-output-markers-4.docx");
fs.writeFileSync(outPath4, buf4);
console.log(`Written: ${outPath4}`);

verifyXml(buf4, "All markers cleared", [
  { name: "canadian_secondary NO checkmark", test: (xml) => hasNoWingdingsInParagraph(xml, "Grade 12 Ontario Secondary School Diploma") },
  { name: "foreign_credential NO checkmark", test: (xml) => hasNoWingdingsInParagraph(xml, "International Student and/or Applicant with foreign credentials") },
  { name: "mature_student NO checkmark", test: (xml) => hasNoWingdingsInParagraph(xml, "Mature student status may be granted") },
  { name: "NACC NO checkmark", test: (xml) => {
    const engPos = xml.indexOf("English Language Proficiency");
    return hasNoWingdingsInParagraph(xml.substring(engPos), "NACC Written Entrance Exam");
  }},
  { name: "delivery all UNCHECKED", test: (xml) => {
    const text = getParaCombinedText(xml, "Method of program delivery");
    return text.includes(UNCHECKED + " in-person") && text.includes(UNCHECKED + " Hybrid") && text.includes(UNCHECKED + " Online");
  }},
  { name: "international both UNCHECKED", test: (xml) => {
    const text = getParaCombinedText(xml, "International Student");
    return text.includes(UNCHECKED + " Yes") && text.includes(UNCHECKED + " No");
  }},
]);

// Test 5: not_required English route
const testData5 = JSON.parse(JSON.stringify(testData)) as ContractDetailData;
testData5.checklist!.english_route = "not_required";

console.log("\n=== Test 5: not_required English route ===");
const buf5 = generateContractDocx(testData5);
verifyXml(buf5, "not_required English", [
  { name: "NACC NO checkmark", test: (xml) => {
    const engPos = xml.indexOf("English Language Proficiency");
    return hasNoWingdingsInParagraph(xml.substring(engPos), "NACC Written Entrance Exam");
  }},
  { name: "IELTS NO checkmark", test: (xml) => {
    const engPos = xml.indexOf("English Language Proficiency");
    const feesPos = xml.indexOf(">Fees<", engPos);
    return hasNoWingdingsInParagraph(xml.substring(engPos, feesPos + 1000), "IELTS");
  }},
]);

// Test 6: Evening batch schedule
const testData6 = JSON.parse(JSON.stringify(testData)) as ContractDetailData;
testData6.application.batches!.batch_name = "PSW Batch 6 - Evening";
testData6.application.batches!.batch_code = "PSW-B6-PM";
testData6.application.batches!.class_time = "4:30PM-10:30PM";

console.log("\n=== Test 6: Evening batch schedule ===");
const buf6 = generateContractDocx(testData6);
const outPath6 = path.join(process.cwd(), "test-output-schedule-evening.docx");
fs.writeFileSync(outPath6, buf6);
console.log(`Written: ${outPath6}`);

verifyXml(buf6, "Evening schedule", [
  { name: "timing shows 4:30 PM to 10:30 PM", test: (xml) => {
    const csPos = xml.indexOf("Class Schedule");
    const tblStart = xml.indexOf("<w:tbl>", csPos);
    const tblEnd = xml.indexOf("</w:tbl>", tblStart) + 8;
    const tbl = xml.substring(tblStart, tblEnd);
    return tbl.includes("4:30 PM to 10:30 PM");
  }},
  { name: "timing does NOT show 4:30 AM", test: (xml) => {
    const csPos = xml.indexOf("Class Schedule");
    const tblStart = xml.indexOf("<w:tbl>", csPos);
    const tblEnd = xml.indexOf("</w:tbl>", tblStart) + 8;
    const tbl = xml.substring(tblStart, tblEnd);
    return !tbl.includes("4:30 AM");
  }},
  { name: "hours shows 6", test: (xml) => {
    const csPos = xml.indexOf("Class Schedule");
    const tblStart = xml.indexOf("<w:tbl>", csPos);
    const tblEnd = xml.indexOf("</w:tbl>", tblStart) + 8;
    const tbl = xml.substring(tblStart, tblEnd);
    return tbl.includes(">6<");
  }},
]);

// Test 7: Morning batch schedule (verify formatting)
console.log("\n=== Test 7: Morning batch schedule (existing test data) ===");
const outPath7 = path.join(process.cwd(), "test-output-schedule-morning.docx");
fs.writeFileSync(outPath7, buf1);
console.log(`Written: ${outPath7}`);

verifyXml(buf1, "Morning schedule", [
  { name: "timing shows 8:00 AM to 2:00 PM", test: (xml) => {
    const csPos = xml.indexOf("Class Schedule");
    const tblStart = xml.indexOf("<w:tbl>", csPos);
    const tblEnd = xml.indexOf("</w:tbl>", tblStart) + 8;
    const tbl = xml.substring(tblStart, tblEnd);
    return tbl.includes("8:00 AM to 2:00 PM");
  }},
  { name: "timing does NOT show raw 8:00AM-2:00PM", test: (xml) => {
    const csPos = xml.indexOf("Class Schedule");
    const tblStart = xml.indexOf("<w:tbl>", csPos);
    const tblEnd = xml.indexOf("</w:tbl>", tblStart) + 8;
    const tbl = xml.substring(tblStart, tblEnd);
    return !tbl.includes("8:00AM-2:00PM");
  }},
]);

// Test 8: College admin date + student date checks
console.log("\n=== Test 8: College admin dates and student dates ===");
verifyXml(buf1, "College admin dates", [
  { name: "Admission Officer paragraph has Date:", test: (xml) => {
    const para = getParaCombinedText(xml, "Signature of Admission Officer");
    return /Date:\s*\d{2}\/\d{2}\/\d{4}/.test(para);
  }},
  { name: "College Rep #1 has date", test: (xml) => {
    const pos = xml.indexOf("College Representative:");
    const pStart = xml.lastIndexOf("<w:p", pos);
    const pEnd = xml.indexOf("</w:p>", pos) + 6;
    const para = xml.substring(pStart, pEnd);
    const re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let m; const texts = [];
    while ((m = re.exec(para)) !== null) texts.push(m[1]);
    return /Date:\s*\d{2}\/\d{2}\/\d{4}/.test(texts.join(""));
  }},
  { name: "College Rep #2 has date", test: (xml) => {
    const pos1 = xml.indexOf("College Representative:");
    const pEnd1 = xml.indexOf("</w:p>", pos1) + 6;
    const pos2 = xml.indexOf("College Representative:", pEnd1);
    if (pos2 === -1) return false;
    const pStart2 = xml.lastIndexOf("<w:p", pos2);
    const pEnd2 = xml.indexOf("</w:p>", pos2) + 6;
    const para = xml.substring(pStart2, pEnd2);
    const re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let m; const texts = [];
    while ((m = re.exec(para)) !== null) texts.push(m[1]);
    return /Date:\s*\d{2}\/\d{2}\/\d{4}/.test(texts.join(""));
  }},
  { name: "Student Signature dates remain blank (no DD/MM/YYYY)", test: (xml) => {
    const re = /<w:p[ >]/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      const pEnd = xml.indexOf("</w:p>", m.index);
      if (pEnd === -1) continue;
      const para = xml.substring(m.index, pEnd + 6);
      const tRe = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let tm; const texts = [];
      while ((tm = tRe.exec(para)) !== null) texts.push(tm[1]);
      const combined = texts.join("");
      if (combined.includes("Student Signature") && combined.includes("Date")) {
        if (/Date:?\s*\d{2}\/\d{2}\/\d{4}/.test(combined)) return false;
      }
    }
    return true;
  }},
]);

// Test 9: Preset detection from batch name (no class_time)
const testData9 = JSON.parse(JSON.stringify(testData)) as ContractDetailData;
testData9.application.batches!.class_time = null;
testData9.application.batches!.batch_name = "PSW Batch 7 - Evening";

console.log("\n=== Test 9: Preset detection from batch name (evening, no class_time) ===");
const buf9 = generateContractDocx(testData9);

verifyXml(buf9, "Preset evening schedule", [
  { name: "timing shows 4:30 PM to 10:30 PM", test: (xml) => {
    const csPos = xml.indexOf("Class Schedule");
    const tblStart = xml.indexOf("<w:tbl>", csPos);
    const tblEnd = xml.indexOf("</w:tbl>", tblStart) + 8;
    const tbl = xml.substring(tblStart, tblEnd);
    return tbl.includes("4:30 PM to 10:30 PM");
  }},
  { name: "hours shows 6", test: (xml) => {
    const csPos = xml.indexOf("Class Schedule");
    const tblStart = xml.indexOf("<w:tbl>", csPos);
    const tblEnd = xml.indexOf("</w:tbl>", tblStart) + 8;
    const tbl = xml.substring(tblStart, tblEnd);
    return tbl.includes(">6<");
  }},
]);

// Test 10: Unknown batch (no class_time, no morning/evening in name)
const testData10 = JSON.parse(JSON.stringify(testData)) as ContractDetailData;
testData10.application.batches!.class_time = null;
testData10.application.batches!.batch_name = "PSW Batch 8 - Custom";

console.log("\n=== Test 10: Unknown batch schedule (blanks preserved) ===");
const buf10 = generateContractDocx(testData10);

verifyXml(buf10, "Unknown batch schedule", [
  { name: "timing cells cleared (no 8:00AM-2:00PM)", test: (xml) => {
    const csPos = xml.indexOf("Class Schedule");
    const tblStart = xml.indexOf("<w:tbl>", csPos);
    const tblEnd = xml.indexOf("</w:tbl>", tblStart) + 8;
    const tbl = xml.substring(tblStart, tblEnd);
    return !tbl.includes("8:00AM-2:00PM");
  }},
]);

console.log("\n=== All tests complete ===");
console.log("Test DOCX files written to project root:");
console.log("  test-output-markers-1.docx (canadian_secondary + ielts + in_person + intl=true)");
console.log("  test-output-markers-2.docx (mature_student + nacc + online + intl=false)");
console.log("  test-output-markers-3.docx (foreign_credential + duolingo + hybrid + intl=null)");
console.log("  test-output-markers-4.docx (all null - no markers)");
console.log("  test-output-schedule-morning.docx (morning batch)");
console.log("  test-output-schedule-evening.docx (evening batch)");
