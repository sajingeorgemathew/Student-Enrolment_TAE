# FINANCE-06 - New Receipt Form and Generation Flow

## Goal

Create the admin-only new receipt form and generation flow.

Admin/super_admin should be able to create one receipt for one student, save receipt metadata, generate the PDF, and download it immediately.

## Blueprint Source

Use:

- `docs/blueprint/receipt-system-integration.md`
- `docs/blueprint/receipt-pdf-field-map.md`
- `docs/tickets/FINANCE-01-receipt-system-blueprint.md`
- `docs/tickets/FINANCE-02-receipt-data-model-rls.md`
- `docs/tickets/FINANCE-03-receipt-pdf-template-field-map.md`
- `docs/tickets/FINANCE-04-receipt-pdf-overlay-generator.md`
- `docs/tickets/FINANCE-05-receipt-registry-ui.md`

## Main Rule

This ticket creates a single receipt generation flow only.

Do not implement:

- batch receipt generation
- receipt voiding
- receipt storage/download history
- student hub receipt summary
- payment import
- contract payment schedule changes

## Scope

Create:

- `/dashboard/admin-tools/finance/receipts/new`
- admin-only new receipt form
- student selection/search
- receipt input fields
- receipt number preview
- create receipt server action
- immediate PDF download after successful generation
- redirect or return to registry after generation if safe

## Role Rules

Admin/super_admin:

- can open new receipt form
- can create receipt
- can download generated PDF

Sales:

- cannot open new receipt form
- cannot create receipt
- cannot download generated receipt from this form

Viewer:

- cannot open new receipt form
- cannot create receipt

Direct URL access by sales/viewer should be blocked.

## Form Fields

Required:

- student
- amount
- payment date
- payment method
- notes type

Conditional:

- card type only when payment method is card-based
- receipt sequence override only if safe and admin-only

Optional:

- signature variant A or B if generator supports it safely

## Payment Methods

Supported values:

- `cash`
- `e_transfer`
- `debit`
- `master_card`
- `visa`
- `amex`
- `paypal`
- `cheque_bank_draft`

Card handling:

- debit, master_card, visa, and amex are card methods
- card holder name should be student name in the PDF
- do not collect card numbers

## Notes Types

Supported values:

- `enrolment_fee`
- `installment_payment`
- `late_fee_payment_installment_payment`

Display values:

- Enrolment fee
- Installment payment
- Late fee payment / Installment payment

## Receipt Number Logic

Use the receipt number helper from FINANCE-04 if available.

Format:

`PSW-12500-25-{digits_after_125}-{sequence}`

Examples:

- student `125191`, sequence `1` -> `PSW-12500-25-191-01`
- student `12505`, sequence `1` -> `PSW-12500-25-05-01`
- student `1257`, sequence `1` -> `PSW-12500-25-7-01`

Default behavior:

- find the next available receipt sequence for the student
- sequence starts at 1
- sequence displays as two digits in receipt number

Historical gap correction:

- if safe, allow admin/super_admin to override receipt sequence
- prevent duplicate `(student_id, receipt_sequence)`
- prevent duplicate `receipt_number`
- if not implemented in this ticket, document as future work

## Receipt Record Creation

Insert into `receipt_records`:

- student_id
- application_id if available
- program_id if available
- batch_id if available
- receipt_number
- receipt_sequence
- student_name_snapshot
- student_number_snapshot
- amount
- payment_date
- receipt_date
- payment_method
- card_type if needed
- notes_type
- generated_by
- generated_at
- template_version if available
- pdf_storage_path null for now if storage is not implemented yet

## PDF Generation

Use the FINANCE-04 generator.

Generate PDF after receipt record creation.

For this ticket:

- immediate browser download is enough
- storage can remain null
- permanent receipt PDF storage will be handled in FINANCE-07

If PDF generation fails:

- do not leave confusing UI
- show a clear error
- if metadata was already inserted, document whether this should be cleaned later or marked incomplete in future ticket

## Registry Link

After generation:

- admin can return to receipt registry
- registry should show the created receipt record

## Not Included

Do not implement:

