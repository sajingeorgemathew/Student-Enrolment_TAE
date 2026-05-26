# Contract Template Field Map

Blueprint for the Student Enrolment Contract DOCX template.

Source template: `src/templates/contracts/student-enrolment-template.docx`

Reference PDF: `_reference/source-files/Student Enrolment Contract - Chidi Gloria Arowolo.pdf`

Generation code: `src/lib/generate-contract-docx.ts`

Data type: `ContractDetailData` in `src/features/contracts/actions.ts`

---

## Template Technology

- Format: DOCX (Office Open XML)
- Library: docxtemplater with pizzip
- Placeholder syntax: `{placeholder_name}`
- Paragraph loop: enabled
- Linebreaks: enabled
- Null getter: returns empty string for missing values
- Academic/English checkmarks: applied via raw XML manipulation before docxtemplater render

---

## Header and Footer

### Header

- File: `word/header1.xml`
- Content: page number indicator ("Page X of Y")
- Image: `word/media/image3.png` (logo)
- Applied to: every page via single section properties

### Footer

- File: `word/footer1.xml`
- Content: college address, email, phone, fax, website, and registration statement
- Text: "25 Watline Ave, Unit 204, Mississauga, ON L4Z 2Z1 Email: Info@TorontoAcademy.ca | Phone: (905) 565 1091 | Fax: (905) 247 0560 www.TorontoAcademy.ca Toronto Academy of Education is a Registered Career College under the Ontario Career Colleges Act, 2005."
- Images: `word/media/image4.png`, `word/media/image5.jpeg`
- Hyperlink: www.TorontoAcademy.ca

### Preservation Rules

- Header and footer must come from the Word template
- Do not rebuild header/footer with CSS or HTML
- Do not replace header/footer images via Cloudinary or external URL
- The template has one section (`w:sectPr`), so header/footer applies uniformly to all pages
- Do not add extra sections or section breaks unless the template already has them
- Page numbering is handled by Word field codes (PAGE / NUMPAGES) inside the header

---

## Page-by-Page Structure

### Page 1 - Title and Student Information

**Static text:**
- "STUDENT ENROLMENT CONTRACT"
- "This Enrolment Contract is subject to the Ontario Career Colleges Act, 2005 and the regulations made under the Act."
- "The undersigned person hereby enrols as a student of 13899667 CANADA INC. operating as Toronto Academy of Education as of"
- "[*Date: DD/MM/YYYY format to be used] for the following:"
- "STUDENT INFORMATION"
- Field labels: Name of Student, Student No, Mailing Address, City, Province, Postal Code, Phone, Alternative Phone, Permanent Address, Country, Email Address, International Student (Yes/No), Date of Birth (DOB)

**Dynamic fields:**

| Placeholder | Source Table | Source Column | Notes |
|---|---|---|---|
| `{contract_date}` | constant | `CONTRACT_DATE_CONSTANT` | Currently hardcoded to "02/05/2024" - see known issues |
| `{student_full_name}` | students | legal_first_name + legal_middle_name + legal_last_name | Uppercased, space-joined |
| `{student_number}` | students | student_number | |
| `{mailing_address}` | students | mailing_address_line_1 | |
| `{city}` | students | city | |
| `{province}` | students | province | |
| `{postal_code}` | students | postal_code | |
| `{phone}` | students | phone | |
| `{email}` | students | email | |
| `{date_of_birth}` | students | date_of_birth | DD/MM/YYYY format |

**Fields present in template as static underlines (not currently dynamic):**

| Field | Template Appearance | Potential Source |
|---|---|---|
| Alternative Phone | "________________" | students.alternate_phone |
| Permanent Address | "________________" | students.permanent_address_line_1 |
| Permanent City | "__________________" | students.permanent_city |
| Permanent Province | "________" | students.permanent_province |
| Permanent Postal Code | "__________" | students.permanent_postal_code |
| Permanent Country | "__________" | students.permanent_country |
| Permanent Phone | "__________________" | students.phone (permanent) |
| International Student Yes/No | Checkbox area (numeric markers in XML) | students.international_student |

---

### Page 2 - Program Information

**Static text:**
- "PROGRAM INFORMATION"
- Field labels: Name of Program, Commencing on, Expected Completion Date, Credential to be Awarded Upon Successful Completion of the Program, Language of Instruction (English / Other checkboxes), Training Location, Additional Training Location, Location of Practicum-1, Location of Practicum-2, Program length (in hours)

**Dynamic fields:**

| Placeholder | Source Table | Source Column | Notes |
|---|---|---|---|
| `{program_name}` | programs | program_name | First occurrence |
| `{program_start_date}` | batches | start_date | DD/MM/YYYY format |
| `{expected_completion_date}` | batches | expected_end_date | DD/MM/YYYY format |
| `{credential_name}` | programs | credential_name | |
| `{training_location}` | batches | training_location | |
| `{practicum_1_hours}` | programs | practicum_hours | Calculated: round(practicum_hours * 2/3) |
| `{practicum_1_location}` | batches | practicum_1_location | Default: "(To be determined as per availability)" |
| `{practicum_2_hours}` | programs | practicum_hours | Calculated: round(practicum_hours / 3) |
| `{practicum_2_location}` | batches | practicum_2_location | Default: "(To be determined as per availability)" |
| `{program_hours}` | programs | total_hours | |

**Fields present in template as static (not currently dynamic):**

| Field | Template Appearance | Potential Source |
|---|---|---|
| Language of Instruction | Checkbox area (English checked) | Static - always English |
| Additional Training Location | "________________________________________________" | No current source |

---

### Page 3 - Class Schedule, Practicum Schedule, Delivery Method, Academic Requirements

