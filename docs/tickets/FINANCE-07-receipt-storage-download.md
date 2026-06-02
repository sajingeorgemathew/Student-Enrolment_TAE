# FINANCE-07 - Receipt Storage and Download

## Goal

Save generated receipt PDFs to Supabase Storage and allow admin/super_admin to download stored receipts from the Finance receipt registry.

This ticket handles storage and download only.

## Current Context

Previous finance tickets completed:

- FINANCE-01 - Receipt system blueprint
- FINANCE-02 - Receipt data model and RLS
- FINANCE-03 - Receipt PDF template and field map
- FINANCE-04 - Receipt PDF overlay generator
- FINANCE-05 - Finance receipt registry UI
- FINANCE-06 - New receipt form and generation flow
- FINANCE-06-FIX - Receipt PDF template cleanup and overlay calibration

The receipt PDF still does not include uploaded signature management. That is intentionally deferred.

## Main Rule

Do not implement signature upload in this ticket.

Do not implement receipt voiding.

Do not implement student hub receipt summary.

Do not change PDF layout except if needed for storage integration.

## Scope

Add or improve:

- receipt PDF upload to Supabase Storage after generation
- `pdf_storage_path` update on `receipt_records`
- stored receipt download from receipt registry
- admin-only download access
- clear error handling for failed storage upload
- storage path naming convention

## Storage Bucket

Preferred bucket:

`receipt-documents`

If the bucket does not exist, document the required manual Supabase step.

Do not create bucket through app code unless the project already has a safe admin setup pattern.

Bucket should be private.

## Storage Path Convention

Use a stable student-linked path.

Recommended:

`{student_id}/receipts/{receipt_number}.pdf`

Example:

`cd75c610-5959-44aa-afdd-373260c549de/receipts/PSW-12500-25-315-04.pdf`

Rules:

- safe file names only
- use receipt_number in file name
- do not use student name in storage path
- do not overwrite existing receipt PDFs unless explicitly regenerating later
- if upload conflict happens, fail clearly or add timestamp only if documented

## Receipt Record Update

After PDF generation and upload:

- update `receipt_records.pdf_storage_path`
- keep existing metadata
- do not create duplicate receipt record if upload fails after insert unless current flow already requires it

If insert succeeds but upload fails:

- show clear error
- document limitation
- do not pretend receipt is fully generated

## Download Behavior

From `/dashboard/admin-tools/finance/receipts`:

Admin/super_admin:

- can see Download if `pdf_storage_path` exists
- can download stored receipt PDF

Sales:

- cannot access receipt registry
- cannot download receipts

Viewer:

- cannot access receipt registry
- cannot download receipts

Direct URL/API access should be protected.

## Download Route

Reuse existing document download route if safe.

If using `/api/documents/download`, make sure receipt downloads are role-guarded.

If a new route is safer, create:

`/api/receipts/download`

Rules:

- admin/super_admin only
- validate receipt exists
- validate `pdf_storage_path`
- download from private bucket
- return PDF with safe file name
- block unauthenticated, sales, and viewer

## Registry UI

Update receipt registry actions:

- if receipt has `pdf_storage_path`, show Download
- if no `pdf_storage_path`, show Not stored or Download unavailable
- do not add Void yet
- do not add Regenerate yet

## Not Included

Do not implement:

- signature upload
- signature selection
- receipt voiding
- receipt regeneration
- batch receipts
- student hub receipt summary
- payment import
- contract payment schedule changes
- Word contract changes
- application workflow changes
- database schema changes unless absolutely required

## Manual Supabase Step

If bucket is not already present, admin must create:

- Bucket name: `receipt-documents`
- Private bucket

Storage policies should allow only admin/super_admin access according to existing project pattern.

If storage policies are managed manually in SQL, create a migration only if that is consistent with the project.

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- generated receipt PDF uploads to private storage
- receipt_records.pdf_storage_path is updated
- receipt registry shows Download for stored receipt PDFs
- admin/super_admin can download stored receipt
- sales/viewer cannot download receipts
- direct download access is protected
- missing storage path shows clear unavailable state
- no signature upload is added
- no void/regenerate logic is added
- no student hub receipt summary is added
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Storage bucket

