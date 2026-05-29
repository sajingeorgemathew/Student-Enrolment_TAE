# STUDENT-HUB-04 - Fees Save State Consistency

## Goal

Fix the Fees section in the student hub so fee save, approve, reopen, and summary display behavior is consistent and refreshed immediately.

This ticket touches only the Fees section.

## Blueprint Source

Use:

- `docs/blueprint/student-hub-state-edit-pattern.md`
- `docs/tickets/WORKFLOW-02-student-hub-state-blueprint.md`

## Current Direction

The student hub sections should follow the same pattern already applied to:

- Student Information
- Intake and Program/Batch
- Checklists

Pattern:

- summary by default
- Edit button if role allows
- edit opens only that section
- Save updates database
- Save refreshes current hub data without manual browser refresh
- Save returns to summary mode after success
- Cancel returns to summary mode without saving
- error keeps edit mode open

## Scope

Fix only:

- Fees section in the student hub
- Fee summary display
- Fee edit mode
- Fee save refresh behavior
- Fee approval/reopen refresh behavior if already present
- FeeCalculatorForm behavior only where used in the student hub

## Fee Section Rules

Default state:

- show read-only fee summary first

Editable roles:

- admin/super_admin can edit/create fees if current rules allow
- sales should not edit official fees unless current rules already allow it
- viewer is read-only

Do not loosen permissions.

## Save Behavior

After fee save succeeds:

- database updates
- current student hub data refreshes without manual browser refresh
- section returns to summary mode
- saved values are visible immediately
- success/error message is clear

If save fails:

- keep edit mode open
- show error clearly

## Approval/Reopen Behavior

If fee approval/reopen controls already exist:

- admin/super_admin can approve/reopen if current rules allow
- sales/viewer cannot approve/reopen
- approve/reopen should refresh fee summary/status immediately
- do not add new fee workflow rules in this ticket

## Refresh Pattern

Use the blueprint recommendation:

- server action updates database
- server action revalidates the correct student hub path
- client calls `router.refresh()` after successful save where needed
- explicitly close edit mode after successful save
- do not rely only on `revalidatePath`
- do not use `window.location.reload`

## Not Included

Do not change:

- Student Information
- Sales Intake
- Program and Batch
- Batch transfer/move controls
- Sales checklist
- Official admin checklist
- Documents
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

- Fees section shows summary/default state first
- allowed roles can open fee edit mode
- viewer cannot edit fees
- sales cannot access admin-only fee actions
- Fee Save persists changes
- Fee Save refreshes values without manual browser refresh
- Fee Save returns to summary mode after success
- Fee Cancel returns to summary mode without saving
- fee approval/reopen refreshes summary/status if touched
- no other hub sections are changed
- no schema or RLS changes are made
- `npm run lint` passes
- `npm run build` passes

## Status

Completed.

## Implementation Notes

### Files Modified

- `src/features/fees/fee-section.tsx` - new component. Wraps fee summary/edit toggle. Summary mode shows read-only fee fields, installments table, and approval controls. Edit mode shows FeeCalculatorForm inline with Cancel and Save Draft buttons.
- `src/features/fees/fee-calculator-form.tsx` - added optional `onSuccess` and `onCancel` callback props. After save/approve/reopen success, calls `onSuccess()` then `router.refresh()`. Cancel button shown when `onCancel` is provided. No change to existing behavior when callbacks are not passed (separate fee page).
- `src/features/students/actions.ts` - added program default fee fields (`default_tuition`, `default_book_fee`, `default_compulsory_fee`, `default_professional_exam_fee`) to the programs select in `getStudentById` so FeeCalculatorForm can populate defaults for new fee schedules.
- `src/app/dashboard/students/[studentId]/page.tsx` - replaced inline fee section rendering with FeeSection component. Updated program type to include default fee fields. Changed "Edit Fees" header link to "Full View" (kept as secondary link to separate fee detail page).

### Fees Summary/Edit Behavior

- Default state: read-only summary showing fee fields and installments
- Edit button shown for admin/super_admin when not archived and fees are not approved
- When fees are approved, Edit button is hidden. Admin must first Reopen via approval controls
- Create Fee Schedule button shown when no fee schedule exists (admin only)
- FeeCalculatorForm opens inline in the hub when Edit or Create is clicked
- Save Draft saves changes, refreshes hub data, and closes to summary mode
- Cancel closes to summary mode without saving
- Error keeps edit mode open with error message visible
- Approve from within edit mode also closes to summary mode after success

### Fee Approval/Reopen Behavior

- FeeApprovalControls shown in summary mode (unchanged from prior behavior)
- Approve button shown when status is draft or reopened (admin only)
- Reopen button shown when status is approved (admin only)
- Both call `router.refresh()` after success (already working before this ticket)
- After reopen, Edit button becomes available again

### Refresh Pattern

- `saveFeeSchedule` server action revalidates `/dashboard/students/[studentId]` path (already in place)
- `approveFeeSchedule` and `reopenFeeSchedule` also revalidate student hub path (already in place)
- FeeCalculatorForm calls `router.refresh()` after success
- FeeApprovalControls calls `router.refresh()` after success
- FeeSection explicitly closes edit mode via `onSuccess` callback after save
- No `window.location.reload()` used

### Role Behavior

- admin/super_admin: can edit, create, approve, reopen fees. Full view link visible.
- sales: can view fee summary (read-only). No edit or approval buttons.
- viewer: can view fee summary (read-only). No edit or approval buttons.
- Permissions enforced server-side by `saveFeeSchedule`, `approveFeeSchedule`, `reopenFeeSchedule` (unchanged).