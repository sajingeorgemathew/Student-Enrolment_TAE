# ACADEMIC-01 - Legacy Student Import Blueprint

## Goal

Design how the PSW masterclass Excel file will be imported into the system as historical/legacy student records without breaking the current enrolment workflow.

This is a blueprint and documentation ticket only.

Do not implement import code yet.

## Current Context

The app already has:

- student hub
- application/enrolment workflow
- program and batch records
- contract generation
- receipts and finance module
- admin tools shell

The transcript system will depend on past student records. Many past students are not currently in the system.

The uploaded/master Excel file is the historical student master list. It should be used to design the legacy import workflow.

## Reference File

Use this file if present:

`_reference/source-files/academic/legacy-students/PSW MASTERCLASS LIST- 2025 - 26.xlsx`

This file is for analysis and blueprint only.

Do not import it yet.

## Product Direction

Past students should be imported as student records linked to program and batch where possible.

They should not be forced through the current sales intake/contract workflow.

They should be marked clearly as historical/legacy records.

Possible label:

- `Legacy Student`
- `Historical Record`

The student hub should still open for them, but some enrolment workflow sections may show as not applicable.

## Why This Is Needed

Transcript generation later needs:

- student name
- student number
- batch
- program
- possibly email
- possibly address
- academic records/grades from Moodle export later

Moodle grade exports may only contain names and grades, not student numbers. Therefore, the system needs legacy student records first so future grade exports can match by:

- batch
- normalized student name
- student number if available

## Scope

Create blueprint only.

Analyze and document:

- Excel workbook structure
- sheet names and batch mapping
- column mapping
- required fields
- optional fields
- duplicate detection
- legacy student flag strategy
- relationship to students table
- relationship to applications table if needed
- relationship to programs/batches
- import preview workflow
- import confirmation workflow
- future Moodle grade matching workflow
- student hub behavior for legacy records

## Things To Inspect

Inspect current app/database patterns:

- student table/model
- applications table/model
- programs table/model
- batches table/model
- student hub page behavior
- import-related patterns if any
- role helpers
- admin tools academic records area if present

Inspect the Excel workbook:

- sheet names
- headers
- batch-specific structure
- common columns
- inconsistent columns
- blank rows
- duplicate student numbers
- duplicate names
- missing student numbers
- email/address/contact columns
- transcript/certificate/placement status columns

## Suggested Blueprint Deliverable

Create:

`docs/blueprint/legacy-student-import.md`

## Blueprint Must Include

### 1. Excel Source Summary

Document:

- workbook name
- sheet list
- which sheets are actual PSW batches
- which sheets are special/non-PSW, such as ELCE
- which sheets should be included/excluded initially

### 2. Batch Mapping

Map each sheet to the expected batch record.

Examples:

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
- ELCE

Do not create batch records yet.

Document whether existing batch records likely already exist.

### 3. Column Mapping

Recommend how Excel columns map to system fields.

Likely mappings:

- Student ID -> student_number
- First Name -> first_name
- Middle Name -> middle_name
- Last Name -> last_name
- Email -> email
- Contact number -> phone
- Date of birth -> date_of_birth
- Address -> mailing_address
- Status/permit type -> immigration/status note if applicable
- Transcript / College Cert / NACC status -> academic/certificate status later
- Placement columns -> placement module later

### 4. Legacy Student Strategy

Recommend:

- create student record
- mark source as `legacy_import`
- mark student/app as historical/legacy
- avoid forcing current intake workflow
- show badge in student list and hub

### 5. Application Strategy

Decide whether imported legacy students should create an application row.

Recommended consideration:

- If the current student hub depends on applications, create a minimal application record.
- Status could be `legacy_record` only if schema supports it.
- If schema does not support new status, use existing safe status plus a separate legacy flag.
- Do not add status yet in this blueprint unless needed.

### 6. Duplicate Detection

Document matching rules:

- student_number exact match first
- email exact match second
- name plus batch match third
- flag duplicates for review
- do not auto-merge uncertain matches

### 7. Import Workflow

Future import should be:

1. Admin uploads Excel file.
2. System parses sheets.
3. Admin chooses included sheets/batches.
4. System previews rows.
5. System shows matched/existing/new/duplicate/unmatched.
6. Admin confirms.
7. System creates legacy student records.
8. System logs import summary.

### 8. Future Gradebook/Moodle Matching

Document later workflow:

1. Legacy students are imported first.
2. Admin uploads Moodle/module grade export for a batch.
3. System matches by batch and normalized name.
4. Admin reviews unmatched names.
5. System saves academic records.
6. Transcript generator uses student + academic records.

### 9. Risks and Open Questions

Include:

- inconsistent names
- missing student IDs
- duplicate names
- batch names not matching exactly
- date format issues
- address formatting issues
- whether ELCE should be in same import path
- whether past students should appear in normal student list by default or behind filter

### 10. Next Ticket Order

Recommended:

1. ACADEMIC-02 - Legacy Student Import Model and Flags
2. ACADEMIC-03 - Legacy Student Excel Import Preview
3. ACADEMIC-04 - Import Confirm and Create Student Records
4. ACADEMIC-05 - Moodle Grade Export Matching Blueprint
5. ACADEMIC-06 - Transcript Records Data Model
6. ACADEMIC-07 - Transcript Generator
7. ACADEMIC-08 - Student Hub Academic Records Summary

