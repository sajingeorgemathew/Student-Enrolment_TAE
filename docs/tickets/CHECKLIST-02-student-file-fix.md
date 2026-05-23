# CHECKLIST-02 - Checklist Inside Student File Fix

## Goal

Fix checklist workflow so checklist work happens inside the student file and saves correctly.

The checklist should not feel like a separate disconnected module.

## Current Problems

- Checklist list page shows Create even after clicking create.
- Checklist creation does not clearly persist or reflect in the list.
- Checklist workflow is disconnected from the student file.
- Sales checklist and admin official checklist are not clearly separated.
- Checklist navigation still behaves like a primary module.

## Main Product Rule

The student detail page is the main student file.

Checklist work should happen inside:

`/dashboard/students/[studentId]`

Separate checklist pages can remain as admin-wide list/search views, but not the main daily workflow.

## Scope

Improve:

- `/dashboard/students/[studentId]`
- existing checklist actions
- existing checklist display
- existing checklist routes if needed

## Required Behavior

Inside the student file, show two checklist areas:

1. Sales Intake Checklist
2. Official Admin Checklist

## Sales Intake Checklist

Sales checklist is simple and intake-level only.

Sales can mark:

- received
- not_received
- not_sure
- not_applicable

Sales checklist items:

- photo ID
- proof of address
- diploma or transcript
- English proof
- immigration/status document
- payment proof/deposit
- other documents

Sales can update the checklist after initial save.

Sales cannot officially approve requirements.

## Official Admin Checklist

Admin checklist is the official review area.

Admin/super_admin can update:

- photo ID status
- address proof status
- academic route
- academic status
- academic notes
- English route
- English status
- English score/result
- English notes
- readiness status if supported

Admin statuses:

- not_started
- in_review
- accepted
- needs_correction
- not_applicable

## Create/Update Rule

Checklist creation must be reliable.

If checklist does not exist:

- create it

If checklist already exists:

- update it

Do not create duplicate checklist rows for the same application/student.

After save:

- the student file must show updated checklist values
- the checklist list page should not still show Not Created for that application if it was created

## Navigation Rule

Checklist should not be a primary daily workflow nav item.

If Checklists still appears in Module Views, it can remain as a secondary admin-wide list page, but normal work should happen inside the student file.

Do not delete the route.

## Role Rules

### Sales

Sales can:

- view student file checklist summary
- update sales intake checklist
- mark not_sure if unsure

Sales cannot:

- update official admin checklist
- approve academic requirement
- approve English requirement

### Admin and Super Admin

Admin and super_admin can:

- view and update sales checklist if needed
- create/update official checklist
- approve or mark correction status

### Viewer

Viewer can:

- read only

Viewer cannot:

- update checklist

## Contract Direction

Contract readiness should later use the official admin checklist, not the sales checklist.

Do not change contract template in this ticket.

## Not Included

Do not implement:

- document changes
- fee changes
- batch transfer changes
- contract template changes
- PDF export
- Adobe
- DocuSign
- transcript module
- Excel import
- delete/archive controls

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- student file shows Sales Intake Checklist
- student file shows Official Admin Checklist
- sales checklist can be created and updated
- official admin checklist can be created and updated by admin/super_admin
- checklist list page no longer incorrectly shows Not Created after creation
- no duplicate checklist rows are created
- sales cannot approve official checklist
- viewer is read-only
- checklist route remains working
- checklist is no longer treated as primary daily workflow
- no document/fee/batch/contract changes are made
- no long em dash characters are introduced
- no emojis are added
- `npm run lint` passes
- `npm run build` passes