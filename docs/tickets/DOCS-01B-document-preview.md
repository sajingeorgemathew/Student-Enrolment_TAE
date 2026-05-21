# DOCS-01B - Document Preview Instead of Forced Download

## Goal

Improve the document detail page so staff can preview uploaded documents when possible instead of only downloading them.

## Scope

Build:

- preview behavior for uploaded documents
- signed/private Supabase URL handling
- preview for PDF and image files
- fallback download/open behavior for unsupported files
- clearer document actions

## Current Behavior

Document upload and metadata saving work.

The issue is that the document action downloads the file instead of previewing it.

## Required Behavior

On `/dashboard/documents/[documentId]`:

- PDF files should open in an in-page preview or a new tab preview
- JPG/PNG files should preview in-page
- DOCX and unsupported files should show a download/open fallback
- Keep files private
- Use signed URLs, not public URLs
- Do not make the Supabase bucket public

## Buttons / Actions

Use clear labels:

- Preview Document
- Open in New Tab
- Download File

If browser preview is not supported, fallback to download.

## Security

- Do not expose storage paths publicly without signed URL
- Do not make bucket public
- Use short-lived signed URLs
- Keep existing access rules

## Not Included

Do not implement:

- student secure upload link
- Resend notifications
- contract generation
- Adobe
- DocuSign
- Excel import

## Acceptance Criteria

- PDF preview works when browser supports it
- Image preview works
- unsupported files show fallback download/open action
- signed URLs are used
- bucket remains private
- no emojis
- `npm run lint` passes
- `npm run build` passes