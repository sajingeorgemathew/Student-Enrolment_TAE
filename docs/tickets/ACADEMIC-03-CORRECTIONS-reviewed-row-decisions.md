# ACADEMIC-03-CORRECTIONS - Legacy Import Reviewed Row Decisions

## Goal

Apply reviewed row decisions to the legacy student import preview before import confirmation.

This ticket makes the preview smarter based on admin review of known edge cases.

This is still preview-only.

Do not import, create, update, or delete student records.

## Current Context

ACADEMIC-03 created the legacy student Excel import preview.

ACADEMIC-03-FIX improved warning clarity.

ACADEMIC-03-RULES added program and re-enrolment rules for:

- PSW monthly sheets
- 900 Series
- ELCE

Now admin reviewed the remaining review-needed rows and confirmed specific decisions.

## Main Rule

The preview should show reviewed decisions clearly before ACADEMIC-04 creates real records.

No database writes in this ticket.

## Confirmed General Rules

### Skipped rows

Rows that are legends, headers, batch titles, or summary labels should remain skipped.

Examples:

- Withdrawal
- Enrollment Pending
- Other Reason
- Student ID header rows
- PSW Evening Batch title rows

These should not be imported.

### 900 Series

900 Series rows are re-enrolment/reference rows.

They should not be imported as new legacy students.

Keep the original student/batch record.

### ELCE

ELCE is separate from PSW.

ELCE student numbers should normalize as ELCE prefix.

ELCE should stay separate program review and should not be imported as PSW.

## Confirmed Reviewed Row Decisions

Apply these explicit decisions in the preview:

### Manpreet Kaur - 17th March

Raw ID:

`12521`

Normalized:

`PSW12521`

Decision:

- keep
- March 17th is correct
- treat as importable/reviewed allowed
- do not block only because of possible name match

Reason text:

`Reviewed - March 17th Manpreet Kaur is correct`

### Chandrashekar Sriramalu - 6th Oct

Raw ID:

`125128`

Normalized:

`PSW125128`

Decision:

- keep
- this is a valid re-enrolment with a different student number
- allow both records
- do not block only because email appears earlier

Reason text:

`Reviewed - valid re-enrolment with different student number`

### Preet Kaur - 6th Oct

Raw ID:

`125135`

Normalized:

`PSW125135`

Decision:

- keep
- October batch is correct
- treat as importable/reviewed allowed
- do not block only because of possible name match

Reason text:

`Reviewed - October batch Preet Kaur is correct`

### Manpreet Kaur - Jan 12th

Raw ID:

`125216`

Normalized:

`PSW125216`

Decision:

- keep
- January batch is correct
- treat as importable/reviewed allowed
- do not block only because of possible name match

Reason text:

`Reviewed - January batch Manpreet Kaur is correct`

### Tara Khand Thakuri Shahi - April 27

Raw ID in file:

`12593`

Correct normalized student number:

`PSW125293`

Decision:

- correct student number to PSW125293 for preview/import
- keep April 27 row
- show correction clearly

Reason text:

`Reviewed correction - source ID 12593 should import as PSW125293`

### Alvin Saji - April 27

Raw ID:

`125213`

Normalized:

`PSW125213`

Decision:

- keep
- April 27 record is correct
- valid re-enrolment
- allow both records if needed
- do not block only because same ID/email appeared earlier

Reason text:

`Reviewed - April 27 re-enrolment is correct`

### Souleyman Issa - June 01

Raw ID:

`125303`

Normalized:

`PSW125303`

Decision:

- exclude
- dropped off
- do not import

Reason text:

`Reviewed - dropped off, exclude from import`

## Required Preview Behavior

Rows with reviewed keep decisions should show:

- status: reviewed_importable or equivalent
- warning level: none or info
- reason: reviewed reason
- not blocking import later

Rows with reviewed correction should show:

- raw ID
- corrected normalized ID
- correction reason
- import should use corrected normalized ID later

Rows with reviewed exclude should show:

- status: skipped or reviewed_excluded
- not importable later
- reason shown clearly

## Suggested Implementation

Create a small reviewed decisions map/helper in the legacy import logic.

Match reviewed decisions using stable keys such as:

