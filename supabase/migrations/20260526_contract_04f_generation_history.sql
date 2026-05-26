-- CONTRACT-04F: Contract generation record and download history
-- Tracks each time a Word contract is generated for a student application.

-- 1. Create contract_generations table
create table if not exists public.contract_generations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  generated_by uuid not null references public.profiles(id) on delete set null,
  generated_at timestamptz not null default now(),
  file_name text not null,
  storage_path text,
  template_version text,
  status text not null default 'generated',
  created_at timestamptz not null default now()
);

-- 2. Indexes
create index if not exists idx_contract_generations_student_id
  on public.contract_generations (student_id);

create index if not exists idx_contract_generations_application_id
  on public.contract_generations (application_id);

create index if not exists idx_contract_generations_generated_at
  on public.contract_generations (generated_at desc);

-- 3. Enable RLS
alter table public.contract_generations enable row level security;

-- 4. RLS policies

-- All authenticated staff can read generation records
create policy "contract_generations_select_staff"
on public.contract_generations
for select
to authenticated
using (public.get_my_role() in ('super_admin', 'admin', 'sales', 'viewer'));

-- Only admin/super_admin can insert generation records
create policy "contract_generations_insert_admin"
on public.contract_generations
for insert
to authenticated
with check (public.is_admin_or_super_admin());

-- Only admin/super_admin can update generation records
create policy "contract_generations_update_admin"
on public.contract_generations
for update
to authenticated
using (public.is_admin_or_super_admin())
with check (public.is_admin_or_super_admin());

-- No delete policy in this ticket
