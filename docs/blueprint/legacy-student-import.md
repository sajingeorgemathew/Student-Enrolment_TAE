# Legacy Student Import Blueprint

Ticket: ACADEMIC-01 - Legacy Student Import Blueprint
Status: Blueprint and documentation only. No code, schema, or data changes.

## Purpose

Design how the historical PSW masterclass Excel file is imported into the system
as legacy/historical student records, linked to program and batch where possible,
without forcing those students through the current sales intake, contract,
checklist, fee, or document workflow.

These records are needed so that future Moodle grade exports and the transcript
generator have a student to attach academic records to.

## 1. Excel Source Summary

- Workbook (ticket reference path):
  `_reference/source-files/academic/legacy-students/PSW MASTERCLASS LIST- 2025 - 26.xlsx`
- Actual current location in repo:
  `_reference/source-files/PSW MASTERCLASS LIST- 2025 - 26.xlsx`
  (The `academic/legacy-students/` subfolder exists but is empty. The importer
  should treat the file location as configurable, or the file should be moved
  into the documented subfolder before any real import ticket.)
- A second related file is also present and out of scope for this ticket:
  `_reference/source-files/New Master Class List - 2025 - 26 (PSW).xlsx`.
  Do not assume the two are identical. Confirm which is authoritative before
  ACADEMIC-03.

Workbook contains 11 sheets. 10 are PSW morning batches. 1 is ELCE
(a different program).

### Sheet list

| Sheet name   | Title row text                                      | Type         | Approx student rows |
|--------------|-----------------------------------------------------|--------------|---------------------|
| 17th March   | PSW Morning Batch - 17th March 2025                  | PSW batch    | ~25                 |
| 12th May     | PSW Morning Batch - 12th May 2025                    | PSW batch    | ~25                 |
| 2nd July     | PSW Morning Batch - 2nd July 2025                    | PSW batch    | ~28                 |
| 18th August  | PSW Morning Batch - 18th August 2025                | PSW batch    | ~39                 |
| 6th Oct      | PSW Morning Batch - 06th October 2025               | PSW batch    | ~31                 |
| Dec 1st      | PSW Morning Batch - 01st Dec 2025                    | PSW batch    | ~36                 |
| Jan 12th     | PSW Morning Batch - January 12, 2026                | PSW batch    | ~43                 |
| March 2      | PSW Morning Batch - March 2, 2026                   | PSW batch    | ~26                 |
| April 27     | PSW Morning Batch - April 27, 2026                  | PSW batch    | ~41                 |
| June 01      | PSW Morning Batch - June 1, 2026                     | PSW batch    | ~3 (mostly empty)   |
| ELCE         | Early Learning and Childhood Education (ELCE) Batch - 2025 & 26 | ELCE batch | ~26          |

Row counts are valid student rows (rows with a student ID or a name), excluding
the legend block and blank spacer rows described below.

### Sheets to include or exclude initially

- Include all 10 PSW sheets for the first import.
- June 01 is a future/forming batch and is largely empty (3 rows, no IDs). Allow
  it in the preview but expect most rows to be skipped as empty. Do not block on it.
- ELCE is a different program. Recommend excluding ELCE from the first PSW import
  pass and handling it in a dedicated follow-up once an ELCE program record exists.
  See open questions.

### Non-student rows that must be skipped by the parser

Every PSW sheet ends with a 3-row legend block placed in the First Name column
with no student ID:

- Withdrawal
- Enrollment Pending
- Other Reason

These are a color/status key, not students. The parser must not import them.
Sheets also contain fully blank spacer rows (for example trailing blanks on
Jan 12th). The parser must skip any row that has neither a student ID nor a
plausible name.

## 2. Batch Mapping

Each sheet maps to one batch record under the PSW program (and ELCE under its own
program). The system already seeds the PSW program (`program_code = 'PSW'`) in the
core schema. Batch records are created through `dashboard/batches` and may or may
not already exist for these dates.

Do not create batch records in this ticket.

Mapping strategy:

- Parse the date from the sheet title row (row 1), not just the tab name. The tab
  names are short and inconsistent (`6th Oct`, `Dec 1st`, `March 2`) while the
  title row carries a fuller date (`PSW Morning Batch - 06th October 2025`).
- Match to an existing batch by `program_id = PSW` plus a normalized
  `start_date`. Fall back to fuzzy match on `batch_name`.
