-- ADMIN-SIGNATURE-01: Signature upload and management
-- Purpose:
-- Create the admin-only foundation for managing signature images. This ticket
-- adds the admin_signatures table, constraints, an updated_at trigger, RLS
-- policies, the private admin-signatures storage bucket, and its storage
-- policies. No receipt generation, no PDF overlay, and no signature selection
-- in receipts are part of this ticket.

-- 1. Create admin_signatures table
create table if not exists public.admin_signatures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  storage_path text not null,
  mime_type text not null,
  file_size_bytes integer not null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Name must not be blank
  constraint admin_signatures_name_not_blank check (btrim(name) <> ''),
  -- File size must be positive
  constraint admin_signatures_file_size_positive check (file_size_bytes > 0),
  -- Only allow safe image mime types (no executable/script files)
  constraint admin_signatures_mime_type_check check (
    mime_type in ('image/png', 'image/jpeg', 'image/webp')
  )
);

-- 2. Indexes
create index if not exists idx_admin_signatures_is_active
  on public.admin_signatures (is_active);

create index if not exists idx_admin_signatures_created_at
  on public.admin_signatures (created_at desc);

-- At most one default signature. The set-default action clears existing
-- defaults before setting a new one, so this partial unique index is the
-- final guard against two defaults existing at once.
create unique index if not exists idx_admin_signatures_single_default
  on public.admin_signatures (is_default)
  where is_default;

-- 3. updated_at trigger (reuses existing public.set_updated_at helper)
create trigger admin_signatures_set_updated_at
before update on public.admin_signatures
for each row execute function public.set_updated_at();

-- 4. Enable RLS
alter table public.admin_signatures enable row level security;

-- 5. RLS policies (admin/super_admin only; sales and viewer have no access)

-- Only admin/super_admin can read signature metadata
create policy "admin_signatures_select_admin_or_super"
on public.admin_signatures
for select
to authenticated
using (public.is_admin_or_super_admin());

-- Only admin/super_admin can insert signature metadata
create policy "admin_signatures_insert_admin_or_super"
on public.admin_signatures
for insert
to authenticated
with check (public.is_admin_or_super_admin());

-- Only admin/super_admin can update signature metadata (activate/deactivate,
-- set default)
create policy "admin_signatures_update_admin_or_super"
on public.admin_signatures
for update
to authenticated
using (public.is_admin_or_super_admin())
with check (public.is_admin_or_super_admin());

-- No delete policy in this ticket (no hard delete)

-- 6. Storage bucket (private). No-op if it already exists.
insert into storage.buckets (id, name, public)
values ('admin-signatures', 'admin-signatures', false)
on conflict (id) do nothing;

-- 7. Storage policies for the admin-signatures bucket. All access is restricted
-- to admin/super_admin so sales and viewer cannot read or write even with a
-- direct Supabase storage call. No delete policy (no hard delete).

create policy "admin_signatures_storage_insert_admin_or_super"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'admin-signatures'
  and public.is_admin_or_super_admin()
);

create policy "admin_signatures_storage_select_admin_or_super"
on storage.objects for select
to authenticated
using (
  bucket_id = 'admin-signatures'
  and public.is_admin_or_super_admin()
);

create policy "admin_signatures_storage_update_admin_or_super"
on storage.objects for update
to authenticated
using (
  bucket_id = 'admin-signatures'
  and public.is_admin_or_super_admin()
)
with check (
  bucket_id = 'admin-signatures'
  and public.is_admin_or_super_admin()
);
