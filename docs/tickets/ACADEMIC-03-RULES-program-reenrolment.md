# ACADEMIC-03-RULES - Legacy Import Program and Re-enrolment Rules

## Goal

Update the legacy student import preview rules before import confirmation.

This ticket applies confirmed business rules for:

- PSW monthly batch import
- 900 Series re-enrolment rows
- ELCE program separation
- program-specific student number normalization

This is still preview-only.

Do not import, create, update, or delete student records.

## Current Context

ACADEMIC-03 created the legacy student Excel import preview.

ACADEMIC-03-FIX improved warning and reason clarity.

The preview identified special cases:

- 900 Series rows are re-enrolled/reappearing students
- ELCE rows belong to a different program and should not be mixed with PSW
- ELCE student numbers should not be normalized with PSW prefix
- PSW monthly batch sheets are the priority for import

## Confirmed Product Rules

### PSW monthly sheets

PSW monthly batch sheets are the main import target.

Include PSW sheets such as:

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

Normalize PSW student IDs as:

- `125315` -> `PSW125315`
- `PSW125315` -> `PSW125315`
- `PSW 125315` -> `PSW125315`

### 900 Series

900 Series rows represent re-enrolled/reappearing students.

They should not be imported as new legacy students.

Import behavior:

- skip by default
- mark as not importable
- keep the original student/batch record
- show reason clearly

Human-readable reason:

`900 Series re-enrolment row - original batch record should be kept`

Suggested status:

- `skipped_reenrolment_duplicate`

### ELCE

ELCE is a separate program.

ELCE should not be mixed into PSW monthly batches.

ELCE student numbers should normalize as:

- `12101` -> `ELCE12101`
- `ELCE12101` -> `ELCE12101`
- `ELCE 12101` -> `ELCE12101`

Do not normalize ELCE rows as `PSW12101`.

ELCE import should be handled separately.

For now:

- preview ELCE rows separately
- mark them as separate program review
- do not include them in PSW import candidates
- future ELCE import can use one general ELCE batch/cohort
- start/finish dates can be handled later

Human-readable reason:

`ELCE row - separate program import required`

Suggested status:

- `separate_program_review`

## Scope

Update only preview parsing, normalization, classification, filters, and reason display.

## Required Preview Behavior

### 900 Series rows

In preview table:

- show sheet as 900 Series
- show normalized PSW number if useful for reference
- status should indicate skipped/re-enrolment duplicate
- warning level should be review or skipped
- should not count as clean new candidate
- should not be selectable/importable later unless a future override is intentionally added

### ELCE rows

In preview table:

- show sheet as ELCE
- normalize ID as ELCE prefix, not PSW
- status should indicate separate program review
- should not count as PSW clean new candidate
- should not be mixed with PSW monthly batch counts

### PSW monthly rows

Continue current behavior:

- normalize to PSW prefix
- match existing students by normalized student number
- match by email if student number not found
- possible name match if relevant
- clean new candidate if no warning
- duplicate warnings if needed

## Summary Counts

If safe, split counts so admin can understand:

- PSW clean new candidates
- matched existing
- review needed
- skipped rows
- 900 Series skipped
- ELCE separate program rows

Do not overbuild if current summary can show these through filters.

## Filters

Add or update filters if safe:

- All
- PSW clean new
- Matched
- Review needed
- Skipped
- 900 Series
- ELCE

If too much, keep simpler filters but make row reasons clear.

## Not Included

Do not implement:

- import confirmation
- student creation
- student update
- application creation
- batch creation
- program creation
- ELCE import confirmation
- transcript generation
- Moodle grade matching
- academic records model
- student hub academic summary
- receipt changes
- contract changes
- database migrations unless absolutely needed

## Data Safety

This ticket must not:

- insert students
- update students
- delete students
- create applications
- create batches
- create programs
- save parsed rows

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis.

## Acceptance Criteria

