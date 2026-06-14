# ACADEMIC-04 - Import Confirm and Create Student Records

## Goal

Add a controlled import confirmation flow for legacy student records.

Admin/super_admin should be able to upload the legacy Excel file, preview rows, select approved importable rows, confirm import, and create legacy student records.

This ticket creates student records only for selected and approved rows.

## Current Context

Completed before this ticket:

- ACADEMIC-01 - Legacy Student Import Blueprint
- ACADEMIC-02 - Legacy Student Import Model and Flags
- ACADEMIC-03 - Legacy Student Excel Import Preview
- ACADEMIC-03-FIX - Warning Reason Clarity
- ACADEMIC-03-RULES - Program and Re-enrolment Rules
- ACADEMIC-03-CORRECTIONS - Reviewed Row Decisions

The preview now identifies:

- clean PSW new candidates
- matched existing students
- reviewed importable rows
- skipped rows
- 900 Series re-enrolment rows
- ELCE separate program rows
- reviewed excluded rows

## Main Rule

Do not import everything automatically.

Only selected and approved importable rows should create student records.

Matched existing rows should not create duplicate students.

Skipped rows should not import.

900 Series rows should not import.

ELCE rows should not import in this ticket.

## Scope

Add or improve:

- import confirmation UI
- selectable importable rows
- import summary before confirmation
- server-side import action
- duplicate checks before insert
- create legacy student records
- mark records as legacy
- import result summary
- clear errors for blocked rows

## Route

Use existing route if possible:

`/dashboard/admin-tools/academic-records/legacy-import`

Add confirmation/import action on the same preview page.

## Importable Rows

Rows allowed for import:

- clean PSW new candidates
- reviewed importable PSW rows
- corrected Tara row using PSW125293

Rows not allowed for import:

- matched existing students
- possible matches not reviewed
- invalid rows
- skipped legend/header rows
- 900 Series re-enrolment rows
- ELCE separate program rows
- Souleyman Issa 125303 June 01 reviewed excluded row

## Confirmed Reviewed Decisions To Preserve

### Keep/importable

- 17th March raw ID 12521 Manpreet Kaur - reviewed/importable
- 6th Oct raw ID 125128 Chandrashekar Sriramalu - reviewed/importable
- 6th Oct raw ID 125135 Preet Kaur - reviewed/importable
- Jan 12th raw ID 125216 Manpreet Kaur - reviewed/importable
- April 27 raw ID 125213 Alvin Saji - reviewed/importable

### Correct/importable

- April 27 raw ID 12593 Tara Khand Thakuri Shahi should import as `PSW125293`

### Exclude

- June 01 raw ID 125303 Souleyman Issa should not import

## Student Number Rules

PSW rows:

- `125315` -> `PSW125315`
- `PSW125315` -> `PSW125315`
- `PSW 125315` -> `PSW125315`

ELCE rows:

- `12101` -> `ELCE12101`
- not imported in this ticket

900 Series:

- normalize for reference only
- not imported

## Student Insert Mapping

Create rows in `public.students`.

Map:

- normalized student number -> `student_number`
- first name -> `legal_first_name`
- middle name -> `legal_middle_name`
- last name -> `legal_last_name`
- combined name -> `legal_full_name`
- date of birth -> `date_of_birth`
- contact number -> `phone`
- email -> `email`
- address -> `mailing_address_line_1`
- WP/status if available -> `immigration_status` or `notes` only if current project pattern supports it
- `is_legacy` -> true
- `record_source` -> `legacy_import`
- `source_file_name` -> uploaded file name
- `legacy_imported_at` -> now()
- `legacy_imported_by` -> current user id
- `created_by` -> current user id if required by table pattern

Use existing project insert patterns.

## Application / Batch Linkage

This ticket should be careful.

Preferred behavior:

- create student records first
- do not create applications if application creation requires too many workflow assumptions

If the student hub requires application rows to show batch/program, implement only if safe.

If minimal applications are needed:

- use existing program/batch lookup only
- do not create missing batches automatically in this ticket
- if batch not found, create student only and show import warning/result
- do not add new application status
- do not force contract/checklist/fee workflow

If not safe, document application linking as next ticket.

## Duplicate Protection

Before inserting each selected row, check:

1. normalized student_number already exists
2. email already exists
3. possible same legal_full_name in same batch if batch context exists

If student_number already exists:

- do not insert
- return skipped result: existing student number

If email already exists but student number is different:

- allow only if row has reviewed importable decision, such as Chandrashekar or Alvin
- otherwise block and return review needed

If duplicate appears inside selected import rows:

- block duplicate duplicate
- do not insert two records with same student_number

## Import Confirmation UI

Preview page should support:

- checkbox for importable rows
- select all importable rows
- selected count
- confirmation summary
- confirm button
- warning that import creates legacy student records
- show rows that are not importable as disabled

Do not allow import of blocked rows.

## Import Result

After import, show:

- created count
- skipped count
- failed count
- created student links if possible
- skipped reasons
- error details if any

## Transaction Safety

Use safe insert behavior.

If possible:

- insert selected rows in a controlled loop with per-row result
- avoid partial silent failure
- return detailed row results

Do not create duplicate records if user submits twice.

## Role Rules

Admin/super_admin:

- can preview
- can confirm import
- can create legacy students

Sales:

- no access

Viewer:

- no access

Server action must enforce admin/super_admin.

