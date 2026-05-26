# CONTRACT-04E-LITE - Runtime Word Template Stabilization

## Goal

Stabilize the runtime Word contract template after deployed/manual testing exposed layout problems.

This is a small bridge ticket before contract generated record/history.

## Current Context

CONTRACT-04D was already merged and pushed.

CONTRACT-04E overflow/signature refinement is skipped for now.

The runtime template has been manually corrected and should now be committed as the stable source:

`src/templates/contracts/student-enrolment-template.docx`

## Main Rule

Do not redesign the contract.

Do not continue long-name shrinking work.

Do not touch later page layout.

Do not do broad template refinement.

This ticket is only to make sure the corrected runtime template is committed and generation still works.

## Scope

Allowed:

- verify the runtime template path
- keep `src/templates/contracts/student-enrolment-template.docx` as the source of truth
- confirm marker placeholders still exist
- confirm schedule/admin date mappings from CONTRACT-04D still work
- update ticket notes
- run lint/build
- generate one test DOCX

Not allowed:

- no new database table
- no generated contract history
- no storage upload changes
- no PDF export
- no Adobe/DocuSign
- no long-name shrink feature
- no signature spacing feature
- no page layout redesign
- no header/footer rebuild
- no fee/payment rewrite

## Template Must Keep

The runtime Word template must keep these placeholders:

- `{international_yes}`
- `{international_no}`
- `{delivery_in_person}`
- `{delivery_hybrid}`
- `{delivery_online}`

The generation code should replace them with bracket markers:

- `[X]` selected
- `[ ]` unselected

## Contract Rules To Preserve

- contract effective date remains `02/05/2024`
- class schedule mapping from CONTRACT-04D remains working
- college admin date fields remain generation date where already mapped
- student date fields remain blank
- fees/payment table remains unchanged
- academic/English marker logic remains unchanged
- no broad layout changes

## Acceptance Criteria

- corrected runtime template is committed
- generation uses `src/templates/contracts/student-enrolment-template.docx`
- no reference DOCX is used at runtime
- marker placeholders are replaced in generated DOCX
- no `{international...}` or `{delivery...}` placeholders remain in generated DOCX
- contract effective date remains `02/05/2024`
- class schedule still works
- college admin dates still work
- student date fields remain blank
- later pages are not changed by new code
- `npm run lint` passes
- `npm run build` passes