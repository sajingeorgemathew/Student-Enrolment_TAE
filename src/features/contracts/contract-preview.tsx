import Link from "next/link";
import { Pencil, Eye } from "lucide-react";
import type { ContractDetailData } from "./actions";

function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "____/____/________";
  const d = new Date(dateStr + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatCurrencyPlain(amount: number | null | undefined): string {
  if (amount == null) return "___________";
  return Number(amount).toLocaleString("en-CA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function studentFullName(
  student: ContractDetailData["application"]["students"]
): string {
  if (!student) return "________________________";
  return [
    student.legal_first_name,
    student.legal_middle_name,
    student.legal_last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
}

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wed",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const DAY_ALIASES: Record<string, string> = {
  mon: "Monday",
  monday: "Monday",
  tue: "Tuesday",
  tues: "Tuesday",
  tuesday: "Tuesday",
  wed: "Wed",
  wednesday: "Wed",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  thursday: "Thursday",
  fri: "Friday",
  friday: "Friday",
  sat: "Saturday",
  saturday: "Saturday",
  sun: "Sunday",
  sunday: "Sunday",
};

function parseDays(classDays: string | null | undefined): Set<string> {
  if (!classDays) return new Set();
  const result = new Set<string>();
  const parts = classDays.split(/[,;/]+/).map((s) => s.trim().toLowerCase());
  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const startDay = DAY_ALIASES[startStr];
      const endDay = DAY_ALIASES[endStr];
      if (startDay && endDay) {
        let adding = false;
        for (const d of ALL_DAYS) {
          if (d === startDay) adding = true;
          if (adding) result.add(d);
          if (d === endDay) break;
        }
      }
    } else {
      const mapped = DAY_ALIASES[part];
      if (mapped) result.add(mapped);
    }
  }
  return result;
}