**Static text:**
- "Class Schedule" section header
- Days row: Monday, Tuesday, Wed, Thursday, Friday, Saturday, Sunday
- Timings row, Hours row
- "Practicum Schedule" section header
- "To be determined as per Host Clinical Facility Preceptor's scheduled"
- "Method of program delivery" with checkboxes: in-person, Hybrid, Online
- "Academic Requirements" section header
- Full text of three academic route options (OSSD, foreign credential, mature student)
- "OR" separators between options

**Dynamic fields:**

| Placeholder | Source Table | Source Column | Notes |
|---|---|---|---|
| `{class_time}` | batches | class_time | Repeated in each active day column of Timings row |
| `{hours_per_day}` | batches | class_time | Calculated from class_time string (end - start in hours) |

**Checkmark fields (XML manipulation, not docxtemplater):**

| Field | Source Table | Source Column | Marker Text |
|---|---|---|---|
| Academic: Canadian secondary | admission_checklists | academic_route = "canadian_secondary" | "Grade 12 Ontario Secondary School Diploma" |
| Academic: Foreign credential | admission_checklists | academic_route = "foreign_credential" | "International Student and/or Applicant with foreign credentials" |
| Academic: Mature student | admission_checklists | academic_route = "mature_student" | "Mature student status may be granted" |

**Delivery method field:**
- Currently in template as static text with checkbox-style markers
- Not mapped as a docxtemplater placeholder
- Should be mapped from batches.delivery_method (in_person, hybrid, online)

---

### Page 4 - English Language Proficiency

**Static text:**
- "English Language Proficiency" section header
- "If English is not a student's first language, they must provide proof of English competency. This must be demonstrated through one of the following options:"
- Full text of all 10 English route options with scoring criteria

**Checkmark fields (XML manipulation, not docxtemplater):**

| Field | Source Table | Source Column | DB Value | Template Marker Text |
|---|---|---|---|---|
| IELTS | admission_checklists | english_route | ielts | "IELTS" |
| TOEFL iBT | admission_checklists | english_route | toefl_ibt | "TOEFL" |
| CAEL | admission_checklists | english_route | cael | "CAEL" |
| CELPIP | admission_checklists | english_route | celpip | "Canadian English Language Proficiency Index Program" |
| CLB | admission_checklists | english_route | clb | "Canadian Language Benchmark Tests" |
| Duolingo | admission_checklists | english_route | duolingo | "Duolingo English Test" |
| PTE Academic | admission_checklists | english_route | pte_academic | "Pearson PTE Academic" |
| NACC Written Exam | admission_checklists | english_route | nacc_written_exam | "NACC Written Entrance Exam" |
| 2yr Canadian post-secondary | admission_checklists | english_route | two_years_canadian_postsecondary_english | "post-secondary study in English at a Canadian institution" |
| 2yr International post-secondary | admission_checklists | english_route | two_years_international_postsecondary_english | "post-secondary study in English at an institution outside of Canada" |

**Note:** The "not_required" english_route value exists in the DB schema but has no matching marker text in the template. When english_route is "not_required", no option should be checked.

**Page break:** The code inserts a `<w:pageBreakBefore/>` on the "English Language Proficiency" heading paragraph to force it to start on a new page.

---

### Page 5 - Fees

**Static text:**
- "Fees" section header
- Fee line labels: Tuition fee, Book fees, Compulsory fees (Itemized), Field Trips, Uniform & equipment fees, Professional Exam fees, Expendable supplies, International fees, Optional fees
- "Total fees CAN $"

**Dynamic fields:**

| Placeholder | Source Table | Source Column | Format |
|---|---|---|---|
| `{tuition_fee}` | fee_schedules | tuition_fee | Currency with underline padding |
| `{book_fee}` | fee_schedules | book_fee | Currency with underline padding |
| `{compulsory_fee}` | fee_schedules | compulsory_fee | Currency with underline padding |
| `{field_trip_fee}` | fee_schedules | field_trip_fee | Currency with underline padding |
| `{uniform_equipment_fee}` | fee_schedules | uniform_equipment_fee | Currency with underline padding |
| `{professional_exam_fee}` | fee_schedules | professional_exam_fee | Currency with underline padding |
| `{expendable_supplies_fee}` | fee_schedules | expendable_supplies_fee | Currency with underline padding |
| `{international_fee}` | fee_schedules | international_fee | Currency with underline padding |
| `{optional_fee}` | fee_schedules | optional_fee | Currency with underline padding |
| `{total_fees}` | fee_schedules | total_fees | Currency with underline padding |

**Currency formatting:** `formatCurrencyUnderlined` outputs `___amount___________` with padding underscores. Zero or null values produce a blank underline `___________________`.

---

### Page 6 - Payment Schedule and Student Undertaking

**Static text:**
- "Payment Schedule" section header
- "For programs approved for student loan purposes, the Payment Schedule should note that funds received from the Canada-Ontario Integrated Student Loan and Grant Funding (Ontario Student Assistance Program) or any other financial aid will be applied as payments. Verification of receipt of payment must be attached to the original contract."
- "1. Payments prior to signing contract (if any): CAN$="
- "2. Payments after signing contract: CAN$="
- Installment table headers: Instalment, Due Date, Amount due: CAN$, Notes
- Installment rows 1-5 (row 6 exists as empty)
- "3. Payments (installments) -"
- "Total payments (1 + 2): CAN$="
- "The undersigned student hereby undertakes and agrees to pay, or see to payment of, the fees indicated above in accordance with the terms of this Enrolment Contract."
- "(Name of Student):" and "Date:" and "(Signature of Student):"

