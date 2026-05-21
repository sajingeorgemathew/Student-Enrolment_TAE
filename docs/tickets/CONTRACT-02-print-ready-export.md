# CONTRACT-02 - Print-Ready Contract Preview and Export Foundation

## Goal

Create a print-ready enrolment contract preview and export foundation.

The contract should look closer to the official Word contract and should be ready for PDF export for manual Adobe sending outside the system.

## Scope

Build:

- print-ready contract preview layout
- contract source edit links
- contract readiness panel
- Cloudinary header logo support
- Cloudinary footer left and right image support
- stable print CSS
- PDF export or browser print-to-PDF foundation
- clean placeholders for missing data

## Required Routes

Use existing route:

- `/dashboard/contracts/[applicationId]/preview`

Improve if needed:

- `/dashboard/contracts`

## Source Reference File

Use this local-only reference file:

`_reference/source-files/Student Enrolment Contract - Chidi Gloria Arowolo.docx`

Use it only for layout, order, sections, and wording reference.

Do not copy real student personal data from the source file into code, docs, seed data, or tests.

Do not commit the source file.

## Main Workflow

Admin reviews the contract preview.

If something is wrong, admin should use source edit links to update the correct area:

- Edit Student
- Edit Batch
- Edit Fees
- Edit Checklist
- View Documents

After the preview is correct, admin exports or prints the contract as PDF.

Admin then sends the PDF manually through Adobe or another external signing method.

No Adobe API is included in this ticket.

## Contract Auto-Fill Rule

Do not create a separate contract retyping form.

The contract must auto-fill from system data:

- students
- applications
- programs
- batches
- fee_schedules
- payment_installments
- admission_checklists
- student_documents
- contracts if available

## Source Edit Links

Add edit or review links near major sections:

Student Information:

- Edit Student

Program Information:

- Edit Batch
- Edit Program if available

Fees and Payment Schedule:

- Edit Fees

Academic and English Requirement:

- Edit Checklist

Documents:

- View Documents

The links should route to the existing system pages where possible.

## Print-Ready Layout

The preview should use a contract-style layout, not dashboard cards.

Use:

- white page background
- fixed printable width
- official-looking spacing
- table layouts for schedule and payments
- clear signature lines
- page break friendly sections
- print CSS using `@media print`
- normal text size suitable for PDF output

## Contract Sections

Include these sections in order:

1. Student Enrolment Contract title
2. Student Information
3. Program Information
4. Class Schedule
5. Practicum Schedule
6. Academic Requirements
7. English Language Proficiency
8. Fees
9. Payment Schedule
10. Student agreement and signature placeholders
11. Acknowledgement and Certification
12. Consent to Use of Personal Information
13. Fee Refund Policy section or structured placeholder
14. Medical Disclaimer
15. Vulnerable Sector Disclaimer
16. Practicum Placement Disclaimer and Acknowledgement
17. Student Immigration Status Acknowledgement
18. Photography and Videography Consent Form
19. Footer and contact area

If the full legal text is too large for this ticket, include clean structured sections and prepare the layout so the full text can be expanded in the next contract ticket.

## Cloudinary Env Variables

Use:

- `NEXT_PUBLIC_CONTRACT_HEADER_LOGO_URL`
- `NEXT_PUBLIC_CONTRACT_FOOTER_LEFT_IMAGE_URL`
- `NEXT_PUBLIC_CONTRACT_FOOTER_RIGHT_IMAGE_URL`

Do not hardcode Cloudinary URLs.

If env values are missing, render safely without crashing.

## Export Behavior

Add a clear action:

- Export PDF
- Print Contract

Implementation can use browser print for this ticket if stable.

Use print CSS so the printed PDF does not look like the dashboard.

Hide dashboard navigation, buttons, readiness panel, and edit links in print mode.

Only the contract itself should appear in the printed PDF.

## Word Export

Do not implement Word export in this ticket.

Focus on stable PDF export first.

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Avoid emojis and decorative AI-looking symbols.

## Not Included

Do not implement:

- Adobe API
- DocuSign API
- sending for signature
- manual signed upload
- Resend
- Excel import
- delete controls
- super admin controls
- Word export

## Acceptance Criteria

- contract preview looks closer to the official Word contract
- preview is print-ready
- Export PDF or Print Contract action exists
- print mode hides dashboard UI and edit controls
- print mode only shows contract content
- Cloudinary header and footer images appear if env values exist
- missing Cloudinary env values do not crash page
- source edit links appear on screen
- source edit links are hidden in print mode
- fee schedule and installments render in table format
- signature placeholders render clearly
- no separate contract retyping form is created
- no long em dash characters are introduced in touched UI copy
- no emojis
- `npm run lint` passes
- `npm run build` passes