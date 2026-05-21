# CONTRACT-01 - Auto-Filled Contract Preview

## Goal

Create an auto-filled enrolment contract preview page.

The contract preview must pull from the system data and should not require retyping contract details.

## Scope

Build:

- contract preview route
- contract data builder
- preview layout based on the real Word contract
- student information section
- program information section
- class/practicum schedule section
- fee and payment schedule section
- acknowledgement/signature placeholder sections
- contract readiness checks
- Cloudinary header/footer/logo support through env variables

## Required Routes

- `/dashboard/contracts`
- `/dashboard/contracts/[applicationId]/preview`

If needed, add a link to contract preview from:

- student detail page
- application/intake area
- fee schedule page

## Source Reference File

Use this local-only reference file:

`_reference/source-files/Student Enrolment Contract - Chidi Gloria Arowolo.docx`

Do not copy real student personal data from this file into code, docs, or seed data.

Use it only to understand structure, sections, order, wording, and layout needs.

## Data Sources

The preview should pull from:

- `students`
- `applications`
- `programs`
- `batches`
- `quotes`
- `fee_schedules`
- `payment_installments`
- `admission_checklists`
- `student_documents`
- `contracts` if available

## Contract Auto-Fill Rule

Do not create a separate contract typing form.

The preview should auto-fill from system data:

- student name
- student number
- mailing address
- city
- province
- postal code
- phone
- alternate phone
- email
- date of birth
- international student status
- program name
- credential
- start date
- expected completion date
- training location
- practicum locations
- program length
- class schedule
- delivery method
- academic requirement route
- English requirement route
- tuition and fees
- payment before signing
- installment schedule
- total payments

## Contract Sections

Preview should include these sections in order:

1. Student Enrolment Contract title
2. Student Information
3. Program Information
4. Academic Requirements
5. English Language Proficiency
6. Fees
7. Payment Schedule
8. Student agreement/signature placeholders
9. Acknowledgement and Certification
10. Consent to Use of Personal Information
11. Fee Refund Policy placeholder/section
12. Medical Disclaimer
13. Vulnerable Sector Disclaimer
14. Practicum Placement Disclaimer and Acknowledgement
15. Student Immigration Status Acknowledgement
16. Photography and Videography Consent Form
17. Footer/contact area

Long legal/static text can be represented as structured preview blocks if full formatting is too large for this ticket, but the layout should prepare for full PDF generation later.

## Cloudinary Branding Env Variables

Use:

- `CONTRACT_HEADER_LOGO_URL`
- `CONTRACT_FOOTER_LEFT_IMAGE_URL`
- `CONTRACT_FOOTER_RIGHT_IMAGE_URL`

For frontend preview, use:

- `NEXT_PUBLIC_CONTRACT_HEADER_LOGO_URL`
- `NEXT_PUBLIC_CONTRACT_FOOTER_LEFT_IMAGE_URL`
- `NEXT_PUBLIC_CONTRACT_FOOTER_RIGHT_IMAGE_URL`

Do not hardcode Cloudinary URLs.

If env values are missing, show a clean placeholder or skip image safely.

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Avoid emojis and decorative AI-looking symbols.

## Readiness Checks

Show a readiness panel with:

- student information complete
- program selected
- batch selected
- fee schedule approved
- checklist started or completed
- payment installments available
- documents available

Do not block preview yet unless critical data is missing.

## Not Included

Do not implement:

- PDF generation
- Adobe
- DocuSign
- sending for signature
- manual signed upload
- Resend
- Excel import
- delete controls
- super admin controls

## Acceptance Criteria

- `/dashboard/contracts` lists applications/contracts ready for preview
- `/dashboard/contracts/[applicationId]/preview` shows auto-filled contract preview
- preview pulls from system data
- no separate contract retyping form is created
- Cloudinary env variables are used for branding preview
- missing data has clean placeholders
- fee schedule and installments appear if available
- no long em dash characters are introduced in touched UI copy
- no emojis
- `npm run lint` passes
- `npm run build` passes