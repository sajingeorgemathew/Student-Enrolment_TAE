-- STUDENT-03B: Sales checklist table
-- Run manually in Supabase SQL editor

create table if not exists public.sales_checklists (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade unique,
  photo_id text not null default 'not_received',
  proof_of_address text not null default 'not_received',
  diploma_or_transcript text not null default 'not_received',
  english_proof text not null default 'not_received',
  immigration_status_document text not null default 'not_received',
  payment_proof_deposit text not null default 'not_received',
  other_documents text not null default 'not_received',
  notes text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_checklists_photo_id_check check (
    photo_id in ('received', 'not_received', 'not_sure', 'not_applicable')
  ),
  constraint sales_checklists_proof_of_address_check check (
    proof_of_address in ('received', 'not_received', 'not_sure', 'not_applicable')
  ),
  constraint sales_checklists_diploma_or_transcript_check check (
    diploma_or_transcript in ('received', 'not_received', 'not_sure', 'not_applicable')
  ),
  constraint sales_checklists_english_proof_check check (
    english_proof in ('received', 'not_received', 'not_sure', 'not_applicable')
  ),
  constraint sales_checklists_immigration_status_document_check check (
    immigration_status_document in ('received', 'not_received', 'not_sure', 'not_applicable')
  ),
  constraint sales_checklists_payment_proof_deposit_check check (
    payment_proof_deposit in ('received', 'not_received', 'not_sure', 'not_applicable')
  ),
  constraint sales_checklists_other_documents_check check (
    other_documents in ('received', 'not_received', 'not_sure', 'not_applicable')
  )
);

create index if not exists sales_checklists_application_id_idx
  on public.sales_checklists(application_id);

create trigger sales_checklists_set_updated_at
  before update on public.sales_checklists
  for each row execute function public.set_updated_at();

alter table public.sales_checklists enable row level security;

create policy "sales_checklists_select_staff"
  on public.sales_checklists for select
  using (
    public.is_sales_or_admin()
    or (select public.get_my_role()) = 'viewer'
  );

create policy "sales_checklists_insert_sales_admin"
  on public.sales_checklists for insert
  with check (public.is_sales_or_admin());

create policy "sales_checklists_update_sales_admin"
  on public.sales_checklists for update
  using (public.is_sales_or_admin());

create policy "sales_checklists_delete_super_admin"
  on public.sales_checklists for delete
  using (public.is_super_admin());
