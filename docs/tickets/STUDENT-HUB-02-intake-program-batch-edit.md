# STUDENT-HUB-02 - Intake and Program Batch Edit Mode

## Goal

Fix the Sales Intake and Program/Batch areas in the student hub so they use clean summary/edit behavior and refresh correctly after save.

This ticket touches only:

- Sales Intake section
- Admin Program and Batch Assignment section
- Batch assignment controls only where they belong inside the student hub

## Blueprint Source

Use:

- `docs/blueprint/student-hub-state-edit-pattern.md`
- `docs/tickets/WORKFLOW-02-student-hub-state-blueprint.md`

The blueprint identified stale state issues in SalesIntakeForm, AdminApplicationForm, and BatchAssignmentControls.

## Main Product Direction

Each student hub section should show a read-only summary first.

Each editable section should have its own Edit button.

Only that section opens for editing.

After Save:

- database updates
- student hub data refreshes without manual browser refresh
- section closes back to summary mode
- saved values are visible immediately

After Cancel:

- unsaved changes are discarded
- section returns to summary mode

## Scope

Fix only:

- Sales Intake edit mode
- Sales Intake save refresh
- Program and Batch Assignment edit mode
- Program and Batch Assignment save refresh
- student hub batch control visibility if needed

## Sales Intake Section Rules

Default state:

- show read-only summary

Editable roles:

- sales can edit sales intake if current rules allow
- admin/super_admin can view or edit according to existing rules
- viewer is read-only

Edit behavior:

- Edit button opens SalesIntakeForm only
- Save closes edit mode after success
- Cancel closes edit mode without saving
- Save must refresh student hub data without manual browser refresh

Do not change sales intake fields or schema.

## Program and Batch Assignment Rules

Default state:

- show read-only summary of current program and batch

Editable roles:

- admin/super_admin can edit program and batch assignment
- sales should not see admin assignment controls unless current rules already allow it
- viewer is read-only

Edit behavior:

- Edit button opens AdminApplicationForm or current assignment form only
- Save closes edit mode after success
- Cancel closes edit mode without saving
- Save must refresh student hub data without manual browser refresh

## Batch Transfer/Move Controls

Do not redesign batch transfer.

If batch controls already exist inside student hub:

- keep admin/super_admin visibility
- keep sales/viewer hidden
- make sure save actions refresh and close only the relevant edit mode if currently open

Do not add new transfer logic in this ticket.

## Refresh Pattern

Use the blueprint recommendation:

- server action updates database
- server action revalidates the student hub path
- client calls `router.refresh()` after successful save where needed
- explicitly close edit mode after successful save
- keep edit mode open if save fails
- do not rely on browser cache or cookies
- do not use `window.location.reload`

## Role Rules

Preserve current role logic.

Sales:

- can work only on sales-facing intake areas
- cannot use admin program/batch assignment unless existing app rules already allow
- cannot transfer batch

Admin/super_admin:

- can manage program/batch assignment
- can view sales intake

Viewer:

- read-only
- no Edit button
- no Save button

Do not loosen permissions.

## Not Included

Do not change:

- Student Information section
- Checklist
- Documents
- Fees
- Contracts
- Review workflow panel
- Archive/delete controls
- Application status locking
- Supabase schema
- RLS policies
- Word contract generation
- Contract history
- PDF export
- Adobe/DocuSign
- transcript module
- Excel import

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- Sales Intake shows summary by default
- allowed roles see Edit button for Sales Intake
- Sales Intake Save closes edit mode and updates summary without manual refresh
- Sales Intake Cancel closes edit mode without saving
- Program and Batch Assignment shows summary by default
- admin/super_admin see Edit button for Program and Batch Assignment
- sales/viewer do not get admin-only assignment controls
- Program/Batch Save closes edit mode and updates summary without manual refresh
- Program/Batch Cancel closes edit mode without saving
- viewer remains read-only
- no other student hub sections are changed
- no schema or RLS changes are made
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Files Modified

- `src/features/students/sales-intake-form.tsx` - added onSuccess/onCancel callbacks, router.refresh() on save, Cancel button
- `src/features/students/admin-application-form.tsx` - added onSuccess/onCancel callbacks, router.refresh() on save, Cancel button
- `src/features/students/batch-assignment-controls.tsx` - added router.refresh() after successful change/transfer
- `src/app/dashboard/students/[studentId]/page.tsx` - replaced direct form rendering with section wrappers

### Files Created

- `src/features/students/sales-intake-section.tsx` - summary/edit toggle wrapper for Sales Intake (same pattern as StudentInfoSection from STUDENT-HUB-01)
- `src/features/students/admin-program-section.tsx` - summary/edit toggle wrapper for Admin Program and Batch Assignment

### Behavior

Sales Intake section:

- shows read-only summary by default for all roles (sales, admin, super_admin)
- Edit button visible only for sales role when status is new_intake or information_needed and student is not archived
- admin/super_admin see read-only summary with no Edit button
- viewer sees separate read-only "Intake and Application" section (unchanged)
- Save updates database, calls revalidatePath, triggers router.refresh(), closes edit mode, shows success message for 3 seconds
- Cancel closes edit mode, discards unsaved changes
- edit mode stays open if save fails, error message shown inside form

Admin - Program and Batch Assignment section:

- shows read-only summary by default (assigned program and batch)
- Edit button visible only for admin/super_admin (section is hidden from sales and viewer)
- Save updates database, calls revalidatePath, triggers router.refresh(), closes edit mode, shows success message for 3 seconds
- Cancel closes edit mode, discards unsaved changes
- edit mode stays open if save fails, error message shown inside form

Batch Assignment Controls:

- not redesigned, transfer/move logic preserved
- admin/super_admin only visibility preserved
- added router.refresh() after successful change or transfer so hub data updates without manual browser refresh

### Status

Completed. Lint and build pass.