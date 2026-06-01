# Receipt System Integration Blueprint

Source ticket: `docs/tickets/FINANCE-01-receipt-system-blueprint.md`

This is a planning document only. No tables, generators, overlays, storage,
forms, UI, or migrations are created by this ticket. Everything below is a
recommendation for future implementation tickets.

---

## 1. Purpose and Boundaries

Receipts are finance records that confirm a payment was received from a
student. They are separate from the contract payment schedule.

- The contract payment schedule (`fee_schedules`, `payment_installments`)
  stays part of the enrolment contract and is not changed by this work.
- Receipts are new finance records linked to a student file.
- The student hub shows only receipts that belong to that student.
- The Finance module gives admin a workspace to search, filter, generate,
  view, download, and manage receipts across all students.

Receipts must not alter, depend on, or write back to the contract workflow,
the Word contract templates, or the payment schedule logic.

---

## 2. Current App Structure (verified)

Routing and conventions the receipt system must align with.

### Dashboard and admin tools routes

- `src/app/dashboard/admin-tools/page.tsx` - module grid, gated by
  `isAdminOrSuper(profile?.role)`. Finance is already a tile pointing to
  `/dashboard/admin-tools/finance`.
- `src/app/dashboard/admin-tools/finance/page.tsx` - currently a
  `ModulePlaceholder` titled "Finance". This is the natural mount point.
- Sibling modules: `academic-records`, `placement`, `reports`, `utilities`.

### Student hub

- `src/app/dashboard/students/page.tsx` - student list.
- `src/app/dashboard/students/[studentId]/page.tsx` - student file hub. It is
  a server component that loads everything through `getStudentById(studentId)`
  and renders ordered sections (Student Information, Sales Intake, Program and
  Batch, Documents, Official Checklist, Fees and Payment Schedule, Contract
  Readiness, Contract - Word Export, then admin-only Internal Notes and
  Archive). Receipts should slot in as a new section near the Fees and
  Contract sections.

### Document and storage patterns

- Storage bucket `student-documents` created in
  `supabase/migrations/20260519_docs_01_storage_policies.sql`. Bucket is
  private (`public = false`); access is via RLS. Staff (any role) can read,
  sales and admin can insert, admin can update and delete.
- `student_documents` table stores `storage_bucket`, `storage_path`,
  `file_name`, plus review and uploader metadata.
- Download flows through `src/app/api/documents/download/route.ts`.
- Contract generation tracking precedent:
  `contract_generations` table (migration
  `20260526_contract_04f_generation_history.sql`) records `student_id`,
  `application_id`, `generated_by`, `generated_at`, `file_name`,
  `storage_path`, `status`. The receipt records table should mirror this
  shape and its RLS style.

### Role helpers

- `src/lib/roles.ts`: `AppRole = super_admin | admin | sales | viewer`, with
  `isSuperAdmin`, `isAdminOrSuper`, `isSalesOrAdmin`, `canManageRecords`.
- `src/lib/profile.ts`: `getUserProfile()` for the current user.
- DB-side helpers: `get_my_role()`, `is_admin()`, `is_sales_or_admin()`, and
  (added later) `is_admin_or_super_admin()` used by `contract_generations`.

### Existing student / application / program / batch / fee data structure

From `supabase/migrations/20260518_db_01_core_schema.sql`:

- `students` - has `student_number` (text, unique) and generated
  `legal_full_name`.
- `applications` - links `student_id`, `program_id`, `batch_id`, plus status.
- `programs`, `batches` - reference data.
- `fee_schedules` (per application) and `payment_installments` (per fee
  schedule) - the contract payment schedule. Receipts reference these for
  context only; they do not write to them.
- `contracts` - shows the snapshot pattern (denormalized `*_snapshot`
  columns) used so a generated document stays stable even if source rows
  change later. Receipts should reuse this snapshot idea.

### PDF tooling currently available

- `package.json` has `docxtemplater` + `pizzip` for DOCX. There is no PDF
  library installed. A PDF overlay approach will need a new dependency (see
  section 9).

### Reference file note

