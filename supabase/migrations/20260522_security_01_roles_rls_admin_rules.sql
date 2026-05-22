-- SECURITY-01 - Roles, RLS, and Admin Action Rules
-- Purpose:
-- Add super_admin role, tighten RLS policies, add archive-first columns,
-- create audit_events table, and add role helper functions.
-- This migration is additive and non-destructive.

-- ====================================================================
-- 1. Add super_admin to the profiles role check constraint
-- ====================================================================

alter table public.profiles
  drop constraint profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'admin', 'sales', 'viewer'));

-- ====================================================================
-- 2. Role helper functions (replace existing, add new)
-- ====================================================================

create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
  and is_active = true
  limit 1
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.get_my_role() = 'super_admin', false)
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.get_my_role() in ('admin', 'super_admin'), false)
$$;

create or replace function public.is_admin_or_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.get_my_role() in ('admin', 'super_admin'), false)
$$;

create or replace function public.is_sales_or_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.get_my_role() in ('admin', 'sales', 'super_admin'), false)
$$;

create or replace function public.can_manage_records()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.get_my_role() in ('admin', 'super_admin'), false)
$$;

-- ====================================================================
-- 3. Archive-first columns on students table
-- ====================================================================

alter table public.students
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null;

create index if not exists students_archived_at_idx on public.students(archived_at);

-- ====================================================================
-- 4. Audit events table
-- ====================================================================

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  table_name text,
  record_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_actor_id_idx on public.audit_events(actor_id);
create index if not exists audit_events_event_type_idx on public.audit_events(event_type);
create index if not exists audit_events_table_name_idx on public.audit_events(table_name);
create index if not exists audit_events_record_id_idx on public.audit_events(record_id);
create index if not exists audit_events_created_at_idx on public.audit_events(created_at);

alter table public.audit_events enable row level security;

-- ====================================================================
-- 5. RLS for audit_events
-- ====================================================================

create policy "audit_events_select_admin"
on public.audit_events
for select
to authenticated
using (public.is_admin_or_super_admin());

create policy "audit_events_insert_authenticated"
on public.audit_events
for insert
to authenticated
with check (public.is_sales_or_admin());

-- ====================================================================
-- 6. Tighten RLS policies - drop old and recreate
-- ====================================================================

-- -- profiles ----------------------------------------------------------

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_own_basic" on public.profiles;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin_or_super_admin());

create policy "profiles_update_own_basic"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_update_roles_super_admin"
on public.profiles
for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- -- programs ----------------------------------------------------------

drop policy if exists "programs_write_admin" on public.programs;

create policy "programs_write_admin_or_super"
on public.programs
for all
to authenticated
using (public.is_admin_or_super_admin())
with check (public.is_admin_or_super_admin());

-- -- batches -----------------------------------------------------------

drop policy if exists "batches_write_admin" on public.batches;

create policy "batches_write_admin_or_super"
on public.batches
for all
to authenticated
using (public.is_admin_or_super_admin())
with check (public.is_admin_or_super_admin());

-- -- students ----------------------------------------------------------

drop policy if exists "students_select_staff" on public.students;
drop policy if exists "students_insert_sales_or_admin" on public.students;
drop policy if exists "students_update_sales_or_admin" on public.students;

create policy "students_select_staff"
on public.students
for select
to authenticated
using (public.get_my_role() in ('super_admin', 'admin', 'sales', 'viewer'));

create policy "students_insert_sales_or_admin"
on public.students
for insert
to authenticated
with check (public.is_sales_or_admin());

create policy "students_update_sales_or_admin"
on public.students
for update
to authenticated
using (public.is_sales_or_admin())
with check (public.is_sales_or_admin());

create policy "students_delete_super_admin"
on public.students
for delete
to authenticated
using (public.is_super_admin());

-- -- applications ------------------------------------------------------

drop policy if exists "applications_select_staff" on public.applications;
drop policy if exists "applications_insert_sales_or_admin" on public.applications;
drop policy if exists "applications_update_sales_or_admin" on public.applications;

create policy "applications_select_staff"
on public.applications
for select
to authenticated
using (public.get_my_role() in ('super_admin', 'admin', 'sales', 'viewer'));

create policy "applications_insert_sales_or_admin"
on public.applications
for insert
to authenticated
with check (public.is_sales_or_admin());

create policy "applications_update_sales_or_admin"
on public.applications
for update
to authenticated
using (public.is_sales_or_admin())
with check (public.is_sales_or_admin());

create policy "applications_delete_super_admin"
on public.applications
for delete
to authenticated
using (public.is_super_admin());

-- -- admission_checklists ----------------------------------------------

drop policy if exists "admission_checklists_select_staff" on public.admission_checklists;
drop policy if exists "admission_checklists_write_admin" on public.admission_checklists;

create policy "admission_checklists_select_staff"
on public.admission_checklists
for select
to authenticated
using (public.get_my_role() in ('super_admin', 'admin', 'sales', 'viewer'));

create policy "admission_checklists_write_admin_or_super"
on public.admission_checklists
for all
to authenticated
using (public.is_admin_or_super_admin())
with check (public.is_admin_or_super_admin());

-- -- student_documents -------------------------------------------------

drop policy if exists "student_documents_select_staff" on public.student_documents;
drop policy if exists "student_documents_insert_sales_or_admin" on public.student_documents;
drop policy if exists "student_documents_update_admin" on public.student_documents;

