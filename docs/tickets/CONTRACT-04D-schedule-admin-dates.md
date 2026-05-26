# CONTRACT-04D - Class Schedule and Contract Admin Date Mapping

## Goal

Fix class schedule values and college administrator date fields in the Word contract export.

This ticket handles only schedule/date mapping.

## Main Product Rule

Use the existing Word template.

Do not recreate the contract from HTML or CSS.

Do not redesign the document.

## Current Problems

- Class timing must reflect the selected batch.
- Morning and evening batch timing should not be hardcoded incorrectly.
- Hours row should be filled correctly where safe.
- College administrator date fields need to be filled with the Word generation date.
- Student signature/date fields must remain blank for external signing.

## Scope

Fix:

- class schedule timing
- class schedule hours
- active weekday schedule values
- college administrator date fields on page 6, page 13, and page 14
- generated date helper if needed

## Class Schedule Mapping

Preferred source:

- batch schedule fields if they exist

If batch schedule fields do not exist, use safe preset detection.

### Morning batch

If batch name or schedule source indicates morning:

- Monday to Friday timing: `8:00 AM to 2:00 PM`
- Monday to Friday hours: `6`
- Saturday/Sunday blank

### Evening batch

If batch name or schedule source indicates evening:

- Monday to Friday timing: `4:30 PM to 10:30 PM`
- Monday to Friday hours: `6`
- Saturday/Sunday blank

### Custom/unknown batch

If no safe source is found:

- preserve existing template blanks where possible
- do not invent incorrect schedule data
- document limitation

## Formatting Rule

Use consistent formatting:

- `8:00 AM to 2:00 PM`
- `4:30 PM to 10:30 PM`

Do not use:

- `4:30 AM to 10:30 PM`
- inconsistent casing like `To`
- missing spaces like `2:00PM`

## Practicum Schedule

Do not change practicum schedule in this ticket unless there is a small duplicate text bug.

Practicum schedule can remain:

- `To be determined as per Host Clinical Facility Preceptor's scheduled`

## College Administrator Date Rules

Fill college administrator/college representative date fields only.

Use the Word generation date.

Format:

- DD/MM/YYYY

Pages/sections to map:

- page 6: college/admission officer date if present
- page 13: college representative date
- page 14: college representative date

Student dates must remain blank.

Do not fill:

- student signature date
- student acknowledgement date
- student medical/VSS signature date
- student practicum signature date
- student immigration signature date
- student photo/video consent date

## Placeholder Direction

If college admin date placeholders do not exist in the template, add them only if safe.

Suggested placeholders:

- `{college_admin_date_page_6}`
- `{college_admin_date_page_13}`
- `{college_admin_date_page_14}`

If the existing template already has placeholders, reuse them.

Do not disturb signature lines.

## Not Included

Do not change:

- contract fixed date `02/05/2024`
- international student marker
- delivery method marker
- academic route marker
- English route marker
- fee formatting
- payment table layout
- header/footer
- page layout
- generated contract history
- PDF export
- Adobe
- DocuSign
- signed contract upload
- delete/archive controls
- transcript module
- Excel import

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- morning batch outputs 8:00 AM to 2:00 PM for Monday to Friday
- evening batch outputs 4:30 PM to 10:30 PM for Monday to Friday
- evening batch must not output 4:30 AM
- hours row outputs 6 for active weekdays where safe
- Saturday/Sunday remain blank unless data says otherwise
- college administrator date fields fill with generation date
- student date fields remain blank
- contract fixed date remains 02/05/2024
- no marker regression
- no fee/payment changes
- no broad layout changes
- `npm run lint` passes
- `npm run build` passes

---

## Implementation Notes

### What was implemented

1. Class schedule time formatting:
   - Added `formatClassTimeDisplay` to convert raw class_time (e.g. "8:00AM-2:00PM") to display format ("8:00 AM to 2:00 PM").
   - Added `getScheduleForBatch` with preset detection from batch name when class_time is null.
   - Morning preset: "8:00 AM to 2:00 PM" with 6 hours.
   - Evening preset: "4:30 PM to 10:30 PM" with 6 hours.
   - Unknown/custom batches: timing cells cleared to blank (template reference values removed).

2. College administrator dates:
   - Added `formatGenerationDate` to produce DD/MM/YYYY from the current date at generation time.
   - Page 6: Admission Officer/Registrar/Agent "Date" field filled with generation date.
   - Page 13: College Representative "Date:" field filled with generation date.
   - Page 14: College Representative "Date:" field filled with generation date.
   - No template placeholders were added. Date filling is done via existing XML text replacement.

3. Student date fields:
   - All student signature date fields remain blank. No changes made to those areas.

4. Practicum schedule:
   - No changes. No duplicate text issue found.

5. Removed unused `hoursPerDay` variable (replaced by `getScheduleForBatch`).

### Files modified

- `src/lib/generate-contract-docx.ts` - schedule formatting, preset detection, college admin dates
- `scripts/test-contract-markers.ts` - added tests 6-10 for schedule and date verification
- `docs/tickets/CONTRACT-04D-schedule-admin-dates.md` - this notes section

### Template placeholders

No new placeholders were added to the template. The existing template reference values ("8:00AM-2:00PM" and "6") are replaced via regex during generation. College admin dates are filled by text replacement in existing paragraphs.

### Known limitations

- Class schedule day-level filtering is not implemented. The template has Mon-Fri pre-filled and Sat/Sun blank. If `class_days` specified fewer weekdays (e.g. Mon-Wed-Fri only), inactive weekday cells are not individually cleared. This would require per-cell XML manipulation.
- Preset detection only works for batch names containing "morning" or "evening" (case-insensitive). Other patterns are not detected.
- College admin dates use the server-side generation time. There is no configurable date override.