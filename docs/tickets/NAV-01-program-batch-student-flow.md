# NAV-01 - Rebuild Navigation Around Programs Batches Students

## Goal

Rebuild the main navigation and daily workflow around:

Program -> Batch -> Student -> Student File

This is a workflow reengineering ticket.

The system should feel closer to the PSW masterclass Excel workflow, but cleaner and database-driven.

## Main Product Decision

The daily work should not be driven by separate module pages like:

- Checklists
- Documents
- Fees
- Contracts

Those modules should mostly live inside the student file.

Separate module pages may remain for admin-wide list/search views, but they should not be the main daily navigation.

## Source Reference

Use this local-only Excel reference if needed:

`_reference/source-files/PSW MASTERCLASS LIST- 2025 - 26.xlsx`

Use it only to understand the batch/student master view direction.

Do not commit this file.

Do not copy real student data into code, seed data, docs, or tests.

## New Main Navigation

Update dashboard navigation to focus on:

- Dashboard
- Programs
- Batches
- Students
- Intakes
- Admin

Optional secondary/admin links may include:

- Documents
- Fees
- Checklists
- Contracts

But these should not be the main daily workflow links.

## Workflow Direction

Main flow:

1. Admin or staff opens Programs.
2. Selects a program.
3. Opens related batches.
4. Opens a batch.
5. Sees students in that batch.
6. Opens a student.
7. Works inside the student file.

## Student File Direction

Student detail page remains the main student file hub.

Inside student file:

- Student Info
- Intake/Application
- Program and Batch
- Documents
- Checklist
- Fees
- Contract Word Export
- Notes
- Activity

## Batch Page Direction

Batch pages should become more important.

Batches should support:

- list students in the batch
- open student file
- show batch summary
- show program info
- later support transfer/move logic

Do not implement transfer logic in this ticket.

## Contract Direction

Contract should not be the place to edit batch or program.

Contract page should only:

- show readiness
- generate Word contract
- link back to student file

Do not add PDF export.

Do not add Adobe or DocuSign.

## Sales Direction

Sales should not be overwhelmed.

Sales should mainly use:

- Intakes
- Students
- Student File

Sales can enter:

- basic student info
- program interest
- batch interest
- price discussed
- deposit discussed
- documents received
- notes for admin

Admin finalizes official student file.

## Admin Direction

Admin can use:

- Programs
- Batches
- Students
- Student File
- Admin

Admin finalizes:

- batch assignment
- official checklist
- document review
- fee schedule
- contract Word export

## Scope

Build or improve:

- main dashboard navigation
- route grouping if needed
- Programs page link behavior
- Batches page link behavior
- Students page link behavior
- student file entry points
- remove or demote main nav clutter for Documents, Fees, Checklists, Contracts
- add clear workflow labels

## Do Not Remove Existing Routes

Do not delete existing routes.

Keep these routes working if they exist:

- `/dashboard/documents`
- `/dashboard/fees`
- `/dashboard/checklists`
- `/dashboard/contracts`

But move them out of primary navigation if appropriate.

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Not Included

Do not implement:

- batch transfer
- delete/archive controls
- full role management
- checklist save fix
- contract template polish
- transcript module
- Excel import
- Adobe
- DocuSign
- PDF export

## Acceptance Criteria

- main navigation focuses on Programs, Batches, Students, Intakes, Admin
- Documents, Fees, Checklists, Contracts are no longer treated as primary daily workflow nav
- existing module routes still work
- batch and student links guide users toward the student file
- contract page is not presented as the place to edit batch/program
- UI wording supports Program -> Batch -> Student -> Student File
- no long em dash characters are introduced
- no emojis are added
- `npm run lint` passes
- `npm run build` passes