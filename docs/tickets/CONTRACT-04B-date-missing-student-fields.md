# CONTRACT-04B - Fix Contract Date and Missing Student Fields

## Goal

Fix the contract date and missing student field mappings in the Word contract export.

This ticket must keep the Word template as the source of layout. Do not recreate the contract from HTML or CSS.

## Source Documents

Use the field map:

- `docs/blueprint/contract-template-field-map.md`

Use local-only reference files if needed:

- `_reference/source-files/Student Enrolment Contract - Chidi Gloria Arowolo.docx`
- `_reference/source-files/Student Enrolment Contract - Chidi Gloria Arowolo.pdf`

Do not commit source Word/PDF files.

## Main Product Rule

The official contract output is DOCX.

The Word template controls:

- layout
- page breaks
- header
- footer
- logos
- tables
- static wording
- signature lines

This ticket should only fix mapped values and missing student fields.

## Scope

Fix:

- contract date source
- alternate phone mapping
- mailing address line 2 support
- permanent address fields
- country field
- missing field underline fallback
- long student name/email/address handling if safe
- generated DOCX validation for replaced placeholders

## Contract Date Rule

The page 1 contract effective date is intentionally fixed to 02/05/2024. This is a template-level constant embedded in the original Word file.

Do not use `contract_generated_at`, `ready_for_contract_at`, or the current generation date for this field. Generated date tracking is separate and should not replace the contract effective date.

Format:

- DD/MM/YYYY

Do not use `NaN/NaN/NaN`.

## Student Fields To Add

Add or fix these placeholders in the DOCX template if safe:

- `{alternate_phone}`
- `{mailing_address_line_2}`
- `{permanent_address}`
- `{permanent_city}`
- `{permanent_province}`
- `{permanent_postal_code}`
- `{permanent_country}`
- `{country}`

## Field Sources

Map fields as follows:

| Placeholder | Source |
|---|---|
| `{alternate_phone}` | `students.alternate_phone` |
| `{mailing_address_line_2}` | `students.mailing_address_line_2` |
| `{permanent_address}` | `students.permanent_address_line_1` |
| `{permanent_city}` | `students.permanent_city` |
| `{permanent_province}` | `students.permanent_province` |
| `{permanent_postal_code}` | `students.permanent_postal_code` |
| `{permanent_country}` | `students.permanent_country` |
| `{country}` | `students.country` |

If exact column names differ, inspect the current schema and use the correct existing column.

Do not invent columns without a migration.

If a needed column does not exist, document it and keep the field blank with underline fallback.

## Missing Field Fallback Rules

If optional data is missing, preserve the contract form look.

Use blank underline style or existing template underline.

Examples:

- alternate phone missing should show a blank line
- permanent address missing should show a blank line
- country missing should show a blank line
- mailing address line 2 missing should not collapse or break page layout

Do not show:

- undefined
- null
- NaN
- N/A unless the original template expects it

## Mailing Address Rule

If mailing address line 2 exists, include it safely.

Preferred:

- Line 1 remains in the main mailing address field.
- Line 2 can appear directly after line 1 only if the template supports it without breaking layout.

If adding line 2 to the page 1 layout causes alignment risk, document the limitation and do not force it.

## Overflow Rules

Use the field map overflow rules.

Important fields:

- student full name
- mailing address
- email
- program name

If safe in this ticket:

- shrink font for long one-line fields
- allow wrapping only where the template can tolerate it

Do not make broad layout changes.

## Validation

After generation:

- no unreplaced placeholders should remain in the DOCX text
- no `NaN/NaN/NaN`
- no `undefined`
- no `null`

If full DOCX validation is too large for this ticket, add a small helper or documented manual check.

## Not Included

Do not implement:

- academic/English checkmark fixes
- delivery method mapping
- international student marker mapping
- class schedule day filtering
- fee underline rewrite
- college representative placeholders
- signature placeholder changes
- contract template redesign
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

## Implementation Notes

### Template Restored

The DOCX template was restored from the fresh reference file:

- `_reference/source-files/Student Enrolment Contract - Chidi Gloria Arowolo.docx`

The previous template had 13KB of extra XML in document.xml (608KB vs 595KB reference), which caused layout collapse and page 1 push-down. The restored template preserves the original page breaks, tables, headers, footers, drawings, and section properties.

### Contract Date Fixed

- The contract effective date is intentionally fixed to 02/05/2024. This is a template-level constant, not a generated date.
- The `resolveContractDate` function was removed. The template's original date is preserved as-is.
- Generated date tracking (contract_generated_at, ready_for_contract_at) is separate and should not replace this field.
- Format: DD/MM/YYYY.

### X Markers

- X markers are present in the original Word template and are not part of this ticket. They were not changed.

### Page 1 Student Fields

Mapped fields (working):

- student full name
- student number
- mailing address (line 1 + line 2 combined)
- city
- province
- postal code
- phone
- email
- date of birth
- program name
- program start date
- expected completion date
- credential name
- training location
- practicum locations and hours
- class time and hours per day

### Optional Fields Deferred

The following optional fields were deferred because adding them to the template risks layout shift on page 1. The reference template has these as static blank underlines, not placeholders:

- alternate phone: reference template has a static blank underline in the original form
- permanent address fields (line 1, city, province, postal code): reference template has static blank underlines
- permanent country: reference template has a static blank underline
- permanent phone: reference template has a static blank underline
- country (mailing): not a separate field in the reference template
- mailing address line 2: included by combining with line 1 in the mailing_address placeholder

These fields are fetched in the query (actions.ts) and typed in ContractDetailData. A future ticket can add them to the template if the layout supports it.

## Acceptance Criteria

- contract effective date is fixed to 02/05/2024 (template-level constant)
- contract effective date does not use contract_generated_at, ready_for_contract_at, or current generation date
- generated DOCX never shows NaN/NaN/NaN
- template restored from fresh reference Word file
- page structure matches reference (617 paragraphs, 4 tables, 7 page breaks, 16 drawings)
- headers and footers preserved
- missing optional fields preserve blank underline style from original template
- no broad layout rewrite is done
- Word template remains the layout source
- no academic/English checkmark changes are made
- no class schedule changes are made
- no fee formatting changes are made
- `npm run lint` passes
- `npm run build` passes