## Role Rules

Admin/super_admin:

- can import legacy students later
- can review import preview
- can confirm import

Sales:

- no legacy import access

Viewer:

- no legacy import access

## Not Included

Do not implement:

- database migrations
- schema changes
- Excel import UI
- import parser
- student creation code
- transcript generator
- Moodle grade import
- placement module
- certificate module
- receipt changes
- contract changes
- student hub UI changes

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis.

## Acceptance Criteria

- Excel workbook structure is documented
- sheet-to-batch strategy is documented
- column mapping is documented
- legacy student strategy is documented
- duplicate detection strategy is documented
- import preview workflow is documented
- future Moodle grade matching workflow is documented
- next ticket order is documented
- no app code is changed
- no database changes are made

## Final Notes (Completed)

### Files created

- `docs/blueprint/legacy-student-import.md`

### Files modified

- `docs/tickets/ACADEMIC-01-legacy-student-import-blueprint.md` (this notes section)

No app code, schema, or data changed.

### Workbook summary

Workbook analyzed: `_reference/source-files/PSW MASTERCLASS LIST- 2025 - 26.xlsx`.
Note: the ticket reference path `_reference/source-files/academic/legacy-students/`
exists but is empty; the file currently lives one level up. A second related file
`New Master Class List - 2025 - 26 (PSW).xlsx` is also present and out of scope;
the authoritative source must be confirmed before ACADEMIC-03.

11 sheets total: 10 PSW morning batches plus 1 ELCE batch (different program).

| Sheet       | Type      | Approx students |
|-------------|-----------|-----------------|
| 17th March  | PSW batch | ~25             |
| 12th May    | PSW batch | ~25             |
| 2nd July    | PSW batch | ~28             |
| 18th August | PSW batch | ~39             |
| 6th Oct     | PSW batch | ~31             |
| Dec 1st     | PSW batch | ~36             |
| Jan 12th    | PSW batch | ~43             |
| March 2     | PSW batch | ~26             |
| April 27    | PSW batch | ~41             |
| June 01     | PSW batch | ~3 (forming)    |
| ELCE        | ELCE      | ~26             |

Key findings:

- Header row is row 2 on PSW sheets, row 3 on ELCE. Parser must detect it.
- Each PSW sheet ends with a 3-row legend block (Withdrawal, Enrollment Pending,
  Other Reason) plus blank spacer rows. These must be skipped.
- Column order is inconsistent: 17th March uses WP and a Password column and has
  no Middle Name; June 01 uses lowercase "Last name" with an extra spacer column;
  several sheets add a blank column before VENUE; Dec 1st has a second placement
  block. Map by header name, not column letter.
- April 27 and June 01 report very wide used ranges (out to HN/HT) from stray
  formatting; bound parsing to detected headers.
- The 17th March sheet contains LMS passwords. Never import or log them.
- Cross-sheet duplicate student IDs: 12593 (18th August, April 27) and 125213
  (Jan 12th, April 27), likely re-enrolment or batch transfer.
- immigration_status values are free text and highly inconsistent (Work Permit,
  WP, Open WP, Open Work Permit, PGWP, Applied PGWP, Study Permit, SP, Refugee,
  Citizen, PR, Visitor, etc.). Store raw; do not enforce an enum at import.
- Addresses are single free-text lines with inconsistent separators.

### Recommended strategy

- Create one legacy `students` row per valid sheet row, preserving Student ID as
  `student_number`.
- Add a legacy/source flag in ACADEMIC-02 (for example `students.source =
  'legacy_import'` and/or `students.is_legacy`). No status/flag added in this
  ticket.
- Create one minimal `applications` row per legacy student to hold program_id and
  batch_id (the hub derives program/batch/status from applications). Keep status
  at a safe existing value (no `legacy_record` status exists today) and prefer a
  dedicated legacy flag over overloading status. Create the application only when a
  batch is resolved.
- Do not run legacy students through intake, contract, checklist, fee, or document
  workflows. Show a "Legacy Student" badge and mark those hub sections not
  applicable.
- Resolve sheet-to-batch by PSW program plus normalized start date from the title
  row, with admin confirmation. Do not auto-create batches.

### Duplicate / matching strategy

Match order: (1) student_number exact, (2) email exact, (3) normalized name plus
batch. Exact ID/email matches are treated as existing and never duplicated.
Name-plus-batch and cross-sheet ID collisions are flagged for manual review. No
auto-merge.

### Future Moodle / transcript connection

Legacy students are imported first so Moodle grade exports (names and grades only,
often no student number) can be matched by batch plus normalized name, then by
student number when present. Transcript generator later reads student plus academic
records. This makes batch linkage and consistent name normalization at import time
the join key for grade matching.

### Next ticket order

1. ACADEMIC-02 - Legacy Student Import Model and Flags
2. ACADEMIC-03 - Legacy Student Excel Import Preview
3. ACADEMIC-04 - Import Confirm and Create Student Records
4. ACADEMIC-05 - Moodle Grade Export Matching Blueprint
5. ACADEMIC-06 - Transcript Records Data Model
6. ACADEMIC-07 - Transcript Generator
7. ACADEMIC-08 - Student Hub Academic Records Summary

### Lint / build result

Not run. Documentation-only change; no code touched.