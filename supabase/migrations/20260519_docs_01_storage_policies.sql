-- DOCS-01 - Storage bucket and RLS policies for student-documents
-- The bucket is private (public = false). Access is controlled via RLS.

-- Create the bucket if it does not exist
insert into storage.buckets (id, name, public)
values ('student-documents', 'student-documents', false)
on conflict (id) do nothing;

-- Sales and admin can upload files
create policy "sales_admin_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'student-documents'
  and public.is_sales_or_admin()
);

-- Authenticated staff (any role) can read/download files
create policy "authenticated_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'student-documents'
);

-- Admin can overwrite/update files
create policy "admin_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'student-documents'
  and public.is_admin()
)
with check (
  bucket_id = 'student-documents'
  and public.is_admin()
);

-- Admin can delete files
create policy "admin_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'student-documents'
  and public.is_admin()
);
