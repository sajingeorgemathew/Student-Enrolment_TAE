# ACADEMIC-05B - Legacy Student Application and Batch Linkage

## Goal

Create minimal historical application records for imported legacy PSW students so they are linked to the correct PSW program and historical batch.

This allows legacy students to show proper program/batch context in the student hub and batch views without forcing them into the active enrolment workflow.

## Current Context

Completed before this ticket:

- ACADEMIC-04 - Import Confirm and Create Student Records
- ACADEMIC-05A - Historical PSW Batches and Legacy Source Metadata

Current database state:

- 283 legacy students exist in `public.students`
- each has `is_legacy = true`
- each has `record_source = legacy_import`
- legacy source metadata has been backfilled:
  - `legacy_source_sheet`
  - `legacy_source_row`
  - `legacy_raw_student_number`
  - `legacy_normalized_student_number`
- historical PSW batches now exist in `public.batches`
- historical PSW batches map to source sheets

This ticket should now create the minimal application linkage.

## Main Rule

Do not create active enrolment workflow records.

Do not create:

- sales intake records
- checklist records
- fee records
- contract records
- document records
- receipt records
- transcript records

Create only the minimal application records needed to connect:

`legacy student -> PSW program -> historical PSW batch`

## Source Sheet To Batch Mapping

Use the student field:

`students.legacy_source_sheet`

Map it to historical PSW batch:

- `17th March` -> `17th March 2025`
- `12th May` -> `12th May 2025`
- `2nd July` -> `2nd July 2025`
- `18th August` -> `18th August 2025`
- `6th Oct` -> `6th Oct 2025`
- `Dec 1st` -> `Dec 1st 2025`
- `Jan 12th` -> `Jan 12th 2026`
- `March 2` -> `March 2nd 2026`
- `April 27` -> `April 27th 2026`
- `June 01` -> `June 1st 2026`

Use the PSW program:

- program_code = `PSW`

## Application Strategy

Inspect existing `applications` table and current app patterns before implementing.

Create a minimal historical application record only if the student does not already have an application linked to the same program/batch.

Preferred fields:

- `student_id`
- `program_id`
- `batch_id`
- status using an existing safe status
- `created_by`
- timestamps

If the ACADEMIC-05A migration added application-level legacy fields, use them.

If not, use student-level legacy fields and safe notes only.

Do not add a new application status unless absolutely necessary.

If a status is required and the schema has a safe existing status like:

- `completed`
- `accepted`
- `active`
- `pending`

Use the safest one based on current project code and document the choice.

If the app has a free-text notes/source field on applications, mark:

`Legacy historical application created from legacy import`

## Duplicate Protection

Do not create duplicate applications.

Before insert, check whether an application already exists for:

- same student_id
- same program_id
- same batch_id

If yes:

- skip and report as already linked

## Linkage Page

Update or create admin-only linkage UI under Academic Records.

Suggested route:

`/dashboard/admin-tools/academic-records/legacy-linkage`

The page should show:

- total legacy students
- students with source metadata
- already linked
- unlinked
- missing source metadata
- missing batch mapping
- link action button

Action:

- Link unlinked legacy PSW students

It should create minimal application records only for eligible students.

## Eligible Students

Eligible:

- `students.is_legacy = true`
- `students.record_source = legacy_import`
- `legacy_source_sheet` is one of the PSW sheets
- matching historical PSW batch exists
- not already linked to the same PSW program/batch

Not eligible:

- missing source sheet
- source sheet not mapped
- ELCE
- 900 Series
- already linked
- missing PSW program
- missing batch

## Student Hub Behavior

After linkage, student hub should show:

- Legacy Student badge
- PSW program context
- historical batch context

Do not redesign the student hub.

Do not force legacy students through active sections.

If active workflow sections appear, do not create related records in this ticket.

## Batch View Behavior

After linkage, legacy students may appear under batch context if the batch page uses applications for student counts/lists.

If batch page still filters out historical/legacy applications, document that as a later display ticket.

## Role Rules

Admin/super_admin:

- can access linkage page
- can run linkage action

Sales:

- no linkage controls

Viewer:

- no linkage controls

Server action must enforce admin/super_admin.

## Not Included

Do not implement:

- transcript generation
- Moodle grade matching
- academic records model
- ELCE import
- 900 Series import
- payment/fee records
- contract generation
- checklist creation
- document creation
- receipt changes
- batch creation if ACADEMIC-05A already created batches
- source metadata backfill if ACADEMIC-05A already handled it

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis.

## Acceptance Criteria

- admin/super_admin can open legacy linkage page
- linkage page shows correct count of 283 legacy students or current imported count
- unlinked legacy students are detected
- link action creates minimal application records
- each linked application has student_id, PSW program_id, correct batch_id
- duplicate applications are not created
- legacy students show program/batch context after linkage
- no fees/checklists/contracts/documents/receipts are created
- sales/viewer cannot run linkage
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### No migration required

