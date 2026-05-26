# WORKFLOW-02 - Student Hub State and Edit Pattern Blueprint

## Goal

Create a blueprint for fixing student hub save state, refresh behavior, and section edit patterns.

This is a planning and documentation ticket only.

## Current Problem

In the student file hub, some saved updates do not appear immediately after saving. The user must refresh the page to see the latest data.

The likely issue is not browser cookies or normal browser cache. The likely issue is server/client state, route refresh, revalidation, or local component state not being updated after server actions.

The student hub also currently has too many open/loose editing areas. Production workflow should use section-based edit controls.

## Product Direction

The student file hub should become the main working center.

Each section should show a clean read-only summary first.

Each editable section should have an Edit button.

When Edit is clicked, only that section opens for editing.

After Save:

- database is updated
- current student hub view reflects the new value without manual browser refresh
- success/error message is shown clearly
- section returns to read-only mode unless there is a reason to keep it open

After Cancel:

- section returns to read-only mode
- unsaved changes are discarded

## Sections To Review

Document current behavior and desired behavior for:

- Student information
- Sales intake
- Program and batch assignment
- Batch transfer/move controls
- Sales checklist
- Official admin checklist
- Documents
- Fees
- Contracts
- Review workflow panel
- Archive/status area

## State Refresh Rules

The blueprint must define the preferred pattern for save refresh.

Evaluate current usage of:

- server actions
- router.refresh()
- revalidatePath()
- useTransition()
- local component state
- redirect after save
- Supabase queries inside server components
- client forms receiving stale props

Define which pattern should be used for the student hub.

Preferred direction:

- server action updates database
- server action revalidates the student hub path
- client calls router.refresh() after successful save where needed
- component does not keep stale local copy after save
- no full browser reload
- no reliance on browser cache or cookies for fresh UI state

## Role Rules

The blueprint must preserve role rules.

Sales:

- can edit allowed sales-facing sections
- cannot approve admin checklist
- cannot generate contract
- cannot delete/archive
- cannot transfer batch if that is admin-only

Admin/super_admin:

- can edit official/admin sections
- can approve/finalize where allowed
- can generate contract
- can manage batch change/transfer where allowed

Viewer:

- read-only
- no visible save/edit buttons

## Edit Pattern Rules

Each section should follow this pattern:

- Summary view
- Edit button if role allows
- Edit form when opened
- Save
- Cancel
- Loading state
- Success/error message
- Fresh data after save

No section should require manual browser refresh to show updated data.

## Locking and Status Direction

Document how edit behavior should change by application status:

- new_intake
- admin_review
- information_needed
- ready_for_contract
- contract_generated
- signature_pending
- signed
- archived

This ticket does not implement state rules fully, but should identify which future ticket should handle them.

## Not Included

Do not implement:

- code changes
- database changes
- Word contract changes
- PDF export
- Adobe
- DocuSign
- delete/archive logic
- transcript module
- Excel import
- large UI redesign

## Deliverable

Created:

- `docs/blueprint/student-hub-state-edit-pattern.md`

## Final Notes

### Root Cause Summary

The stale UI has two main causes:

1. Most client form components do not call `router.refresh()` after a successful server action. The server actions do call `revalidatePath()`, but without `router.refresh()` the client may not refetch the updated data.

2. All form components use `defaultValue` on inputs. React only applies `defaultValue` on mount. Even after revalidation, form inputs keep showing old values until the component is unmounted and remounted.

Only 2 of 10 client components (ChecklistForm and FeeApprovalControls) currently call `router.refresh()` after save. The other 8 are affected.

### Components Missing router.refresh()

- StudentEditForm
- SalesIntakeForm
- AdminApplicationForm
- ReviewWorkflowPanel
- InlineReviewStatus
- EmbeddedDocumentUpload
- GenerateWordButton (uses fetch, not a server action)
- BatchAssignmentControls

### Recommended Next Implementation Tickets (in order)

1. WORKFLOW-03: Student info edit mode and refresh
2. WORKFLOW-04: Sales intake edit mode and refresh
3. WORKFLOW-05: Admin program/batch edit mode and refresh
4. WORKFLOW-06: Sales checklist edit mode and refresh
5. WORKFLOW-07: Official checklist edit mode
6. WORKFLOW-08: Workflow review panel refresh
7. WORKFLOW-09: Document upload and review status refresh
8. WORKFLOW-10: Contract generation refresh
9. WORKFLOW-11: Fee approval consistency check
10. WORKFLOW-12: Application status locking rules

Each ticket is small and independently deployable. Full details are in the blueprint document.

## Status

Completed. No code changes were made.

## Acceptance Criteria

- [x] current student hub save-state problem is documented
- [x] root cause areas are identified
- [x] section-by-section desired edit pattern is documented
- [x] role-based edit visibility is documented
- [x] save refresh pattern is defined
- [x] application status effects are listed
- [x] next implementation tickets are listed in safe order
- [x] no code changes are made
- [ ] `npm run lint` passes if run (no code changes, not required)
- [ ] `npm run build` passes if run (no code changes, not required)