"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Receipt } from "lucide-react";
import { formatReceiptNumber } from "@/lib/receipts/receipt-formatters";
import {
  searchReceiptStudents,
  getNextReceiptSequence,
  type ReceiptStudentResult,
} from "./new-receipt-actions";

// FINANCE-06: admin-only new receipt form. Submits to the admin-only POST
// route /api/finance/receipts/generate, which inserts the record, generates the
// PDF, and streams it back for immediate download.

type PrimaryMethod =
  | "cash"
  | "e_transfer"
  | "card"
  | "paypal"
  | "cheque_bank_draft";

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

function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function NewReceiptForm() {
  const router = useRouter();

  // Student search/select.
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReceiptStudentResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ReceiptStudentResult | null>(null);

  // Sequence preview.
  const [nextSequence, setNextSequence] = useState(1);
  const [sequenceOverride, setSequenceOverride] = useState("");

  // Receipt fields.
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [primaryMethod, setPrimaryMethod] = useState<PrimaryMethod>("cash");
  const [cardBrand, setCardBrand] = useState("debit");
  const [notesType, setNotesType] = useState("enrolment_fee");
  const [signatureVariant, setSignatureVariant] = useState("A");

  // Submission state.
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Debounced student search. All state updates happen inside the debounced
  // callback (asynchronously), and a cancelled flag drops stale responses.
  useEffect(() => {
    if (selected) return;
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
  }, [query, selected]);

  async function handleSelectStudent(student: ReceiptStudentResult) {
    setSelected(student);
    setResults([]);
    setQuery("");
    setSequenceOverride("");
    const { nextSequence: seq } = await getNextReceiptSequence(student.id);
    setNextSequence(seq);
  }

  function handleClearStudent() {
    setSelected(null);
    setNextSequence(1);
    setSequenceOverride("");
  }

  const effectiveSequence =
    sequenceOverride.trim() !== "" ? Number(sequenceOverride) : nextSequence;

  const sequenceValid =
    Number.isInteger(effectiveSequence) && effectiveSequence >= 1;

  const receiptNumberPreview =
    selected && selected.studentNumber && sequenceValid
      ? formatReceiptNumber(selected.studentNumber, effectiveSequence)
      : null;

  const effectivePaymentMethod =
    primaryMethod === "card" ? cardBrand : primaryMethod;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selected) {
      setError("Select a student before creating a receipt.");
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
    if (!sequenceValid) {
      setError("Receipt sequence must be a whole number of 1 or more.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/finance/receipts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selected.id,
          amount: amountNum,
          paymentDate,
          paymentMethod: effectivePaymentMethod,
          notesType,
          signatureVariant,
          receiptSequence:
            sequenceOverride.trim() !== "" ? Number(sequenceOverride) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Could not create the receipt." }));
        setError(data.error || "Could not create the receipt.");
        return;
      }

      const blob = await res.blob();
      const receiptNumber =
        res.headers.get("X-Receipt-Number") || "receipt";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setSuccess(
        `Receipt ${receiptNumber} created and downloaded. It now appears in the registry.`
      );
      // Reset for the next receipt while keeping the selected student.
      setAmount("");
      setSequenceOverride("");
      const { nextSequence: seq } = await getNextReceiptSequence(selected.id);
      setNextSequence(seq);
      router.refresh();
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
          Search by student name or student number.
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
              {!selected.applicationId && (
                <p className="mt-1 text-xs text-amber-600">
                  No application found for this student. The receipt will be
                  created without an application link.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleClearStudent}
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
            <label className={labelClass} htmlFor="signatureVariant">
              Signature variant
            </label>
            <select
              id="signatureVariant"
              value={signatureVariant}
              onChange={(e) => setSignatureVariant(e.target.value)}
              className={`mt-1 ${inputClass}`}
            >
              <option value="A">Signature A</option>
              <option value="B">Signature B</option>
            </select>
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
              value={sequenceOverride}
              onChange={(e) => setSequenceOverride(e.target.value)}
              placeholder={selected ? String(nextSequence) : "Select a student"}
              disabled={!selected}
              className={`mt-1 ${inputClass} disabled:bg-zinc-100`}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Suggested next sequence: {selected ? nextSequence : "--"}. Leave
              blank to use the suggestion, or set a value to fill a historical
              gap.
            </p>
          </div>
          <div>
            <span className={labelClass}>Preview</span>
            <div className="mt-1 flex items-center gap-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2">
              <Receipt className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900">
                {receiptNumberPreview ?? "Select a student to preview"}
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
          <Receipt className="h-4 w-4" />
          {submitting ? "Creating..." : "Create and download receipt"}
        </button>
      </div>
    </form>
  );
}
