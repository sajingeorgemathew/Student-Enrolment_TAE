# CONTRACT-04C - Fix Academic, English, Delivery, and Student Markers

## Goal

Fix dynamic marker selection in the Word contract export.

The generated DOCX must reflect the selected values from the student file/admin checklist.

## Main Product Rule

Use the existing Word template.

Do not recreate the contract from HTML or CSS.

Do not redesign the document.

Only fix marker/check selection behavior.

## Source Documents

Use:

- `docs/blueprint/contract-template-field-map.md`
- `_reference/source-files/Student Enrolment Contract - Chidi Gloria Arowolo.docx`
- `_reference/source-files/Student Enrolment Contract - Chidi Gloria Arowolo.pdf`

Do not commit source Word/PDF files.

## Scope

Fix dynamic marker behavior for:

- academic requirement selected option
- English language requirement selected option
- method of program delivery
- international student Yes/No marker
- language of instruction marker only if safe

## Current Problems

- Academic route selection does not reliably reflect the official admin checklist.
- English route selection does not reliably reflect the official admin checklist.
- Delivery method marker does not reflect the batch delivery method.
- International student Yes/No marker does not reflect the student record.
- Some marker logic is fragile because DOCX XML can split text across multiple runs.

## Academic Requirement Mapping

Source:

- `admission_checklists.academic_route`

Allowed values:

- `canadian_secondary`
- `foreign_credential`
- `mature_student`

Behavior:

- Only selected route should be marked.
- Do not hardcode Mature Student.
- If no academic route exists, leave all academic options unmarked.
- Do not add extra shapes or round markers.
- Do not remove static text.

## English Requirement Mapping

Source:

- `admission_checklists.english_route`

Allowed values:

- `ielts`
- `toefl_ibt`
- `cael`
- `celpip`
- `clb`
- `duolingo`
- `pte_academic`
- `nacc_written_exam`
- `two_years_canadian_postsecondary_english`
- `two_years_international_postsecondary_english`
- `not_required`

Behavior:

- Only selected route should be marked.
- Do not hardcode NACC Written Exam.
- If value is `not_required`, leave all English options unmarked.
- If no English route exists, leave all English options unmarked.
- Do not alter the English section wording.

## Delivery Method Mapping

Source:

- `batches.delivery_method`

Allowed values may include:

- `in_person`
- `hybrid`
- `online`

Behavior:

- Only selected delivery method should be marked.
- If missing, leave template default or leave all unmarked.
- Do not change table/page layout.

## International Student Mapping

Source:

- student international status field, if available

Behavior:

- If true, mark Yes.
- If false, mark No.
- If missing, leave both unmarked or preserve template default if safer.
- Do not change student information layout.

## Language of Instruction

Current program is English.

If safe:

- keep English marked
- do not change layout

If not safe:

- leave existing template behavior unchanged and document limitation

## Marker Style

Use the same visual style as the existing Word template as much as possible.

Do not introduce:

- new round shapes
- new floating objects
- new bullets that were not in the original
- extra paragraph breaks
- layout shifts

## XML Safety Rule

DOCX text can be split across XML runs.

Marker logic should be robust enough to handle split runs where practical.

If direct XML manipulation is fragile, document limitation and use the safest targeted approach.

## Not Included

Do not implement:

- contract date changes
- missing student field changes
- class schedule day filtering
- fee underline formatting
- payment table changes
- college representative placeholders
- signature line redesign
- header/footer redesign
- page layout redesign
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

- academic route in DOCX matches official admin checklist
- English route in DOCX matches official admin checklist
- delivery method in DOCX matches batch delivery method if safe
- international student marker matches student record if safe
- no hardcoded Mature Student
- no hardcoded NACC Written Exam
- no unwanted new round marker/shape added
- no broad layout rewrite
- no page/header/footer redesign
- no class schedule or fee formatting changes
- `npm run lint` passes
- `npm run build` passes

---

## Implementation Notes

### Values Tested

Test script: `scripts/test-contract-markers.ts`

- Test 1: academic_route=canadian_secondary, english_route=ielts, delivery_method=in_person, international_student=true
- Test 2: academic_route=mature_student, english_route=nacc_written_exam, delivery_method=online, international_student=false
- Test 3: academic_route=foreign_credential, english_route=duolingo, delivery_method=hybrid, international_student=null
- Test 4: all null (no markers selected)
- Test 5: english_route=not_required (all English markers cleared)

All 22 assertions pass.

### What Was Fixed

1. Academic requirement marker: removed hardcoded Mature Student checkmark. Now dynamically selects based on admission_checklists.academic_route. Supports canadian_secondary, foreign_credential, mature_student. Null leaves all unmarked.

2. English requirement marker: removed hardcoded NACC Written Exam checkmark. Now dynamically selects based on admission_checklists.english_route. Supports all 10 options. not_required and null leave all unmarked.

3. Delivery method marker: added dynamic selection based on batches.delivery_method. For in_person and online, replaces the empty checkbox image with a Wingdings checkmark. For hybrid, inserts a Wingdings checkmark before the Hybrid text. Null leaves template default.

4. International student marker: added dynamic selection based on students.international_student. true marks Yes, false marks No. Null leaves both unmarked.

5. XML robustness: marker logic uses findParagraph which concatenates text across XML runs before matching. This handles Word's run-splitting behavior. English markers are bounded between the English Language Proficiency heading and the Fees heading to prevent false matches.

### Marker Style

- Academic and English markers use Wingdings checkmark (F0FE) with bold formatting, matching the existing template style
- Delivery method markers use Wingdings checkmark (F0FE) at size 22
- International student marker uses Wingdings checkmark (F0FE) inserted inline before the target text
- No new round shapes, floating objects, or page breaks introduced

### Limitations Remaining

- Language of Instruction: left unchanged (English is always correct for current programs). No dynamic mapping added. If non-English programs are introduced, a future ticket should add this.
- Delivery method visual: the Hybrid option has no empty checkbox image in the original template (unlike in_person and online). The checkmark appears without a matching empty box for unselected state.
- Bold formatting for runs without w:rPr: CELPIP, Canadian post-secondary, and International post-secondary English option paragraphs have some runs without explicit w:rPr elements. When selected, a new w:rPr with bold is inserted for these runs.
- Class schedule day filtering, fee underline formatting, payment table, college representative, signature lines, header/footer, and page layout are not addressed (out of scope for this ticket).