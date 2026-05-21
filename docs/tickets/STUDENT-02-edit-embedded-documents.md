# STUDENT-02 - Student Detail Edit and Embedded Documents

## Goal

Improve the student detail page so it becomes the main student file page.

Admin and staff should be able to view and edit student information, view all uploaded documents, and upload documents from the student detail page without going through separate manual steps.

## Scope

Build:

- student edit section on student detail page
- embedded document list on student detail page
- document upload link from student detail page with student preselected
- show all documents for the student, not only the latest document
- group or clearly label documents by document type
- keep multiple documents per document type visible
- keep existing document detail and review workflow
- remove long em dash characters from frontend UI copy where touched

## Required Routes

Use existing routes:

- `/dashboard/students/[studentId]`
- `/dashboard/documents/new?studentId=<id>`
- `/dashboard/documents/[documentId]`

If needed, add:

- `/dashboard/students/[studentId]/edit`

Only add the edit route if it keeps the code cleaner.

## Student Edit Fields

Allow editing:

- student number
- first name
- middle name
- last name
- preferred name
- date of birth
- phone
- alternate phone
- email
- mailing address line 1
- mailing address line 2
- city
- province
- postal code
- country
- immigration status
- international student
- notes

## Embedded Documents Section

On the student detail page, show:

- document type
- file name
- related application if available
- review status
- uploaded date
- uploaded by type
- action link to view document detail

Important:

- show all documents for the student
- do not replace older documents visually
- if multiple documents have the same type, show all of them
- sort newest first

## Document Upload Shortcut

On student detail page, add:

- Upload Document button

This should link to:

`/dashboard/documents/new?studentId=<studentId>`

The document upload form should preselect the student when `studentId` query param exists.

## UI Copy Rule

Avoid long em dash characters.

Use normal hyphens only.

Avoid decorative symbols or AI-looking punctuation in frontend copy.

## Contract Direction

The student detail page is the source student file page.

Future contract generation should auto-fill from:

- students
- applications
- programs
- batches
- fee_schedules
- payment_installments
- admission_checklists
- student_documents

Do not create a separate contract retyping workflow.

## Not Included

Do not implement:

- delete student
- delete batch
- super admin controls
- storage cleanup
- Resend notifications
- contract preview
- PDF generation
- Adobe
- DocuSign
- Excel import

## Acceptance Criteria

- student detail page shows editable student information
- student edits save successfully
- student detail page shows all documents for the student
- multiple documents of same type are visible
- upload document button preselects the student
- document detail links work
- no long em dash characters are introduced in touched frontend copy
- no emojis
- `npm run lint` passes
- `npm run build` passes