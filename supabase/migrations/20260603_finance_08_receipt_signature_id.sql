-- FINANCE-08: Receipt signature selection and overlay
-- Purpose:
-- Record which admin signature was overlaid on a generated receipt PDF. This
-- ticket only adds an optional signature_id column to receipt_records and an
-- index. No other receipt schema is changed, and the admin_signatures table,
-- its storage bucket, and RLS are left as created in ADMIN-SIGNATURE-01.

-- 1. Optional link to the admin signature used at generation time.
-- Nullable so receipts generated without a signature (or before this column
-- existed) stay valid. on delete set null keeps the receipt if the signature
-- record is ever removed; the stored PDF already carries the overlaid image.
alter table public.receipt_records
  add column if not exists signature_id uuid
  references public.admin_signatures(id) on delete set null;

-- 2. Index for lookups by signature (reporting, "which receipts used signature X").
create index if not exists idx_receipt_records_signature_id
  on public.receipt_records (signature_id);
