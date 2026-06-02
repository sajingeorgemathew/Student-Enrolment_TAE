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
  const studentNumber = "125315";
  const base = {
    studentName: "JANE MARIE DOE",
    studentNumber,
    programInformation: "NACC Personal Support Worker (PSW)",
    amountPaid: 677,
    paymentDate: "2025-07-02",
  };

  const samples: ReceiptPdfInput[] = [
    {
      ...base,
      receiptNumber: formatReceiptNumber(studentNumber, 1),
      paymentMethod: "cash",
      notesType: "enrolment_fee",
    },
    {
      ...base,
      receiptNumber: formatReceiptNumber(studentNumber, 2),
      paymentMethod: "e_transfer",
      notesType: "installment_payment",
    },
    {
      ...base,
      receiptNumber: formatReceiptNumber(studentNumber, 3),
      paymentMethod: "visa",
      notesType: "late_fee_payment_installment_payment",
    },
  ];

  const outDir = path.join(process.cwd(), "scripts", "output");
  fs.mkdirSync(outDir, { recursive: true });

  for (const sample of samples) {
    const bytes = await generateReceiptPdf(sample);
    const outPath = path.join(
      outDir,
      `${sample.paymentMethod}-${sample.receiptNumber}.pdf`
    );
    fs.writeFileSync(outPath, bytes);
    console.log(`Wrote ${sample.paymentMethod} receipt to:`, outPath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
