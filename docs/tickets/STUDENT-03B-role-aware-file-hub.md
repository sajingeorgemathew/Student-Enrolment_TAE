# STUDENT-03B - Role-Aware Editable Student File Hub

## Goal

Make the student file hub role-aware and editable.

Sales and admin should work from the same student detail page, but each role should see the right controls.

## Main Product Rule

The student detail page is the main student file.

Separate pages can remain for list/admin overview, but day-to-day student work should happen inside:

`/dashboard/students/[studentId]`

## Roles

Use current roles:

- super_admin
- admin
- sales
- viewer

## Role Direction

### Sales

Sales can:

- view assigned or allowed student file
- edit intake-level student information
- edit program interest
- edit batch interest
- edit price discussed
- edit deposit discussed
- add sales notes
- upload documents
- mark simple sales checklist items
- send to admin review

Sales cannot:

- approve official checklist
- approve fee schedule
- generate official contract
- delete/archive records
- manage roles

### Admin

Admin can:

- edit official student information
- update application/intake status
- assign program and batch
- review documents
- edit official admission checklist
- edit official English checklist
- create and approve fee schedule
- generate Word contract
- add admin notes

### Super Admin

Super admin can do everything admin can do.

Delete/archive controls are still not part of this ticket.

### Viewer

Viewer can read only.

## Scope

Improve `/dashboard/students/[studentId]`.

Build or improve these sections:

- Student Summary
- Intake and Application
- Program and Batch
- Sales Checklist
- Documents
- Admission and English Checklist
- Fees and Payment Schedule
- Contract Word Export
- Notes
- Activity placeholder

## Sales Checklist

Add a simple sales-facing checklist inside the student file.

Use simple status options:

- received
- not_received
- not_sure
- not_applicable

Sales checklist items:

- photo ID
- proof of address
- diploma or transcript
- English proof
- immigration/status document
- payment proof/deposit
- other documents

This is not the official admin checklist.

Admin checklist remains the official review area.

## Intake and Application Editing

Allow role-aware editing:

Sales can edit intake-level fields before admin review where safe.

Admin can edit official application fields.

Fields may include:

- lead source
- program interest
- batch interest
- price discussed
- deposit discussed
- sales notes
- admin notes
- application status

Use friendly status names:

- New Intake
- Admin Review
- Information Needed
- Ready for Contract
- Contract Generated
- Signature Pending
- Signed
- Archived

## Documents

Inside student file:

- show all documents
- show multiple documents of same type
- allow upload document from student file
- allow admin to update review status if existing action supports it
- do not add delete controls yet

## Fees

Inside student file:

- show fee schedule summary
- show payment installment summary
- link to edit/open fee calculator
- admin/super_admin controls only for official fee approval

## Contract

Inside student file:

- show Word contract export action if available
- official output remains DOCX only
- do not add PDF export
- do not add Adobe or DocuSign

## UI Direction

Keep the page clean and practical.

Use clear role-based labels:

- Sales Intake
- Admin Review
- Official Checklist
- Documents
- Fees
- Contract

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Not Included

Do not implement:

- delete controls
- archive controls
- hard delete
- batch transfer
- full audit UI
- transcript module
- Excel import
- PDF export
- Adobe
- DocuSign

## Acceptance Criteria

- student file hub shows role-aware controls
- sales-facing checklist exists with Not sure option
- admin official checklist remains separate from sales checklist
- intake/application fields are editable where appropriate
- program/batch interest or assignment can be updated where appropriate
- documents section remains inside student file
- fees summary remains inside student file
- contract Word export remains inside student file
- viewer mode is read-only
- no delete/archive controls are added
- no PDF export is added
- no long em dash characters are introduced
- no emojis are added
- `npm run lint` passes
- `npm run build` passes