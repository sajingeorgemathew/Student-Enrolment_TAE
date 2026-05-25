# CONTRACT-04A - Contract Template Audit and Field Map

## Goal

Audit the official Student Enrolment Contract before changing the Word export again.

This ticket is planning and documentation only.

The purpose is to create a complete page-by-page field map so future contract tickets can safely fix the Word export without breaking layout, header, footer, tables, page breaks, or wording.

## Main Product Rule

The official contract output is Word DOCX.

Do not recreate the contract from HTML or CSS.

Use the official Word contract as the template.

PDF is used only as a visual/text reference.

## Source Files

Use these local-only reference files:

- `_reference/source-files/Student Enrolment Contract - Chidi Gloria Arowolo.docx`(Use this one fresh again from local)
- `_reference/source-files/Student Enrolment Contract - Chidi Gloria Arowolo.pdf`

The uploaded PDF is a 15-page reference showing the official contract structure, repeated header/footer, student/program sections, class/practicum schedule, academic/English requirements, fees, payment schedule, acknowledgements, refund policy, medical/VSS disclaimers, practicum acknowledgement, immigration acknowledgement, and photo/video consent.

Do not commit real student source files.

Do not copy the example student's personal data into seed data, tests, or app constants.

Use the example data only to identify where dynamic fields appear.

## Required Deliverables

Create:

- `docs/blueprint/contract-template-field-map.md`

Update this ticket with status and notes:

- `docs/tickets/CONTRACT-04A-template-audit-field-map.md`

## Field Map Requirements

The blueprint must include:

1. Page-by-page structure for all 15 pages
2. Static text sections that should never change
3. Dynamic fields that must be replaced
4. Repeated dynamic fields across pages
5. Source table/field for every dynamic value
6. Academic requirement option mapping
7. English requirement option mapping
8. Program and batch mapping
9. Class schedule mapping
10. Practicum schedule mapping
11. Fee and payment schedule mapping
12. Signature and date field rules
13. College representative/admin field rules
14. Header/footer preservation rules
15. Overflow rules for long names, addresses, email, program names, and locations
16. Known current Word export mismatch list
17. Future ticket breakdown for CONTRACT-04B, 04C, 04D, 04E, and 04F

## Important Dynamic Fields

Map at minimum:

- contract effective date
- generated date
- student full name
- student number
- mailing address
- city
- province
- postal code
- phone
- alternate phone
- permanent address fields
- country
- email
- international student marker
- date of birth
- program name
- program start date
- expected completion date
- credential
- language of instruction marker
- training location
- additional training location
- practicum 1 location
- practicum 2 location
- program hours
- class schedule days
- class schedule timings
- class schedule hours
- practicum schedule text
- delivery method marker
- academic route marker
- English route marker
- tuition fee
- book fee
- compulsory fee
- field trip fee
- uniform/equipment fee
- professional exam fee
- expendable supplies fee
- international fee
- optional fee
- total fees
- payment before signing
- payment after signing
- installment due dates
- installment amounts
- installment total
- total payments
- student name repeated in acknowledgements
- college representative name if needed
- college representative date if needed

## Academic Requirement Mapping

Map these source values from the official checklist:

- Canadian secondary school / OSSD
- Foreign credential
- Mature student

Only the selected option should be marked in Word export.

Do not hardcode Mature Student.

## English Requirement Mapping

Map these source values from the official checklist:

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

Only the selected option should be marked in Word export.

Do not hardcode NACC Written Exam.

## Batch Timing Mapping

Document how class schedule timing should be filled.

Examples:

- Morning batch: 8:00 AM - 2:00 PM
- Evening batch: 4:30 PM - 10:30 PM

The timing must come from the batch record or batch schedule source.

Do not hardcode one timing for all batches.

## Signature and Date Rules

Student signature/date fields should remain blank for external signing unless a future signing workflow supplies them.

College representative/admin date fields can use generated date only if required and explicitly mapped.

Identify all signature/date locations page by page.

## Overflow Rules

Define rules for long values.

Fields that need overflow rules include:

- student full name
- student address
- email
- program name
- training location
- practicum locations
- payment notes

Decide for each field whether it should:

- stay one line
- shrink font if long
- wrap if safe
- stay blank if missing
- preserve underline if missing

## Header and Footer Rules

Header and footer must come from the Word template.

Do not rebuild header/footer with CSS.

Do not use Cloudinary for official DOCX export if the Word template already contains correct header/footer images.

Each page should preserve the same header/footer behavior as the official contract.

## Current Known Problems To Capture

Document these known issues:

- academic route marker sometimes incorrect
- English route marker sometimes incorrect
- unwanted round marker/shape appears in academic section
- batch timing not reflecting selected batch
- fee lines can lose original underline style
- long names may push layout
- Word contract available readiness wording was confusing in earlier flow
- student/college signature areas need consistent underline preservation
- college administrator fields need clear mapping
- generated date rules need to be defined

## Not Included

Do not implement:

- Word template changes
- code changes
- placeholder replacement
- contract generation changes
- PDF export
- Adobe
- DocuSign
- signed contract upload
- delete/archive controls
- transcript module
- Excel import

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- contract field map blueprint is created
- all 15 pages are mapped
- dynamic fields are listed
- repeated fields are identified
- source data for each field is defined
- academic/English mapping is defined
- batch timing mapping is defined
- fee/payment mapping is defined
- signature/date rules are defined
- overflow rules are defined
- header/footer preservation rules are defined
- known mismatch list is documented
- no code changes are made unless documentation-only
- no long em dash characters are introduced
- no emojis are added
- `npm run lint` passes
- `npm run build` passes

---

## Status

Completed: 2026-05-25

## Deliverables Created

- `docs/blueprint/contract-template-field-map.md` - complete field map blueprint

## Completion Notes

### Pages mapped

All 15 pages of the contract template have been mapped:

1. Title and Student Information
2. Program Information
3. Class Schedule, Practicum Schedule, Delivery Method, Academic Requirements
4. English Language Proficiency
5. Fees
6. Payment Schedule and Student Undertaking
7. Acknowledgement and Certification
8. Consent to Use of Personal Information
9. Fee Refund Policy (part 1)
10. Fee Refund Policy (part 2)
11. Medical Disclaimer
12. Vulnerable Sector Disclaimer
13. Practicum Placement Disclaimer and Acknowledgement (part 1)
14. Practicum Placement (part 2) and Immigration Status Acknowledgement
15. Photography and Videography Consent Form

### Dynamic fields

47 docxtemplater placeholders identified and mapped to source table/column.
13 checkmark fields (3 academic, 10 English) mapped via XML manipulation.
1 embedded object identified (`{28A0092B-...}` shape marker).

### Repeated fields

- `{student_full_name}` appears 10 times across pages 1, 6, 7, 8, 11, 12, 13-14, 14-15, 15
- `{program_name}` appears 5 times across pages 2, 7, 11, 13, 14-15
- `{program_start_date}` and `{expected_completion_date}` appear 2 times each
- `{class_time}` and `{hours_per_day}` repeat per day column (5 columns active)
- `{practicum_1_hours}` and `{practicum_2_hours}` appear 2 times each

### Known mismatches documented

17 known issues documented including:
- Hardcoded contract date
- Fragile XML checkmark logic for academic/English routes
- Class schedule showing all days instead of active days only
- Fee underline style using underscore characters instead of Word formatting
- Delivery method and international student not dynamically mapped
- Missing permanent address, alternate phone, country, address line 2 mappings
- College representative fields not mapped
- Generated date rules undefined

### Recommended next ticket

CONTRACT-04B - Fix Contract Date and Missing Student Fields

### Future ticket breakdown

- CONTRACT-04B: Fix contract date, add missing student field placeholders
- CONTRACT-04C: Fix academic/English checkmarks, delivery method, international student
- CONTRACT-04D: Fix class schedule day filtering, fee formatting, installment notes
- CONTRACT-04E: Add college representative and signature placeholders
- CONTRACT-04F: Template cleanup, validation, and automated testing