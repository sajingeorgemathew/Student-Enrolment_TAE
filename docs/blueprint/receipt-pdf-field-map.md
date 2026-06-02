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

- Updated in FINANCE-06-FIX: the runtime template has been cleaned. It is now a
  blank template that contains only the preprinted labels, the static program
  line, the empty payment-method checkboxes, and the footer. It no longer
  carries any sample student values (the old `PSW-12500-25-52-01` / student
  `12552` data, sample checkmarks, and sample signature are gone).
- Confirmed by rendering the template at 150 dpi: every value field is blank
  ("Student Name:", "Student No: PSW", "Total amount Paid:", "Date of Receipt:
  ___ (DD-MM-YYYY)", "Receipt No: PSW-12500-25-", "Notes:", "Date:"), and the
  signature line is empty.
- Important consequence: because the template preprints every label and prefix,
  the generator overlays only the dynamic value into the blank that follows
  each label. It does not redraw labels or prefixes (doing so previously caused
  doubling such as "PSW PSW125315"). See section 4.
- See section 11 (Template Limitation) for the remaining production note.

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

Calibrated in FINANCE-06-FIX. Coordinates are lower-left text baselines (or
checkbox-X anchors) in PDF points, origin bottom-left, page 612 x 792. They were
read from the template's own printed label and checkbox positions (PyMuPDF word
and vector boxes converted to pdf-lib coordinates: `baseline = 792 - box_bottom
+ 2`) and confirmed against rendered cash, e-transfer, and card test receipts.

Because the template preprints every label and prefix, the overlay places only
the dynamic value in the blank that follows each label. Labels and prefixes
(`Receipt No: PSW-12500-25-`, `Student No: PSW`, `Date of Receipt:`,
`(DD-MM-YYYY)`, `Date:`, `Notes:`, `5. Cash`, the program line) are never
redrawn.

| Field | Source (receipt_records) | x | y | Font | Notes |
| --- | --- | --- | --- | --- | --- |
| `receipt_number_suffix` | `receipt_number` | 147 | 594 | 11 bold | Only `{rem}-{seq}`; the `PSW-12500-25-` prefix is preprinted |
| `student_name` | `student_name_snapshot` | 121 | 500 | 11 | Student legal full name |
| `student_number_value` | derived from `student_number_snapshot` | 138 | 478 | 11 | Numeric only, e.g. `125315`; the `PSW` label is preprinted |
| `program_information` | preprinted on template | - | - | - | Not overlaid; template prints `NACC Personal Support Worker (PSW)` |
| `total_amount_paid` | `amount` | 140 | 435 | 11 bold | Currency, for example `$677.00` (no `CAN ` prefix) |
| `date_of_receipt_top` | `receipt_date` | 128 | 413 | 11 | Only the date `DD-MM-YYYY`; the `(DD-MM-YYYY)` hint is preprinted |
| `debit_credit_marker` | card method | 44 | 350 | X 11 | Left margin beside "1." (option 1 has no checkbox of its own) |
| `debit_checkbox` | `card_type = debit` | 259 | 349 | X 11 | Monnex Debit box |
| `master_card_checkbox` | `card_type = master_card` | 350 | 349 | X 11 | Monnex Master Card box |
| `visa_checkbox` | `card_type = visa` | 403 | 350 | X 11 | Monnex Visa box |
| `amex_checkbox` | `card_type = amex` | 462 | 350 | X 11 | Monnex Amex box |
| `paypal_checkbox` | `payment_method = paypal` | 117 | 303 | X 11 | Paypal box (option 2) |
| `etransfer_checkbox` | `payment_method = e_transfer` | 301 | 280 | X 11 | E-transfer box (option 3) |
| `cheque_bank_draft_checkbox` | `payment_method = cheque_bank_draft` | 401 | 258 | X 11 | Cheque/bank draft box (option 4) |
| `cash_checkbox` | `payment_method = cash` | 106 | 235 | X 11 | Cash box (option 5); checked only for cash |
| `card_holder_name` | `student_name_snapshot` | 166 | 327 | 10 | Card payments only, blank otherwise (see section 5) |
| `notes` | `notes_type` mapped to text | 66 | 219 | 10 | Value only, e.g. `Enrolment fee`; `Notes:` is preprinted |
| `signature_image` | selected admin signature | 60 | 164 | image | Implemented in FINANCE-08; sits above the LEFT signature line, inside the left signature block. Lower-left anchor of a 120x45 pt box, image scaled to fit preserving aspect ratio (see section 9) |
| `bottom_date` | `receipt_date` | 428 | 161 | 10 | Only the date `DD-MM-YYYY`; the `Date:` label is preprinted |

Note: the template's option 1 line ("1. Debit/Credit Card type (Monnex):") has
no checkbox of its own; only the four card-type squares (Debit, Master Card,
Visa, Amex) are printed. A card payment is therefore marked with a left-margin X
beside "1." plus the X in the selected card-type box.

Field-by-field detail:

- `receipt_number_suffix`: the template prints `Receipt No: PSW-12500-25-`, so
  the overlay draws only the `{rem}-{seq}` suffix (via
  `formatReceiptNumberSuffix`). The full composed number is still stored in
  `receipt_records.receipt_number`.
