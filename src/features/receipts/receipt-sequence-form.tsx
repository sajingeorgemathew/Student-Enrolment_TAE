"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatReceiptNumber } from "@/lib/receipts/receipt-formatters";
import { updateReceiptSequence } from "./receipt-sequence-actions";

// FINANCE-11: admin-only control to correct just the receipt sequence. Only
// rendered on the admin-only receipt edit page. The server action re-checks the
// role, so hiding the control is not the only guard.

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "block text-sm font-medium text-zinc-700";

export function ReceiptSequenceForm({
  receiptId,
  studentNumber,
  currentSequence,
  currentReceiptNumber,
}: {
  receiptId: string;
  studentNumber: string;
  currentSequence: number;
  currentReceiptNumber: string;
}) {
  const router = useRouter();
  const [sequence, setSequence] = useState(String(currentSequence));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const trimmed = sequence.trim();
  const sequenceNum = Number(trimmed);
  const sequenceValid =
    /^\d+$/.test(trimmed) && Number.isSafeInteger(sequenceNum) && sequenceNum >= 1;
  const preview =
    sequenceValid && studentNumber
      ? formatReceiptNumber(studentNumber, sequenceNum)
      : null;
  const unchanged = sequenceValid && sequenceNum === currentSequence;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!sequenceValid) {
      setError("Receipt sequence must be a whole number of 1 or more.");
      return;
    }

    startTransition(async () => {
      const result = await updateReceiptSequence(receiptId, sequenceNum);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(
        result.warning
          ? `Sequence updated successfully. ${result.warning}`
          : "Sequence updated successfully"
      );
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-zinc-200 bg-white p-6"
    >
      <h2 className="text-base font-semibold text-zinc-900">Receipt sequence</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Changes only the sequence and receipt number. The PDF is regenerated and
        the stored file is replaced. Student, amount, and payment details stay
        the same.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="receipt-sequence-only">
            Receipt sequence
          </label>
          <input
            id="receipt-sequence-only"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            className={`mt-1 ${inputClass}`}
            value={sequence}
            onChange={(e) => setSequence(e.target.value)}
          />
        </div>
        <div>
          <span className={labelClass}>Receipt number</span>
          <p className="mt-1 py-2 font-mono text-sm text-zinc-900">
            {preview ?? "Enter a valid sequence"}
          </p>
          <p className="text-xs text-zinc-500">
            Current: {currentReceiptNumber}
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </p>
      )}

      <div className="mt-4">
        <button
          type="submit"
          disabled={pending || !sequenceValid || unchanged}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Updating..." : "Update sequence"}
        </button>
      </div>
    </form>
  );
}
