# DASHBOARD-01 - Premium Dashboard Shell MVP

## Goal

Create a polished MVP dashboard landing page and global shell style inspired by the provided Stitch mockup.

This is a visual/design ticket only.

## Design References

Use these local reference files:

- `public/Blue logo image.jpg`
- `public/code.html`
- `public/screen.png`

Use them for inspiration only.

Do not copy the HTML directly into the app.

## Main Product Rule

Use the existing Next.js, TypeScript, Tailwind, and app structure.

Do not break existing routes, auth, role filtering, sidebar logic, or module pages.

## Scope

Apply design polish to:

- dashboard landing page
- main layout shell if needed
- sidebar visual style if safe
- dashboard cards
- dashboard header area

Keep all existing navigation routes working.

## Inspiration Direction

Use the reference design style:

- dark navy institutional sidebar
- gold accent from logo
- clean white/light background
- premium rectangular cards
- strong typography
- academic/institutional tone
- clear module cards for Programs, Batches, Students, Intakes, Admin
- secondary cards for Fees, Checklists, Contracts
- Toronto Academy branding using the blue logo

## Logo

Use:

- `public/Blue logo image.jpg`

Do not fetch external logo URLs.

Use Next Image or normal image rendering according to the current project pattern.

## Required Dashboard Cards

Primary cards:

- Programs
- Batches
- Students
- Intakes
- Admin

Secondary cards:

- Fees
- Checklists
- Contracts

Cards must link to the existing routes.

Do not invent new routes.

## Role Rules

Respect existing role visibility.

If current role logic hides Admin for sales/viewer, preserve that.

Do not expose admin-only actions to sales/viewer.

## Copy Direction

Use professional but simple copy.

Avoid over-AI wording.

Avoid long em dash characters.

Avoid emojis.

Avoid decorative symbols.

## Not Included

Do not implement:

- database changes
- Supabase changes
- contract changes
- document workflow changes
- checklist workflow changes
- fee workflow changes
- archive/delete changes
- transcript module
- Excel import
- new authentication logic
- new role system
- destructive actions

## Acceptance Criteria

- dashboard visually resembles the provided reference
- existing sidebar/navigation continues working
- dashboard cards link to existing routes
- role-based visibility remains intact
- no route is broken
- no workflow logic is changed
- no external logo URL is used
- no Stitch HTML is pasted directly as production code
- no emojis are added
- no long em dash characters are added
- `npm run lint` passes
- `npm run build` passes