**Dynamic fields:**

| Placeholder | Source Table | Source Column | Format |
|---|---|---|---|
| `{payment_before_signing}` | fee_schedules | payment_before_signing | Plain currency |
| `{payment_after_signing}` | fee_schedules | payment_after_signing | Plain currency or "NIL" if zero |
| `{installment_1_due_date}` | payment_installments | due_date (where installment_number=1) | DD/MM/YYYY |
| `{installment_1_amount}` | payment_installments | amount_due (where installment_number=1) | Plain currency |
| `{installment_2_due_date}` | payment_installments | due_date (where installment_number=2) | DD/MM/YYYY |
| `{installment_2_amount}` | payment_installments | amount_due (where installment_number=2) | Plain currency |
| `{installment_3_due_date}` | payment_installments | due_date (where installment_number=3) | DD/MM/YYYY |
| `{installment_3_amount}` | payment_installments | amount_due (where installment_number=3) | Plain currency |
| `{installment_4_due_date}` | payment_installments | due_date (where installment_number=4) | DD/MM/YYYY |
| `{installment_4_amount}` | payment_installments | amount_due (where installment_number=4) | Plain currency |
| `{installment_5_due_date}` | payment_installments | due_date (where installment_number=5) | DD/MM/YYYY |
| `{installment_5_amount}` | payment_installments | amount_due (where installment_number=5) | Plain currency |
| `{installment_total}` | payment_installments | sum of all amount_due | Plain currency |
| `{total_payments}` | fee_schedules | total_fees | Plain currency |
| `{student_full_name}` | students | (computed, see page 1) | Second occurrence |

**Signature fields on this page:**
- Student signature line: blank (for external signing)
- Student date: blank (for external signing)

---

### Page 7 - Acknowledgement and Certification

**Static text:**
- "Acknowledgement and Certification"
- "I, [name], acknowledge that I have received a copy of:"
- Checklist items with checkboxes (all pre-checked in template):
  - The Consent to Use of Personal Information
  - The Payment Schedule
  - The College's Fee Refund Policy
  - The Statement of Students' Rights and Responsibilities Issued by the Superintendent of Career Colleges
  - The College's Student Complaint Procedure
  - The College's Policy Relating to the Expulsion of Students
  - The College's Sexual Violence Policy
- "I certify that I have read and understood this Enrolment Contract."
- Employment disclaimer paragraph
- Fee payment and cancellation terms paragraph referencing O. Reg. 415/06
- "The undersigned student is entitled to a copy of the signed contract immediately after it is signed."
- College agreement paragraph: "Toronto Academy of Education agrees to supply program to the above-named student upon the terms herein mentioned."
- "Toronto Academy of Education may cancel this Enrolment Contract if the above-named student does not meet the admission requirements of [program] before the program begins."

**Dynamic fields:**

| Placeholder | Source Table | Source Column | Notes |
|---|---|---|---|
| `{student_full_name}` | students | (computed) | Third occurrence - in acknowledgement intro |
| `{program_name}` | programs | program_name | Second occurrence - in cancellation clause |

**Signature fields on this page:**
- Student signature line (acknowledgement): blank
- Student date (acknowledgement): blank
- Student signature line (contract terms): blank
- Student date (contract terms): blank
- Admission Officer/Registrar/Agent signature line: blank
- Admission Officer/Registrar/Agent date: blank

---

### Page 8 - Consent to Use of Personal Information

**Static text:**
- "Consent to Use of Personal Information"
- Career colleges registration paragraph
- "I, [name], allow 13899667 CANADA INC. o/a Toronto Academy of Education to give my name, address, telephone number, e-mail address and other contact information to the Superintendent of Private Career Colleges for the purposes checked below:"
- Two consent checkboxes (pre-checked):
  - Rights under the Ontario Career Colleges Act, 2005
  - Performance objectives determination
- Withdrawal of consent paragraph referencing "Chief Operating Officer at 25 Watline Avenue, Unit 204 Mississauga, Ontario, L4Z 2Z1"

**Dynamic fields:**

| Placeholder | Source Table | Source Column | Notes |
|---|---|---|---|
| `{student_full_name}` | students | (computed) | Fourth occurrence - consent intro |
| `{student_full_name}` | students | (computed) | Fifth occurrence - printed name below |

**Signature fields on this page:**
- Student name (printed): auto-filled from student_full_name
- Student signature line: blank
- Student date: blank

---

### Pages 9-10 - Fee Refund Policy

**Static text (entirely):**
- "Fee Refund Policy as Prescribed under s. 24 (2) to 33 of O. Reg. 415/06"
- Section 24(2) definitions: Earned fees, Program mid-point, Service fee
- Section 25: Full refunds (10 numbered circumstances)
- Section 26: Full refunds minus service fee (4 numbered circumstances)
- Section 27(1): Partial refunds (2 lettered circumstances)

**Dynamic fields:** None

This section is entirely regulatory static text. No placeholders appear in these two pages.

---

### Page 11 - Medical Disclaimer

**Static text:**
- "Medical Disclaimer"
- Medical report requirement paragraphs
- NACC PSW Policy quotation (immunization requirements, 45-day deadline)
- "No students may participate in any Practicum Placement hours prior to submitting a completed and satisfactory immunization & medical report."
- Acknowledgement paragraph with risk items (3 numbered)

**Dynamic fields:**

| Placeholder | Source Table | Source Column | Notes |
|---|---|---|---|
| `{program_name}` | programs | program_name | Third occurrence - "According to [program] Policy" |
| `{student_full_name}` | students | (computed) | Sixth occurrence - "I, [name], acknowledge" |

