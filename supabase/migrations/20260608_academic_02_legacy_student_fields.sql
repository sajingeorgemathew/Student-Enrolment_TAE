-- ACADEMIC-02 - Legacy Student Import Model and Flags
-- Purpose:
-- Add the database/model foundation for legacy/historical student records.
-- This migration is additive and non-destructive. It does NOT import any
-- Excel rows, create students, or change application workflow logic.

-- ====================================================================
-- 1. Add legacy/source tracking columns to students
-- ====================================================================

alter table public.students
  add column if not exists is_legacy boolean not null default false,
  add column if not exists record_source text not null default 'manual',
  add column if not exists source_file_name text,
  add column if not exists legacy_imported_at timestamptz,
  add column if not exists legacy_imported_by uuid references auth.users(id) on delete set null;

-- ====================================================================
-- 2. Constrain record_source to known values
-- ====================================================================

alter table public.students
  drop constraint if exists students_record_source_check;

alter table public.students
  add constraint students_record_source_check check (
    record_source in ('manual', 'legacy_import', 'system')
  );

-- ====================================================================
-- 3. Index to support filtering current vs legacy students
-- ====================================================================

create index if not exists students_is_legacy_idx on public.students(is_legacy);
