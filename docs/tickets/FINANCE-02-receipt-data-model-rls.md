# FINANCE-02 - Receipt Data Model and RLS

## Goal

Create the database foundation for payment receipts.

This ticket adds receipt metadata records only.

Do not implement PDF generation, receipt UI, student hub receipt section, or finance registry UI yet.

## Blueprint Source

Use:

- `docs/blueprint/receipt-system-integration.md`
- `docs/tickets/FINANCE-01-receipt-system-blueprint.md`

## Main Product Direction

Receipts are separate from contract payment schedules.

Receipts are finance records linked to a student file.

A receipt record should support:

- student-specific receipt history
- cross-student finance registry later
- receipt number sequence logic
- future PDF storage path
- void with reason later
- admin-only generation and management

## Scope

Create:

- receipt_records table
- indexes
- constraints
- RLS policies
- TypeScript/database type updates if the project has generated/manual types
- helper notes if type generation is manual

## Table

Create table:

`public.receipt_records`

Recommended columns:

- `id uuid primary key default gen_random_uuid()`
- `student_id uuid not null references public.students(id) on delete restrict`
- `application_id uuid null references public.applications(id) on delete set null`
- `program_id uuid null references public.programs(id) on delete set null`
- `batch_id uuid null references public.batches(id) on delete set null`
- `receipt_number text not null`
- `receipt_sequence integer not null`
- `student_name_snapshot text not null`
- `student_number_snapshot text not null`
- `amount numeric(12,2) not null`
- `payment_date date not null`
- `receipt_date date not null`
- `payment_method text not null`
- `card_type text null`
- `notes_type text not null`
- `pdf_storage_path text null`
- `template_version text null`
- `generated_by uuid not null references auth.users(id) on delete restrict`
- `generated_at timestamptz not null default now()`
- `voided_at timestamptz null`
- `voided_by uuid null references auth.users(id) on delete set null`
- `void_reason text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## Constraints

Receipt number:

- unique `receipt_number`

Student receipt sequence:

- unique `(student_id, receipt_sequence)`

Amount:

- amount must be greater than 0

Payment method allowed values:

- `cash`
- `e_transfer`
- `debit`
- `master_card`
- `visa`
- `amex`
- `paypal`
- `cheque_bank_draft`

Card type allowed values:

- null
- `debit`
- `master_card`
- `visa`
- `amex`

Notes type allowed values:

- `enrolment_fee`
- `installment_payment`
- `late_fee_payment_installment_payment`

Void rules:

- if `voided_at` is not null, `void_reason` should not be empty
- if `voided_at` is null, `void_reason` can be null

## Receipt Number Rule To Support Later

This ticket does not need to implement receipt number generation code yet, but the model must support it.

Receipt format:

`PSW-12500-25-{digits_after_125}-{sequence}`

Examples:

- student `125191`, sequence `1` -> `PSW-12500-25-191-01`
- student `12505`, sequence `1` -> `PSW-12500-25-05-01`
- student `1257`, sequence `1` -> `PSW-12500-25-7-01`

Keep leading zeros after removing the starting `125`.

The `receipt_sequence` column exists to support normal next-number generation and admin-controlled historical gap correction later.

## RLS Rules

Enable RLS.

Admin/super_admin:

- can select receipt records
- can insert receipt records
- can update receipt records
- can void receipt records later through update
- cannot hard delete in this ticket

Sales:

- can select receipt records only if current project role direction allows staff visibility
- cannot insert
- cannot update
- cannot delete

Viewer:

- read-only select only if current project allows viewer to see finance summaries
- cannot insert
- cannot update
- cannot delete

If unsure, use conservative rules:

- authenticated admin/super_admin can select/insert/update
- authenticated sales/viewer can select only
- no delete policy

Use existing project role helper/policy patterns.

Do not create a new role system.

## Updated At

If the project already uses an updated_at trigger helper, reuse it.

If not, add a small trigger/function only if consistent with existing migrations.

## Not Included

Do not implement:

- receipt generation code
- receipt number generation code
- PDF overlay
- pdf-lib
- receipt storage bucket
- receipt upload/download
- receipt registry UI
- student hub receipt section
- new receipt form
- void UI
- contract payment schedule changes
- Word contract changes
- application workflow changes

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- migration creates receipt_records table
- table links to students and optional application/program/batch
- receipt_number is unique
- student receipt_sequence is unique per student
- payment method constraint exists
- notes type constraint exists
- amount positive constraint exists
- RLS enabled
- admin/super_admin can select/insert/update
- sales/viewer cannot insert/update/delete
- no hard delete policy is added
- no UI or PDF code is added
- no contract code is changed
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Migration file

- `supabase/migrations/20260601_finance_02_receipt_records.sql`

The project uses a `YYYYMMDD_<module>_<seq>_<name>.sql` migration naming
convention (no time component), so the suggested timestamp filename was
adjusted to `20260601_finance_02_receipt_records.sql` to match.

### Table created

- `public.receipt_records` with all columns listed in the ticket.
- `generated_by` references `auth.users(id) on delete restrict` and
  `voided_by` references `auth.users(id) on delete set null`, per the ticket
  column spec. (The blueprint draft mentioned `profiles(id)`; the ticket
  column list is the source of truth and was followed.)

### Constraints

- `receipt_records_receipt_number_unique` - unique `receipt_number`.
- `receipt_records_student_sequence_unique` - unique `(student_id, receipt_sequence)`.
- `receipt_records_amount_positive` - `amount > 0`.
- `receipt_records_payment_method_check` - payment_method in
  (cash, e_transfer, debit, master_card, visa, amex, paypal, cheque_bank_draft).
- `receipt_records_card_type_check` - card_type is null or in
  (debit, master_card, visa, amex).
- `receipt_records_notes_type_check` - notes_type in
  (enrolment_fee, installment_payment, late_fee_payment_installment_payment).
- `receipt_records_void_reason_check` - when `voided_at` is not null,
  `void_reason` must be present and non-empty (whitespace-only rejected).

### Indexes

- `student_id`, `application_id`, `batch_id`, `receipt_number`,
  `generated_at desc`, `payment_date desc`, `voided_at`.

### updated_at trigger

- `receipt_records_set_updated_at` reuses the existing
  `public.set_updated_at()` helper from the core schema migration. No new
  trigger function was added.

### RLS behavior

- RLS enabled on `public.receipt_records`.
- `receipt_records_select_staff` - select allowed for
  super_admin, admin, sales, viewer (read-only staff visibility, matching the
  existing `contract_generations` and core table read direction).
- `receipt_records_insert_admin` - insert allowed only for admin/super_admin
  via `public.is_admin_or_super_admin()`.
- `receipt_records_update_admin` - update allowed only for admin/super_admin
  via `public.is_admin_or_super_admin()` (covers future void-via-update).
- No delete policy is defined, so no role can delete in this ticket.
- Reuses existing role helpers `public.get_my_role()` and
  `public.is_admin_or_super_admin()`. No new role system was created.

### Manual Supabase SQL required

- Apply the migration to the Supabase project. Run the contents of
  `supabase/migrations/20260601_finance_02_receipt_records.sql` against the
  database (via `supabase db push`, the Supabase SQL editor, or the project's
  normal migration apply step). No other manual SQL is required; the
  `set_updated_at`, `get_my_role`, and `is_admin_or_super_admin` helpers
  already exist from earlier migrations.

### Database types

- The project does not check in a generated `database.types.ts` file and the
  Supabase client is used untyped (for example `.from("contract_generations")`
  with no `Database` generic). There is no existing type-generation convention
  to update. If typed access to `receipt_records` is wanted later, generate
  Supabase types as a separate follow-up.

### Not implemented (per ticket scope)

- Receipt generation code, receipt number generation code, PDF overlay,
  `pdf-lib`, receipt storage bucket, upload/download, receipt registry UI,
  student hub receipt section, new receipt form, void UI, contract payment
  schedule changes, Word contract changes, application workflow changes.