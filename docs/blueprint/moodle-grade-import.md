# Moodle Grade Export Matching Blueprint

Source ticket: `docs/tickets/ACADEMIC-06-moodle-grade-export-matching-blueprint.md`

This is a planning document only. This ticket does not create migrations, does
not build upload UI, does not add server actions, does not save grades, and
does not generate transcripts. Everything below is a recommendation for future
implementation tickets.

Reference note: the main domain reference is
`_reference/source-files/academic/transcript/TRANSCRIPT_SYSTEM_HANDOFF.pdf`.
This blueprint has been reconciled against that handoff PDF. The handoff
describes a prior standalone single-file tool (`transcript_generator_cloud.html`)
that wrote directly to Supabase; its stated source of truth for behavior is that
tool. This blueprint deliberately diverges from the handoff's import logic in one
respect: the standalone tool auto-created students and blind-upserted grades by
name match (handoff section 4.6), which is exactly the unsafe behavior this
design forbids. The campus manager instead requires a parse, match, review, and
admin-confirm flow with no auto-create and no save before confirmation. The
grading rules, module mapping, and column-matching algorithm below are taken
directly from the handoff. See Open Questions for the items the handoff resolved.

---

## 1. Purpose

The campus manager needs a safe way to bring Moodle gradebook Excel exports
into the academic records workflow so that official PSW transcripts can later
be produced from saved grade records rather than from raw spreadsheets. The
program is the NACC Personal Support Worker (PSW) DE 2022 program: 700 total
hours across 14 fixed modules, printed as a 2-page transcript.

The core problem this blueprint solves is matching: a Moodle export identifies
students by free-text name and email, while the campus manager holds the
official student identity. Names in Moodle frequently differ from the official
master list, so the import cannot blindly trust Moodle identity. The blueprint
defines a parse, match, review, and confirm flow where:

- Moodle is the source of marks.
- The campus manager student record is the source of official identity.
- No grade is saved until an admin confirms the matches.

This document is the design contract for the future ACADEMIC-07 through
ACADEMIC-12 tickets.

---

## 2. Current System Assumptions

These are established by earlier tickets (ACADEMIC-04, ACADEMIC-05A,
ACADEMIC-05B) and the legacy import work, and the design below depends on them:

- Legacy PSW students are imported into `public.students`.
- Legacy source sheet metadata is backfilled.
- Historical PSW batches exist in `public.batches`.
- Legacy students are linked to the PSW program and a historical batch through
  minimal archived legacy applications in `public.applications`.

Because students are now linked to batches through applications, Moodle import
can be batch-scoped. The admin selects a program and a batch first, and the
system only matches Moodle rows against students connected to that batch. This
narrow matching scope is what makes safe matching possible.

Verified schema facts the design relies on (from
`supabase/migrations/20260518_db_01_core_schema.sql`):

- `public.students` has `student_number` (text, unique, nullable),
  `legal_first_name`, `legal_middle_name`, `legal_last_name`, a generated
  `legal_full_name`, and `email`.
- `public.applications` links `student_id`, `program_id`, `batch_id`, plus a
  status.
- `public.programs` and `public.batches` are reference data, with
  `batches.program_id` referencing `programs`.

The roster of candidate students for a given import is therefore: students
joined to applications where `applications.program_id` and
`applications.batch_id` equal the selected program and batch.

---

## 3. Moodle Export Structure

A Moodle gradebook export is an Excel file produced per course (which maps to a
batch). Each row is one student. Expected columns:

- First name
- Last name
- Email address
- ID number (often blank, not reliable)
- Many grade columns, including:
  - module-level total columns (wanted)
  - quiz attempt, assignment, performance demonstration, and test attempt
    sub-item columns (ignored)
  - test bucket totals such as Test A / Test B / Test C totals (ignored)

Important characteristics:

- Moodle may not reliably include student IDs, so matching cannot depend on
  the ID number column. In the handoff system the ID number field was usually
  blank and operators typed IDs in manually; historically around 70 percent of
  rows had no exported ID.
- Moodle module numbering does not match transcript module order (see
  section 4).
