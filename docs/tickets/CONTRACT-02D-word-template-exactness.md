# CONTRACT-02D - Fix Word Export Template Mapping and Exactness

## Goal

Fix the Word contract export so the generated DOCX uses the official Word contract layout as closely as possible.

This ticket is for Word DOCX export only.

## Current Problems

The current generated/exported output has these issues:

- contract date shows NaN/NaN/NaN
- academic requirement selection is wrong in Word export
- English requirement selection is wrong in Word export
- some placeholder lines are missing or collapsed
- some alignment is not clean
- browser PDF/export is not acceptable as official output

## Correct Direction

Do not recreate the contract using HTML or CSS.

Use the official Word file as the template.

The Word template must preserve:

- page breaks
- header
- footer
- logos
- tables
- spacing
- signature lines
- legal/static wording
- section order

## Source Template

Use this local-only reference file:

`_reference/source-files/Student Enrolment Contract - Chidi Gloria Arowolo.docx`

Do not commit this source file.

Do not copy real example student personal data into code, docs, tests, or seed data.

## Required Work Order

Claude must do the work in this order:

1. Inspect the existing Word export implementation.
2. Inspect the current generated DOCX template if one exists.
3. Create or clean a sanitized Word template based on the official Word reference.
4. First make the template alignment clean before adding or changing placeholders.
5. Preserve header, footer, logos, tables, page breaks, and signature blocks.
6. Replace old student data with placeholders.
7. Connect placeholders to the same contract data builder used by preview.
8. Fix date mapping.
9. Fix academic requirement mapping.
10. Fix English requirement mapping.
11. Keep blank lines and underscore placeholders where source data is missing.
12. Generate DOCX only.

## Contract Date Rule

The first enrolment date currently shows NaN/NaN/NaN.

For now, use this constant value:

`02/05/2024`

Do not calculate it from an invalid date.

Later this can become an admin setting.

## Academic Requirement Mapping

The Word export must match the checklist selection.

Do not hardcode Mature Student.

Use the actual checklist value:

- Canadian secondary school / OSSD
- Foreign credential
- Mature student

Only the selected option should be marked.

## English Requirement Mapping

The Word export must match the checklist selection.

Do not hardcode NACC Written Exam.

Use the actual checklist value:

- IELTS
- TOEFL iBT
- CAEL
- CELPIP
- CLB
- Duolingo
- PTE Academic
- NACC Written Exam
- 2 years Canadian post-secondary study in English
- 2 years international post-secondary study in English
- not required

Only the selected option should be marked.

## Placeholder Line Rule

If data is missing, preserve the original blank line or underscore placeholder.

Do not collapse spacing.

Examples:

- student number missing should show a blank line
- alternate phone missing should show a blank line
- unused fee fields should show blank lines
- unused installment rows should remain blank

## Data Sources

Use system data from:

- students
- applications
- programs
- batches
- fee_schedules
- payment_installments
- admission_checklists

## Required App Behavior

On the contract page:

- keep Generate Word Contract button
- download completed DOCX
- do not use browser print as official output
- do not implement PDF export in this ticket

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Not Included

Do not implement:

- PDF export
- Adobe API
- DocuSign API
- email sending
- signed upload
- delete controls
- super admin controls
- Excel import

## Acceptance Criteria

- generated DOCX opens in Microsoft Word
- generated DOCX preserves template page layout as closely as possible
- generated DOCX preserves header and footer
- generated DOCX preserves logos
- generated DOCX preserves tables
- generated DOCX preserves signature lines
- generated DOCX does not show NaN/NaN/NaN
- first contract date shows 02/05/2024
- academic requirement selection matches checklist
- English requirement selection matches checklist
- blank fields keep underline or blank placeholders
- old example student data is not present unless it comes from the selected student
- `npm run lint` passes
- `npm run build` passes