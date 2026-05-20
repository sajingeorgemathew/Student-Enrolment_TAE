# FEES-01 - Quote and Fee Schedule Calculator

## Goal

Create the quote and fee schedule workflow.

Sales quote information should flow into an admin-side fee calculator, and the final approved fee schedule should later auto-fill the enrolment contract.

## Scope

Build:

- quote display from sales intake/application
- admin fee schedule page
- fee calculator form
- payment installment generator
- fee schedule approval flow
- fee schedule detail view
- clean validation for totals

## Required Routes

- `/dashboard/fees`
- `/dashboard/fees/[applicationId]`

## Data Sources

Use existing tables:

- students
- applications
- programs
- batches
- quotes
- fee_schedules
- payment_installments

## Sales Quote Data

Display sales-entered values:

- price discussed
- deposit discussed
- payment notes
- quote notes
- sales notes

Sales data should be shown as reference only.

## Admin Fee Calculator Fields

Admin can finalize:

- tuition fee
- book fee
- compulsory fee
- field trip fee
- uniform/equipment fee
- professional exam fee
- expendable supplies fee
- international fee
- optional fee
- discount amount
- payment before signing
- number of installments
- first installment due date
- installment frequency
- notes

## Calculator Logic

Calculate:

- total fees
- remaining balance
- installment amount
- installment due dates
- installment rows

Formula direction:

Total fees =
tuition + book + compulsory + field trip + uniform/equipment + professional exam + expendable supplies + international + optional - discount

Remaining balance =
total fees - payment before signing

Installments =
remaining balance divided by number of installments

## Validation

Prevent approval if:

- total fees is below 0
- payment before signing is greater than total fees
- remaining balance does not match installment total
- installment count is invalid
- due dates are missing when installments exist

## Contract Direction

The enrolment contract should later pull the fee/payment section from:

- fee_schedules
- payment_installments

Do not create a separate contract fee typing workflow.

## Statuses

Use existing status values if available:

- draft
- admin_review
- approved
- archived

## Not Included

Do not implement:

- payment receipt tracking
- actual payment collection
- Stripe
- document upload
- checklist editing
- contract preview
- PDF generation
- Resend
- Adobe
- DocuSign
- Excel import

## Acceptance Criteria

- `/dashboard/fees` lists applications needing or having fee schedules
- `/dashboard/fees/[applicationId]` shows student/application quote context
- admin can create or update a fee schedule
- installment rows can be generated
- fee totals are validated
- approved fee schedule is saved
- existing fee schedule can be viewed
- no contract retyping workflow is created
- no emojis
- `npm run lint` passes
- `npm run build` passes