- If no batch matches, the import preview should flag the sheet as
  "batch not found" and let the admin either pick an existing batch or defer.
  The importer should not silently create batches.

| Sheet       | Expected batch start date | Program | Likely exists already |
|-------------|---------------------------|---------|-----------------------|
| 17th March  | 2025-03-17                | PSW     | Unknown - verify      |
| 12th May    | 2025-05-12                | PSW     | Unknown - verify      |
| 2nd July    | 2025-07-02                | PSW     | Unknown - verify      |
| 18th August | 2025-08-18                | PSW     | Unknown - verify      |
| 6th Oct     | 2025-10-06                | PSW     | Unknown - verify      |
| Dec 1st     | 2025-12-01                | PSW     | Unknown - verify      |
| Jan 12th    | 2026-01-12                | PSW     | Unknown - verify      |
| March 2     | 2026-03-02                | PSW     | Unknown - verify      |
| April 27    | 2026-04-27                | PSW     | Unknown - verify      |
| June 01     | 2026-06-01                | PSW     | Likely forming        |
| ELCE        | 2025-2026 (range)         | ELCE    | Program likely missing |

## 3. Column Mapping

Headers are not in a fixed row across sheets:

- PSW sheets: title in row 1, headers in row 2, data from row 3.
- ELCE sheet: title in row 1, blank row 2, headers in row 3, data from row 4.

The parser must detect the header row per sheet (find the row containing
`Student ID` and `First Name`) rather than assuming row 2.

### Common PSW columns and recommended mapping

| Excel column        | System target field                  | Notes |
|---------------------|--------------------------------------|-------|
| Sr. No.             | (ignore)                             | Row index only. |
| Student ID          | students.student_number              | Primary identity key. |
| Password            | (do not import)                      | LMS/Moodle login password. Present only on 17th March. Sensitive. Never store in students. |
| First Name          | students.legal_first_name            | Often holds compound given names (for example "Uzuazorkaro Fidelis"). |
| Middle Name         | students.legal_middle_name           | Absent on the 17th March sheet. |
| Last Name           | students.legal_last_name             | Sometimes blank. |
| YYYY/MM/DD          | students.date_of_birth               | Stored as Excel dates; parse to ISO date. |
| WP / Status         | students.immigration_status          | Free text, very inconsistent (see normalization note). |
| Contact No.         | students.phone                       | Mixed formats: raw digits and dashed. |
| Email               | students.email                       | |
| Address             | students.mailing_address_line_1 (raw) | Single free-text line. See address note. |
| Transcripts         | academic/certificate status (later)  | Y/N. Not a students column. ACADEMIC-06+. |
| College Cert        | certificate status (later)           | Y/N. ACADEMIC-06+. |
| NACC                | NACC exam status (later)             | Y/N. ACADEMIC-06+. |
| VENUE               | placement venue (later)              | Under PLACEMENT header. Placement module. |
| START DATE          | placement start (later)              | Placement module. |
| FINISH DATE         | placement finish (later)             | Placement module. |
| STATUS              | placement status (later)             | Placement module. |
| Doc Status          | document status (later)              | Present on some sheets. Out of scope. |

### ELCE-specific columns

ELCE adds `GRADUATED`, `WKND & WKD`, `START DATE`, `END DATE` and reorders the
rest. Address, email, contact, DOB, names, and student ID still map the same way.
GRADUATED and the schedule columns are academic/placement data for later tickets.

### Inconsistencies the parser must tolerate

- Header row position differs (row 2 vs row 3 for ELCE).
- 17th March uses `WP` and adds `Password`; it has no `Middle Name` column.
- June 01 uses lowercase `Last name` and has an extra blank spacer column that
  shifts DOB and later columns one position to the right.
- Several sheets insert a blank spacer column before `VENUE`.
- Dec 1st has a second PLACEMENT block (a second `Doc Status` plus a duplicate
  Transcripts/College Cert/NACC/VENUE/START DATE/FINISH DATE/STATUS set) for a
  second practicum. Map only by header name, not by absolute column letter.
- April 27 and June 01 report very wide used ranges (columns out to HN/HT) from
  stray formatting. Bound parsing to the detected header columns only.