- Bucket name: `receipt-documents`
- Private bucket (`public = false`).
- Created by migration
  `supabase/migrations/20260602_finance_07_receipt_storage.sql`, following the
  existing `student-documents` bucket pattern.
- Storage RLS on `storage.objects` restricts the bucket to admin/super_admin:
  insert, select, and update are gated by `public.is_admin_or_super_admin()`;
  delete is gated by `public.is_super_admin()`. Sales and viewer have no
  access, so even a direct Supabase storage call is blocked for them.

### Storage path pattern

- `{student_id}/receipts/{receipt_number}.pdf`
- Example:
  `cd75c610-5959-44aa-afdd-373260c549de/receipts/PSW-12500-25-315-04.pdf`
- No student name in the path. The receipt number is the file name and is
  already a safe value (uppercase letters, digits, and hyphens).
- Upload uses `upsert: false`, so an existing receipt PDF is never silently
  overwritten. A storage conflict fails clearly with a 409 and no record is
  saved.

### Receipt record update behavior

- The generation flow is all-or-nothing:
  1. Insert the `receipt_records` row (reserves the receipt number).
  2. Generate the PDF. On failure the row is deleted.
  3. Upload the PDF to `receipt-documents`. On failure the row is deleted.
  4. Update `receipt_records.pdf_storage_path` with the storage path. On
     failure the uploaded file is removed and the row is deleted.
  5. Stream the PDF back for immediate download (unchanged FINANCE-06
     behavior).
- This guarantees a successful receipt always has both a stored PDF and a
  populated `pdf_storage_path`, and a failed receipt leaves no orphan record or
  orphan file.

### Download route behavior

- New route: `GET /api/receipts/download?id={receiptId}`.
- Admin/super_admin only. Unauthenticated returns 401; sales/viewer return 403.
- Looks up the receipt by id, validates `pdf_storage_path` exists, downloads
  from the private `receipt-documents` bucket, and returns the PDF as an
  attachment named `{receipt_number}.pdf`.
- A dedicated route was used rather than reusing `/api/documents/download`,
  because that shared route only role-guards paths containing `/contracts/` and
  otherwise allows any authenticated staff member to download. The dedicated
  route keeps the receipt bucket admin-only at the application layer in addition
  to the storage RLS.

### Registry UI behavior

- The Actions column shows a Download link when `pdf_storage_path` exists and
  "Download unavailable" when it does not (for example, pre-FINANCE-07 records).
- No Void, Regenerate, or Delete actions were added.

### Manual Supabase steps

- The bucket and its policies are created by the migration above. Apply
  migrations (or run that SQL in the Supabase SQL editor) to provision them.
- If migrations cannot be applied in an environment, create the bucket manually:
  - Supabase dashboard, Storage, New bucket.
  - Name: `receipt-documents`.
  - Public: off (private).
  - Then add the four `storage.objects` policies from the migration so only
    admin/super_admin can read/write and only super_admin can delete.
- If the bucket is missing at generation time, the generate route returns a
  clear 503 telling the admin to create the `receipt-documents` bucket, and no
  receipt is saved.

### Role/access behavior

- Generate route (`POST /api/finance/receipts/generate`): admin/super_admin
  only (existing FINANCE-06 guard).
- Download route (`GET /api/receipts/download`): admin/super_admin only.
- Registry page and download link are only rendered for admin/super_admin.
- Storage RLS independently blocks sales/viewer from reading the bucket.

### Limitations

- No receipt regeneration in this ticket. Because uploads use `upsert: false`,
  a receipt number can only ever have one stored PDF; regeneration is future
  work and would need an explicit overwrite or new path design.
- No void/delete of stored PDFs is exposed in the UI.
- Existing receipts created before FINANCE-07 have a null `pdf_storage_path`
  and show "Download unavailable" until regenerated by a future flow.