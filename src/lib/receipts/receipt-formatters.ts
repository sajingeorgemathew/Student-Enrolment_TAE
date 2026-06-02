// Receipt PDF overlay generator - formatting helpers.
//
// FINANCE-04. Pure string helpers, no PDF dependency, so they can be unit
// tested and reused by the registry/form tickets (FINANCE-05/06).
//
// Style: normal hyphens and a forward slash only. No em dashes, no emojis.

import type {
  ReceiptNotesType,
  ReceiptPaymentMethod,
} from "./receipt-types";
import { isCardPaymentMethod } from "./receipt-types";

const STUDENT_PREFIX = "125";

// The receipt template preprints "Receipt No: PSW-12500-25-". Only the dynamic
// suffix is overlaid, so the generator strips this static prefix.
const RECEIPT_NUMBER_PREFIX = "PSW-12500-25-";

// ---------------------------------------------------------------------------
// Receipt number
// ---------------------------------------------------------------------------

// Format: PSW-12500-25-{digits_after_125}-{sequence}
//
// Rules (FINANCE-04 ticket):
// - student number normally starts with 125
// - remove the starting 125
// - keep whatever remains, preserving leading zeros
// - sequence is two digits
//
// Fallback: if the student number does not start with 125, the whole student
// number (digits only) is used as the remainder, so the receipt still has a
// stable, unique-per-student value. This is documented in the ticket notes.
export function formatReceiptNumber(
  studentNumber: string,
  sequence: number
): string {
  const digits = String(studentNumber ?? "").replace(/\D/g, "");
  const remainder = digits.startsWith(STUDENT_PREFIX)
    ? digits.slice(STUDENT_PREFIX.length)
    : digits;
  const seq = String(sequence).padStart(2, "0");
  return `${RECEIPT_NUMBER_PREFIX}${remainder}-${seq}`;
}

// Strip the static "PSW-12500-25-" prefix that the template already prints, so
// the generator overlays only the dynamic "{remainder}-{seq}" portion. If the
// value does not carry the known prefix it is returned unchanged.
export function formatReceiptNumberSuffix(receiptNumber: string): string {
  const value = String(receiptNumber ?? "");
  return value.startsWith(RECEIPT_NUMBER_PREFIX)
    ? value.slice(RECEIPT_NUMBER_PREFIX.length)
    : value;
}

// ---------------------------------------------------------------------------
// Student number display
// ---------------------------------------------------------------------------

// The numeric student number only, with any "PSW" prefix and separators
// removed. Handles "125315", "PSW125315", and "PSW 125315" -> "125315".
// The template preprints the "PSW" label on the Student No line, so the
// generator overlays this numeric value (never a second "PSW").
export function formatStudentNumberValue(studentNumber: string): string {
  return String(studentNumber ?? "").replace(/\D/g, "");
}

// Full display string "PSW 125315" for UI contexts that have no preprinted
// "PSW" label. Normalizes any input form so the prefix is never doubled.
export function formatStudentNumberDisplay(studentNumber: string): string {
  const value = formatStudentNumberValue(studentNumber);
  return value ? `PSW ${value}` : "PSW";
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

// Parse a date-only or full ISO string into DD-MM-YYYY without timezone drift.
function toDdMmYyyy(dateStr: string): string {
  if (!dateStr) return "";
  const dateOnly = String(dateStr).split("T")[0];
  const d = new Date(dateOnly + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// Top date overlay: just the real date "DD-MM-YYYY".
//
// The template already prints the literal "(DD-MM-YYYY)" hint after the
// "Date of Receipt:" blank, so the overlay must add only the real date.
// The visible line reads "Date of Receipt: 02-07-2025 (DD-MM-YYYY)".
export function formatReceiptTopDate(paymentDate: string): string {
  return toDdMmYyyy(paymentDate);
}

// Bottom date overlay: just the real date "DD-MM-YYYY".
//
// The template preprints the "Date:" label in the signature footer, so the
// overlay adds only the date value. The visible line reads "Date: 02-07-2025".
export function formatReceiptBottomDate(paymentDate: string): string {
  return toDdMmYyyy(paymentDate);
}

// ---------------------------------------------------------------------------
// Amount
// ---------------------------------------------------------------------------

// Clean currency, e.g. "$677.00" or "$1,250.00". No "CAN " prefix.
export function formatAmount(amount: number): string {
  const num = Number(amount);
  const safe = isNaN(num) ? 0 : num;
  const formatted = safe.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted}`;
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

// The template preprints the "Notes:" label, so the overlay adds only the
// value text. The visible line reads "Notes: Enrolment fee".
const NOTES_TEXT: Record<ReceiptNotesType, string> = {
  enrolment_fee: "Enrolment fee",
  installment_payment: "Installment payment",
  late_fee_payment_installment_payment:
    "Late fee payment / Installment payment",
};

export function formatNotes(notesType: ReceiptNotesType): string {
  return NOTES_TEXT[notesType] ?? "";
}

// ---------------------------------------------------------------------------
// Payment method marker resolver
// ---------------------------------------------------------------------------

// Logical checkbox slots on the receipt. The generator maps each to a
// coordinate; this resolver decides which are checked and whether the card
// holder name line is used.
export type ReceiptMarkerState = {
  debitCredit: boolean;
  debit: boolean;
  masterCard: boolean;
  visa: boolean;
  amex: boolean;
  paypal: boolean;
  eTransfer: boolean;
  chequeBankDraft: boolean;
  cash: boolean;
  // True when the card holder name line should carry the student name.
  showCardHolderName: boolean;
};

export function resolvePaymentMarkers(
  method: ReceiptPaymentMethod
): ReceiptMarkerState {
  const state: ReceiptMarkerState = {
    debitCredit: false,
    debit: false,
    masterCard: false,
    visa: false,
    amex: false,
    paypal: false,
    eTransfer: false,
    chequeBankDraft: false,
    cash: false,
    showCardHolderName: false,
  };

  if (isCardPaymentMethod(method)) {
    state.debitCredit = true;
    state.showCardHolderName = true;
    if (method === "debit") state.debit = true;
    if (method === "master_card") state.masterCard = true;
    if (method === "visa") state.visa = true;
    if (method === "amex") state.amex = true;
    return state;
  }

  switch (method) {
    case "cash":
      state.cash = true;
      break;
    case "e_transfer":
      state.eTransfer = true;
      break;
    case "paypal":
      state.paypal = true;
      break;
    case "cheque_bank_draft":
      state.chequeBankDraft = true;
      break;
  }
  return state;
}
