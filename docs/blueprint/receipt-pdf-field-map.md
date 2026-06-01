# Receipt PDF Field Map

Blueprint for overlaying dynamic values on the Toronto Academy receipt PDF.

Runtime template: `src/templates/receipts/toronto-academy-receipt-template.pdf`

Reference PDF: `_reference/source-files/receipts/2nd_july_2025_12552_PSW-12500-25-52-01.pdf`

Data model: `public.receipt_records` (migration
`supabase/migrations/20260601_finance_02_receipt_records.sql`)

Generator code: not built yet (planned FINANCE-04, see
`docs/blueprint/receipt-system-integration.md` section 14).

This is a planning and template-placement document only. No generator code,
API route, UI, or schema change is introduced by this ticket.

---

## 1. Template and Page Status

### Template status

- A runtime template now exists at
  `src/templates/receipts/toronto-academy-receipt-template.pdf`.
- It was created by copying the reference sample receipt into the runtime
  folder. No PDF content was edited; only the file was copied and renamed.
- The reference sample remains at
  `_reference/source-files/receipts/2nd_july_2025_12552_PSW-12500-25-52-01.pdf`
  as the visual target.

### Blank or value-filled

- The current runtime template is value-filled (sample), not a clean blank
  template. It still carries the sample student values from receipt
  `PSW-12500-25-52-01` (student `12552`).
- This is a temporary template used so the field map and future generator can
  be developed against the real layout.
- See section 11 (Template Limitation) for the production replacement
  recommendation.

### Page size

- Inspectable. The PDF MediaBox is `[ 0 0 612 792 ]`.
- That is US Letter portrait: 612 pt wide by 792 pt tall (8.5 in by 11 in at
  72 pt per inch).
- Single page (one `/Type /Page`).

### Coordinate origin assumption

- Assume the standard PDF coordinate system used by pdf-lib: origin `(0, 0)` at
  the bottom-left corner of the page.
- `x` increases to the right (0 to 612).
- `y` increases upward (0 to 792).
- All coordinates below are the lower-left anchor of the drawn text or image,
  which is how pdf-lib `drawText` and `drawImage` position content.

---

## 2. Coordinate Strategy and Calibration Note

The coordinates in this document are approximate placement estimates. The
environment used to write this map cannot render the PDF to pixels, so exact
x/y values must be calibrated in the generator ticket (FINANCE-04) by drawing
to a test overlay and comparing against the reference receipt.

Recommended calibration method:

1. Load the template with pdf-lib and read the real page size (expected
   612 x 792).
2. Draw faint gridlines or crosshair markers at 50 pt intervals on a throwaway
   copy.
3. Nudge each field to sit on its existing printed label or blank line in the
   template.
4. Lock the values into the generator constants once they match the reference.

Placement strategy by band (top of page is `y = 792`):

- Header and receipt identity band: roughly `y` 700 to 760.
- Student and program band: roughly `y` 600 to 690.
- Amount and top date band: roughly `y` 560 to 610.
- Payment method block (checkboxes): roughly `y` 360 to 540.
- Card holder name line: roughly `y` 330 to 360.
- Notes line: roughly `y` 250 to 300.
- Signature image and bottom date band: roughly `y` 90 to 180.

These bands are starting guesses based on a one-page Letter receipt with a
header, an identity block, a payment-method list, and a signature footer. Treat
every number as provisional until calibrated.

---

## 3. Font Size Recommendation

- Body overlay text: 10 to 11 pt, regular weight.
- Receipt number and total amount: 11 to 12 pt, bold if it matches the
  template emphasis, so the key values stand out.
- Notes line and card holder name: 10 pt.
- Bottom date: 10 pt.
- Use a standard core font (Helvetica) embedded by pdf-lib so no external font
  file is required. Match the template's apparent sans-serif look.
- Keep all overlay values on a single line. If a value is long (long program
  name or long student name), reduce the font by 1 to 2 pt rather than wrapping,
  to avoid disturbing the fixed layout.

---

## 4. Overlay Field Map

Coordinates are approximate lower-left anchors in PDF points, origin
bottom-left, page 612 x 792. `x` and `y` are estimates to be calibrated.

