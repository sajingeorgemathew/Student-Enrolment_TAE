-- FINANCE-07: Receipt storage bucket and RLS policies
-- Creates the private receipt-documents bucket used to store generated receipt
-- PDFs, plus storage.objects policies. Mirrors the student-documents pattern
-- but restricts all access to admin/super_admin, since receipts are finance
-- documents that sales and viewer must not read or write.

-- 1. Create the private bucket (no-op if it already exists)
insert into storage.buckets (id, name, public)
values ('receipt-documents', 'receipt-documents', false)
on conflict (id) do nothing;

-- 2. Only admin/super_admin can upload receipt PDFs
create policy "receipt_documents_insert_admin_or_super"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'receipt-documents'
  and public.is_admin_or_super_admin()
);

-- 3. Only admin/super_admin can read/download receipt PDFs
create policy "receipt_documents_select_admin_or_super"
on storage.objects for select
to authenticated
using (
  bucket_id = 'receipt-documents'
  and public.is_admin_or_super_admin()
);

-- 4. Only admin/super_admin can update receipt PDFs
create policy "receipt_documents_update_admin_or_super"
on storage.objects for update
to authenticated
using (
  bucket_id = 'receipt-documents'
  and public.is_admin_or_super_admin()
)
with check (
  bucket_id = 'receipt-documents'
  and public.is_admin_or_super_admin()
);

-- 5. Only super_admin can delete receipt PDFs (matches student-documents delete rule)
create policy "receipt_documents_delete_super_admin"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'receipt-documents'
  and public.is_super_admin()
);
