# BATCH-01 - Program and Batch Management

## Goal

Create admin pages to manage programs and batches inside the system.

This replaces Excel-sheet-based batch management and supports future auto-filled enrolment contracts.

## Scope

Build:

- program list page
- program create/edit form
- batch list page
- batch create/edit form
- active/inactive status handling
- batch details needed for contract auto-fill

## Required Routes

- `/dashboard/programs`
- `/dashboard/programs/new`
- `/dashboard/programs/[programId]/edit`
- `/dashboard/batches`
- `/dashboard/batches/new`
- `/dashboard/batches/[batchId]/edit`

## Program Fields

Use the existing `programs` table.

Fields:

- program code
- program name
- credential name
- total hours
- theory hours
- practicum hours
- default tuition
- default registration fee
- default book fee
- default compulsory fee
- default professional exam fee
- active/inactive

## Batch Fields

Use the existing `batches` table.

Fields:

- program
- batch name
- batch code
- start date
- expected end date
- theory start date
- theory end date
- practicum start date
- practicum end date
- class days
- class time
- delivery method
- training location
- practicum 1 location
- practicum 2 location
- notes
- active/inactive

## Contract Direction

Future contract generation should pull program and batch data from these tables.

Do not create a separate contract typing workflow.

Batch data should later auto-fill:

- program start date
- expected completion date
- schedule
- delivery method
- training location
- practicum locations
- program hours
- credential

## Access

Admin can create and edit programs and batches.

Sales/viewer can read programs and batches if needed.

## Not Included

Do not implement:

- student intake changes
- student record editing
- document upload
- fee calculator
- contract preview
- PDF generation
- Resend
- Adobe
- DocuSign
- Excel import

## Acceptance Criteria

- `/dashboard/programs` lists programs
- admin can create a program
- admin can edit a program
- `/dashboard/batches` lists batches
- admin can create a batch
- admin can edit a batch
- program selector works on batch form
- active/inactive status works
- missing data shows clean empty states
- no emojis
- `npm run lint` passes
- `npm run build` passes