- `student_number_value`: the template prints the `PSW` label, so the overlay
  draws only the numeric value (via `formatStudentNumberValue`, which strips any
  `PSW` prefix and separators). The full `PSW 125315` display string is still
  available via `formatStudentNumberDisplay` for UI contexts.
- `program_information`: the template line is static
  (`NACC Personal Support Worker (PSW)`), so the generator does not overlay it.
  Overlaying would duplicate the program text.
- `total_amount_paid`: format `amount` as `$#,##0.00` (no `CAN ` prefix).
- `date_of_receipt_top`: see section 6 for the exact date handling.

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

- `date_of_receipt_top` (top of receipt): the visible line is
  `DD-MM-YYYY (DD-MM-YYYY)`, for example `02-07-2025 (DD-MM-YYYY)`. Confirmed in
  FINANCE-06-FIX: the literal `(DD-MM-YYYY)` segment is preprinted on the
  template, so the overlay draws only the real date `DD-MM-YYYY` in the blank
  before it (`formatReceiptTopDate`).
- `bottom_date` (near signature): the visible line is `Date: DD-MM-YYYY`, for
  example `Date: 02-07-2025`. The `Date:` label is preprinted, so the overlay
  draws only the real date `DD-MM-YYYY` (`formatReceiptBottomDate`).
- Both dates use `receipt_records.receipt_date` (the date printed on the
  receipt). Never generate a random date. Use the admin-entered or selected
  date.

---

## 7. Cash Line Overlay Behavior

- Confirmed in FINANCE-06-FIX: the runtime template preprints the
  `5. Cash` line and its checkbox, so the generator does not overlay a Cash
  label. It only draws the `cash_checkbox` X (centered in the printed box at
  x 106, y 235) when `payment_method = cash`.
- The label overlay is retained as a guarded fallback only
  (`OVERLAY_CASH_LABEL`, default `false`). If a future template ever drops the
  Cash line, set the flag to `true` to overlay `5. Cash`.
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

- Status (FINANCE-08): implemented. The generator now accepts an optional
  signature image (`ReceiptPdfInput.signatureImage`: raw bytes plus mime type)
  and embeds it. A typed signer name is never printed. When no signature is
  supplied the signature line stays blank.
- Signature source: the admin selects an active signature from
  `public.admin_signatures` in the new receipt form. The generation route reads
  the image from the private `admin-signatures` bucket and passes the bytes to
  the generator. The approved Cloudinary URLs from the original blueprint are no
  longer used; signatures are managed through ADMIN-SIGNATURE-01.
- Supported types: PNG and JPEG only. pdf-lib (`embedPng` / `embedJpg`) cannot
  embed WebP, so a WebP signature is rejected with a clear error before
  generation, even though WebP is an allowed signature upload type. If WebP
  support is needed later, convert it to PNG/JPEG in a follow-up ticket.
- Placement: fixed overlay above the LEFT signature line (the
  "(Signature of Admission Officer, Registrar, Agent)" line), inside the left
  signature block. Lower-left anchor `x = 60`, `y = 164`, inside a fixed box
  about 120 pt wide by 45 pt tall. The embedded image is scaled to fit the box
  preserving aspect ratio (`scale = min(boxW/imgW, boxH/imgH)`). The box rests
  just above the underline (the left line baseline is ~`y 160`, x range 36-216)
  and stays clear of the Notes line above it (~`y 217`) and the printed label
  below it (~`y 138-152`). It must not sit near the bottom Date field on the
  right (the `Date:` line spans x 400-515 at ~`y 160`); the signature overlays
  the left signature line only, and a typed signer name is never printed.
- The signature overlays at a fixed position and never pushes, shifts, or
  reflows other content. It is drawn on top of the existing template.
- The selected signature id is stored on `receipt_records.signature_id`
  (migration `20260603_finance_08_receipt_signature_id.sql`) for audit. The
  image itself is not copied into `receipt_records`; the generated PDF already
  carries the overlaid image.

---

## 10. Bottom Date Rule

- The `bottom_date` sits in the signature footer band, near the signature
  image, on the date line.
- Format: `Date: DD-MM-YYYY`.
- Source: `receipt_records.receipt_date`.
- Drawn as a fixed overlay; does not move layout.

---

## 11. Template Limitation

- Resolved in FINANCE-06-FIX. The runtime template
  `src/templates/receipts/toronto-academy-receipt-template.pdf` is now a clean
  blank template: the sample student values (`PSW-12500-25-52-01`, student
  `12552`, sample checkmarks, sample signature) have been removed, leaving only
  the labels, the static program line, the empty checkboxes, and the footer.
  Generated receipts no longer show two sets of values.
- The coordinates in section 4 are now calibrated against this clean template,
  so no re-calibration is required for the current file.
- Remaining production notes:
  - The cleaned template was produced programmatically (pypdf) and lives in the
    working tree for this ticket; commit it as the production template.
  - The program line `NACC Personal Support Worker (PSW)` is preprinted and
    static. That is correct for PSW receipts; a different program would need a
    different template or an overlaid program value.
  - The `(DD-MM-YYYY)` hint next to the top date is a preprinted artifact from
    the original layout. It is harmless (the real date is overlaid before it),
    but it could be removed from the template for a cleaner look if desired.

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