**Signature fields on this page:**
- Student signature line: blank
- Student date: blank

---

### Page 12 - Vulnerable Sector Disclaimer

**Static text:**
- "Vulnerable Sector Disclaimer"
- VSS requirement paragraphs (45-day deadline, 10-12 weeks processing)
- VSS scope description (Ontario Provincial Police database)
- Maintenance requirement paragraph
- Acknowledgement paragraph with risk items (3 numbered)
- "Please contact your local police authorities to complete this process."

**Dynamic fields:**

| Placeholder | Source Table | Source Column | Notes |
|---|---|---|---|
| `{student_full_name}` | students | (computed) | Seventh occurrence - "I, [name], acknowledge" |

**Signature fields on this page:**
- Student signature line: blank
- Student date: blank

---

### Pages 13-14 - Practicum Placement Disclaimer and Acknowledgement

**Static text:**
- "PRACTICUM PLACEMENT DISCLAIMER & ACKNOWLEDGEMENT"
- "Dear Student,"
- Enrollment context paragraph referencing MCU and NACC
- "Practicum Placement Expectations" subheading
- "1. Student Conduct" - expectations list
- "2. Placement Nature" - paid/unpaid disclaimer
- "3. Placement Requirements" - eligibility list with documentation requirements
- "4. College's Role" - WSIB and liability insurance, instructor involvement
- "Student Acknowledgment" - signing context paragraph

**Dynamic fields:**

| Placeholder | Source Table | Source Column | Notes |
|---|---|---|---|
| `{program_name}` | programs | program_name | Fourth occurrence - enrollment context |
| `{total_practicum_hours}` | programs | practicum_hours | Total hours for placement |
| `{practicum_1_hours}` | programs | practicum_hours | Calculated: round(practicum_hours * 2/3) - LTC hours |
| `{practicum_2_hours}` | programs | practicum_hours | Calculated: round(practicum_hours / 3) - Community hours |
| `{student_full_name}` | students | (computed) | Eighth occurrence - "Student Name:" |

**Signature fields on these pages:**
- Student signature line: blank
- Student date: blank
- College Representative name: blank (underline)
- College Representative date: blank (underline)

---

### Page 14 (continued) / Page 15 - Student Immigration Status Acknowledgement

**Static text:**
- "STUDENT IMMIGRATION STATUS ACKNOWLEDGEMENT"
- "This form must be reviewed and signed by all students enrolling in programs at Toronto Academy of Education."
- Field labels: Student Name, Program Name, Start Date, End Date
- "Acknowledgment of Immigration Status Responsibility:"
- Four numbered sections:
  1. Maintenance of Legal Immigration Status
  2. Change of Immigration Status (with sub-list: Study permit, Work permit, Visitor status, Permanent residency)
  3. College's Limitation of Liability
  4. Government Compliance (IRCC reference)
- Signing confirmation paragraph

**Dynamic fields:**

| Placeholder | Source Table | Source Column | Notes |
|---|---|---|---|
| `{student_full_name}` | students | (computed) | Ninth occurrence - "Student Name:" |
| `{program_name}` | programs | program_name | Fifth occurrence |
| `{program_start_date}` | batches | start_date | DD/MM/YYYY format - second occurrence |
| `{expected_completion_date}` | batches | expected_end_date | DD/MM/YYYY format - second occurrence |

**Signature fields on this page:**
- Student signature line: blank
- Student date: blank
- College Representative name: blank (underline)
- College Representative date: blank (underline)

---

### Page 15 - Photography and Videography Consent Form

**Static text:**
- "Photography and Videography Consent Form"
- "Consent for Use of Likeness"
- Five bullet points covering consent, rights grant, property, waiver, and release
- Opt-out notification paragraph

**Dynamic fields:**

| Placeholder | Source Table | Source Column | Notes |
|---|---|---|---|
| `{student_full_name}` | students | (computed) | Tenth occurrence - "Name:" |

**Signature fields on this page:**
- Student signature line: blank
- Student date: blank

---

## Repeated Fields Summary

| Placeholder | Total Occurrences | Pages |
|---|---|---|
| `{student_full_name}` | 10 | 1, 6, 7, 8 (x2), 11, 12, 13-14, 14-15, 15 |
| `{program_name}` | 5 | 2, 7, 11, 13, 14-15 |
| `{program_start_date}` | 2 | 2, 14-15 |
| `{expected_completion_date}` | 2 | 2, 14-15 |
| `{class_time}` | 5 | 3 (repeated per active day column) |
| `{hours_per_day}` | 5 | 3 (repeated per active day column) |
| `{practicum_1_hours}` | 2 | 2, 13-14 |
| `{practicum_2_hours}` | 2 | 2, 13-14 |
| `{total_practicum_hours}` | 1 | 13-14 |

All other placeholders appear exactly once.

---

## Academic Requirement Mapping

Source: `admission_checklists.academic_route`

| DB Value | Template Marker Text | Checkmark Behavior |
|---|---|---|
| `canadian_secondary` | "Grade 12 Ontario Secondary School Diploma" | Wingdings checkmark added, bold applied |
| `foreign_credential` | "International Student and/or Applicant with foreign credentials" | Wingdings checkmark added, bold applied |
| `mature_student` | "Mature student status may be granted" | Wingdings checkmark added, bold applied |
| null | (none of the above) | All three options appear without checkmarks |

**Rules:**
- Only the selected option gets a checkmark
- Existing Wingdings symbols are removed from all three options before applying the selected checkmark
- Existing bold formatting is removed from all three options and reapplied only to the selected option
- Existing numbering properties (`w:numPr`) are removed
- Do not hardcode any specific route - the value comes from the admin checklist

