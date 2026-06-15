# ACADEMIC-05A - Historical PSW Batches and Legacy Source Metadata

## Goal

Create the missing historical PSW batch foundation and backfill source sheet/source row metadata for already imported legacy students.

This ticket fixes the missing step between legacy student import and batch linkage.

## Current Context

ACADEMIC-04 imported 283 legacy PSW students into `public.students`.

These students have:

- `is_legacy = true`
- `record_source = legacy_import`
- `source_file_name = PSW MASTERCLASS LIST- 2025 - 26.xlsx`

But they do not yet have enough source metadata to know which Excel sheet/batch they came from.

The earlier linkage page was premature because historical PSW batch records were not created first.

## Main Rule

Do not delete or re-import the 283 legacy students.

Do not create duplicate students.

Do not create application linkage in this ticket unless only documenting future use.

This ticket creates the batch/source metadata foundation only.

## Scope

Add or improve:

- historical PSW batch records
- legacy source sheet/source row metadata fields
- admin-only source metadata backfill from Excel
- clear status/reporting for imported legacy students
- no application linkage yet
- no transcript logic yet

## Historical PSW Batches

Ensure these historical PSW batches exist:

- 17th March 2025
- 12th May 2025
- 2nd July 2025
- 18th August 2025
- 6th Oct 2025
- Dec 1st 2025
- Jan 12th 2026
- March 2nd 2026
- April 27th 2026
- June 1st 2026

Use these dates:

- 17th March 2025: start `2025-03-17`, end `2025-08-31`
- 12th May 2025: start `2025-05-12`, end `2025-10-31`
- 2nd July 2025: start `2025-07-17`, end `2026-01-16`
- 18th August 2025: start `2025-08-18`, end `2026-01-31`
- 6th Oct 2025: start `2025-10-06`, end `2026-03-31`
- Dec 1st 2025: start `2025-12-01`, end `2026-05-25`
- Jan 12th 2026: start `2026-01-12`, end `2026-06-30`
- March 2nd 2026: start `2026-03-02`, end `2026-08-31`
- April 27th 2026: start `2026-04-27`, end null unless confirmed
- June 1st 2026: start `2026-06-01`, end null unless confirmed

These should be historical/inactive if the batch model supports it.

Do not make them active admissions batches if there is a safer historical flag/status.

## Program Mapping

All batches in this ticket are PSW.

Use the existing PSW program.

Do not create ELCE batches in this ticket.

Do not import or link ELCE in this ticket.

## Source Metadata

Add source tracking for legacy imported students.

Preferred fields on `public.students` if safe:

- `legacy_source_sheet text null`
- `legacy_source_row integer null`
- `legacy_raw_student_number text null`
- `legacy_normalized_student_number text null`

Alternative:

Create a separate metadata table only if clearly better based on current schema.

Recommended for simplicity:

Add fields to `students`.

## Backfill Source Metadata

Create an admin-only backfill action/page under Academic Records.

Suggested route:

`/dashboard/admin-tools/academic-records/legacy-source-backfill`

Or add it to the existing legacy import/admin academic area.

Backfill should:

1. Accept the same master Excel file upload.
2. Parse workbook using existing legacy import parser.
3. Consider only PSW monthly sheets.
4. Ignore 900 Series.
5. Ignore ELCE.
6. Ignore skipped legend/header rows.
7. Match existing legacy students by normalized student number first.
8. Use email fallback only if safe and no ambiguity.
9. Update the existing legacy student with source sheet/source row metadata.
10. Do not create students.
11. Do not delete students.
12. Do not create applications.
13. Show detailed result summary.

## Matching Rules

Primary match:

- `legacy_import` student where `student_number = normalized Excel student number`

Fallback match:

- email match only if exactly one legacy student has that email and there is no student number conflict

Do not broad-match by name only in this ticket.

## Reviewed Decisions To Preserve

Use the already confirmed ACADEMIC-03 decisions:

- Tara April 27 raw ID `12593` should map to normalized `PSW125293`
- Souleyman Issa June 01 raw ID `125303` should remain excluded
- 900 Series should remain ignored
- ELCE should remain ignored
- reviewed PSW rows should keep their corrected/importable behavior

## Reporting

Backfill result should show:

- total parsed PSW rows
- matched by student number
- matched by email fallback
- updated source metadata
- already had source metadata
- skipped 900 Series
- skipped ELCE
- skipped legend/header rows
- unmatched rows
- ambiguous rows
- errors

## Batch Creation Safety

Historical batch creation should be idempotent:

- do not create duplicate batches
- match existing batch by program + name/start date if safe
- only create missing historical PSW batches

## Not Included

Do not implement:

- application creation
- student-batch application linkage
- transcript generation
- Moodle grade matching
- academic records model
- ELCE import
- 900 Series import
- receipts
- contracts
- payment schedule changes
- active workflow changes

