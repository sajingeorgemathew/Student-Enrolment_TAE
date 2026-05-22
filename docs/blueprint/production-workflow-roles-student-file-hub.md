# Production Workflow, Roles, and Student File Hub - Blueprint

Status: Active
Ticket: BLUEPRINT-01
Created: 2026-05-22

---

## 1. Supabase as Source of Truth

Supabase is the single source of truth for all student enrolment data.

All student records, applications, programs, batches, fees, documents, contracts, and audit events are stored in and read from the Supabase database.

No Excel file, local spreadsheet, or external system should be treated as the authoritative copy of any record that exists in Supabase.

Current database tables serving as the system of record:

- profiles - staff users and roles
- students - student personal information
- applications - intake and enrolment applications
- programs - program definitions
- batches - batch/cohort definitions
- admission_checklists - admission and English requirement tracking
- student_documents - uploaded document records
- quotes - sales quotes
- fee_schedules - finalized fee breakdowns
- payment_installments - installment payment plans
- contracts - contract records and snapshots
- contract_events - contract audit trail
- notification_events - notification log

---

## 2. Excel as Legacy, Import, Reference, and Export Only

Excel files (.xlsx) serve these purposes only:

- Legacy reference: existing master class lists and historical data
- Import source: bulk data migration from existing spreadsheets
- Export output: admin can export batch lists, student lists, and fee data to Excel for external use
- Offline reference: printed or emailed copies for external parties

Excel files must not be used as the working data source once records exist in Supabase.

Reference files currently available locally:

- New Master Class List - 2025 - 26 (PSW).xlsx
- PSW MASTERCLASS LIST- 2025 - 26.xlsx

These files inform batch structure, student lists, and program details but do not override Supabase records.

---

## 3. Student Detail Page as Main Student File Hub

The student detail page (`/dashboard/students/[studentId]`) is the main working page for each student.

The student file hub consolidates all information and actions for a single student in one location.

Sections the student file hub should contain:

- Student information (personal details, contact, address, immigration status)
- Intake/application summary (status, sales owner, admin owner, dates)
- Program and batch summary (current program, current batch, start/end dates)
- Batch transfer history (previous batches, transfer dates, reasons)
- Documents (uploaded files, review status, categories)
- Admission checklist (photo ID, address proof, academic route, English route)
- English requirement checklist (test type, score, status)
- Fee schedule (tuition breakdown, total fees, payment summary)
- Payment installments (due dates, amounts, notes)
- Contract Word export (generate, download, re-generate)
- Signed contract upload (manual upload of signed copy, upload date, uploader)
- Internal notes (sales notes, admin notes, general notes)
- Audit history (key events logged with timestamps and actors)
- Future: grades and transcripts (Moodle import, grade storage)

The hub replaces navigating to separate pages for each concern. All related data for a student should be accessible from this single page.

---

## 4. Sales Workflow

Sales staff handle initial student intake and early document collection.

Sales flow steps:

1. Sales creates a new intake via the intake form.
2. Sales enters basic student information: name, contact, date of birth, address.
3. Sales enters program interest, batch interest, and price discussed.
4. Sales may upload documents if already available from the student.
5. Sales adds any relevant sales notes.
6. Sales sends the intake to admin review by changing status to `admin_review`.

Sales boundaries:

- Sales works only within the intake form and early document upload.
- Sales cannot finalize fees, generate contracts, or approve checklists.
- Sales can view student files they created or are assigned to.
- Sales cannot delete students, documents, or batches.

Application statuses relevant to sales:

- `new_intake` - sales is working on the intake
- `admin_review` - sales has submitted to admin
- `information_needed` - admin has sent back for more info

---

## 5. Admin Workflow

Admin staff handle review, finalization, and official record completion.

Admin flow steps:

1. Admin reviews the intake submitted by sales.
2. Admin completes the official student file with verified information.
3. Admin confirms the correct program and batch assignment.
4. Admin completes the admission checklist (photo ID, address proof, academic route).
5. Admin completes the English requirement checklist (test type, score, status).
6. Admin reviews all uploaded documents and updates review status.
7. Admin finalizes the fee schedule (tuition, fees, discounts, installments).
8. Admin generates the Word contract from the student file hub.
9. Admin sends the generated contract externally for signature (email, print, or in-person).
10. Admin uploads the signed contract copy back into the student file.