- Ticket names `_reference/source-files/receipts/toronto-academy-receipt-template.pdf`.
- The file actually present is
  `_reference/source-files/receipts/2nd_july_2025_12552_PSW-12500-25-52-01.pdf`.
- That sample confirms the numbering rule: student `12552` -> strip `125` ->
  `52` -> first receipt `PSW-12500-25-52-01`. Treat this PDF as the visual
  target. A future ticket should add a clean, value-free copy as the overlay
  template (section 8).

---

## 3. Receipt Rules (captured from ticket)

These are the business rules the generator ticket must implement. Documented
here so they are not lost.

### Receipt number rule

Format: `PSW-12500-25-{digits_after_125}-{sequence}`

1. Take the student ID (student number).
2. Remove the leading `125`.
3. Keep the remaining digits, preserving leading zeros.
4. Append the per-student receipt sequence as two digits.

Examples:

- `125191` first -> `PSW-12500-25-191-01`, second -> `PSW-12500-25-191-02`
- `12505` first -> `PSW-12500-25-05-01`, second -> `PSW-12500-25-05-02`
- `1257` first -> `PSW-12500-25-7-01`

Sequence is per student, in order (`01`, `02`, `03`, ...).

### Student number display rule

On the receipt, Student No shows the PSW prefix: `Student No: PSW 125191`.
Never display the bare `125191`.

### Date format rule

- Top date: `DD-MM-YYYY (DD-MM-YYYY)`, for example `19-12-2025 (DD-MM-YYYY)`.
- Bottom date near signature: `Date: 19-12-2025`.
- Use the actual payment date entered or selected by admin. Never generate
  random dates.

### Payment method rule

Options: Debit/Credit Card type (Monnex: Debit, Master Card, Visa, Amex),
Paypal, E-transfer/Interac to admin@torontoacademy.ca, Cheque/Certified Bank
draft to Toronto Academy of Education, Cash.

- Cash must appear on every receipt as an overlay if it is not part of the
  template, and is checked only for cash payments.
- Cash payment: Cash checked, all others unchecked.
- E-transfer: E-transfer checked, Cash and card options unchecked.
- Card: main Debit/Credit Card checked, only the selected card type checked,
  student name printed on the Card Holder Name line and nowhere else.
- Paypal: only Paypal checked.
- Cheque/Certified Bank draft: only that option checked.

### Checkbox rule

Exactly one primary method is checked per receipt. For card, additionally
exactly one card type is checked. All other boxes stay unchecked.

### Notes wording

Allowed values, displayed exactly:

- `Notes: Enrolment fee`
- `Notes: Installment payment`
- `Notes: Late fee payment / Installment payment`

### Signature image rule

- Use a signature image only. Do not print a typed signer name.
- Approved images:
  - Signature A: `https://res.cloudinary.com/dfxihtsvj/image/upload/v1780005334/Screenshot_2025-04-05_144725_fbqubx.png`
  - Signature B: `https://res.cloudinary.com/dfxihtsvj/image/upload/v1780054291/signature_sgm__4_-removebg-preview_fttasu.png`
- Place in a fixed overlay position. The signature must not push other
  content down.

### PDF overlay rule

Use the original receipt PDF as a background/template and overlay only dynamic
values. Do not rebuild or redesign the receipt. Preserve header, footer,
payment option layout, signature area, and original appearance. Overlay
fields: Receipt No, Student Name, Student No, Total amount Paid, Date of
Receipt, payment method checkmarks, Card Holder Name (card only), Cash line,
Notes, Signature image, Bottom date.

### Production flow

For live receipts, the amount, payment date, payment method, card type, and
notes type are entered or selected by admin. The number and sequence are
derived. The PDF is generated by overlaying these values on the template.

---

## 4. Navigation Placement

### Finance module (admin tools)

- Mount under the existing Finance tile.
- `/dashboard/admin-tools/finance` - finance landing, links to Receipts.
- `/dashboard/admin-tools/finance/receipts` - receipt registry across all
  students (search, filter, list).
- `/dashboard/admin-tools/finance/receipts/new` - create a new receipt
  record and generate the PDF.