create policy "student_documents_select_staff"
on public.student_documents
for select
to authenticated
using (public.get_my_role() in ('super_admin', 'admin', 'sales', 'viewer'));

create policy "student_documents_insert_sales_or_admin"
on public.student_documents
for insert
to authenticated
with check (public.is_sales_or_admin());

create policy "student_documents_update_admin_or_super"
on public.student_documents
for update
to authenticated
using (public.is_admin_or_super_admin())
with check (public.is_admin_or_super_admin());

create policy "student_documents_delete_super_admin"
on public.student_documents
for delete
to authenticated
using (public.is_super_admin());

-- -- student_upload_links ----------------------------------------------

drop policy if exists "student_upload_links_select_staff" on public.student_upload_links;
drop policy if exists "student_upload_links_write_sales_or_admin" on public.student_upload_links;

create policy "student_upload_links_select_staff"
on public.student_upload_links
for select
to authenticated
using (public.get_my_role() in ('super_admin', 'admin', 'sales', 'viewer'));

create policy "student_upload_links_write_sales_or_admin"
on public.student_upload_links
for all
to authenticated
using (public.is_sales_or_admin())
with check (public.is_sales_or_admin());

-- -- quotes ------------------------------------------------------------

drop policy if exists "quotes_select_staff" on public.quotes;
drop policy if exists "quotes_insert_sales_or_admin" on public.quotes;
drop policy if exists "quotes_update_sales_or_admin" on public.quotes;

create policy "quotes_select_staff"
on public.quotes
for select
to authenticated
using (public.get_my_role() in ('super_admin', 'admin', 'sales', 'viewer'));

create policy "quotes_insert_sales_or_admin"
on public.quotes
for insert
to authenticated
with check (public.is_sales_or_admin());

create policy "quotes_update_sales_or_admin"
on public.quotes
for update
to authenticated
using (public.is_sales_or_admin())
with check (public.is_sales_or_admin());

create policy "quotes_delete_super_admin"
on public.quotes
for delete
to authenticated
using (public.is_super_admin());

-- -- fee_schedules -----------------------------------------------------

drop policy if exists "fee_schedules_select_staff" on public.fee_schedules;
drop policy if exists "fee_schedules_write_admin" on public.fee_schedules;

create policy "fee_schedules_select_staff"
on public.fee_schedules
for select
to authenticated
using (public.get_my_role() in ('super_admin', 'admin', 'sales', 'viewer'));

create policy "fee_schedules_write_admin_or_super"
on public.fee_schedules
for all
to authenticated
using (public.is_admin_or_super_admin())
with check (public.is_admin_or_super_admin());

-- -- payment_installments ----------------------------------------------

drop policy if exists "payment_installments_select_staff" on public.payment_installments;
drop policy if exists "payment_installments_write_admin" on public.payment_installments;

create policy "payment_installments_select_staff"
on public.payment_installments
for select
to authenticated
using (public.get_my_role() in ('super_admin', 'admin', 'sales', 'viewer'));

create policy "payment_installments_write_admin_or_super"
on public.payment_installments
for all
to authenticated
using (public.is_admin_or_super_admin())
with check (public.is_admin_or_super_admin());

-- -- contracts ---------------------------------------------------------

drop policy if exists "contracts_select_staff" on public.contracts;
drop policy if exists "contracts_write_admin" on public.contracts;

create policy "contracts_select_staff"
on public.contracts
for select
to authenticated
using (public.get_my_role() in ('super_admin', 'admin', 'sales', 'viewer'));

create policy "contracts_write_admin_or_super"
on public.contracts
for all
to authenticated
using (public.is_admin_or_super_admin())
with check (public.is_admin_or_super_admin());

-- -- contract_events ---------------------------------------------------

drop policy if exists "contract_events_select_staff" on public.contract_events;
drop policy if exists "contract_events_insert_sales_or_admin" on public.contract_events;

create policy "contract_events_select_staff"
on public.contract_events
for select
to authenticated
using (public.get_my_role() in ('super_admin', 'admin', 'sales', 'viewer'));

create policy "contract_events_insert_sales_or_admin"
on public.contract_events
for insert
to authenticated
with check (public.is_sales_or_admin());

-- -- notification_events -----------------------------------------------

drop policy if exists "notification_events_select_staff" on public.notification_events;
drop policy if exists "notification_events_write_admin" on public.notification_events;

create policy "notification_events_select_staff"
on public.notification_events
for select
to authenticated
using (public.get_my_role() in ('super_admin', 'admin', 'sales', 'viewer'));

create policy "notification_events_write_admin_or_super"
on public.notification_events
for all
to authenticated
using (public.is_admin_or_super_admin())
with check (public.is_admin_or_super_admin());

-- ====================================================================
-- 7. Update storage policies to include super_admin
-- ====================================================================

drop policy if exists "sales_admin_insert" on storage.objects;
drop policy if exists "admin_update" on storage.objects;
drop policy if exists "admin_delete" on storage.objects;

create policy "sales_admin_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'student-documents'
  and public.is_sales_or_admin()
);

create policy "admin_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'student-documents'
  and public.is_admin_or_super_admin()
)
with check (
  bucket_id = 'student-documents'
  and public.is_admin_or_super_admin()
);

create policy "admin_or_super_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'student-documents'
  and public.is_super_admin()
);
