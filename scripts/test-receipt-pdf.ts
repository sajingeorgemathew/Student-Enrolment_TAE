// Dev-only demo for the receipt PDF overlay generator (FINANCE-04).
//
// This is NOT used by any production route. It exercises generateReceiptPdf
// with sample input and writes a PDF to scripts/output so the overlay
// placement can be eyeballed against the template during calibration.
//
// Run (dev only), for example:
//   npx tsx scripts/test-receipt-pdf.ts
//
// It does not touch the database, storage, or any API route.

import fs from "fs";
import path from "path";
import { generateReceiptPdf } from "../src/lib/receipts/generate-receipt-pdf";
import { formatReceiptNumber } from "../src/lib/receipts/receipt-formatters";
import type { ReceiptPdfInput } from "../src/lib/receipts/receipt-types";

async function main(): Promise<void> {
  const studentNumber = "125191";
  const sample: ReceiptPdfInput = {
    receiptNumber: formatReceiptNumber(studentNumber, 1),
    studentName: "JANE MARIE DOE",
    studentNumber,
    programInformation: "NACC Personal Support Worker (PSW)",
    amountPaid: 1250,
    paymentDate: "2025-07-02",
    paymentMethod: "visa",
    notesType: "installment_payment",
    signatureVariant: "A",
  };

  const bytes = await generateReceiptPdf(sample);

  const outDir = path.join(process.cwd(), "scripts", "output");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${sample.receiptNumber}.pdf`);
  fs.writeFileSync(outPath, bytes);

  console.log("Receipt number:", sample.receiptNumber);
  console.log("Wrote demo receipt to:", outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
