@'
# FINANCE-11 - Receipt Address and Editable Sequence

## Goal

Update the student receipt PDF address and allow receipt sequence numbers to be edited safely.

This is a small finance module fix.

## Required Changes

### 1. Receipt footer address

Update the receipt footer address everywhere the student receipt PDF renders.

New address:

75 Watline Avenue, Unit #101  
Mississauga, ON L4Z 3E5

Keep all other receipt layout, wording, numbering, generation, storage, download, and student hub behavior unchanged.

### 2. Editable receipt sequence number

Admin/super_admin should be able to edit the receipt sequence number after it has been assigned.

Rules:

- positive integer only
- recompute receipt number using existing receipt numbering format
- block duplicate receipt numbers within the existing receipt number scope
- allow changing sequence back to the original value if available
- preserve same student/payment/receipt linkage
- do not change payment amount
- do not change fee schedule
- regenerate or refresh stored PDF only if current architecture requires it

## UI Requirements

Add editable sequence control only for admin/super_admin.

Suggested copy:

- Receipt sequence
- Update sequence
- Sequence updated successfully
- This receipt number is already used

Use normal hyphens only.

Do not use long em dash characters.

Do not use emojis.

## Server Rules

Server action must:

1. Load the existing receipt.
2. Validate the new sequence is a positive integer.
3. Recompute the receipt number using the existing numbering helper.
4. Check for duplicate receipt number excluding the current receipt.
5. Update the receipt sequence and receipt number.
6. Regenerate or refresh stored PDF if required by current architecture.
7. Return success or a clear error.

## Not Included

Do not implement:

- new receipt format
- new payment system
- receipt deletion changes
- receipt amount editing
- student hub redesign
- fee schedule changes
- contract changes
- academic records changes
- transcript changes
- Moodle import changes

## Acceptance Criteria

- receipt PDF footer shows 75 Watline Avenue, Unit #101, Mississauga, ON L4Z 3E5
- no other receipt layout or calculation behavior changes
- admin/super_admin can edit receipt sequence
- admin/super_admin can change a sequence back to the original value if it is available
- duplicate receipt numbers are blocked
- invalid sequence values are blocked
- receipt number is recomputed using existing format
- existing receipt linkage to student/payment is preserved
- students/sales/viewers cannot edit receipt sequence
- npm run lint passes
- npm run build passes
'@ | Set-Content -Path "docs/tickets/FINANCE-11-receipt-address-editable-sequence.md"