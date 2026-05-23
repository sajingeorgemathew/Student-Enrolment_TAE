# STUDENT-04C - Embedded Checklist and Fee Controls

## Goal

Keep checklist and fee work inside the student file.

The student file should clearly show what sales can prepare, what admin must review, and when the file is ready for contract.

## Main Product Rule

The student detail page is the main student file.

Checklist and fee work should happen inside:

`/dashboard/students/[studentId]`

Separate checklist and fee pages may remain as admin-wide list/search pages, but they should not be the main daily workflow.

## Scope

Improve:

- `/dashboard/students/[studentId]`

Build or improve:

- embedded sales checklist summary and controls
- embedded official admin checklist summary and controls
- embedded fee schedule summary
- fee calculator/edit link or embedded controls where safe
- fee approval/finalization behavior
- ready-for-contract readiness summary
- clearer admin review progress

## Current Problems

- Checklist and fee workflows still feel disconnected from the student file.
- Admin can approve fee schedule, but cannot clearly edit/reopen after approval.
- The student file does not clearly show what is missing before contract readiness.
- Sales, admin, and viewer UI visibility still needs more cleanup, but full role cleanup is the next ticket.
- Contract readiness and admin review completion need clearer source status.

## Checklist Direction

Inside the student file, show:

1. Sales Intake Checklist
2. Official Admin Checklist

### Sales Intake Checklist

Sales can mark:

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

### Official Admin Checklist

Admin/super_admin can manage official checklist:

- photo ID status
- address proof status
- academic route
- academic status
- academic notes
- English route
- English status
- English score/result
- English notes

Official admin statuses:

- not_started
- in_review
- accepted
- needs_correction
- not_applicable

## Fee Direction

Inside the student file, show:

- fee schedule status
- tuition fee
- total fees
- payment before signing
- payment after signing
- remaining balance
- installments
- approval status
- approved by if available
- approved at if available

Admin/super_admin can:

- create fee schedule if missing
- edit fee schedule if draft or reopened
- approve fee schedule
- reopen approved fee schedule if correction is needed

Sales can:

- view fee summary if allowed
- view price discussed/deposit discussed
- not approve official fee schedule

Viewer can:

- read only

## Fee Approval Rule

Approved fee schedules should not be silently locked forever.

Add safe behavior:

- If fee schedule is draft, admin can edit and approve.
- If fee schedule is approved, admin/super_admin can reopen for correction.
- Reopened status should allow edit.
- Approval should be clear and visible.

If existing schema cannot support reopened status, use the safest existing status or create a small migration.

## Ready For Contract Summary

Inside the student file, show a clear readiness summary:

- student info complete
- batch assigned
- documents available
- official checklist ready
- fee schedule approved
- payment installments available
- Word contract available

Show:

- Ready for Contract
- Not Ready
- Missing items list

Do not finalize admin review in this ticket unless already supported safely.

## Navigation Rule

Checklist and Fees routes can remain:

- `/dashboard/checklists`
- `/dashboard/fees`

But student file should be the main working place.

## Role Rules

### Sales

Sales can:

- update sales intake checklist
- upload/view documents if existing document section supports it
- view price discussed/deposit discussed
- add sales notes if existing section supports it

Sales cannot:

- update official admin checklist
- approve/reopen fee schedule
- finalize contract readiness

### Admin and Super Admin

Admin and super_admin can:

- update sales checklist if needed
- update official admin checklist
- create/edit/reopen/approve fee schedule
- view readiness summary

### Viewer

Viewer can:

- read only

Viewer cannot:

- save checklist
- edit fees
- approve fees
- reopen fees

## Not Included

Do not implement:

- full role cleanup across all buttons
- delete controls
- archive controls
- batch transfer changes
- document upload changes
- contract template changes
- contract export changes
- admin review final completion workflow
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

- student file shows embedded checklist controls clearly
- student file shows embedded fee summary clearly
- admin/super_admin can update official checklist
- sales can update sales checklist only
- admin/super_admin can approve fee schedule
- admin/super_admin can reopen approved fee schedule if correction is needed
- viewer is read-only
- ready-for-contract summary shows clear missing items
- checklist and fee pages remain working
- no delete/archive controls are added
- no contract template changes are made
- no long em dash characters are introduced
- no emojis are added
- `npm run lint` passes
- `npm run build` passes