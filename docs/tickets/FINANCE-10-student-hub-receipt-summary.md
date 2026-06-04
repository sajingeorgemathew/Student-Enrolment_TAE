# FINANCE-10 - Student Hub Receipt Summary Section

## Goal

Add a receipt summary section to the student hub.

The student hub should show receipts that belong only to the current student.

Full receipt generation, edit, hard delete, and registry controls remain in the Finance module.

## Current Context

Completed before this ticket:

- FINANCE-01 - Receipt system blueprint
- FINANCE-02 - Receipt data model and RLS
- FINANCE-03 - Receipt PDF template and field map
- FINANCE-04 - Receipt PDF overlay generator
- FINANCE-05 - Finance receipt registry UI
- FINANCE-06 - New receipt generation flow
- FINANCE-06-FIX - Receipt PDF calibration
- FINANCE-07 - Receipt storage and download
- ADMIN-SIGNATURE-01 - Signature upload and management
- FINANCE-08 - Receipt signature selection and overlay
- FINANCE-09 - Receipt edit and hard delete controls

## Main Rule

Do not turn the student hub into the full receipt registry.

The student hub should show a student-specific summary only.

Receipt edit and hard delete controls should stay in the Finance registry/edit pages.

## Scope

Add only:

- Receipts summary section inside student hub
- latest receipt summary
- total receipt count for this student
- total receipted amount for this student
- list of recent receipts for this student
- download link if role allows
- link to Finance receipt registry filtered by this student if safe
- admin/super_admin link to create a new receipt for this student

## Placement

Place the Receipts section near Fees and Contract in the student hub.

Recommended placement:

- after Fees
- before Contract

## Student Hub Receipt Summary

Show:

- total receipts
- total receipted amount
- latest receipt number
- latest receipt date
- latest payment method
- latest amount
- status if receipt is voided or not applicable later
- recent receipt list

Recent receipt list should include:

- receipt number
- payment date
- amount
- payment method
- notes type
- generated at
- download action if allowed

## Role Rules

Admin/super_admin:

- can view receipt summary
- can download stored receipts
- can open Finance receipt registry
- can open New Receipt page for this student
- cannot hard delete directly from student hub in this ticket
- cannot edit directly from student hub in this ticket unless linking to Finance edit page is clearly safe

Sales:

- visibility should follow current finance role direction
- recommended for now: no download and no generation
- if shown, only summary/status
- no edit
- no hard delete

Viewer:

- read-only only
- recommended for now: no receipt download
- no generation
- no edit
- no hard delete

Do not loosen permissions.

## Generate Link Behavior

Admin/super_admin should have a button/link:

- Generate Receipt

It should open:

`/dashboard/admin-tools/finance/receipts/new?studentId={studentId}`

If the new receipt form does not support preselected student yet, add support only if small and safe.

If not safe, link to the new receipt form normally and document limitation.

## Finance Registry Link

Admin/super_admin can have a link:

- View all receipts in Finance

Preferred:

`/dashboard/admin-tools/finance/receipts?studentId={studentId}`

If receipt registry does not support studentId filter yet, add it only if small and safe.

Otherwise link to registry and document limitation.

## Download Behavior

Use the existing receipt download behavior from FINANCE-07.

Admin/super_admin:

- can download receipt if pdf_storage_path exists

Sales/viewer:

- do not add download unless current role rules explicitly allow

Direct download route must remain protected.

## Not Included

Do not implement:

- receipt edit inside student hub
- receipt hard delete inside student hub
- receipt voiding
- batch receipt generation
- payment import
- new receipt data model changes
- PDF overlay changes
- signature upload changes
- contract payment schedule changes
- Word contract changes
- application workflow changes

## Refresh Behavior

If a receipt is generated from the linked form and the user returns to the student hub, the receipt summary should reflect the latest data.

Do not build live real-time refresh in this ticket.

## UI Copy Rule

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis or decorative symbols.

## Acceptance Criteria

- student hub shows Receipts section
- section only shows receipts for current student
- total receipt count is correct
- total receipted amount is correct
- latest receipt is shown
- recent receipt list is shown
- admin/super_admin can download stored receipts from student hub
- admin/super_admin can open New Receipt for this student
- sales/viewer do not gain receipt generation/edit/delete access
- edit/delete controls remain in Finance module
- no receipt PDF logic is changed
- no schema/RLS changes are made
- no contract logic is changed
- `npm run lint` passes
- `npm run build` passes

