-- DB-01 - Supabase Core Schema for Student Enrolment TAE
-- Purpose:
-- Create the database foundation for student intake, applications, batches,
-- documents, quotes, fee schedules, contracts, and audit logs.

create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------
-- Utility: updated_at trigger
-- --------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------------
-- Profiles and roles
-- --------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('admin', 'sales', 'viewer'))
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
  and is_active = true
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.get_my_role() = 'admin', false)
$$;

create or replace function public.is_sales_or_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.get_my_role() in ('admin', 'sales'), false)
$$;

-- --------------------------------------------------------------------
-- Programs
-- --------------------------------------------------------------------

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  program_code text not null unique,
  program_name text not null,
  credential_name text,
  total_hours integer,
  theory_hours integer,
  practicum_hours integer,
  default_tuition numeric(12,2),
  default_registration_fee numeric(12,2) default 0,
  default_book_fee numeric(12,2) default 0,
  default_compulsory_fee numeric(12,2) default 0,
  default_professional_exam_fee numeric(12,2) default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger programs_set_updated_at
before update on public.programs
for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------
-- Batches
-- --------------------------------------------------------------------

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete restrict,
  batch_name text not null,
  batch_code text,
  start_date date,
  expected_end_date date,
  theory_start_date date,
  theory_end_date date,
  practicum_start_date date,
  practicum_end_date date,
  class_days text,
  class_time text,
  delivery_method text,
  training_location text,
  practicum_1_location text,
  practicum_2_location text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint batches_delivery_method_check check (
    delivery_method is null
    or delivery_method in ('in_person', 'hybrid', 'online')
  )
);

create index if not exists batches_program_id_idx on public.batches(program_id);

create trigger batches_set_updated_at
before update on public.batches
for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------
-- Students
-- --------------------------------------------------------------------

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_number text unique,
  legal_first_name text not null,
  legal_middle_name text,
  legal_last_name text not null,
  legal_full_name text generated always as (
    trim(
      both ' ' from
      coalesce(legal_first_name, '') || ' ' ||
      coalesce(legal_middle_name, '') || ' ' ||
      coalesce(legal_last_name, '')
    )
  ) stored,
  preferred_name text,
  date_of_birth date,
  phone text,
  alternate_phone text,
  email text,
  mailing_address_line_1 text,
  mailing_address_line_2 text,
  city text,
  province text,
  postal_code text,
  country text default 'Canada',
  permanent_address_line_1 text,
  permanent_address_line_2 text,
  permanent_city text,
  permanent_province text,
  permanent_postal_code text,
  permanent_country text,
  immigration_status text,
  international_student boolean,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists students_email_idx on public.students(email);
create index if not exists students_phone_idx on public.students(phone);
create index if not exists students_name_idx on public.students(legal_last_name, legal_first_name);

create trigger students_set_updated_at
before update on public.students
for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------
-- Applications / intake records
-- --------------------------------------------------------------------

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  program_id uuid references public.programs(id) on delete restrict,
  batch_id uuid references public.batches(id) on delete restrict,
  lead_source text,
  sales_owner uuid references public.profiles(id) on delete set null,
  admin_owner uuid references public.profiles(id) on delete set null,
  status text not null default 'new_intake',
  price_discussed numeric(12,2),
  deposit_discussed numeric(12,2),
  sales_notes text,
  admin_notes text,
  submitted_to_admin_at timestamptz,
  ready_for_contract_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_status_check check (
    status in (
      'new_intake',
      'admin_review',
      'information_needed',
      'ready_for_contract',
      'contract_generated',
      'signature_pending',
      'signed',
      'archived'
    )
  )
);

create index if not exists applications_student_id_idx on public.applications(student_id);
create index if not exists applications_program_id_idx on public.applications(program_id);
create index if not exists applications_batch_id_idx on public.applications(batch_id);
create index if not exists applications_status_idx on public.applications(status);

create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------
-- Admission checklist
-- --------------------------------------------------------------------

