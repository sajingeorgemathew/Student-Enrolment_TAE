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
  formatReceiptTopDate,
  formatStudentNumberDisplay,
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
// Coordinate map (lower-left anchors, origin bottom-left, page 612 x 792).
// Provisional values copied from docs/blueprint/receipt-pdf-field-map.md.
// Calibrate against the rendered template before production use.
// ---------------------------------------------------------------------------

type Point = { x: number; y: number };

const COORDS = {
  receiptNumber: { x: 400, y: 730 } as Point,
  studentName: { x: 150, y: 660 } as Point,
  studentNumber: { x: 150, y: 635 } as Point,
  programInformation: { x: 150, y: 610 } as Point,
  totalAmount: { x: 400, y: 590 } as Point,
  topDate: { x: 400, y: 700 } as Point,
  // Payment method checkboxes.
  debitCredit: { x: 90, y: 510 } as Point,
  debit: { x: 130, y: 488 } as Point,
  masterCard: { x: 130, y: 466 } as Point,
  visa: { x: 130, y: 444 } as Point,
  amex: { x: 130, y: 422 } as Point,
  paypal: { x: 90, y: 400 } as Point,
  eTransfer: { x: 90, y: 378 } as Point,
  chequeBankDraft: { x: 90, y: 356 } as Point,
  cashLabel: { x: 70, y: 334 } as Point,
  cashCheckbox: { x: 90, y: 334 } as Point,
  cardHolderName: { x: 200, y: 345 } as Point,
  notes: { x: 90, y: 275 } as Point,
  bottomDate: { x: 120, y: 110 } as Point,
} as const;

const FONT_SIZE = {
  emphasis: 12, // receipt number, total amount
  body: 11, // name, student number, program, top date
  small: 10, // notes, card holder name, bottom date, cash label
  checkmark: 11,
} as const;

// Cash line overlay text. The field map (section 7) says Cash must appear on
// every receipt; until calibration confirms Cash is preprinted, we overlay the
// label. The "5. Cash" wording follows the ticket Cash Line Rule.
const CASH_LABEL_TEXT = "5. Cash";

// Simple marker that renders reliably with a core font and needs no special
// font dependency. "X" reads clearly over a printed checkbox.
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
  draw(input.receiptNumber, COORDS.receiptNumber, FONT_SIZE.emphasis, true);
  draw(formatReceiptTopDate(input.paymentDate), COORDS.topDate, FONT_SIZE.body);

  // --- Student / program band ---------------------------------------------
  draw(input.studentName, COORDS.studentName, FONT_SIZE.body);
  draw(
    formatStudentNumberDisplay(input.studentNumber),
    COORDS.studentNumber,
    FONT_SIZE.body
  );
  draw(input.programInformation, COORDS.programInformation, FONT_SIZE.body);

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

  // Cash line: always overlay the label so Cash appears on every receipt, and
  // check it only for cash payments.
  draw(CASH_LABEL_TEXT, COORDS.cashLabel, FONT_SIZE.small);
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
