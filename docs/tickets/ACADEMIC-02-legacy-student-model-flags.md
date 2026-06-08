# ACADEMIC-02 - Legacy Student Import Model and Flags

## Goal

Add the database/model foundation for legacy/historical student records.

This ticket prepares the system for future Excel import, but does not import any Excel rows yet.

## Blueprint Source

Use:

- `docs/blueprint/legacy-student-import.md`
- `docs/tickets/ACADEMIC-01-legacy-student-import-blueprint.md`

## Main Product Direction

Legacy students are past/historical students imported from old master records.

They should exist as normal student records so transcripts, academic records, receipts, and future records can connect to them.

They should not be forced through the current sales intake, contract, checklist, fee, or document workflow.

Legacy students should be clearly marked with a badge/filter.

Recommended label:

- Legacy Student

## Scope

Add or improve:

- legacy/source flags on student records
- optional legacy/source fields on application records if needed
- ability to filter students by current vs legacy
- clear badge support for legacy students
- safe model/type updates
- no Excel import yet

## Important Rule

Do not create imported students in this ticket.

Do not parse the Excel file in this ticket.

Do not create transcript records in this ticket.

## Recommended Data Strategy

Add fields to `students` if safe:

- `is_legacy boolean not null default false`
- `record_source text not null default 'manual'`
- `source_file_name text null`
- `legacy_imported_at timestamptz null`
- `legacy_imported_by uuid null references auth.users(id) on delete set null`

Allowed `record_source` values could include:

- `manual`
- `legacy_import`
- `system`

Use existing project style for constraints.

## Application Strategy

The blueprint noted that the student hub may rely on applications for program/batch context.

Do not add a new `legacy_record` application status unless absolutely needed.

Preferred approach:

- keep application statuses unchanged
- use student-level legacy flags to indicate imported/historical records
- if a minimal application is needed later, create it during ACADEMIC-04 import confirmation
- add application-level legacy flags only if current code clearly needs them

If application fields are added, keep them minimal and safe.

Possible application fields:

- `is_legacy boolean not null default false`
- `record_source text null`

Only add these if needed.

## Student List Behavior

Legacy students should not be mixed into daily active admissions by default if that is safe to implement.

Preferred filter behavior:

- default: current/non-legacy students
- filter: All
- filter: Current
- filter: Legacy

If changing default behavior is risky, add the filter and badge now, but keep default behavior unchanged and document it.

## Student Hub Behavior

Legacy student records should show a clear badge or notice:

- Legacy Student
- Imported historical record

Do not hide the student hub.

Do not force legacy students through:

- sales intake
- contract workflow
- checklist
- fees
- documents

If those sections currently appear because of existing hub structure, do not redesign them in this ticket. Add only a safe notice/badge if possible.

## Duplicate Prevention Direction

Future imports will use:

- student_number exact match first
- email exact match second
- normalized name + batch third

This ticket only creates fields needed to track legacy source.

Do not implement import matching yet.

## Role Rules

Admin/super_admin:

- can see legacy flags and filters
- can later import legacy students

Sales:

- should not import legacy students
- may view legacy records only if current student list access allows

Viewer:

- read-only only

Do not loosen permissions.

## Not Included

Do not implement:

- Excel import parser
- Excel upload UI
- import preview
- import confirmation
- transcript generator
- Moodle grade matching
- academic records data model
- placement module
- receipts changes
- contracts changes
- student creation from Excel
- batch creation
- program creation

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis.

## Acceptance Criteria

- database/model supports marking students as legacy
- database/model supports source tracking for legacy import
- student list can show/filter legacy students if safely implemented
- student hub can display Legacy Student badge/notice if safely implemented
- no Excel rows are imported
- no transcript logic is added
- no contract/receipt logic is changed
- no application workflow is broken
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Migration

- `supabase/migrations/20260608_academic_02_legacy_student_fields.sql`

### Student fields added (public.students)

- `is_legacy boolean not null default false`
- `record_source text not null default 'manual'`
- `source_file_name text null`
- `legacy_imported_at timestamptz null`
- `legacy_imported_by uuid null references auth.users(id) on delete set null`
- Check constraint `students_record_source_check` allowing `manual`, `legacy_import`, `system`
- Index `students_is_legacy_idx` on `students(is_legacy)`

No application-level legacy flags were added. The current student hub and
list do not require them, so the legacy marker is kept on students only,
per the preferred approach in the ticket.

No new application status was added.

### TypeScript / generated types

The project does not maintain a generated Supabase types file. Queries are
untyped and cast at the call site, so no type regeneration is required. The
new columns flow through automatically:
- `getStudents` selects `is_legacy` and `record_source`.
- `getStudentById` uses `select("*")`, so all new columns are returned.

### Student list behavior

- Added a Legacy/Current/All filter (tabs next to the search box).
- Default filter is `current` (excludes legacy students). All existing
  students are non-legacy (`is_legacy` defaults to false), so the default
  list shows exactly the same records as before this ticket. Behavior is
  unchanged for current data and forward-compatible once imports exist.
- Added a violet "Legacy Student" badge next to the student name in the list.
- Existing search and batch filters are preserved and combine with the
  legacy filter.

### Student hub badge/notice behavior

- Added a violet "Legacy Student" badge next to the student name header.
- Added a notice banner: "Legacy Student - imported historical record"
  explaining the record is historical and not required to pass through the
  current sales intake, contract, checklist, fee, or document workflow.
- No hub sections were redesigned, hidden, or changed. Contract, checklist,
  fee, document, and receipt behavior is untouched.

### Role behavior

- No permission changes. Existing student view permissions are preserved.
- No import access, admin import page, or Excel handling was added.

### Manual Supabase SQL required

The migration is committed but Supabase migrations in this project are
applied manually. Run the SQL in
`supabase/migrations/20260608_academic_02_legacy_student_fields.sql`
against the Supabase database (SQL editor or migration runner) so the new
columns, constraint, and index exist. The migration is additive and safe to
run on existing data.

### Limitations

- No Excel parsing, upload, import preview, or import confirmation.
- No student records are created from Excel in this ticket.
- No transcript, academic records, placement, or Moodle matching logic.
- Legacy students are tracked at the student level only; minimal legacy
  applications (if ever needed) are deferred to the import confirmation
  ticket.