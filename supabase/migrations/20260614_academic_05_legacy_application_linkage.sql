-- ACADEMIC-05 - Legacy Student Application and Batch Linkage
-- Purpose:
-- Add the minimal, additive fields needed to safely link imported legacy
-- students to the PSW program and the correct PSW batch context.
--
-- This migration is additive and non-destructive. It does NOT create students,
-- applications, batches, programs, fees, checklists, contracts, or receipts, and
-- it does NOT change any active enrolment workflow logic.

-- ====================================================================
-- 1. Record the source sheet on imported legacy students
-- ====================================================================
-- The source sheet name (for example "17th March") is what maps a legacy
-- student to a PSW batch. It is stored here so future imports can carry it and
-- the linkage action can resolve the batch. Existing rows imported before this
-- migration will have a null value and are reported as "needs batch linkage".

alter table public.students
  add column if not exists source_sheet_name text;

-- ====================================================================
-- 2. Mark legacy linkage applications
-- ====================================================================
-- A minimal legacy application links a legacy student to a program/batch so the
-- student hub can show program and batch context. These flags let the active
-- work queues (intake, checklists, contracts, fees) exclude legacy linkage rows
-- so legacy students are never pulled into the active enrolment workflow.

alter table public.applications
  add column if not exists is_legacy boolean not null default false,
  add column if not exists record_source text;

alter table public.applications
  drop constraint if exists applications_record_source_check;

alter table public.applications
  add constraint applications_record_source_check check (
    record_source is null
    or record_source in ('manual', 'legacy_import', 'system')
  );

create index if not exists applications_is_legacy_idx on public.applications(is_legacy);
