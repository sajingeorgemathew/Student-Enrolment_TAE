import type { ContractDetailData } from "./actions";

const academicRouteLabels: Record<string, string> = {
  canadian_secondary: "Canadian Secondary School Diploma (Grade 12 or equivalent)",
  foreign_credential: "Foreign Credential Assessment",
  mature_student: "Mature Student (19 years or older)",
};

const englishRouteLabels: Record<string, string> = {
  ielts: "IELTS",
  toefl_ibt: "TOEFL iBT",
  cael: "CAEL",
  celpip: "CELPIP",
  clb: "CLB",
  duolingo: "Duolingo English Test",
  pte_academic: "PTE Academic",
  nacc_written_exam: "NACC Written Exam",
  two_years_canadian_postsecondary_english:
    "Completion of 2 years Canadian post-secondary education taught in English",
  two_years_international_postsecondary_english:
    "Completion of 2 years international post-secondary education taught in English",
  not_required: "Not Required",
};

const englishStatusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_review: "In Review",
  accepted: "Accepted",
  needs_correction: "Needs Correction",
};

const deliveryMethodLabels: Record<string, string> = {
  in_person: "In Person",
  hybrid: "Hybrid",
  online: "Online",
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "--";
  return `$${Number(amount).toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

  const readiness = computeReadinessChecks(data);
  const allReady = readiness.every((r) => r.passed);

  const headerLogoUrl =
    process.env.NEXT_PUBLIC_CONTRACT_HEADER_LOGO_URL || null;
  const footerLeftUrl =
    process.env.NEXT_PUBLIC_CONTRACT_FOOTER_LEFT_IMAGE_URL || null;
  const footerRightUrl =
    process.env.NEXT_PUBLIC_CONTRACT_FOOTER_RIGHT_IMAGE_URL || null;

  return (
    <div className="space-y-6">
      {/* Readiness Panel */}
      <div className="rounded-lg border border-zinc-200 bg-white">
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

      {/* Contract Preview Document */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">
            Contract Preview
          </h2>
        </div>

        <div className="px-8 py-8 space-y-8">
          {/* Header with Logo */}
          {headerLogoUrl && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={headerLogoUrl}
                alt="Institution logo"
                className="max-h-20 object-contain"
              />
            </div>
          )}

          {/* 1. Student Enrolment Contract Title */}
          <div className="text-center">
            <h1 className="text-xl font-bold text-zinc-900 uppercase tracking-wide">
              Student Enrolment Contract
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Toronto Academy of Education
            </p>
          </div>

          <Hr />

          {/* 2. Student Information */}
          <ContractSection title="Student Information">
            <FieldTable
              rows={[
                ["Student Number", student?.student_number],
                [
                  "Legal Name",
                  student
                    ? [
                        student.legal_first_name,
                        student.legal_middle_name,
                        student.legal_last_name,
                      ]
                        .filter(Boolean)
                        .join(" ")
                    : null,
                ],
                [
                  "Mailing Address",
                  [
                    student?.mailing_address_line_1,
                    student?.mailing_address_line_2,
                  ]
                    .filter(Boolean)
                    .join(", ") || null,
                ],
                ["City", student?.city],
                ["Province", student?.province],
                ["Postal Code", student?.postal_code],
                ["Country", student?.country],
                ["Phone", student?.phone],
                ["Alternate Phone", student?.alternate_phone],
                ["Email", student?.email],
                ["Date of Birth", formatDate(student?.date_of_birth)],
                [
                  "International Student",
                  student?.international_student != null
                    ? student.international_student
                      ? "Yes"
                      : "No"
                    : null,
                ],
                ["Immigration Status", student?.immigration_status],
              ]}
            />
          </ContractSection>

          {/* 3. Program Information */}
          <ContractSection title="Program Information">
            <FieldTable
              rows={[
                ["Program Name", program?.program_name],
                ["Program Code", program?.program_code],
                ["Credential", program?.credential_name],
                [
                  "Total Program Hours",
                  program?.total_hours != null
                    ? `${program.total_hours} hours`
                    : null,
                ],
                [
                  "Theory Hours",
                  program?.theory_hours != null
                    ? `${program.theory_hours} hours`
                    : null,
                ],
                [
                  "Practicum Hours",
                  program?.practicum_hours != null
                    ? `${program.practicum_hours} hours`
                    : null,
                ],
                ["Start Date", formatDate(batch?.start_date)],
                [
                  "Expected Completion Date",
                  formatDate(batch?.expected_end_date),
                ],
                ["Batch", batch?.batch_name],
                [
                  "Delivery Method",
                  batch?.delivery_method
                    ? (deliveryMethodLabels[batch.delivery_method] ??
                      batch.delivery_method)
                    : null,
                ],
                ["Training Location", batch?.training_location],
                ["Class Days", batch?.class_days],
                ["Class Time", batch?.class_time],
                ["Theory Start", formatDate(batch?.theory_start_date)],
                ["Theory End", formatDate(batch?.theory_end_date)],
                [
                  "Practicum Start",
                  formatDate(batch?.practicum_start_date),
                ],
                ["Practicum End", formatDate(batch?.practicum_end_date)],
                [
                  "Practicum Location 1",
                  batch?.practicum_1_location,
                ],
                [
                  "Practicum Location 2",
                  batch?.practicum_2_location,
                ],
              ]}
            />
          </ContractSection>

          {/* 4. Academic Requirements */}
          <ContractSection title="Academic Requirements">
            <p className="text-sm text-zinc-700 mb-3">
              Students must meet one of the following academic admission
              requirements:
            </p>
            <ul className="list-disc pl-6 text-sm text-zinc-700 space-y-1 mb-4">
              <li>
                An Ontario Secondary School Diploma (OSSD) or equivalent, or
                equivalent standing from outside Ontario at the postsecondary
                level
              </li>
              <li>
                A foreign credential assessment showing equivalence to a
                Canadian secondary school diploma
              </li>
              <li>
                Mature Student status: 19 years of age or older at the start of
                the program and may be accepted on an individual basis
              </li>
            </ul>
            {checklist?.academic_route && (
              <FieldTable
                rows={[
                  [
                    "Academic Route",
                    academicRouteLabels[checklist.academic_route] ??
                      checklist.academic_route,
                  ],
                  ["Academic Status", checklist.academic_status],
                  ["Notes", checklist.academic_notes],
                ]}
              />
            )}
            {!checklist?.academic_route && (
              <p className="text-sm text-zinc-400 italic">
                Academic route not yet determined.
              </p>
            )}
          </ContractSection>

          {/* 5. English Language Proficiency */}
          <ContractSection title="English Language Proficiency">
            <p className="text-sm text-zinc-700 mb-3">
              Students whose first language is not English must demonstrate
              English language proficiency through one of the following:
            </p>
            <ul className="list-disc pl-6 text-sm text-zinc-700 space-y-1 mb-4">
              <li>IELTS - minimum overall score as required by the program</li>
              <li>TOEFL iBT - minimum overall score as required</li>
              <li>CAEL - minimum score as required</li>
              <li>CELPIP - minimum score as required</li>
              <li>CLB - minimum level as required</li>
              <li>Duolingo English Test - minimum score as required</li>
              <li>PTE Academic - minimum score as required</li>
              <li>NACC Written Exam - passing score</li>
              <li>
                Completion of 2 years of post-secondary education taught in
                English
              </li>
            </ul>
            {checklist?.english_route && (
              <FieldTable
                rows={[
                  [
                    "English Route",
                    englishRouteLabels[checklist.english_route] ??
                      checklist.english_route,
                  ],
                  [
                    "English Status",
                    englishStatusLabels[checklist.english_status] ??
                      checklist.english_status,
                  ],
                  ["Score", checklist.english_score],
                  ["Notes", checklist.english_notes],
                ]}
              />
            )}
            {!checklist?.english_route && (
              <p className="text-sm text-zinc-400 italic">
                English proficiency route not yet determined.
              </p>
            )}
          </ContractSection>

          {/* 6. Fees */}
          <ContractSection title="Fees">
            {feeSchedule ? (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200">
                      <th className="py-2 text-left font-medium text-zinc-700">
                        Fee Type
                      </th>
                      <th className="py-2 text-right font-medium text-zinc-700">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <FeeRow
                      label="Tuition"
                      amount={feeSchedule.tuition_fee}
                    />
                    <FeeRow label="Books" amount={feeSchedule.book_fee} />
                    <FeeRow
                      label="Compulsory Fees"
                      amount={feeSchedule.compulsory_fee}
                    />
                    <FeeRow
                      label="Field Trip Fee"
                      amount={feeSchedule.field_trip_fee}
                    />
                    <FeeRow
                      label="Uniform / Equipment"
                      amount={feeSchedule.uniform_equipment_fee}
                    />
                    <FeeRow
                      label="Professional Exam Fee"
                      amount={feeSchedule.professional_exam_fee}
                    />
                    <FeeRow
                      label="Expendable Supplies"
                      amount={feeSchedule.expendable_supplies_fee}
                    />
                    <FeeRow
                      label="International Fee"
                      amount={feeSchedule.international_fee}
                    />
                    <FeeRow
                      label="Optional Fee"
                      amount={feeSchedule.optional_fee}
                    />
                    {Number(feeSchedule.discount_amount) > 0 && (
                      <FeeRow
                        label="Discount"
                        amount={-Number(feeSchedule.discount_amount)}
                      />
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-zinc-300">
                      <td className="py-2 font-semibold text-zinc-900">
                        Total Fees
                      </td>
                      <td className="py-2 text-right font-semibold text-zinc-900">
                        {formatCurrency(feeSchedule.total_fees)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                <div className="mt-4">
                  <FieldTable
                    rows={[
                      [
                        "Payment Before Signing",
                        formatCurrency(feeSchedule.payment_before_signing),
                      ],
                      [
                        "Payment After Signing",
                        formatCurrency(feeSchedule.payment_after_signing),
                      ],
                      [
                        "Remaining Balance",
                        formatCurrency(feeSchedule.remaining_balance),
                      ],
                    ]}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-400 italic">
                No fee schedule created for this application.
              </p>
            )}
          </ContractSection>

          {/* 7. Payment Schedule */}
          <ContractSection title="Payment Schedule">
            {installments.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="py-2 text-left font-medium text-zinc-700">
                      Installment
                    </th>
                    <th className="py-2 text-left font-medium text-zinc-700">
                      Due Date
                    </th>
                    <th className="py-2 text-right font-medium text-zinc-700">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {installments.map((inst) => (
                    <tr key={inst.id}>
                      <td className="py-2 text-zinc-700">
                        {inst.installment_number}
                      </td>
                      <td className="py-2 text-zinc-700">
                        {formatDate(inst.due_date)}
                      </td>
                      <td className="py-2 text-right text-zinc-700">
                        {formatCurrency(inst.amount_due)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-zinc-300">
                    <td
                      colSpan={2}
                      className="py-2 font-semibold text-zinc-900"
                    >
                      Total
                    </td>
                    <td className="py-2 text-right font-semibold text-zinc-900">
                      {formatCurrency(
                        installments.reduce(
                          (sum, inst) => sum + Number(inst.amount_due),
                          0
                        )
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="text-sm text-zinc-400 italic">
                No payment installments configured.
              </p>
            )}
          </ContractSection>

          {/* 8. Student Agreement / Signature Placeholders */}
          <ContractSection title="Student Agreement">
            <p className="text-sm text-zinc-700 mb-4">
              By signing this contract, I acknowledge that I have read,
              understood, and agree to all the terms and conditions outlined in
              this Student Enrolment Contract, including the fee schedule,
              payment plan, refund policy, and all institutional policies.
            </p>
            <p className="text-sm text-zinc-700 mb-6">
              I confirm that the information I have provided is accurate and
              complete.
            </p>
            <SignatureLine label="Student Signature" />
            <SignatureLine label="Date" />
            <SignatureLine label="Institution Representative Signature" />
            <SignatureLine label="Date" />
          </ContractSection>

          {/* 9. Acknowledgement and Certification */}
          <ContractSection title="Acknowledgement and Certification">
            <p className="text-sm text-zinc-700 mb-3">
              I certify that the information provided in this application and
              enrolment contract is true and complete. I understand that
              providing false or misleading information may result in the
              cancellation of my enrolment and/or dismissal from the program.
            </p>
            <p className="text-sm text-zinc-700 mb-3">
              I acknowledge that I have received, read, and understood the
              institutional policies, including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-sm text-zinc-700 space-y-1 mb-4">
              <li>Student Code of Conduct</li>
              <li>Academic Integrity Policy</li>
              <li>Attendance Policy</li>
              <li>Dispute Resolution and Complaints Policy</li>
              <li>Fee Refund Policy</li>
              <li>Privacy Policy</li>
            </ul>
            <SignatureLine label="Student Initials" />
            <SignatureLine label="Date" />
          </ContractSection>

          {/* 10. Consent to Use of Personal Information */}
          <ContractSection title="Consent to Use of Personal Information">
            <p className="text-sm text-zinc-700 mb-3">
              I consent to the collection, use, and disclosure of my personal
              information by Toronto Academy of Education for the purposes of
              administering my enrolment, academic progress, and credential
              issuance. Personal information may be shared with regulatory
              bodies, practicum placement partners, and government agencies as
              required by law or for the administration of my program.
            </p>
            <p className="text-sm text-zinc-700 mb-4">
              I understand that my personal information will be handled in
              accordance with applicable privacy legislation and the
              institution&apos;s Privacy Policy.
            </p>
            <SignatureLine label="Student Initials" />
            <SignatureLine label="Date" />
          </ContractSection>

          {/* 11. Fee Refund Policy */}
          <ContractSection title="Fee Refund Policy">
            <p className="text-sm text-zinc-700 mb-3">
              The fee refund policy is governed by the Private Career Colleges
              Act, 2005 and the institution&apos;s published refund schedule. Key
              refund provisions include:
            </p>
            <ul className="list-disc pl-6 text-sm text-zinc-700 space-y-1 mb-4">
              <li>
                Full refund of tuition (less registration fee) if the student
                withdraws before the program start date or within the cooling-off
                period as defined by the Act
              </li>
              <li>
                Partial refund based on the percentage of the program completed
                at the time of withdrawal, as set out in the refund schedule
              </li>
              <li>
                No refund is provided after the student has completed more than
                the applicable threshold of the program
              </li>
              <li>
                Registration fees and non-refundable fees are not subject to
                refund
              </li>
            </ul>
            <p className="text-sm text-zinc-700 mb-4">
              Please refer to the institution&apos;s detailed Fee Refund Policy
              document for the complete refund schedule and conditions.
            </p>
            <SignatureLine label="Student Initials" />
            <SignatureLine label="Date" />
          </ContractSection>

          {/* 12. Medical Disclaimer */}
          <ContractSection title="Medical Disclaimer">
            <p className="text-sm text-zinc-700 mb-3">
              I understand that Toronto Academy of Education does not provide
              medical, dental, or extended health benefits. Students are
              responsible for maintaining their own health insurance coverage
              throughout the duration of their program.
            </p>
            <p className="text-sm text-zinc-700 mb-3">
              International students are required to have valid medical
              insurance coverage for the entire duration of their studies in
              Canada.
            </p>
            <p className="text-sm text-zinc-700 mb-4">
              I acknowledge that certain programs may require physical fitness,
              immunizations, or health clearances as a condition of participation
              in practicum placements. I agree to comply with all such
              requirements at my own expense.
            </p>
            <SignatureLine label="Student Initials" />
            <SignatureLine label="Date" />
          </ContractSection>

          {/* 13. Vulnerable Sector Disclaimer */}
          <ContractSection title="Vulnerable Sector Disclaimer">
            <p className="text-sm text-zinc-700 mb-3">
              I understand that certain programs require a Vulnerable Sector
              Check (VSC) or Police Record Check as a condition of practicum
              placement. I acknowledge that:
            </p>
            <ul className="list-disc pl-6 text-sm text-zinc-700 space-y-1 mb-4">
              <li>
                I am responsible for obtaining and paying for the required
                background check
              </li>
              <li>
                An unsatisfactory result may prevent me from completing the
                practicum component of my program, which may affect my ability
                to graduate
              </li>
              <li>
                The institution is not responsible for any inability to complete
                the program due to an unsatisfactory background check result
              </li>
            </ul>
            <SignatureLine label="Student Initials" />
            <SignatureLine label="Date" />
          </ContractSection>

          {/* 14. Practicum Placement Disclaimer and Acknowledgement */}
          <ContractSection title="Practicum Placement Disclaimer and Acknowledgement">
            <p className="text-sm text-zinc-700 mb-3">
              I understand and acknowledge the following regarding practicum
              placements:
            </p>
            <ul className="list-disc pl-6 text-sm text-zinc-700 space-y-1 mb-4">
              <li>
                Practicum placements are arranged by the institution, but
                availability depends on placement partner capacity and
                scheduling
              </li>
              <li>
                I may be required to travel to a practicum location and am
                responsible for my own transportation and related costs
              </li>
              <li>
                Practicum sites may have additional requirements including
                dress codes, health screenings, and professional conduct
                expectations
              </li>
              <li>
                I agree to abide by all rules, regulations, and policies of the
                practicum placement site
              </li>
              <li>
                The institution reserves the right to reassign practicum
                placements if necessary
              </li>
            </ul>
            <SignatureLine label="Student Initials" />
            <SignatureLine label="Date" />
          </ContractSection>

          {/* 15. Student Immigration Status Acknowledgement */}
          <ContractSection title="Student Immigration Status Acknowledgement">
            <p className="text-sm text-zinc-700 mb-3">
              I acknowledge that it is my responsibility to maintain valid
              immigration status in Canada throughout the duration of my program.
              This includes but is not limited to:
            </p>
            <ul className="list-disc pl-6 text-sm text-zinc-700 space-y-1 mb-4">
              <li>
                Maintaining a valid study permit (if applicable) for the
                duration of my program
              </li>
              <li>
                Ensuring my passport remains valid throughout my studies
              </li>
              <li>
                Reporting any changes to my immigration status to the
                institution promptly
              </li>
              <li>
                Complying with all conditions of my study permit and applicable
                immigration regulations
              </li>
            </ul>
            <p className="text-sm text-zinc-700 mb-4">
              I understand that the institution is not responsible for any
              immigration-related issues, including the denial, revocation, or
              expiration of a study permit.
            </p>
            <SignatureLine label="Student Initials" />
            <SignatureLine label="Date" />
          </ContractSection>

          {/* 16. Photography and Videography Consent Form */}
          <ContractSection title="Photography and Videography Consent Form">
            <p className="text-sm text-zinc-700 mb-3">
              I grant Toronto Academy of Education permission to use
              photographs, video recordings, and audio recordings of me taken
              during my participation in institutional programs, events, and
              activities for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-sm text-zinc-700 space-y-1 mb-4">
              <li>Promotional materials (print and digital)</li>
              <li>Social media and website content</li>
              <li>Institutional publications and newsletters</li>
              <li>Recruitment and marketing purposes</li>
            </ul>
            <p className="text-sm text-zinc-700 mb-4">
              I understand that I may withdraw this consent at any time by
              providing written notice to the institution. I understand that any
              materials already produced prior to the withdrawal of consent may
              continue to be used.
            </p>
            <div className="flex gap-8 text-sm text-zinc-700 mb-4">
              <label className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 border border-zinc-400" />
                I consent
              </label>
              <label className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 border border-zinc-400" />
                I do not consent
              </label>
            </div>
            <SignatureLine label="Student Signature" />
            <SignatureLine label="Date" />
          </ContractSection>

          {/* 17. Footer / Contact Area */}
          <Hr />
          <div className="text-center text-sm text-zinc-600 space-y-2">
            <p className="font-semibold">Toronto Academy of Education</p>
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

function ContractSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-base font-semibold text-zinc-900 border-b border-zinc-200 pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function FieldTable({
  rows,
}: {
  rows: [string, string | null | undefined][];
}) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([label, value], idx) => (
          <tr key={idx} className="border-b border-zinc-100 last:border-b-0">
            <td className="py-1.5 pr-4 font-medium text-zinc-600 w-52">
              {label}
            </td>
            <td className="py-1.5 text-zinc-900">
              {value || <span className="text-zinc-400">--</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FeeRow({ label, amount }: { label: string; amount: number }) {
  if (Number(amount) === 0) return null;
  return (
    <tr>
      <td className="py-2 text-zinc-700">{label}</td>
      <td className="py-2 text-right text-zinc-700">
        {formatCurrency(amount)}
      </td>
    </tr>
  );
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div className="mb-4">
      <div className="border-b border-zinc-400 pb-6" />
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function Hr() {
  return <hr className="border-zinc-300" />;
}
