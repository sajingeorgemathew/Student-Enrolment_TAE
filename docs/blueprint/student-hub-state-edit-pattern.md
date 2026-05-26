# Student Hub - State and Edit Pattern Blueprint

## Current Problem

In the student file hub (`/dashboard/students/[studentId]`), saved changes often do not appear until the user manually refreshes the page. Additionally, most editable sections are always open in edit mode rather than showing a clean read-only summary with an Edit button.

## Root Cause Analysis

The student hub page is a server component that fetches all data and passes it to client form components. The stale UI after save has two main causes:

### Cause 1 - Missing router.refresh() after server action calls

Most client form components call server actions via `useActionState` or `useTransition`. The server actions correctly call `revalidatePath()` to invalidate the cache, but several client components do not call `router.refresh()` after a successful save. Without `router.refresh()`, the client may not refetch the updated RSC payload, leaving the page with stale server-rendered data.

Components missing `router.refresh()` after save:
- StudentEditForm
- SalesIntakeForm
- AdminApplicationForm
- ReviewWorkflowPanel (uses useTransition with direct calls)
- InlineReviewStatus
- EmbeddedDocumentUpload
- GenerateWordButton (uses fetch, not a server action)
- BatchAssignmentControls

Components that already call `router.refresh()` correctly:
- ChecklistForm
- FeeApprovalControls

### Cause 2 - Uncontrolled form inputs with defaultValue

All form components use `defaultValue` on inputs. In React, `defaultValue` only sets the initial DOM value on mount. Even when the parent server component re-renders with new props after revalidation, the form inputs retain their old values because React does not update `defaultValue` on re-render. The form appears stale even though the underlying data has changed.

This means:
- The read-only summary sections (rendered by the server component) will update after revalidation
- The edit form fields will keep showing old values until the component is unmounted and remounted

### Cause 3 - Client components holding stale local state

Some components store local state (e.g., `selectedProgram` in SalesIntakeForm and AdminApplicationForm) that is initialized from props but never reset after a save. Even if new props arrive via revalidation, the local state remains unchanged.

### Cause 4 - GenerateWordButton uses fetch instead of a server action

The contract generation button calls a REST API endpoint via `fetch()`. This bypasses the server action + revalidation system entirely. After generating a contract, the page has no signal to refetch data, so the contract status, generation history, and application status badge all remain stale.

## Preferred Save and Refresh Pattern

Every editable section in the student hub should follow this pattern:

1. Server action updates the database
2. Server action calls `revalidatePath("/dashboard/students/[studentId]")`
3. Client component calls `router.refresh()` on success (triggers RSC refetch)
4. Component uses a `key` prop tied to a changing value (e.g., `updated_at` timestamp) so React unmounts and remounts the form with fresh `defaultValue` props
5. On remount, the form shows the newly saved values
6. No full browser reload is required

For actions that use `fetch()` instead of server actions (like contract generation), the component should call `router.refresh()` after the fetch completes successfully.

For the edit pattern, each section should:

1. Default to a read-only summary view
2. Show an Edit button if the user's role allows editing
3. On Edit click, replace the summary with the edit form for that section only
4. On Save, update the database, refresh the hub data, close the edit form, and show a success message
5. On Cancel, close the edit form and discard unsaved changes
6. Show loading state during save
7. Show error message if save fails

## Section-by-Section Analysis

### 1. Student Summary

- Current behavior: Read-only summary rendered by server component. Always visible.
- Current issues: None for this section. It is server-rendered and updates via revalidation.
- Desired behavior: No change needed. This is the always-visible summary.
- Edit mode: Not applicable (editing is handled in section 2).

### 2. Student Information Edit

- Current behavior: Edit form is always open for sales and admin users. Uses `useActionState` with `updateStudent`. Shows success/error message after save.
- Current issues:
  - Form is always in edit mode, no summary/edit toggle
  - No `router.refresh()` after save
  - `defaultValue` inputs keep old values after save
  - No Cancel button
- Desired behavior:
  - Show summary by default (reuse Student Summary fields)
  - Edit button for sales and admin roles
  - Edit form opens only for this section
  - Save calls `router.refresh()` and form remounts via key prop
  - Cancel closes edit mode
  - Success/error message shown
- Role visibility:
  - sales: can edit
  - admin/super_admin: can edit
  - viewer: no Edit button, summary only

### 3. Sales Intake

