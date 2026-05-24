# CONTRACT-03 - Contract Export From Student File Only

## Goal

Move the final Word contract generation workflow into the student file and clean up the Ready for Contract vs Contract Generated status logic.

## Main Product Rule

The student file is the main workflow.

Contract generation should happen from:

`/dashboard/students/[studentId]`

The contract page/list can remain as a secondary read-only/admin overview, but it should not be the main place to run the workflow.

## Current Problems

- Ready for Contract and contract readiness are overlapping.
- The app still shows "Word contract available" as a missing item after the student is ready.
- Ready for Contract button still appears after the student is already ready.
- Workflow Review and Contract section can show duplicate or confusing status.
- Contract export workflow still feels separate from the student file.

## Correct Workflow

### Before ready

If required items are missing:

- status: admin_review
- readiness: Not Ready
- Mark Ready for Contract is blocked
- show exact missing items

### Ready for contract

When all required items pass and admin clicks Mark Ready for Contract:

- status becomes ready_for_contract
- readiness shows Ready for Contract
- Word contract is not a missing item
- Generate Word Contract button becomes available

### After Word contract generation

When admin generates the Word contract:

- status becomes contract_generated if safe
- contract generated timestamp is saved if supported
- readiness shows Contract Generated
- user can download Word contract

## Required Readiness Logic

Do not treat Word contract generation as a prerequisite for Ready for Contract.

Word contract generation is the next step after Ready for Contract.

Ready for Contract checks should include:

- student information complete
- batch assigned
- official checklist ready
- fee schedule approved
- payment installments available
- documents available

Ready for Contract checks should not include:

- Word contract already generated

## Student File Contract Section

Inside `/dashboard/students/[studentId]`, show:

- current workflow status
- contract readiness status
- Generate Word Contract button only for admin/super_admin
- Generate Word Contract only when status is ready_for_contract or contract_generated
- generated contract status if available
- link to contract preview if useful
- no PDF export

## Contract Page/List

Keep existing routes working:

- `/dashboard/contracts`
- `/dashboard/contracts/[applicationId]/preview`

But change wording/behavior:

- contract list is a secondary admin overview
- contract list should not say Word contract missing when student is ready
- contract preview should not show source edit controls for batch/program
- contract preview should link back to student file for source changes
- Generate Word Contract can remain on preview only for admin/super_admin if needed, but the main action should be on student file

## Status Updates

If safe, when Word contract generation succeeds:

- update application status to `contract_generated`
- save generated timestamp if existing schema supports it
- revalidate student file and contract routes

If schema support is missing, do not create a large migration unless necessary. Document limitation.

## Role Rules

### Admin and Super Admin

Can:

- generate Word contract after ready_for_contract
- view contract overview
- download Word contract

### Sales

Can:

- view limited contract status if useful
- cannot generate Word contract

### Viewer

Can:

- read status only
- cannot generate Word contract

## Not Included

Do not implement:

- PDF export
- Adobe API
- DocuSign API
- signed contract upload
- delete controls
- archive controls
- hard delete
- role management UI
- batch transfer changes
- document upload changes
- checklist changes
- fee calculator changes
- transcript module
- Excel import

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- Word contract generation is available from student file
- Word contract generation is admin/super_admin only
- Word contract generation is not available before ready_for_contract
- Word contract generation is not treated as a missing requirement for ready_for_contract
- Ready for Contract button does not remain as an active action after status is ready_for_contract
- Contract list and contract preview agree with student file readiness
- Contract status becomes contract_generated after successful generation if safe
- Sales/viewer cannot generate Word contract
- no PDF export is added
- no contract template changes are made
- no delete/archive controls are added
- no long em dash characters are introduced
- no emojis are added
- `npm run lint` passes
- `npm run build` passes