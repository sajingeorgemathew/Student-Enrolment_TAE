# STUDENT-03 - Student File Hub

## Goal

Make the student detail page the main working center for each student.

The student file hub should bring together student information, intake/application, batch, documents, checklist, fees, contract Word export, and notes in one place.

## Scope

Improve:

- `/dashboard/students/[studentId]`

Build student file hub sections:

- Student Summary
- Intake and Application
- Program and Batch
- Documents
- Admission and English Checklist
- Fees and Payment Schedule
- Contract Word Export
- Internal Notes placeholder
- Activity or Audit placeholder

## Main Product Rule

The student detail page is the main student file.

Staff should not need to jump between many separate pages to understand the student record.

Other pages can still exist as list/admin pages, but the student file hub should become the central workflow.

## Required Sections

### 1. Student Summary

Show:

- student number
- legal full name
- preferred name
- date of birth
- phone
- alternate phone
- email
- address
- immigration status
- international student
- notes

Include an edit action if existing edit behavior is already available.

### 2. Intake and Application

Show:

- application status
- lead source
- sales owner if available
- admin owner if available
- price discussed
- deposit discussed
- sales notes
- admin notes
- created date
- submitted to admin date if available

### 3. Program and Batch

Show:

- program name
- program code
- credential
- total hours
- theory hours
- practicum hours
- batch name
- start date
- expected end date
- delivery method
- training location
- practicum locations

Add links:

- Edit Batch
- View Batch

Use existing routes if available.

### 4. Documents

Show all documents for this student.

Requirements:

- show all documents, not only latest
- group or label by document type
- show review status
- show upload date
- show uploaded by type
- link to document detail
- add Upload Document button with student preselected

Upload link:

`/dashboard/documents/new?studentId=<studentId>`

### 5. Checklist

Show admission checklist summary:

- photo ID status
- address proof status
- academic route
- academic status
- English route
- English status
- English score
- notes if available

Add link:

- Edit Checklist

Use existing checklist route if available.

### 6. Fees and Payment Schedule

Show:

- fee schedule status
- tuition fee
- total fees
- payment before signing
- payment after signing
- remaining balance
- number of installments
- installment rows

Add link:

- Edit Fees

Use existing fee route if available.

### 7. Contract Word Export

Show contract area inside the student file.

Show:

- contract readiness summary
- Generate Word Contract action if already available
- link to contract preview if existing

Important:

- official output is Word DOCX only
- do not add PDF export
- do not add Adobe or DocuSign

### 8. Internal Notes Placeholder

Add placeholder section only.

Do not build full notes system yet.

### 9. Activity or Audit Placeholder

Add placeholder section only.

Do not build full audit UI yet.

## Role Direction

Use existing role helpers if available.

For now:

- super_admin and admin can see all sections
- sales can see student info, intake, documents, and basic status
- viewer can read only

Do not overbuild role-specific UI in this ticket.

## UI Direction

Use clean section cards or grouped panels.

Keep the page practical and easy for staff.

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Not Included

Do not implement:

- delete controls
- hard delete
- full role management
- batch transfer
- full notes system
- full audit UI
- signed contract upload
- Adobe
- DocuSign
- PDF export
- transcript module
- Excel import

## Acceptance Criteria

- `/dashboard/students/[studentId]` becomes the main student file hub
- student summary appears
- intake/application summary appears
- program/batch summary appears
- all student documents appear
- upload document link preselects the student
- checklist summary appears
- fee/payment schedule summary appears
- contract Word export area appears
- internal notes placeholder appears
- activity/audit placeholder appears
- no PDF export added
- no delete controls added
- no long em dash characters are introduced in touched UI copy
- no emojis
- `npm run lint` passes
- `npm run build` passes