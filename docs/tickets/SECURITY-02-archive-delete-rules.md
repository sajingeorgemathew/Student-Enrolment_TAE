# SECURITY-02 - Archive and Delete Rules

## Goal

Add safe archive and delete rules for production use.

The system should avoid hard deletes in normal workflow. Most records should be archived first. Hard delete should be restricted to super_admin only.

## Main Product Rule

Production data must be protected.

Sales and viewer should never delete records.

Admin can archive operational records where appropriate.

Super admin can perform hard delete only when necessary.

## Roles

Use existing roles:

- super_admin
- admin
- sales
- viewer

## Role Rules

### Sales

Sales cannot:

- archive students
- delete students
- archive documents
- delete documents
- archive batches
- delete batches
- archive programs
- delete programs
- archive applications
- delete applications
- delete contracts
- delete fee schedules
- delete checklist records

### Viewer

Viewer is read-only.

Viewer cannot:

- archive
- delete
- edit
- upload
- approve
- generate

### Admin

Admin can archive where safe:

- archive student application/intake if needed
- archive documents if needed
- archive contracts if needed
- archive old fee schedules if needed

Admin cannot hard delete:

- students
- documents
- batches
- programs
- applications
- contracts
- fee schedules

### Super Admin

Super admin can:

- archive records
- hard delete records if needed
- access destructive actions
- perform emergency cleanup

Hard delete should still be limited and clear.

## Archive-First Rule

Use archive-first behavior.

If a record needs to be removed from daily workflow, archive it.

Do not hard delete by default.

Hard delete should be separate, restricted, and clearly labelled.

## Scope

Review and implement archive/delete foundations for:

- students
- applications
- student_documents
- programs
- batches
- fee_schedules
- payment_installments
- admission_checklists
- contracts
- contract_events
- audit_events if available

## Database Direction

If tables do not already support archive fields, add safe nullable columns where appropriate:

- archived_at timestamptz
- archived_by uuid
- archive_reason text

Do not add destructive cascade deletes.

Do not remove existing data.

Do not rename existing columns unless absolutely necessary.

## Audit Direction

All archive/delete actions should be auditable.

Audit event payload should include:

- actor user id
- actor role
- action type
- table name
- record id
- reason
- timestamp
- old status if useful
- new status if useful

Use existing audit_events table if available.

If audit_events does not exist, create it safely.

## UI Direction

Do not add broad delete buttons everywhere.

Add only safe, limited controls if needed:

- Archive
- Restore from Archive
- Hard Delete

Visibility:

- Archive: admin and super_admin only
- Restore: admin and super_admin only
- Hard Delete: super_admin only

For this ticket, it is acceptable to implement backend/action foundations and minimal UI.

Do not clutter the student file.

## Confirmation Direction

Destructive actions must require clear confirmation.

For hard delete, label clearly:

- Hard Delete

Do not use vague labels like:

- Remove
- Clear
- Discard

## Student File Direction

On student file, if archive controls are added:

- admin/super_admin can archive application/student file if safe
- super_admin can hard delete only if implemented
- sales/viewer see no archive/delete controls

## Document Direction

Documents are important evidence.

Rules:

- sales cannot delete documents
- viewer cannot delete documents
- admin can archive a document if needed
- super_admin can hard delete document metadata and storage file if implemented safely

Do not delete storage files unless the code clearly handles both metadata and storage cleanup safely.

## Batch and Program Direction

Batches and programs should not be casually deleted.

Rules:

- admin can mark inactive/archive if safe
- super_admin can hard delete only if no dependent records or if safely blocked
- do not delete a batch with enrolled students
- do not delete a program with active batches

## Not Included

Do not implement:

- full role management UI
- transcript module
- Excel import
- contract template changes
- Adobe
- DocuSign
- PDF export
- batch master view
- student transfer changes
- major UI redesign

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- archive-first rules are documented and implemented where safe
- sales cannot see or use archive/delete controls
- viewer cannot see or use archive/delete controls
- admin can archive where appropriate
- super_admin can access hard delete controls only where safely implemented
- hard delete is not available to admin/sales/viewer
- audit event foundation exists or is reused
- destructive actions require confirmation
- document delete is restricted
- student delete is restricted
- batch/program delete is restricted
- no destructive cascade deletes are introduced
- no long em dash characters are introduced
- no emojis are added
- `npm run lint` passes
- `npm run build` passes

---

## Implementation Notes

Implemented: 2026-05-25

### Migration

File: `supabase/migrations/20260524_security_02_archive_delete_rules.sql`

Adds archive columns (`archived_at`, `archived_by`, `archive_reason`) to:
- students (archive_reason only - archived_at and archived_by were added in SECURITY-01)
- applications
- student_documents
- programs
- batches
- fee_schedules
- contracts

Enhances `audit_events` table with `actor_role` and `reason` columns.

Adds delete RLS policies (super_admin only) for:
- programs
- batches
- fee_schedules
- contracts
- payment_installments
- admission_checklists

### Server Actions

File: `src/features/archive/actions.ts`

- `archiveRecord(tableName, recordId, reason)` - admin/super_admin
- `restoreRecord(tableName, recordId)` - admin/super_admin
- `hardDeleteRecord(tableName, recordId, reason)` - super_admin only
- `getArchiveInfo(tableName, recordId)` - fetch archive status
- Safety checks: batch with enrolled students, program with active batches, student with active applications

### UI Component

File: `src/features/archive/archive-controls.tsx`

- Archive button with reason input (admin/super_admin)
- Restore from Archive button (admin/super_admin)
- Hard Delete button with reason and HARD DELETE confirmation (super_admin only)
- Archived banner shown at top of student detail page

### Integration

Student detail page (`src/app/dashboard/students/[studentId]/page.tsx`):
- Archive/delete controls section added for admin/super_admin
- Archived banner shown when student is archived
- Sales and viewer users see no archive/delete controls

### Documentation

File: `docs/blueprint/security-archive-delete-rules.md`

### Manual Supabase SQL Required

The migration file must be run manually against the Supabase database.

Run the contents of `supabase/migrations/20260524_security_02_archive_delete_rules.sql` in the Supabase SQL Editor.