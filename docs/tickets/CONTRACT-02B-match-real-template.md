# CONTRACT-02B - Match Real Contract Template Exactly

## Goal

Fix the contract preview/export so it matches the real Student Enrolment Contract structure, wording, and layout as closely as possible.

The current exported PDF is too generic and does not match the real Word contract. This ticket must replace the simplified contract sections with a template that follows the uploaded Word contract.

## Source Files

Use the local-only source file:

`_reference/source-files/Student Enrolment Contract - Chidi Gloria Arowolo.docx`

Also use the exported PDF only as a bad-output reference:

`Student Enrolment - TAE.pdf`

Do not copy real student personal data from the Word file into seed data, tests, or docs.

Use the Word file for:

- exact section order
- legal/static wording
- table structure
- signature block placement
- field placement
- header/footer reference
- page spacing reference

## Main Problem

The current PDF export looks like a generic contract preview.

The required output should look like the real TAE Student Enrolment Contract.

## Scope

Rebuild or heavily revise the contract preview/export layout.

The output should include:

- real contract title section
- real opening paragraph
- student information section matching the Word contract
- program information section matching the Word contract
- class schedule table
- practicum schedule table
- method of delivery selection
- academic requirements section with real wording
- English language proficiency section with real wording
- fees section matching the Word contract format
- payment schedule matching the Word contract format
- student undertaking/signature section
- acknowledgement and certification section
- consent to use personal information section
- refund policy section using real wording from the contract
- medical disclaimer using real wording
- vulnerable sector disclaimer using real wording
- practicum placement disclaimer and acknowledgement using real wording
- student immigration status acknowledgement using real wording
- photography and videography consent form using real wording
- footer/contact area

## Auto-Fill Rule

Do not create a separate contract retyping form.

Auto-fill from system data:

- students
- applications
- programs
- batches
- fee_schedules
- payment_installments
- admission_checklists
- student_documents

If data is wrong, admin should update the source record.

## Exactness Priority

Priority is:

1. Contract wording accuracy
2. Section order accuracy
3. Field placement accuracy
4. Printable PDF stability
5. Visual similarity to Word contract

The output does not need to be a perfect Word clone in this ticket, but it must stop looking like a generic contract.

## Page and Print Rules

Use print-specific CSS.

When printing/exporting:

- hide dashboard navigation
- hide buttons
- hide edit links
- hide readiness panel
- show only the contract
- avoid page breaks inside important tables
- keep signature blocks together
- use normal printable page width
- use clean black and white contract styling

## Header and Footer

Use env variables if available:

- `NEXT_PUBLIC_CONTRACT_HEADER_LOGO_URL`
- `NEXT_PUBLIC_CONTRACT_FOOTER_LEFT_IMAGE_URL`
- `NEXT_PUBLIC_CONTRACT_FOOTER_RIGHT_IMAGE_URL`

Do not hardcode Cloudinary URLs.

If missing, render safely.

## Source Edit Links

On screen only, keep source edit links:

- Edit Student
- Edit Batch
- Edit Fees
- Edit Checklist
- View Documents

Hide these in print mode.

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

Remove any copied emoji-style icons from contract content if they came from the Word file.

## Not Included

Do not implement:

- Adobe API
- DocuSign API
- email sending
- signed upload
- Word export
- delete controls
- super admin controls
- Excel import

## Acceptance Criteria

- exported PDF no longer looks like the generic 9-page preview
- contract preview follows the real Word contract section order
- real contract wording is used for static/legal sections
- student/program/batch/fee data auto-fills from system data
- fees and payment schedule match the real contract format
- signature placeholders match the real contract style
- print/export hides dashboard UI and edit links
- Cloudinary branding works if env values exist
- no long em dash characters are introduced in UI copy
- no emojis are used in app UI
- `npm run lint` passes
- `npm run build` passes