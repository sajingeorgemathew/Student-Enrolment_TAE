# FINANCE-09 - Receipt Edit and Hard Delete Controls

## Goal

Give admin/super_admin full correction control over wrong receipts.

Admin/super_admin must be able to edit receipt details, edit receipt sequence, regenerate the PDF, replace the stored PDF, and hard delete wrong receipt records/files.

## Current Context

Receipt generation, storage, registry, and signature overlay have been added.

The current operational need is control:

- if a receipt is wrong, admin/super_admin should be able to fix it
- sequence numbers should not be wasted
- wrong receipt PDFs should be removable to save storage
- wrong receipt records should not remain stuck forever

## Main Product Rule

This is an internal admin finance control feature.

Do not make these controls available to sales or viewer.

## Scope

Add or improve:

- receipt edit page or edit modal
- receipt detail/edit route if needed
- edit receipt metadata
- edit receipt sequence
- recalculate receipt number
- regenerate PDF after edit
- replace stored PDF safely
- hard delete receipt record
- delete stored PDF during hard delete
- confirmation and reason for hard delete
- registry action buttons for Edit and Hard Delete

## Suggested Routes

Use current app route conventions.

Suggested:

- `/dashboard/admin-tools/finance/receipts/[receiptId]/edit`

If a modal pattern is easier and safer, use that.

## Editable Fields

Admin/super_admin can edit:

- student
- amount
- payment date
- receipt date
- payment method
- card type
- notes type
- signature
- receipt sequence

Receipt number should be recalculated from:

- selected student number
- receipt_sequence

Receipt number format:

`PSW-12500-25-{digits_after_125}-{sequence}`

Examples:

- `125315`, sequence `4` -> `PSW-12500-25-315-04`
- `12505`, sequence `3` -> `PSW-12500-25-05-03`

Do not skip sequence unnecessarily.

## Duplicate Rules

System must block:

- duplicate `receipt_number`
- duplicate `(student_id, receipt_sequence)`

But when editing an existing receipt, the record should be allowed to keep its own current receipt number and sequence.

Example:

If editing receipt A and keeping sequence 04, that is allowed.

If changing receipt A to a sequence already used by receipt B for the same student, block it.

## PDF Regeneration Rule

When receipt details are edited:

1. Validate updated receipt details.
2. Generate the new PDF.
3. Upload/replace the stored PDF.
4. Update receipt metadata.
5. Refresh registry.

Do not leave the receipt in a broken state silently.

If new PDF generation fails:

- do not update the receipt metadata
- show clear error

If upload fails:

- show clear error
- do not pretend the receipt was corrected

## Storage Replacement Rule

Existing PDF path pattern:

`{student_id}/receipts/{receipt_number}.pdf`

If the receipt number changes:

- upload the new PDF using the new path
- delete the old PDF if safe
- update `pdf_storage_path`

If the receipt number stays the same:

- overwrite/replace the existing PDF only if current storage helper supports safe upsert
- otherwise delete old PDF then upload new PDF
- document the behavior

## Hard Delete Rule

Admin/super_admin can hard delete wrong receipts.

Hard delete should:

- delete stored PDF from `receipt-documents` if `pdf_storage_path` exists
- delete receipt_records row
- free receipt number
- free student receipt sequence
- remove receipt from registry

Hard delete must require:

- reason for deletion
- typed confirmation: `DELETE RECEIPT`

If storage file delete fails:

- show clear warning/error
- do not silently delete metadata while leaving orphaned file unless explicitly documented and confirmed

## Role Rules

Admin/super_admin:

- can edit receipts
- can regenerate receipt PDF after edit
- can hard delete receipts with confirmation
- can download receipts

Sales:

- no access to receipt registry
- cannot edit
- cannot delete
- cannot regenerate
- cannot download

Viewer:

- no access to receipt registry
- cannot edit
- cannot delete
- cannot regenerate
- cannot download

## Registry UI

Receipt registry should show actions for admin/super_admin:

- Download
- Edit
- Hard Delete

Do not add Void in this ticket.

Void can be a future audit-style feature if needed.

## Not Included

Do not implement:

- void with reason
- batch receipt generation
- student hub receipt summary
- payment import
- contract payment schedule changes
- Word contract changes
- application workflow changes
- receipt audit events unless very small and safe
- signature upload changes

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- admin/super_admin can edit receipt details
- admin/super_admin can edit receipt sequence
- receipt number recalculates correctly
- duplicate receipt number is blocked
- duplicate student/sequence is blocked
- edited receipt regenerates PDF
- edited receipt replaces stored PDF
- hard delete removes receipt record
- hard delete removes stored PDF where possible
- sequence can be reused after hard delete
- hard delete requires reason and typed confirmation
- sales/viewer cannot access controls
- registry updates after edit/delete
- no student hub receipt section is added
- no contract/payment schedule logic is changed
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Routes and actions added

- Edit page: `src/app/dashboard/admin-tools/finance/receipts/[receiptId]/edit/page.tsx`
  (server component, gated by `isAdminOrSuper`, loads the receipt and active
  signatures, renders the edit form).
- Edit form: `src/features/receipts/edit-receipt-form.tsx` (client component,
  reuses `searchReceiptStudents` from `new-receipt-actions.ts`).
- Row actions: `src/features/receipts/receipt-row-actions.tsx` (client
  component for Download, Edit, Hard Delete with the confirmation modal).
- API route: `src/app/api/finance/receipts/[receiptId]/route.ts`
  - `PUT` edits a receipt, recalculates the number, regenerates and replaces
    the stored PDF, and updates the metadata.
  - `DELETE` hard deletes a receipt and its stored PDF.
- Migration: `supabase/migrations/20260604_finance_09_receipt_delete_policies.sql`
  adds a `receipt_records` delete RLS policy for admin/super_admin and replaces
  the super_admin-only `receipt-documents` storage delete policy with an
  admin/super_admin one (hard delete needs both).
- Registry page updated to render `ReceiptRowActions` in the Actions column.

### Edit behavior

- Editable: student, amount, payment date, receipt date, payment method, card
  type, notes type, signature, receipt sequence.
- Receipt number is recalculated from the selected student number and the
  sequence using the existing `formatReceiptNumber` helper
  (`PSW-12500-25-{digits_after_125}-{sequence}`, two-digit sequence, leading
  zeros preserved).
- Duplicate `receipt_number` and duplicate `(student_id, receipt_sequence)` are
  pre-checked while ignoring the record being edited (so it can keep its own
  current values); the DB unique constraints remain the final guard.
- Order of operations: validate -> regenerate PDF -> upload/replace stored PDF
  -> update metadata -> revalidate registry. If PDF generation fails, nothing is
  changed. If the upload fails, metadata is not updated.
- The `receipt_date` drives the Date of Receipt line on the regenerated PDF.

### Receipt sequence correction behavior

- The sequence field is fully editable. Changing it recalculates the receipt
  number and, on save, moves the stored PDF to the new
  `{student_id}/receipts/{receipt_number}.pdf` path.
- A sequence already used by another receipt for the same student is blocked.

### PDF regeneration and storage replacement behavior

- Receipt number unchanged (same path): the existing PDF is replaced in place
  using `upsert: true` (supported by the `receipt-documents` update policy).
- Receipt number changed (new path): the new PDF is uploaded with
  `upsert: false` (never clobbers another receipt), the metadata is updated to
  the new path, and the old PDF is deleted afterward. If the old-file delete
  fails, the edit still succeeds and a warning is returned.
- On a metadata update failure after a path-changing upload, the newly uploaded
  file is removed to avoid an orphan.

### Hard delete and storage cleanup behavior

- Requires a non-empty reason and the typed confirmation `DELETE RECEIPT`
  (enforced both in the modal and in the API route).
- The stored PDF is deleted first; if that fails the row is kept and a clear
  error is returned (no orphan file). The row is then deleted, which frees the
  receipt number and the student sequence for reuse.
- The deletion reason is logged for traceability (no receipt audit table is
  added in this ticket).

### Role and access behavior

- Edit page, registry, and the new-receipt page all render an admin-only notice
  for non-admins.
- The `PUT`/`DELETE` API route and the existing download/generate routes enforce
  `isAdminOrSuper`; RLS enforces the same independently at the database layer.
- Sales and viewer cannot access the registry or the edit/delete actions.

### Known limitations

- Hard delete depends on the new migration. Without it, `receipt_records` has no
  delete policy and `receipt-documents` deletes are super_admin-only, so admin
  hard delete will fail until the migration is applied.
- Same-path replace uses `upsert`. If the metadata update fails after the file
  was overwritten in place, the stored PDF reflects the new values while the
  metadata reflects the old; the route reports an error so the admin can retry.
- The receipt PDF template is still the value-filled sample (see FINANCE-04),
  so overlays sit on top of sample values until a blank template replaces it.