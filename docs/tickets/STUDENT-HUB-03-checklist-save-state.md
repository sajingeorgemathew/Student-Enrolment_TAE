# STUDENT-HUB-03 - Checklist Save State Consistency

## Goal

Fix checklist sections in the student hub so checklist save behavior is consistent, refreshed immediately, and role-aware.

This ticket touches only checklist areas.

## Blueprint Source

Use:

- `docs/blueprint/student-hub-state-edit-pattern.md`
- `docs/tickets/WORKFLOW-02-student-hub-state-blueprint.md`

## Scope

Fix only:

- Sales checklist section
- Official admin checklist section
- Checklist save refresh behavior
- Checklist summary/edit behavior if currently loose
- Checklist progress display refresh if stale

## Current Direction

The student hub should use the same section behavior from STUDENT-HUB-01 and STUDENT-HUB-02:

- summary by default
- Edit button if role allows
- edit opens only that checklist section
- Save updates database
- Save refreshes current hub data without manual browser refresh
- Save returns to summary mode after success
- Cancel returns to summary mode without saving
- error keeps edit mode open

## Sales Checklist Rules

Sales checklist is sales-facing.

Allowed behavior:

- sales can edit sales checklist when current workflow allows
- admin/super_admin can view and may edit only if existing rules allow
- viewer is read-only

Do not loosen permissions.

## Official Admin Checklist Rules

Official admin checklist is admin-facing.

Allowed behavior:

- admin/super_admin can edit official checklist
- sales can view only if current app rules allow
- viewer is read-only

Do not allow sales to update official admin checklist.

## Save Refresh Rules

Checklist save must:

- update database
- revalidate the correct student hub path
- call router.refresh() after successful save where needed
- update checklist progress/status without manual refresh
- close edit mode after successful save
- keep edit mode open on error

Do not use `window.location.reload`.

## Known Issue To Avoid

Previously, some checklist views showed old values until navigating away and coming back. This ticket should make checklist state refresh immediately inside the student hub.

## Not Included

Do not change:

- Student Information
- Sales Intake
- Program and Batch
- Batch transfer/move controls
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

- Sales checklist shows summary/default state if section pattern exists
- allowed roles can open Sales checklist edit mode
- Sales checklist Save persists changes
- Sales checklist Save refreshes values without manual browser refresh
- Sales checklist Save returns to summary mode after success
- Official admin checklist follows role rules
- sales cannot update official admin checklist
- viewer cannot edit checklist
- checklist progress/status updates immediately after save
- no other hub sections are changed
- no schema or RLS changes are made
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Files Modified
- `src/features/students/sales-checklist-form.tsx` - Added `onSuccess`/`onCancel` props, `router.refresh()` via wrappedAction pattern, Cancel button
- `src/features/checklists/checklist-form.tsx` - Added `onSuccess`/`onCancel` props, replaced useEffect-based refresh with wrappedAction pattern, Cancel button
- `src/app/dashboard/students/[studentId]/page.tsx` - Replaced inline SalesChecklistForm and ChecklistForm with SalesChecklistSection and OfficialChecklistSection wrappers, removed unused checklistStatusLabels

### Files Created
- `src/features/students/sales-checklist-section.tsx` - Summary/edit toggle wrapper for sales checklist (follows StudentInfoSection pattern)
- `src/features/checklists/official-checklist-section.tsx` - Summary/edit toggle wrapper for official admin checklist (follows StudentInfoSection pattern)

### Sales Checklist Behavior
- Default state: read-only summary with status badges per item
- Edit button visible for sales and admin roles when not archived
- Viewer sees summary only, no Edit button
- Save updates database, calls router.refresh(), closes edit mode, shows success message
- Cancel closes edit mode without saving
- Error keeps edit mode open with error message displayed

### Official Admin Checklist Behavior
- Default state: read-only summary with field grid showing statuses
- Edit button visible for admin/super_admin when not archived
- Sales sees read-only summary, no Edit button
- Viewer sees read-only summary, no Edit button
- Save updates database, calls router.refresh(), closes edit mode, shows success message
- Cancel closes edit mode without saving
- Error keeps edit mode open with error message displayed

### Checklist Progress Refresh
- Sales checklist progress banner (all received / missing items) refreshes immediately after save via router.refresh()
- Official checklist readiness badge (Ready / In Progress / Needs Correction) refreshes immediately after save
- Contract readiness section reflects updated checklist state after save
- No manual browser refresh required

### Role Safety
- Sales cannot edit official admin checklist (no Edit button, server action enforces admin-only)
- Viewer cannot edit any checklist (no Edit button, readOnly summary only)
- Existing server-side role checks in saveSalesChecklist and saveAdmissionChecklist are preserved unchanged

### Backward Compatibility
- Standalone checklist page at /dashboard/checklists/[applicationId] continues to use ChecklistForm directly without onSuccess/onCancel (both props are optional)
- No schema, RLS, or database changes