create table if not exists public.admission_checklists (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,

  photo_id_status text not null default 'not_received',
  address_proof_status text not null default 'not_received',

  academic_route text,
  academic_status text not null default 'not_started',
  academic_notes text,

  english_route text,
  english_status text not null default 'not_started',
  english_score text,
  english_notes text,

  admin_verified_by uuid references public.profiles(id) on delete set null,
  admin_verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint checklist_file_status_check check (
    photo_id_status in ('not_received', 'uploaded', 'accepted', 'needs_correction')
    and address_proof_status in ('not_received', 'uploaded', 'accepted', 'needs_correction')
  ),

  constraint checklist_academic_route_check check (
    academic_route is null
    or academic_route in ('canadian_secondary', 'foreign_credential', 'mature_student')
  ),

  constraint checklist_academic_status_check check (
    academic_status in ('not_started', 'in_review', 'accepted', 'needs_correction')
  ),

  constraint checklist_english_route_check check (
    english_route is null
    or english_route in (
      'ielts',
      'toefl_ibt',
      'cael',
      'celpip',
      'clb',
      'duolingo',
      'pte_academic',
      'nacc_written_exam',
      'two_years_canadian_postsecondary_english',
      'two_years_international_postsecondary_english',
      'not_required'
    )
  ),

  constraint checklist_english_status_check check (
    english_status in ('not_started', 'in_review', 'accepted', 'needs_correction')
  )
);

create trigger admission_checklists_set_updated_at
before update on public.admission_checklists
for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------
-- Student documents
-- --------------------------------------------------------------------

create table if not exists public.student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  document_type text not null,
  file_name text not null,
  storage_bucket text not null default 'student-documents',
  storage_path text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_by_type text not null default 'staff',
  review_status text not null default 'uploaded',
  review_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_documents_uploaded_by_type_check check (
    uploaded_by_type in ('sales_user', 'admin_user', 'student_link', 'staff')
  ),
  constraint student_documents_review_status_check check (
    review_status in ('uploaded', 'accepted', 'needs_correction', 'archived')
  )
);

create index if not exists student_documents_student_id_idx on public.student_documents(student_id);
create index if not exists student_documents_application_id_idx on public.student_documents(application_id);
create index if not exists student_documents_document_type_idx on public.student_documents(document_type);

create trigger student_documents_set_updated_at
before update on public.student_documents
for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------
-- Optional secure upload links
-- --------------------------------------------------------------------

create table if not exists public.student_upload_links (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists student_upload_links_student_id_idx on public.student_upload_links(student_id);
create index if not exists student_upload_links_application_id_idx on public.student_upload_links(application_id);

-- --------------------------------------------------------------------
-- Quotes
-- --------------------------------------------------------------------

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  program_id uuid references public.programs(id) on delete restrict,
  batch_id uuid references public.batches(id) on delete restrict,
  quoted_by uuid references public.profiles(id) on delete set null,
  quoted_total numeric(12,2),
  discount_amount numeric(12,2) default 0,
  deposit_discussed numeric(12,2) default 0,
  payment_notes text,
  quote_notes text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotes_status_check check (
    status in ('draft', 'sent_to_admin_review', 'admin_reviewed', 'revised', 'archived')
  )
);

create index if not exists quotes_student_id_idx on public.quotes(student_id);
create index if not exists quotes_application_id_idx on public.quotes(application_id);

create trigger quotes_set_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------
-- Fee schedules and installments
-- --------------------------------------------------------------------

create table if not exists public.fee_schedules (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete set null,

  tuition_fee numeric(12,2) not null default 0,
  book_fee numeric(12,2) not null default 0,
  compulsory_fee numeric(12,2) not null default 0,
  field_trip_fee numeric(12,2) not null default 0,
  uniform_equipment_fee numeric(12,2) not null default 0,
  professional_exam_fee numeric(12,2) not null default 0,
  expendable_supplies_fee numeric(12,2) not null default 0,
  international_fee numeric(12,2) not null default 0,
  optional_fee numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,

  total_fees numeric(12,2) not null default 0,
  payment_before_signing numeric(12,2) not null default 0,
  payment_after_signing numeric(12,2) not null default 0,
  remaining_balance numeric(12,2) not null default 0,
  number_of_installments integer not null default 0,

  status text not null default 'draft',
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fee_schedules_status_check check (
    status in ('draft', 'admin_review', 'approved', 'archived')
  )
);