---

## English Requirement Mapping

Source: `admission_checklists.english_route`

| DB Value | Template Marker Text |
|---|---|
| `ielts` | "IELTS" |
| `toefl_ibt` | "TOEFL" |
| `cael` | "CAEL" |
| `celpip` | "Canadian English Language Proficiency Index Program" |
| `clb` | "Canadian Language Benchmark Tests" |
| `duolingo` | "Duolingo English Test" |
| `pte_academic` | "Pearson PTE Academic" |
| `nacc_written_exam` | "NACC Written Entrance Exam" |
| `two_years_canadian_postsecondary_english` | "post-secondary study in English at a Canadian institution" |
| `two_years_international_postsecondary_english` | "post-secondary study in English at an institution outside of Canada" |
| `not_required` | No matching marker - no option checked |
| null | No option checked |

**Rules:**
- Only the selected option gets a Wingdings checkmark and bold formatting
- Existing Wingdings symbols are removed from all options
- Existing bold formatting is removed from all options
- Search is bounded between the "English Language Proficiency" heading and the "Fees" heading to avoid false matches
- A page break is inserted before the "English Language Proficiency" heading
- Do not hardcode any specific route - the value comes from the admin checklist

---

## Program and Batch Mapping

### Program fields

| Template Field | Source | Column |
|---|---|---|
| Program name | programs | program_name |
| Credential | programs | credential_name |
| Total hours | programs | total_hours |
| Theory hours | programs | theory_hours |
| Practicum hours | programs | practicum_hours |
| Practicum 1 hours | programs | round(practicum_hours * 2/3) |
| Practicum 2 hours | programs | round(practicum_hours / 3) |

### Batch fields

| Template Field | Source | Column |
|---|---|---|
| Program start date | batches | start_date |
| Expected completion date | batches | expected_end_date |
| Training location | batches | training_location |
| Practicum 1 location | batches | practicum_1_location |
| Practicum 2 location | batches | practicum_2_location |
| Class days | batches | class_days |
| Class time | batches | class_time |
| Delivery method | batches | delivery_method |

---

## Class Schedule Mapping

The class schedule is a 7-column table (Monday through Sunday).

### Current behavior

- The template has "8:00AM-2:00PM" in Mon-Fri timing cells and "6" in Mon-Fri hours cells
- Saturday and Sunday cells are blank in the template
- During generation, `getScheduleForBatch` determines timing and hours from:
  1. `batches.class_time` (parsed and formatted to display format)
  2. Batch name preset detection ("morning" or "evening" in batch name)
  3. Returns null for unknown batches (timing cells cleared to blank)
- `formatClassTimeDisplay` converts raw time (e.g. "4:30PM-10:30PM") to display format ("4:30 PM to 10:30 PM")
- Hours are calculated by parsing start/end times from class_time

### Display format

- Morning: "8:00 AM to 2:00 PM"
- Evening: "4:30 PM to 10:30 PM"
- Format rule: "H:MM AM to H:MM PM" with spaces around AM/PM and "to" separator

### Known limitation

The DOCX export fills all Mon-Fri cells with the same timing. If `class_days` specified fewer weekdays (e.g. Mon-Wed-Fri only), inactive weekday cells are not individually cleared. The HTML preview correctly uses batch.class_days to filter active days.

---

## Practicum Schedule Mapping

The practicum schedule table has the same 7-column structure as the class schedule.

### Current behavior

- All cells are empty in the template
- The static text above the table reads: "To be determined as per Host Clinical Facility Preceptor's scheduled"
- Practicum scheduling is not known at contract generation time

### Rules

- Leave all day/timing/hours cells blank
- The practicum location fields on page 2 indicate where practicum will occur
- Default text for unknown locations: "(To be determined as per availability)"

---

## Fee and Payment Schedule Mapping

### Fee table

Source: `fee_schedules` table (most recent for the application)

All fee amounts use `formatCurrencyUnderlined`: underscores pad the value to a fixed visual width. Zero or null amounts render as a blank underline.

| Fee Line | Column |
|---|---|
| Tuition fee | tuition_fee |
| Book fees | book_fee |
| Compulsory fees | compulsory_fee |
| Field Trips | field_trip_fee |
| Uniform & equipment fees | uniform_equipment_fee |
| Professional Exam fees | professional_exam_fee |
| Expendable supplies | expendable_supplies_fee |
| International fees | international_fee |
| Optional fees | optional_fee |
| Total fees | total_fees |

### Payment schedule

| Field | Column | Format |
|---|---|---|
| Payment before signing | payment_before_signing | Plain currency |
| Payment after signing | payment_after_signing | Plain currency or "NIL" if zero |
| Installment total | sum(payment_installments.amount_due) | Plain currency |
| Total payments | total_fees | Plain currency |

### Installment table

Source: `payment_installments` table, ordered by installment_number

- Template supports up to 5 installment rows (MAX_TEMPLATE_INSTALLMENTS = 5)
- Row 6 exists in the template as an empty placeholder row
- Each installment has: due_date (DD/MM/YYYY), amount_due (plain currency)
- Unused installment rows render as empty strings
- The "Notes" column exists in the template table header but installment notes are not currently mapped to the DOCX template

### Not currently mapped to DOCX

| Field | Source | Notes |
|---|---|---|
| discount_amount | fee_schedules.discount_amount | Shown in HTML preview but not in DOCX |
| installment notes | payment_installments.notes | Column header exists but values not mapped |

---

## Signature and Date Field Rules

### Inventory of all signature/date locations