- Future: `/dashboard/admin-tools/finance/receipts/[receiptId]` - receipt
  detail, download, and void.

Whole module gated by `isAdminOrSuper`, matching `admin-tools/page.tsx`.

### Student hub

- Add a "Receipts" section to
  `src/app/dashboard/students/[studentId]/page.tsx`, placed after Fees and
  Payment Schedule and before or near the Contract section.
- The section shows a summary only (section 5), not the full registry.
- Admin/super_admin get a "Generate Receipt" entry point from here later
  (deep-link to the finance new-receipt route prefilled with the student).
- Sales and viewer do not see generation actions.

---

## 5. Student Hub Receipt Summary

The student hub section shows only this student's receipts:

- Latest receipt (receipt number, amount, payment date, method, void status).
- Total receipts count.
- Total receipted amount (sum of non-voided receipt amounts).
- Per-row download link (admin/super_admin; others per final policy).
- "Generate Receipt" action for admin/super_admin only.

Voided receipts are visually flagged and excluded from the total receipted
amount, but still listed for audit.

---

## 6. Finance Registry Design

A cross-student receipt registry at
`/dashboard/admin-tools/finance/receipts`.

- Server component loads receipts via a finance action, newest first.
- Table columns: Receipt No, Student Name, Student No, Program, Batch, Amount,
  Payment Date, Receipt Date, Method, Notes Type, Generated By, Status
  (Active / Voided).
- Row actions: View, Download, Void (admin/super_admin).
- Pagination or capped page size for large data sets.
- Mirrors the existing list and table styling used in the student hub
  Documents table.

### Filters and search

Per ticket, filters include:

- Student name (text search on `legal_full_name`)
- Student number
- Batch
- Program
- Receipt number
- Payment date (range)
- Receipt date (range)
- Payment method
- Notes type
- Generated by
- Void status (active / voided / all)

Search should be server-side against indexed columns where possible
(`student_id`, `batch_id`, `program_id`, `payment_date`, `receipt_date`,
`receipt_number`).

---

## 7. Recommended Data Model

Do not create this yet. This is the recommendation for the later DB ticket.

### Table: `receipt_records`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | `default gen_random_uuid()` |
| `receipt_number` | text unique | derived, format `PSW-12500-25-{rem}-{seq}` |
| `student_id` | uuid not null | fk `students(id)` on delete restrict |
| `application_id` | uuid | fk `applications(id)` on delete set null |
| `batch_id` | uuid | fk `batches(id)` on delete set null |
| `program_id` | uuid | fk `programs(id)` on delete set null |
| `amount` | numeric(12,2) not null | total amount paid |
| `payment_date` | date not null | actual date payment received |
| `receipt_date` | date not null | date printed on receipt |
| `payment_method` | text not null | check constraint, see below |
| `card_type` | text | only when method is card |
| `notes_type` | text not null | check constraint, see below |
| `pdf_storage_bucket` | text | e.g. `receipt-documents` |
| `pdf_storage_path` | text | null when metadata-only MVP |
| `receipt_sequence` | integer not null | per-student sequence (the `{seq}`) |
| `student_name_snapshot` | text | name at generation time |
| `student_number_snapshot` | text | student number at generation time |
| `generated_by` | uuid not null | fk `profiles(id)` on delete set null |
| `generated_at` | timestamptz not null | `default now()` |
| `voided_at` | timestamptz | null until voided |
| `voided_by` | uuid | fk `profiles(id)` on delete set null |
| `void_reason` | text | required when voided |
| `created_at` | timestamptz not null | `default now()` |
| `updated_at` | timestamptz not null | `default now()`, trigger |

Rationale for additions beyond the ticket list: `receipt_sequence` makes the
numbering and gap-correction logic queryable without parsing the number
string; the two `*_snapshot` columns follow the `contracts` snapshot pattern
so a generated receipt stays accurate even if the student record changes.

### Constraints

- `payment_method in ('card', 'paypal', 'e_transfer', 'cheque', 'cash')`.
- `card_type is null or card_type in ('debit', 'master_card', 'visa', 'amex')`;
  enforce `card_type is not null` only when `payment_method = 'card'`.
