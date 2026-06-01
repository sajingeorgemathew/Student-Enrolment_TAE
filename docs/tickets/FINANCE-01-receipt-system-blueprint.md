# FINANCE-01 - Receipt System Blueprint and Data Placement

## Goal

Create a blueprint for adding payment receipt generation to the campus management system.

This is a planning and documentation ticket only.

Do not implement receipt generation yet.

## Main Product Direction

Receipts are separate from the contract payment schedule.

The contract payment schedule remains part of the student enrolment contract.

Receipts are finance records linked to a student file.

The student hub should show receipts that belong to that student only.

The Finance module should provide an admin workspace to search, filter, generate, view, download, and manage receipts across all students.

## Reference Files

Use these reference files if present:

- `_reference/source-files/receipts/toronto-academy-receipt-template.pdf`
- uploaded receipt generation context
- uploaded sample receipt PDF

The original receipt PDF should be treated as the visual target.

## PDF Generation Direction

The receipt PDF should use the original receipt PDF as a background/template.

Overlay only dynamic values.

Do not rebuild the receipt from scratch.

Do not redesign the receipt.

Preserve:

- header
- footer
- payment option layout
- signature area
- original visual appearance

Overlay fields:

- Receipt No
- Student Name
- Student No
- Total amount Paid
- Date of Receipt
- Payment method checkmarks
- Card Holder Name only for card payments
- Cash line
- Notes
- Signature image
- Bottom date

## Receipt Number Rule

Receipt numbers must follow this format:

`PSW-12500-25-{digits_after_125}-{sequence}`

Student ID normally starts with `125`.

To create the receipt number:

1. Take the student ID.
2. Remove the starting `125`.
3. Keep whatever digits remain.
4. Do not remove leading zeros from the remaining digits.
5. Add the receipt sequence as two digits.

Examples:

- `125191` first receipt -> `PSW-12500-25-191-01`
- `125191` second receipt -> `PSW-12500-25-191-02`
- `12505` first receipt -> `PSW-12500-25-05-01`
- `12505` second receipt -> `PSW-12500-25-05-02`
- `1257` first receipt -> `PSW-12500-25-7-01`

Sequence rule:

- `01` is the first receipt for that student
- `02` is the second receipt for that student
- continue in order

Admin-controlled correction should be supported later for historical missing receipt sequence gaps.

Example:

Existing receipts:

- `PSW-12500-25-05-01`
- `PSW-12500-25-05-02`
- `PSW-12500-25-05-04`

If the missing third receipt is added later, admin should be able to generate:

- `PSW-12500-25-05-03`

not automatically force:

- `PSW-12500-25-05-05`

## Student Number Display Rule

On the receipt, Student No must show the PSW prefix before the student ID.

Example:

`Student No: PSW 125191`

Do not show only:

`125191`

## Date Format Rule

Top date:

`DD-MM-YYYY (DD-MM-YYYY)`

Example:

`19-12-2025 (DD-MM-YYYY)`

Bottom date near signature:

`Date: 19-12-2025`

For live production receipts, use the actual payment date entered or selected by admin.

Do not generate random dates.

## Payment Method Rules

Payment options:

1. Debit/Credit Card type (Monnex): Debit, Master Card, Visa, Amex
2. Paypal
3. E transfer/interac to admin@torontoacademy.ca
4. Cheque/Certified Bank draft in favor of Toronto Academy of Education
5. Cash

Cash must appear on every receipt as an overlay if it is not part of the original PDF template.

For cash payments:

- Cash is checked
- other methods are unchecked

For e-transfer:

- E-transfer is checked
- Cash is unchecked
- card options are unchecked

For debit/credit card:

- main Debit/Credit Card option is checked
- only the selected card type is checked
- student name is printed on Card Holder Name line
- cardholder name is not printed anywhere else

For Paypal:

- only Paypal is checked

For cheque/certified bank draft:

- only cheque/certified bank draft is checked

## Notes Wording

Allowed notes values:

- Enrolment fee
- Installment payment
- Late fee payment / Installment payment

Display as:

- `Notes: Enrolment fee`
- `Notes: Installment payment`
- `Notes: Late fee payment / Installment payment`

## Signature Rules

Use signature image only.

Do not print a typed signer name under the signature.

Approved signature images:

Signature A:

`https://res.cloudinary.com/dfxihtsvj/image/upload/v1780005334/Screenshot_2025-04-05_144725_fbqubx.png`

Signature B:

`https://res.cloudinary.com/dfxihtsvj/image/upload/v1780054291/signature_sgm__4_-removebg-preview_fttasu.png`

