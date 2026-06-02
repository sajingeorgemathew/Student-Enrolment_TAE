# FINANCE-08 - Receipt Signature Selection and Overlay

## Goal

Allow admin/super_admin to select an uploaded admin signature during receipt generation and overlay that signature image onto the generated receipt PDF.

This ticket connects the admin signature management foundation to the receipt PDF generator.

## Current Context

Completed before this ticket:

- FINANCE-01 - Receipt system blueprint
- FINANCE-02 - Receipt data model and RLS
- FINANCE-03 - Receipt PDF template and field map
- FINANCE-04 - Receipt PDF overlay generator
- FINANCE-05 - Finance receipt registry UI
- FINANCE-06 - New receipt generation flow
- FINANCE-06-FIX - Receipt PDF template cleanup and overlay calibration
- FINANCE-07 - Receipt storage and download
- ADMIN-SIGNATURE-01 - Signature upload and management

## Main Rule

Do not redesign the receipt.

Use the existing PDF template and overlay approach.

Only add signature selection and signature image overlay.

## Scope

Add or improve:

- signature dropdown/selection in new receipt form
- load active admin signatures
- pass selected signature to receipt generation
- read selected signature image from private storage
- overlay signature image at fixed receipt coordinates
- save selected signature metadata if safe
- keep existing receipt storage/download behavior

## Signature Rules

Only admin/super_admin can select signatures for receipt generation.

Sales/viewer cannot generate receipts and cannot select signatures.

Use image overlay only.

Do not print typed signer name.

Do not move the signature label.

Do not change the receipt layout.

Do not let the signature push anything down.

Signature placement must be fixed.

## Signature Source

Use uploaded signatures from:

- `public.admin_signatures`
- private bucket `admin-signatures`

Only active signatures should be selectable.

If a default active signature exists, preselect it.

If no active signature exists:

- allow receipt generation without a signature only if current flow already allows
- show a clear warning such as "No active signature available"
- do not crash the form

## Receipt Generator Input

Update the receipt generator input to accept either:

- `signatureId`
- or signature image bytes
- or a small signature object

Use the safest project pattern.

Recommended:

- the server action loads the selected signature from storage
- generator receives signature bytes and mime type
- generator embeds the image into the PDF

## Supported Signature Types

Supported image types:

- PNG
- JPEG
- WebP only if pdf-lib/project supports it safely

If WebP cannot be embedded directly, block it from receipt use and document limitation, or convert later in another ticket.

## Signature Placement

Use the coordinate field map from:

`docs/blueprint/receipt-pdf-field-map.md`

Recommended fixed area:

- over the existing signature line area
- not over the label
- not over notes
- not over bottom date
- no typed signer name

If coordinates need adjustment, update the field map.

## Storage and Records

If safe, save the selected signature id on receipt metadata.

If `receipt_records` does not currently have a `signature_id` column, do not add schema unless needed.

Preferred:

- if schema change is needed, create a small migration adding `signature_id uuid null references public.admin_signatures(id) on delete set null`

Do not store the signature image inside receipt_records.

Receipt PDF should still be saved to receipt storage as already implemented.

## Not Included

Do not implement:

- new signature upload features
- signature delete
- signature cropping
- signature background removal
- typed signer names
- receipt voiding
- receipt regeneration
- batch receipts
- student hub receipt summary
- payment import
- contract changes
- Word template changes

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- new receipt form lists active signatures for admin/super_admin
- default signature is preselected if available
- admin can generate a receipt with selected signature
- signature image appears on generated receipt PDF
- signature does not move layout
- signature does not print typed signer name
- receipt PDF is still stored/downloadable
- receipt generation still works if no signature is selected, with clear warning if applicable
- sales/viewer cannot access signature selection or receipt generation
- no unrelated receipt registry changes
- no student hub receipt summary is added
- `npm run lint` passes
- `npm run build` passes