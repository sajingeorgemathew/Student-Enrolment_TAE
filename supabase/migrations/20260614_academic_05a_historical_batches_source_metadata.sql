-- ACADEMIC-05A - Historical PSW Batches and Legacy Source Metadata
-- Purpose:
-- 1. Add source sheet/source row metadata fields to imported legacy students so
--    we can record which Excel sheet and row each legacy student came from.
-- 2. Seed the historical PSW batch records that were missing before the earlier
--    (premature) linkage work.
--
-- This migration is additive and non-destructive. It does NOT create, update, or
-- delete students or applications, and it does NOT change any active enrolment
-- workflow. Historical batches are seeded as inactive (is_active = false) so they
-- never appear as active admissions batches.

-- ====================================================================
-- 1. Legacy source metadata columns on students
-- ====================================================================
-- These are filled by the admin-only Legacy Source Backfill tool, not by this
-- migration. Existing legacy rows imported in ACADEMIC-04 keep null values until
-- the backfill matches them to their Excel source row.

alter table public.students
  add column if not exists legacy_source_sheet text,
  add column if not exists legacy_source_row integer,
  add column if not exists legacy_raw_student_number text,
  add column if not exists legacy_normalized_student_number text;

-- ====================================================================
-- 2. Historical PSW batches
-- ====================================================================
-- Idempotent seed: each batch is inserted only when no batch with the same
-- program + batch_name already exists, so re-running the migration never creates
-- duplicates. End dates that are not yet confirmed are stored as null.
--
-- These are seeded inactive (is_active = false). They exist to provide the
-- historical PSW batch foundation for legacy students; they are not active
-- admissions batches.

insert into public.batches (
  program_id,
  batch_name,
  batch_code,
  start_date,
  expected_end_date,
  is_active,
  notes
)
select
  p.id,
  v.batch_name,
  v.batch_code,
  v.start_date::date,
  nullif(v.expected_end_date, '')::date,
  false,
  'Historical PSW batch (ACADEMIC-05A)'
from public.programs p
cross join (
  values
    ('17th March 2025', 'PSW-2025-03-17', '2025-03-17', '2025-08-31'),
    ('12th May 2025',   'PSW-2025-05-12', '2025-05-12', '2025-10-31'),
    ('2nd July 2025',   'PSW-2025-07-17', '2025-07-17', '2026-01-16'),
    ('18th August 2025','PSW-2025-08-18', '2025-08-18', '2026-01-31'),
    ('6th Oct 2025',    'PSW-2025-10-06', '2025-10-06', '2026-03-31'),
    ('Dec 1st 2025',    'PSW-2025-12-01', '2025-12-01', '2026-05-25'),
    ('Jan 12th 2026',   'PSW-2026-01-12', '2026-01-12', '2026-06-30'),
    ('March 2nd 2026',  'PSW-2026-03-02', '2026-03-02', '2026-08-31'),
    ('April 27th 2026', 'PSW-2026-04-27', '2026-04-27', ''),
    ('June 1st 2026',   'PSW-2026-06-01', '2026-06-01', '')
) as v(batch_name, batch_code, start_date, expected_end_date)
where p.program_code = 'PSW'
  and not exists (
    select 1
    from public.batches b
    where b.program_id = p.id
      and b.batch_name = v.batch_name
  );

-- ====================================================================
-- 3. Index to support source-metadata lookups
-- ====================================================================

create index if not exists students_legacy_normalized_student_number_idx
  on public.students(legacy_normalized_student_number);