- Header text varies. Column matching must be tolerant and case-insensitive.
- Module total headers in the export look like `Module 1-PSW Foundations total
  (Real)`. The `(Real)` suffix marks the real-points module total.

### Student ID format and prefix tolerance

Official student numbers are stored in canonical `PSW#####` form (for example
`PSW125922`). External and Moodle-supplied IDs are unreliable in two ways:

- The Moodle ID number column is usually blank, so it cannot be the primary
  match key.
- When an ID is present (in Moodle or in a transfer roster), it is often the
  bare number `#####` without the `PSW` prefix.

Any lookup by student number must therefore be prefix tolerant: try the value
as-is, try it with `PSW` prepended, and try it with `PSW` stripped. In the
handoff system, a bulk run failed every ID lookup and silently fell back to
name matching because of this mismatch. IDs read from an import should be
normalized to the canonical `PSW#####` form before comparison.

---

## 4. PSW Module Mapping

The transcript module structure is fixed. The import maps Moodle module-level
total columns to these transcript modules using match keys.

| Code | Description | Hours | Moodle match keys |
| --- | --- | ---: | --- |
| PSWF | PSW Foundations | 55 | Module 1, PSW Foundations |
| SFMB | Safety and Mobility | 40 | Module 2, Safety and Mobility |
| BSYS | Body Systems | 40 | Module 3, Body Systems |
| APH | Assisting with Personal Hygiene | 30 | Module 4, Personal Hygiene |
| AN | Abuse and Neglect | 15 | Module 5, Abuse and Neglect |
| HMMPN | Household Management, Nutrition and Hydration | 25 | Module 6, Household Management |
| CPWC | Care Planning / Restorative Care / Electronic Documentation / Working in the Community | 30 | Module 7, Care Planning |
| AFGD | Assisting the Family, Growth and Development | 25 | Module 8, Family, Growth |
| ADP | Assisting the Dying Person | 30 | Module 9, Dying Person |
| CHMBI | Cognitive / Mental Health Issues and Brain Injuries | 40 | Module 11, Cognitive |
| HLTCN | Health Conditions | 40 | Module 12, Health Conditions |
| CPCM | Clinical Placement - Community | 100 | never auto-map |
| CPFC | Clinical Placement - Facility | 200 | never auto-map |
| AWM | Assisting with Medications | 20 | Module 10, Assisting with Medications, Medications |
| GPADC | Gentle Persuasive Approaches in Dementia Care | 10 | never auto-map |

Total hours: 700.

### Transcript order versus Moodle numbering

The transcript display order is not the Moodle module number order. The import
must keep these two concepts separate:

- AWM is Module 10 in Moodle but appears on page 2 of the transcript.
- CHMBI and HLTCN are Modules 11 and 12 in Moodle but appear before clinical
  placement on transcript page 1.

The transcript page split is fixed and matches the school's historical
transcripts:

- Page 1 holds the first 13 codes in transcript order: PSWF, SFMB, BSYS, APH,
  AN, HMMPN, CPWC, AFGD, ADP, CHMBI, HLTCN, CPCM, CPFC.
- Page 2 holds AWM and GPADC, followed by the final mark, grading key, and
  signature block.

The match keys (which include the Moodle module number) are used only to find
the right Moodle column. The `module_code` order used for display is the
transcript order, not the Moodle number. The transcript layout is a future
ticket; it is recorded here only so the saved data model can support it.

Note on description text: on the rendered transcript the clinical placement
descriptions use an en dash (Unicode U+2013), as in `Clinical Placement -
Community` and `Clinical Placement - Facility`, because that matches the
historical transcript exactly. This blueprint uses normal hyphens in its prose,
but the transcript generator should preserve the en dash in those two
descriptions when it renders.

### Manual-only modules

CPCM (Clinical Placement - Community), CPFC (Clinical Placement - Facility),
and GPADC (Gentle Persuasive Approaches in Dementia Care) are never imported
from Moodle. They are manual or transfer workflow fields. In the column preview
they show as manual-only, not as missing.

---

## 5. Column Matching Rules

The import reads Moodle module-level total columns only. It does not recompute
module grades.