create index if not exists fee_schedules_application_id_idx on public.fee_schedules(application_id);

create trigger fee_schedules_set_updated_at
before update on public.fee_schedules
for each row execute function public.set_updated_at();

create table if not exists public.payment_installments (
  id uuid primary key default gen_random_uuid(),
  fee_schedule_id uuid not null references public.fee_schedules(id) on delete cascade,
  installment_number integer not null,
  due_date date,
  amount_due numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(fee_schedule_id, installment_number)
);

create index if not exists payment_installments_fee_schedule_id_idx on public.payment_installments(fee_schedule_id);

create trigger payment_installments_set_updated_at
before update on public.payment_installments
for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------
-- Contracts and contract events
-- --------------------------------------------------------------------

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  program_id uuid references public.programs(id) on delete restrict,
  batch_id uuid references public.batches(id) on delete restrict,
  fee_schedule_id uuid references public.fee_schedules(id) on delete set null,

  contract_number text unique,
  status text not null default 'draft',

  student_name_snapshot text,
  student_email_snapshot text,
  program_name_snapshot text,
  batch_name_snapshot text,
  fee_snapshot jsonb,
  payment_schedule_snapshot jsonb,
  contract_data_snapshot jsonb,

  unsigned_pdf_bucket text default 'contract-documents',
  unsigned_pdf_path text,
  signed_pdf_bucket text default 'contract-documents',
  signed_pdf_path text,
  signature_provider text,
  external_envelope_id text,
  external_status text,
  audit_trail_path text,

  generated_by uuid references public.profiles(id) on delete set null,
  generated_at timestamptz,
  sent_for_signature_at timestamptz,
  signed_at timestamptz,
  uploaded_signed_by uuid references public.profiles(id) on delete set null,
  uploaded_signed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint contracts_status_check check (
    status in (
      'draft',
      'generated',
      'signature_pending',
      'signed_uploaded',
      'signed_external',
      'stored',
      'cancelled',
      'archived'
    )
  ),

  constraint contracts_signature_provider_check check (
    signature_provider is null
    or signature_provider in ('manual_upload', 'wet_signature', 'adobe', 'docusign')
  )
);

create index if not exists contracts_application_id_idx on public.contracts(application_id);
create index if not exists contracts_student_id_idx on public.contracts(student_id);
create index if not exists contracts_status_idx on public.contracts(status);

create trigger contracts_set_updated_at
before update on public.contracts
for each row execute function public.set_updated_at();