- sheet name
- row number
- raw student ID
- normalized student number
- legal full name

Avoid broad name-only overrides.

Example key direction:

- `17th March|12521|Manpreet Kaur`
- `April 27|12593|Tara Khand Thakuri shahi`
- `June 01|125303|Souleyman Issa`

## Import Safety

These decisions should only affect preview classification and later ACADEMIC-04 import eligibility.

This ticket must not write data.

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

- Manpreet Kaur 12521 March 17th is reviewed/importable
- Chandrashekar Sriramalu 125128 is reviewed/importable
- Preet Kaur 125135 is reviewed/importable
- Manpreet Kaur 125216 Jan 12th is reviewed/importable
- Tara Khand Thakuri Shahi source 12593 is corrected to PSW125293
- Alvin Saji 125213 April 27 is reviewed/importable
- Souleyman Issa 125303 June 01 is excluded/skipped
- skipped legend/header rows remain skipped
- 900 Series remains skipped
- ELCE remains separate program review
- no database writes happen
- no student records are created/updated/deleted
- Excel file is not committed
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Files modified

- `src/lib/legacy-import/reviewed-decisions.ts` (new) - the reviewed decision
  map and matcher.
- `src/lib/legacy-import/types.ts` - new statuses `reviewed_importable` and
  `reviewed_excluded`, new warning type `reviewed_decision`, new summary counts
  `reviewedImportable` and `reviewedExcluded`.
- `src/lib/legacy-import/classify.ts` - applies reviewed decisions during
  classification.
- `src/features/academic/legacy-import-preview.tsx` - status labels/colors, a
  Reviewed filter tab, and two summary cards.

### Reviewed decision implementation

- A small map in `reviewed-decisions.ts` holds the seven confirmed decisions.
  Each entry is matched by a stable composite key: sheet name (trimmed,
  lowercased) + raw student id (trimmed) + normalized legal full name (via the
  existing `normalizeNameForImport`, so case and spacing do not matter). This is
  not a broad name-only override - the same name on a different sheet, or a
  different raw id, does not match.
- Decision kinds: `keep` (reviewed and importable), `correct` (importable under
  a corrected student number), `exclude` (removed from import).
- `classifyLegacyRows` looks up the decision at the top of each row. `exclude`
  short-circuits to a `reviewed_excluded` row. `keep`/`correct` run the normal
  matching pipeline (so a matched existing student is still linked), then the
  status is overridden to `reviewed_importable`, the level is dropped to `info`
  so the row is no longer blocking or review-needed, and the reviewed reason
  replaces the computed reason. Original warning details are kept for context.
- Verified against the local reference workbook: 6 reviewed importable, 1
  reviewed excluded; the duplicate `12593` on 18th August (Jigme Lodoe Lama)
  and the `125213` on Jan 12th (Alvin Saji) are correctly NOT affected, proving
  the key is row-specific.

### Tara correction behavior

- Raw id `12593` on the April 27 sheet for Tara Khand Thakuri Shahi now shows
  the corrected normalized number `PSW125293` (raw id `12593` is still shown so
  the correction is visible). Matching and any future import use `PSW125293`,
  never `PSW12593`. Reason: "Reviewed correction - source ID 12593 should
  import as PSW125293".

### Souleyman exclusion behavior

- Raw id `125303` on the June 01 sheet for Souleyman Issa is status
  `reviewed_excluded`, with `skipReason` set, so it is not importable later.
  Reason: "Reviewed - dropped off, exclude from import".

### 900 Series behavior

- Unchanged. 900 Series rows remain `skipped_reenrolment_duplicate` and are not
  importable. No 900 Series rows exist in the current reference workbook.

### ELCE behavior

- Unchanged. ELCE rows remain `separate_program_review`, normalize with the ELCE
  prefix, and are not mixed into PSW counts. 26 ELCE rows in the reference file.

### Data safety

- No database writes. The reviewed-decision map and the classifier are pure; the
  server action still performs a single read-only `select` on students. No
  insert/update/delete/upsert in any legacy-import code path. No schema changes,
  no import button, no receipt/contract changes.
- The reference Excel file stays local under `_reference/` (gitignored) and was
  not committed.

### Checks

- `npm run lint` passes.
- `npm run build` passes.