### Why Moodle module totals are trusted

Moodle already calculates each module total from its own configured weighting
of quizzes, assignments, performance demonstrations, and test attempts. That
calculation is the authoritative module mark. Re-deriving it in the campus
manager would risk diverging from the official Moodle result and would require
reproducing Moodle's gradebook configuration. The module total is therefore
read as-is.

Trusting the export has a known limit: it is only as correct as the gradebook
was at export time. The handoff records a real incident where an October batch
was misconfigured at export (third attempts not weighted in), so the exported
PSWF total read 74 percent when the authoritative value in Moodle's web
gradebook overview was 90.5 percent. The tool faithfully imported the wrong
number. The rule is that the import trusts the export, the operator must ensure
the gradebook is configured correctly before exporting, and if the export and
Moodle's web overview disagree, the web overview is authoritative and the export
must be redone. A future "compare to Moodle" check is recommended (see
section 12).

### Why quiz attempts and sub-items are not recalculated

Sub-item columns (individual quiz attempts, assignments, performance
demonstrations, test attempts) and intermediate test bucket totals are inputs
to the module total, not the module mark. Recomputing from them would
duplicate Moodle's logic, could double-count, and could produce a number that
disagrees with the official Moodle gradebook. They are ignored for grade
storage.

### Column selection algorithm

For each transcript module that has match keys, find the export column where
the lowercased header:

1. contains `total`, and
2. does not match a Test A, Test B, Test C, or test total sub-bucket column,
   and
3. contains all match keys for that module.

The handoff implements step 2 with the regular expression
`/test\s*(a|b|c)?\s*total/i`: any header matching it is skipped before the match
keys are checked. A module with empty match keys (CPCM, CPFC, GPADC) is never
auto-mapped.

The match keys deliberately combine the Moodle module number (for example
`Module 1`) with a text fragment (for example `PSW Foundations`), and a header
must contain both. This is what prevents `Module 1` from accidentally matching
`Module 10`, `Module 11`, or `Module 12`.

Skip sub-bucket totals such as:

- Module 1-Test A total
- Module 1-Test B total
- Module 1-Test C total

Wanted columns are module-level totals such as:

- Module 1-PSW Foundations total (Real)
- Module 2-Safety and Mobility total (Real)

### Test A / B / C total skip rule

Any column whose header identifies it as a Test A, Test B, or Test C total, or
a test total sub-bucket, is excluded even though it contains the word `total`.
These are within-module test buckets, not the module result. The skip check
runs before the match-key check so a test bucket can never be selected as a
module total.

### Column match outcomes

- Found exactly one column: mapped.
- Found no column: warning, missing (except CPCM/CPFC/GPADC which show as
  manual-only, never missing).
- Found more than one candidate column: warning, ambiguous; admin must confirm
  which column to use before row matching proceeds.

---

## 6. Final Mark, Letter Grade, and Pass/Fail Rules

### Final mark

Final mark is a simple average of the entered module marks. It is not weighted
by hours.

- A blank mark is excluded from the average.
- An explicit 0 is included as 0.
- Final mark displays rounded to the nearest integer.
- Module marks display rounded to the nearest integer.
- The internally stored mark preserves decimals; rounding is for display only.

The handoff verifies this against a real issued transcript: student "Adan Marino
Paz" had module marks that average to 91.33 percent and the issued transcript
shows 91 percent. Hours-weighting the same marks would give 93.7 percent and
display 94 percent, which does not match the issued transcript. The simple
average is the correct and verified rule.

### Letter grades

- A+ = 96 to 100
- A = 90 to 95
- B+ = 85 to 89
- B = 80 to 84
- C = 70 to 79
- F = below 70

### Pass / fail status

- Pass if the mark is 70 or higher.
- Fail if the mark is below 70. An explicit 0 is below 70, so a stored 0 is
  Fail with letter grade F.
- A blank mark has blank status (it is not treated as 0 and not treated as
  fail).

---

## 7. Student Matching Rules

### Scope

Do not match Moodle rows against all students. Only match against students
connected to the selected batch through applications. Legacy students are
included where they are linked to the selected batch.