function parseHoursFromTime(classTime: string | null | undefined): number | null {
  if (!classTime) return null;
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

type ReadinessCheck = {
  label: string;
  passed: boolean;
  detail: string;
};

function computeReadinessChecks(data: ContractDetailData): ReadinessCheck[] {
  const student = data.application.students;
  const program = data.application.programs;
  const batch = data.application.batches;
  const feeSchedule = data.feeSchedule;
  const checklist = data.checklist;
  const installments = data.installments;
  const documents = data.documents;

  const studentComplete =
    !!student?.legal_first_name &&
    !!student?.legal_last_name &&
    !!student?.email;

  return [
    {
      label: "Student information complete",
      passed: studentComplete,
      detail: studentComplete
        ? "Name and email present"
        : "Missing required student fields",
    },
    {
      label: "Program selected",
      passed: !!program,
      detail: program ? program.program_name : "No program assigned",
    },
    {
      label: "Batch selected",
      passed: !!batch,
      detail: batch ? batch.batch_name : "No batch assigned",
    },
    {
      label: "Fee schedule approved",
      passed: feeSchedule?.status === "approved",
      detail: feeSchedule
        ? `Status: ${feeSchedule.status}`
        : "No fee schedule created",
    },
    {
      label: "Checklist started or completed",
      passed: !!checklist,
      detail: checklist
        ? `Academic: ${checklist.academic_status}, English: ${checklist.english_status}`
        : "No checklist created",
    },
    {
      label: "Payment installments available",
      passed: installments.length > 0,
      detail:
        installments.length > 0
          ? `${installments.length} installment(s)`
          : "No installments",
    },
    {
      label: "Documents available",
      passed: documents.length > 0,
      detail:
        documents.length > 0
          ? `${documents.length} document(s)`
          : "No documents uploaded",
    },
  ];
}

export function ContractPreview({ data }: { data: ContractDetailData }) {
  const student = data.application.students;
  const program = data.application.programs;
  const batch = data.application.batches;
  const feeSchedule = data.feeSchedule;
  const checklist = data.checklist;
  const installments = data.installments;
  const applicationId = data.application.id;

  const readiness = computeReadinessChecks(data);
  const allReady = readiness.every((r) => r.passed);

  const headerLogoUrl =
    process.env.NEXT_PUBLIC_CONTRACT_HEADER_LOGO_URL || null;
  const footerLeftUrl =
    process.env.NEXT_PUBLIC_CONTRACT_FOOTER_LEFT_IMAGE_URL || null;
  const footerRightUrl =
    process.env.NEXT_PUBLIC_CONTRACT_FOOTER_RIGHT_IMAGE_URL || null;

  const fullName = studentFullName(student);
  const programName = program?.program_name || "________________________";
  const enrolmentDate = formatDateShort(data.application.created_at);

  const activeDays = parseDays(batch?.class_days);
  const hoursPerDay = parseHoursFromTime(batch?.class_time);

  const practicumHours1 = program?.practicum_hours
    ? Math.round((Number(program.practicum_hours) * 2) / 3)
    : null;
  const practicumHours2 = program?.practicum_hours
    ? Math.round(Number(program.practicum_hours) / 3)
    : null;

  return (
    <div className="space-y-6">
      {/* Readiness Panel */}
      <div className="no-print rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">
            Contract Readiness
          </h2>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {readiness.map((check) => (
              <div
                key={check.label}
                className={`flex items-start gap-3 rounded-md border px-4 py-3 ${
                  check.passed
                    ? "border-green-200 bg-green-50"
                    : "border-zinc-200 bg-zinc-50"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    check.passed
                      ? "bg-green-600 text-white"
                      : "bg-zinc-300 text-zinc-600"
                  }`}
                >
                  {check.passed ? "Y" : "-"}
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {check.label}
                  </p>
                  <p className="text-xs text-zinc-500">{check.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            {allReady ? (
              <p className="text-sm font-medium text-green-700">
                All readiness checks passed. This contract is ready for review
                and generation.
              </p>
            ) : (
              <p className="text-sm text-zinc-500">
                Some checks have not passed. The preview is still available but
                may have incomplete sections.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Source Edit Links */}
      <div className="no-print flex flex-wrap gap-3">
        {student && (
          <EditLink
            href={`/dashboard/students/${student.id}`}
            label="Edit Student"
          />
        )}
        {batch && (
          <EditLink
            href={`/dashboard/batches/${batch.id}/edit`}
            label="Edit Batch"
          />
        )}
        <EditLink
          href={`/dashboard/fees/${applicationId}`}
          label="Edit Fees"
        />
        <EditLink
          href={`/dashboard/checklists/${applicationId}`}
          label="Edit Checklist"
        />
        <EditLink
          href="/dashboard/documents"
          label="View Documents"
          icon="view"
        />
      </div>

      {/* Contract Document */}
      <div className="contract-page mx-auto max-w-[8.5in] rounded-lg border border-zinc-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <div
          className="contract-body px-10 py-8"
          style={{
            fontSize: "11pt",
            lineHeight: "1.4",
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          {/* Header Logo */}
          {headerLogoUrl && (
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={headerLogoUrl}
                alt="Institution logo"
                className="max-h-20 object-contain"
              />
            </div>
          )}

          {/* 1. Title */}
          <div className="text-center mb-4">
            <p className="text-base font-bold uppercase">
              Student Enrolment Contract
            </p>
            <p className="mt-1 font-bold" style={{ fontSize: "10pt" }}>
              This Enrolment Contract is subject to the Ontario Career Colleges
              Act, 2005 and
            </p>
            <p className="font-bold" style={{ fontSize: "10pt" }}>
              the regulations made under the Act.
            </p>
          </div>

          {/* 2. Opening Paragraph */}
          <p className="mb-4">
            The undersigned person hereby enrols as a student of{" "}
            <strong>13899667 CANADA INC</strong>. operating as{" "}
            <strong>Toronto Academy of Education</strong> as of{" "}
            <strong>{enrolmentDate}</strong> [*Date: DD/MM/YYYY format to be
            used] for the following:
          </p>

          {/* 3. Student Information */}
          <SectionTitle>Student Information</SectionTitle>
          <div className="space-y-0.5">
            <p>
              Name of Student: <strong>{fullName}</strong>
              <span className="ml-8">
                Student No:{" "}
                <strong>
                  {student?.student_number || "________________"}
                </strong>
              </span>
            </p>
            <p>
              Mailing Address:{" "}
              <strong>
                {student?.mailing_address_line_1 || "________________"}
              </strong>
              {student?.mailing_address_line_2 && (
                <>
                  , <strong>{student.mailing_address_line_2}</strong>
                </>
              )}
            </p>
            <p>
              City: <strong>{student?.city || "__________________"}</strong>
              <span className="ml-8">
                Province:{" "}
                <strong>{student?.province || "________"}</strong>
              </span>
              <span className="ml-8">
                Postal Code:{" "}
                <strong>{student?.postal_code || "__________"}</strong>
              </span>
            </p>
            <p>
              Phone:{" "}
              <strong>{student?.phone || "___________________"}</strong>
              <span className="ml-8">
                Alternative Phone:{" "}
                {student?.alternate_phone || "________________"}
              </span>
            </p>
            <p>Permanent Address (if different from mailing address)</p>
            <p>
              City: __________________
              <span className="ml-4">Province: ________</span>
              <span className="ml-4">Postal Code: __________</span>
            </p>
            <p>
              Country: {student?.country || "___________"}
              <span className="ml-8">Phone: ___________________</span>
            </p>
            <p>
              Email Address:{" "}
              <strong>
                {student?.email || "________________________"}
              </strong>
            </p>
            <p className="flex items-center gap-4">
              <span>International Student:</span>
              <span className="inline-flex items-center gap-1">
                <Checkbox
                  checked={student?.international_student === true}
                />
                Yes
              </span>
              <span className="inline-flex items-center gap-1">
                <Checkbox
                  checked={student?.international_student === false}
                />
                No
              </span>
            </p>
            <p>
              Date of Birth (DOB):{" "}
              <strong>
                {student?.date_of_birth
                  ? formatDateShort(student.date_of_birth)
                  : "____/____/________"}
              </strong>
            </p>
          </div>

          {/* 4. Program Information */}
          <SectionTitle>Program Information</SectionTitle>
          <div className="space-y-0.5">
            <p>
              <strong>Name of Program: {programName}</strong>
            </p>
            <p>
              Commencing on:{" "}
              <strong>{formatDateShort(batch?.start_date)}</strong>
              <span className="ml-8">
                Expected Completion Date:{" "}
                <strong>
                  {formatDateShort(batch?.expected_end_date)}
                </strong>
              </span>
            </p>
            <p>
              Credential to be Awarded Upon Successful Completion of the
              Program:{" "}
              <strong>
                {program?.credential_name || "________________"}
              </strong>
            </p>
            <p className="flex items-center gap-4">
              <strong>Language of Instruction</strong>
              <span className="inline-flex items-center gap-1">
                <Checkbox checked={true} />
                English
              </span>
              <span className="inline-flex items-center gap-1">
                <Checkbox checked={false} />
                Other
              </span>
            </p>
            <p>
              <strong>Training Location:</strong>{" "}
              <strong>
                {batch?.training_location || "________________________"}
              </strong>
            </p>
            <p>
              Additional Training Location (if any)
              _________________________________________________
            </p>
            <p>
              <strong>
                Location of Practicum-1
                {practicumHours1 ? ` (${practicumHours1} Hours)` : ""}:
              </strong>{" "}
              <strong>
                {batch?.practicum_1_location ||
                  "(To be determined as per availability)"}
              </strong>
            </p>
            <p>
              <strong>
                Location of Practicum-2
                {practicumHours2 ? ` (${practicumHours2} Hours)` : ""}:
              </strong>{" "}
              <strong>
                {batch?.practicum_2_location ||
                  "(To be determined as per availability)"}
              </strong>
            </p>
            <p>
              <strong>
                Program length (in hours){" "}
                {program?.total_hours
                  ? `${program.total_hours} Hours`
                  : "________________"}
              </strong>
            </p>
          </div>

          {/* 5. Class Schedule */}
          <SectionTitle>Class Schedule</SectionTitle>
          <ScheduleTable
            activeDays={activeDays}
            classTime={batch?.class_time || null}
            hoursPerDay={hoursPerDay}
          />

          {/* 6. Practicum Schedule */}
          <SectionTitle>Practicum Schedule</SectionTitle>
          <p className="mb-1">
            <strong>
              To be determined as per Host Clinical Facility
              Preceptor&apos;s schedule
            </strong>
          </p>
          <ScheduleTable
            activeDays={new Set()}
            classTime={null}
            hoursPerDay={null}
          />

          {/* 7. Method of Program Delivery */}
          <p className="flex items-center gap-4 mt-4">
            <span>Method of program delivery</span>
            <span className="inline-flex items-center gap-1">
              <Checkbox
                checked={batch?.delivery_method === "in_person"}
              />
              In-person
            </span>
            <span className="inline-flex items-center gap-1">
              <Checkbox checked={batch?.delivery_method === "hybrid"} />
              Hybrid
            </span>
            <span className="inline-flex items-center gap-1">
              <Checkbox checked={batch?.delivery_method === "online"} />
              Online
            </span>
          </p>

          {/* 8. Academic Requirements */}
          <SectionTitle>Academic Requirements</SectionTitle>
          <div className="pl-6 space-y-1">
            <p className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">
                <Checkbox checked={checklist?.academic_route === "canadian_secondary"} />
              </span>
              <span>
                Grade 12 Ontario Secondary School Diploma (OSSD), Canadian
                Secondary School Diploma or equivalent. Grade 12 English -
                College or University Track. Copy of Diploma and High School
                Transcript required.
              </span>
            </p>
          </div>
          <p className="text-center my-1">OR</p>
          <div className="pl-6 space-y-1">
            <p className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">
                <Checkbox checked={checklist?.academic_route === "foreign_credential"} />
              </span>
              <span>
                International Student and/or Applicant with foreign
                credentials. All foreign credentials must be translated into
                English and compared for Grade 12 equivalency by a recognized
                organization such as World Education Services: www.wes.org
              </span>
            </p>
          </div>
          <p className="text-center my-1">OR</p>
          <div className="pl-6 space-y-1">
            <p className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">
                <Checkbox checked={checklist?.academic_route === "mature_student"} />
              </span>
              <span>
                Mature student status may be granted to applicants who are
                over 19 years of age and do not have a Canadian high school
                diploma or GED. Mature Student with a score of 14 or more on
                the Wonderlic SLE (or other MCU approved test - Note: CAT and
                CAST can no longer be used)
              </span>
            </p>
          </div>

          {/* 9. English Language Proficiency */}
          <SectionTitle>English Language Proficiency</SectionTitle>
          <p className="mb-2">
            If English is not a student&apos;s first language, they must
            provide proof of English competency. This must be demonstrated
            through one of the following options:
          </p>
          <ol className="list-decimal pl-6 space-y-1">
            <EnglishOption
              route="ielts"
              selected={checklist?.english_route}
            >
              IELTS - International English Language Testing Services -
              Minimum average score of 5.5 with no subject test score lower
              than 5.5.
            </EnglishOption>
            <EnglishOption
              route="toefl_ibt"
              selected={checklist?.english_route}
            >
              TOEFL - Test of English as a Foreign Language Internet based
              test (IBT) - overall 80, with the minimum of each component:
              Reading 20; Listening 20; Speaking 20; Writing 20.
            </EnglishOption>
            <EnglishOption
              route="cael"
              selected={checklist?.english_route}
            >
              CAEL - Overall 60 with no section below 60.
            </EnglishOption>
            <EnglishOption
              route="celpip"
              selected={checklist?.english_route}
            >
              Canadian English Language Proficiency Index Program (CELPIP)
              with a score of 7 (no section scores below 6).
            </EnglishOption>
            <EnglishOption
              route="clb"
              selected={checklist?.english_route}
            >
              Canadian Language Benchmark Tests with a score of 7 in each
              strand (not an average of 7).
            </EnglishOption>
            <EnglishOption
              route="duolingo"
              selected={checklist?.english_route}
            >
              Duolingo English Test with a minimum score of 95.
            </EnglishOption>
            <EnglishOption
              route="pte_academic"
              selected={checklist?.english_route}
            >
              Pearson PTE Academic with a minimum score of 46.
            </EnglishOption>
            <EnglishOption
              route="nacc_written_exam"
              selected={checklist?.english_route}
            >
              NACC Written Entrance Exam (passing score of 60)
            </EnglishOption>
            <EnglishOption
              route="two_years_canadian_postsecondary_english"
              selected={checklist?.english_route}
            >
              Evidence of successful completion of 2 consecutive years of
              full-time equivalent post-secondary study in English at a
              Canadian institution.
            </EnglishOption>
            <EnglishOption
              route="two_years_international_postsecondary_english"
              selected={checklist?.english_route}
            >
              Evidence of successful completion of 2 consecutive years of
              full-time equivalent post-secondary study in English at an
              institution outside of Canada.
            </EnglishOption>
          </ol>

          {/* 10. Fees */}
          <SectionTitle>Fees</SectionTitle>
          <table className="w-full mb-2" style={{ fontSize: "10pt" }}>
            <tbody>
              <FeeRow label="Tuition fee" amount={feeSchedule?.tuition_fee} />
              <FeeRow label="Book fees" amount={feeSchedule?.book_fee} />
              <FeeRow
                label="Compulsory fees (Itemized)"
                amount={feeSchedule?.compulsory_fee}
              />
              <FeeRow
                label="Field Trips"
                amount={feeSchedule?.field_trip_fee}
              />
              <FeeRow
                label="Uniform & equipment fees"
                amount={feeSchedule?.uniform_equipment_fee}
              />
              <FeeRow
                label="Professional Exam fees"
                amount={feeSchedule?.professional_exam_fee}
              />
              <FeeRow
                label="Expendable supplies"
                amount={feeSchedule?.expendable_supplies_fee}
              />
              <FeeRow
                label="International fees"
                amount={feeSchedule?.international_fee}
              />
              <FeeRow
                label="Optional fees"
                amount={feeSchedule?.optional_fee}
              />
              {feeSchedule && Number(feeSchedule.discount_amount) > 0 && (
                <FeeRow
                  label="Discount"
                  amount={-Number(feeSchedule.discount_amount)}
                />
              )}
            </tbody>
          </table>
          <p className="font-bold border-t border-black pt-1">
            Total fees CAN
            <span className="ml-4">
              ${" "}
              {feeSchedule
                ? formatCurrencyPlain(feeSchedule.total_fees)
                : "___________________"}
            </span>
          </p>

          {/* 11. Payment Schedule */}
          <SectionTitle>Payment Schedule</SectionTitle>
          <p className="mb-2" style={{ fontSize: "10pt" }}>
            For programs approved for student loan purposes, the Payment
            Schedule should note that funds received from the Canada-Ontario
            Integrated Student Loan and Grant Funding (Ontario Student
            Assistance Program) or any other financial aid will be applied as
            payments. Verification of receipt of payment must be attached to
            the original contract.
          </p>
          <div className="space-y-0.5 mb-3">
            <p>
              1. Payments prior to signing contract (if any): CAN$ ={" "}
              <strong>
                {feeSchedule
                  ? formatCurrencyPlain(feeSchedule.payment_before_signing)
                  : "___________"}
              </strong>
            </p>
            <p>
              2. Payments after signing contract: CAN$ ={" "}
              <strong>
                {feeSchedule
                  ? Number(feeSchedule.payment_after_signing) === 0
                    ? "NIL"
                    : formatCurrencyPlain(
                        feeSchedule.payment_after_signing
                      )
                  : "___________"}
              </strong>
            </p>
          </div>

          <table
            className="w-full border-collapse border border-black mb-2"
            style={{ fontSize: "10pt" }}
          >
            <thead>
              <tr>
                <th className="border border-black px-2 py-1 text-left">
                  Instalment
                </th>
                <th className="border border-black px-2 py-1 text-left">
                  Due Date
                </th>
                <th className="border border-black px-2 py-1 text-left">
                  Amount due: CAN$
                </th>
                <th className="border border-black px-2 py-1 text-left">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {installments.length > 0 ? (
                <>
                  {installments.map((inst) => (
                    <tr key={inst.id}>
                      <td className="border border-black px-2 py-1">
                        {inst.installment_number}
                      </td>
                      <td className="border border-black px-2 py-1 font-bold">
                        {formatDateShort(inst.due_date)}
                      </td>
                      <td className="border border-black px-2 py-1 font-bold">
                        {formatCurrencyPlain(inst.amount_due)}
                      </td>
                      <td className="border border-black px-2 py-1">
                        {inst.notes || ""}
                      </td>
                    </tr>
                  ))}
                  {installments.length < 7 &&
                    Array.from({
                      length: 7 - installments.length,
                    }).map((_, i) => (
                      <tr key={`empty-${i}`}>
                        <td className="border border-black px-2 py-1">
                          &nbsp;
                        </td>
                        <td className="border border-black px-2 py-1" />
                        <td className="border border-black px-2 py-1" />
                        <td className="border border-black px-2 py-1" />
                      </tr>
                    ))}
                </>
              ) : (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="border border-black px-2 py-1">
                      {i + 1}
                    </td>
                    <td className="border border-black px-2 py-1" />
                    <td className="border border-black px-2 py-1" />
                    <td className="border border-black px-2 py-1" />
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {installments.length > 0 && (
            <div className="space-y-0.5">
              <p>
                3. Payments (installments) -{" "}
                <strong>
                  {formatCurrencyPlain(
                    installments.reduce(
                      (sum, inst) => sum + Number(inst.amount_due),
                      0
                    )
                  )}
                </strong>
              </p>
            </div>
          )}
          <p className="font-bold mt-2">
            Total payments (1 + 2): CAN$ ={" "}
            {feeSchedule
              ? formatCurrencyPlain(feeSchedule.total_fees)
              : "___________"}
          </p>

          {/* 12. Student Undertaking and Signature */}
          <div className="mt-4 space-y-2">
            <p>
              The undersigned student hereby undertakes and agrees to pay, or
              see to payment of, the fees indicated above in accordance with
              the terms of this Enrolment Contract.
            </p>
            <p>
              (Name of Student): <strong>{fullName}</strong>
            </p>
            <p className="mt-4">Date:</p>
            <div className="mt-6">
              <SignatureLine />
              <p style={{ fontSize: "9pt" }}>
                (Signature of Student)
              </p>
            </div>
          </div>

          {/* 13. Acknowledgement and Certification */}
          <div className="contract-section-break" />
          <SectionTitle>Acknowledgement and Certification</SectionTitle>
          <p className="mb-2">
            I, <strong>{fullName}</strong>, acknowledge that I have received
            a copy of:
          </p>
          <div className="space-y-1 pl-4 mb-3">
            <AckItem label="The Consent to Use of Personal Information" />
            <AckItem label="The Payment Schedule" />
            <AckItem label="The College's Fee Refund Policy" />
            <AckItem label="The Statement of Students' Rights and Responsibilities Issued by the Superintendent of Career Colleges" />
            <AckItem label="The College's Student Complaint Procedure" />
            <AckItem label="The College's Policy Relating to the Expulsion of Students" />
            <AckItem label="The College's Sexual Violence Policy" />
          </div>
          <p className="mb-4">
            I certify that I have read and understood this Enrolment
            Contract.
          </p>
          <div className="grid grid-cols-2 gap-x-12 mb-4">
            <div>
              <SignatureLine />
              <p style={{ fontSize: "9pt" }}>(Signature of Student)</p>
            </div>
            <div>
              <SignatureLine />
              <p style={{ fontSize: "9pt" }}>Date</p>
            </div>
          </div>

          <p className="mb-2">
            <strong>Toronto Academy of Education</strong> does not guarantee
            employment for any student who successfully completes a
            vocational program offered by Toronto Academy of Education.
          </p>
          <p className="mb-2">
            It is understood that fees are payable in accordance with the
            fees specified in this Enrolment Contract and all payments of
            fees shall become due forthwith upon a statement of accounting
            being rendered. Toronto Academy of Education reserves the right
            to cancel this Enrolment Contract if the undersigned student
            does not attend classes during the first 14 days of the program
            begins. For information regarding cancellation of this Enrolment
            Contract and refunds of fees paid, see sections 24 (2) to 33 of
            O. Reg. 415/06 made under the Ontario Career Colleges Act, 2005.
          </p>
          <p className="mb-2">
            The undersigned student is entitled to a copy of the signed
            contract immediately after it is signed.
          </p>
          <p className="mb-4">
            The undersigned student hereby undertakes and agrees to pay the
            fees specified in this Enrolment Contract in accordance with the
            terms of this Enrolment Contract.
          </p>
          <div className="grid grid-cols-2 gap-x-12 mb-4">
            <div>
              <SignatureLine />
              <p style={{ fontSize: "9pt" }}>(Signature of Student)</p>
            </div>
            <div>
              <SignatureLine />
              <p style={{ fontSize: "9pt" }}>(Date)</p>
            </div>
          </div>
          <p className="mb-2">
            <strong>Toronto Academy of Education</strong> agrees to supply
            program to the above-named student upon the terms herein
            mentioned. Toronto Academy of Education may cancel this
            Enrolment Contract if the above-named student does not meet the
            admission requirements of <strong>{programName}</strong> before
            the program begins.
          </p>
          <p className="mb-4">
            The above-named student is entitled to a copy of the signed
            contract immediately after it is signed.
          </p>
          <div className="grid grid-cols-2 gap-x-12 mb-4">
            <div>
              <SignatureLine />
              <p style={{ fontSize: "9pt" }}>
                (Signature of Admission Officer, Registrar, Agent)
              </p>
            </div>
            <div>
              <SignatureLine />
              <p style={{ fontSize: "9pt" }}>Date</p>
            </div>
          </div>

          {/* 14. Consent to Use of Personal Information */}
          <div className="contract-section-break" />
          <SectionTitle>
            Consent to Use of Personal Information
          </SectionTitle>
          <p className="mb-2">
            Career colleges must be registered under the Ontario Career
            Colleges Act, 2005, which is administered by the Superintendent
            of Career Colleges. The Act protects students by requiring
            career colleges to follow specific rules on, for example, fee
            refunds, training completions if the college closes,
            qualifications of instructors, access to transcripts and
            advertising. It also requires colleges to publish and meet
            certain performance objectives that may be required by the
            Superintendent for their vocational programs. This information
            may be used by other students when they are deciding where to
            obtain their training. The consent set out below will help the
            Superintendent to ensure that current and future students
            receive the protection provided by the Act.
          </p>
          <p className="mb-2">
            I, <strong>{fullName}</strong>, allow{" "}
            <strong>
              13899667 CANADA INC. o/a Toronto Academy of Education
            </strong>{" "}
            to give my name, address, telephone number, e-mail address and
            other contact information to the Superintendent of Private
            Career Colleges for the purposes checked below:
          </p>
          <div className="space-y-1 pl-4 mb-2">
            <p className="flex items-start gap-2">
              <Checkbox checked={true} />
              <span>
                To advise me of my rights under the{" "}
                <strong>Ontario Career Colleges Act, 2005</strong> including
                my rights to a refund of fees, access to transcripts and a
                formal student complaint procedure; and
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Checkbox checked={true} />
              <span>
                To determine whether{" "}
                <strong>
                  13899667 CANADA INC. o/a Toronto Academy of Education
                </strong>{" "}
                has met the performance objectives required by the
                Superintendent for its vocational programs.
              </span>
            </p>
          </div>
          <p className="mb-4">
            I understand that I can refuse to sign this consent form and
            that I can withdraw my consent at any time for future uses of my
            personal information by writing to the Chief Operating Officer
            at 25 Watline Avenue, Unit 204 Mississauga, Ontario, L4Z 2Z1. I
            understand that if I refuse or withdraw my consent the
            Superintendent may not be able to contact me to inform me of my
            rights under the Act or collect information to help potential
            students make informed decisions about their educational
            choices.
          </p>
          <p className="mb-2">
            <strong>{fullName}</strong>
          </p>
          <div className="mb-2">
            <SignatureLine />
            <p style={{ fontSize: "9pt" }}>(Name of Student)</p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 mb-2">
            <div>
              <SignatureLine />
              <p style={{ fontSize: "9pt" }}>(Signature of Student)</p>
            </div>
            <div>
              <SignatureLine />
              <p style={{ fontSize: "9pt" }}>(Date)</p>
            </div>
          </div>

          {/* 15. Fee Refund Policy */}
          <div className="contract-section-break" />
          <SectionTitle>
            Fee Refund Policy as Prescribed under s. 24 (2) to 33 of O.
            Reg. 415/06
          </SectionTitle>
          <div className="space-y-2" style={{ fontSize: "10pt" }}>
            <p>24. (2) In sections 25 to 27,</p>
            <p className="pl-4">
              &quot;Earned fees&quot; means the amount of all fees paid for
              a vocational program that is proportional to the number of
              instruction hours that have taken place when a withdrawal or
              expulsion occurs; (&quot;droits acquis&quot;)
            </p>
            <p className="pl-4">
              &quot;Program mid-point&quot; means the point in the progress
              of a vocational program where half of the scheduled hours of
              instruction for the program have taken place; (&quot;mi-parcours
              du programme&quot;)
            </p>
            <p className="pl-4">
              &quot;Service fee&quot; means the lesser of 20 per cent of all
              vocational program fees and $500. (&quot;frais de
              service&quot;)
            </p>

            <p className="font-bold">Full refunds</p>
            <p>
              25. If a student has entered into a contract with a career
              college for a vocational program, the college shall give a
              refund of all fees paid for the program in the following
              circumstances:
            </p>
            <ol className="list-decimal pl-8 space-y-1">
              <li>
                The student rescinds (cancels) the contract in writing
                within two days of receiving a copy of it, in accordance
                with section 36 of the Act.
              </li>
              <li>
                Before the student completes the program, the college
                discontinues the program or the college&apos;s approval to
                provide the program is revoked by the Superintendent, but
                the college remains registered under the Act.
              </li>
              <li>
                The college collects any fees before receiving a certificate
                of registration from the Superintendent.
              </li>
              <li>
                The college collects any fees before the program was
                approved by the Superintendent.
              </li>
              <li>
                The college collects any fees other than a service fee
                before the student has entered into a contract with the
                college.
              </li>
              <li>
                The college expels the student in a manner or for reasons
                that are contrary to the college&apos;s expulsion policy.
              </li>
              <li>
                The college does not provide an evaluation, in writing, of
                the student&apos;s progress as required under section 12.
              </li>
              <li>
                The student voids the contract under subsection 18 (2) due
                to a statement, image or video made by the college that is
                prohibited under subsection 18 (1).
              </li>
              <li>
                The student voids the contract under section 22 because it
                is missing a term required under section 20.
              </li>
              <li>
                The student receives instruction from an instructor who is
                not qualified under section 41 for more than 10 per cent of
                the program&apos;s duration.
              </li>
            </ol>

            <p className="font-bold">Full refunds minus service fee</p>
            <p>
              26. A career college shall give a refund of all fees paid for
              a vocational program, except the service fee, in the following
              circumstances:
            </p>
            <ol className="list-decimal pl-8 space-y-1">
              <li>
                The student gives written notice to the college, before the
                program start date specified in the student&apos;s contract
                with the college, that the student is withdrawing from the
                program.
              </li>
              <li>
                The student is admitted to the program on the condition that
                the student meet specified admission requirements before the
                program start date specified in the student&apos;s contract
                with the college, and the student does not meet the
                requirements before that day.
              </li>
              <li>
                The student does not attend the program within the first 14
                days of the program after the program start date specified
                in the student&apos;s contract with the college and is given
                written notice that the contract is cancelled from the
                college within the first 45 days of the program.
              </li>
              <li>
                The college is notified by or on behalf of an international
                student before the program mid-point that the international
                student has not been issued a temporary resident visa as a
                member of the student class under the Immigration and
                Refugee Protection Act (Canada).
              </li>
            </ol>

            <p className="font-bold">Partial refunds</p>
            <p>
              27. (1) A career college shall give a student a refund of the
              fees paid for a vocational program in accordance with this
              section if,
            </p>
            <ol className="list-[lower-alpha] pl-8 space-y-1">
              <li>
                the student withdraws from the program after the program
                start date specified in the student&apos;s contract with the
                college; or
              </li>
              <li>
                the student is expelled from the program for a reason
                permitted under the college&apos;s expulsion policy.
              </li>
            </ol>
          </div>

          {/* 16. Medical Disclaimer */}
          <div className="contract-section-break" />
          <SectionTitle>Medical Disclaimer</SectionTitle>
          <p className="mb-2">
            As this program will involve direct contact with vulnerable
            individuals, students must submit a completed and satisfactory
            medical report prior to commencing any practicum placement. It
            is mandatory to submit the medical report within 45 days of
            commencement of study to ensure that you can complete the
            program and be eligible to graduate.
          </p>
          <p className="mb-2">
            Completion of a medical report can take up to four (4) weeks to
            complete or longer (up to 6 months) if further vaccinations are
            required. If you are unable to submit the required medical
            report within 45 days of commencing the program, you risk (1)
            being ineligible for a practicum placement; (2) being ineligible
            to graduate from the program; and (3) being ineligible for a
            partial refund or no refund of tuition, depending on the date of
            withdrawal.
          </p>
          <p className="mb-2 font-bold">
            According to NACC Personal Support Worker (PSW) Policy:
          </p>
          <p className="mb-2 italic">
            &quot;ALL students accepted into the PSW Program MUST be free
            from communicable disease, have an up-to-date immunization
            status, and have a level of fitness sufficient to complete the
            clinical placement. All students must be provided with a Medical
            Report on enrollment for completion by their medical
            practitioner.
          </p>
          <p className="mb-1 italic">
            The completed Medical Report must be:
          </p>
          <ol className="list-decimal pl-6 mb-2 italic space-y-1">
            <li>
              completed and returned to the college within{" "}
              <strong>45 days of class start</strong>.
            </li>
            <li>
              reviewed by the PSW Program Director to ensure confirmation of
              current immunization status and the student is free from
              communicable diseases. The PSW Instructor must be consulted
              for any health-related interpretation that is required; and
            </li>
            <li>
              placed in the student&apos;s file following
              review/interpretation.&quot;
            </li>
          </ol>
          <p className="mb-2 font-bold">
            No students may participate in any Practicum Placement hours
            prior to submitting a completed and satisfactory immunization &
            medical report.
          </p>
          <p className="mb-2">
            I, <strong>{fullName}</strong>, acknowledge that I have read the
            above disclosure and understand that I must obtain and submit
            up-to-date immunization status within 45 days of commencement of
            study and that I must, while enrolled in the program, maintain
            this status in order to complete the practicum placement and
            graduate.
          </p>
          <p className="mb-2">
            I also understand that if I do not obtain and maintain this
            up-to-date immunization status, I risk:
          </p>
          <p className="font-bold">
            1. being ineligible for a practicum placement.
          </p>
          <p className="font-bold">
            2. being ineligible to graduate from the program; and
          </p>
          <p className="font-bold mb-4">
            3. being ineligible for a partial refund or no refund of
            tuition, depending on when I withdraw from this program.
          </p>
          <div className="grid grid-cols-2 gap-x-12 mb-2">
            <div>
              <p className="mb-1">Student Signature:</p>
              <SignatureLine />
            </div>
            <div>
              <p className="mb-1">Date:</p>
              <SignatureLine />
            </div>
          </div>

          {/* 17. Vulnerable Sector Disclaimer */}
          <div className="contract-section-break" />
          <SectionTitle>Vulnerable Sector Disclaimer</SectionTitle>
          <p className="mb-2">
            As this program will involve direct contact with vulnerable
            individuals, students must submit a clean Canada wide Police
            Clearance of Criminal Record and Vulnerable Sector Screening
            (VSS) prior to commencing any practicum placement. It is
            mandatory to submit this report within 45 days of commencement
            of study to ensure that you can complete the program and be
            eligible to graduate. A VSS can take 10 to 12 weeks to
            complete. If you are unable to submit the required VSS within 45
            days of commencing the program, you risk (1) being ineligible
            for a practicum placement; (2) being ineligible to graduate from
            the program; and (3) being ineligible for a partial refund or
            no refund of tuition, depending on the date of withdrawal.
          </p>
          <p className="mb-2">
            A VSS involves a search of the Vulnerable Sector Database,
            maintained by the Ontario Provincial Police, for any information
            about you in police files, including criminal convictions,
            outstanding charges, and information about whether you are
            suspected of committing a criminal offence or involved in a
            serious criminal investigation. Police databases will also
            document any contact that you may have had with police services
            under the Mental Health Act, 1990.
          </p>
          <p className="mb-2 font-bold">
            You must also ensure that you do not engage in any activities at
            any time during the program, including while undertaking a
            practicum placement, which would render a clean VSS void
            previously submitted by you. Failure to maintain a clean VSS
            will also render you unable to undertake or continue the
            practicum placement, ineligible for graduation, and only
            eligible for a partial refund or no refund of tuition, depending
            on when you withdraw, or when you are expelled from the program.
          </p>
          <p className="mb-2">
            I, <strong>{fullName}</strong>, acknowledge that I have read the
            above disclosure and understand that I must obtain and submit a
            clean VSS within 45 days of commencement of study and understand
            that I must, while enrolled in the program, maintain this status
            to complete the practicum placement and graduate.
          </p>
          <p className="mb-2">
            I also understand that if I do not obtain and maintain this
            up-to-date clean VSS status, I risk:
          </p>
          <ol className="list-decimal pl-6 font-bold space-y-1 mb-1">
            <li>being ineligible for a practicum placement.</li>
            <li>
              being ineligible to graduate from the program; and
            </li>
          </ol>
          <p className="font-bold mb-2">
            3. being ineligible for a partial refund or no refund of
            tuition, depending on when I withdraw from this program.
          </p>
          <p className="mb-4">
            Please contact your local police authorities to complete this
            process.
          </p>
          <div className="grid grid-cols-2 gap-x-12 mb-2">
            <div>
              <p className="mb-1">Student Signature:</p>
              <SignatureLine />
            </div>
            <div>
              <p className="mb-1">Date:</p>
              <SignatureLine />
            </div>
          </div>

          {/* 18. Practicum Placement Disclaimer & Acknowledgement */}
          <div className="contract-section-break" />
          <SectionTitle>
            Practicum Placement Disclaimer & Acknowledgement
          </SectionTitle>
          <p className="mb-2">Dear Student,</p>
          <p className="mb-2">
            As part of your enrollment in the{" "}
            <strong>{programName}</strong> at Toronto Academy of Education,
            we would like to outline the expectations and important
            information regarding your{" "}
            <strong>clinical practicum placement</strong>. This placement is
            a mandatory component of your program and is governed by
            standards set out by the Ministry of Colleges and Universities
            (MCU) and the National Association of Career Colleges (NACC).
          </p>
          <p className="mb-3">
            We ask that you read the following carefully and sign below to
            acknowledge your understanding and agreement.
          </p>

          <p className="font-bold mb-2">
            Practicum Placement Expectations
          </p>
          <p className="mb-2">
            Toronto Academy of Education is committed to providing students
            with placement opportunities that meet program standards. In
            return, we expect our students to maintain high standards of
            professionalism and responsibility during their placement
            experience.
          </p>

          <p className="font-bold mb-1">1. Student Conduct</p>
          <p className="mb-1">
            During your clinical placement, you are representing both
            yourself and the college in a professional healthcare setting.
            You are expected to:
          </p>
          <ul className="list-disc pl-6 space-y-1 mb-2">
            <li>
              Conduct yourself in a{" "}
              <strong>
                respectful, responsible, and professional
              </strong>{" "}
              manner at all times.
            </li>
            <li>
              Follow the{" "}
              <strong>
                rules, policies, procedures, and code of conduct
              </strong>{" "}
              of the placement facility.
            </li>
            <li>
              Maintain <strong>confidentiality</strong>, demonstrate good
              communication skills, and work effectively within a healthcare
              team.
            </li>
            <li>
              Respect the learning environment and all individuals involved,
              including staff, residents/clients, and supervisors.
            </li>
          </ul>
          <p className="mb-3">
            Any{" "}
            <strong>unprofessional or inappropriate behavior</strong> may
            result in the termination of your placement and may affect your
            program standing.
          </p>

          <p className="font-bold mb-1">2. Placement Nature</p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li>
              The college will{" "}
              <strong>facilitate your practicum placement</strong> as per
              program requirements.
            </li>
            <li>
              Please note that the{" "}
              <strong>nature of the placement (paid or unpaid)</strong> is
              determined{" "}
              <strong>
                entirely by the clinical or community facility
              </strong>
              , based on their internal policies and government regulations.
            </li>
            <li>
              <strong>
                Toronto Academy of Education has no influence
              </strong>{" "}
              over whether a placement is paid or unpaid.
            </li>
            <li>
              By signing this form, you acknowledge that the college{" "}
              <strong>cannot guarantee paid placements</strong>.
            </li>
          </ul>

          <p className="font-bold mb-1">3. Placement Requirements</p>
          <p className="mb-1">
            To be eligible for placement, you must:
          </p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li>
              Successfully complete{" "}
              <strong>all theory modules</strong> prior to placement.
            </li>
            <li>
              Complete{" "}
              <strong>
                {program?.practicum_hours || "___"} hours
              </strong>{" "}
              of placement:
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  {practicumHours1 || "___"} hours in a{" "}
                  <strong>Long-Term Care Facility</strong>
                </li>
                <li>
                  {practicumHours2 || "___"} hours in a{" "}
                  <strong>Community Care setting</strong>
                </li>
              </ul>
            </li>
            <li>
              Submit all required documentation, including:
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Valid{" "}
                  <strong>CPR and First Aid Certification</strong>
                </li>
                <li>
                  Up-to-date <strong>medical clearance</strong>
                </li>
                <li>
                  <strong>
                    Police Vulnerable Sector Screening (VSS)
                  </strong>
                </li>
              </ul>
            </li>
            <li>
              Accurately record all placement hours in your{" "}
              <strong>Skills Passbook</strong>, with proper sign-offs.
            </li>
            <li>
              Demonstrate satisfactory performance and competency in all
              required PSW skills.
            </li>
          </ul>
          <p className="mb-3">
            Failure to meet these requirements may result in removal from
            placement or the need to repeat certain placement hours.
          </p>

          <p className="font-bold mb-1">4. College&apos;s Role</p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li>
              The college will arrange placement opportunities and ensure
              compliance with program standards.
            </li>
            <li>
              The college will provide WSIB and liability insurance for all
              approved placement hours.
            </li>
            <li>
              Your instructor will remain involved during your placement to
              monitor your progress, provide feedback, and support your
              success.
            </li>
          </ul>

          <p className="font-bold mb-2">Student Acknowledgment</p>
          <p className="mb-3">
            By signing below, you acknowledge that you have read,
            understood, and agreed to the above placement terms and
            expectations. You understand your responsibility to conduct
            yourself professionally and meet all placement requirements. You
            also acknowledge that the college is not responsible for
            determining whether a placement is paid or unpaid.
          </p>
          <p className="mb-2">
            <strong>Student Name:</strong> <strong>{fullName}</strong>
          </p>
          <div className="grid grid-cols-2 gap-x-12 mb-2">
            <div>
              <p className="mb-1">
                <strong>Signature:</strong>
              </p>
              <SignatureLine />
            </div>
            <div>
              <p className="mb-1">
                <strong>Date:</strong>
              </p>
              <SignatureLine />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-12 mb-2">
            <div>
              <p className="mb-1">
                <strong>College Representative:</strong>
              </p>
              <SignatureLine />
            </div>
            <div>
              <p className="mb-1">
                <strong>Date:</strong>
              </p>
              <SignatureLine />
            </div>
          </div>

          {/* 19. Student Immigration Status Acknowledgement */}
          <div className="contract-section-break" />
          <SectionTitle>
            Student Immigration Status Acknowledgement
          </SectionTitle>
          <p className="mb-2">
            This form must be reviewed and signed by all students enrolling
            in programs at{" "}
            <strong>Toronto Academy of Education</strong>.
          </p>
          <p className="mb-1">
            Student Name: <strong>{fullName}</strong>
            <span className="ml-8">
              Program Name: <strong>{programName}</strong>
            </span>
          </p>
          <p className="mb-3">
            Start Date:{" "}
            <strong>{formatDateShort(batch?.start_date)}</strong>
            <span className="ml-8">
              End Date:{" "}
              <strong>
                {formatDateShort(batch?.expected_end_date)}
              </strong>
            </span>
          </p>
          <p className="font-bold mb-2">
            Acknowledgment of Immigration Status Responsibility:
          </p>
          <p className="mb-2">
            I, the undersigned student, understand and acknowledge the
            following:
          </p>
          <ol className="list-decimal pl-6 space-y-2 mb-3">
            <li>
              <strong>
                Maintenance of Legal Immigration Status
              </strong>
              <br />I am solely responsible for maintaining valid
              immigration status in Canada throughout the duration of my
              studies at Toronto Academy of Education. This includes, but is
              not limited to, holding a valid Study Permit, Work Permit, or
              Visitor Record, as applicable.
            </li>
            <li>
              <strong>Change of Immigration Status</strong>
              <br />I agree to immediately notify Toronto Academy of
              Education in writing if there is any change to my immigration
              status, including expiration, renewal, or modification of:
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Study permit</li>
                <li>Work permit</li>
                <li>Visitor status</li>
                <li>
                  Permanent residency or any other legal status in Canada
                </li>
              </ul>
            </li>
            <li>
              <strong>
                College&apos;s Limitation of Liability
              </strong>
              <br />I understand that Toronto Academy of Education is not
              responsible for monitoring, managing, or resolving any
              immigration-related issues that may arise during my
              enrollment. Furthermore, the college is not liable for any
              consequences, academic interruptions, or legal implications
              resulting from changes or discrepancies in my immigration
              status.
            </li>
            <li>
              <strong>Government Compliance</strong>
              <br />I understand that it is my responsibility to ensure
              compliance with Immigration, Refugees and Citizenship Canada
              (IRCC) regulations at all times, and to seek legal or
              immigration counsel if needed.
            </li>
          </ol>
          <p className="mb-4">
            By signing below, I confirm that I have read, understood, and
            agree to the above statements regarding my immigration
            responsibilities as an international student.
          </p>
          <div className="grid grid-cols-2 gap-x-12 mb-2">
            <div>
              <p className="mb-1">Student Signature:</p>
              <SignatureLine />
            </div>
            <div>
              <p className="mb-1">Date:</p>
              <SignatureLine />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-12 mb-2">
            <div>
              <p className="mb-1">College Representative:</p>
              <SignatureLine />
            </div>
            <div>
              <p className="mb-1">Date:</p>
              <SignatureLine />
            </div>
          </div>

          {/* 20. Photography and Videography Consent Form */}
          <div className="contract-section-break" />
          <SectionTitle>
            Photography and Videography Consent Form
          </SectionTitle>
          <p className="font-bold mb-2">Consent for Use of Likeness</p>
          <p className="mb-2">
            By entering the premises of Toronto Academy of Education for any
            reason - including but not limited to campus tours, classes,
            training sessions, or other activities - you acknowledge and
            agree to the following:
          </p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li>
              You consent to the Academy, its representatives, employees,
              and authorized agents capturing photographs, video recordings,
              and audio recordings of you during your visit or
              participation.
            </li>
            <li>
              You grant the Academy the right to use, reproduce, publish,
              broadcast, and otherwise distribute any such media in which
              you may appear, in whole or in part, without compensation or
              further approval, for purposes including but not limited to
              marketing, promotional materials, advertising, website
              content, social media, publications, and other educational or
              commercial uses.
            </li>
            <li>
              You understand that all media captured will be the property of
              Toronto Academy of Education and may be used indefinitely.
            </li>
            <li>
              You waive any rights of inspection, approval, or ownership
              regarding the use of the images and recordings.
            </li>
            <li>
              You release and hold harmless Toronto Academy of Education,
              its employees, officers, directors, agents, and assigns from
              any claims, demands, actions, or causes of action arising out
              of or in connection with the use of such media.
            </li>
          </ul>
          <p className="mb-4">
            If you do not wish to be photographed or recorded, you must
            notify a representative of the Academy prior to the start of
            your visit or participation.
          </p>
          <p className="mb-2">
            <strong>Name:</strong> <strong>{fullName}</strong>
          </p>
          <div className="grid grid-cols-2 gap-x-12 mb-2">
            <div>
              <p className="mb-1">
                <strong>Signature:</strong>
              </p>
              <SignatureLine />
            </div>
            <div>
              <p className="mb-1">
                <strong>Date:</strong>
              </p>
              <SignatureLine />
            </div>
          </div>

          {/* 21. Footer / Contact Area */}
          <hr className="border-black mt-8" />
          <div className="text-center space-y-1 mt-4" style={{ fontSize: "10pt" }}>
            <p className="font-bold">Toronto Academy of Education</p>
            <p>
              25 Watline Avenue, Unit 204, Mississauga, Ontario, L4Z 2Z1
            </p>
            <p>
              For questions about this contract, please contact the
              administration office.
            </p>
          </div>
          {(footerLeftUrl || footerRightUrl) && (
            <div className="flex items-center justify-between pt-4">
              {footerLeftUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={footerLeftUrl}
                  alt="Footer left"
                  className="max-h-12 object-contain"
                />
              ) : (
                <div />
              )}
              {footerRightUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={footerRightUrl}
                  alt="Footer right"
                  className="max-h-12 object-contain"
                />
              ) : (
                <div />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-bold uppercase mt-5 mb-2" style={{ fontSize: "11pt" }}>
      {children}
    </p>
  );
}

function EditLink({
  href,
  label,
  icon = "edit",
}: {
  href: string;
  label: string;
  icon?: "edit" | "view";
}) {
  const Icon = icon === "view" ? Eye : Pencil;
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800 transition-colors"
    >
      <Icon className="h-3 w-3" />
      {label}
    </Link>
  );
}

function SignatureLine() {
  return <div className="border-b border-black w-full min-w-[200px] h-8" />;
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center border border-black text-xs leading-none"
      style={{ fontWeight: checked ? "bold" : "normal" }}
    >
      {checked ? "X" : ""}
    </span>
  );
}

function AckItem({ label }: { label: string }) {
  return (
    <p className="flex items-start gap-2">
      <Checkbox checked={true} />
      <span>{label}</span>
    </p>
  );
}

function EnglishOption({
  route,
  selected,
  children,
}: {
  route: string;
  selected: string | null | undefined;
  children: React.ReactNode;
}) {
  const isSelected = selected === route;
  return (
    <li>
      <span className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">
          <Checkbox checked={isSelected} />
        </span>
        <span>{children}</span>
      </span>
    </li>
  );
}

function ScheduleTable({
  activeDays,
  classTime,
  hoursPerDay,
}: {
  activeDays: Set<string>;
  classTime: string | null;
  hoursPerDay: number | null;
}) {
  return (
    <table
      className="w-full border-collapse border border-black"
      style={{ fontSize: "10pt" }}
    >
      <thead>
        <tr>
          <th className="border border-black px-1 py-1 text-left font-bold w-16">
            Days
          </th>
          {ALL_DAYS.map((d) => (
            <th
              key={d}
              className="border border-black px-1 py-1 text-center font-bold"
            >
              {d}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-black px-1 py-1 font-bold">
            Timings
          </td>
          {ALL_DAYS.map((d) => (
            <td
              key={d}
              className="border border-black px-1 py-1 text-center font-bold"
            >
              {activeDays.has(d) && classTime ? classTime : ""}
            </td>
          ))}
        </tr>
        <tr>
          <td className="border border-black px-1 py-1 font-bold">
            Hours
          </td>
          {ALL_DAYS.map((d) => (
            <td
              key={d}
              className="border border-black px-1 py-1 text-center"
            >
              {activeDays.has(d) && hoursPerDay ? hoursPerDay : ""}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

function FeeRow({
  label,
  amount,
}: {
  label: string;
  amount: number | null | undefined;
}) {
  return (
    <tr>
      <td className="py-0.5 pr-4" style={{ width: "60%" }}>
        {label}
      </td>
      <td className="py-0.5">
        ${" "}
        {amount != null && amount !== 0
          ? formatCurrencyPlain(amount)
          : "___________________"}
      </td>
    </tr>
  );
}
