-- STUDENT-04B - Batch Transfer History
-- Purpose:
-- Create a table to track student batch transfers with reason and notes.
-- This migration is additive and non-destructive.

-- --------------------------------------------------------------------
-- batch_transfer_history
-- --------------------------------------------------------------------

create table if not exists public.batch_transfer_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  previous_batch_id uuid references public.batches(id) on delete set null,
  new_batch_id uuid not null references public.batches(id) on delete restrict,
  transfer_type text not null default 'transfer',
  reason text,
  notes text,
  transferred_by uuid references public.profiles(id) on delete set null,
  transferred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint batch_transfer_history_type_check check (
    transfer_type in ('change', 'transfer')
  )
);

create index if not exists batch_transfer_history_student_id_idx
  on public.batch_transfer_history(student_id);

create index if not exists batch_transfer_history_application_id_idx
  on public.batch_transfer_history(application_id);

-- --------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------

alter table public.batch_transfer_history enable row level security;

create policy "batch_transfer_history_select_staff"
on public.batch_transfer_history
for select
to authenticated
using (public.get_my_role() in ('super_admin', 'admin', 'sales', 'viewer'));

create policy "batch_transfer_history_insert_admin"
on public.batch_transfer_history
for insert
to authenticated
with check (public.is_admin());
