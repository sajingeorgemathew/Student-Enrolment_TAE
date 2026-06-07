# BRAND-01 - Portal Favicon and Browser Title

## Goal

Update the browser tab title and app favicon/icon to Toronto Academy branding.

This is a small branding ticket only.

## Required Browser Title

Use:

`Toronto Academy of Education - Portal`

This should appear in the browser tab title.

## Required Icon

Use the Toronto Academy logo/icon already available in the repo.

The favicon/app icon should show correctly in common browsers.

## Scope

Update only:

- app metadata title
- favicon/icon references
- app icon files if needed
- public icon assets if needed

## Likely Files To Inspect

Inspect current Next.js app structure:

- `src/app/layout.tsx`
- `src/app/favicon.ico`
- `src/app/icon.*`
- `public/`
- any existing metadata config

Use the current project pattern.

## Icon Rules

- Use official Toronto Academy branding already in the repo.
- Do not create a new logo from scratch.
- Do not use external downloads.
- If the available logo is JPG and favicon needs PNG/ICO, generate safe derived app icons from the existing repo image.
- Keep file sizes reasonable.
- Do not include huge unnecessary image assets.

## Not Included

Do not change:

- dashboard layout
- sidebar design
- login design
- student hub
- receipts
- contracts
- database
- Supabase
- RLS
- routes
- business logic

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis.

## Acceptance Criteria

- browser tab title shows `Toronto Academy of Education - Portal`
- favicon/browser icon uses Toronto Academy branding
- common icon files are present where Next.js expects them
- build passes
- no unrelated files are changed

## Implementation Notes (final)

### Source logo used
- `public/logo.png` (1024x768) - the official Toronto Academy of Education logo
  already in the repo. Kept in place as the canonical brand asset.

### Title behavior
- `src/app/layout.tsx` metadata `title` set to
  `Toronto Academy of Education - Portal` (plain hyphen, replacing the previous
  `Student Enrolment — TAE`).
- No template/default title was in use; the static title applies to all routes.
- Verified live: rendered `<head>` contains
  `<title>Toronto Academy of Education - Portal</title>`.

### Icon files created (app-router convention, in `src/app/`)
Derived from the navy "T" emblem of `public/logo.png` (emblem cropped from its
detected bounding box and padded with the brand navy `#1E3360` into a centered
square - no wordmark or tagline included):
- `src/app/favicon.ico` - multi-size ICO (16/32/48, RGBA PNG payloads)
- `src/app/icon.png` - 512x512
- `src/app/apple-icon.png` - 180x180

Next.js auto-injects the icon `<link>` tags. Verified live:
`/favicon.ico` 200, `/icon.png` 200, `/apple-icon.png` 200.

### Files changed / removed
- Modified: `src/app/layout.tsx` (title only)
- Replaced: `src/app/favicon.ico` (was the default Next.js icon)
- Created: `src/app/icon.png`, `src/app/apple-icon.png`
- Created: `scripts/gen-icons.mjs` (reproducible derivation script, uses `sharp`)
- Removed: `public/favicon.ico` (would conflict with `src/app/favicon.ico` at
  `/favicon.ico`) and `public/icon.png` (an unused exact duplicate of
  `public/logo.png`)
- Left untouched: `public/Blue logo image.jpg` (used by the sidebar UI)

### Results
- `npm run lint` - passes, no errors
- `npm run build` - succeeds
- No database, Supabase, RLS, routes, or business-logic changes.