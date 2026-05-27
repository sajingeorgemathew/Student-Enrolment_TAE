# STUDENT-HUB-01 - Student Info Edit Mode and Refresh Fix

## Goal

Fix the Student Information section in the student hub so it uses a clean summary/edit pattern and updates immediately after saving without requiring a manual browser refresh.

This ticket touches only the Student Information section.

## Blueprint Source

Use:

- `docs/blueprint/student-hub-state-edit-pattern.md`
- `docs/tickets/WORKFLOW-02-student-hub-state-blueprint.md`

The blueprint identified that stale student hub data is likely caused by missing `router.refresh()` after server actions and form components using `defaultValue`, which can keep stale values until remount.

## Main Product Direction

The student file hub should show clean read-only summaries by default.

Each editable section should have its own Edit button.

Only the selected section opens for editing.

After Save:

- database updates
- student hub reflects the new values without full browser reload
- section closes back to summary mode
- success/error message is shown clearly

After Cancel:

- unsaved changes are discarded
- section returns to summary mode

## Scope

Fix only:

- Student Information section
- StudentEditForm behavior
- student info save refresh behavior
- student info summary/edit UI

## Student Information Fields

Preserve current fields already supported by the app.

Do not add new schema fields.

Likely fields include:

- first name
- middle name if available
- last name
- student number
- email
- phone
- alternate phone if available
- date of birth
- mailing address
- city
- province
- postal code
- country if available
- international student status if already supported

Use the existing schema and current form fields as source of truth.

## Required Behavior

### Summary mode

By default, the Student Information section should show a clean read-only summary.

The summary should show key student details clearly.

### Edit mode

If the current role is allowed to edit student information, show an Edit button.

Clicking Edit opens the StudentEditForm for this section only.

### Save

After successful save:

- update database
- call the correct refresh/revalidation pattern
- refresh the student hub data without manual browser refresh
- close edit mode
- show a success message

### Cancel

Cancel should:

- close edit mode
- discard unsaved form changes
- return to summary mode

### Errors

If save fails:

- keep edit mode open
- show a clear error message
- do not show stale success state

## Refresh Pattern

Use the blueprint recommendation:

- server action updates database
- server action revalidates the student hub path
- client calls `router.refresh()` after successful save if needed
- avoid stale local state
- do not rely on browser cookies/cache
- do not require full page reload

## Role Rules

Preserve existing role logic.

Admin/super_admin:

- can edit student information

Sales:

- can edit student information only if current app rules already allow it

Viewer:

- read-only only
- no Edit button
- no Save button

Do not loosen permissions.

## Status/Archive Rules

If the student/application is archived and current app rules make archived records read-only, preserve that behavior.

Do not add new status locking rules in this ticket.

Do not implement broader application state rules here.

## Not Included

Do not change:

- Sales intake
- Program and batch assignment
- Batch transfer/move controls
- Sales checklist
- Official admin checklist
- Documents
- Fees
- Contracts
- Review workflow panel
- Archive/delete controls
- Application status workflow
- Supabase schema
- RLS policies
- Word contract template
- Contract generation
- PDF export
- Adobe/DocuSign
- transcript module
- Excel import

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- Student Information shows read-only summary by default
- allowed roles see Edit button
- viewer does not see Edit button
- clicking Edit opens only the Student Information form
- Cancel closes edit mode and discards unsaved changes
- Save persists changes
- Save refreshes the student hub without manual browser refresh
- Save returns to summary mode
- updated values are visible immediately after save
- error state is clear if save fails
- no other hub sections are changed
- no database/schema changes are made
- role rules are preserved
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Files Modified

- `src/features/students/student-edit-form.tsx` - Added `onSuccess` and `onCancel` callback props, `useRouter` and `useEffect` for calling `router.refresh()` after successful save, Cancel button next to Save button, removed inline success message (moved to parent).
- `src/features/students/student-info-section.tsx` - New client component that manages summary/edit toggle state. Shows read-only summary by default with Edit button when `canEdit` is true. Opens `StudentEditForm` on Edit click. Closes edit mode on Save or Cancel. Shows auto-dismissing success message after save.
- `src/app/dashboard/students/[studentId]/page.tsx` - Replaced separate "Student Summary" (read-only) and "Edit Student Information" (always-open form) sections with a single "Student Information" section using `StudentInfoSection`. Passes `canEdit` based on role and archive state.

### Behavior

- Default state: read-only summary showing all student fields.
- Edit button visible only for sales, admin, and super_admin roles when student is not archived.
- Viewer role sees summary only, no Edit button.
- Clicking Edit opens `StudentEditForm` for the Student Information section only.
- Cancel closes edit mode, discards unsaved changes, returns to summary.
- Save calls `updateStudent` server action, which updates the database and calls `revalidatePath`.
- After successful save, the client calls `router.refresh()` to refetch server data, then closes edit mode and shows a success message.
- Form remounts cleanly on each edit via `key={student.updated_at}`, preventing stale `defaultValue` inputs.
- On error, edit mode stays open and error message is shown.

### Refresh Pattern

- Server action `updateStudent` calls `revalidatePath("/dashboard/students/[studentId]")`.
- Client calls `router.refresh()` after success, triggering RSC refetch.
- Form unmounts on save (edit mode closes), so stale `defaultValue` is not an issue.
- On next Edit click, form remounts with fresh props from the updated server data.
- No `window.location.reload()` or browser cache dependency.

### Role Behavior

- admin and super_admin: can edit student information (unchanged).
- sales: can edit student information (unchanged).
- viewer: read-only summary, no Edit button (unchanged).
- Archived students: no Edit button regardless of role (unchanged).