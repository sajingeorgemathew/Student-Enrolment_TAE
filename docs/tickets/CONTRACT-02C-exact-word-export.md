# CONTRACT-02C - Exact Word Contract Export

## Goal

Generate the official Student Enrolment Contract as a Word DOCX file using the real Word contract as the template.

The output must preserve the same layout, page separation, header, footer, logos, tables, spacing, wording, and alignment as the original Word file.

This ticket is for Word export only.

## Current Problem

The current browser/PDF export is not acceptable because it does not match the official Word contract.

The official contract must not be recreated from scratch with HTML/CSS.

## Correct Approach

Use the real Word document as the template.

The system should:

1. Keep the official Word layout.
2. Replace only the required values.
3. Preserve page breaks.
4. Preserve header and footer.
5. Preserve logos.
6. Preserve tables.
7. Preserve signature blocks.
8. Download a completed DOCX file.

## Source Template

Use this local-only file as the official layout source:

`_reference/source-files/Student Enrolment Contract - Chidi Gloria Arowolo.docx`

Do not commit real student data.

Do not copy the example student's personal data into code, docs, seed files, or tests.

## Template Strategy

Create a sanitized template file:

`src/templates/contracts/student-enrolment-template.docx`

This file should be based on the official Word contract.

Replace example student data with placeholders.

Example placeholders:

- `{{contract_date}}`
- `{{student_full_name}}`
- `{{student_number}}`
- `{{mailing_address}}`
- `{{city}}`
- `{{province}}`
- `{{postal_code}}`
- `{{phone}}`
- `{{alternate_phone}}`
- `{{email}}`
- `{{date_of_birth}}`
- `{{international_student_marker}}`
- `{{program_name}}`
- `{{program_start_date}}`
- `{{expected_completion_date}}`
- `{{credential_name}}`
- `{{training_location}}`
- `{{practicum_1_location}}`
- `{{practicum_2_location}}`
- `{{program_hours}}`
- `{{delivery_in_person_marker}}`
- `{{delivery_hybrid_marker}}`
- `{{delivery_online_marker}}`
- `{{tuition_fee}}`
- `{{book_fee}}`
- `{{compulsory_fee}}`
- `{{field_trip_fee}}`
- `{{uniform_equipment_fee}}`
- `{{professional_exam_fee}}`
- `{{expendable_supplies_fee}}`
- `{{international_fee}}`
- `{{optional_fee}}`
- `{{total_fees}}`
- `{{payment_before_signing}}`
- `{{payment_after_signing}}`
- `{{installment_1_due_date}}`
- `{{installment_1_amount}}`
- `{{installment_2_due_date}}`
- `{{installment_2_amount}}`
- `{{installment_3_due_date}}`
- `{{installment_3_amount}}`
- `{{installment_4_due_date}}`
- `{{installment_4_amount}}`
- `{{installment_5_due_date}}`
- `{{installment_5_amount}}`
- `{{installment_6_due_date}}`
- `{{installment_6_amount}}`
- `{{installment_total}}`
- `{{total_payments}}`

## Data Sources

Fill the Word template from:

- students
- applications
- programs
- batches
- fee_schedules
- payment_installments
- admission_checklists

## Required App Behavior

Add a button on the contract page:

- Generate Word Contract

When clicked:

- generate completed DOCX
- download the DOCX
- preserve official template layout
- do not use browser print
- do not generate PDF in this ticket

## Exactness Rules

The generated DOCX must:

- keep the same page breaks as the template
- keep header and footer from the template
- keep logo placement from the template
- keep table structure from the template
- keep signature lines from the template
- keep legal text from the template
- keep section order from the template
- avoid layout changes as much as possible

## Header and Footer

Header and footer should come from the Word template.

Do not rebuild header/footer with CSS.

Do not use Cloudinary for the official DOCX if the template already contains the correct images.

## Not Included

Do not implement:

- PDF export
- browser print as official output
- Adobe API
- DocuSign API
- email sending
- signed upload
- delete controls
- super admin controls
- Excel import

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- Generate Word Contract button exists
- completed DOCX downloads
- DOCX opens in Microsoft Word
- DOCX preserves official Word layout
- DOCX preserves page breaks
- DOCX preserves header and footer
- DOCX preserves logos
- DOCX preserves tables
- DOCX fills student data from system data
- DOCX fills program and batch data from system data
- DOCX fills fee and installment data from system data
- DOCX does not contain old example student data unless it comes from the selected student
- PDF export is not implemented in this ticket
- `npm run lint` passes
- `npm run build` passes