- 900 Series rows are clearly skipped as re-enrolment duplicates
- 900 Series rows are not clean new candidates
- ELCE rows normalize as ELCE prefix
- ELCE rows are marked as separate program review
- ELCE rows are not mixed with PSW monthly batches
- PSW monthly rows continue to normalize as PSW prefix
- preview reasons clearly explain 900 Series and ELCE behavior
- no database writes happen
- no student records are created/updated/deleted
- Excel file is not committed
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Files modified

- `src/lib/legacy-import/normalize.ts` - program-aware student number
  normalization plus a 900 Series detector.
- `src/lib/legacy-import/parse-workbook.ts` - passes the sheet's program
  prefix into normalization, flags 900 Series rows, updates the ELCE warning
  text.
- `src/lib/legacy-import/types.ts` - new preview statuses
  `skipped_reenrolment_duplicate` and `separate_program_review`, new warning
  type `reenrolment_900_series`, new summary counts `series900Skipped` and
  `elceSeparateProgram`, new `is900Series` flag on parsed rows.
- `src/lib/legacy-import/classify.ts` - classifies 900 Series and ELCE rows
  before the PSW pipeline and adds the new summary counts.
- `src/features/academic/legacy-import-preview.tsx` - status labels/colors,
  900 Series and ELCE filter tabs, and two new summary cards.

### Normalization behavior

- `normalizeStudentNumberForImport(value, defaultPrefix)` now takes a program
  prefix ("PSW" or "ELCE") chosen from the sheet. PSW monthly sheets pass
  "PSW", the ELCE sheet passes "ELCE".
- An explicit prefix typed in the cell always wins over the sheet default, so
  `ELCE12101` stays ELCE even if it ever appeared on a PSW sheet and
  `PSW125315` stays PSW on the ELCE sheet.
- Verified against the local reference workbook: `125315 -> PSW125315`,
  `PSW 125315 -> PSW125315`, `psw125315 -> PSW125315`,
  `125301/drop -> PSW125301` with the suffix warning, `12101 -> ELCE12101`,
  `ELCE 12101 -> ELCE12101`. No ELCE row normalizes as PSW.

### 900 Series behavior

- A row is 900 Series when the digits of its normalized id start with 900, or
  when the sheet name contains 900. The current reference workbook contains
  no 900 Series rows (verified by scanning every cell), so the rule is in
  place for when they appear; it was exercised with a synthetic row through
  the real classifier.
- 900 Series rows get status `skipped_reenrolment_duplicate`, warning level
  review, and reason
  `900 Series re-enrolment row - original batch record should be kept`.
- The id still normalizes as PSW for reference, and if a matching existing
  student is found by number, the row links to that student so admin can see
  which original record to keep.
- They are never counted as clean new candidates, never counted as matched
  existing, and have their own summary count and filter.

### ELCE behavior

- ELCE sheet rows get status `separate_program_review` and reason
  `ELCE row - separate program import required`.
- Ids normalize with the ELCE prefix (`12101 -> ELCE12101`), never PSW.
- ELCE rows are excluded from PSW clean new candidates, matched counts, and
  the PSW duplicate tracking, so they cannot mix into PSW monthly batches.
  An existing student with a matching ELCE number or email is still linked
  for reference.
- Verified against the reference workbook: all 26 ELCE data rows classify as
  separate program review with ELCE-prefixed ids; legend rows on the ELCE
  sheet still skip as layout rows.

### Summary and filters

- New summary cards: `900 Series skipped` and `ELCE separate program`.
- New filter tabs: `900 Series` and `ELCE`.
- `Review needed` (count and filter) excludes 900 Series and ELCE rows so
  they are not double counted; they appear only under their own tabs.

### Data safety

- No database writes. The classifier is pure, the parser reads only the
  uploaded buffer, and the server action still performs a single read-only
  `select` on students. No insert, update, delete, or upsert exists anywhere
  in the legacy-import code paths. No schema changes. No import button.
- The reference Excel file stays local under `_reference/` (gitignored) and
  was not committed.

### Checks

- `npm run lint` passes.
- `npm run build` passes.