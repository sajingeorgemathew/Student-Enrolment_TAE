# ACADEMIC-05 - Legacy Student Application and Batch Linkage

## Goal

Link imported legacy students to the correct program and batch context so they can be used for transcripts, academic records, and student hub lookup.

This ticket should not change the active enrolment workflow.

## Current Context

Completed before this ticket:

- ACADEMIC-01 - Legacy Student Import Blueprint
- ACADEMIC-02 - Legacy Student Import Model and Flags
- ACADEMIC-03 - Legacy Student Excel Import Preview
- ACADEMIC-03-FIX - Warning Reason Clarity
- ACADEMIC-03-RULES - Program and Re-enrolment Rules
- ACADEMIC-03-CORRECTIONS - Reviewed Row Decisions
- ACADEMIC-04 - Import Confirm and Create Student Records

ACADEMIC-04 creates legacy student rows only.

Now legacy students need safe program/batch linkage.

## Main Product Rule

Legacy students should be linked to PSW program and batch where possible, but they should not be forced through the normal sales intake, contract, checklist, fee, document, or application workflow.

## Scope

Add or improve:

- mapping legacy import source sheet to existing batch
- minimal application/link record if needed by current app structure
- safe legacy application context
- student hub program/batch display for legacy students
- no intake/contract/checklist/fees generation
- no transcript generation yet

## Source Sheet To Batch Mapping

Use the source sheet from the import.

PSW sheets:

- 17th March
- 12th May
- 2nd July
- 18th August
- 6th Oct
- Dec 1st
- Jan 12th
- March 2
- April 27
- June 01

These should map to the matching existing PSW batch records if they exist.

Do not create missing batches automatically unless the project already has a safe pattern and the mapping is certain.

If batch is missing:

- show as needs batch linkage
- do not create a wrong batch silently

## Program Mapping

PSW legacy rows should map to:

- PSW program

Do not link ELCE in this ticket.

Do not link 900 Series in this ticket.

## Application Strategy

Inspect current app structure first.

If student hub/program/batch display depends on `applications`, create a minimal application record only for imported legacy students.

Preferred minimal legacy application:

- student_id
- program_id
- batch_id
- status using existing safe status only
- is_legacy true if application-level flag exists or add only if absolutely needed
- record_source legacy_import if safe
- created_by current user or system/admin if current pattern requires it

Do not add a new application status unless necessary.

If no safe application status exists for legacy records, use the safest existing status and rely on student.is_legacy to prevent active workflow confusion.

## Important

Do not create:

- sales intake data
- fee schedules
- checklists
- contract records
- document records
- receipt records
- transcript records

## Linkage Method

Preferred options:

1. During ACADEMIC-04 import, future imports can create/link minimal application records.
2. For already imported legacy students, this ticket can provide an admin-only linkage action that links selected legacy students to program/batch based on source sheet.

Choose the safer option based on current code.

If ACADEMIC-04 already stored enough source info on students, use:

- source_file_name
- notes
- imported metadata
- possibly source sheet if available

If source sheet was not stored on students, document the limitation and update ACADEMIC-04 import metadata going forward only if safe.

## Student Hub Behavior

For linked legacy students, student hub should show:

- Legacy Student badge
- program
- batch
- notice that this is a historical record
- active workflow sections should not imply active enrolment if not applicable

Do not redesign the full hub.

## Role Rules

Admin/super_admin:

- can link legacy students to program/batch
- can view linkage status

Sales:

- no legacy linkage controls

Viewer:

- read-only only

## Not Included

Do not implement:

- Moodle grade matching
- transcript data model
- transcript generator
- ELCE import
- 900 Series import
- batch creation unless absolutely safe
- program creation unless absolutely safe
- active workflow changes
- contract changes
- receipt changes
- student hub redesign

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis.

## Acceptance Criteria

- legacy PSW students can be linked to PSW program
- legacy PSW students can be linked to correct batch where batch exists
- missing batch mapping is clearly reported
- no sales intake/checklist/fees/contract records are created
- legacy student hub shows program/batch if linked
- sales/viewer do not get linkage controls
- no transcript logic is added
- no receipt/contract logic is changed
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Linkage strategy used

Option 2 (admin-only linkage action for already-imported legacy students), plus
a small forward-looking change to the import so the strategy keeps working for
future imports.

The student hub reads program and batch only from a joined `applications` row
(`latestApp.programs` / `latestApp.batches`), so showing program/batch context
for a legacy student requires a minimal application. A new admin-only page,
Academic Records > Legacy Student Linkage, lists every imported legacy student
and their linkage state and runs the linkage action.

Program mapping is unconditional: every imported legacy student is PSW (ELCE and
900 Series were never imported), so each is linked to the PSW program.

Batch mapping uses the student's recorded source sheet (for example "17th
March"). A pure resolver (`src/lib/legacy-import/batch-mapping.ts`) canonicalises
the sheet label and the batch name/code (lower case, ordinal suffixes removed,
month names normalised, tokens sorted) and requires exactly one match against an
existing active PSW batch. No match, an ambiguous match, or a missing source
sheet is reported as "needs batch linkage" - a batch is never created and a
wrong batch is never linked silently.

