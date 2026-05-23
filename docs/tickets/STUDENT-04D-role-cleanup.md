# STUDENT-04D - Student Hub Role Cleanup

## Goal

Clean up role-based controls across the student hub and related workflow pages.

Users should only see the actions they are allowed to use.

This ticket is UI and server-action permission cleanup only.

## Main Product Rule

Do not show buttons or actions to a user if that user is not allowed to use them.

Avoid showing a form, allowing the user to fill it, then blocking only after submit.

## Roles

Use existing roles:

- super_admin
- admin
- sales
- viewer

## Current Problems

- Sales and viewer still see too many actions.
- Viewer can open New Intake and fill the form before being blocked.
- Sales and viewer see controls in student hub, batches, programs, checklists, fees, and contracts that should not be available.
- Sales sees readiness/contract areas that may be admin-only.
- Viewer is read-only but still sees some save/action buttons.
- Some role messages only appear after failed submit instead of hiding the action earlier.

## Role Rules

### Viewer

Viewer is read-only.

Viewer can:

- view allowed dashboard pages
- view student file
- view batch/program/student information
- view documents metadata if allowed

Viewer cannot:

- create intake
- edit student
- edit application
- upload documents
- save checklist
- edit fees
- approve fees
- reopen fees
- change batch
- transfer batch
- generate contract
- delete/archive

Viewer UI should not show create/edit/save/upload/approve/reopen/generate buttons.

### Sales

Sales can:

- create intake
- edit intake-level student info where allowed
- update sales checklist
- upload documents inside student file
- view basic fee discussion fields
- view assigned/allowed student files
- send to admin review if supported

Sales cannot:

- update official admin checklist
- approve/reopen fee schedule
- generate official Word contract
- change official batch assignment after admin review
- transfer batch
- edit core programs
- edit core batches
- delete/archive

Sales UI should show sales-facing controls only.

### Admin

Admin can:

- edit official student file
- update official checklist
- review documents
- create/edit/reopen/approve fee schedule
- change or transfer student batch
- generate Word contract
- manage programs and batches

Admin cannot:

- hard delete unless later allowed
- manage super_admin role

### Super Admin

Super admin can do everything admin can do.

Hard delete/archive controls are still not part of this ticket.

## Scope

Review and clean role UI on:

- dashboard navigation
- `/dashboard/students`
- `/dashboard/students/[studentId]`
- `/dashboard/intake`
- `/dashboard/intake/new`
- `/dashboard/programs`
- `/dashboard/batches`
- `/dashboard/checklists`
- `/dashboard/fees`
- `/dashboard/contracts`

## Required Fixes

### Navigation

Show role-appropriate navigation.

Viewer should not see action-oriented navigation if it leads to blocked forms.

Sales should not see admin-only module controls.

Keep navigation simple.

### Student File

On `/dashboard/students/[studentId]`:

Viewer:

- read-only
- no save buttons
- no upload buttons
- no generate contract button
- no batch change/transfer controls
- no fee approve/reopen controls

Sales:

- sales checklist controls visible
- document upload visible
- intake-level fields visible where allowed
- no admin checklist save
- no fee approve/reopen
- no contract generation
- no batch transfer controls

Admin/super_admin:

- all operational controls visible except delete/archive

### New Intake

Viewer should not see New Intake action.

If viewer navigates directly to `/dashboard/intake/new`, show an access message immediately instead of allowing form submission.

Sales/admin/super_admin can create intake if allowed.

### Programs and Batches

Sales/viewer should not see edit/create controls unless intentionally allowed.

Admin/super_admin can manage programs and batches.

### Checklists

Sales can update Sales Intake Checklist only.

Admin/super_admin can update Official Admin Checklist.

Viewer is read-only.

### Fees

Sales/viewer cannot approve or reopen fees.

Admin/super_admin can approve and reopen fees.

### Contracts

Sales/viewer should not generate official Word contracts.

Admin/super_admin can generate Word contracts.

Contract readiness wording should be role-appropriate.

If sales/viewer sees contract section, it should be read-only or limited.

## Server Action Safety

Do not rely only on hidden UI.

Check server actions where practical:

- create intake
- update checklist
- upload document
- approve/reopen fee
- change/transfer batch
- generate contract

If an unauthorized user calls an action directly, it should still be blocked.

## Not Included

Do not implement:

- delete controls
- archive controls
- hard delete
- role management UI
- batch transfer changes beyond hiding/disabling controls
- document workflow changes beyond role UI
- checklist logic changes beyond role UI
- fee logic changes beyond role UI
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

- viewer sees read-only UI
- viewer cannot see New Intake action
- viewer cannot fill a form and only then get blocked
- sales sees only sales-facing controls
- sales cannot see official admin checklist save controls
- sales cannot see fee approval/reopen controls
- sales cannot see contract generation controls
- admin/super_admin see operational controls
- no delete/archive controls are added
- server actions remain protected where practical
- no long em dash characters are introduced
- no emojis are added
- `npm run lint` passes
- `npm run build` passes