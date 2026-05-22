# BLUEPRINT-01 - Production Workflow, Roles, and Student File Hub

## Goal

Define the production workflow for the Student Enrolment TAE system before adding more major features.

This ticket is documentation and planning only.

## Main Product Decision

This is the student record system for TAE.

Supabase is the source of truth.

Excel files are legacy/import/reference/export sources only.

The student detail page should become the main student file hub.

## Local Reference Files

Use these local-only files as references:

- `_reference/source-files/Student Enrolment Contract - Chidi Gloria Arowolo.docx`
- `_reference/source-files/New Master Class List - 2025 - 26 (PSW).xlsx`
- `_reference/source-files/PSW MASTERCLASS LIST- 2025 - 26.xlsx`

Do not commit these files.

Do not copy real student personal data into code, docs, tests, or seed data.

## Current System Pieces Already Built

The system currently has or is moving toward:

- student records
- sales intake
- program and batch management
- documents
- checklist
- fee schedule
- contract preview
- Word contract export
- Supabase backend
- dashboard shell

## Student File Hub Direction

The student detail page should become the main working page.

The student file hub should include:

- student information
- intake/application summary
- program and batch summary
- batch transfer history
- documents
- admission checklist
- English requirement checklist
- fee schedule
- payment installments
- contract Word export
- signed contract upload later
- internal notes
- audit history
- future grades/transcripts

## Main Workflow

Sales flow:

1. Sales creates intake.
2. Sales enters basic student information.
3. Sales enters program interest, batch interest, and price discussed.
4. Sales may upload documents if already available.
5. Sales sends intake to admin review.

Admin flow:

1. Admin reviews intake.
2. Admin completes official student file.
3. Admin confirms program and batch.
4. Admin completes admission and English checklist.
5. Admin reviews documents.
6. Admin finalizes fee schedule.
7. Admin generates Word contract from student file.
8. Admin sends contract externally for signature.
9. Admin uploads signed contract later.

## Contract Direction

Official contract output is Word DOCX only for now.

Do not use browser print as the official output.

Do not add PDF export now.

Do not add Adobe API now.

Do not add DocuSign API now.

Contract generation should live inside the student file hub.

The contract should auto-fill from:

- students
- applications
- programs
- batches
- fee_schedules
- payment_installments
- admission_checklists
- student_documents

Do not create a separate contract retyping workflow.

Known issue to return to later:

- final Word template polish
- academic marker alignment issue
- exact template cleanup

## Roles

Define these roles:

- super_admin
- admin
- sales
- viewer

## Role Rules

### Sales

Sales can:

- create intake
- edit intake before admin review
- upload documents
- view assigned or allowed student files
- send intake to admin review

Sales cannot:

- delete students
- delete documents
- delete batches
- approve fee schedules
- finalize contracts
- manage roles

### Admin

Admin can:

- review intake
- edit official student files
- manage checklist
- manage fees
- manage documents
- generate Word contract
- upload signed contract later
- manage programs and batches
- transfer students between batches

Admin cannot:

- perform hard deletes unless later allowed
- manage super admin role

### Super Admin

Super admin can:

- manage users and roles
- archive or delete records
- delete documents
- delete students
- delete batches
- perform irreversible actions
- access system-level settings

### Viewer

Viewer can:

- read allowed records only

Viewer cannot:

- create
- edit
- delete
- approve
- upload

## Delete and Archive Direction

Use archive-first behavior.

Avoid hard delete in normal workflow.

Hard delete should be reserved for super_admin only.

Future important actions should have audit logs:

- student archived
- student deleted
- document deleted
- batch changed
- batch transferred
- fee approved
- contract generated
- signed contract uploaded

## Document Direction

Documents should be managed mainly inside the student file hub.

Document rules:

- sales/admin can upload documents
- multiple documents per type are allowed
- admin reviews documents
- admin can update status and notes
- delete should be admin or super_admin only
- hard delete should be super_admin only
- bucket must stay private

Document categories should include:

- admission documents
- placement documents
- PLAR
- readmission
- withdrawal
- transcript or Moodle export
- contract documents
- payment proof
- other

## Batch Direction

Programs and batches should replace Excel sheet management.

Batch features needed later:

- batch master view
- morning/evening batch support
- student transfer from one batch to another
- current batch and previous batch tracking
- batch-wise student master list
- export batch list
- connect batch to contracts
- connect batch to grades/transcripts later

## Transcript and Grade Direction

Future transcript module should support:

- Moodle export upload
- grade import
- grade storage per student
- batch-wise grade master view
- transcript generator
- transcript document storage
- student ID based matching
- manual correction workflow

The uploaded HTML tool/readme will be reviewed later before implementing transcript module.

## Security and RLS Direction

A future security ticket should implement:

- super_admin role
- stricter RLS policies
- archive-first behavior
- delete restrictions
- document delete rules
- batch delete rules
- role management restrictions
- audit logs for key actions

## Backup Direction

Before production use, plan:

- Supabase Pro if storage/data grows
- private storage buckets
- scheduled Supabase backups
- data export tools
- batch export
- student export
- document metadata export
- fee schedule export
- contract status export

## Next Tickets After This Blueprint

1. SECURITY-01 - Roles, RLS, and Admin Action Rules
2. STUDENT-03 - Student File Hub
3. REVIEW-01 - Sales to Admin Review Workflow
4. DOCUMENTS-02 - Student File Document Management
5. CONTRACT-03 - Contract Inside Student File
6. BATCH-02 - Batch Master View and Student Transfer
7. BACKUP-01 - Data Backup and Export Strategy
8. TRANSCRIPT-01 - Transcript and Moodle Import Blueprint
9. CONTRACT-02E - Final Word Template Polish

## Not Included In This Ticket

Do not implement:

- database migration
- RLS changes
- UI changes
- document upload changes
- contract export changes
- transcript module
- delete controls

## Acceptance Criteria

- blueprint document is created
- current product direction is clear
- student file hub direction is clear
- roles are defined
- contract location is defined
- batch transfer direction is defined
- document rules are defined
- transcript direction is defined
- security/RLS next steps are defined
- no code changes are made unless needed for docs only
- `npm run lint` passes if run
- `npm run build` passes if run

## Deliverables

Blueprint document: `docs/blueprint/production-workflow-roles-student-file-hub.md`

## Status

Completed: 2026-05-22