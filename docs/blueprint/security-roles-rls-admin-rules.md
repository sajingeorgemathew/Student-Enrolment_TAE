# Security Roles, RLS, and Admin Action Rules - Blueprint

Status: Active
Ticket: SECURITY-01
Created: 2026-05-22

---

## 1. Roles

The system defines four roles stored in the profiles table.

| Role | Purpose |
|------|---------|
| super_admin | System owner. Full access including destructive actions and role management. |
| admin | Operational staff. Reviews intake, manages records, generates contracts. No hard deletes. |
| sales | Intake staff. Creates intakes, uploads documents, submits to admin review. |
| viewer | Read-only. Can view allowed records but cannot create, edit, or delete. |

The profiles table check constraint enforces: `role in ('super_admin', 'admin', 'sales', 'viewer')`.

---

## 2. Role Helper Functions (Database)

All functions are `security definer` with `set search_path = public` and `stable`.

| Function | Returns | Logic |
|----------|---------|-------|
| `get_my_role()` | text | Returns the role of the authenticated user from profiles where is_active = true. |
| `is_super_admin()` | boolean | True if role = 'super_admin'. |
| `is_admin()` | boolean | True if role in ('admin', 'super_admin'). |
| `is_admin_or_super_admin()` | boolean | Same as is_admin(). Explicit alias for clarity. |
| `is_sales_or_admin()` | boolean | True if role in ('admin', 'sales', 'super_admin'). |
| `can_manage_records()` | boolean | True if role in ('admin', 'super_admin'). |

Key decision: `is_admin()` now includes `super_admin`. This means all existing RLS policies and app checks that use `is_admin()` automatically grant super_admin the same access without any code change.

---

## 3. Role Helper Functions (TypeScript)

File: `src/lib/roles.ts`

| Function | Logic |
|----------|-------|
| `isSuperAdmin(role)` | role === 'super_admin' |
| `isAdminOrSuper(role)` | role === 'admin' or 'super_admin' |
| `isSalesOrAdmin(role)` | role === 'sales', 'admin', or 'super_admin' |
| `canManageRecords(role)` | role === 'admin' or 'super_admin' |

The `AppRole` type is: `'super_admin' | 'admin' | 'sales' | 'viewer'`.

---

## 4. RLS Policy Summary

### SELECT policies

All tables use: `get_my_role() in ('super_admin', 'admin', 'sales', 'viewer')` for select. This means all active staff can read records. Programs and batches use `using (true)` for authenticated users.

### INSERT policies

- Students, applications, quotes, documents, upload links, contract events: `is_sales_or_admin()` (sales, admin, super_admin)
- Programs, batches, checklists, fee schedules, installments, contracts, notifications: `is_admin_or_super_admin()` (admin, super_admin)
- Audit events: `is_sales_or_admin()` (any staff that performs actions)

### UPDATE policies

- Students, applications, quotes, upload links: `is_sales_or_admin()`
- Documents, checklists, fee schedules, installments, contracts, programs, batches, notifications: `is_admin_or_super_admin()`
- Profiles: own row only (except super_admin can update any profile for role management)

### DELETE policies

Hard delete is restricted. Only these tables have DELETE policies:

| Table | Who can delete |
|-------|---------------|
| students | super_admin only |
| applications | super_admin only |
| student_documents | super_admin only |
| quotes | super_admin only |

All other tables have no DELETE policy, meaning no one can delete rows through RLS. Use archive/status fields instead.

### Storage policies

- Upload (insert): sales, admin, super_admin
- Read (select): all authenticated users
- Update: admin, super_admin
- Delete: super_admin only

---

## 5. Archive-First Behavior

Normal workflow uses status or flag fields instead of hard deletes.

| Table | Archive method | Field |
|-------|---------------|-------|
| students | Set archived_at timestamp | archived_at, archived_by (new columns) |
| applications | Set status to 'archived' | status (existing) |
| student_documents | Set review_status to 'archived' | review_status (existing) |
| quotes | Set status to 'archived' | status (existing) |
| fee_schedules | Set status to 'archived' | status (existing) |
| contracts | Set status to 'archived' | status (existing) |
| batches | Set is_active to false | is_active (existing) |
| programs | Set is_active to false | is_active (existing) |

The students table received two new columns: `archived_at` (timestamptz) and `archived_by` (uuid, references profiles). All other tables already have suitable status or flag fields.

Hard delete is reserved for super_admin and enforced at the RLS level.

---

## 6. Audit Events Table

New table: `public.audit_events`

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| actor_id | uuid | The profile that performed the action |
| event_type | text | Type of event (e.g. 'student_archived', 'role_changed') |
| table_name | text | Which table was affected |
| record_id | uuid | The affected record ID |
| payload | jsonb | Additional context (old values, new values, notes) |
| created_at | timestamptz | When the event occurred |

RLS: admin and super_admin can read. Sales, admin, and super_admin can insert.

Planned event types for future use:

- role_changed
- student_archived
- student_deleted
- document_archived
- document_deleted
- batch_deactivated
- batch_deleted
- fee_schedule_approved
- contract_generated
- signed_contract_uploaded
- batch_transfer_completed

Audit logging is not yet wired into app actions. The table is the foundation. App-level audit inserts will be added in future tickets as actions are built out.

---

## 7. Migration File

File: `supabase/migrations/20260522_security_01_roles_rls_admin_rules.sql`

This migration is additive and non-destructive. It:

1. Drops and recreates the profiles role check constraint to include super_admin
2. Creates or replaces all role helper functions
3. Adds archived_at and archived_by columns to students
4. Creates the audit_events table with indexes and RLS
5. Drops and recreates all RLS policies to include super_admin
6. Updates storage bucket policies

Sajin must run this SQL manually in the hosted Supabase SQL editor.

---

## 8. App Code Changes

Server actions updated to use role helper functions instead of inline string checks:

- `batches/actions.ts` - uses `isAdminOrSuper()`
- `checklists/actions.ts` - uses `isAdminOrSuper()`
- `fees/actions.ts` - uses `isAdminOrSuper()`
- `programs/actions.ts` - uses `isAdminOrSuper()`
- `documents/actions.ts` - uses `isAdminOrSuper()` and `isSalesOrAdmin()`
- `intake/actions.ts` - uses `isSalesOrAdmin()`
- `students/actions.ts` - uses `isSalesOrAdmin()`
- `documents/[documentId]/page.tsx` - uses `isAdminOrSuper()`

All checks now correctly grant super_admin the same access as the role they supersede.

---

## 9. What Is Not Included

- Full role management UI
- Delete buttons in any UI
- Batch transfer UI
- Student file hub redesign
- Document workflow changes
- Contract template changes
- Transcript module
- Adobe or DocuSign integration
- Automatic audit event insertion from app actions