- `immigration_status` free-text values are highly inconsistent, for example:
  Work Permit, Work permit, WP, Open WP, Open Work Permit, Open work Permit,
  PGWP, Applied PGWP, Study Permit, Student Permit, SP, Refugee, Refugee WP,
  Citizen, citizen, PR, Visitor, visitor visa, Spouse WP. Store the raw value and
  optionally add a normalized lookup later. Do not enforce an enum at import.

### Address handling

Addresses are a single free-text line with inconsistent separators, for example:
`89 Whitehorn Cres, North York, ON, M2J 3B1` versus
`15 Ray St North , Hamilton , Ontario L8R2X5`. Recommendation: store the raw
string in `mailing_address_line_1` for the first import and do best-effort parsing
of city, province, and postal code only if confidence is high. Do not block import
on address parsing. The `students` table already has discrete address fields if a
later cleanup pass is wanted.

## 4. Legacy Student Strategy

- Create one `students` row per valid sheet row.
- Mark the record as a legacy/historical import. The current `students` table has
  no source or legacy flag column, so ACADEMIC-02 should add one. Recommended:
  - `students.source text` with value `legacy_import` (default `app` or null for
    normal records), and/or
  - `students.is_legacy boolean default false`.
  Choose one as the canonical flag; the other is optional. Decide in ACADEMIC-02.
- Show a "Legacy Student" badge in the student list and in the student hub, driven
  by that flag.
- Do not run legacy students through sales intake, contract, checklist, fee, or
  document workflows. The hub should show those sections as not applicable for
  legacy records.
- Preserve the original Student ID as `student_number` so transcripts and Moodle
  matching can use it where present.

## 5. Application Strategy

The student hub and student list derive program, batch, and status from the
`applications` table, not from `students` (see
`src/app/dashboard/students/[studentId]/page.tsx` and
`src/features/students/actions.ts`). `program_id` and `batch_id` live on
`applications`. The hub already tolerates a missing application (it uses optional
chaining on `latestApp`), but a legacy student with no application would show no
program and no batch, which conflicts with the product goal of linking legacy
students to batch/program.

Recommendation:

- Create one minimal `application` row per legacy student to carry `program_id`
  and `batch_id` and to give the hub something to render.
- The application status check constraint currently allows only:
  `new_intake, admin_review, information_needed, ready_for_contract,
  contract_generated, signature_pending, signed, archived`. There is no
  `legacy_record` status today.
  - Preferred: ACADEMIC-02 adds a dedicated flag (for example
    `applications.is_legacy boolean` or `applications.record_type = 'legacy'`)
    rather than overloading status, and keeps status at a safe existing value
    (for example `archived` or `signed`) purely to satisfy the constraint.
  - Do not add a new status value in this blueprint. Decide in ACADEMIC-02.
- The minimal application should not trigger checklist, fee, quote, or contract
  creation. Those tables are all optional children of `applications` and should be
  left empty for legacy records.

## 6. Duplicate Detection

Matching order during preview, highest confidence first:

1. `student_number` exact match against existing `students.student_number`.
2. `email` exact match (case-insensitive, trimmed).
3. Normalized name plus batch match (normalize: lowercase, collapse spaces,
   strip punctuation, combine first plus middle plus last).

Rules:

- An exact `student_number` or `email` match marks the row as "existing" and is
  skipped or offered as an update, never duplicated.
- A name-plus-batch match is shown as a "possible duplicate" for manual review.
- Do not auto-merge uncertain matches.
- Detect in-file duplicates too. Within the workbook, student IDs `12593`
  (18th August and April 27) and `125213` (Jan 12th and April 27) appear in two
  sheets. These are likely re-enrolments or batch transfers. The importer should
  flag cross-sheet duplicate IDs and let the admin decide whether to create a
  second application (batch transfer) for one student or treat them separately.
- Rows missing a student ID (real students, not the legend rows) should be
  importable but flagged "no student number" so the admin can confirm identity
  before creating the record.

## 7. Import Workflow (future, ACADEMIC-03 and ACADEMIC-04)

1. Admin or super_admin uploads the Excel file.
2. System detects sheets and per-sheet header rows.
3. Admin selects which sheets/batches to include.
4. System parses rows, skipping legend and blank rows.
5. System resolves each sheet to a batch (existing match or admin selection).
6. System runs duplicate detection and shows each row as one of:
   new, existing, possible duplicate, cross-sheet duplicate, or unmatched batch.