Matching uses:

- `applications.student_id`, `applications.program_id`, `applications.batch_id`
  (to build the candidate roster)
- `students.student_number`
- `students.legal_full_name`
- `students.email`

Student number comparison must be prefix tolerant per section 3: try the
Moodle-supplied value as-is, with `PSW` added, and with `PSW` stripped, after
normalizing to canonical `PSW#####`. Because the Moodle ID is usually blank,
name matching within the batch roster is the primary path, with student number
and email as supporting signals when present.

### Divergence from the handoff import logic

The standalone handoff tool matched a student within the batch by first plus
last name, inserted a new student when none was found, backfilled student number
and email only when empty, and then upserted grade rows keyed on
(student, module). That flow auto-created students and saved grades without
review, which produced the duplicate and name-drift data quality problems the
handoff itself documents. This blueprint intentionally keeps the read-as-is
grade behavior but replaces the auto-create-and-save behavior with the review
and confirm flow in sections 7 and 8: no student is auto-created and no grade is
saved until an admin confirms.

### Why Moodle names can differ from official names

Moodle display names are entered and edited inside Moodle and are not the
authoritative identity. They can differ from the official master list because
of spelling differences, extra spaces, missing middle names, a middle name
attached to the last name, transfer students, or corrected master list records.
The campus manager student record is the official identity. Matching must
normalize and tolerate these differences and must surface uncertainty for admin
review rather than guessing.

### Match statuses

The preview assigns each row one of these statuses:

- Exact match: clear match on normalized student number, email, or first name
  plus last name within the selected batch.
- Strong match: name differs slightly but appears safe. Examples: spacing
  difference, case difference, middle name present or absent, punctuation
  difference.
- Possible match: similarity is close but the admin must confirm.
- Transfer or corrected student: the Moodle row appears in this export but the
  official record may belong to another batch or was corrected in the master
  list. The admin maps the Moodle row to the official student manually.
- Duplicate risk: more than one student in the selected batch could match. The
  admin must choose.
- Unmatched: no safe match found. The admin may leave it unmatched, manually
  search official students, mark it as not imported, or flag it for review.

Only exact and strong matches may be considered safe defaults. Everything else
requires an explicit admin action before any future save.

---

## 8. Manual Override Workflow

The admin must always be able to map a Moodle row to an official student
record manually, overriding the suggested status.

For each row, the design preserves both the Moodle-supplied data and the
match decision:

- original Moodle first name
- original Moodle last name
- original Moodle email
- original Moodle ID number (if present)
- matched official `student_id`
- matched by (user)
- match method
- match note or reason

Match reasons:

- transfer
- corrected master list
- name spelling difference
- manual confirmation
- duplicate resolved
- other

The original Moodle identity fields are never written back onto the official
student record. They are retained on the import row only, as an audit of what
Moodle contained at import time.

---

## 9. Transfer and Corrected-Name Handling

Transfer students and corrected master list records are the main reason a
Moodle row may not match cleanly within the selected batch. The official record
may live in another batch, or the name may have been corrected after the Moodle
account was created.

For this ticket these are handled through the manual override path in
section 8: the admin maps the Moodle row to the correct official student and
records the reason (transfer or corrected master list).

The full transfer interim transcript workflow is a future workflow only and is
not implemented here. A transfer student completed theory in their original
cohort but did not complete clinical placement, so they receive an interim
transcript showing theory marks with forced clinical values. When built, it
should support:

- roster upload (handoff roster columns: Student ID, Original Batch, First Name,
  Middle Name, Last Name, Session, plus contact info; only ID, name, batch, and
  session are used)
- ID prefix tolerant matching (per section 3), falling back to first plus last
  name, case-insensitive, with duplicate-name warnings
- GPADC = 100 (Pass, A+; the dementia care cert everyone receives)
- CPCM = 0 (Fail, F; community placement not done)
- CPFC = 0 (Fail, F; facility placement not done)
- date issued = date awarded = attended to (override) = cohort start date plus
  exactly 3 months, the same date for everyone in the cohort (the final decision
  was no per-student date randomization)
- incomplete watermark on
- manual print or server PDF later