- Current behavior: Sales users see the full edit form. Admin users see read-only FieldGrid. Uses `useActionState` with `updateApplicationSales`.
- Current issues:
  - Form is always in edit mode for sales
  - No `router.refresh()` after save
  - `defaultValue` inputs keep old values
  - Local state (`selectedProgram`, `batches`) not reset after save
  - No Cancel button
- Desired behavior:
  - Show read-only summary by default for all roles
  - Edit button for sales users (when status is new_intake or information_needed)
  - Admin can view but not edit sales fields (current behavior is correct)
  - Save refreshes and closes edit mode
  - Cancel closes edit mode
- Role visibility:
  - sales: can edit (when status allows)
  - admin/super_admin: read-only view
  - viewer: read-only view

### 4. Sales Intake Checklist

- Current behavior: Edit form is always open for sales/admin. Read-only for viewers and archived students. Uses `useActionState` with `saveSalesChecklist`.
- Current issues:
  - Form always in edit mode for sales/admin
  - No `router.refresh()` after save
  - Has a `key` prop based on `updated_at` which helps with remounting
  - No Cancel button
- Desired behavior:
  - Show summary with status badges by default
  - Edit button for sales and admin roles
  - Save refreshes and closes edit mode
  - Cancel closes edit mode
- Role visibility:
  - sales: can edit
  - admin/super_admin: can edit
  - viewer: read-only summary

### 5. Workflow Review

- Current behavior: Inline editing of admin notes and workflow action buttons. Uses `useTransition` with direct server action calls.
- Current issues:
  - No `router.refresh()` after workflow actions
  - After status change (e.g., submit to admin review, mark ready), the status badge and next action text do not update
  - Admin notes textarea uses local `useState` initialized from props, never reset
- Desired behavior:
  - Status display, dates, and next action always visible (no edit toggle needed for status info)
  - Admin notes should have inline edit/save pattern (current approach is acceptable)
  - After any workflow action, `router.refresh()` must be called to update the status badge, dates, and next action text
  - Success/error messages are already shown (correct)
- Role visibility:
  - sales: can send to admin review
  - admin/super_admin: can mark information needed, mark ready for contract, save admin notes
  - viewer: read-only view of status and notes

### 5b. Admin - Program and Batch Assignment

- Current behavior: Edit form always open for admin. Uses `useActionState` with `updateApplicationAdmin`.
- Current issues:
  - Form always in edit mode
  - No `router.refresh()` after save
  - `defaultValue` inputs keep old values
  - Local state for program/batch not reset
  - No Cancel button
- Desired behavior:
  - Show current program and batch as summary
  - Edit button for admin/super_admin
  - Save refreshes and closes edit mode
  - Cancel closes edit mode
- Role visibility:
  - admin/super_admin: can edit
  - sales: not visible (section is admin-only)
  - viewer: not visible

### 6. Program and Batch (Read-only display)

- Current behavior: Read-only display of program and batch details. Batch assignment controls (change/transfer) have their own open/close panels.
- Current issues:
  - BatchAssignmentControls: no `router.refresh()` after change/transfer
  - After batch change, the Program and Batch display above does not update
  - Panels close on success but the parent data is stale
- Desired behavior:
  - Read-only display is correct
  - Batch change/transfer panels already use open/close pattern (good)
  - After change/transfer, `router.refresh()` must update the batch display
- Role visibility:
  - admin/super_admin: can change/transfer batch
  - sales: can view batch, cannot change/transfer (unless allowed)
  - viewer: read-only

### 7. Documents

- Current behavior: Document list is server-rendered. Upload form uses open/close toggle (good pattern). InlineReviewStatus allows admin to change document status inline.
- Current issues:
  - EmbeddedDocumentUpload: no `router.refresh()` after upload, so the document list does not update
  - InlineReviewStatus: no `router.refresh()` after status change, so the checklist readiness summary does not update
  - Upload form resets via `formKey` state (good) but document list stays stale
- Desired behavior:
  - Document list updates after upload without page reload
  - Document status change updates related sections (checklist readiness)
  - Upload panel already has open/close toggle (keep as is)
  - Inline review status is acceptable as an inline control (no edit toggle needed)
- Role visibility:
  - sales/admin: can upload documents
  - admin: can change document review status
  - viewer: read-only list

### 8. Official Admin Checklist