7. Admin reviews the preview and resolves flags.
8. Admin confirms.
9. System creates legacy `students` rows and minimal `applications` rows inside a
   transaction.
10. System logs an import summary (counts of created, skipped, flagged) and ideally
    records provenance (source file name, sheet, original row number) for audit.

Role rules: admin and super_admin only. Sales and viewer have no legacy import
access. This matches `src/lib/roles.ts` (`canManageRecords` is admin or
super_admin).

## 8. Future Gradebook / Moodle Matching (ACADEMIC-05)

Moodle exports may contain only names and grades, not student numbers. Therefore
legacy student records must exist first so grades can be matched.

1. Legacy students are imported (this track).
2. Admin uploads a Moodle/module grade export for a specific batch.
3. System matches export rows to legacy students by batch plus normalized name,
   then by student number when present.
4. Admin reviews unmatched names and resolves them manually.
5. System saves academic records (grades) against the matched student.
6. Transcript generator (ACADEMIC-07) reads student plus academic records.

This is why batch linkage and consistent name normalization at import time matter:
they are the join key for grade matching later.

## 9. Student Hub Behavior for Legacy Records

- The hub opens normally for legacy students.
- Program and batch render from the minimal application.
- A "Legacy Student" badge appears in the hub header and in the student list.
- Workflow sections (sales intake, sales checklist, official checklist, fees,
  contract, document review) show as not applicable / hidden for legacy records
  rather than prompting staff to complete them.
- Receipts and finance are not touched by this track.
- Academic records and transcript sections (later tickets) are where legacy
  records become useful.

## 10. Risks and Open Questions

- Inconsistent and compound names; first/middle split is unreliable. Keep
  normalization rules conservative and store names as given.
- Missing student IDs for some real students; identity must be confirmed manually.
- Cross-sheet duplicate IDs (re-enrolment vs transfer) need an explicit admin
  decision path.
- Batch names and dates in tab names do not match cleanly; rely on the title row
  date and admin confirmation.
- Excel date and phone formats vary; parse defensively.
- Addresses are single-line and inconsistent; full structured parsing is risky.
- Sensitive data: the 17th March sheet contains LMS passwords. These must never be
  imported or logged.
- ELCE is a different program and may have no program record yet. Decide whether it
  shares the import path or gets a dedicated pass.
- Two candidate source workbooks exist; confirm the authoritative one.
- Product decision: should legacy students appear in the default student list, or
  behind a "Legacy" filter or toggle, to avoid cluttering the active enrolment
  list? Recommended: behind a filter, with the badge visible when shown.
- Should a minimal application always be created, or only when a batch is resolved?
  Recommended: create it only when a batch is resolved; otherwise import the
  student without an application and flag for later linkage.

## 11. Next Ticket Order

1. ACADEMIC-02 - Legacy Student Import Model and Flags
   (add legacy/source flag to students and applications; decide status handling).
2. ACADEMIC-03 - Legacy Student Excel Import Preview
   (upload, sheet/header detection, batch resolution, duplicate detection, preview).
3. ACADEMIC-04 - Import Confirm and Create Student Records
   (transactional create of students plus minimal applications, import summary log).
4. ACADEMIC-05 - Moodle Grade Export Matching Blueprint.
5. ACADEMIC-06 - Transcript Records Data Model.
6. ACADEMIC-07 - Transcript Generator.
7. ACADEMIC-08 - Student Hub Academic Records Summary.

## Appendix: Current System References Inspected

- Schema: `supabase/migrations/20260518_db_01_core_schema.sql`
  (students, applications, programs, batches, admission_checklists, quotes,
  fee_schedules, contracts, plus RLS). PSW program is seeded.
- Later migrations add `students.archived_at` / `archive_reason`
  (`20260524_security_02_archive_delete_rules.sql`) and workflow status changes.
- Roles: `src/lib/roles.ts` (super_admin, admin, sales, viewer; admin or
  super_admin manage records).
- Student list: `src/app/dashboard/students/page.tsx`.
- Student hub: `src/app/dashboard/students/[studentId]/page.tsx`
  (program/batch/status driven by the latest application).
- Students data access: `src/features/students/actions.ts`.
- Academic records admin area: `src/app/dashboard/admin-tools/academic-records/page.tsx`
  (currently a placeholder; the natural home for legacy import and transcript tools).