## Role Rules

Admin/super_admin:

- can backfill source metadata
- can ensure historical batches

Sales:

- no access

Viewer:

- no access

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis.

## Acceptance Criteria

- historical PSW batches exist or are safely created
- legacy source metadata fields exist
- admin can upload Excel and backfill source sheet/source row metadata
- 283 imported legacy students are not deleted or duplicated
- PSW rows match existing legacy students by normalized student number
- Tara correction maps to PSW125293
- Souleyman remains excluded
- 900 Series ignored
- ELCE ignored
- no applications are created in this ticket
- no student records are newly created in this ticket
- no receipts/contracts are touched
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Migration

- Name: `supabase/migrations/20260614_academic_05a_historical_batches_source_metadata.sql`
- Additive and non-destructive. Run it manually in Supabase (SQL editor) before
  using the backfill tool. It does three things:
  1. Adds four nullable source metadata columns to `public.students`:
     `legacy_source_sheet text`, `legacy_source_row integer`,
     `legacy_raw_student_number text`, `legacy_normalized_student_number text`.
  2. Seeds the ten historical PSW batches (see below).
  3. Adds an index on `legacy_normalized_student_number`.
- Decision: source metadata fields were added directly to `public.students`
  (the ticket-recommended option) rather than a separate metadata table. The
  legacy student is already a single row, so a 1:1 metadata table added no
  value and would complicate reads in the student hub.

### Historical batch creation

- Seeded by the migration using a single idempotent `insert ... select`.
- Each batch is inserted only when no batch with the same `program_id` +
  `batch_name` already exists, so re-running the migration never duplicates.
- Program: the existing seeded PSW program (`program_code = 'PSW'`). No ELCE
  batches are created.
- Batches are seeded inactive (`is_active = false`) so they never appear as
  active admissions batches. `batch_code` follows `PSW-YYYY-MM-DD`.
- Dates follow the ticket exactly. April 27th 2026 and June 1st 2026 are seeded
  with a null `expected_end_date` (not yet confirmed).

### Source metadata backfill behavior

- Route: `/dashboard/admin-tools/academic-records/legacy-source-backfill`
  (admin/super_admin only; sales and viewer are blocked on the page and the
  server action re-checks the role).
- Action: `src/features/academic/legacy-source-backfill-actions.ts`.
- Re-parses and re-classifies the uploaded Excel with the existing legacy
  import parser/classifier, so reviewed ACADEMIC-03 decisions are preserved:
  Tara's source ID `12593` resolves to `PSW125293`, Souleyman Issa is excluded,
  900 Series rows are skipped, ELCE rows are skipped, and legend/header/blank
  rows are skipped.
- Matching: normalized student number first; email fallback only when exactly
  one legacy student has that email and there is no student-number conflict.
- Only updates the four metadata columns on rows where
  `record_source = 'legacy_import'`. It never creates students, deletes
  students, or creates applications. A student that already has
  `legacy_source_sheet` set is left unchanged (idempotent; first source row
  wins).
- Reporting: total parsed PSW rows, matched by student number, matched by email
  fallback, updated, already had metadata, unmatched, ambiguous, skipped 900
  Series, skipped ELCE, skipped legend/header rows, reviewed excluded, errors.

### Premature linkage cleanup

- The earlier ACADEMIC-05 linkage UI created `applications` rows, which is out of
  scope here. Removed in this ticket:
  - `src/app/dashboard/admin-tools/academic-records/legacy-linkage/page.tsx`
  - `src/features/academic/legacy-linkage-actions.ts`
  - `src/features/academic/legacy-linkage-panel.tsx`
- The Academic Records landing card now points to Legacy Source Backfill instead
  of Legacy Student Linkage.
- The ACADEMIC-05 migration (`20260614_academic_05_legacy_application_linkage.sql`)
  is left in place because it is additive and may already be applied. The
  `source_sheet_name` column it added remains; this ticket adds the more explicit
  `legacy_source_*` fields used by the backfill.
- `src/lib/legacy-import/batch-mapping.ts` is kept (pure, no DB access) for reuse
  by the batch linkage work in ACADEMIC-05B.

### Manual Supabase SQL required

- Run `20260614_academic_05a_historical_batches_source_metadata.sql` in Supabase
  before running the backfill, so the metadata columns and historical batches
  exist.

### Limitations

- The backfill assigns each legacy student the first PSW source row it matches
  (workbook order); a student appearing on more than one sheet keeps the first.
- It does not link students to batches or create applications - that is
  ACADEMIC-05B.

### Next ticket

- ACADEMIC-05B: link legacy students to the historical PSW batches (program and
  batch context) using the source metadata recorded here, without pulling them
  into the active enrolment workflow.