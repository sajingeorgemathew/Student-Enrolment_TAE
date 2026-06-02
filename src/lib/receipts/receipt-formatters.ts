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
  return `PSW-12500-25-${remainder}-${seq}`;
}

// ---------------------------------------------------------------------------
// Student number display
// ---------------------------------------------------------------------------

// Always "PSW 125191", never bare "125191".
export function formatStudentNumberDisplay(studentNumber: string): string {
  const value = String(studentNumber ?? "").trim();
  if (!value) return "PSW";
  // Avoid doubling the prefix if a caller already passed "PSW 125191".
  if (/^PSW\b/i.test(value)) {
    return `PSW ${value.replace(/^PSW\s*/i, "")}`;
  }
  return `PSW ${value}`;
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

// Top date: "DD-MM-YYYY (DD-MM-YYYY)".
//
// The reference receipt shows the real date followed by a literal "(DD-MM-YYYY)"
// hint. Until calibration confirms whether the second segment is a real second
// date, we reproduce the reference layout: real date plus the literal hint.
export function formatReceiptTopDate(paymentDate: string): string {
  const real = toDdMmYyyy(paymentDate);
  if (!real) return "";
  return `${real} (DD-MM-YYYY)`;
}

// Bottom date: "Date: DD-MM-YYYY".
export function formatReceiptBottomDate(paymentDate: string): string {
  const real = toDdMmYyyy(paymentDate);
  if (!real) return "Date:";
  return `Date: ${real}`;
}

// ---------------------------------------------------------------------------
// Amount
// ---------------------------------------------------------------------------

// Canadian currency, e.g. "CAN $1,250.00".
export function formatAmount(amount: number): string {
  const num = Number(amount);
  const safe = isNaN(num) ? 0 : num;
  const formatted = safe.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `CAN $${formatted}`;
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

const NOTES_TEXT: Record<ReceiptNotesType, string> = {
  enrolment_fee: "Notes: Enrolment fee",
  installment_payment: "Notes: Installment payment",
  late_fee_payment_installment_payment:
    "Notes: Late fee payment / Installment payment",
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
