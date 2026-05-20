# UI-02 - Auth Profile Handling

## Goal

Strengthen Supabase authentication and profile/role handling after the basic dashboard shell.

## Scope

Build or improve:

- server-side session helpers
- browser Supabase helper
- profile loading helper
- role loading from `profiles`
- clean logout flow
- dashboard user display
- fallback handling when profile is missing
- redirect behavior for unauthenticated users

## Required Behavior

- Unauthenticated users are redirected to `/login`
- Authenticated users can access `/dashboard`
- App loads the user profile from `profiles`
- If profile is missing, show a clear setup message
- Logout ends the Supabase session and redirects to `/login`
- No service role key is used in frontend code

## Roles

Use existing DB-01 roles:

- admin
- sales
- viewer

## Not Included

Do not implement:

- sales intake form
- student CRUD
- document upload
- fee calculator
- contract generation
- Resend
- Adobe
- DocuSign

## Acceptance Criteria

- Auth helpers are organized
- Profile helper exists
- Dashboard can show logged-in user/profile information
- Missing profile state is handled cleanly
- Logout works
- `npm run lint` passes
- `npm run build` passes