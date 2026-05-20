# CHECKLIST-01 - Admission and English Requirement Checklist

## Goal

Create the admin checklist workflow for admission readiness.

Admin should be able to track academic requirement, English proficiency requirement, photo ID, address proof, and overall readiness for contract preparation.

## Scope

Build:

- checklist view connected to student/application
- academic requirement section
- English proficiency section
- ID and address proof section
- checklist status controls
- notes fields
- verified by / verified at handling if available
- readiness summary

## Required Routes

- `/dashboard/checklists`
- `/dashboard/checklists/[applicationId]`

If navigation already has no Checklists item, add:

- Checklists

## Data Sources

Use existing tables:

- students
- applications
- programs
- batches
- admission_checklists
- student_documents

## Academic Requirement Options

Admin can select one academic route:

- Canadian secondary school / OSSD
- Foreign credential
- Mature student

Track status:

- not started
- in review
- accepted
- needs correction

Academic notes should be available.

## English Requirement Options

Admin can select one English route:

- IELTS
- TOEFL iBT
- CAEL
- CELPIP
- CLB
- Duolingo
- PTE Academic
- NACC Written Exam
- 2 years Canadian post-secondary study in English
- 2 years international post-secondary study in English
- not required

Track:

- status
- score/result
- notes

## ID and Address Proof

Track:

- photo ID status
- address proof status

Statuses:

- not received
- uploaded
- accepted
- needs correction

## Contract Direction

This checklist supports future contract readiness.

Do not create a separate contract checklist form.

Future contract preparation should pull readiness from:

- students
- applications
- admission_checklists
- student_documents
- fee_schedules
- batches

## Not Included

Do not implement:

- document upload
- student secure upload link
- fee calculator changes
- contract preview
- PDF generation
- Resend
- Adobe
- DocuSign
- Excel import

## Acceptance Criteria

- `/dashboard/checklists` lists applications/students needing checklist review
- `/dashboard/checklists/[applicationId]` shows checklist details
- admin can create checklist if missing
- admin can update academic route/status/notes
- admin can update English route/status/score/notes
- admin can update photo ID and address proof status
- readiness summary displays clearly
- page handles missing documents cleanly
- no emojis
- `npm run lint` passes
- `npm run build` passes