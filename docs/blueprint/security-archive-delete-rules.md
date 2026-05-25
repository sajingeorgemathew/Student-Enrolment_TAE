# Archive and Delete Rules

Status: Active
Ticket: SECURITY-02
Created: 2026-05-25

---

## Archive-First Rule

The system uses archive-first behavior for all record removal.

Normal workflow should never hard delete records. Records are archived by setting `archived_at`, `archived_by`, and `archive_reason` columns. Hard delete is reserved for super_admin only and requires confirmation.

---

## Archive Fields

The following tables have archive columns:

- students: archived_at, archived_by, archive_reason
- applications: archived_at, archived_by, archive_reason
- student_documents: archived_at, archived_by, archive_reason
- programs: archived_at, archived_by, archive_reason
- batches: archived_at, archived_by, archive_reason
- fee_schedules: archived_at, archived_by, archive_reason
- contracts: archived_at, archived_by, archive_reason

All archive columns are nullable. A record is considered archived when `archived_at` is not null.

---

## Role Rules

### Sales

Sales cannot:
- Archive any record
- Restore any record
- Delete any record
- See archive or delete controls

### Viewer

Viewer cannot:
- Archive any record
- Restore any record
- Delete any record
- See archive or delete controls

### Admin

Admin can:
- Archive records (students, applications, documents, fee schedules, contracts)
- Restore archived records

Admin cannot:
- Hard delete any record

### Super Admin

Super admin can:
- Archive records
- Restore archived records
- Hard delete records (with confirmation and safety checks)

---

## Safety Rules

Hard delete is blocked in the following cases:

- Cannot delete a batch that has active (non-archived) applications
- Cannot delete a program that has active batches
- Cannot delete a student that has active (non-archived) applications

The system checks these conditions before allowing deletion.

---

## Delete RLS Policies

The following tables have RLS delete policies restricted to super_admin only:

- students
- applications
- student_documents
- quotes
- programs
- batches
- fee_schedules
- contracts
- payment_installments
- admission_checklists

---

## Audit Events

All archive, restore, and hard delete actions are logged to the `audit_events` table.

Audit event fields:
- actor_id: the user performing the action
- actor_role: the role of the user at the time of the action
- event_type: archive, restore, or hard_delete
- table_name: the table affected
- record_id: the record affected
- reason: the reason provided by the user
- payload: snapshot of the record data (for hard delete)
- created_at: timestamp of the action

---

## Hard Delete Confirmation

Hard delete requires:
1. A reason for deletion
2. The user must type HARD DELETE to confirm
3. Safety checks must pass

---

## UI Controls

Archive and delete controls are visible on the student detail page for admin and super_admin users only.

Controls:
- Archive button: visible to admin and super_admin when record is not archived
- Restore from Archive button: visible to admin and super_admin when record is archived
- Hard Delete button: visible to super_admin only

Sales and viewer users do not see these controls.

---

## Document Storage

Document hard delete currently removes the database record only.

Storage file cleanup should be handled separately. Do not delete storage files unless both metadata and storage cleanup are handled safely. This is deferred to a future ticket.

---

## Status Fields

Some tables also use status fields for archiving:

- applications: status can be set to "archived"
- student_documents: review_status can be set to "archived"
- contracts: status can be set to "archived"
- fee_schedules: status can be set to "archived"
- batches: is_active can be set to false

The `archived_at` column provides a separate, consistent archive mechanism across all tables. Both approaches coexist - the archive columns are the canonical archive indicator for SECURITY-02 purposes.
