# STUDENT-04B - Student Batch Assignment Controls

## Goal

Fix the wrong batch edit behavior inside the student file.

The student file should not send users to the core batch edit page when they want to change a student's batch.

## Main Product Rule

Batch editing and student batch assignment are different.

Core batch edit means editing the batch itself.

Student batch assignment means changing which batch a student belongs to.

Inside the student file, admin should manage the student's batch assignment, not edit the batch record.

## Current Problem

The student file has an Edit Batch action that routes to the core batch edit page.

That is wrong for student file workflow.

## Scope

Improve:

- `/dashboard/students/[studentId]`

Build student batch assignment controls inside the student file.

## Required Behavior

Inside student file, Program and Batch section should show:

- current program
- current batch
- batch start date
- expected end date
- delivery method
- training location
- practicum locations if available

For admin/super_admin, show actions:

- View Batch
- Change Batch
- Transfer Batch

Do not show core Edit Batch as the main action from student file.

## Change Batch

Use when the wrong batch was selected by mistake.

Behavior:

- update the student's current application/batch assignment
- no formal transfer history required in this ticket unless existing schema supports it
- keep action simple

## Transfer Batch

Use when the student actually transfers from one batch to another.

Behavior direction:

- select new batch
- enter reason
- enter notes
- record transfer history if safe and schema supports it
- update student's current batch/application assignment

If transfer history requires schema changes, create a safe migration.

## Suspend or Remove From Batch

Show as planned/future behavior only.

Do not implement suspend/remove in this ticket unless already supported safely.

## Role Rules

### Admin and Super Admin

Can:

- view batch assignment controls
- change batch
- transfer batch if implemented

### Sales

Can:

- view current program/batch interest or assignment
- not change official batch assignment after admin review
- not transfer batch

### Viewer

Can:

- read only

## Contract Rule

Contract page should not be used to edit batch/program.

If contract page has Edit Batch/Edit Program actions, remove or replace with:

- Open Student File

Source data must be corrected from student file, not contract page.

## Not Included

Do not implement:

- core batch edit changes
- batch delete
- student delete
- archive controls
- checklist fixes
- document changes
- fee changes
- contract template changes
- PDF export
- Adobe
- DocuSign
- transcript module
- Excel import

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- student file no longer routes Edit Batch to core batch edit
- student file shows current program and batch clearly
- admin/super_admin can change student batch assignment
- sales cannot change official batch assignment
- viewer is read-only
- contract page no longer suggests editing batch/program there
- source correction routes back to student file
- no delete/archive controls are added
- no checklist changes are made in this ticket
- no long em dash characters are introduced
- no emojis are added
- `npm run lint` passes
- `npm run build` passes