# WORKFLOW-03 - Application Status and Reopen Rules

## Goal

Clean up application status behavior across the student hub so each state has clear rules for editing, locking, reopening, and moving forward.

This ticket handles workflow state rules only.

## Current Context

Previous student hub tickets fixed section-level save and refresh behavior:

- STUDENT-HUB-01 - Student Information
- STUDENT-HUB-02 - Intake and Program/Batch
- STUDENT-HUB-03 - Checklist
- STUDENT-HUB-04 - Fees
- STUDENT-HUB-05 - Contract panel
- CONTRACT-HISTORY-01 - Contract download role visibility

Now the application workflow states need to be made consistent.

## Application Statuses

Use existing statuses only unless the current schema already supports more.

Expected statuses:

- `new_intake`
- `admin_review`
- `information_needed`
- `ready_for_contract`
- `contract_generated`
- `signature_pending`
- `signed`
- `archived`

Do not add new statuses in this ticket unless already required by existing code.

## Main Product Rule

The student hub should clearly show:

- current application status
- who can take the next action
- what is locked
- what can be reopened
- what the next step is

No section should show confusing actions that are not valid for the current status.

## Status Rules

### new_intake

Sales can:

- edit sales intake
- edit sales checklist if current rules allow
- send to admin review

Admin/super_admin can:

- view
- make admin updates if current rules allow

Contract generation:

- not allowed

### admin_review

Sales can:

- view
- not edit sales intake unless admin requests information

Admin/super_admin can:

- review
- assign/update program and batch if current rules allow
- edit official checklist
- edit/approve fees
- request information
- mark ready for contract if readiness passes

Contract generation:

- not allowed until ready_for_contract

### information_needed

Sales can:

- edit sales intake
- edit sales checklist if current rules allow
- send back to admin review

Admin/super_admin can:

- view
- save notes
- keep information_needed status if needed

Contract generation:

- not allowed

### ready_for_contract

Sales can:

- view only

Admin/super_admin can:

- generate contract
- reopen to admin_review if something must be corrected
- should not casually edit locked areas unless reopened

Contract generation:

- allowed for admin/super_admin only

### contract_generated

Sales can:

- view status only
- no generated contract download unless current role rules explicitly allow later

Admin/super_admin can:

- view generated contract history
- download generated contract
- regenerate contract only if current rules allow
- move to signature_pending if that action exists
- reopen to admin_review if correction is required

Locked behavior:

- official checklist and approved fees should not be edited casually
- reopen should be required before major correction

### signature_pending

Sales can:

- view status only

Admin/super_admin can:

- track signature pending
- mark signed if signed document is available later
- reopen to admin_review only if correction required

### signed

Sales can:

- view status only

Admin/super_admin can:

- view
- should not edit core contract inputs
- reopen only with clear admin action if current app supports it

### archived

Sales:

- view only if current app allows

Admin/super_admin:

- view archived status
- restore if current archive controls allow

Archived records should clearly show archived/dropped status.

## Reopen Rules

Add or clean up reopen behavior only where already safe.

Preferred reopen action:

- admin/super_admin only
- from `ready_for_contract`, `contract_generated`, or `signature_pending`
- returns application to `admin_review`
- requires a reason if current notes/admin notes support it
- should refresh the student hub immediately

Do not implement destructive rollback.

Do not delete contract generation records.

Do not delete documents.

Do not delete fees/checklists.

## UI Rules

Student hub workflow panel should clearly show:

- current status badge
- next available action
- locked/read-only explanation where relevant
- admin notes if available
- information needed reason if available

Avoid confusing buttons.

Examples:

- Sales should not see "Send to Admin Review" after contract_generated.
- Sales should not see sales intake Edit after admin_review unless status is information_needed.
- Admin should not see "Mark Ready for Contract" if already contract_generated.
- Admin should have clear reopen option where allowed.

## Role Rules

Sales:

- can handle intake before admin review
- can respond when information is requested
- cannot mark ready for contract
- cannot generate contract
- cannot reopen admin workflow
- cannot approve official checklist or fees

