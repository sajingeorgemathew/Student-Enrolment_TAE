"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Receipt, Save } from "lucide-react";
import { formatReceiptNumber } from "@/lib/receipts/receipt-formatters";
import {
  searchReceiptStudents,
  type ReceiptStudentResult,
  type ReceiptSignatureOption,
} from "./new-receipt-actions";

// FINANCE-09: admin-only edit form. Submits to the admin-only PUT route
// /api/finance/receipts/[receiptId], which validates, regenerates the PDF,
// replaces the stored PDF, and updates the record metadata.

type PrimaryMethod =
  | "cash"
  | "e_transfer"
  | "card"
  | "paypal"
  | "cheque_bank_draft";

const CARD_BRANDS = ["debit", "master_card", "visa", "amex"] as const;

export type EditReceiptInitial = {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  receiptSequence: number;
  amount: number;
  paymentDate: string;
  receiptDate: string;
  paymentMethod: string;
  cardType: string | null;
  notesType: string;
  signatureId: string | null;
};

const primaryMethodOptions: { value: PrimaryMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "e_transfer", label: "E-transfer" },
  { value: "card", label: "Debit / Credit Card" },
  { value: "paypal", label: "Paypal" },
  { value: "cheque_bank_draft", label: "Cheque / Bank draft" },
];

const cardBrandOptions = [
  { value: "debit", label: "Debit" },
  { value: "master_card", label: "Master Card" },
  { value: "visa", label: "Visa" },
  { value: "amex", label: "Amex" },
];

const notesTypeOptions = [
  { value: "enrolment_fee", label: "Enrolment fee" },
  { value: "installment_payment", label: "Installment payment" },
  {
    value: "late_fee_payment_installment_payment",
    label: "Late fee payment / Installment payment",
  },
];

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "block text-sm font-medium text-zinc-700";

function isCardBrand(value: string): boolean {
  return (CARD_BRANDS as readonly string[]).includes(value);
}