| Page | Section | Signature For | Date For | Behavior |
|---|---|---|---|---|
| 6 | Student Undertaking | Student | Student | Both blank for external signing |
| 7 | Acknowledgement (first) | Student | Student | Both blank for external signing |
| 7 | Contract Terms (second) | Student | Student | Both blank for external signing |
| 7 | Officer/Registrar/Agent | College representative | College representative | Signature blank, date filled with generation date |
| 8 | Consent to Personal Info | Student | Student | Both blank for external signing |
| 11 | Medical Disclaimer | Student | Student | Both blank for external signing |
| 12 | VSS Disclaimer | Student | Student | Both blank for external signing |
| 13-14 | Practicum Acknowledgement | Student | Student | Both blank for external signing |
| 13-14 | Practicum Acknowledgement | College Representative | College Representative | Signature blank, date filled with generation date |
| 14-15 | Immigration Acknowledgement | Student | Student | Both blank for external signing |
| 14-15 | Immigration Acknowledgement | College Representative | College Representative | Signature blank, date filled with generation date |
| 15 | Photo/Video Consent | Student | Student | Both blank for external signing |

### Rules

- All student signature and date fields remain blank in the generated DOCX
- Student signature/date fields are intended for external signing (print-and-sign, or future digital signing workflow)
- College Representative signature fields remain blank in the generated DOCX
- College Representative date fields are filled with the generation date (DD/MM/YYYY) on pages 7, 13-14, and 14-15
- The `{contract_date}` on page 1 is the contract effective date, not a signature date
- Signature lines in the template are preserved as underline runs in the Word XML

---

## College Representative and Admin Field Rules

| Location | Field | Current State | Rule |
|---|---|---|---|
| Page 7 | Signature of Admission Officer, Registrar, Agent | Blank underline | Leave blank for manual signing |
| Page 7 | Date (officer) | Filled | Generation date in DD/MM/YYYY format |
| Pages 13-14 | College Representative | Blank underline "__________________ __" | Leave blank |
| Pages 13-14 | College Representative Date | Filled | Generation date in DD/MM/YYYY format |
| Pages 14-15 | College Representative | Blank underline "_____________________ __" | Leave blank |
| Pages 14-15 | College Representative Date | Filled | Generation date in DD/MM/YYYY format |