- Current behavior: Edit form always open for admin. Read-only view for non-admin. Uses `useActionState` with `saveAdmissionChecklist`. Has `router.refresh()` in useEffect on success. Has `key` prop based on `admin_verified_at`.
- Current issues:
  - Form always in edit mode for admin
  - The `router.refresh()` pattern is correct (this section works better than others)
  - No Cancel button
- Desired behavior:
  - Show summary by default
  - Edit button for admin/super_admin
  - Save refreshes (already implemented correctly via router.refresh)
  - Cancel closes edit mode
- Role visibility:
  - admin/super_admin: can edit
  - sales: read-only summary
  - viewer: read-only summary

### 9. Fees and Payment Schedule

- Current behavior: Read-only display of fee data in the hub. Edit link goes to a separate page (`/dashboard/fees/[applicationId]`). FeeApprovalControls allow approve/reopen inline.
- Current issues:
  - FeeApprovalControls correctly calls `router.refresh()` (good)
  - Fee editing happens on a separate page, so the hub needs to show fresh data when the user navigates back. The fee actions correctly call `revalidatePath` for the student hub path.
  - No major stale state issue for this section specifically
- Desired behavior:
  - Read-only display with link to edit page (current pattern is acceptable)
  - Approval/reopen controls inline (current pattern is correct)
  - Data should be fresh when returning from fee edit page
- Role visibility:
  - admin/super_admin: can approve/reopen, can navigate to fee editor
  - sales: can view fee summary
  - viewer: can view fee summary

### 10. Contract Readiness

- Current behavior: Read-only summary of readiness items. Always visible.
- Current issues: Data is server-rendered. Depends on other sections being up to date (checklist, fees, documents, batch). If those sections are stale, this section shows stale readiness.
- Desired behavior: No edit mode needed. Should automatically reflect current state when hub data refreshes.

### 11. Contract - Word Export

- Current behavior: Shows latest contract status. GenerateWordButton triggers a download via fetch. ContractGenerationHistory shows past generations.
- Current issues:
  - GenerateWordButton uses `fetch()`, not a server action
  - No `router.refresh()` after generation
  - Contract status, generation history, and application status badge do not update after generation
- Desired behavior:
  - After contract generation, call `router.refresh()` to update the contract status badge, generation history, and application status
  - Contract preview link is correct (separate page)
- Role visibility:
  - admin/super_admin: can generate contract (when status allows)
  - sales: can view contract status
  - viewer: can view contract status

### 12. Archive and Delete

- Current behavior: Archive/restore/delete controls for admin. Handled by ArchiveControls component.
- Current issues: Would need to verify ArchiveControls calls router.refresh. Archive actions affect the entire hub (disabling all editing).
- Desired behavior: After archive/restore, the full page should refresh to reflect the new archived state (banner, disabled controls).
- Role visibility:
  - admin/super_admin: can archive/restore
  - super_admin: can hard delete
  - sales/viewer: not visible

## Edit Mode Pattern Summary

Each section should implement this interface:

```
State: "summary" (default) or "editing"

Summary view:
- Read-only display of current values
- Edit button if role allows and status allows
- No form inputs visible

Edit view:
- Form inputs populated with current values
- Save button (with loading state)
- Cancel button
- Success message on save (auto-dismiss or persistent until next action)
- Error message on failure
- After save: close edit mode, refresh hub data, show success

Behavior:
- Only one section should be in edit mode at a time (recommended but not required)
- Edit mode opens only the clicked section
- Other sections remain in summary view
- Save updates database, calls revalidatePath, and triggers router.refresh
- Cancel discards unsaved changes and returns to summary view
```

## Role-Based Edit Visibility

| Section | sales | admin | super_admin | viewer |
|---|---|---|---|---|
| Student Info | Edit | Edit | Edit | Read |
| Sales Intake | Edit (status-gated) | Read | Read | Read |
| Sales Checklist | Edit | Edit | Edit | Read |
| Workflow Review | Send to Review | Review actions + notes | Review actions + notes | Read |
| Admin Program/Batch | Hidden | Edit | Edit | Hidden |
| Batch Change/Transfer | Hidden | Edit | Edit | Hidden |
| Documents Upload | Upload | Upload | Upload | Hidden |
| Document Review Status | Hidden | Edit (inline) | Edit (inline) | Hidden |
| Official Checklist | Read | Edit | Edit | Read |
| Fees | Read | Approve/Reopen + Edit link | Approve/Reopen + Edit link | Read |
| Contract Generation | Hidden | Generate (status-gated) | Generate (status-gated) | Hidden |
| Archive/Delete | Hidden | Archive/Restore | Archive/Restore/Delete | Hidden |