export function EditReceiptForm({
  initial,
  signatures,
  signaturesTableMissing,
}: {
  initial: EditReceiptInitial;
  signatures: ReceiptSignatureOption[];
  signaturesTableMissing: boolean;
}) {
  const router = useRouter();

  // Selected student is seeded from the receipt snapshot. Admin may change it.
  const [selected, setSelected] = useState<ReceiptStudentResult | null>({
    id: initial.studentId,
    studentNumber: initial.studentNumber,
    studentName: initial.studentName,
    applicationId: null,
    programId: null,
    batchId: null,
    programName: null,
    batchName: null,
    applicationStatus: null,
  });

  // Student search (only used when changing the student).
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReceiptStudentResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Receipt fields.
  const initialPrimary: PrimaryMethod = isCardBrand(initial.paymentMethod)
    ? "card"
    : (initial.paymentMethod as PrimaryMethod);
  const initialCardBrand = isCardBrand(initial.paymentMethod)
    ? initial.paymentMethod
    : initial.cardType && isCardBrand(initial.cardType)
      ? initial.cardType
      : "debit";

  const [amount, setAmount] = useState(String(initial.amount));
  const [paymentDate, setPaymentDate] = useState(initial.paymentDate);
  const [receiptDate, setReceiptDate] = useState(initial.receiptDate);
  const [primaryMethod, setPrimaryMethod] =
    useState<PrimaryMethod>(initialPrimary);
  const [cardBrand, setCardBrand] = useState(initialCardBrand);
  const [notesType, setNotesType] = useState(initial.notesType);
  const [signatureId, setSignatureId] = useState(initial.signatureId ?? "");
  const [sequence, setSequence] = useState(String(initial.receiptSequence));

  // Submission state.
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const term = query.trim();
    let cancelled = false;
    const handle = setTimeout(async () => {
      if (!term) {
        if (!cancelled) {
          setResults([]);
          setSearching(false);
        }
        return;
      }
      if (!cancelled) setSearching(true);
      const found = await searchReceiptStudents(term);
      if (!cancelled) {
        setResults(found);
        setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  function handleSelectStudent(student: ReceiptStudentResult) {
    setSelected(student);
    setResults([]);
    setQuery("");
  }

  const sequenceNum = Number(sequence);
  const sequenceValid = Number.isInteger(sequenceNum) && sequenceNum >= 1;

  const receiptNumberPreview =
    selected && selected.studentNumber && sequenceValid
      ? formatReceiptNumber(selected.studentNumber, sequenceNum)
      : null;

  const effectivePaymentMethod =
    primaryMethod === "card" ? cardBrand : primaryMethod;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selected) {
      setError("Select a student for the receipt.");
      return;
    }
    if (!selected.studentNumber) {
      setError(
        "This student does not have a student number. Add one in the student file first."
      );
      return;
    }
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }
    if (!paymentDate) {
      setError("Enter a payment date.");
      return;
    }
    if (!receiptDate) {
      setError("Enter a receipt date.");
      return;
    }
    if (!sequenceValid) {
      setError("Receipt sequence must be a whole number of 1 or more.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/finance/receipts/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selected.id,
          amount: amountNum,
          paymentDate,
          receiptDate,
          paymentMethod: effectivePaymentMethod,
          notesType,
          signatureId: signatureId || undefined,
          receiptSequence: sequenceNum,
        }),
      });

      const data = await res
        .json()
        .catch(() => ({ error: "Could not save the receipt changes." }));

      if (!res.ok) {
        setError(data.error || "Could not save the receipt changes.");
        return;
      }

      setSuccess(
        data.warning
          ? `Receipt ${data.receiptNumber} updated. ${data.warning}`
          : `Receipt ${data.receiptNumber} updated. Returning to the registry...`
      );
      router.refresh();
      // Give the success message a moment, then return to the registry.
      setTimeout(() => {
        router.push("/dashboard/admin-tools/finance/receipts");
      }, 1200);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Student selection */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Student</h2>
        <p className="mt-1 text-xs text-zinc-500">
          The receipt keeps its current student unless you change it.
        </p>

        {selected ? (
          <div className="mt-4 flex items-start justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">
                {selected.studentName || "Unnamed student"}
              </p>
              <p className="text-xs text-zinc-500">
                Student No: {selected.studentNumber ?? "Not set"}
              </p>
              {selected.programName && (
                <p className="mt-1 text-xs text-zinc-500">
                  Program: {selected.programName}
                  {selected.batchName ? ` / ${selected.batchName}` : ""}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative mt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students"
                className={`${inputClass} pl-9`}
              />
            </div>
            {searching && (
              <p className="mt-2 text-xs text-zinc-400">Searching...</p>
            )}
            {!searching && query.trim() && results.length === 0 && (
              <p className="mt-2 text-xs text-zinc-400">No students found.</p>
            )}
            {results.length > 0 && (
              <ul className="mt-2 max-h-64 overflow-auto rounded-md border border-zinc-200 bg-white">
                {results.map((student) => (
                  <li key={student.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectStudent(student)}
                      className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-zinc-50"
                    >
                      <span className="text-sm text-zinc-900">
                        {student.studentName || "Unnamed student"}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {student.studentNumber ?? "No student number"}
                        {student.programName ? ` - ${student.programName}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Receipt details */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Receipt details</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="amount">
              Amount (CAD)
            </label>
            <input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`mt-1 ${inputClass}`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="paymentDate">
              Payment date
            </label>
            <input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="receiptDate">
              Receipt date
            </label>
            <input
              id="receiptDate"
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Shown as the Date of Receipt on the PDF.
            </p>
          </div>

          <div>
            <label className={labelClass} htmlFor="paymentMethod">
              Payment method
            </label>
            <select
              id="paymentMethod"
              value={primaryMethod}
              onChange={(e) =>
                setPrimaryMethod(e.target.value as PrimaryMethod)
              }
              className={`mt-1 ${inputClass}`}
            >
              {primaryMethodOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {primaryMethod === "card" && (
            <div>
              <label className={labelClass} htmlFor="cardBrand">
                Card type
              </label>
              <select
                id="cardBrand"
                value={cardBrand}
                onChange={(e) => setCardBrand(e.target.value)}
                className={`mt-1 ${inputClass}`}
              >
                {cardBrandOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="notesType">
              Notes type
            </label>
            <select
              id="notesType"
              value={notesType}
              onChange={(e) => setNotesType(e.target.value)}
              className={`mt-1 ${inputClass}`}
            >
              {notesTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="signatureId">
              Signature
            </label>
            <select
              id="signatureId"
              value={signatureId}
              onChange={(e) => setSignatureId(e.target.value)}
              disabled={signatures.length === 0}
              className={`mt-1 ${inputClass} disabled:bg-zinc-100`}
            >
              <option value="">No signature</option>
              {signatures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.isDefault ? " (default)" : ""}
                </option>
              ))}
            </select>
            {signaturesTableMissing ? (
              <p className="mt-1 text-xs text-amber-600">
                Signature records are not available in this environment yet. The
                receipt can still be saved without one.
              </p>
            ) : signatures.length === 0 ? (
              <p className="mt-1 text-xs text-amber-600">
                No active signature available. The receipt can still be saved
                without one.
              </p>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">
                The selected signature image is overlaid on the regenerated PDF.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Receipt number */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Receipt number</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="sequence">
              Sequence
            </label>
            <input
              id="sequence"
              type="number"
              min="1"
              step="1"
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Per-student sequence. Changing it recalculates the receipt number.
            </p>
          </div>
          <div>
            <span className={labelClass}>Preview</span>
            <div className="mt-1 flex items-center gap-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2">
              <Receipt className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900">
                {receiptNumberPreview ?? "Set a valid student and sequence"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || !selected}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {submitting ? "Saving..." : "Save changes and regenerate PDF"}
        </button>
        <button
          type="button"
          onClick={() =>
            router.push("/dashboard/admin-tools/finance/receipts")
          }
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