There is no `college_representative_name` placeholder in the current template. If a future ticket adds this, the source would be the `profiles` table (generated_by user's full_name).

---

## Overflow Rules

### student_full_name

- Risk: long names with middle name (3+ words, legal names can exceed 40 characters)
- Current behavior: uppercased, no truncation
- Rule: stay one line
- If long: shrink font if over 40 characters to prevent line wrap in the "Name of Student:" field
- If missing: show "________________________" (24 underscores)
- Appears 10 times - overflow rule must apply to the first occurrence on page 1; later occurrences in body paragraphs are less constrained

### mailing_address

- Risk: long address lines (apartment numbers, suite designators)
- Current behavior: only mailing_address_line_1 is mapped; line_2 is not included
- Rule: stay one line
- If long: wrap if safe (address lines in Word tables can tolerate wrapping)
- If missing: show "________________"
- Future: consider concatenating address_line_1 and address_line_2

### email

- Risk: long email addresses (institutional or corporate addresses can exceed 40 characters)
- Current behavior: no truncation
- Rule: stay one line
- If long: shrink font if over 35 characters
- If missing: show "________________________"

### program_name

- Risk: official program names can be long (e.g., "NACC Personal Support Worker (PSW) DE 2022" is 43 characters)
- Current behavior: no truncation
- Rule: stay one line where used as a field value; wrap if safe in body paragraph contexts
- If long: shrink font if over 50 characters in field-value positions
- If missing: show "________________________"

### training_location

- Risk: full address with unit number can be long
- Current behavior: no truncation
- Rule: wrap if safe
- If long: allow line wrap since the field has a full line width available
- If missing: show "________________________"

### practicum_locations (practicum_1_location, practicum_2_location)

- Risk: facility names with addresses
- Current behavior: default to "(To be determined as per availability)"
- Rule: wrap if safe
- If long: allow line wrap
- If missing: preserve default text "(To be determined as per availability)"

### payment_notes (installment notes)

- Risk: free-text notes in payment schedule table cells
- Current behavior: not currently mapped to DOCX template
- Rule: wrap if safe within table cell
- If long: allow wrap within the Notes column
- If missing: leave cell empty

### General overflow principles

- Never truncate legal names, addresses, or financial values
- Prefer wrap over truncation for paragraph-context fields
- Use font shrinking only for fields on constrained single lines (form-style fields like "Name of Student: ___")
- Preserve underline style for all missing/empty fields to maintain form appearance
- Do not use text overflow hidden or clipping

---

## Known Mismatch List - Current Word Export

### 1. Contract date is hardcoded

- Location: page 1, `{contract_date}`
- Problem: `CONTRACT_DATE_CONSTANT` is set to "02/05/2024" for all contracts
- Expected: should use the actual contract generation date or a configurable effective date
- Impact: every contract shows the same date regardless of when it was generated

### 2. Academic route marker sometimes incorrect

- Location: page 3, academic requirements section
- Problem: Wingdings checkmark may not appear, or may appear on wrong option, if XML structure varies between template versions
- Root cause: XML text matching depends on exact marker text; XML tag splitting can cause partial matches
- Impact: wrong academic route may be checked or no route checked

### 3. Unwanted round marker/shape in academic section

- Location: page 3, academic requirements section
- Problem: an unidentified shape/marker (`{28A0092B-C50C-407E-A947-70E740481C1C}`) appears in the template XML between program info and academic sections
- Root cause: this is a Word drawing object or legacy shape embedded in the template
- Impact: may render as an unwanted visual element in the generated DOCX

### 4. English route marker sometimes incorrect

- Location: page 4, English proficiency section
- Problem: similar to academic route - XML text matching can fail if marker text is split across XML runs
- Root cause: docxtemplater does not handle checkmarks; the code uses raw XML string matching which is fragile
- Impact: wrong English route may be checked or no route checked

### 5. Batch timing not reflecting selected batch

- Location: page 3, class schedule table
- Problem: class_time is placed in all 7 day columns regardless of which days are active
- Root cause: the DOCX template has `{class_time}` in every column; docxtemplater replaces all instances with the same value
- Expected: only active days (from batches.class_days) should show timing
- Impact: schedule appears to show classes every day of the week

### 6. Fee lines can lose original underline style

- Location: page 5, fees section
- Problem: `formatCurrencyUnderlined` uses underscore characters instead of Word underline formatting
- Root cause: docxtemplater replaces text, not formatting; the original Word underline run properties may be lost
- Impact: fee values have underscore characters instead of clean underlines, which looks different from the original template

### 7. Delivery method not dynamically mapped in DOCX

- Location: page 3
- Problem: the delivery method checkboxes (in-person, Hybrid, Online) are not controlled by a placeholder
- Root cause: these are static text with numeric markers in the template XML, not mapped to docxtemplater
- Expected: should reflect batches.delivery_method value
- Impact: all three options appear unchecked or in template default state

### 8. International student marker not dynamically mapped in DOCX

- Location: page 1
- Problem: the International Student Yes/No checkboxes are not controlled by a placeholder
- Root cause: these are static text with numeric markers in the template XML
- Expected: should reflect students.international_student value
- Impact: checkboxes appear in template default state

### 9. Student/college signature areas need consistent underline preservation

- Location: all signature pages
- Problem: signature underlines may vary in width or style between pages
- Root cause: template formatting inconsistency
- Impact: visual inconsistency in printed contracts

### 10. College administrator fields need clear mapping

- Location: pages 7, 13-14, 14-15
- Problem: no placeholder exists for college representative name or date
- Root cause: not yet implemented
- Expected: may need a `{college_representative_name}` and `{college_representative_date}` placeholder
- Impact: all college representative fields are blank

### 11. Generated date rules not defined

- Problem: no clear rule for when to use contract generation timestamp vs. a manually set date
- `contract_date` is hardcoded to a constant instead of using actual generation date
- `contract_generated_at` is saved to the applications table but not used in the template
- Expected: define source of truth for the contract date field

### 12. Permanent address fields not mapped

- Location: page 1
- Problem: permanent address fields (address, city, province, postal code, country) are static underlines
- Source data exists: students.permanent_address_line_1, permanent_city, permanent_province, permanent_postal_code, permanent_country
- Impact: permanent address section always appears blank even when data exists

### 13. Alternate phone not mapped

- Location: page 1
- Problem: "Alternative Phone" shows static underline "________________"
- Source data exists: students.alternate_phone
- Impact: alternate phone always appears blank

### 14. Mailing address line 2 not mapped

- Location: page 1
- Problem: only mailing_address_line_1 is used
- Source data exists: students.mailing_address_line_2
- Impact: apartment/unit numbers on line 2 are not included

### 15. Country field not mapped

- Location: page 1
- Problem: "Country" shows static underline
- Source data exists: students.country (default 'Canada')
- Impact: country always appears blank in DOCX (shown correctly in HTML preview)

### 16. Language of Instruction not dynamically mapped

- Location: page 2
- Problem: English/Other checkboxes are static in the template
- Current: always English (which is correct for current programs)
- Impact: none currently, but would need mapping if non-English programs are added

### 17. Additional Training Location not mapped

- Location: page 2
- Problem: shows static underline
- No source column currently exists in the batches table
- Impact: always blank

---

## Future Ticket Breakdown

### CONTRACT-04B - Fix Contract Date and Missing Student Fields

Scope:
- Replace `CONTRACT_DATE_CONSTANT` with actual generation date or configurable effective date
- Add `{alternate_phone}` placeholder mapped to students.alternate_phone
- Add `{mailing_address_line_2}` support (concatenate with line 1 or add separate placeholder)
- Add permanent address placeholders: `{permanent_address}`, `{permanent_city}`, `{permanent_province}`, `{permanent_postal_code}`, `{permanent_country}`
- Add `{country}` placeholder for mailing address country
- Define and implement the `{contract_date}` source of truth rule

### CONTRACT-04C - Fix Academic/English Checkmarks and Delivery Method

Scope:
- Refactor XML checkmark logic to handle text split across runs
- Remove the unwanted shape/marker (`{28A0092B-...}`) from the template
- Add delivery method dynamic mapping (in-person, Hybrid, Online)
- Add international student Yes/No dynamic mapping
- Add Language of Instruction dynamic mapping (if needed)
- Improve reliability of marker text search in raw XML
- Add unit tests for checkmark logic with various XML structures

### CONTRACT-04D - Fix Class Schedule Day Filtering and Fee Formatting

Scope:
- Fix class schedule to only show timing/hours on active days
- Options: (a) modify template to use conditional placeholders per day, (b) use raw XML manipulation to clear inactive day cells, or (c) use docxtemplater loop/condition syntax
- Fix fee value formatting to preserve Word underline style instead of using underscore characters
- Map installment notes to the Notes column in the payment table
- Map discount_amount to the DOCX if non-zero
- Implement overflow font shrinking for long values in constrained fields

### CONTRACT-04E - Add College Representative and Signature Placeholders

Scope:
- Add `{college_representative_name}` placeholder
- Add `{college_representative_date}` placeholder
- Define rules: auto-fill from generating admin's profile, or leave blank for manual signing
- Ensure consistent signature line widths across all pages
- Add signature field inventory tracking for future digital signing integration
- Verify all blank signature/date lines preserve underline formatting

### CONTRACT-04F - Template Cleanup and Validation

Scope:
- Remove or clean up the embedded shape/marker object
- Standardize all underline widths for signature and blank fields
- Add contract generation validation: check that all required fields are present before generating
- Add a template version marker (metadata in custom XML part or document properties)
- Add automated tests: generate a contract from test data, extract text, verify all placeholders replaced
- Document the complete placeholder-to-source mapping as a machine-readable JSON schema for future validation

---

## Appendix A - Complete Placeholder Inventory

All placeholders extracted from the DOCX template (`src/templates/contracts/student-enrolment-template.docx`):

| # | Placeholder | Mapped | Source |
|---|---|---|---|
| 1 | `{contract_date}` | Yes | Hardcoded constant (should be generation date) |
| 2 | `{student_full_name}` | Yes | students: legal_first + middle + last, uppercased |
| 3 | `{student_number}` | Yes | students.student_number |
| 4 | `{mailing_address}` | Yes | students.mailing_address_line_1 |
| 5 | `{city}` | Yes | students.city |
| 6 | `{province}` | Yes | students.province |
| 7 | `{postal_code}` | Yes | students.postal_code |
| 8 | `{phone}` | Yes | students.phone |
| 9 | `{email}` | Yes | students.email |
| 10 | `{date_of_birth}` | Yes | students.date_of_birth |
| 11 | `{program_name}` | Yes | programs.program_name |
| 12 | `{program_start_date}` | Yes | batches.start_date |
| 13 | `{expected_completion_date}` | Yes | batches.expected_end_date |
| 14 | `{credential_name}` | Yes | programs.credential_name |
| 15 | `{training_location}` | Yes | batches.training_location |
| 16 | `{practicum_1_hours}` | Yes | round(programs.practicum_hours * 2/3) |
| 17 | `{practicum_1_location}` | Yes | batches.practicum_1_location |
| 18 | `{practicum_2_hours}` | Yes | round(programs.practicum_hours / 3) |
| 19 | `{practicum_2_location}` | Yes | batches.practicum_2_location |
| 20 | `{program_hours}` | Yes | programs.total_hours |
| 21 | `{class_time}` | Yes | batches.class_time |
| 22 | `{hours_per_day}` | Yes | Calculated from batches.class_time |
| 23 | `{tuition_fee}` | Yes | fee_schedules.tuition_fee |
| 24 | `{book_fee}` | Yes | fee_schedules.book_fee |
| 25 | `{compulsory_fee}` | Yes | fee_schedules.compulsory_fee |
| 26 | `{field_trip_fee}` | Yes | fee_schedules.field_trip_fee |
| 27 | `{uniform_equipment_fee}` | Yes | fee_schedules.uniform_equipment_fee |
| 28 | `{professional_exam_fee}` | Yes | fee_schedules.professional_exam_fee |
| 29 | `{expendable_supplies_fee}` | Yes | fee_schedules.expendable_supplies_fee |
| 30 | `{international_fee}` | Yes | fee_schedules.international_fee |
| 31 | `{optional_fee}` | Yes | fee_schedules.optional_fee |
| 32 | `{total_fees}` | Yes | fee_schedules.total_fees |
| 33 | `{payment_before_signing}` | Yes | fee_schedules.payment_before_signing |
| 34 | `{payment_after_signing}` | Yes | fee_schedules.payment_after_signing |
| 35 | `{installment_1_due_date}` | Yes | payment_installments (number=1).due_date |
| 36 | `{installment_1_amount}` | Yes | payment_installments (number=1).amount_due |
| 37 | `{installment_2_due_date}` | Yes | payment_installments (number=2).due_date |
| 38 | `{installment_2_amount}` | Yes | payment_installments (number=2).amount_due |
| 39 | `{installment_3_due_date}` | Yes | payment_installments (number=3).due_date |
| 40 | `{installment_3_amount}` | Yes | payment_installments (number=3).amount_due |
| 41 | `{installment_4_due_date}` | Yes | payment_installments (number=4).due_date |
| 42 | `{installment_4_amount}` | Yes | payment_installments (number=4).amount_due |
| 43 | `{installment_5_due_date}` | Yes | payment_installments (number=5).due_date |
| 44 | `{installment_5_amount}` | Yes | payment_installments (number=5).amount_due |
| 45 | `{installment_total}` | Yes | sum(payment_installments.amount_due) |
| 46 | `{total_payments}` | Yes | fee_schedules.total_fees |
| 47 | `{total_practicum_hours}` | Yes | programs.practicum_hours |

Non-placeholder dynamic fields (XML manipulation):
- 3 academic route checkmarks
- 10 English route checkmarks

Embedded object (not a placeholder):
- `{28A0092B-C50C-407E-A947-70E740481C1C}` - Word embedded shape/drawing object

---

## Appendix B - Database Tables Referenced

| Table | Used For |
|---|---|
| students | Student personal info, contact details, immigration status |
| programs | Program name, credential, hours (total, theory, practicum) |
| batches | Schedule dates, class timing, locations, delivery method |
| applications | Application status, linking table |
| admission_checklists | Academic route, English route (checkmark selection) |
| fee_schedules | All fee amounts, payment summary |
| payment_installments | Individual installment due dates and amounts |
| profiles | Admin/generated_by (not currently used in template) |
| contracts | Contract record tracking (not used for template data) |