The signature should be placed in a fixed overlay position.

Do not let signature push anything down.

## Product Placement

Student hub:

- show receipts for that specific student only
- show latest receipt
- show total receipts
- show total receipted amount
- admin/super_admin can generate receipt from student hub later
- sales/viewer should not generate receipts

Finance module:

- provide receipt registry across all students
- searchable and filterable
- filters should include student name, student number, batch, program, receipt number, payment date, receipt date, payment method, notes type, generated by, and void status

## Admin Permissions

Admin/super_admin:

- can create receipt records
- can generate receipt PDFs
- can view/download receipts
- can void receipt with reason later

Sales:

- no receipt generation
- no receipt voiding
- view permissions to be decided later

Viewer:

- read-only or no access based on current role policy
- no generation
- no download unless explicitly allowed later

## Storage Direction

The blueprint should decide the safest MVP storage path.

Options:

1. Metadata only plus immediate download
2. Metadata plus generated PDF saved to Supabase Storage

Preferred production direction:

- save receipt metadata
- save PDF to storage if storage path is safe and file size is acceptable
- allow download from student hub and finance registry
- support voiding with reason

## Not Included

Do not implement:

- receipt database tables
- receipt generator
- PDF overlay
- receipt storage
- receipt forms
- student hub receipt section
- finance receipt registry
- voiding logic
- payment import
- contract payment schedule changes
- Word contract changes
- Supabase migrations
- RLS changes

## Deliverable

Create:

- `docs/blueprint/receipt-system-integration.md`

The blueprint must recommend:

- routes
- data model
- storage strategy
- PDF template location
- receipt numbering logic
- student hub placement
- finance registry filters
- permission rules
- next ticket order

## Acceptance Criteria

- receipt rules are documented
- receipt number logic is documented
- student hub placement is documented
- finance registry placement is documented
- PDF overlay approach is documented
- storage options are compared
- admin-only rules are documented
- next implementation tickets are listed
- no business logic is implemented
- no schema changes are made
- no contract workflow is changed

## Blueprint Summary (FINANCE-01 complete)

Deliverable created: `docs/blueprint/receipt-system-integration.md`

Key decisions:

- Placement: receipts mount under the existing Finance tile at
  `/dashboard/admin-tools/finance/receipts` (registry) and `.../receipts/new`
  (generate). The student hub at
  `src/app/dashboard/students/[studentId]/page.tsx` gets a summary-only
  Receipts section after Fees and near the Contract section.
- Data model: new `receipt_records` table (recommendation only, not created)
  with `receipt_number`, `student_id`, `application_id`, `batch_id`,
  `program_id`, `amount`, `payment_date`, `receipt_date`, `payment_method`,
  `card_type`, `notes_type`, `pdf_storage_path`, `generated_by`,
  `generated_at`, `voided_at`, `voided_by`, `void_reason`, plus
  `receipt_sequence` and name/number snapshots. RLS follows the
  `contract_generations` pattern.
- Numbering: `PSW-12500-25-{digits_after_125}-{sequence}`, sequence per
  student, admin-overridable for historical gap correction, enforced by a
  unique `(student_id, receipt_sequence)` constraint.
- PDF: overlay only on a clean template stored at
  `src/templates/receipts/`, using a new `pdf-lib` dependency. No PDF library
  is installed today. Signature is an embedded image at a fixed position.
- Storage: target Option 2 (private `receipt-documents` bucket plus metadata,
  modeled on `student-documents`); Option 1 (metadata plus immediate
  download) is an acceptable first step since `pdf_storage_path` is nullable.
- Permissions: admin/super_admin create, generate, download, and void with
  reason. Sales and viewer cannot generate or void. Soft-void only; issued
  numbers are never reused.

Reference note: the file present is
`_reference/source-files/receipts/2nd_july_2025_12552_PSW-12500-25-52-01.pdf`,
not the `toronto-academy-receipt-template.pdf` name used in this ticket. It is
the visual target and confirms the numbering rule (student `12552` ->
`PSW-12500-25-52-01`).

### Next ticket order

1. FINANCE-02 - Receipt data model and RLS
2. FINANCE-03 - Receipt PDF template and field map
3. FINANCE-04 - Receipt PDF overlay generator
4. FINANCE-05 - Finance receipt registry UI
5. FINANCE-06 - New receipt form and generation flow
6. FINANCE-07 - Storage and download
7. FINANCE-08 - Student hub receipt summary section
8. FINANCE-09 - Void with reason