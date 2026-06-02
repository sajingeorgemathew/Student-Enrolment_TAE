# FINANCE-05 - Finance Receipt Registry UI

## Goal

Create the admin-only Finance Receipt Registry UI.

This page will show generated receipt records across all students with search and filtering.

This ticket does not implement receipt generation yet.

## Blueprint Source

Use:

- `docs/blueprint/receipt-system-integration.md`
- `docs/blueprint/receipt-pdf-field-map.md`
- `docs/tickets/FINANCE-01-receipt-system-blueprint.md`
- `docs/tickets/FINANCE-02-receipt-data-model-rls.md`
- `docs/tickets/FINANCE-03-receipt-pdf-template-field-map.md`
- `docs/tickets/FINANCE-04-receipt-pdf-overlay-generator.md`

## Scope

Create or improve:

- `/dashboard/admin-tools/finance/receipts`
- receipt registry table
- receipt search/filter UI
- admin-only route guard
- empty state
- basic receipt status display
- links/placeholders for future receipt detail/download if data exists

## Main Rule

Do not implement receipt generation in this ticket.

Do not implement the new receipt form.

Do not implement PDF overlay from the UI.

Do not implement storage upload/download yet.

## Data Source

Use `receipt_records` table if it exists.

If local types do not include `receipt_records`, use a safe typed query pattern consistent with the project.

If the table is missing locally because SQL has not been run, the page should fail gracefully or show a setup message if that is current project pattern.

## Registry Columns

Show:

- Receipt number
- Student name snapshot
- Student number snapshot
- Amount
- Payment date
- Receipt date
- Payment method
- Notes type
- Generated at
- Void status
- Actions placeholder

## Filters

Add simple filters if safe:

- search by receipt number
- search by student name
- search by student number
- payment method
- notes type
- void status

Keep filters simple. Do not overbuild.

## Routes

Expected route:

- `/dashboard/admin-tools/finance/receipts`

If the Finance landing page exists, add a card/link to Receipts.

Do not create receipt detail route unless needed as placeholder.

## Role Rules

Admin/super_admin:

- can access receipt registry

Sales:

- cannot access receipt registry

Viewer:

- cannot access receipt registry

Direct URL access by sales/viewer should be blocked using the current app access pattern.

## Actions

For this ticket:

- no generate action
- no void action
- no regenerate action
- no delete action

If a receipt has `pdf_storage_path`, show a disabled or placeholder action only if download is not implemented yet.

Use clear copy like:

- Download coming later
- Detail coming later

## Not Included

Do not implement:

- receipt generation form
- receipt PDF generation trigger
- receipt storage upload
- receipt download API
- receipt detail page
- void with reason
- student hub receipt summary
- payment import
- contract payment schedule changes
- Word contract changes
- Supabase schema changes
- RLS changes

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- admin/super_admin can access `/dashboard/admin-tools/finance/receipts`
- sales/viewer cannot access the route
- Finance landing links to Receipts
- receipt registry table renders
- empty state renders if no receipts exist
- filters/search render and work if implemented
- no generation action is added
- no PDF/storage action is added
- no student hub changes are made
- no schema/RLS changes are made
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Files created

- `src/features/receipts/actions.ts` - server action `getReceiptRecords(filters)`.
- `src/features/receipts/receipt-filters.tsx` - client filter/search controls.
- `src/app/dashboard/admin-tools/finance/receipts/page.tsx` - registry page.

### Files modified

- `src/app/dashboard/admin-tools/finance/page.tsx` - replaced the placeholder
  with an admin-gated landing that links to the Receipts registry via a card.

### Route added

- `/dashboard/admin-tools/finance/receipts`. No receipt detail route was added;
  the action cell shows placeholder copy only.

### Registry table behavior

- Server component loads records newest first (ordered by `generated_at desc`),
  capped at 200 rows.
- Columns: Receipt No, Student (name snapshot), Student No (number snapshot),
  Amount, Payment Date, Receipt Date, Method, Notes Type, Generated
  (`generated_at` plus generator name resolved from `profiles`), Status
  (Active / Voided based on `voided_at`), and an Actions placeholder.
- Actions column is a placeholder only. It shows "Download coming later" when a
  row has `pdf_storage_path`, otherwise "Detail coming later". No generate,
  void, regenerate, delete, or real download is wired up.
- Empty state renders when no records match. A separate setup state renders if
  the `receipt_records` table is not available (see data source note).

### Filter/search behavior

- Filters are server-side via URL query params, applied in `getReceiptRecords`.
- Text search: receipt number, student name snapshot, student number snapshot
  (case-insensitive `ilike`).
- Selects: payment method (`eq`), notes type (`eq`), void status
  (active = `voided_at is null`, voided = `voided_at is not null`, all = no
  filter).
- A "Clear filters" control resets to the base route when any filter is set.

### Role/access behavior

- Page gated with `isAdminOrSuper(profile?.role)`, matching the existing
  admin-tools pattern. Admin/super_admin see the registry; sales and viewer
  (and any other role) get an access-denied panel on direct URL access.
- The Finance landing card is only rendered for admin/super_admin.
- DB-level RLS from FINANCE-02 enforces access independently of UI gating.

### Data source note

- `receipt_records` is queried untyped through the Supabase client, matching the
  existing `contract_generations` pattern (the project checks in no generated
  `database.types.ts`). No schema or RLS changes were made.
- If the migration has not been applied in an environment, the query error is
  caught and the page shows a graceful setup message instead of throwing. If
  typed access is wanted later, regenerate Supabase types as a follow-up.

### Out of scope (confirmed not implemented)

- Receipt generation, new receipt form, PDF overlay trigger, storage upload,
  download API, void/regenerate/delete, receipt detail page, and the student hub
  receipt section. No Supabase schema, RLS, contract, Word template, or payment
  schedule changes.

### Verification

- `npm run lint` passes.
- `npm run build` passes; `/dashboard/admin-tools/finance/receipts` is listed in
  the build route output.