- No new migration was created. Everything needed already existed:
  - `applications.is_legacy` and `applications.record_source` were added by
    `20260614_academic_05_legacy_application_linkage.sql`.
  - `students.legacy_source_sheet` and the historical PSW batches were added by
    `20260614_academic_05a_historical_batches_source_metadata.sql`.

### Application status and fields used

- Status: `archived`. The `applications_status_check` constraint only allows the
  active workflow statuses (`new_intake` .. `signed`, `archived`); there is no
  dedicated historical/completed status. `archived` is the safest existing value
  because it is the terminal non-active status and existing helpers already treat
  it as such:
  - the active intake/checklist/fees/contract queues exclude it (and exclude
    `is_legacy` applications),
  - `features/receipts/new-receipt-actions.ts` picks a non-archived application
    as the active one, so a legacy linkage row is never auto-selected for a
    receipt,
  - the archive count helpers ignore archived applications.
- Inserted fields per linkage application:
  - `student_id`, `program_id` (PSW), `batch_id` (historical PSW batch),
  - `status = 'archived'`,
  - `is_legacy = true`,
  - `record_source = 'legacy_import'`,
  - `admin_notes = 'Legacy historical application created from legacy import'`,
  - `created_by = current admin profile id`,
  - timestamps default in the database.

### Source sheet to batch mapping

- `src/lib/legacy-import/batch-mapping.ts` gained `SHEET_TO_BATCH_NAME` (the exact
  ticket mapping) and `resolveHistoricalBatchForSourceSheet`. The pre-existing
  fuzzy matcher alone could not connect a source sheet ("17th March") to its
  batch ("17th March 2025") because the batch name carries a year. The new
  resolver maps the sheet to its batch name, then matches that name canonically
  against the loaded PSW batches. An unmatched or ambiguous sheet is reported as
  needing batch linkage rather than guessed.

### Route and action behavior

- Route: `/dashboard/admin-tools/academic-records/legacy-linkage`
  (admin/super_admin only; sales and viewer are blocked on the page, including by
  direct URL). It shows total legacy students, with source metadata, already
  linked, unlinked, missing source metadata, missing batch mapping, and eligible
  for linkage, plus a link button.
- Action: `linkLegacyStudents` in
  `src/features/academic/legacy-linkage-actions.ts`. It re-checks admin/super
  admin, loads the PSW program, PSW batches, legacy students, and their existing
  applications, classifies each student, and inserts one minimal application for
  each eligible (unlinked, source-mapped) student. It returns per-row results and
  a summary.
- The Academic Records landing page now has a Legacy Student Linkage card again
  (next to Legacy Source Backfill).

### Linkage count behavior

- Counts are computed from a single classification pass:
  - `missing_source_metadata`: `legacy_source_sheet` is null,
  - `missing_batch_mapping`: has a source sheet but it does not resolve to exactly
    one historical PSW batch,
  - `already_linked`: an application already exists for the same
    student/program/batch,
  - `eligible`: has a source sheet, resolves to a batch, and is not yet linked.
- `unlinked = total - already_linked`; `with source metadata = total - missing
  source metadata`.

### Duplicate protection

- Before insert, the student's existing applications are checked for the same
  `student_id` + `program_id` + `batch_id`; a match is reported as already linked
  and skipped. A final per-row existence check guards the insert as well. Running
  the action a second time links nothing new (all eligible become already
  linked).

### Student hub behavior

- No hub redesign was needed. The hub already loads all applications and uses the
  latest for program/batch context, and it already sets
  `showWorkflow = !!latestApp && !isLegacyStudent`. After linkage a legacy student
  shows the Legacy Student badge and the Program and Batch section (PSW program +
  historical batch), while the active workflow sections (sales intake, workflow
  review, official checklist, fees, contract readiness/export, batch transfer)
  stay hidden.

### Active workflow protection

- No new filters were required. The active work queues already exclude
  `is_legacy` applications (`features/intake/actions.ts`,
  `features/checklists/actions.ts`, `features/fees/actions.ts`,
  `features/contracts/actions.ts` all filter `.eq("is_legacy", false)`), and the
  linkage applications are inserted with `is_legacy = true` and the `archived`
  status, so they cannot surface inappropriate active actions.

### Role and access behavior

- Admin/super_admin: can open the page and run the link action.
- Sales/viewer: blocked on the page and on the server action (the action
  re-checks `isAdminOrSuper`).

### Limitations

- A legacy student with no source sheet, or a source sheet that does not map to
  exactly one PSW batch, is reported and skipped (not linked). Run Legacy Source
  Backfill first to fill missing source metadata.
- Only PSW is handled. ELCE and 900 Series are out of scope, as is transcript
  generation, Moodle grade matching, fees, checklists, contracts, documents, and
  receipts.
- Batch list/detail pages may still filter out historical/legacy applications;
  surfacing legacy students there is a later display ticket.