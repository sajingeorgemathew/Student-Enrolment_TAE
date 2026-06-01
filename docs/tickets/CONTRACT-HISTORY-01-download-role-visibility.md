# CONTRACT-HISTORY-01 - Contract Download Role Visibility

## Goal

Control who can see and download generated contract history from the student hub.

This ticket fixes contract download visibility only.

## Current Issue

Generated contracts are currently downloadable by sales users from the student hub contract history.

That may be too much access for sales.

## Product Decision

Admin/super_admin:

- can see generated contract history
- can download generated contracts
- can generate contracts if current rules allow

Sales:

- can see contract status
- can see whether a contract has been generated if current student hub visibility already allows
- cannot download generated contracts
- cannot generate contracts

Viewer:

- read-only
- can see basic contract status if current student hub visibility already allows
- cannot download generated contracts
- cannot generate contracts

## Scope

Fix only:

- generated contract history download button/link visibility
- generated contract download route access if needed
- role checks around contract history downloads

## Important Security Rule

Do not rely only on hiding the button in the UI.

If there is an API route for downloading generated contracts, add a server-side role guard too.

Sales/viewer should not be able to download a generated contract by manually opening the URL if the product rule blocks them.

## Allowed Roles For Contract Download

Allowed:

- admin
- super_admin

Blocked:

- sales
- viewer
- unknown/unauthenticated users

## Not Included

Do not change:

- Word contract template
- DOCX generation content
- contract panel refresh behavior
- generated contract history creation
- generated contract records table
- student information
- intake
- program/batch
- checklist
- documents
- fees
- review workflow
- archive/delete
- application status/reopen rules
- PDF export
- Adobe/DocuSign

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- admin/super_admin can see download links for generated contracts
- admin/super_admin can download generated contracts
- sales cannot see generated contract download links
- sales cannot download generated contracts through direct URL/API access
- viewer cannot see generated contract download links
- viewer cannot download generated contracts through direct URL/API access
- sales/viewer can still see basic contract status if already allowed
- contract generation still works for admin/super_admin
- no Word template changes are made
- no unrelated student hub sections are changed
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Files modified

- `src/features/contracts/contract-generation-history.tsx` - added `canDownload` prop; download links only render when `canDownload` is true
- `src/app/dashboard/students/[studentId]/page.tsx` - passes `canDownload={isAdmin}` to `ContractGenerationHistory`
- `src/app/api/documents/download/route.ts` - added server-side role guard; paths containing `/contracts/` require admin or super_admin role, returns 403 for other roles

### Behavior

- Admin/super_admin: download links visible in contract generation history, download works via API
- Sales: contract generation history visible (status info), download links hidden, direct API access returns 403
- Viewer: contract generation history visible (status info), download links hidden, direct API access returns 403
- Unauthenticated: API returns 401
- Non-contract document downloads are not affected (role guard only applies when path includes `/contracts/`)
- No Word template changes
- No contract generation content changes
- No contract panel refresh behavior changes