Application statuses relevant to admin:

- `admin_review` - admin is reviewing
- `information_needed` - admin requests more info from sales
- `ready_for_contract` - admin has completed all steps and is ready to generate
- `contract_generated` - Word contract has been generated
- `signature_pending` - contract sent out for signature
- `signed` - signed contract received and uploaded
- `archived` - application is closed or archived

---

## 6. Contract Word Export Location

The Word contract export lives inside the student file hub.

Contract generation is not a separate workflow or separate page. It is an action available on the student detail page when the application status reaches `ready_for_contract` or later.

Contract generation pulls data from:

- students table (name, address, contact, date of birth)
- applications table (status, program, batch references)
- programs table (program name, credential, hours)
- batches table (batch name, dates, schedule, location)
- fee_schedules table (tuition, fees, discounts, totals)
- payment_installments table (due dates, amounts)
- admission_checklists table (academic route, English route)

The generated contract is a Word DOCX file that follows the official TAE enrolment contract template.

The contracts table stores:

- Snapshot of all contract data at generation time
- Path to the unsigned DOCX in storage
- Path to the signed copy after upload
- Generation and signature timestamps
- Status tracking through the contract lifecycle

---

## 7. Official Output is DOCX Only

The official contract output format is Microsoft Word DOCX only for now.

Do not use browser print-to-PDF as the official contract output. Browser rendering is not template-accurate and varies across systems.

Do not add PDF export at this time. PDF generation adds complexity and a dependency without current business need.

Do not add Adobe Sign or DocuSign API integration at this time. The current signature workflow is manual: generate DOCX, send externally, receive signed copy, upload.

Future output formats may include:

- PDF export (when a reliable server-side converter is justified)
- Digital signature integration (when volume justifies the cost)

These are tracked as future enhancements, not current requirements.

---

## 8. Roles

The system defines four roles for staff users.

### super_admin

The highest-privilege role. Reserved for system owners and IT administrators.

Super admin has full access to all system functions including destructive actions, role management, and system-level settings.

Note: The current database schema defines roles as `admin`, `sales`, `viewer` in the profiles table check constraint. Adding `super_admin` requires a schema migration in SECURITY-01.

### admin

The primary operational role. Admin staff handle student file completion, document review, fee finalization, contract generation, and batch management.

Admin has full read/write access to student records and operational features but cannot perform hard deletes or manage the super_admin role.

### sales

The intake and early-stage role. Sales staff create new intakes, enter initial student information, upload early documents, and submit intakes for admin review.

Sales has limited write access scoped to intake creation and early document upload.

### viewer

Read-only access. Viewer can see allowed records but cannot create, edit, delete, approve, or upload anything.

Useful for reporting users, auditors, or stakeholders who need visibility without operational access.

---

## 9. Role Permissions

### Sales permissions

Sales can:

- Create new intake (insert students, insert applications)
- Edit intake before admin review (update applications in `new_intake` or `information_needed` status)
- Upload documents (insert student_documents)
- View assigned or allowed student files (select students, applications)
- Send intake to admin review (update application status to `admin_review`)
- Add sales notes to applications

Sales cannot:

- Delete students
- Delete documents
- Delete batches
- Approve or finalize fee schedules
- Generate or finalize contracts
- Manage roles or profiles
- Access system settings
- Perform any hard delete

### Admin permissions

Admin can:

- Review intakes submitted by sales
- Edit official student files (update students, applications)
- Manage admission checklists (insert, update admission_checklists)
- Manage English requirement checklists
- Manage fee schedules (insert, update fee_schedules)
- Manage payment installments (insert, update, delete payment_installments)
- Manage documents (update review status, add review notes)
- Generate Word contracts
- Upload signed contracts
- Manage programs (insert, update programs)
- Manage batches (insert, update batches)
- Transfer students between batches
- Archive records (update status to `archived`)

Admin cannot:

