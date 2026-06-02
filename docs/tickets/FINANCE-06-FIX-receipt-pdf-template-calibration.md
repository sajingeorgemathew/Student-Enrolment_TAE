# FINANCE-06-FIX - Receipt PDF Template Cleanup and Overlay Calibration

## Goal

Fix the generated receipt PDF appearance before moving to receipt storage/download history.

This ticket focuses only on receipt PDF template cleanup, overlay formatting, and coordinate calibration.

## Current Problem

The receipt generation flow works, but the generated PDF appearance is not production-ready.

The runtime receipt template currently appears to be a value-filled sample receipt. New values are being overlaid on top of or below old sample values.

Example issue:

- old sample receipt values still appear
- new generated receipt values also appear
- output contains duplicated/incorrect receipt data

This is a template/calibration issue, not a receipt flow issue.

## Main Rule

Do not change the receipt generation workflow unless needed for PDF formatting.

Do not touch student hub, contract generation, payment schedule, registry logic, schema, or RLS.

## Scope

Fix only:

- receipt PDF template readiness notes
- receipt PDF overlay coordinates
- receipt formatting helpers
- generated PDF visual output
- student number display formatting
- payment method marker placement
- Cash line placement
- notes placement
- date placement
- amount placement
- signature handling notes if needed

## Template Rule

Runtime template path:

`src/templates/receipts/toronto-academy-receipt-template.pdf`

Preferred production requirement:

- use a clean blank receipt PDF template
- no old student/payment values should exist in the background PDF

If the current template is still value-filled:

- document this as a production blocker
- do not pretend it is production-ready
- still calibrate overlay positions as much as possible

## Required Fixes

### 1. Student number display

Current bad output example:

`PSW PSW125315`

Correct output:

`PSW 125315`

Rules:

- if student number already starts with `PSW`, normalize it
- remove duplicate PSW prefix
- display exactly `PSW {numericStudentNumber}`
- example: `PSW125315` -> `PSW 125315`
- example: `125315` -> `PSW 125315`

### 2. Receipt number

Keep format:

`PSW-12500-25-{digits_after_125}-{sequence}`

Example:

`125315`, sequence `1` -> `PSW-12500-25-315-01`

### 3. Date format

Top date:

`DD-MM-YYYY (DD-MM-YYYY)`

Bottom date:

`Date: DD-MM-YYYY`

### 4. Amount format

Use clean currency format:

`$677.00`

Do not use inconsistent text like:

`CAN $677.00`

unless later specifically required.

### 5. Payment method markers

Use one reliable marker style.

Preferred:

`X`

Rules:

- cash checks Cash only
- e-transfer checks E-transfer only
- card methods check main card option plus selected card type only
- PayPal checks PayPal only
- cheque/bank draft checks cheque/bank draft only

### 6. Cash line

Cash line must appear on every receipt:

`5. Cash`

If background template does not include it, overlay it in a clean fixed position.

For cash payment:

`5. Cash   X`

or the calibrated equivalent.

For non-cash payment:

`5. Cash`

without X.

### 7. Notes

Use exact display:

- `Notes: Enrolment fee`
- `Notes: Installment payment`
- `Notes: Late fee payment / Installment payment`

### 8. Signature

Do not print typed signer name.

If signature image is not implemented yet, document as future work.

Do not let signature change layout.

## Calibration Requirement

Generate test PDFs for at least:

1. Cash receipt
2. E-transfer receipt
3. Card receipt if practical

Check:

- receipt number placement
- student name placement
- student number placement
- amount placement
- date placement
- payment method marker placement
- Cash line placement
- notes placement
- bottom date placement

## Not Included

Do not implement:

- receipt storage/download history
- student hub receipt summary
- void with reason
- batch receipt generation
- uploaded signature management
- receipt registry redesign
- database schema changes
- RLS changes
- contract changes
- payment schedule changes

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- generated receipt no longer shows duplicate PSW prefix
- amount format is clean
- date format is correct
- payment marker logic is correct
- Cash line appears on every generated receipt
- notes display correctly
- overlay coordinates are improved
- template limitation is clearly documented if current template is value-filled
- no unrelated workflow or schema changes are made
- `npm run lint` passes
- `npm run build` passes

## Final Notes (FINANCE-06-FIX)

### Template status

- The runtime template
  `src/templates/receipts/toronto-academy-receipt-template.pdf` is now a clean
  blank template. Verified by rendering at 150 dpi: all value fields are empty
  and no sample student data (`PSW-12500-25-52-01`, student `12552`, sample
  checkmarks, sample signature) remains.
- The template preprints every label and prefix
  (`Receipt No: PSW-12500-25-`, `Student No: PSW`, `Date of Receipt:` with a
  literal `(DD-MM-YYYY)` hint, `Date:`, `Notes:`, `5. Cash`, the program line,
  and the empty checkboxes). This is the key finding: the previous doubling
  ("PSW PSW125315", "CAN $" duplicates, "Notes: Notes:") came from the generator
  redrawing those labels. The generator now overlays only the dynamic value
  into the blank after each label.
- Production note: the cleaned template was produced with pypdf and currently
  sits in the working tree; commit it as the production template. The program
  line is static (PSW only), and the `(DD-MM-YYYY)` hint is a harmless
  preprinted artifact that could be removed from the template later.

### Calibration result

- Coordinates were read from the template's own printed label and checkbox
  positions and locked into `COORDS` in `generate-receipt-pdf.ts`. The field map
  (`docs/blueprint/receipt-pdf-field-map.md`, section 4) was updated to match.
- Test receipts generated and visually verified: cash, e-transfer, and card
  (Visa). Receipt number, student name, student number, amount, top date,
  payment marker, cash line, notes, card holder name, and bottom date all sit
  correctly on the template with no doubled values.

### Formatting fixes

- Student number: overlay draws the numeric value only (`formatStudentNumberValue`),
  so the result reads `PSW 125315` using the template's preprinted `PSW`. Handles
  `125315`, `PSW125315`, and `PSW 125315`.
- Amount: `$677.00` (removed the `CAN ` prefix).
- Dates: top overlays `DD-MM-YYYY` before the preprinted `(DD-MM-YYYY)` hint;
  bottom overlays `DD-MM-YYYY` after the preprinted `Date:` label.

### Payment markers

- Reliable `X` glyph centered in the printed checkbox squares.
- cash -> Cash box only; e_transfer -> E-transfer box only; paypal -> Paypal box
  only; cheque_bank_draft -> Cheque/bank draft box only; card brand -> selected
  card-type box plus a left-margin X beside option 1 (option 1 has no checkbox
  of its own on the template).

### Signature

- Not implemented. The generator never prints a typed signer name and leaves a
  documented `TODO(FINANCE-07)` for the signature image. The signature line
  stays blank.

### Not changed

- No schema, RLS, registry UI, student hub, contract, payment schedule, or
  admin-tools navigation changes. The receipt generation workflow was not
  altered; only the PDF overlay formatting and coordinates changed.