## Application Status and Edit Locking

Edit availability should vary by application status. This table describes the general direction. Implementation details belong in a future ticket.

| Status | Student Info | Sales Intake | Checklists | Fees | Contract | Workflow |
|---|---|---|---|---|---|---|
| new_intake | Editable | Editable by sales | Editable | Editable | Locked | Send to review |
| admin_review | Editable | Read-only for sales | Editable | Editable | Locked | Admin actions |
| information_needed | Editable | Editable by sales | Editable | Editable | Locked | Resend to review |
| ready_for_contract | Editable | Read-only | Editable | Editable | Generate allowed | Status display |
| contract_generated | Editable | Read-only | Read-only (warn) | Read-only (warn) | Regenerate allowed | Status display |
| signature_pending | Read-only (warn) | Read-only | Read-only | Read-only | Status display | Status display |
| signed | Read-only | Read-only | Read-only | Read-only | Read-only | Status display |
| archived | All locked | All locked | All locked | All locked | All locked | All locked |

Notes:
- "warn" means the system should warn the admin before allowing edits that could invalidate an already-generated contract
- Archived students already have a banner and all editing is disabled (current implementation is correct)
- Full status-locking rules should be implemented in a dedicated future ticket

## Recommended Future Tickets (in order)

These tickets should be implemented in this order. Each is small and independently deployable.

### WORKFLOW-03: Student info edit mode and refresh
- Add summary/edit toggle to Student Information section
- Add `router.refresh()` after save
- Add `key` prop to force form remount with fresh values
- Add Cancel button
- Verify Student Summary section updates after save

### WORKFLOW-04: Sales intake edit mode and refresh
- Add summary/edit toggle to Sales Intake section
- Add `router.refresh()` after save
- Reset local state (selectedProgram, batches) after save via key prop
- Add Cancel button
- Verify read-only view shows updated values

### WORKFLOW-05: Admin program/batch edit mode and refresh
- Add summary/edit toggle to Admin Program and Batch Assignment section
- Add `router.refresh()` after save
- Reset local state after save
- Add Cancel button
- Add `router.refresh()` to BatchAssignmentControls after change/transfer

### WORKFLOW-06: Sales checklist edit mode and refresh
- Add summary/edit toggle to Sales Intake Checklist section
- Add `router.refresh()` after save
- Add Cancel button
- Verify summary status badges update after save

### WORKFLOW-07: Official checklist edit mode
- Add summary/edit toggle to Official Admin Checklist section
- `router.refresh()` is already implemented (verify it still works)
- Add Cancel button
- Verify checklist readiness badge updates

### WORKFLOW-08: Workflow review panel refresh
- Add `router.refresh()` after all workflow actions (submit to review, mark info needed, mark ready)
- Verify status badge, dates, and next action text update after each action
- Verify admin notes reset to new value after save

### WORKFLOW-09: Document upload and review status refresh
- Add `router.refresh()` to EmbeddedDocumentUpload after successful upload
- Add `router.refresh()` to InlineReviewStatus after status change
- Verify document list updates after upload
- Verify checklist readiness updates after document review status change

### WORKFLOW-10: Contract generation refresh
- Add `router.refresh()` to GenerateWordButton after successful generation
- Verify contract status badge updates
- Verify generation history updates
- Verify application status badge updates

### WORKFLOW-11: Fee approval consistency check
- Verify FeeApprovalControls refresh is working correctly end to end
- Verify fee data is fresh when returning from fee edit page
- Verify contract readiness section reflects fee approval status changes

### WORKFLOW-12: Application status locking rules
- Implement edit-locking based on application status
- Warn admin before editing after contract generation
- Lock all editing for signed and archived statuses
- This ticket defines the business rules; individual section tickets may need small adjustments

## Summary

The stale state problem is caused by client form components that do not call `router.refresh()` after a successful server action, combined with React's `defaultValue` behavior that preserves old input values across re-renders. The fix is consistent: every save action must trigger `router.refresh()`, and form components must remount (via `key` prop) to pick up fresh values.

The always-open edit forms problem is a UX issue: most sections render the full edit form instead of a clean summary. The fix is to add a summary/edit toggle state to each section, defaulting to summary mode with an Edit button.

Both fixes are incremental and can be applied section by section in the ticket order listed above.