| Field | Source (receipt_records) | Approx x | Approx y | Font | Notes |
| --- | --- | --- | --- | --- | --- |
| `receipt_number` | `receipt_number` | 400 | 730 | 11 to 12 bold | Full number, format `PSW-12500-25-{rem}-{seq}` |
| `student_name` | `student_name_snapshot` | 150 | 660 | 10 to 11 | Student legal full name |
| `student_number_display` | derived from `student_number_snapshot` | 150 | 635 | 10 to 11 | Always `PSW 125191`, never bare `125191` |
| `program_information` | `program_id` join (program name) | 150 | 610 | 10 to 11 | Program name and relevant program info |
| `total_amount_paid` | `amount` | 400 | 590 | 11 to 12 bold | Currency, for example `CAN $1,250.00` |
| `date_of_receipt_top` | `receipt_date` | 400 | 700 | 10 to 11 | Format `DD-MM-YYYY (DD-MM-YYYY)` |
| `debit_credit_checkbox` | `payment_method = card` | 90 | 510 | checkmark | Main Debit/Credit Card option |
| `debit_checkbox` | `card_type = debit` | 130 | 488 | checkmark | Monnex sub-option |
| `master_card_checkbox` | `card_type = master_card` | 130 | 466 | checkmark | Monnex sub-option |
| `visa_checkbox` | `card_type = visa` | 130 | 444 | checkmark | Monnex sub-option |
| `amex_checkbox` | `card_type = amex` | 130 | 422 | checkmark | Monnex sub-option |
| `paypal_checkbox` | `payment_method = paypal` | 90 | 400 | checkmark | Primary method |
| `etransfer_checkbox` | `payment_method = e_transfer` | 90 | 378 | checkmark | Primary method, to admin@torontoacademy.ca |
| `cheque_bank_draft_checkbox` | `payment_method = cheque_bank_draft` | 90 | 356 | checkmark | Primary method |
| `cash_label` | static overlay | 70 | 334 | 10 | Cash line text, overlaid if not preprinted (see section 7) |
| `cash_checkbox` | `payment_method = cash` | 90 | 334 | checkmark | Checked only for cash |
| `card_holder_name` | `student_name_snapshot` | 200 | 345 | 10 | Card payments only, blank otherwise (see section 5) |
| `notes` | `notes_type` mapped to text | 90 | 275 | 10 | Allowed wording only (see section 8) |
| `signature_image` | fixed approved image | 380 | 110 | image | Drawn image, fixed box (see section 9) |
| `bottom_date` | `receipt_date` | 120 | 110 | 10 | Format `Date: DD-MM-YYYY` (see section 10) |

Field-by-field detail:

- `receipt_number`: display the full composed number. Never show only the
  sequence or only the remainder.
- `student_number_display`: build the display string by prefixing `PSW ` to the
  stored student number. Source value is `student_number_snapshot`.
- `program_information`: the program name (and any short program context that
  the template line expects). Sourced via the receipt record's `program_id`
  relation at generation time.
- `total_amount_paid`: format `amount` as Canadian currency. Right-align near
  the amount line if the template label sits to the left.
- `date_of_receipt_top`: see section 6 for the exact date format.

---

## 5. Payment Method Checkbox Behavior

Exactly one primary payment method is checked per receipt. The primary methods
are: card (Debit/Credit Card), paypal, e_transfer, cheque_bank_draft, cash.

Rules:

- Card payment (`payment_method = card`):
  - Check `debit_credit_checkbox` (the main Debit/Credit Card option).
  - Check exactly one card-type sub-option matching `card_type`:
    `debit_checkbox`, `master_card_checkbox`, `visa_checkbox`, or
    `amex_checkbox`.
  - Write the student name on the `card_holder_name` line and nowhere else.
  - Leave paypal, e_transfer, cheque_bank_draft, and cash unchecked.
- Paypal (`payment_method = paypal`):
  - Check `paypal_checkbox` only. All other boxes unchecked.
  - `card_holder_name` stays blank.
- E-transfer (`payment_method = e_transfer`):
  - Check `etransfer_checkbox` only. Card options and cash unchecked.
  - `card_holder_name` stays blank.
- Cheque or certified bank draft (`payment_method = cheque_bank_draft`):
  - Check `cheque_bank_draft_checkbox` only.
  - `card_holder_name` stays blank.
- Cash (`payment_method = cash`):
  - Check `cash_checkbox` only. All card options, paypal, e_transfer, and
    cheque unchecked.
  - `card_holder_name` stays blank.

Card-type sub-options (`debit_checkbox`, `master_card_checkbox`,
`visa_checkbox`, `amex_checkbox`) are only ever checked when
`payment_method = card`. When the method is not card, none of the card-type
boxes are checked, regardless of `card_type`.

Note on stored values: the `receipt_records.payment_method` constraint allows
`cash`, `e_transfer`, `debit`, `master_card`, `visa`, `amex`, `paypal`,
`cheque_bank_draft`. When the stored method is one of the card brands
(`debit`, `master_card`, `visa`, `amex`) the generator treats it as a card
payment: it checks `debit_credit_checkbox` plus the matching card-type box. The
generator ticket should define one consistent mapping (either store
`payment_method = card` with a separate `card_type`, or derive card from the
brand value) and document it. This field map assumes the card brand drives both
the main card checkbox and the matching sub-option.

Checkmark style:

- Draw a simple check or X glyph, or a small filled mark, sized about 8 to
  10 pt, positioned over the existing template checkbox.
