# STUDENT-04A - Embedded Document Management in Student Hub

## Goal

Move document upload, document list, document status, and document actions directly into the student file page.

This ticket handles only documents.

## Main Product Rule

The student detail page is the main student file.

Document work should happen inside:

`/dashboard/students/[studentId]`

Staff should not need to leave the student file just to upload or review a document.

## Current Problem

Document upload currently depends too much on a separate document page.

This is not convenient for production because staff may handle hundreds of students.

Documents should be managed from the student file itself.

## Scope

Improve:

- `/dashboard/students/[studentId]`

Build or improve embedded document management:

- inline upload form inside student file
- all student documents listed inside student file
- multiple documents per type visible
- document type selector
- application selector if needed
- file upload to Supabase Storage
- metadata save to `student_documents`
- review status display
- admin review status update
- document detail/open actions
- no separate page jump for upload

## Document Rules

- Upload happens inside the student file.
- Show all documents for the student.
- Show multiple documents of the same type.
- Sort newest first.
- Keep the Supabase Storage bucket private.
- Use existing storage upload logic if available.
- Every upload should create a new `student_documents` row.
- Do not replace existing documents.
- Do not add delete controls in this ticket.

## Role Rules

### Sales

Sales can:

- upload documents
- view uploaded documents
- add upload notes if supported

Sales cannot:

- review/approve documents
- delete documents
- archive documents

### Admin and Super Admin

Admin and super_admin can:

- upload documents
- view documents
- update document review status
- add review notes if supported

Admin and super_admin cannot in this ticket:

- delete documents
- hard delete files from storage

### Viewer

Viewer can:

- read document metadata if current policies allow

Viewer cannot:

- upload
- review
- delete

## Review Statuses

Use existing statuses:

- uploaded
- accepted
- needs_correction
- archived

Do not add delete status in this ticket.

## Document Types

Use existing document types if already defined.

Make sure these types are available:

- photo_id
- address_proof
- academic_transcript
- diploma_certificate
- english_test
- immigration_status
- payment_proof
- placement_document
- plar
- readmission
- withdrawal
- transcript_moodle_export
- contract_document
- other

## Separate Document Routes

Do not delete existing routes:

- `/dashboard/documents`
- `/dashboard/documents/new`
- `/dashboard/documents/[documentId]`

But the student file should not force staff to use `/dashboard/documents/new` for normal upload.

Existing document routes can remain as admin-wide search/list/detail pages.

## UI Direction

Inside the student file, the document section should include:

- Upload Document button or inline upload panel
- document type
- file name
- application/batch context if available
- review status
- uploaded date
- uploaded by type
- View/Open action
- status update controls for admin/super_admin only

Avoid long scrolling if possible.

Use a compact table, grouped list, or collapsible section.

## Not Included

Do not implement:

- document delete
- storage file delete
- archive controls
- signed contract upload
- student secure upload link
- checklist changes
- fee changes
- batch transfer
- contract template changes
- PDF export
- Adobe
- DocuSign
- transcript module
- Excel import

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- student file page has embedded document upload
- upload does not require leaving the student file
- all documents for the student are shown
- multiple documents of the same type are visible
- every upload creates a new document row
- existing documents are not replaced
- sales can upload but cannot review
- admin/super_admin can update review status
- viewer cannot upload or review
- document detail/open action works
- existing `/dashboard/documents` routes still work
- no delete controls are added
- no long em dash characters are introduced
- no emojis are added
- `npm run lint` passes
- `npm run build` passes