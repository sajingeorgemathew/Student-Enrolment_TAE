# ACADEMIC-03-FIX - Legacy Import Warning Reason Clarity

## Goal

Improve the legacy student import preview so warning/skipped/matched/new rows clearly explain why they are categorized that way.

This is still preview-only.

Do not import, create, update, or delete student records.

## Current Context

ACADEMIC-03 created the legacy student Excel import preview.

The preview works and shows summary counts such as:

- sheets scanned
- rows parsed
- matched existing
- new candidates
- rows with warnings
- skipped rows

The issue is that warning rows are not clear enough for admin decision-making. Clean data can still produce warnings because of matching logic, duplicate checks, suffixes, optional missing fields, or sheet/program review needs.

Before ACADEMIC-04 import confirmation, the preview must show exactly why each row is flagged.

## Main Rule

Do not implement import confirmation in this ticket.

Do not write to the database.

This ticket improves preview clarity only.

## Scope

Improve:

- warning reason labels
- warning category/type
- skipped row reason
- duplicate reason
- match reason
- filter tabs
- preview table clarity
- summary counts if needed

## Warning Philosophy

Warnings do not always mean the Excel data is dirty.

A warning means:

- valid row, but needs admin review before automatic import
- row has special condition
- row may match something existing
- row may have a duplicate risk
- row may belong to a special program/sheet
- row has a field that was normalized or partially interpreted

The UI must communicate this.

## Required Row Classification

Each preview row should have:

- `matchStatus`
- `warningLevel`
- `warningTypes`
- `warningMessages`
- `skipReason` if skipped
- `matchReason` if matched

Suggested values:

### matchStatus

- `matched_student_number`
- `matched_email`
- `possible_name_batch_match`
- `new_candidate`
- `invalid_row`
- `skipped_row`
- `duplicate_in_excel`

### warningLevel

- `none`
- `info`
- `review`
- `blocking`

### warningTypes

Use clear values such as:

- `student_number_suffix`
- `duplicate_student_number_in_excel`
- `duplicate_email_in_excel`
- `duplicate_name_in_batch`
- `existing_student_number_match`
- `existing_email_match`
- `name_mismatch_existing_student`
- `email_mismatch_existing_student`
- `missing_student_number`
- `missing_name`
- `missing_email`
- `missing_phone`
- `special_sheet_review`
- `legend_or_summary_row`
- `blank_row`
- `unsupported_program_sheet`

## Required UI Changes

Preview table should show:

- Status
- Warning level
- Reason
- Details

The Reason column should be human-readable.

Examples:

- `Clean new candidate`
- `Matched existing student by student number`
- `Matched existing student by email`
- `Student number contains suffix: drop`
- `Same student number appears more than once in this workbook`
- `Missing email, import still allowed`
- `ELCE sheet requires separate program review`
- `Skipped legend row`
- `Missing student number and name`

## Required Filter Improvements

Current filters are likely:

- All
- Matched
- New candidates
- Warnings
- Invalid / skipped

Improve or keep these, but make them useful.

Recommended filters:

- All
- Clean new
- Matched
- Review needed
- Blocking issues
- Skipped

If easier, keep the current filters but ensure warning rows display reason clearly.

## Summary Counts

If safe, show counts for:

- clean new candidates
- matched existing
- review needed
- blocking issues
- skipped rows

Do not overbuild.

## Data Safety

This ticket must not:

- insert students
- update students
- delete students
- create applications
- create batches
- create programs
- save parsed rows
- change receipt or contract modules

## Student Number Normalization Reminder

Keep existing normalization:

- `125315` -> `PSW125315`
- `PSW125315` -> `PSW125315`
- `PSW 125315` -> `PSW125315`
- `psw125315` -> `PSW125315`
- `125301/drop` -> `PSW125301` with warning `Student number contains suffix: drop`

## Excel Safety

Continue to:

- ignore Password column
- skip blank rows
- skip legend rows
- flag ELCE separately if needed
- map by header name, not column letter

## Not Included

Do not implement:

- import confirmation
- student creation
- student update
- application creation
- batch creation
- program creation
- transcript generation
- Moodle grade matching
- academic records model
- student hub academic summary
- receipt changes
- contract changes
- database migrations unless absolutely needed

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis.

## Acceptance Criteria

- warning rows show clear reason
- skipped rows show clear reason
- matched rows show clear match reason
- new rows show clean candidate status if no warnings
- warning categories are filterable or clearly visible
- admin can understand why rows were flagged
- no database writes happen
- no student records are created/updated/deleted
- Excel file is not committed
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Row model

`PreviewRow` (src/lib/legacy-import/types.ts) now carries:

- `matchStatus` (renamed from `status`, same value set as before)
- `warningLevel`: `none` | `info` | `review` | `blocking` - the highest
  severity among the row's warnings
- `warningTypes`: machine-readable categories (see `WarningType`)
- `warningMessages`: human-readable detail lines
- `reason`: one human-readable line explaining the classification
- `skipReason`: set when the row is skipped
- `matchReason`: set when an existing student was found

Warnings are structured objects (`RowWarning`: type + level + message) from
the parser onward instead of plain strings.

### Classification

The matching/classification loop moved out of the server action into a pure
helper, `classifyLegacyRows` in `src/lib/legacy-import/classify.ts`. The
action (`src/features/academic/legacy-import-actions.ts`) keeps auth, upload
validation, parsing, and the read-only students query, then delegates. The
helper has no database access, which keeps the preview write-free by
construction and makes the rules testable.

Level rules:

- missing email / missing phone: info, "import still allowed"
- missing student number (cell empty): review
- student id present but unreadable as a PSW number: review
- student number suffix (for example /drop): review
- invalid email format: review
- duplicate student number or email within the workbook: review, status
  `duplicate_in_excel`, message includes where it was first seen
- name-only match, name matches multiple students, matched-by-number but
  name/email differs from database: review
- ELCE sheet: review, "ELCE sheet requires separate program review"
- no student number and no usable email (with a stray name), or usable email
  but no number and no name: blocking, status `invalid_row`
- legend/summary/blank rows: skipped with `skipReason`, level none

Reason priority: blocking message, then duplicate message, then match reason,
then the first review message, otherwise "Clean new candidate". A new
candidate with only info-level notes still reads "Clean new candidate".

### Normalization fixes found during verification

- `normalizeStudentNumberForImport` no longer extracts digits out of free
  text. Only values shaped like ids (optional PSW prefix plus digits, plus an
  optional /suffix) normalize. Previously the merged-cell banner rows
  ("PSW Evening Batch - 12th May 2025") produced fake ids such as PSW122025
  from the date digits, which could falsely match or duplicate real students.
  The five documented cases still normalize exactly as specified.
- "evening batch" was added to the legend markers so those banner rows are
  skipped as layout rows.
- Raw values echoed inside warning messages are truncated to 40 characters
  (one real row has an email cell containing a long line of dots).

### UI

- Table gained Level (badge: none/info/review/blocking), Reason, and Details
  columns. The old "Warnings / reason" column became Details.
- Filters: All, Clean new, Matched, Review needed, Blocking issues, Skipped.
  Clean new is a new candidate at level none or info. Review/blocking filters
  are level-based, so a matched row needing review appears under both Matched
  and Review needed.
- Summary cards: Sheets scanned, Rows parsed, Clean new candidates, Matched
  existing, Review needed, Blocking issues, Skipped rows.

### Verification against the local reference workbook

Run locally with the real parser and classifier (file stays uncommitted):
11 sheets scanned, 362 rows parsed, 283 clean new candidates, 30 review
needed (24 ELCE, 4 in-file duplicates with first-seen locations, 1 invalid
email format, plus a simulated student-number match showing name/email
mismatch warnings), 0 blocking, 49 skipped layout rows (legend, embedded
repeated headers, batch banner rows). All five student number normalization
cases pass. No insert/update/delete/upsert calls exist anywhere in the
legacy-import code paths.