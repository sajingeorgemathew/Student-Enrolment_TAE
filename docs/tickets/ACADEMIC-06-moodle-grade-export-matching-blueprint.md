# ACADEMIC-06 - Moodle Grade Export Matching Blueprint

## Goal

Create a blueprint for importing Moodle gradebook Excel exports into the campus manager academic records workflow.

This is blueprint-only.

Do not create database migrations.
Do not build the Moodle upload UI.
Do not save grades.
Do not generate transcripts.

The goal is to document the correct import, matching, review, and future storage design before implementation.

## Source Documents

Use this handoff document as the main reference:

_reference/source-files/academic/transcript/TRANSCRIPT_SYSTEM_HANDOFF.pdf

Also use these existing project docs if present:

- docs/tickets/ACADEMIC-04-import-confirm-create-students.md
- docs/tickets/ACADEMIC-05A-historical-batches-source-metadata.md
- docs/tickets/ACADEMIC-05B-legacy-application-batch-linkage.md
- docs/blueprint/legacy-student-import.md

## Current System Context

The campus manager now has:

- legacy PSW students imported into public.students
- legacy source sheet metadata backfilled
- historical PSW batches created
- legacy students linked to PSW program and historical batch through minimal archived legacy applications

This means Moodle gradebook import can now be batch-based.

The Moodle import should work by selecting:

- program
- batch
- Moodle gradebook Excel file

Then the system should match Moodle rows against students linked to that selected batch.

## Important Domain Rules

### Moodle gradebook source

Moodle gradebook exports are uploaded per batch.

Moodle may not reliably include student IDs.

The import must expect:

- First name
- Last name
- Email address
- ID number, often blank
- many grade columns
- module-level total columns
- sub-item columns and test bucket totals that should be ignored

### Moodle name differences

Moodle names may differ from the official student record.

This can happen because of:

- spelling differences
- extra spaces
- missing middle names
- middle name attached to last name
- transfer students
- corrected master list records

The official identity source is the campus manager student record.

Moodle is the source for marks only.

The blueprint must include a manual matching review layer.

Do not design a blind auto-save workflow.

## Gradebook Column Mapping Rules

The import must read Moodle module-level total columns only.

Do not recompute module grades from quiz attempts, assignments, performance demonstrations, or test attempts.

Moodle already calculates the correct module totals.

For each module, find the export column where the lowercased header:

1. contains `total`
2. does not match Test A, Test B, Test C, or test total sub-bucket columns
3. contains all match keys for that module

Sub-bucket totals such as these must be skipped:

- Module 1-Test A total
- Module 1-Test B total
- Module 1-Test C total

Wanted columns are module-level totals such as:

- Module 1-PSW Foundations total (Real)
- Module 2-Safety and Mobility total (Real)

## PSW Modules

Use this exact transcript module structure.

| Code | Description | Hours | Moodle match keys |
| --- | --- | ---: | --- |
| PSWF | PSW Foundations | 55 | Module 1, PSW Foundations |
| SFMB | Safety and Mobility | 40 | Module 2, Safety and Mobility |
| BSYS | Body Systems | 40 | Module 3, Body Systems |
| APH | Assisting with Personal Hygiene | 30 | Module 4, Personal Hygiene |
| AN | Abuse and Neglect | 15 | Module 5, Abuse and Neglect |
| HMMPN | Household Management, Nutrition and Hydration | 25 | Module 6, Household Management |
| CPWC | Care Planning/Restorative Care/Electronic Documentation/ Working in the Community | 30 | Module 7, Care Planning |
| AFGD | Assisting the Family, Growth and Development | 25 | Module 8, Family, Growth |
| ADP | Assisting the Dying Person | 30 | Module 9, Dying Person |
| CHMBI | Cognitive/Mental Health Issues and Brain Injuries | 40 | Module 11, Cognitive |
| HLTCN | Health Conditions | 40 | Module 12, Health Conditions |
| CPCM | Clinical Placement - Community | 100 | never auto-map |
| CPFC | Clinical Placement - Facility | 200 | never auto-map |
| AWM | Assisting with Medications | 20 | Module 10, Assisting with Medications, Medications |
| GPADC | Gentle Persuasive Approaches in Dementia Care | 10 | never auto-map |

Total hours: 700.

Important:

- Moodle module numbering does not match transcript order.
- AWM is Module 10 in Moodle but appears on page 2 of the transcript.
- CHMBI and HLTCN are Modules 11 and 12 in Moodle but appear before clinical placement on transcript page 1.
- CPCM, CPFC, and GPADC are not imported from Moodle. They are manual or transfer workflow fields.

