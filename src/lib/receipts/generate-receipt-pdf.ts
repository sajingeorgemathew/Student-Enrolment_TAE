// Receipt PDF overlay generator.
//
// FINANCE-04. Loads the runtime receipt template and overlays only dynamic
// values on top of it. It does not rebuild or redesign the receipt.
//
// Source of truth:
// - docs/blueprint/receipt-pdf-field-map.md (coordinates, bands)
// - docs/blueprint/receipt-system-integration.md (business rules)
//
// Important limitations (see ticket notes):
// - The runtime template is currently the value-filled sample receipt, so the
//   overlay will sit on top of existing sample values until a clean blank
//   template replaces it at the same path.
// - The coordinates below are the approximate values from the field map and
//   must be calibrated against the rendered template. They are grouped as
//   named constants so calibration is a single, reviewable edit.

import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import type { ReceiptPdfInput } from "./receipt-types";
import {
  formatAmount,
  formatNotes,
  formatReceiptBottomDate,
  formatReceiptNumberSuffix,
  formatReceiptTopDate,
  formatStudentNumberValue,
  resolvePaymentMarkers,
} from "./receipt-formatters";

const TEMPLATE_PATH = "src/templates/receipts/toronto-academy-receipt-template.pdf";

// Approved signature image URLs (from the blueprint). Kept here for the next
// ticket; not fetched at runtime in FINANCE-04. See SIGNATURE handling below.
export const SIGNATURE_IMAGE_URLS = {
  A: "https://res.cloudinary.com/dfxihtsvj/image/upload/v1780005334/Screenshot_2025-04-05_144725_fbqubx.png",
  B: "https://res.cloudinary.com/dfxihtsvj/image/upload/v1780054291/signature_sgm__4_-removebg-preview_fttasu.png",
} as const;

// ---------------------------------------------------------------------------
// Coordinate map (lower-left text baselines, origin bottom-left, page 612x792).
//
// Calibrated against the runtime template by reading the printed label
// positions (PyMuPDF word boxes converted to pdf-lib coordinates, baseline =
// page_height - box_bottom + 2). The template preprints every label and
// prefix, so each value is placed in the blank that follows its label:
//
//   "Receipt No: PSW-12500-25-"  -> suffix only      (y 594)
//   "Student Name:"              -> student name      (y 500)
//   "Student No:  PSW"           -> numeric value     (y 478)
//   "Program Information: NACC Personal Support Worker (PSW)" -> preprinted,
//                                   not overlaid (see below)
//   "Total amount Paid:"         -> amount            (y 435)
//   "Date of Receipt: ___ (DD-MM-YYYY)" -> date before the hint (y 413)
//   payment options 1-5          -> X markers (left margin / inline)
//   "Card Holder Name: ___"      -> student name, card only (y 327)
//   "Notes: ___"                 -> notes value       (y 219)
//   "Date: ___" (footer, right)  -> date              (y 161)
// ---------------------------------------------------------------------------

type Point = { x: number; y: number };

const COORDS = {
  // Values placed after their preprinted label.
  receiptNumber: { x: 147, y: 594 } as Point,
  studentName: { x: 121, y: 500 } as Point,
  studentNumber: { x: 138, y: 478 } as Point,
  totalAmount: { x: 140, y: 435 } as Point,
  topDate: { x: 128, y: 413 } as Point,
  cardHolderName: { x: 166, y: 327 } as Point,
  notes: { x: 66, y: 219 } as Point,
  bottomDate: { x: 428, y: 161 } as Point,
  // Payment method markers (X), centered in the template's printed checkbox
  // squares (box centers read from the template vectors). Option 1 itself has
  // no checkbox; only the four card-type boxes do, so a card payment is marked
  // by a left-margin X beside "1." plus the selected card-type box.
  debitCredit: { x: 44, y: 350 } as Point, // option 1, left margin (no box)
  debit: { x: 259, y: 349 } as Point, // Debit box
  masterCard: { x: 350, y: 349 } as Point, // Master Card box
  visa: { x: 403, y: 350 } as Point, // Visa box
  amex: { x: 462, y: 350 } as Point, // Amex box
  paypal: { x: 117, y: 303 } as Point, // Paypal box
  eTransfer: { x: 301, y: 280 } as Point, // E-transfer box
  chequeBankDraft: { x: 401, y: 258 } as Point, // Cheque/bank draft box
  cashCheckbox: { x: 106, y: 235 } as Point, // Cash box
} as const;

const FONT_SIZE = {
  emphasis: 11, // receipt number, total amount
  body: 11, // name, student number, top date
  small: 10, // notes, card holder name, bottom date
  checkmark: 11, // sized to sit inside the ~11pt checkbox squares
} as const;

