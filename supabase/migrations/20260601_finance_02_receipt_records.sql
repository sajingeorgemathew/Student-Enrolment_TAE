-- FINANCE-02: Receipt data model and RLS
-- Purpose:
-- Create the database foundation for payment receipt metadata records.
-- This ticket adds the receipt_records table, constraints, indexes, an
-- updated_at trigger, and RLS policies only. No receipt generation, no
-- receipt number generation, no PDF overlay, no storage bucket, and no UI
-- are part of this ticket.

-- 1. Create receipt_records table
create table if not exists public.receipt_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  application_id uuid references public.applications(id) on delete set null,
  program_id uuid references public.programs(id) on delete set null,
  batch_id uuid references public.batches(id) on delete set null,
  receipt_number text not null,
  receipt_sequence integer not null,
  student_name_snapshot text not null,
  student_number_snapshot text not null,
  amount numeric(12,2) not null,
  payment_date date not null,
  receipt_date date not null,
  payment_method text not null,
  card_type text,
  notes_type text not null,
  pdf_storage_path text,
  template_version text,
  generated_by uuid not null references auth.users(id) on delete restrict,
  generated_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references auth.users(id) on delete set null,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Receipt number is globally unique
  constraint receipt_records_receipt_number_unique unique (receipt_number),
  -- Each student has a unique sequence per receipt
  constraint receipt_records_student_sequence_unique unique (student_id, receipt_sequence),
  -- Amount must be positive
  constraint receipt_records_amount_positive check (amount > 0),
  -- Allowed payment methods
  constraint receipt_records_payment_method_check check (
    payment_method in (
      'cash',
      'e_transfer',
      'debit',
      'master_card',
      'visa',
      'amex',
      'paypal',
      'cheque_bank_draft'
    )
  ),
  -- Card type is optional, but when present must be a known card type
  constraint receipt_records_card_type_check check (
    card_type is null
    or card_type in ('debit', 'master_card', 'visa', 'amex')
  ),
  -- Allowed notes types
  constraint receipt_records_notes_type_check check (
    notes_type in (
      'enrolment_fee',
      'installment_payment',
      'late_fee_payment_installment_payment'
    )
  ),
  -- When a receipt is voided, a non-empty reason is required
  constraint receipt_records_void_reason_check check (
    voided_at is null
    or (void_reason is not null and btrim(void_reason) <> '')
  )
);

-- 2. Indexes
create index if not exists idx_receipt_records_student_id
  on public.receipt_records (student_id);

create index if not exists idx_receipt_records_application_id
  on public.receipt_records (application_id);

create index if not exists idx_receipt_records_batch_id
  on public.receipt_records (batch_id);

create index if not exists idx_receipt_records_receipt_number
  on public.receipt_records (receipt_number);

create index if not exists idx_receipt_records_generated_at
  on public.receipt_records (generated_at desc);

create index if not exists idx_receipt_records_payment_date
  on public.receipt_records (payment_date desc);

create index if not exists idx_receipt_records_voided_at
  on public.receipt_records (voided_at);

-- 3. updated_at trigger (reuses existing public.set_updated_at helper)
create trigger receipt_records_set_updated_at
before update on public.receipt_records
for each row execute function public.set_updated_at();

-- 4. Enable RLS
alter table public.receipt_records enable row level security;

-- 5. RLS policies (mirrors the contract_generations pattern)

-- All authenticated staff can read receipt records
create policy "receipt_records_select_staff"
on public.receipt_records
for select
to authenticated
using (public.get_my_role() in ('super_admin', 'admin', 'sales', 'viewer'));

-- Only admin/super_admin can insert receipt records
create policy "receipt_records_insert_admin"
on public.receipt_records
for insert
to authenticated
with check (public.is_admin_or_super_admin());

-- Only admin/super_admin can update receipt records (includes future voiding)
create policy "receipt_records_update_admin"
on public.receipt_records
for update
to authenticated
using (public.is_admin_or_super_admin())
with check (public.is_admin_or_super_admin());

-- No delete policy in this ticket