## Implementation Notes

### Files created

- `src/features/receipts/student-receipt-summary.tsx` - server component that
  renders the student hub Receipts section (totals, latest receipt, recent
  list, and the admin-only download/generate/registry links).

### Files modified

- `src/features/receipts/actions.ts` - added `getStudentReceiptSummary(studentId)`
  and a `studentId` field on `ReceiptFilters` (so `getReceiptRecords` can scope
  to one student).
- `src/app/dashboard/students/[studentId]/page.tsx` - fetches the summary and
  mounts the Receipts section after Fees and Payment Schedule and before
  Contract Readiness.
- `src/features/receipts/new-receipt-actions.ts` - added
  `getReceiptStudentById(studentId)` (admin-gated) to resolve one student for
  the preselect flow.
- `src/app/dashboard/admin-tools/finance/receipts/new/page.tsx` - reads the
  `studentId` query param and passes the resolved student to the form.
- `src/features/receipts/new-receipt-form.tsx` - accepts an optional
  `initialStudent` and preselects it, loading the next receipt sequence on mount.
- `src/app/dashboard/admin-tools/finance/receipts/page.tsx` - honors the
  `studentId` query param and shows a "Showing receipts for ... only" banner
  with a "Show all receipts" reset link.

### Student hub receipt summary behavior

- The section shows only receipts for the current student
  (`receipt_records.student_id = studentId`).
- Shows total receipt count, total receipted amount (sum of non-voided
  amounts), and the latest receipt (most recently generated).
- Recent receipts list (capped at 5, newest first by `generated_at`) shows
  receipt number, payment date, amount, payment method, notes type, generated
  at plus generator name, status (Active / Voided), and a download action.
- Data is server-rendered on page load. There is no live refresh. Returning
  from the receipt form to the hub re-renders the server component, so a newly
  generated receipt appears as the latest receipt.

### Role / access behavior

- The summary itself is read-only and visible to all roles. This does not
  loosen permissions: the `receipt_records_select_staff` RLS policy
  (FINANCE-02) already allows super_admin, admin, sales, and viewer to read.
- Admin / super_admin: see the totals and recent list, can download stored
  receipts, see the Generate Receipt button, and see the View all in Finance
  link.
- Sales / viewer: see the read-only summary and recent list only. No download,
  no Generate Receipt, no registry link, no edit / delete / void / regenerate.
- Edit, hard delete, void, and regenerate are not present in the student hub;
  they remain in the Finance module (FINANCE-09).

### Generate / registry link behavior

- Generate Receipt links to
  `/dashboard/admin-tools/finance/receipts/new?studentId={studentId}`. The new
  receipt form now preselects the student from this param (admin-gated via
  `getReceiptStudentById`) and loads its next sequence. The admin can still
  change the student in the form.
- View all in Finance links to
  `/dashboard/admin-tools/finance/receipts?studentId={studentId}`. The registry
  applies a server-side `student_id` filter, shows a banner naming the student,
  and offers a "Show all receipts" link to clear the scope. The visible filter
  controls do not expose `studentId`; it is preserved when other filters change
  and cleared by "Clear filters" / "Show all receipts".

### Download behavior

- Reuses the FINANCE-07 route `GET /api/receipts/download?id={receiptId}`,
  which is admin/super_admin only and validates `pdf_storage_path`. A download
  link is rendered only for admin/super_admin and only when the receipt has a
  stored PDF; otherwise admins see "Download unavailable" and sales/viewer see
  no action. Storage RLS independently blocks sales/viewer.

### Limitations

- "Latest" and the recent list order by `generated_at` (most recently created),
  matching the registry ordering, not by payment date.
- Voided receipts are excluded from the total receipted amount but still
  counted and listed for audit. Voiding is not implemented anywhere yet, so in
  practice no receipt is currently voided.
- The per-student query is capped at 100 receipts for the totals; this is far
  above any realistic per-student receipt count.

### Verification

- `npm run lint` passes.
- `npm run build` passes; the student hub, new receipt, and registry routes are
  all present in the build output.