Cohort scheduling notes from the handoff that this workflow depends on: each
cohort can run a Morning and an Evening session, which are separate batches.
Transfer rosters reference a batch by an informal label (for example "12th May",
"6th Oct", "Dec 1st") plus a Session column, so batch matching must be fuzzy
(strip spaces and punctuation, compare tokens). The handoff lists the real
cohort start dates as 17 Mar 2025, 12 May 2025, 17 Jul 2025, 18 Aug 2025,
6 Oct 2025, 1 Dec 2025, 12 Jan 2026, and 2 Mar 2026.

---

## 10. Proposed Database Tables

Design only. Do not create these tables in this ticket. They should be created
by ACADEMIC-07. Shapes follow the existing snapshot and generation-history
precedents (for example `contract_generations`).

### academic_imports

One uploaded Moodle gradebook import.

- id
- source_type (value `moodle_gradebook`)
- program_id (references programs)
- batch_id (references batches)
- file_name
- file_hash
- uploaded_by
- uploaded_at
- status
- notes

### academic_import_rows

Each Moodle row parsed from the Excel.

- id
- academic_import_id (references academic_imports)
- row_number
- moodle_first_name
- moodle_last_name
- moodle_full_name
- moodle_email
- moodle_id_number
- matched_student_id (references students, nullable)
- match_status
- match_method
- match_confidence
- match_note
- reviewed_by
- reviewed_at

### academic_grades

Saved module marks after admin confirmation.

- id
- student_id (references students)
- program_id (references programs)
- batch_id (references batches)
- academic_import_id (references academic_imports)
- module_code
- module_description
- hours
- mark
- letter_grade (derived or stored)
- pass_fail_status (derived or stored)
- source_type
- source_column_header
- created_by
- created_at
- updated_at

Recommended unique key: (`student_id`, `program_id`, `batch_id`,
`module_code`). This prevents duplicate grade rows for the same module.

### Store versus derive letter grade and status

Recommendation: store `mark` and derive `letter_grade` and `pass_fail_status`
when displaying, so the grade bands live in one place and can be corrected
without a data migration. Store the derived values only if a compliance
requirement needs a frozen transcript snapshot of letter and status at issue
time. If a snapshot is required, store it on the transcript record at
generation time rather than on `academic_grades`, keeping `academic_grades` as
the live source.

---

## 11. Proposed Admin UI Flow

No UI is built in this ticket. The recommended future flow mounts under the
existing academic records module
(`/dashboard/admin-tools/academic-records`).

1. Admin opens Academic Records.
2. Admin selects program.
3. Admin selects batch.
4. Admin uploads the Moodle gradebook Excel file.
5. System parses the file.
6. System identifies module total columns.
7. System reads Moodle student rows.
8. System matches rows against students linked to the selected batch.
9. System shows a preview (column preview, then grade preview).
10. Admin manually confirms or corrects uncertain matches.
11. Only after confirmation does a later implementation save grade records.

No grade saving happens in this ticket or in the preview step.

### Column mapping preview

Shown before row matching. For each module:

- module code
- module description
- matched Moodle column header
- status
- warning if missing
- warning if multiple possible columns
- ignored Test A / B / C total columns (shown so the admin can confirm the
  right total was chosen)

CPCM, CPFC, and GPADC show as manual-only, not missing.

### Grade review preview

A per-student preview. Each row shows:

- Moodle name
- Moodle email
- Moodle ID number
- matched official student
- official student number
- match status
- PSWF, SFMB, BSYS, APH, AN, HMMPN, CPWC, AFGD, ADP, CHMBI, HLTCN, AWM marks
- warnings
- manual match control

CPCM, CPFC, and GPADC are not shown as Moodle-imported columns.

---

## 12. Validation Rules

Parse and matching validation the future implementation should enforce:

- Required Moodle columns present: first name, last name, email. If the file
  shape is unrecognized, reject before matching.
- Module total columns resolved per the section 5 algorithm; ambiguous or
  missing module columns surface as warnings in the column preview.
- Marks parsed as numbers; blank stays blank (never coerced to 0); explicit 0
  stays 0.
