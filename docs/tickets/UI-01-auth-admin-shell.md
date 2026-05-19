# UI-01 - Auth, Admin Shell, and Dashboard

## Goal

Create the first usable app shell for the Student Enrolment TAE system.

This ticket should build the foundation for login, protected admin pages, role-aware layout, and dashboard navigation.

## Scope

Build:

- Supabase client helpers
- login page
- logout action
- protected dashboard route
- admin shell layout
- basic sidebar/navigation
- dashboard cards/placeholders
- role-aware page protection

## Required Routes

Create or organize these routes:

- `/login`
- `/dashboard`
- `/dashboard/intake`
- `/dashboard/students`
- `/dashboard/batches`
- `/dashboard/documents`
- `/dashboard/fees`
- `/dashboard/contracts`

The pages can be placeholders for now.

## Navigation Labels

Use these labels:

- Dashboard
- Intake
- Students
- Batches
- Documents
- Fees
- Contracts

## Roles

Use the DB-01 roles:

- admin
- sales
- viewer

## Access Rules

For UI-01:

- unauthenticated users go to `/login`
- authenticated users can access `/dashboard`
- role-specific restrictions can be basic for now
- no public student upload page yet

## Supabase

Use environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not use the service role key in frontend code.

## Design Direction

Keep the design clean and professional.

No emojis.

Use a simple admin dashboard style suitable for Toronto Academy of Education.

## Not Included

Do not implement:

- database mutations
- student CRUD
- intake form
- document upload
- fee calculator
- contract generation
- Resend notifications
- Adobe or DocuSign

## Acceptance Criteria

- Login page exists
- Dashboard route is protected
- Authenticated user can reach dashboard
- Sidebar/dashboard layout exists
- Placeholder pages exist
- Supabase browser/server helpers exist
- `npm run lint` passes
- `npm run build` passes