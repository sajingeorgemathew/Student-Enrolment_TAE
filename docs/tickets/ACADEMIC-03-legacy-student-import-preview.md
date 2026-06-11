# ACADEMIC-03 - Legacy Student Excel Import Preview

## Goal

Create an admin-only Excel import preview for legacy student records.

This ticket parses the legacy student Excel file and shows what would be created or matched.

This ticket must not create, update, or delete student records.

## Blueprint Source

Use:

- `docs/blueprint/legacy-student-import.md`
- `docs/tickets/ACADEMIC-01-legacy-student-import-blueprint.md`
- `docs/tickets/ACADEMIC-02-legacy-student-model-flags.md`

## Local Reference File

The Excel file is local only and should not be committed:

`_reference/source-files/academic/legacy-students/PSW MASTERCLASS LIST- 2025 - 26.xlsx`

Do not force-add this file to Git.

## Main Product Direction

Legacy students are historical student records imported from old master lists.

Before importing, admin must preview the Excel rows and see:

- matched existing students
- new legacy student candidates
- possible duplicates
- invalid rows
- skipped rows

No data should be inserted in this ticket.

## Scope

Create:

- admin-only import preview page
- Excel upload or local reference parser, depending on safest current project pattern
- workbook sheet parser
- row normalization helpers
- student number normalization helper
- preview table
- summary counts
- matching results against existing students
- no database inserts

## Suggested Route

Use Admin Tools > Academic Records.

Suggested route:

`/dashboard/admin-tools/academic-records/legacy-import`

If Academic Records landing exists, add a link/card:

- Legacy Student Import

## Role Rules

Admin/super_admin:

- can access import preview
- can upload/select Excel file for preview

Sales:

- no access

Viewer:

- no access

Direct URL access by sales/viewer should be blocked.

## Student Number Normalization Rule

This rule is critical.

The Excel may contain student IDs like:

- `125315`
- `PSW125315`
- `PSW 125315`
- `psw125315`
- `125301/drop`

The database stores student numbers like:

- `PSW125315`

Normalize for matching like this:

1. Trim spaces.
2. Convert to uppercase.
3. Remove spaces between PSW and number.
4. If value starts with `PSW`, keep `PSW` plus digits.
5. If value is numeric or mostly numeric, prefix with `PSW`.
6. Preserve clear special suffixes only as warning, not as the main normalized ID.
7. For values like `125301/drop`, normalize main ID as `PSW125301` and flag suffix `drop` as warning.

Examples:

- `125315` -> `PSW125315`
- `PSW125315` -> `PSW125315`
- `PSW 125315` -> `PSW125315`
- `psw125315` -> `PSW125315`
- `125301/drop` -> `PSW125301` with warning `Student number contains suffix: drop`

Do not create duplicate students because one source has `125315` and the database has `PSW125315`.

## Name Normalization Rule

For matching and duplicate warnings:

- trim spaces
- collapse multiple spaces
- uppercase for comparison
- remove underscores used as placeholders
- compare legal full name from Excel against database legal_full_name

Examples:

- `Preeti _` -> `PREETI`
- `Manpreet  Kaur` -> `MANPREET KAUR`

## Excel Parsing Rules

The workbook has multiple sheets.

Known sheets include:

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

PSW sheet header row is usually row 2.

ELCE may have header row 3 and should be treated as a separate program or skipped initially if risky.

Parser should:

- map by header name, not column letter
- skip blank rows
- skip legend rows
- skip summary rows
- never import Password column
- identify row source sheet
- identify row number

## Column Mapping For Preview

Map these fields if present:

- Student ID -> normalized student_number
- First Name -> legal_first_name
- Middle Name -> legal_middle_name
- Last Name -> legal_last_name
- combined name -> legal_full_name
- YYYY/MM/DD or DOB -> date_of_birth
- Contact No. -> phone
- Email -> email
- Address -> mailing_address_line_1
- WP/Status -> immigration_status or warning/note
- sheet name -> proposed batch

Do not save them yet.

## Matching Strategy

For each parsed row, compare against existing database students.

Match priority:

1. Exact normalized student_number match
2. Exact email match if email exists
3. Possible match by normalized legal_full_name plus batch context if available

Preview status values:

- `matched_student_number`
- `matched_email`
- `possible_name_batch_match`
- `new_candidate`
- `invalid_row`
- `skipped_row`
- `duplicate_in_excel`

## Duplicate Detection

Flag:

- same normalized student number appearing multiple times in workbook
- same email appearing multiple times
- same normalized name appearing in same sheet/batch
- database existing match with different name
- database existing match with different email
- rows with missing student number and missing name

Do not auto-merge uncertain rows.

## Preview UI

Show summary cards/counts:

- total sheets scanned
- total rows parsed
- matched existing
- new candidates
- possible duplicates
- invalid rows
- skipped rows

Preview table columns:

- sheet
- row number
- raw student ID
- normalized student number
- legal full name
- email
- phone
- proposed batch
- match status
- warning/reason
- matched existing student link if available

Allow filters:

- all
- matched
- new candidates
- warnings
- invalid/skipped

## Not Included

Do not implement:

- import confirm
- student creation
- student update
- application creation
- batch creation
- program creation
- transcript generation
- Moodle grade matching
- academic records data model
- student hub academic summary
- receipt changes
- contract changes
- database migrations unless absolutely necessary

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis.

## Acceptance Criteria

