# REVIEW-01 - Sales to Admin Review Workflow

## Goal

Create a clear review workflow from sales intake to admin review to ready for contract.

This ticket defines how the process ends.

## Main Product Rule

Sales prepares the student file.

Admin reviews and finalizes the student file.

The student file should clearly show the current review status and next action.

## Current Problems

- Sales can send intake to admin, but the review workflow is not clearly defined.
- Admin does not have a clear way to mark review completed.
- Student file can show sections completed, but there is no final admin review decision.
- Contract readiness exists, but admin review status is not clearly connected to it.
- Staff cannot easily tell what is missing before ready for contract.

## Main Workflow

### Sales Stage

Sales can:

- create intake
- enter basic student information
- select program interest
- select batch interest
- enter price discussed and deposit discussed
- upload documents
- update Sales Intake Checklist
- add notes for admin
- send to admin review

Sales cannot:

- mark ready for contract
- approve official checklist
- approve fees
- generate contract

### Admin Review Stage

Admin/super_admin can:

- review student info
- confirm program and batch
- review documents
- complete official checklist
- approve fees
- mark information needed
- mark ready for contract

### Ready for Contract Stage

A student can be marked Ready for Contract only when required items are complete.

Required readiness checks:

- student information complete
- batch assigned
- official checklist ready
- fee schedule approved
- payment installments available
- documents available
- Word contract generation available

## Statuses

Use friendly workflow statuses:

- new_intake
- admin_review
- information_needed
- ready_for_contract
- contract_generated
- signature_pending
- signed
- archived

If existing schema already has application status values, align with those.

If status migration is needed, create a safe migration.

## Student File Review Panel

Inside `/dashboard/students/[studentId]`, add or improve an Admin Review panel.

Show:

- current workflow status
- submitted to admin date if available
- admin reviewed date if available
- reviewed by if available
- missing readiness items
- next recommended action
- sales notes
- admin notes

## Sales Actions

Sales can see:

- Send to Admin Review

Sales can add:

- notes for admin

Sales cannot see:

- Mark Ready for Contract
- Mark Contract Generated
- Admin approval buttons

## Admin Actions

Admin/super_admin can see:

- Mark Information Needed
- Mark Ready for Contract
- Mark Contract Generated if Word contract exists or generation is available
- Add admin notes

Admin/super_admin should not see destructive delete controls in this ticket.

## Information Needed Behavior

If admin marks Information Needed:

- status becomes `information_needed`
- admin notes should explain what is missing
- sales can view the notes
- sales can update intake info, upload documents, update sales checklist, and resend to admin review

## Ready for Contract Behavior

If admin clicks Mark Ready for Contract:

- run readiness checks first
- if missing items exist, block the action and show the missing items
- if all required items are complete, update status to `ready_for_contract`
- revalidate student file and related list pages

## Contract Generated Behavior

If admin generates the Word contract later, status can become `contract_generated`.

If existing contract generation already updates status safely, use it.

If not, show as future/manual action.

Do not change Word template in this ticket.

## Role Rules

### Sales

Sales can:

- send to admin review
- respond to information needed
- update sales-side info

Sales cannot:

- mark ready for contract
- approve fees
- approve official checklist
- generate contract

### Admin and Super Admin

Admin and super_admin can:

- mark information needed
- mark ready for contract
- update admin notes
- review readiness

### Viewer

Viewer can:

- read workflow status only

Viewer cannot:

- update status
- submit review
- save notes

## Not Included

Do not implement:

- delete controls
- archive controls
- hard delete
- role management UI
- batch transfer changes
- document upload changes
- checklist core changes
- fee calculator changes
- Word template changes
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

- student file shows clear review status
- sales can send to admin review
- admin/super_admin can mark information needed
- admin/super_admin can mark ready for contract only when readiness checks pass
- missing readiness items are shown clearly
- sales can respond to information needed and resend
- viewer is read-only
- workflow status updates immediately after action
- contract readiness and review status are clearly connected
- no delete/archive controls are added
- no contract template changes are made
- no long em dash characters are introduced
- no emojis are added
- `npm run lint` passes
- `npm run build` passes