- `notes_type in ('enrolment_fee', 'installment_payment', 'late_fee_installment')`.
- Unique on `(student_id, receipt_sequence)` to prevent duplicate sequence.
- Unique on `receipt_number`.

### Indexes

- `student_id`, `application_id`, `batch_id`, `program_id`,
  `payment_date desc`, `receipt_date desc`, `receipt_number`,
  partial index on `voided_at`.

### Relationship to identifiers

- `student_id` - the owning student file; drives the student hub view and the
  numbering remainder.
- `application_id` - which enrolment the payment relates to (the active
  application); nullable so a receipt survives application changes.
- `batch_id`, `program_id` - denormalized for registry filtering and reporting
  without extra joins; captured at generation time.

### Optional companion: `receipt_events`

Mirror `contract_events` for an audit trail (created, generated, downloaded,
voided). Optional for MVP; recommended for production.

---

## 8. Receipt Numbering Logic

- Remainder: take `student_number`, strip the leading `125`, keep the rest
  with leading zeros intact. Treat `student_number` as a string, not an
  integer, so `12505` keeps `05`.
- Sequence: next value is `max(receipt_sequence) + 1` for that `student_id`,
  formatted as two digits.
- Compose: `PSW-12500-25-{remainder}-{sequence}`.

### Sequence correction approach

- The auto-generated sequence is a default, not a lock.
- Admin can override the sequence when filling a historical gap. Example: a
  student has `...-05-01`, `...-05-02`, `...-05-04`; admin may create
  `...-05-03` rather than being forced to `...-05-05`.
- The `unique(student_id, receipt_sequence)` constraint and the unique
  `receipt_number` prevent collisions. The generator proposes the next free
  sequence but accepts an admin-supplied value, validating it is not already
  used for that student.

---

## 9. PDF Template and Overlay Approach

### Template location recommendation

- Store the value-free overlay template at
  `src/templates/receipts/toronto-academy-receipt-template.pdf`, matching the
  existing `src/templates/contracts/` convention.
- Keep the sample
  `_reference/source-files/receipts/2nd_july_2025_12552_PSW-12500-25-52-01.pdf`
  as the visual reference only.
- A future ticket should produce the clean template (no sample student
  values) from the reference.

### Overlay generator approach

- No PDF library is currently installed. Recommend adding `pdf-lib` (pure JS,
  works in the Next.js server runtime, can load an existing PDF and draw text
  and images on top). This is an overlay library, not a redesign tool, which
  matches the "do not rebuild" rule.
- Generator (`src/lib/generate-receipt-pdf.ts`, future) loads the template
  PDF, then draws only dynamic values at fixed coordinates: receipt number,
  student name, `PSW <number>` student line, amount, top date, payment method
  checkmarks, card holder name (card only), cash line, notes, bottom date.
- Signature is drawn as an embedded image at a fixed position from one of the
  two approved Cloudinary URLs (fetched and embedded), never as text, and must
  not shift layout.
- A coordinate field map (similar to
  `docs/blueprint/contract-template-field-map.md`) should be produced in the
  generator ticket so positions are documented and reviewable.

---

## 10. Storage Strategy

Two options from the ticket, compared:

### Option 1 - Metadata only plus immediate download

- Save the receipt record, generate the PDF on demand, stream it for
  download. Nothing stored in object storage.
- Pros: simplest, no new bucket or storage RLS, no file lifecycle to manage.
- Cons: the exact PDF is not preserved; regeneration must be deterministic;
  re-download depends on snapshots staying intact.

### Option 2 - Metadata plus generated PDF in Supabase Storage

- Save the record and upload the generated PDF to a private
  `receipt-documents` bucket; store `pdf_storage_path`.
- Pros: the issued document is preserved exactly, downloadable from both the
  student hub and the registry, supports void-with-reason while keeping the
  original file for audit.
- Cons: needs a new bucket plus storage RLS, and file size/lifecycle
  management.

### Recommendation

