# SECURITY-01 - Roles, RLS, and Admin Action Rules

## Goal

Strengthen production security by defining roles, RLS behavior, archive-first rules, and admin action boundaries.

This ticket prepares the system for production use before more workflow modules are added.

## Scope

Build:

- super_admin role support
- clarified admin, sales, viewer permissions
- safer RLS helper functions
- archive-first behavior foundation
- audit event foundation for important actions
- role-safe UI helper functions if needed
- documented manual Supabase steps

## Current Roles

Current DB-01 roles:

- admin
- sales
- viewer

## Updated Roles

Add:

- super_admin

Final roles:

- super_admin
- admin
- sales
- viewer

## Role Rules

### Super Admin

Can:

- manage user roles
- archive records
- hard delete records if needed
- delete documents
- delete students
- delete batches
- access system-level admin actions

### Admin

Can:

- review intake
- edit official student records
- manage checklist
- manage fee schedules
- manage documents
- generate Word contracts
- manage programs and batches
- transfer students between batches

Admin should not hard delete by default.

### Sales

Can:

- create intake
- edit intake-level student information before admin review
- upload documents
- view allowed student files
- send intake to admin review

Sales cannot:

- delete students
- delete documents
- delete batches
- approve fee schedules
- finalize contracts
- manage roles

### Viewer

Can:

- read allowed records only

Viewer cannot:

- create
- edit
- upload
- delete
- approve

## Archive-First Rule

Avoid hard deletes in normal workflow.

Records should use archive/status fields where possible.

Hard delete should be super_admin only.

## RLS Direction

Update role checks to include:

- `get_my_role()`
- `is_super_admin()`
- `is_admin()`
- `is_admin_or_super_admin()`
- `is_sales_or_admin()`
- `can_manage_records()`

Policies should support:

- super_admin has broad access
- admin has operational access
- sales has intake-level access
- viewer has read-only access

## Tables to Review

Review policies for:

- profiles
- programs
- batches
- students
- applications
- admission_checklists
- student_documents
- student_upload_links
- quotes
- fee_schedules
- payment_installments
- contracts
- contract_events
- notification_events

## Audit Direction

Add or prepare audit logging for future important actions:

- role changed
- student archived
- student deleted
- document deleted
- batch archived
- batch deleted
- fee schedule approved
- contract generated
- signed contract uploaded
- batch transfer completed

If adding an audit table is safe, create it.

If the current schema already has enough event tables, document how to use them.

## UI Direction

Do not build full role management UI in this ticket.

Only add small helper utilities if needed.

Full user/role management UI comes later.

## Not Included

Do not implement:

- full role management page
- delete buttons in UI
- batch transfer UI
- student file hub redesign
- document workflow changes
- contract template changes
- transcript module
- Adobe
- DocuSign

## Acceptance Criteria

- super_admin role is supported
- role helper functions are updated or added
- RLS policies are tightened without breaking current app reads
- sales/admin/viewer permissions are clearer
- archive-first direction is documented
- audit direction is documented or foundational table is added
- manual Supabase SQL file is created if database changes are needed
- `npm run lint` passes
- `npm run build` passes

---

## Implementation Notes (2026-05-22)

### Migration file

`supabase/migrations/20260522_security_01_roles_rls_admin_rules.sql`

This file must be run manually in the Supabase SQL editor. It is additive and non-destructive.

### What the migration does

1. Drops and recreates `profiles_role_check` constraint to include `super_admin`.
2. Creates or replaces six role helper functions: `get_my_role()`, `is_super_admin()`, `is_admin()`, `is_admin_or_super_admin()`, `is_sales_or_admin()`, `can_manage_records()`.
3. Adds `archived_at` and `archived_by` columns to the students table.
4. Creates `audit_events` table with RLS enabled.
5. Drops and recreates all RLS policies across all tables to include `super_admin` in the correct access tiers.
6. Adds DELETE policies restricted to `super_admin` on students, applications, student_documents, and quotes.
7. Updates storage bucket policies (upload: sales/admin/super_admin, update: admin/super_admin, delete: super_admin only).

### Key design decisions

- `is_admin()` includes `super_admin`. This means existing code and policies automatically grant super_admin access without changes. `is_admin_or_super_admin()` is an explicit alias for readability.
- `is_sales_or_admin()` includes `super_admin` so the highest role can always do what lower roles can do.
- Hard delete is only allowed via RLS for `super_admin`. Tables without a DELETE policy block all deletes.
- Archive-first: students got `archived_at`/`archived_by` columns. All other tables already have suitable status or is_active fields.
- Audit events table is created but not yet wired into app actions. Future tickets will insert audit rows as features are built.

### App code changes

- `src/lib/roles.ts` - Added `super_admin` to `AppRole` type. Added `isSuperAdmin()`, `isAdminOrSuper()`, `isSalesOrAdmin()`, `canManageRecords()` helpers.
- Server actions updated to use role helpers instead of inline string checks: batches, checklists, fees, programs, documents, intake, students.
- `documents/[documentId]/page.tsx` - isAdmin check now includes super_admin.

### Blueprint

`docs/blueprint/security-roles-rls-admin-rules.md` created with full documentation of roles, RLS policies, archive behavior, and audit table schema.