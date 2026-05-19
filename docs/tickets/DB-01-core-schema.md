# DB-01 - Supabase Core Schema

## Purpose

Create the first database foundation for the Student Enrolment TAE system.

This schema supports:

- staff profiles and roles
- programs
- batches
- student records
- applications/intake records
- admission checklist
- student documents
- optional secure upload links
- sales quotes
- admin fee schedules
- payment installments
- contracts
- contract events
- Resend notification event logs

## Important Product Direction

Supabase is the source of truth.

Excel is only for legacy import, historical reference, export, or reporting.

Sales users should have a simple intake flow.

Admin users complete the official student file, fee schedule, contract readiness, and contract generation.

Adobe or DocuSign is not implemented in this ticket.

## Roles

Initial roles:

- admin
- sales
- viewer

## Friendly Status Language

Use friendly status names:

- New Intake
- Admin Review
- Information Needed
- Ready for Contract
- Contract Generated
- Signature Pending
- Signed
- Archived

Avoid harsh wording like:

- rejected
- sales error
- invalid
- blocked

## Tables Created

- profiles
- programs
- batches
- students
- applications
- admission_checklists
- student_documents
- student_upload_links
- quotes
- fee_schedules
- payment_installments
- contracts
- contract_events
- notification_events

## Signature Strategy

The system supports manual signing first.

Initial workflow:

1. Admin generates contract PDF.
2. Admin sends for signature manually or collects wet signature.
3. Admin uploads signed PDF.
4. System stores signed PDF path in Supabase.
5. Contract status becomes signed_uploaded.

Future workflow:

1. System sends to Adobe or DocuSign by API.
2. Provider webhook updates the contract.
3. System downloads signed PDF and audit trail.
4. Contract status becomes signed_external or stored.

## Document Strategy

Documents may be uploaded by:

- sales user
- admin user
- optional student secure link

All documents are reviewed by admin.

Emails through Resend should only remind admin to check the system. Sensitive documents should not be attached to reminder emails.

## Fee Strategy

Sales can capture:

- price discussed
- deposit discussed
- quote notes

Admin finalizes:

- official tuition
- fees
- discount
- payment before signing
- remaining balance
- installment due dates
- installment amounts

The enrolment contract should use only admin-reviewed fee schedule values.

## RLS Strategy

RLS is enabled on all core tables.

Initial policy direction:

- admin can manage official data
- sales can create and update intake/student/quote/document records
- viewer can read operational records
- contract and fee schedule writes are admin-controlled

## Manual Supabase Actions Required

1. Open hosted Supabase dashboard.
2. Go to SQL Editor.
3. Run the migration SQL from:

`supabase/migrations/20260518_db_01_core_schema.sql`

4. Create the first auth user manually if needed.
5. Insert or update that user's profile with role `admin`.

Example after creating the user in Supabase Auth:

```sql
insert into public.profiles (id, full_name, email, role)
values (
  '5a8041fe-9c4d-43e8-93b2-a0b384ccf7f4',
  'Sajin George Mathew',
  'admin@torontoacademy.ca',
  'admin'
)
on conflict (id) do update
set role = 'admin',
    full_name = excluded.full_name,
    email = excluded.email,
    is_active = true;