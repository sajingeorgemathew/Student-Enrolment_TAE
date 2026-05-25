-- SECURITY-02 - Archive and Delete Rules
-- Purpose:
-- Add archive-first columns to remaining tables, enhance audit_events,
-- add delete RLS policies where missing, and add safety functions.
-- This migration is additive and non-destructive.

-- ====================================================================
-- 1. Add archive_reason to students (archived_at and archived_by
--    were already added in SECURITY-01)
-- ====================================================================

alter table public.students
  add column if not exists archive_reason text;

-- ====================================================================
-- 2. Add archive columns to applications
-- ====================================================================

alter table public.applications
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null,
  add column if not exists archive_reason text;

create index if not exists applications_archived_at_idx on public.applications(archived_at);

-- ====================================================================
-- 3. Add archive columns to student_documents
-- ====================================================================

alter table public.student_documents
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null,
  add column if not exists archive_reason text;

create index if not exists student_documents_archived_at_idx on public.student_documents(archived_at);

-- ====================================================================
-- 4. Add archive columns to programs
-- ====================================================================

alter table public.programs
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null,
  add column if not exists archive_reason text;

create index if not exists programs_archived_at_idx on public.programs(archived_at);

-- ====================================================================
-- 5. Add archive columns to batches
-- ====================================================================

alter table public.batches
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null,
  add column if not exists archive_reason text;

create index if not exists batches_archived_at_idx on public.batches(archived_at);

-- ====================================================================
-- 6. Add archive columns to fee_schedules
-- ====================================================================

alter table public.fee_schedules
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null,
  add column if not exists archive_reason text;

create index if not exists fee_schedules_archived_at_idx on public.fee_schedules(archived_at);

-- ====================================================================
-- 7. Add archive columns to contracts
-- ====================================================================

alter table public.contracts
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null,
  add column if not exists archive_reason text;

create index if not exists contracts_archived_at_idx on public.contracts(archived_at);

-- ====================================================================
-- 8. Enhance audit_events with actor_role and reason columns
-- ====================================================================

alter table public.audit_events
  add column if not exists actor_role text,
  add column if not exists reason text;

-- ====================================================================
-- 9. Add delete RLS policies for tables missing them
-- ====================================================================

-- programs - only super_admin can delete
create policy "programs_delete_super_admin"
on public.programs
for delete
to authenticated
using (public.is_super_admin());

-- batches - only super_admin can delete
create policy "batches_delete_super_admin"
on public.batches
for delete
to authenticated
using (public.is_super_admin());

-- fee_schedules - only super_admin can delete
create policy "fee_schedules_delete_super_admin"
on public.fee_schedules
for delete
to authenticated
using (public.is_super_admin());

-- contracts - only super_admin can delete
create policy "contracts_delete_super_admin"
on public.contracts
for delete
to authenticated
using (public.is_super_admin());

-- payment_installments - only super_admin can delete
create policy "payment_installments_delete_super_admin"
on public.payment_installments
for delete
to authenticated
using (public.is_super_admin());

-- admission_checklists - only super_admin can delete
create policy "admission_checklists_delete_super_admin"
on public.admission_checklists
for delete
to authenticated
using (public.is_super_admin());