- Perform hard deletes (unless explicitly allowed in a future ticket)
- Manage the super_admin role
- Delete other admin accounts
- Access system-level settings reserved for super_admin

### Super admin permissions

Super admin can:

- Everything admin can do
- Manage users and assign roles
- Archive or restore records
- Hard delete students
- Hard delete documents
- Hard delete batches
- Perform irreversible actions
- Access system-level settings
- View and manage audit logs

### Viewer permissions

Viewer can:

- Read allowed student records
- Read allowed application records
- Read program and batch information
- Read fee schedules (if allowed)

Viewer cannot:

- Create any record
- Edit any record
- Delete any record
- Approve any record
- Upload any document
- Generate contracts

---

## 10. Archive-First Delete Direction

The system should use archive-first behavior for all record removal.

Normal workflow should never hard delete records. Instead, records are archived by setting their status to `archived` or an equivalent flag.

Hard delete is reserved for super_admin only and should require confirmation.

Archive behavior by record type:

- Students: set a status or flag to archived; student remains in database but is hidden from active views
- Applications: set status to `archived`
- Documents: set review_status to `archived`
- Quotes: set status to `archived`
- Fee schedules: set status to `archived`
- Contracts: set status to `archived`
- Batches: set is_active to false

Future audit log entries for important actions:

- Student archived
- Student hard deleted (super_admin only)
- Document archived
- Document hard deleted (super_admin only)
- Batch deactivated
- Batch hard deleted (super_admin only)
- Student transferred between batches
- Fee schedule approved
- Contract generated
- Signed contract uploaded
- Role changed
- User deactivated

Audit logging is not implemented yet. It is scoped for SECURITY-01.

---

## 11. Document Management Direction

Documents are managed primarily inside the student file hub.

Document upload rules:

- Sales and admin can upload documents
- Multiple documents per type are allowed (for example, multiple placement documents)
- Admin reviews documents and updates review status
- Admin can add review notes
- Delete should be restricted to admin or super_admin
- Hard delete should be restricted to super_admin only
- The storage bucket must remain private (no public URLs)

Document categories:

- Admission documents (photo ID, address proof, academic credentials)
- Placement documents (placement-related forms and records)
- PLAR (prior learning assessment and recognition)
- Readmission (readmission-related documents)
- Withdrawal (withdrawal-related documents)
- Transcript or Moodle export (grade records, Moodle HTML exports)
- Contract documents (generated contracts, signed contracts)
- Payment proof (payment receipts, bank transfers)
- Other (uncategorized documents)

Document review statuses (already in schema):

- `uploaded` - document has been uploaded, not yet reviewed
- `accepted` - admin has reviewed and accepted
- `needs_correction` - admin has flagged an issue
- `archived` - document is archived

---

## 12. Batch Master View Direction

Programs and batches should replace Excel-based class list management.

The batch master view is a future feature that provides:

- A list of all batches per program with student counts
- Morning and evening batch support (class_time field already exists)
- Student list per batch with key details
- Current batch and previous batch tracking per student
- Batch-wise student master list for printing or export
- Export batch list to Excel

Batch management features needed in future tickets:

- Batch master view page
- Morning/evening batch filtering
- Student transfer from one batch to another with history tracking
- Batch connection to contracts (batch appears on generated contract)
- Batch connection to grades and transcripts (future)

The batches table already supports:

- Program association (program_id)
- Date ranges (start_date, expected_end_date, theory dates, practicum dates)
- Schedule details (class_days, class_time)
- Delivery method (in_person, hybrid, online)
- Location details (training_location, practicum locations)

---

## 13. Student Transfer Direction

Students may need to transfer from one batch to another within the same program or across programs.

Transfer requirements:

- Admin initiates the transfer
- The system records the previous batch and the new batch
- Transfer history is stored so that a student's batch history is always visible
- The transfer date is recorded
- An optional transfer reason or note is recorded
- The student's active application updates to reference the new batch
- If a contract was already generated for the old batch, the admin may need to regenerate

Implementation notes for a future ticket:

- A batch_transfers or student_batch_history table may be needed
- The student file hub should display the full batch history
- The batch master view should reflect transfers
- Audit log should record all transfers