// The runtime template preprints the "5. Cash" line, so the generator does not
// overlay a Cash label; it only draws the X marker when the method is cash. If
// a future blank template drops the Cash line, set this to true to overlay it.
const OVERLAY_CASH_LABEL = false;
const CASH_LABEL_TEXT = "5. Cash";
const CASH_LABEL_POINT: Point = { x: 54, y: 235 };

// Simple marker that renders reliably with a core font and needs no special
// font dependency. "X" reads clearly beside a printed option.
const CHECK_MARK = "X";

/**
 * Generate the receipt PDF by overlaying dynamic values on the template.
 *
 * Returns the PDF bytes (Uint8Array). Storage/upload is out of scope here.
 */
export async function generateReceiptPdf(
  input: ReceiptPdfInput
): Promise<Uint8Array> {
  const templatePath = path.join(process.cwd(), TEMPLATE_PATH);
  const templateBytes = fs.readFileSync(templatePath);

  const pdfDoc = await PDFDocument.load(templateBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.getPages()[0];
  const black = rgb(0, 0, 0);

  const draw = (
    text: string,
    at: Point,
    size: number,
    bold = false
  ): void => {
    if (!text) return;
    page.drawText(text, {
      x: at.x,
      y: at.y,
      size,
      font: bold ? helveticaBold : helvetica,
      color: black,
    });
  };

  const drawCheck = (at: Point): void => {
    page.drawText(CHECK_MARK, {
      x: at.x,
      y: at.y,
      size: FONT_SIZE.checkmark,
      font: helveticaBold,
      color: black,
    });
  };

  // --- Identity band -------------------------------------------------------
  // Template preprints "Receipt No: PSW-12500-25-"; overlay only the suffix.
  draw(
    formatReceiptNumberSuffix(input.receiptNumber),
    COORDS.receiptNumber,
    FONT_SIZE.emphasis,
    true
  );
  // Template preprints the literal "(DD-MM-YYYY)" hint; overlay only the date.
  draw(formatReceiptTopDate(input.paymentDate), COORDS.topDate, FONT_SIZE.body);

  // --- Student band --------------------------------------------------------
  draw(input.studentName, COORDS.studentName, FONT_SIZE.body);
  // Template preprints the "PSW" label; overlay only the numeric value.
  draw(
    formatStudentNumberValue(input.studentNumber),
    COORDS.studentNumber,
    FONT_SIZE.body
  );
  // Program information is preprinted on the template ("NACC Personal Support
  // Worker (PSW)"), so it is not overlaid (overlaying would duplicate it).

  // --- Amount --------------------------------------------------------------
  draw(formatAmount(input.amountPaid), COORDS.totalAmount, FONT_SIZE.emphasis, true);

  // --- Payment method markers ---------------------------------------------
  const markers = resolvePaymentMarkers(input.paymentMethod);
  if (markers.debitCredit) drawCheck(COORDS.debitCredit);
  if (markers.debit) drawCheck(COORDS.debit);
  if (markers.masterCard) drawCheck(COORDS.masterCard);
  if (markers.visa) drawCheck(COORDS.visa);
  if (markers.amex) drawCheck(COORDS.amex);
  if (markers.paypal) drawCheck(COORDS.paypal);
  if (markers.eTransfer) drawCheck(COORDS.eTransfer);
  if (markers.chequeBankDraft) drawCheck(COORDS.chequeBankDraft);

  // Cash line: the template already prints "5. Cash", so the label is only
  // overlaid as a guarded fallback. The X marker is drawn only for cash.
  if (OVERLAY_CASH_LABEL) {
    draw(CASH_LABEL_TEXT, CASH_LABEL_POINT, FONT_SIZE.small);
  }
  if (markers.cash) drawCheck(COORDS.cashCheckbox);

  // Card holder name: card payments only, student name, and nowhere else.
  if (markers.showCardHolderName) {
    draw(input.studentName, COORDS.cardHolderName, FONT_SIZE.small);
  }

  // --- Notes ---------------------------------------------------------------
  draw(formatNotes(input.notesType), COORDS.notes, FONT_SIZE.small);

  // --- Signature -----------------------------------------------------------
  // TODO(FINANCE-07): embed the approved signature image. Fetching a remote
  // Cloudinary image at runtime is intentionally not done in this ticket to
  // avoid a network dependency in the generator. When signature storage is
  // available, load the bytes for input.signatureVariant (default "A") from a
  // local/asset source and draw it with page.drawImage at the signature box
  // (approx x=380, y=110, ~120x45 pt, preserve aspect ratio). Per the rule, a
  // typed signer name is never printed.
  void input.signatureVariant;

  // --- Bottom date ---------------------------------------------------------
  draw(
    formatReceiptBottomDate(input.paymentDate),
    COORDS.bottomDate,
    FONT_SIZE.small
  );

  return pdfDoc.save();
}
