# STUDENT-01 - Student Records List and Detail

## Goal

Create the student record area so admin and staff can view student records created from intake.

This is part of replacing Excel with the system as the source of truth.

## Scope

Build:

- student records list page
- student detail page
- basic search/filter on student records
- student profile summary
- linked application/intake summary
- linked batch/program summary
- linked quote summary if available
- linked document summary placeholder
- linked contract readiness placeholder

## Required Routes

- `/dashboard/students`
- `/dashboard/students/[studentId]`

## Student List

Show:

- student number
- legal full name
- email
- phone
- city
- province
- latest application status
- program
- batch
- created date

## Student Detail Page

Show sections:

- Student Information
- Contact Information
- Application / Intake Summary
- Program and Batch
- Quote / Price Discussed
- Admission Checklist Placeholder
- Documents Placeholder
- Contract Readiness Placeholder

## Important Product Rule

This system replaces Excel as the student record source of truth.

Do not make the contract a separate retyping workflow.

Future contract generation should pull from:

- students
- applications
- programs
- batches
- quotes
- fee schedules
- admission checklists
- documents

## Data Access

Use existing Supabase auth/profile helpers.

Read from:

- students
- applications
- programs
- batches
- quotes
- admission_checklists
- student_documents
- contracts

If some related records do not exist yet, show clean empty states.

## Not Included

Do not implement:

- student edit form
- delete student
- document upload
- checklist editing
- fee calculator
- contract generation
- Resend
- Adobe
- DocuSign
- Excel import

## Acceptance Criteria

- `/dashboard/students` lists student records
- `/dashboard/students/[studentId]` shows student details
- Empty states are handled cleanly
- Page does not crash if related data is missing
- UI is clean and professional
- No emojis
- `npm run lint` passes
- `npm run build` passes