# INTAKE-01 - Sales Intake Form MVP

## Goal

Create the first sales intake workflow.

The sales team should be able to enter a student intake simply and send it to admin review.

## Scope

Build:

- intake list page
- new intake form
- basic student creation
- application/intake creation
- quote discussion fields
- friendly status handling
- submit to admin review action

## Route

Use:

- `/dashboard/intake`
- `/dashboard/intake/new`

## Sales Intake Fields

Student basics:

- first name
- middle name
- last name
- phone
- alternate phone
- email
- date of birth
- address line 1
- address line 2
- city
- province
- postal code
- country

Program/batch interest:

- program
- batch
- lead source

Price discussion:

- price discussed
- deposit discussed
- payment notes
- sales notes

## Status

New record starts as:

- `new_intake`

When submitted to admin:

- `admin_review`

Use friendly UI wording:

- New Intake
- Admin Review
- Information Needed
- Ready for Contract

## Important Rule

Sales intake should be simple.

Do not make this feel like an approval restriction.

Use wording like:

- Send to Admin Review
- Forward to Admissions Admin
- Notes for Admin

## Contract Direction

This ticket should support future auto-filled contract generation.

Do not make a separate contract form.

The contract later should pull from:

- student record
- application/intake
- batch
- fee schedule
- checklist

## Not Included

Do not implement:

- document upload
- student secure upload link
- fee calculator
- contract preview
- PDF generation
- Resend
- Adobe
- DocuSign

## Acceptance Criteria

- `/dashboard/intake` shows intake records
- `/dashboard/intake/new` allows creating an intake
- Student record is created
- Application/intake record is created
- Sales quote fields are saved
- Intake can be sent to admin review
- `npm run lint` passes
- `npm run build` passes