- admin/super_admin can access legacy import preview
- sales/viewer cannot access it
- Excel file can be previewed
- student number normalization works
- existing students are matched using PSW-prefixed numbers
- duplicate/warning rows are flagged
- preview does not insert/update/delete any students
- Password column is ignored
- summary counts display
- preview table displays parsed rows
- no database writes happen
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Route added

- `/dashboard/admin-tools/academic-records/legacy-import`
  (`src/app/dashboard/admin-tools/academic-records/legacy-import/page.tsx`).
- The Academic Records landing page
  (`src/app/dashboard/admin-tools/academic-records/page.tsx`) was changed from a
  placeholder to a card grid and now links to "Legacy Student Import".

### Dependency added

- `exceljs@^4.4.0` for reading the uploaded `.xlsx` workbook.
- The SheetJS `xlsx` npm package was not used. Its published npm version carries
  a high-severity prototype-pollution-on-parse advisory (CVE-2023-30533) and a
  ReDoS advisory (CVE-2024-22363), which are directly relevant when parsing
  untrusted spreadsheets. `exceljs` is well maintained; its only flagged
  transitive advisory is a moderate `uuid` issue that requires passing a `buf`
  to uuid generation, which this read-only parser never does.
- `exceljs` is added to `serverExternalPackages` in `next.config.ts`.
- `experimental.serverActions.bodySizeLimit` is set to `15mb` so larger
  workbooks can be uploaded to the preview server action (default is 1 MB).

### Parser behavior

- `src/lib/legacy-import/parse-workbook.ts` (server only, no database access).
- Header rows are located by scanning the first 6 rows of each sheet for a
  "Student ID" header. PSW sheets use row 2; ELCE uses row 3. This is automatic,
  not hard-coded per sheet.
- Columns are mapped by normalized header name, never by column letter. Header
  text is lowercased and stripped of punctuation, so "Student ID ",
  "Contact No.", "YYYY/MM/DD", "Last name", and "WP" all map correctly.
- Only the first occurrence of each field is kept, so duplicate placement-section
  columns (for example a second "STATUS") do not override the student columns.
- The Password column is mapped only so it can be explicitly ignored; its value
  is never read into the output.
- Email cells are stored by Excel as hyperlink objects; the parser extracts the
  text. Formula cells (Sr. No.) and rich text are also handled.
- Purely empty rows are dropped. Legend/summary/repeated-header rows (for example
  "Withdrawal", "Enrollment Pending", "Other Reason", and embedded header rows)
  are detected by marker text and flagged for skipping by the matcher.
- ELCE rows are parsed but each carries a warning to verify the program mapping
  before any future import.
- All 11 sheets in the reference workbook parse: 362 data rows, 322 with a
  normalized student number, 40 legend/summary rows skipped, 0 sheets skipped.

### Normalization behavior

- `src/lib/legacy-import/normalize.ts` (pure helpers).
- `normalizeStudentNumberForImport`: `125315 -> PSW125315`,
  `PSW125315 -> PSW125315`, `PSW 125315 -> PSW125315`, `psw125315 -> PSW125315`,
  `125301/drop -> PSW125301` with warning `Student number contains suffix: drop`.
  The canonical id is always `PSW` plus the digits found; a `/suffix` is kept
  only as a warning, never folded into the id.
- `normalizeNameForImport`: trims, collapses whitespace, removes underscore
  placeholders, uppercases. `Preeti _ -> PREETI`, `Manpreet  Kaur -> MANPREET
  KAUR`.
- `normalizeEmailForImport`: trims, lowercases, strips `mailto:` and stray
  `%20`. `looksLikeEmail` is used only to raise a warning, never to block a row.

### Matching behavior

- `src/features/academic/legacy-import-actions.ts` (admin-gated server action).
- Reads existing students (`id, student_number, email, legal_full_name`) for
  matching. Read only - no insert, update, or delete anywhere in this feature.
- Match priority: exact normalized student number, then usable email, then
  normalized full name. Database student numbers are normalized the same way, so
  Excel `125315` matches database `PSW125315`.
- Statuses: `matched_student_number`, `matched_email`,
  `possible_name_batch_match`, `new_candidate`, `invalid_row`, `skipped_row`,
  `duplicate_in_excel`.
- Warnings raised: suffix markers, invalid email format, ELCE sheet, missing
  student number, name matches multiple students, name-only match, matched by
  number but name/email differs from the database, and duplicate student
  number/email within the workbook.

### Preview UI

- `src/features/academic/legacy-import-preview.tsx` (client component).
- Upload form posts to the server action via `useActionState`.
- Summary cards: sheets scanned, rows parsed, matched existing, new candidates,
  rows with warnings, skipped rows. Scanned and skipped sheet names are listed.
- Filterable table (all / matched / new candidates / warnings / invalid-skipped)
  with sheet, row number, raw and normalized ids, legal full name, email, phone,
  proposed batch (the sheet name), status, warnings, and a link to the matched
  existing student file when one is found.

### Role / access behavior

- Admin and super_admin only. The page renders an access notice for other roles,
  and the server action independently re-checks the role (server actions are
  reachable by direct POST), so sales and viewer are blocked even by direct URL.

### Limitations

- Preview only. There is no import confirmation, and no students, applications,
  batches, or programs are created or modified.
- The local reference Excel file is not read by the app and is not required in
  production; the preview is driven entirely by the uploaded file. The reference
  file stays local and gitignored under `_reference/source-files/`.
- ELCE is parsed but flagged for review rather than mapped to a program.
- No transcript generation or Moodle grade matching.