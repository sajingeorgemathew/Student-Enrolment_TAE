# UI-01 - Auth, Admin Shell, and Dashboard

## Goal

Create the first usable app shell for the Student Enrolment TAE system.

## Scope

Build:

- Supabase client helpers
- login page
- logout action
- protected dashboard route
- dashboard shell layout
- sidebar/navigation
- placeholder dashboard pages
- basic profile/role loading

## Required Routes

- `/login`
- `/dashboard`
- `/dashboard/intake`
- `/dashboard/students`
- `/dashboard/batches`
- `/dashboard/documents`
- `/dashboard/fees`
- `/dashboard/contracts`

## Navigation Labels

- Dashboard
- Intake
- Students
- Batches
- Documents
- Fees
- Contracts

## Roles

- admin
- sales
- viewer

## Access Rules

- unauthenticated users go to `/login`
- authenticated users can access `/dashboard`
- role-specific restrictions can stay basic for now

## Supabase Env Variables

Use:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not expose or use `SUPABASE_SERVICE_ROLE_KEY` in frontend code.

## Not Included

Do not implement:

- student CRUD
- intake form
- document upload
- fee calculator
- contract generation
- Resend
- Adobe
- DocuSign

## Acceptance Criteria

- Login page exists
- Dashboard route is protected
- Authenticated user can reach dashboard
- Sidebar layout exists
- Placeholder pages exist
- Supabase helpers exist
- `npm run lint` passes
- `npm run build` passes