## Not Included

Do not implement:

- Moodle grade matching
- transcript generation
- academic records data model
- ELCE import confirmation
- 900 Series import
- batch creation
- program creation
- full application workflow creation unless minimal linking is clearly safe
- student hub academic summary
- receipts changes
- contract changes
- database schema changes unless absolutely required

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis.

## Acceptance Criteria

- admin/super_admin can select importable PSW rows
- non-importable rows are disabled
- 900 Series rows cannot be imported
- ELCE rows cannot be imported in this ticket
- skipped legend rows cannot be imported
- Souleyman Issa 125303 June 01 cannot be imported
- Tara imports as PSW125293 if selected
- selected clean/reviewed PSW rows create legacy student records
- created records have is_legacy = true
- created records have record_source = legacy_import
- duplicate existing student numbers are blocked
- sales/viewer cannot access or import
- no transcript logic is added
- no receipt/contract logic is changed
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Files created

- `src/lib/legacy-import/importable.ts` - single source of truth for which
  preview rows may be imported (`isImportableRow`), which reviewed rows may
  bypass the email-duplicate guard (`isReviewedImportableRow`), and the stable
  row key helper (`rowKey`). Pure, no server deps, so the client preview and the
  server action share one rule and cannot disagree.
- `src/features/academic/legacy-import-confirm-actions.ts` - admin-only server
  action `confirmLegacyImport` that creates legacy student records.

### Files modified

- `src/lib/legacy-import/types.ts` - added `ImportRowOutcome`, `ImportRowResult`,
  and `LegacyImportConfirmState`.
- `src/features/academic/legacy-import-preview.tsx` - added the import
  confirmation UI (checkboxes, select-all, selected count, warning panel,
  two-step confirmation, and the per-row import result table).
- `src/app/dashboard/admin-tools/academic-records/legacy-import/page.tsx` -
  updated the page copy; the page now supports import, not preview only.

### Import UI behavior

- After a preview, importable rows get an enabled checkbox in a new leading
  Import column. Non-importable rows show a disabled checkbox.
- A "Select all importable rows" control selects every importable row across the
  whole preview (not just the current filter), with a live selected count.
- Importing is two-step: "Review import (N)" opens a summary panel that warns the
  action writes legacy student records, then "Confirm and create N records"
  submits. There is no import-all.
- After import, a result panel shows created / skipped / failed counts and a
  per-row table with outcome, reason, and a link to each created student.

### Server import behavior

- `confirmLegacyImport` re-checks admin/super_admin, re-validates and re-parses
  the uploaded file, re-classifies it, and never trusts the client. The client
  sends only row keys (sheet + row number) plus the file.
- Each selected row is re-validated with `isImportableRow`; non-importable
  selections are skipped with a reason.
- Rows are inserted one at a time with a per-row result (created / skipped /
  failed), so one bad row never silently aborts the rest.
- Insert mapping: normalized student number -> `student_number`; derived first /
  middle / last -> name columns; DOB -> `date_of_birth`; phone -> `phone`;
  normalized email -> `email`; address -> `mailing_address_line_1`; WP/status ->
  `notes` ("Legacy import status: ..."); `is_legacy` true; `record_source`
  `legacy_import`; `source_file_name` the uploaded file name;
  `legacy_imported_at` now(); `legacy_imported_by` and `created_by` the current
  user id. `legal_full_name` is a generated column and is not inserted.
- `immigration_status` is intentionally not written from the WP/status column
  (it expects controlled values); the raw value is preserved in `notes` instead.

### Duplicate protection behavior

- Before each insert: blocks if the normalized student number already exists in
  the database; blocks if the same number appears twice in the selected rows
  (only the first is created); blocks email duplicates (database or in-selection)
  unless the row is reviewed-importable; and treats a unique-violation at insert
  time as a skip, not a failure, so a double submit cannot create duplicates.

### Tara correction behavior

- The April 27 raw id `12593` (Tara Khand Thakuri Shahi) is reviewed-importable
  and imports under the corrected `PSW125293`, because classification already
  rewrites the normalized number for that one row.

### Blocked row behavior

- Matched existing students, possible name matches, invalid rows, skipped
  legend/header/blank rows, in-file duplicates, 900 Series re-enrolment rows,
  ELCE separate-program rows, and reviewed-excluded rows (Souleyman Issa 125303,
  June 01) are all non-importable: their checkboxes are disabled, and even a
  forged client request is rejected server-side by `isImportableRow`.

### Application / batch linking decision

- Deferred to a later ticket. Only student records are created. The students
  table does not require an application, and the student hub renders correctly
  with no applications, so creating student-only rows is safe. No applications,
  batches, or programs are created.

### Role / access behavior

- Admin/super_admin only. The page renders an access notice for other roles, and
  `confirmLegacyImport` independently re-checks the role, so sales and viewer are
  blocked from both the route and the action (including by direct POST).

### Limitations

- No applications, batches, or programs are created (program/batch context for
  imported legacy students is a future ticket).
- ELCE import, 900 Series import, transcript generation, Moodle grade matching,
  and the academic records data model are out of scope and untouched.
- Receipts, contracts, the student hub workflow, and payment schedule logic are
  unchanged.
- The import re-sends the previewed file; if the file input is changed without
  re-previewing, keys may not match and those rows are reported as failed
  ("Row not found"), so no wrong record is created.