## Final Mark Rule

Final mark is a simple average of entered module marks.

Do not weight by hours.

Rules:

- blank mark is excluded from average
- explicit 0 is included as 0
- final mark displays rounded to nearest integer
- module marks display rounded to nearest integer
- internal stored mark should preserve decimals

Letter grades:

- A+ = 96 to 100
- A = 90 to 95
- B+ = 85 to 89
- B = 80 to 84
- C = 70 to 79
- F = below 70

Status:

- Pass if mark is 70 or higher
- Fail if mark is below 70
- blank mark has blank status

## Matching Workflow To Design

The blueprint must define this workflow:

1. Admin opens Academic Records.
2. Admin selects program.
3. Admin selects batch.
4. Admin uploads Moodle gradebook Excel.
5. System parses the file.
6. System identifies module total columns.
7. System reads Moodle student rows.
8. System matches rows against students linked to the selected batch.
9. System shows a preview table.
10. Admin manually confirms or corrects uncertain matches.
11. Only after confirmation should a later implementation save grade records.

No grade saving in this ticket.

## Matching Scope

Do not match Moodle rows against all students.

Only match against students connected to the selected batch through applications.

Use:

- applications.student_id
- applications.program_id
- applications.batch_id
- students.student_number
- students.legal_full_name
- students.email

Include legacy students where relevant.

## Matching Levels

The blueprint must define these match statuses:

### Exact match

Clear match on normalized student number, email, or first name plus last name within selected batch.

### Strong match

Name differs slightly but appears safe.

Examples:

- spacing difference
- case difference
- middle name present or absent
- punctuation difference

### Possible match

Similarity is close but admin must confirm.

### Transfer or corrected student

Moodle row appears in this export but official student record may belong to another batch or was corrected in the master record.

Admin must manually map the Moodle row to the official student.

### Duplicate risk

More than one student in the selected batch could match the Moodle row.

Admin must choose.

### Unmatched

No safe match found.

Admin may:

- leave unmatched
- manually search official students
- mark as not imported
- flag for review

## Manual Override Requirements

The blueprint must include manual override behavior.

Admin should be able to map:

Moodle row -> official student record

The system should preserve:

- original Moodle first name
- original Moodle last name
- original Moodle email
- original Moodle ID number if present
- matched official student_id
- matched by user
- match method
- match note or reason

Reasons should include:

- transfer
- corrected master list
- name spelling difference
- manual confirmation
- duplicate resolved
- other

## Academic Record Storage Recommendation

Design recommended tables, but do not create them in this ticket.

Suggested model:

### academic_imports

Represents one uploaded Moodle gradebook import.

Fields to consider:

- id
- source_type, value `moodle_gradebook`
- program_id
- batch_id
- file_name
- file_hash
- uploaded_by
- uploaded_at
- status
- notes

### academic_import_rows

Represents each Moodle row parsed from the Excel.

Fields to consider:

- id
- academic_import_id
- row_number
- moodle_first_name
- moodle_last_name
- moodle_full_name
- moodle_email
- moodle_id_number
- matched_student_id
- match_status
- match_method
- match_confidence
- match_note
- reviewed_by
- reviewed_at

### academic_grades

Represents saved module marks after admin confirmation.

Fields to consider:

- id
- student_id
- program_id
- batch_id
- academic_import_id
- module_code
- module_description
- hours
- mark
- letter_grade derived or stored
- pass_fail_status derived or stored
- source_type
- source_column_header
- created_by
- created_at
- updated_at

Recommended unique key:

- student_id
- program_id
- batch_id
- module_code

The blueprint should decide whether to store letter/status or derive them.

Recommended: store mark and derive letter/status when displaying, unless compliance requires stored transcript snapshot values.

## Column Review Preview

The blueprint should recommend a column mapping preview before row matching.

It should show:

- module code
- module description
- matched Moodle column header
- status
- warning if missing
- warning if multiple possible columns
- ignored Test A/B/C total columns

CPCM, CPFC, and GPADC should show as manual-only, not missing.

## Grade Review Preview

The blueprint should recommend a student grade preview.

Each row should show:

- Moodle name
- Moodle email
- Moodle ID number
- matched official student
- official student number
- match status
- PSWF mark
- SFMB mark
- BSYS mark
- APH mark
- AN mark
- HMMPN mark
- CPWC mark
- AFGD mark
- ADP mark
- CHMBI mark
- HLTCN mark
- AWM mark
- warnings
- manual match control

