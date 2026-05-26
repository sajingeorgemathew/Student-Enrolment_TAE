# CONTRACT-04C-FIX - Runtime Template Path and Marker Placeholders

## Goal

Fix the contract marker issue by making sure the contract export uses the correct runtime Word template and placeholder-based marker replacement.

## Current Problem

The cleaned Word template was originally edited in the reference folder, but the contract export was using a different runtime template.

The corrected runtime template is now:

`src/templates/contracts/student-enrolment-template.docx`

This file contains cleaned plain placeholders for International Student and Method of program delivery.

## Runtime Template Rule

The contract generation code must use:

`src/templates/contracts/student-enrolment-template.docx`

Do not use:

`_reference/source-files/Student Enrolment Contract - Chidi Gloria Arowolo.docx`

at runtime.

The reference file is only for comparison.

## Marker Placeholders

The runtime template uses these placeholders:

- `{international_yes}`
- `{international_no}`
- `{delivery_in_person}`
- `{delivery_hybrid}`
- `{delivery_online}`

## Marker Output Rule

Use plain `X` and blank values.

Do not use Word checkbox objects.

Do not use Wingdings.

Do not use XML marker insertion for these fields.

### International Student

If international student is true:

- `{international_yes}` = `X`
- `{international_no}` = blank

If international student is false:

- `{international_yes}` = blank
- `{international_no}` = `X`

If missing:

- both blank

### Delivery Method

If `in_person`:

- `{delivery_in_person}` = `X`
- `{delivery_hybrid}` = blank
- `{delivery_online}` = blank

If `hybrid`:

- `{delivery_in_person}` = blank
- `{delivery_hybrid}` = `X`
- `{delivery_online}` = blank

If `online`:

- `{delivery_in_person}` = blank
- `{delivery_hybrid}` = blank
- `{delivery_online}` = `X`

If missing:

- all blank

## Required Fixes

1. Confirm the code reads from `src/templates/contracts/student-enrolment-template.docx`.
2. Remove or disable old marker/XML logic for:
   - International Student
   - Method of program delivery
3. Keep academic and English marker logic separate.
4. Replace the new placeholders through normal docxtemplater data.
5. Confirm no `{international_*}` or `{delivery_*}` placeholders remain in generated DOCX.
6. Confirm no old big checkbox objects or weird small symbols appear in those two sections.
7. Confirm contract effective date remains `02/05/2024`.

## Not Included

Do not change:

- contract date logic
- academic route logic unless needed to avoid regression
- English route logic unless needed to avoid regression
- class schedule
- fee formatting
- payment table
- header/footer
- page layout
- PDF export
- Adobe
- DocuSign
- signed contract upload
- delete/archive controls

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- [x] runtime template path is correct
- [x] International Student markers use plain placeholder replacement
- [x] Delivery Method markers use plain placeholder replacement
- [x] old XML marker logic no longer affects International Student
- [x] old XML marker logic no longer affects Delivery Method
- [x] no duplicate checkboxes appear
- [x] no weird small symbols appear
- [x] no marker placeholders remain unreplaced
- [x] contract date remains `02/05/2024`
- [x] no broad layout changes
- [x] `npm run lint` passes
- [x] `npm run build` passes

## Implementation Notes

Completed 2026-05-26.

### Changes made

1. Renamed `student-enrolment-template.docx.docx` to `student-enrolment-template.docx` (fixed double extension).
2. Changed `CHECKED` constant from Unicode checkbox `☒` to plain `X`.
3. Changed `UNCHECKED` constant from Unicode checkbox `☐` to empty string `""`.

### Verified

- Runtime template path: `src/templates/contracts/student-enrolment-template.docx` (confirmed at line 348 of generate-contract-docx.ts).
- All 5 placeholders found in template and replaced after render.
- International Student true: `X Yes / No` - correct.
- International Student false: `Yes / X No` - correct.
- Delivery in_person: `X in-person / Hybrid / Online` - correct.
- Delivery online: `in-person / Hybrid / X Online` - correct.
- Missing values: all blank - correct.
- No Unicode checkbox characters in output.
- No unreplaced placeholders remain.
- Contract date `02/05/2024` preserved.
- No old XML marker injection existed for International Student or Delivery Method - these already used docxtemplater. Academic and English XML markers untouched.
- `npm run lint` passes.
- `npm run build` passes.