- Marks are on a 0 to 100 scale (the module total `(Real)` column); the handoff
  stores marks as `NUMERIC(5,2)` in the 0.00 to 100.00 range, so no rescaling is
  needed before applying the grade bands.
- Out-of-range marks (below 0 or above 100) flagged for review.
- Recommended: a "compare to Moodle" check that lets the admin confirm imported
  module totals match Moodle's web gradebook overview before any save, because
  the export is only as correct as the gradebook configuration at export time
  (see section 5).
- Matching restricted to the selected batch roster only.
- Every row carries a match status; rows that are not exact or strong require
  an explicit admin decision before any save.
- Duplicate-risk rows blocked from auto-confirmation.
- No save proceeds while any row is in an unresolved match state.

Safety rules (must hold across all future implementation):

- Do not overwrite existing official student names from Moodle.
- Do not overwrite student email from Moodle unless a future reviewed workflow
  explicitly allows it.
- Do not save grades until the admin confirms matches.
- Do not auto-create students from Moodle rows.
- Do not create duplicate academic grade records.
- Do not import grades for unmatched rows.
- Do not import CPCM, CPFC, or GPADC from Moodle.
- Do not recompute module grades from attempts.
- Do not treat blank marks as 0.

---

## 13. Transcript Generator Dependency

Transcript generation must depend on saved academic grade records, not on
direct Moodle Excel files. The Excel import is an upstream step that fills
`academic_grades` after admin confirmation; the transcript reads only from
saved records and official student identity.

The future transcript generator should:

- read official student identity from the campus manager
- read saved academic grades
- compute final mark as a simple average
- render the official transcript layout
- support clinical and manual grades (CPCM, CPFC, GPADC)
- support the transfer incomplete transcript later

---

## 14. Future Implementation Ticket Sequence

- ACADEMIC-07 - Academic Records Data Model (create the proposed tables, RLS,
  unique keys)
- ACADEMIC-08 - Moodle Grade Import Preview (upload, parse, column preview,
  match preview; no save)
- ACADEMIC-09 - Moodle Grade Match Confirmation and Save (confirm matches,
  write `academic_grades`)
- ACADEMIC-10 - Manual Clinical and GPADC Grade Entry (CPCM, CPFC, GPADC manual
  entry)
- ACADEMIC-11 - Transcript Generator Blueprint
- ACADEMIC-12 - Transcript Generator

---

## 15. Open Questions

The handoff PDF is now present and this blueprint has been reconciled against
it. The remaining open questions are the ones the handoff does not fully settle
for the campus manager context.

1. Module column header exactness. The handoff confirms headers like
   `Module 1-PSW Foundations total (Real)` and gives the verbatim matching
   algorithm. It does not guarantee headers are identical across every batch and
   Moodle version, so the column preview should still require admin confirmation
   of the resolved column. Resolved on format; open on cross-batch stability.
2. Email reliability for matching. How often is the Moodle email the school
   email versus a personal address that differs from the official student
   record? The handoff treats email as a backfill-only field and matches
   primarily on name, which suggests email should be a supporting signal only.
   Confirm for the campus manager.
3. Multiple imports per batch. If a batch is re-exported and re-imported, how
   are existing `academic_grades` reconciled - replace, version, or block? The
   handoff tool upserted grades keyed on (student, module), that is, replace in
   place, with no versioning. Confirm whether the campus manager wants the same
   upsert behavior or a versioned/blocked behavior given the review layer.
4. Store versus derive letter and status. The handoff stores only the numeric
   mark and derives letter grade and pass/fail at render time. This blueprint
   recommends the same. Confirm only whether a compliance requirement needs a
   frozen transcript snapshot at issue time (store it on the transcript record,
   not on `academic_grades`).
5. Transfer student source. The handoff transfer workflow forces clinical and
   GPADC values (GPADC = 100, CPCM = 0, CPFC = 0) and reuses the student's
   already-saved theory marks rather than re-importing from a Moodle export, with
   dates computed from the cohort start date. Confirm this is the intended
   campus manager behavior and that theory marks are read from saved
   `academic_grades` rather than a fresh export.
