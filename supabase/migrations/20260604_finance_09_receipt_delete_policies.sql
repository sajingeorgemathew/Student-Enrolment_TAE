-- FINANCE-09: Receipt edit and hard delete controls
-- Purpose:
-- Allow admin/super_admin to hard delete a wrong receipt record and its stored
-- PDF. The original FINANCE-02 migration intentionally added no delete policy on
-- receipt_records, and FINANCE-07 restricted receipt-documents deletes to
-- super_admin only. This migration enables admin/super_admin hard delete on both
-- the row and the stored file. No table columns are changed.

-- 1. Allow admin/super_admin to delete receipt records.
-- receipt_records had no delete policy (FINANCE-02 added none), so RLS silently
-- blocked every delete: a DELETE affected zero rows and returned no error, which
-- let the API report success while the row survived. This policy permits the
-- delete for admin/super_admin only; sales and viewer remain blocked.
drop policy if exists "receipt_records_delete_admin_or_super" on public.receipt_records;

create policy "receipt_records_delete_admin_or_super"
on public.receipt_records
for delete
to authenticated
using (public.is_admin_or_super_admin());

-- 2. Allow admin/super_admin to delete stored receipt PDFs.
-- FINANCE-07 only allowed super_admin to delete from receipt-documents. Hard
-- delete is an admin/super_admin control, so the file cleanup must work for
-- admin too. Replace the super_admin-only delete policy with an
-- admin_or_super one.
drop policy if exists "receipt_documents_delete_super_admin" on storage.objects;

create policy "receipt_documents_delete_admin_or_super"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'receipt-documents'
  and public.is_admin_or_super_admin()
);