Target Option 2 for production, following the `student-documents` bucket
pattern: a private `receipt-documents` bucket, staff read, admin/super_admin
write and delete, with downloads brokered through a server route like
`src/app/api/documents/download/route.ts`. If the generator lands before the
bucket, ship Option 1 first (metadata plus immediate download, `pdf_storage_path`
null) and add storage in a follow-up, since the data model already allows a
null path.

---

## 11. Roles and Permissions

Aligned with `src/lib/roles.ts` and existing RLS style.

- Admin / super_admin: create receipt records, generate PDFs, view, download,
  and void with reason. Insert/update gated by an `is_admin_or_super_admin()`
  style policy (the same helper `contract_generations` uses).
- Sales: no generation, no voiding. Read/view to be decided in a later ticket;
  default to no receipt access until decided.
- Viewer: read-only or no access per current role policy; no generation, no
  download unless explicitly allowed later.
- The finance module routes are gated by `isAdminOrSuper` at the page level,
  matching `admin-tools/page.tsx`.
- DB-level RLS must enforce these rules independently of UI gating, mirroring
  the `contract_generations` policies (staff select, admin-or-super insert and
  update, no delete in MVP).

---

## 12. Void and Regenerate Rules

- Receipts are not hard-deleted in MVP. Voiding is a soft action:
  set `voided_at`, `voided_by`, and a required `void_reason`.
- Only admin/super_admin can void.
- Voided receipts stay listed (for audit) but are excluded from the student
  hub total receipted amount and flagged in the registry.
- Regenerate: regenerating the PDF for an existing record must keep the same
  `receipt_number` and `receipt_sequence`. To correct a wrong amount or
  method, void the old receipt and issue a new one rather than silently
  editing an issued receipt.
- A receipt number, once issued, is never reused even if voided. Sequence
  correction (section 8) fills gaps for missing receipts, not for voided ones.

---

## 13. Filter and Search Design

Covered in section 6. Summary of the indexed/searchable fields the registry
relies on: `student_id`, `student_number_snapshot`, `batch_id`, `program_id`,
`receipt_number`, `payment_date`, `receipt_date`, `payment_method`,
`notes_type`, `generated_by`, and void status. Free-text student search runs
against `students.legal_full_name`.

---

## 14. Next Implementation Tickets (recommended order)

1. FINANCE-02 - Receipt data model and RLS. Create `receipt_records`
   (and optional `receipt_events`), constraints, indexes, RLS following the
   `contract_generations` pattern. No UI.
2. FINANCE-03 - Receipt PDF template and field map. Add the clean overlay
   template under `src/templates/receipts/` and document overlay coordinates.
3. FINANCE-04 - Receipt PDF overlay generator. Add `pdf-lib`, build
   `generate-receipt-pdf.ts`, implement numbering, checkbox, signature image,
   and date formatting rules. Metadata plus immediate download (storage
   Option 1).
4. FINANCE-05 - Finance receipt registry UI. Routes
   `/dashboard/admin-tools/finance` and `.../receipts`, list, filters, search.
5. FINANCE-06 - New receipt form and generation flow.
   `.../receipts/new`, admin entry, sequence correction support.
6. FINANCE-07 - Storage and download. Private `receipt-documents` bucket,
   storage RLS, save PDF, download from hub and registry (storage Option 2).
7. FINANCE-08 - Student hub receipt summary section. Latest receipt, totals,
   admin generate entry point.
8. FINANCE-09 - Void with reason. Soft-void flow, registry flagging, audit
   event, total exclusion.

---

## 15. Acceptance Criteria Mapping

- Receipt rules documented: sections 3, 8.
- Receipt number logic documented: sections 3, 8.
- Student hub placement documented: sections 4, 5.
- Finance registry placement documented: sections 4, 6, 13.
- PDF overlay approach documented: sections 3, 9.
- Storage options compared: section 10.
- Admin-only rules documented: sections 11, 12.
- Next implementation tickets listed: section 14.
- No business logic implemented, no schema changes, no contract workflow
  changed: confirmed; this document is the only deliverable.