- storage bucket
- stored PDF download route
- receipt history download
- void with reason
- regenerate
- batch generation
- student hub receipt summary
- payment import
- contract payment schedule changes
- Word contract changes
- application workflow changes

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- admin/super_admin can open new receipt form
- sales/viewer cannot open new receipt form
- admin can select/search a student
- admin can enter amount, payment date, payment method, and notes type
- receipt number preview is shown
- receipt record is inserted into `receipt_records`
- generated PDF downloads immediately
- receipt appears in registry after creation
- no storage/download history is implemented yet
- no student hub receipt section is added yet
- no contract/payment schedule logic is changed
- `npm run lint` passes
- `npm run build` passes

## Final Implementation Notes

Implemented the admin-only single receipt creation and generation flow.

### Files created

- `src/app/dashboard/admin-tools/finance/receipts/new/page.tsx` - admin-gated
  page that renders the new receipt form. Non-admins get an access message.
- `src/features/receipts/new-receipt-form.tsx` - client form: student
  search/select, amount, payment date, payment method (with conditional card
  type), notes type, signature variant, optional sequence override, live
  receipt number preview, submit, and immediate PDF download.
- `src/features/receipts/new-receipt-actions.ts` - `searchReceiptStudents` and
  `getNextReceiptSequence` server actions, both admin-gated.
- `src/app/api/finance/receipts/generate/route.ts` - admin-only POST route that
  validates input, resolves the sequence, inserts the `receipt_records` row,
  generates the PDF, and streams it back for download.

### Files modified

- `src/app/dashboard/admin-tools/finance/receipts/page.tsx` - added the
  admin-only "New Receipt" button in the registry header.

### New receipt route

`/dashboard/admin-tools/finance/receipts/new` (admin/super_admin only).
Generation runs through `POST /api/finance/receipts/generate`.

### Receipt number behavior

- Format `PSW-12500-25-{digits_after_125}-{sequence}`, reusing
  `formatReceiptNumber` from FINANCE-04 (leading zeros after `125` preserved,
  sequence padded to two digits).
- Default sequence is `max(receipt_sequence) + 1` for the selected student.
- Admin may override the sequence to fill a historical gap. Uniqueness is
  enforced by the database constraints `receipt_records_student_sequence_unique`
  and `receipt_records_receipt_number_unique`.
- The preview is computed live in the form from the selected student number and
  the effective sequence.

### Receipt record insert behavior

- Inserts one `receipt_records` row with `student_id`, resolved
  `application_id` / `program_id` / `batch_id`, `receipt_number`,
  `receipt_sequence`, `student_name_snapshot`, `student_number_snapshot`,
  `amount`, `payment_date`, `receipt_date` (set equal to payment date),
  `payment_method`, `card_type` (set only for card methods), `notes_type`,
  `generated_by`, `generated_at`, and `pdf_storage_path` null.
- Application context uses the student's latest non-archived application
  (newest first); if all are archived the newest is used, and if there is no
  application the receipt is created with `application_id` null.
- The record is inserted before the PDF is generated so the number is reserved.
  If PDF generation then fails, the just-inserted row is deleted so no orphan
  metadata row is left behind.

### PDF download behavior

- The route returns `application/pdf` with a
  `Content-Disposition: attachment` header and an `X-Receipt-Number` header.
- The client triggers an immediate browser download via a blob URL, matching
  the existing contract DOCX download pattern.
- No PDF is stored. `pdf_storage_path` stays null; permanent storage and a
  re-download path are FINANCE-07.

### Role/access behavior

- Page, both server actions, and the POST route all check
  `isAdminOrSuper`. Sales and viewer get an access message on the page, empty
  results from the actions, and 403 from the route, so direct URL access and
  direct POSTs are blocked. Database RLS (admin/super-admin insert only)
  enforces this independently.

### Known limitations

- Signature variant is collected and passed to the generator, but the FINANCE-04
  generator does not yet render a signature image (it accepts the variant
  safely). Signature rendering is deferred to a later ticket.
- `card_type` mirrors the selected card brand because `payment_method` already
  stores the brand; there is no separate generic `card` method value.
- The runtime PDF template is still the value-filled sample from FINANCE-03, so
  generated PDFs overlay on top of sample values until a clean blank template
  replaces it.
- A receipt requires the student to have a `student_number`; the form and route
  both block creation with a clear message otherwise.

### Verification

- `npm run lint` passes.
- `npm run build` passes; `/dashboard/admin-tools/finance/receipts/new` and
  `/api/finance/receipts/generate` are both present in the route list.