### Whether applications were created

Yes. The linkage action creates one minimal application per unlinked legacy
student:

- `student_id`, `program_id` (PSW), `batch_id` (matched batch or null)
- `status` = `archived` (safest existing status - see below)
- `is_legacy` = true, `record_source` = `legacy_import`
- `created_by` = current admin

No new application status was added. No fees, checklists, contracts, receipts,
documents, quotes, batches, or programs are created. Existing applications are
never edited - a student that already has any application is skipped as already
linked, so re-running the action is safe and idempotent.

### Status used

`archived`. It is an existing allowed application status, so no migration to the
status constraint was needed, and it signals an inactive/historical record. The
status is never shown for legacy students in the hub (the workflow status pill is
hidden), and the new `applications.is_legacy` flag keeps these rows out of the
active work queues regardless of status.

### Batch mapping behavior

Source sheets map to existing PSW batches only:

- 17th March, 12th May, 2nd July, 18th August, 6th Oct, Dec 1st, Jan 12th,
  March 2, April 27, June 01.

Mapping is by normalized `batch_name` / `batch_code` against the source sheet.
Missing or ambiguous mappings are surfaced as "needs batch linkage" in the
linkage table and in the per-row run results. No batch is created.

### Migration

`supabase/migrations/20260614_academic_05_legacy_application_linkage.sql`
(additive, applied manually like the other migrations in this project):

- `students.source_sheet_name text` - records which source sheet a legacy
  student came from, so the batch can be resolved.
- `applications.is_legacy boolean not null default false` - marks a legacy
  linkage application so the active work queues can exclude it.
- `applications.record_source text` with a check constraint allowing null,
  `manual`, `legacy_import`, `system`.
- `applications_is_legacy_idx` index.

### Import metadata going forward

`confirmLegacyImport` (ACADEMIC-04) now also stores `source_sheet_name` on each
created student. This is additive and does not change which rows are importable.
It means future imports carry the source sheet so the linkage action can map the
batch automatically.

### Student hub behavior

- The Program and Batch section now shows the linked PSW program and (when
  mapped) the batch for legacy students.
- The Legacy Student badge and "imported historical record" notice are
  unchanged and still shown.
- Active workflow sections are hidden for legacy students so the record does not
  imply active enrolment: workflow status pill, Sales Intake, viewer
  intake/application, Sales Intake Checklist, Workflow Review, Admin Program and
  Batch Assignment, batch transfer controls, Official Checklist, Fees and
  Payment Schedule, Contract Readiness, and Contract Word Export. This is done
  with a single `showWorkflow = !!latestApp && !isLegacyStudent` guard - no hub
  section was redesigned. Student Information, Documents, the read-only Receipts
  summary, and the admin-only Archive/Notes/Audit sections are unchanged.

### Active work queue behavior

The intake, checklists, contracts, and fees list queries now filter
`is_legacy = false`, so legacy linkage applications never appear in the active
workflow queues. Existing non-legacy applications default to `is_legacy = false`,
so behavior for current data is unchanged.

### Role / access behavior

- Admin/super_admin: can open the linkage page, view linkage status, and run the
  linkage action.
- Sales and viewer: blocked from the linkage page (access notice, including by
  direct URL) and from the action - `linkLegacyStudents` and
  `getLegacyLinkageOverview` independently re-check admin/super_admin, so a
  direct POST is rejected.

### Files created

- `supabase/migrations/20260614_academic_05_legacy_application_linkage.sql`
- `src/lib/legacy-import/batch-mapping.ts`
- `src/features/academic/legacy-linkage-actions.ts`
- `src/features/academic/legacy-linkage-panel.tsx`
- `src/app/dashboard/admin-tools/academic-records/legacy-linkage/page.tsx`

### Files modified

- `src/features/academic/legacy-import-confirm-actions.ts` - store
  `source_sheet_name` on import.
- `src/app/dashboard/admin-tools/academic-records/page.tsx` - add the Legacy
  Student Linkage tool card.
- `src/app/dashboard/students/[studentId]/page.tsx` - show program/batch for
  legacy students, hide active workflow sections via `showWorkflow`.
- `src/features/intake/actions.ts`, `src/features/checklists/actions.ts`,
  `src/features/contracts/actions.ts`, `src/features/fees/actions.ts` - exclude
  legacy applications from the active work queues.

### Limitations

- Students imported before this ticket have no `source_sheet_name`, so they are
  linked to the PSW program but reported as "needs batch linkage" - their batch
  cannot be inferred. The import already blocks duplicate student numbers, so
  re-importing will not backfill the source sheet; those rows need manual batch
  assignment or a future backfill. Students imported after this change carry the
  source sheet and map automatically.
- Batch mapping only matches batches that already exist; missing batches are
  reported, never created.
- ELCE import, 900 Series import, transcript generation, Moodle grade matching,
  and the academic records data model remain out of scope and untouched.
- Receipts, contracts, payment schedule logic, and the active enrolment workflow
  are unchanged.

### Checks

- `npm run lint` passes.
- `npm run build` passes.