// Receipt PDF overlay generator - shared types.
//
// FINANCE-04. See docs/blueprint/receipt-pdf-field-map.md and
// docs/blueprint/receipt-system-integration.md for the source rules.

export type ReceiptPaymentMethod =
  | "cash"
  | "e_transfer"
  | "debit"
  | "master_card"
  | "visa"
  | "amex"
  | "paypal"
  | "cheque_bank_draft";

export type ReceiptNotesType =
  | "enrolment_fee"
  | "installment_payment"
  | "late_fee_payment_installment_payment";

// FINANCE-08. Mime types the receipt generator can embed. pdf-lib supports PNG
// and JPEG only; WebP is not embeddable and is rejected before generation.
export type ReceiptSignatureMimeType = "image/png" | "image/jpeg";

// FINANCE-08. Optional signature image to overlay on the receipt. The caller
// (the generation route) loads the selected admin signature from the private
// admin-signatures bucket and passes the raw bytes plus mime type. The
// generator never prints a typed signer name.
export type ReceiptSignatureImage = {
  bytes: Uint8Array;
  mimeType: ReceiptSignatureMimeType;
};

// Input to generateReceiptPdf. The receipt number is expected to be composed
// by the caller (FINANCE-05/06), but formatReceiptNumber is exported here so
// the same rule is reused everywhere.
export type ReceiptPdfInput = {
  receiptNumber: string;
  studentName: string;
  studentNumber: string;
  programInformation: string;
  amountPaid: number;
  // ISO-like date string (YYYY-MM-DD or full ISO). Never generated here.
  paymentDate: string;
  paymentMethod: ReceiptPaymentMethod;
  notesType: ReceiptNotesType;
  // FINANCE-08. Optional. When omitted the signature line stays blank.
  signatureImage?: ReceiptSignatureImage;
};

// The card brands that, when used as payment_method, are treated as a card
// payment (main Debit/Credit Card box checked plus the matching sub-option).
export const CARD_PAYMENT_METHODS: ReceiptPaymentMethod[] = [
  "debit",
  "master_card",
  "visa",
  "amex",
];

export function isCardPaymentMethod(method: ReceiptPaymentMethod): boolean {
  return CARD_PAYMENT_METHODS.includes(method);
}
