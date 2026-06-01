# FINANCE-03 - Receipt PDF Template and Field Map

## Goal

Prepare the runtime receipt PDF template location and create a precise field map for receipt PDF overlay generation.

This ticket does not implement PDF generation yet.

## Blueprint Source

Use:

- `docs/blueprint/receipt-system-integration.md`
- `docs/tickets/FINANCE-01-receipt-system-blueprint.md`
- `docs/tickets/FINANCE-02-receipt-data-model-rls.md`

## Runtime Template

Runtime receipt template path:

`src/templates/receipts/toronto-academy-receipt-template.pdf`

Reference file path:

`_reference/source-files/receipts/2nd_july_2025_12552_PSW-12500-25-52-01.pdf`

## Important Note

The current PDF may be a sample receipt with existing overlaid values.

This ticket should document whether the template is:

- clean blank template
- sample/value-filled template being used temporarily

If the current file already contains sample student values, the blueprint should recommend replacing it later with a clean blank receipt template before production.

## Main Product Direction

Receipt PDFs should use the original Toronto Academy receipt PDF as the background.

Overlay dynamic values only.

Do not rebuild receipt layout from scratch.

Do not redesign header, footer, payment option layout, or signature area.

## Scope

Create:

- runtime template folder if missing
- runtime receipt PDF template file
- receipt field map document
- overlay coordinate recommendations
- template readiness notes

## Deliverable

Create:

`docs/blueprint/receipt-pdf-field-map.md`

## Field Map Must Include

Map these overlay fields:

- receipt_number
- student_name
- student_number_display
- program_information
- total_amount_paid
- date_of_receipt_top
- debit_credit_checkbox
- debit_checkbox
- master_card_checkbox
- visa_checkbox
- amex_checkbox
- paypal_checkbox
- etransfer_checkbox
- cheque_bank_draft_checkbox
- cash_label
- cash_checkbox
- card_holder_name
- notes
- signature_image
- bottom_date

## Overlay Rules

### Receipt number

Display full receipt number.

Format:

`PSW-12500-25-{digits_after_125}-{sequence}`

### Student number display

Display:

`PSW 125191`

not only:

`125191`

### Dates

Top date:

`DD-MM-YYYY (DD-MM-YYYY)`

Bottom date:

`Date: DD-MM-YYYY`

### Payment method

Only one main payment method should be checked.

Debit/credit card has sub-options:

- debit
- master_card
- visa
- amex

For card payments:

- check main card option
- check selected card type only
- write student name on Card Holder Name line

For cash:

- show Cash line
- check Cash only

### Notes

Allowed text:

- `Notes: Enrolment fee`
- `Notes: Installment payment`
- `Notes: Late fee payment / Installment payment`

### Signature

Use signature image only.

Do not print typed signer name.

Signature must overlay fixed position and not move layout.

## Coordinate Strategy

Recommend using PDF coordinate system.

Document:

- page size
- coordinate origin
- approximate x/y coordinates for each field
- font size recommendation
- checkmark style
- signature image size and position

Do not implement coordinates in code yet unless documenting examples.

## Template Safety

Do not modify:

- contract Word templates
- contract generation
- student hub
- receipt_records table
- RLS
- finance registry UI
- receipt form UI

## Not Included

Do not implement:

- PDF overlay generator
- pdf-lib installation
- receipt creation form
- receipt registry
- student hub receipt section
- storage/upload/download
- void logic
- receipt number generation code

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- runtime template file exists at `src/templates/receipts/toronto-academy-receipt-template.pdf`
- field map document exists
- all overlay fields are documented
- payment method overlay behavior is documented
- notes wording is documented
- signature placement rule is documented
- template limitation is documented if current PDF is value-filled
- no PDF generation code is added
- no app UI is changed
- no schema/RLS changes are made
- `npm run lint` passes if run
- `npm run build` passes if run

## Final Notes

### Runtime template confirmed

- Runtime template now exists at
  `src/templates/receipts/toronto-academy-receipt-template.pdf`.
- It was created by copying the reference sample receipt into the runtime
  folder. Only the file was copied and renamed; no PDF content was edited.
- Page size confirmed as US Letter portrait, MediaBox `[ 0 0 612 792 ]`,
  single page. Origin assumed bottom-left (pdf-lib convention).

### Field map created

- `docs/blueprint/receipt-pdf-field-map.md` created.
- All required overlay fields documented: `receipt_number`, `student_name`,
  `student_number_display`, `program_information`, `total_amount_paid`,
  `date_of_receipt_top`, `debit_credit_checkbox`, `debit_checkbox`,
  `master_card_checkbox`, `visa_checkbox`, `amex_checkbox`, `paypal_checkbox`,
  `etransfer_checkbox`, `cheque_bank_draft_checkbox`, `cash_label`,
  `cash_checkbox`, `card_holder_name`, `notes`, `signature_image`,
  `bottom_date`.
- Documented: page/template status, blank vs value-filled status, page size,
  coordinate origin assumption, per-field approximate placement, font size
  recommendation, payment method checkbox behavior, cash line overlay
  behavior, notes wording, signature image placement rule, and bottom date
  rule.
- Coordinates are documented as approximate estimates requiring calibration in
  the generator ticket, since the template could not be pixel-rendered in this
  environment.

### Template limitation

- The current runtime template is the value-filled sample receipt
  (`PSW-12500-25-52-01`, student `12552`), not a clean blank template.
- It is suitable for development and field-map calibration only. Before
  production, a clean, value-free blank receipt template must replace this file
  at the same path, preserving the header, footer, payment-method layout, and
  signature area.

### Next ticket recommendation

- FINANCE-04 - Receipt PDF overlay generator: add `pdf-lib`, build
  `src/lib/generate-receipt-pdf.ts`, calibrate the field-map coordinates, and
  implement the numbering, checkbox, cash line, notes, signature image, and
  date rules. Replace the value-filled template with a clean blank template as
  part of, or just before, FINANCE-04.