# ADMIN-TOOLS-01 - Admin Tools Module Shell

## Goal

Create an admin-only module shell for future production tools.

This ticket only adds navigation and placeholder pages.

Future tools will include:

- Finance and receipts
- Academic records and transcripts
- Placement
- Reports
- Utilities

## Main Rule

Do not implement any receipt, transcript, placement, or report logic in this ticket.

This ticket is only for structure and safe navigation.

## Current Context

The student hub and application workflow have been stabilized.

Completed before this ticket:

- Student Information edit/refresh
- Intake and Program/Batch edit/refresh
- Checklist save state
- Fees save state
- Contract panel state
- Contract download role visibility
- Application status and reopen rules

The next stage is to create a clean admin-only area for future tools so those tools do not get mixed directly into the student hub.

## Scope

Create:

- Admin Tools landing page
- Finance placeholder page
- Academic Records placeholder page
- Placement placeholder page
- Reports placeholder page
- Utilities placeholder page
- Sidebar/navigation entry for Admin Tools if role allows

## Suggested Routes

Use existing project route conventions.

Suggested routes:

- `/dashboard/admin-tools`
- `/dashboard/admin-tools/finance`
- `/dashboard/admin-tools/academic-records`
- `/dashboard/admin-tools/placement`
- `/dashboard/admin-tools/reports`
- `/dashboard/admin-tools/utilities`

## Role Rules

Admin/super_admin:

- can access Admin Tools
- can access all placeholder pages

Sales:

- should not see Admin Tools navigation
- should not access Admin Tools pages

Viewer:

- should not see Admin Tools navigation
- should not access Admin Tools pages

If direct URL access is attempted by sales/viewer, show an access denied message or redirect according to current app pattern.

Do not loosen permissions.

## Page Content

Each page should be simple and production-safe.

Admin Tools landing page should show cards:

- Finance
- Academic Records
- Placement
- Reports
- Utilities

Each card should have short copy saying the module is prepared for future tools.

Finance page copy:

- Receipt generation and payment tools will be added here.

Academic Records page copy:

- Transcript and academic record tools will be added here.

Placement page copy:

- Placement readiness and facility tracking tools will be added here.

Reports page copy:

- Operational reports will be added here.

Utilities page copy:

- Admin utilities will be added here.

## Student Hub Rule

Do not add these tools inside the student hub yet.

Later, student hub can show summaries and links to admin modules, but not in this ticket.

## Not Included

Do not implement:

- receipt generation
- receipt PDFs
- payment imports
- transcript generation
- placement matching
- placement documents
- reports
- utilities
- database migrations
- Supabase schema changes
- RLS changes
- document uploads
- Word contract changes
- contract generation changes
- student hub changes except navigation if required

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

Use clean professional copy.

## Acceptance Criteria

- Admin Tools navigation appears for admin/super_admin only
- sales/viewer do not see Admin Tools navigation
- admin/super_admin can open Admin Tools landing page
- admin/super_admin can open Finance, Academic Records, Placement, Reports, Utilities pages
- sales/viewer direct access is blocked or shows access denied
- no business logic is implemented
- no schema/RLS changes are made
- no student hub workflows are changed
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

Final behavior:

- Added an Admin Tools landing page at `/dashboard/admin-tools` with cards for
  Finance, Academic Records, Placement, Reports, and Utilities. Each card links
  to its placeholder module page and uses the existing dashboard card style.
- Added placeholder pages for Finance, Academic Records, Placement, Reports, and
  Utilities. Each shows short professional copy noting the module is prepared for
  future tools. No business logic is implemented.
- Added an Admin Tools navigation entry to the sidebar primary nav using the
  existing `minRole: "admin"` pattern, so it is visible only to admin and
  super_admin and hidden for sales and viewer.
- Access control reuses the existing `isAdminOrSuper` role helper and the same
  access denied message pattern used by the existing Admin page. Direct URL
  access by sales or viewer shows an access denied message. No role logic was
  loosened and no new role system was created.
- No database, schema, RLS, contract, Word template, or student hub workflow
  changes were made.

Files created:

- `src/app/dashboard/admin-tools/page.tsx`
- `src/app/dashboard/admin-tools/_components/module-placeholder.tsx`
- `src/app/dashboard/admin-tools/finance/page.tsx`
- `src/app/dashboard/admin-tools/academic-records/page.tsx`
- `src/app/dashboard/admin-tools/placement/page.tsx`
- `src/app/dashboard/admin-tools/reports/page.tsx`
- `src/app/dashboard/admin-tools/utilities/page.tsx`

Files modified:

- `src/components/layout/sidebar.tsx`