---

## 14. Future Transcript and Moodle Import Direction

A future transcript module should support grade management and transcript generation.

Planned capabilities:

- Moodle export upload: admin uploads an HTML or CSV export from Moodle containing student grades
- Grade import: system parses the uploaded export and maps grades to students
- Grade storage: grades are stored per student, per course or module
- Batch-wise grade master view: admin can view all grades for a batch
- Transcript generator: system generates a transcript document per student
- Transcript document storage: generated transcripts are stored as documents in the student file
- Student ID based matching: grades are matched to students by student number or email
- Manual correction workflow: admin can correct grades that were imported incorrectly

An uploaded HTML tool/readme file will be reviewed before implementation.

This module is not in scope until TRANSCRIPT-01.

---

## 15. Security and RLS Next-Ticket Direction

A dedicated security ticket (SECURITY-01) should implement:

- super_admin role addition to the profiles table check constraint
- super_admin-specific RLS policies
- Stricter RLS policies that enforce role boundaries more precisely
- Archive-first behavior enforcement at the database level
- Delete restrictions (block hard delete for non-super_admin)
- Document delete rules (archive by default, hard delete for super_admin)
- Batch delete rules (deactivate by default, hard delete for super_admin)
- Role management restrictions (only super_admin can assign roles)
- Audit log table and trigger functions for key actions
- Row-level visibility rules (sales sees only assigned students, viewer sees only allowed records)

Current RLS state:

- RLS is enabled on all tables
- Basic policies exist for admin, sales, and viewer
- Admin has full write access to most tables
- Sales has write access to students, applications, documents, quotes, and upload links
- Viewer has read access to most tables
- No super_admin role exists yet
- No delete restrictions exist at the RLS level
- No audit logging exists yet

---

## 16. Backup and Export Direction

Before production use, the following backup and export capabilities should be planned:

Supabase infrastructure:

- Evaluate Supabase Pro plan if storage or data volume grows beyond free tier limits
- Ensure all storage buckets remain private
- Enable scheduled Supabase backups (available on Pro plan)

Data export tools:

- Student list export (CSV or Excel)
- Batch student list export (CSV or Excel)
- Document metadata export (list of documents per student, without file contents)
- Fee schedule export (fee breakdowns per student or batch)
- Contract status export (contract lifecycle status per student)
- Full database export for archival purposes

These export tools should be available to admin and super_admin roles.

Backup and export features are scoped for BACKUP-01.

---

## 17. Next Ticket Order

The following tickets should be completed after this blueprint, in this recommended order:

1. SECURITY-01 - Roles, RLS, and Admin Action Rules
   - Add super_admin role to schema
   - Tighten RLS policies per role
   - Add archive-first enforcement
   - Add delete restrictions
   - Add audit log foundation

2. STUDENT-03 - Student File Hub
   - Build the consolidated student detail page
   - Add all hub sections (info, application, program, batch, documents, checklist, fees, contract, notes)
   - Make it the primary working page

3. REVIEW-01 - Sales to Admin Review Workflow
   - Implement status transitions for intake to admin review
   - Add notification or indicator for admin when intake is submitted
   - Add information-needed flow back to sales

4. DOCUMENTS-02 - Student File Document Management
   - Improve document management inside the student file hub
   - Add document category filtering
   - Add delete restrictions per role
   - Add archive behavior for documents

5. CONTRACT-03 - Contract Inside Student File
   - Move contract generation into the student file hub
   - Add signed contract upload
   - Connect contract status to application status

6. BATCH-02 - Batch Master View and Student Transfer
   - Build batch master view page
   - Add student transfer between batches
   - Add batch history tracking
   - Add batch list export

7. BACKUP-01 - Data Backup and Export Strategy
   - Plan backup approach
   - Build data export tools
   - Document recovery procedures

8. TRANSCRIPT-01 - Transcript and Moodle Import Blueprint
   - Plan transcript module
   - Review Moodle export format
   - Design grade storage schema

9. CONTRACT-02E - Final Word Template Polish
   - Fix academic marker alignment issue
   - Clean up exact template formatting
   - Final template QA pass
