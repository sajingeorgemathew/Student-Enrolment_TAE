"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const paymentMethodOptions = [
  { value: "", label: "All methods" },
  { value: "cash", label: "Cash" },
  { value: "e_transfer", label: "E-transfer" },
  { value: "debit", label: "Debit" },
  { value: "master_card", label: "Master Card" },
  { value: "visa", label: "Visa" },
  { value: "amex", label: "Amex" },
  { value: "paypal", label: "Paypal" },
  { value: "cheque_bank_draft", label: "Cheque / Bank draft" },
];

const notesTypeOptions = [
  { value: "", label: "All notes types" },
  { value: "enrolment_fee", label: "Enrolment fee" },
  { value: "installment_payment", label: "Installment payment" },
  {
    value: "late_fee_payment_installment_payment",
    label: "Late fee / Installment payment",
  },
];

const voidStatusOptions = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "voided", label: "Voided" },
];

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";

export function ReceiptFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(`/dashboard/admin-tools/finance/receipts?${params.toString()}`);
    });
  }

  function clearAll() {
    startTransition(() => {
      router.replace("/dashboard/admin-tools/finance/receipts");
    });
  }

  const hasFilters = [
    "receiptNumber",
    "studentName",
    "studentNumber",
    "paymentMethod",
    "notesType",
    "voidStatus",
  ].some((key) => searchParams.get(key));

  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white p-4 ${isPending ? "opacity-70" : ""}`}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          type="text"
          placeholder="Receipt number"
          defaultValue={searchParams.get("receiptNumber") ?? ""}
          onChange={(e) => setParam("receiptNumber", e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Student name"
          defaultValue={searchParams.get("studentName") ?? ""}
          onChange={(e) => setParam("studentName", e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Student number"
          defaultValue={searchParams.get("studentNumber") ?? ""}
          onChange={(e) => setParam("studentNumber", e.target.value)}
          className={inputClass}
        />
        <select
          defaultValue={searchParams.get("paymentMethod") ?? ""}
          onChange={(e) => setParam("paymentMethod", e.target.value)}
          className={inputClass}
        >
          {paymentMethodOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          defaultValue={searchParams.get("notesType") ?? ""}
          onChange={(e) => setParam("notesType", e.target.value)}
          className={inputClass}
        >
          {notesTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          defaultValue={searchParams.get("voidStatus") ?? ""}
          onChange={(e) => setParam("voidStatus", e.target.value)}
          className={inputClass}
        >
          {voidStatusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {hasFilters && (
        <div className="mt-3">
          <button
            type="button"
            onClick={clearAll}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
