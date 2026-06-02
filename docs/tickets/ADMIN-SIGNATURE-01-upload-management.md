# ADMIN-SIGNATURE-01 - Signature Upload and Management

## Goal

Create an admin-only signature management area where admin/super_admin can upload, view, activate/deactivate, and manage signature images.

This ticket creates the signature management foundation only.

Do not connect signatures to receipt generation yet.

## Current Context

Receipt generation and storage are being built in the Finance module.

Signatures are intentionally deferred from receipt PDF calibration and storage tickets.

Later, receipt generation should allow admin to select an uploaded signature and overlay it on the receipt PDF.

## Route Placement

Use Admin Tools.

Recommended route:

- `/dashboard/admin-tools/utilities/signatures`

Add a link/card from:

- `/dashboard/admin-tools/utilities`

## Scope

Create:

- signature metadata table
- signature storage bucket or storage folder
- admin-only signature management page
- upload form
- signature list
- preview
- activate/deactivate control
- default signature marker if safe
- role guards

## Suggested Table

Create table:

`public.admin_signatures`

Suggested columns:

- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `storage_path text not null`
- `mime_type text not null`
- `file_size_bytes integer not null`
- `is_active boolean not null default true`
- `is_default boolean not null default false`
- `uploaded_by uuid not null references auth.users(id) on delete restrict`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## Storage

Use private bucket:

`admin-signatures`

Recommended path:

`signatures/{signature_id}/{safe_file_name}`

Allowed file types:

- image/png
- image/jpeg
- image/webp

Recommended max size:

- 1 MB or 2 MB

Transparent PNG is preferred but not required.

## RLS Rules

Admin/super_admin:

- can select
- can insert
- can update
- can upload/download through app route
- can activate/deactivate

Sales:

- no access

Viewer:

- no access

No hard delete in this ticket unless absolutely needed.

## UI Behavior

Admin/super_admin page should show:

- Upload Signature button/form
- Name field
- File input
- Preview uploaded image
- List of existing signatures
- Active/inactive status
- Default marker if implemented
- Activate/deactivate action

Sales/viewer:

- navigation hidden
- direct URL blocked

## Validation

Upload must validate:

- file exists
- valid image type only
- file size limit
- name is required
- no executable/script files

## Not Included

Do not implement:

- receipt signature selection
- receipt PDF signature overlay
- contract signature selection
- user profile signatures
- public signature access
- delete/hard delete
- audit events
- advanced image cropping
- image background removal

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- admin/super_admin can access signature management
- sales/viewer cannot access signature management
- admin/super_admin can upload PNG/JPG/WebP signature image
- uploaded signature metadata is saved
- uploaded signature image is stored privately
- signature preview/list is visible to admin/super_admin
- admin/super_admin can activate/deactivate signatures
- no receipt generation logic is changed
- no receipt PDF overlay logic is changed
- no contract logic is changed
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Migration

- Migration name:
  `supabase/migrations/20260602_admin_signature_01_signatures.sql`
- Creates `public.admin_signatures` with the suggested columns, the
  `updated_at` trigger (reusing `public.set_updated_at()`), and RLS.
- Constraints: name not blank, `file_size_bytes > 0`, and
  `mime_type in ('image/png', 'image/jpeg', 'image/webp')`.
- A partial unique index (`where is_default`) guarantees at most one default
  signature at the database layer.
- RLS: select, insert, and update are all gated by
  `public.is_admin_or_super_admin()`. Sales and viewer have no access. There is
  no delete policy, so there is no hard delete.

### Storage bucket

- Bucket name: `admin-signatures`
- Private bucket (`public = false`).
- Created by the migration above (no-op if it already exists), following the
  `student-documents` / `receipt-documents` bucket pattern.
- Storage RLS on `storage.objects` restricts the bucket to admin/super_admin
  for insert, select, and update via `public.is_admin_or_super_admin()`. No
  delete policy. Sales and viewer cannot read or write even with a direct
  Supabase storage call.
- Storage path convention: `signatures/{signature_id}/{safe_file_name}`. The
  signature id is generated in the upload route before insert so the not-null
  `storage_path` is set in a single insert. Uploads use `upsert: false`.

### Manual Supabase steps

- Apply the migration (or run its SQL in the Supabase SQL editor) to create the
  table, RLS, the `admin-signatures` bucket, and its storage policies.
- If migrations cannot be applied in an environment, create the bucket manually:
  Supabase dashboard, Storage, New bucket, name `admin-signatures`, Public off
  (private). Then add the three `storage.objects` policies from the migration so
  only admin/super_admin can read/write. If the bucket is missing at upload time,
  the upload route returns a clear 503 telling the admin to create it, and no
  signature is saved.

### Routes added

- Page: `/dashboard/admin-tools/utilities/signatures` (admin-only management
  page).
- Link card added to `/dashboard/admin-tools/utilities`.
- API: `POST /api/admin/signatures/upload` (multipart upload),
  `POST /api/admin/signatures/status` (activate / deactivate / set_default),
  `GET /api/admin/signatures/preview?id=...` (role-guarded inline image preview
  from the private bucket).

### Upload behavior

- Validates: name required and not blank (max 120 chars), file present, type in
  PNG/JPG/WebP, size at most 2 MB. Type and size are checked on both the client
  and the server. The server insert and DB constraints are the source of truth.
- Flow: generate signature id, upload the image to the private bucket, then
  insert metadata. If the insert fails after upload, the uploaded file is
  removed so no orphan object is left.

### List / preview / status behavior

- The page lists all signatures (newest first) with an inline preview streamed
  through the role-guarded `/api/admin/signatures/preview` route, the
  active/inactive status, the default marker, file size, and mime type.
- Activate/deactivate toggles `is_active`. Deactivating also clears
  `is_default` so an inactive signature is never the default.
- Set as default clears any existing default first, then marks the selected
  active signature as default; only one default can exist.
- No hard delete is exposed.

### Role / access behavior

- The page renders the manager only for admin/super_admin; others see an
  access-restricted message. The Utilities cards are admin-gated too, so
  sales/viewer do not see the navigation.
- All three API routes return 401 when unauthenticated and 403 for sales/viewer.
- Storage and table RLS independently block sales/viewer at the database layer.

### Limitations

- Signatures are not connected to receipt generation, receipt PDFs, contracts,
  or the student hub in this ticket.
- No hard delete; signatures can only be deactivated.
- Default handling uses clear-then-set plus a partial unique index rather than a
  single atomic statement; under heavy concurrent set-default calls one request
  may need to retry, but the index prevents two defaults from ever existing.
- Preview embeds the image via an `<img>` tag pointed at the protected route
  (no public URLs or long-lived signed URLs are issued).

### Next ticket

- A future finance ticket should add signature selection in the receipt
  generation flow and overlay the chosen signature on the receipt PDF. That
  work is intentionally deferred and is out of scope here.