# DOCS-01 - Staff Document Upload and Review

## Goal

Create staff document upload and review workflow.

Sales/admin should be able to upload student documents into the system, and admin should be able to review documents.

## Scope

Build:

- document list page
- document upload form
- document review controls
- student/application selector
- document type selector
- Supabase Storage upload
- document metadata saved in `student_documents`
- admin review status update

## Required Routes

- `/dashboard/documents`
- `/dashboard/documents/new`
- `/dashboard/documents/[documentId]`

## Storage

Use Supabase Storage bucket:

- `student-documents`

Recommended storage path:

- `students/{student_id}/applications/{application_id}/{document_type}/{timestamp}-{filename}`

## Document Types

Support these document types:

- photo_id
- address_proof
- academic_transcript
- diploma_certificate
- english_test
- immigration_status
- payment_proof
- other

## Review Statuses

Use:

- uploaded
- accepted
- needs_correction
- archived

## Upload Rules

Allow:

- PDF
- JPG
- PNG
- DOCX if reasonable

Do not attach documents to emails.

Do not expose private storage files publicly.

## Access

Sales/admin can upload documents.

Admin can review documents.

Viewer can read document metadata if existing policies allow it.

## Contract Direction

Documents support future contract readiness.

Do not create a separate contract document workflow.

Future contract readiness should pull from:

- student_documents
- admission_checklists
- applications
- students

## Not Included

Do not implement:

- student secure upload link
- Resend notifications
- checklist editing
- fee calculator changes
- contract preview
- PDF generation
- Adobe
- DocuSign
- Excel import

## Acceptance Criteria

- `/dashboard/documents` lists uploaded documents
- `/dashboard/documents/new` uploads a document
- document file saves to Supabase Storage
- document metadata saves to `student_documents`
- `/dashboard/documents/[documentId]` shows document detail
- admin can update review status and notes
- missing files/data show clean empty states
- no emojis
- `npm run lint` passes
- `npm run build` passes