create table if not exists public.contract_events (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references public.contracts(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  event_type text not null,
  event_source text not null default 'system',
  event_payload jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists contract_events_contract_id_idx on public.contract_events(contract_id);
create index if not exists contract_events_application_id_idx on public.contract_events(application_id);
create index if not exists contract_events_student_id_idx on public.contract_events(student_id);

-- --------------------------------------------------------------------
-- Notifications
-- --------------------------------------------------------------------

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  event_type text not null,
  recipient_email text not null,
  subject text,
  status text not null default 'pending',
  resend_email_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint notification_events_status_check check (
    status in ('pending', 'sent', 'failed', 'skipped')
  )
);

create index if not exists notification_events_application_id_idx on public.notification_events(application_id);
create index if not exists notification_events_status_idx on public.notification_events(status);

-- --------------------------------------------------------------------
-- RLS enablement
-- --------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.batches enable row level security;
alter table public.students enable row level security;
alter table public.applications enable row level security;
alter table public.admission_checklists enable row level security;
alter table public.student_documents enable row level security;
alter table public.student_upload_links enable row level security;
alter table public.quotes enable row level security;
alter table public.fee_schedules enable row level security;
alter table public.payment_installments enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_events enable row level security;
alter table public.notification_events enable row level security;

-- --------------------------------------------------------------------
-- RLS policies
-- Initial MVP rule:
-- Authenticated admin and sales users can work with enrolment records.
-- Viewer users can read selected operational records.
-- Writes are limited to admin and sales.
-- --------------------------------------------------------------------

-- profiles
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_basic"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- programs
create policy "programs_select_authenticated"
on public.programs
for select
to authenticated
using (true);

create policy "programs_write_admin"
on public.programs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- batches
create policy "batches_select_authenticated"
on public.batches
for select
to authenticated
using (true);

create policy "batches_write_admin"
on public.batches
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- students
create policy "students_select_staff"
on public.students
for select
to authenticated
using (public.get_my_role() in ('admin', 'sales', 'viewer'));

create policy "students_insert_sales_or_admin"
on public.students
for insert
to authenticated
with check (public.is_sales_or_admin());

create policy "students_update_sales_or_admin"
on public.students
for update
to authenticated
using (public.is_sales_or_admin())
with check (public.is_sales_or_admin());

-- applications
create policy "applications_select_staff"
on public.applications
for select
to authenticated
using (public.get_my_role() in ('admin', 'sales', 'viewer'));

create policy "applications_insert_sales_or_admin"
on public.applications
for insert
to authenticated
with check (public.is_sales_or_admin());

create policy "applications_update_sales_or_admin"
on public.applications
for update
to authenticated
using (public.is_sales_or_admin())
with check (public.is_sales_or_admin());

-- admission checklists
create policy "admission_checklists_select_staff"
on public.admission_checklists
for select
to authenticated
using (public.get_my_role() in ('admin', 'sales', 'viewer'));

create policy "admission_checklists_write_admin"
on public.admission_checklists
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- student documents
create policy "student_documents_select_staff"
on public.student_documents
for select
to authenticated
using (public.get_my_role() in ('admin', 'sales', 'viewer'));

create policy "student_documents_insert_sales_or_admin"
on public.student_documents
for insert
to authenticated
with check (public.is_sales_or_admin());

create policy "student_documents_update_admin"
on public.student_documents
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- upload links
create policy "student_upload_links_select_staff"
on public.student_upload_links
for select
to authenticated
using (public.get_my_role() in ('admin', 'sales', 'viewer'));

create policy "student_upload_links_write_sales_or_admin"
on public.student_upload_links
for all
to authenticated
using (public.is_sales_or_admin())
with check (public.is_sales_or_admin());

-- quotes
create policy "quotes_select_staff"
on public.quotes
for select
to authenticated
using (public.get_my_role() in ('admin', 'sales', 'viewer'));

create policy "quotes_insert_sales_or_admin"
on public.quotes
for insert
to authenticated
with check (public.is_sales_or_admin());

create policy "quotes_update_sales_or_admin"
on public.quotes
for update
to authenticated
using (public.is_sales_or_admin())
with check (public.is_sales_or_admin());

-- fee schedules
create policy "fee_schedules_select_staff"
on public.fee_schedules
for select
to authenticated
using (public.get_my_role() in ('admin', 'sales', 'viewer'));

create policy "fee_schedules_write_admin"
on public.fee_schedules
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- payment installments
create policy "payment_installments_select_staff"
on public.payment_installments
for select
to authenticated
using (public.get_my_role() in ('admin', 'sales', 'viewer'));

create policy "payment_installments_write_admin"
on public.payment_installments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- contracts
create policy "contracts_select_staff"
on public.contracts
for select
to authenticated
using (public.get_my_role() in ('admin', 'sales', 'viewer'));

create policy "contracts_write_admin"
on public.contracts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- contract events
create policy "contract_events_select_staff"
on public.contract_events
for select
to authenticated
using (public.get_my_role() in ('admin', 'sales', 'viewer'));

create policy "contract_events_insert_sales_or_admin"
on public.contract_events
for insert
to authenticated
with check (public.is_sales_or_admin());

-- notification events
create policy "notification_events_select_staff"
on public.notification_events
for select
to authenticated
using (public.get_my_role() in ('admin', 'sales', 'viewer'));

create policy "notification_events_write_admin"
on public.notification_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- --------------------------------------------------------------------
-- Seed initial program
-- --------------------------------------------------------------------

insert into public.programs (
  program_code,
  program_name,
  credential_name,
  total_hours,
  theory_hours,
  practicum_hours,
  default_tuition,
  is_active
)
values (
  'PSW',
  'NACC Personal Support Worker (PSW) DE 2022',
  'PSW Certificate',
  700,
  400,
  300,
  5365.00,
  true
)
on conflict (program_code) do nothing;