- Do not redraw or move the checkbox graphics from the template. Overlay the
  mark only.

---

## 6. Date Rules

- `date_of_receipt_top` (top of receipt): format `DD-MM-YYYY (DD-MM-YYYY)`,
  for example `02-07-2025 (DD-MM-YYYY)`. The literal `(DD-MM-YYYY)` hint mirrors
  the reference receipt layout; the generator ticket should confirm whether the
  second segment is a literal hint or a second real date and lock the format.
- `bottom_date` (near signature): format `Date: DD-MM-YYYY`, for example
  `Date: 02-07-2025`.
- Both dates use `receipt_records.receipt_date` (the date printed on the
  receipt). Never generate a random date. Use the admin-entered or selected
  date.

---

## 7. Cash Line Overlay Behavior

- The reference layout lists Cash as a payment option. If the runtime template
  does not already print a Cash line, the generator overlays a `cash_label`
  text ("Cash") plus the `cash_checkbox` so Cash always appears as a selectable
  option on every receipt.
- If the template already prints the Cash line, the generator skips the
  `cash_label` overlay and only draws the `cash_checkbox` mark when the payment
  method is cash.
- The generator ticket must confirm, against the calibrated template, whether
  Cash is preprinted. Until confirmed, treat `cash_label` as an overlay that
  may be needed.
- `cash_checkbox` is checked only when `payment_method = cash`.

---

## 8. Notes Wording

The notes line shows one of these exact strings, and nothing else:

- `Notes: Enrolment fee` (from `notes_type = enrolment_fee`)
- `Notes: Installment payment` (from `notes_type = installment_payment`)
- `Notes: Late fee payment / Installment payment`
  (from `notes_type = late_fee_payment_installment_payment`)

Rules:

- Use normal hyphens and a forward slash only. No em dash, no decorative
  characters.
- Map the stored `notes_type` enum value to the display string above. Do not
  free-type notes.

---

## 9. Signature Image Placement Rule

- Use a signature image only. Do not print a typed signer name anywhere on the
  receipt.
- Approved signature images (from the blueprint):
  - Signature A:
    `https://res.cloudinary.com/dfxihtsvj/image/upload/v1780005334/Screenshot_2025-04-05_144725_fbqubx.png`
  - Signature B:
    `https://res.cloudinary.com/dfxihtsvj/image/upload/v1780054291/signature_sgm__4_-removebg-preview_fttasu.png`
- Placement: fixed overlay box in the signature footer area, approximately
  lower-left anchor `x = 380`, `y = 110` (to be calibrated).
- Recommended image box: about 120 pt wide by 45 pt tall, preserving aspect
  ratio. Scale the embedded PNG to fit this box.
- The signature must overlay at a fixed position and must not push, shift, or
  reflow any other content. It is drawn on top of the existing template, not
  inserted into a flowing layout.

---

## 10. Bottom Date Rule

- The `bottom_date` sits in the signature footer band, near the signature
  image, on the date line.
- Format: `Date: DD-MM-YYYY`.
- Source: `receipt_records.receipt_date`.
- Drawn as a fixed overlay; does not move layout.

---

## 11. Template Limitation

- The current runtime template
  `src/templates/receipts/toronto-academy-receipt-template.pdf` is the
  value-filled sample receipt (`PSW-12500-25-52-01`, student `12552`), not a
  clean blank template.
- Overlaying new values on top of a template that already shows sample student
  data would produce a receipt with two sets of values (the printed sample plus
  the overlay). This is acceptable for development and field-map calibration
  only.
- Before production, a clean, value-free blank receipt template must replace
  this file at the same path. The blank template should keep the header,
  footer, payment-method layout, and signature area, but remove all sample
  student values (receipt number, name, student number, program, amount, dates,
  checkmarks, notes, and signature).
- Once the blank template is in place, re-run the calibration in section 2,
  since exact label positions may shift slightly between the sample and the
  clean template.

---

## 12. Out of Scope for This Ticket

Not implemented here (per FINANCE-03 scope):

- PDF overlay generator code.
- `pdf-lib` installation.
- API routes.
- Receipt form UI, finance registry UI, student hub receipt section.
- Storage, upload, download, void logic.
- Receipt number generation code.
- Schema or RLS changes (`receipt_records` migration is unchanged).
- Contract generation, Word templates, payment schedule.

---

## 13. Next Ticket Recommendation

FINANCE-04 - Receipt PDF overlay generator:

- Add `pdf-lib`.
- Build `src/lib/generate-receipt-pdf.ts` to load the runtime template and
  overlay the fields in this map.
- Calibrate the approximate coordinates in section 4 against the rendered
  template.
- Implement the receipt number, student-number display, date formatting,
  checkbox, cash line, notes, and signature image rules.
- Replace the value-filled template with a clean blank template (section 11)
  as part of, or just before, FINANCE-04.
