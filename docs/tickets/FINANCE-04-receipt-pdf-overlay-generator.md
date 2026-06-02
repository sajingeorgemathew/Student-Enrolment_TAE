# FINANCE-04 - Receipt PDF Overlay Generator

## Goal

Create the server-side receipt PDF overlay generator.

This ticket builds the generator library only.

Do not add receipt UI, API routes, finance registry, student hub receipt section, or storage upload yet.

## Blueprint Source

Use:

- `docs/blueprint/receipt-system-integration.md`
- `docs/blueprint/receipt-pdf-field-map.md`
- `docs/tickets/FINANCE-01-receipt-system-blueprint.md`
- `docs/tickets/FINANCE-02-receipt-data-model-rls.md`
- `docs/tickets/FINANCE-03-receipt-pdf-template-field-map.md`

## Runtime Template

Use:

`src/templates/receipts/toronto-academy-receipt-template.pdf`

Important:

The current template may be a value-filled sample. Use it for development/calibration only.

Do not redesign the receipt.

Do not rebuild the receipt from scratch.

Overlay only dynamic values.

## Scope

Create:

- receipt PDF generation library
- receipt formatting helpers
- receipt number helper
- payment method marker helper
- date formatting helper
- notes formatting helper
- basic test/demo script if safe

Suggested files:

- `src/lib/receipts/generate-receipt-pdf.ts`
- `src/lib/receipts/receipt-formatters.ts`
- `src/lib/receipts/receipt-types.ts`

Add dependency if needed:

- `pdf-lib`

## Receipt Number Rule

Receipt number format:

`PSW-12500-25-{digits_after_125}-{sequence}`

Rules:

- student number normally starts with `125`
- remove the starting `125`
- keep whatever remains
- do not remove leading zeros from the remaining digits
- sequence is two digits

Examples:

- `125191`, sequence `1` -> `PSW-12500-25-191-01`
- `12505`, sequence `1` -> `PSW-12500-25-05-01`
- `1257`, sequence `1` -> `PSW-12500-25-7-01`

If student number does not start with `125`, document fallback behavior.

## Student Number Display Rule

Display:

`PSW 125191`

not only:

`125191`

## Date Format Rule

Top date:

`DD-MM-YYYY (DD-MM-YYYY)`

Bottom date:

`Date: DD-MM-YYYY`

Use the payment date from the receipt input.

Do not generate random dates.

## Notes Rule

Allowed notes values and display text:

- `enrolment_fee` -> `Notes: Enrolment fee`
- `installment_payment` -> `Notes: Installment payment`
- `late_fee_payment_installment_payment` -> `Notes: Late fee payment / Installment payment`

## Payment Method Rule

Supported payment methods:

- `cash`
- `e_transfer`
- `debit`
- `master_card`
- `visa`
- `amex`
- `paypal`
- `cheque_bank_draft`

Overlay behavior:

Cash:

- check Cash only

E-transfer:

- check E-transfer only

Debit:

- check main Debit/Credit Card option
- check Debit only
- card holder name = student name

Master Card:

- check main Debit/Credit Card option
- check Master Card only
- card holder name = student name

Visa:

- check main Debit/Credit Card option
- check Visa only
- card holder name = student name

Amex:

- check main Debit/Credit Card option
- check Amex only
- card holder name = student name

Paypal:

- check Paypal only

Cheque/bank draft:

- check Cheque/Certified Bank Draft only

## Cash Line Rule

The Cash line must appear on every receipt.

If the background template does not include Cash, overlay:

`5. Cash`

and add a checkbox/marker.

## Signature Rule

Use signature image only.

Do not print a typed signer name.

Approved signatures:

Signature A:

`https://res.cloudinary.com/dfxihtsvj/image/upload/v1780005334/Screenshot_2025-04-05_144725_fbqubx.png`

Signature B:

`https://res.cloudinary.com/dfxihtsvj/image/upload/v1780054291/signature_sgm__4_-removebg-preview_fttasu.png`

For this ticket:

- do not fetch remote signature at runtime unless existing app pattern supports it safely
- prefer local placeholder or document that signature image fetch/storage will be handled in next ticket if needed

## Generator Input

Create a type similar to:

```ts
export type ReceiptPdfInput = {
  receiptNumber: string;
  studentName: string;
  studentNumber: string;
  programInformation: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod:
    | "cash"
    | "e_transfer"
    | "debit"
    | "master_card"
    | "visa"
    | "amex"
    | "paypal"
    | "cheque_bank_draft";
  notesType:
    | "enrolment_fee"
    | "installment_payment"
    | "late_fee_payment_installment_payment";
  signatureVariant?: "A" | "B";
};
```

## Implementation Notes (FINANCE-04)

### Files created

- `src/lib/receipts/receipt-types.ts` - shared types (`ReceiptPdfInput`,
  payment method and notes unions, card-method helper).
- `src/lib/receipts/receipt-formatters.ts` - pure formatting helpers (no PDF
  dependency).
- `src/lib/receipts/generate-receipt-pdf.ts` - the overlay generator
  (`generateReceiptPdf`).
- `scripts/test-receipt-pdf.ts` - dev-only demo, not wired to any route.

### Files modified

- `package.json` / `package-lock.json` - added `pdf-lib`.
- `.gitignore` - ignore `/scripts/output` (demo output).

### Dependency added

- `pdf-lib` `^1.17.1` (pure JS, runs in the Next.js server runtime, loads an
  existing PDF and overlays text). No native or font-file dependency.

### Generator behavior

- `generateReceiptPdf(input)` reads
  `src/templates/receipts/toronto-academy-receipt-template.pdf` via
  `fs.readFileSync` (same runtime template pattern as the contract DOCX
  generator), loads it with pdf-lib, overlays only dynamic values, and returns
  the PDF bytes (`Uint8Array`). No storage, upload, DB, or API work.
- Overlaid: receipt number, top date, student name, student number display,
  program information, total amount, payment method checkmarks, cash line
  label, cash checkmark, card holder name (card payments only), notes, bottom
  date.
- Checkmark style: a bold Helvetica `X` drawn over the template checkbox. A
  core font is used so no special font dependency is needed.
- Coordinates live in a single `COORDS` constant grouped by band, copied from
  the field map, so calibration is one reviewable edit.

### Receipt helper behavior

- `formatReceiptNumber(studentNumber, sequence)` - strips a leading `125`,
  keeps the remainder with leading zeros, pads sequence to two digits:
  `125191`/`1` -> `PSW-12500-25-191-01`, `12505`/`1` -> `PSW-12500-25-05-01`,
  `1257`/`1` -> `PSW-12500-25-7-01`. Fallback: if the number does not start
  with `125`, the full digit string is used as the remainder.
- `formatStudentNumberDisplay` - always prefixes `PSW ` (never bare number;
  does not double an existing `PSW` prefix).
- `formatReceiptTopDate` - `DD-MM-YYYY (DD-MM-YYYY)` (real date plus the literal
  reference hint).
- `formatReceiptBottomDate` - `Date: DD-MM-YYYY`.
- `formatAmount` - `CAN $1,250.00` (en-CA, two decimals).
- `formatNotes` - maps the three allowed `notes_type` values to their exact
  display strings (normal hyphen and forward slash only).
- `resolvePaymentMarkers` - payment method marker resolver. Card brands
  (`debit`, `master_card`, `visa`, `amex`) check the main Debit/Credit Card box
  plus the matching sub-option and flag the card holder name line; `cash`,
  `e_transfer`, `paypal`, `cheque_bank_draft` each check exactly one box.

### Signature handling decision

- No remote signature fetch in this ticket. Fetching the approved Cloudinary
  images at runtime would add a network dependency to the generator, so it is
  deferred. The approved URLs are kept in `SIGNATURE_IMAGE_URLS` and a
  documented `TODO(FINANCE-07)` marks where `page.drawImage` should embed the
  selected variant. A typed signer name is never printed.

### Template limitation

- The runtime template is still the value-filled sample receipt
  (`PSW-12500-25-52-01`, student `12552`). Overlaying on it produces two sets of
  values; this is acceptable for development/calibration only. A clean,
  value-free blank template must replace the file at the same path before
  production.

### Coordinate calibration limitation

- All coordinates are the approximate field-map estimates and are not yet
  calibrated to the rendered template. The cash line is always overlaid because
  it is not yet confirmed whether Cash is preprinted. Run the field-map
  section 2 calibration (gridlines, nudge, lock) against the rendered template,
  and re-check after the blank template lands.

### Next ticket

- FINANCE-05 (finance receipt registry UI) per the blueprint order. Signature
  image embedding and PDF storage are handled in FINANCE-07.