Do not include CPCM, CPFC, GPADC as Moodle-imported columns.

## Transfer Workflow Consideration

The handoff includes transfer interim transcript behavior.

This ticket should document it as a future workflow only.

Do not implement transfer transcript workflow now.

Future transfer workflow should support:

- roster upload
- ID prefix tolerant matching
- GPADC = 100
- CPCM = 0
- CPFC = 0
- date issued = date awarded = attended to
- incomplete watermark on
- manual print or server PDF later

## Transcript Generator Dependency

The blueprint must state that transcript generation should depend on saved academic grade records, not direct Moodle Excel files.

Future transcript generator should:

- read official student identity from campus manager
- read saved academic grades
- compute final mark as simple average
- render official transcript layout
- support clinical/manual grades
- support transfer incomplete transcript later

## Safety Rules

Do not overwrite existing official student names from Moodle.

Do not overwrite student email from Moodle unless a future reviewed workflow explicitly allows it.

Do not save grades until admin confirms matches.

Do not auto-create students from Moodle rows in the campus manager.

Do not create duplicate academic grade records.

Do not import grades for unmatched rows.

Do not import CPCM, CPFC, or GPADC from Moodle.

Do not recompute module grades from attempts.

Do not treat blank marks as 0.

## Blueprint Output

Create or update:

docs/blueprint/moodle-grade-import.md

The blueprint must include:

1. Purpose
2. Current system assumptions
3. Moodle export structure
4. PSW module mapping
5. Column matching rules
6. Student matching rules
7. Manual override workflow
8. Transfer and corrected-name handling
9. Proposed database tables
10. Proposed admin UI flow
11. Validation rules
12. Transcript dependency
13. Future implementation ticket sequence
14. Open questions

## Future Ticket Sequence

Recommend the next implementation tickets:

- ACADEMIC-07 - Academic Records Data Model
- ACADEMIC-08 - Moodle Grade Import Preview
- ACADEMIC-09 - Moodle Grade Match Confirmation and Save
- ACADEMIC-10 - Manual Clinical and GPADC Grade Entry
- ACADEMIC-11 - Transcript Generator Blueprint
- ACADEMIC-12 - Transcript Generator

## Not Included

Do not implement:

- database migrations
- grade upload UI
- grade parsing code
- grade saving action
- transcript PDF generation
- transfer transcript tool
- storage bucket changes
- RLS changes
- student import changes
- batch linkage changes

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis.

## Implementation Notes

Blueprint delivered at `docs/blueprint/moodle-grade-import.md`.

- The referenced handoff PDF
  `_reference/source-files/academic/transcript/TRANSCRIPT_SYSTEM_HANDOFF.pdf`
  is now present and the blueprint has been reconciled against it. The
  reconciliation added: the canonical `PSW#####` student ID format and
  prefix-tolerant lookup, the exact transcript page split, the verbatim test
  sub-bucket skip regex and the match-both-number-and-text rationale, the
  garbage-in/garbage-out lesson with Moodle web overview as authoritative, the
  simple-average verification example, the deliberate divergence from the
  handoff's auto-create-and-upsert import logic, and the enriched transfer
  workflow details (cohort start plus 3 months, no randomization, Morning/Evening
  batches, fuzzy label matching). The missing-PDF open question was removed.
- Proposed tables (`academic_imports`, `academic_import_rows`,
  `academic_grades`) are documented as design only. No migrations were created.
- Schema references were verified against
  `supabase/migrations/20260518_db_01_core_schema.sql`
  (`students.student_number`, `students.legal_full_name`, `students.email`;
  `applications.student_id/program_id/batch_id`).
- Blueprint follows the existing `docs/blueprint` style (numbered sections,
  normal hyphens, no em dashes, no emojis).

## Acceptance Criteria

- docs/blueprint/moodle-grade-import.md exists
- blueprint explains Moodle module total mapping
- blueprint explains why attempts/sub-items are not recalculated
- blueprint explains student matching by selected batch
- blueprint includes manual override for Moodle/master-list differences
- blueprint includes transfer/corrected-student handling
- blueprint includes proposed tables
- blueprint includes admin UI flow
- blueprint includes transcript dependency
- blueprint includes future ticket sequence
- no migrations are created
- no app behavior is changed
- npm run lint passes if applicable
- npm run build passes if applicable