Admin/super_admin:

- can request information
- can mark ready for contract
- can generate contract
- can reopen status where allowed
- can approve/finalize where allowed

Viewer:

- read-only
- no action buttons

## Refresh Rules

Any status action must:

- update database
- revalidate the student hub path
- call router.refresh() where needed
- update the visible status without manual browser refresh
- show success/error clearly

Do not use `window.location.reload`.

## Not Included

Do not change:

- Word contract template
- contract DOCX layout
- PDF export
- Adobe/DocuSign
- document delete
- student delete
- archive/delete hard rules
- transcript module
- Excel import
- major database redesign
- RLS unless a missing role guard is clearly unsafe

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- application status rules are consistent in the student hub
- sales edit actions are hidden/locked outside allowed statuses
- information_needed allows sales to respond
- admin_review allows admin review actions
- ready_for_contract allows admin/super_admin contract generation
- contract_generated does not show confusing ready-only actions
- admin/super_admin can reopen where allowed
- viewer remains read-only
- status changes refresh without manual browser reload
- no Word template changes are made
- no unrelated sections are redesigned
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes (final behavior)

### Files modified

- `src/features/students/hub-actions.ts` - added `reopenToAdminReview` server action.
- `src/features/students/review-workflow-panel.tsx` - added `router.refresh()` to all workflow actions, added reopen button/handler, added sales-locked and viewer read-only explanations.
- `src/app/dashboard/students/[studentId]/page.tsx` - clarified the contract readiness "all complete" message so it does not imply sales can mark ready.

### Status and action visibility

- Current status badge and next recommended action are shown in the workflow panel and the page header.
- Action buttons are gated by both role and status:
  - Send to Admin Review: sales only, from `new_intake` or `information_needed`.
  - Mark Information Needed: admin/super_admin only, from `admin_review`.
  - Mark Ready for Contract: admin/super_admin only, from `admin_review` (readiness checks still run server-side).
  - Reopen to Admin Review: admin/super_admin only, from `ready_for_contract`, `contract_generated`, or `signature_pending`.
- "Mark Ready for Contract" and "Send to Admin Review" never appear after `contract_generated` because both are gated to `admin_review` / intake statuses only.

### Sales workflow

- Sales can edit sales intake and sales checklist only in `new_intake` and `information_needed` (enforced in the page `canEdit` props and server-side in `updateApplicationSales`).
- After `admin_review` and all later statuses, the sales intake is read-only and the workflow panel shows a clear locked explanation.
- Sales cannot mark ready, generate contracts, or reopen.

### Admin workflow

- Admin/super_admin can request information, mark ready for contract (readiness gated), generate contracts (existing API), and reopen where allowed.
- Contract generation still transitions `ready_for_contract` to `contract_generated` via the existing generate-docx route.

### Reopen behavior

- Allowed only for admin/super_admin, only from `ready_for_contract`, `contract_generated`, or `signature_pending`.
- Sets status back to `admin_review` and records the admin owner.
- Requires a reason (taken from the Admin Notes textarea); the reason is appended to existing admin notes with a date stamp so prior notes are preserved.
- Does not delete contract generation records, documents, fees, or checklists, and does not clear the ready/generated timestamps.

### Refresh behavior

- Every workflow action (send to review, save notes, mark information needed, mark ready, reopen) calls `revalidatePath` server-side and `router.refresh()` on success.
- No `window.location.reload` is used. Contract generation already calls `router.refresh()`.

### Role behavior

- Viewer: read-only, no action buttons, with an explicit read-only message.
- Sales: intake-stage actions only.
- Admin/super_admin: full review, ready, generate, and reopen actions where allowed.

### Remaining limitations

- There is no dedicated "Send to Signature" or "Mark Signed" action button; the `signature_pending` and `signed` transitions are not introduced in this ticket (reopen from `signature_pending` is supported).
- Reopen reason is stored in `admin_notes` only (no separate reopen audit table).
- Archived records remain fully locked via the existing `readOnly` path.