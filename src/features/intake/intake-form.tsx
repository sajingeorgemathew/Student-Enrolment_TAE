"use client";

import { useActionState, useState } from "react";
import { createIntake, getBatchesByProgram } from "@/features/intake/actions";
import type { IntakeFormState } from "@/features/intake/actions";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

type Program = { id: string; program_code: string; program_name: string };
type Batch = {
  id: string;
  batch_name: string;
  batch_code: string | null;
  start_date: string | null;
};

const initialState: IntakeFormState = { success: false };

const provinces = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
];

const leadSources = [
  "Walk-in",
  "Phone Inquiry",
  "Website",
  "Social Media",
  "Referral",
  "Agent",
  "Job Fair",
  "Other",
];

function FieldError({ errors, name }: { errors?: Record<string, string[] | undefined>; name: string }) {
  const msgs = errors?.[name];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msgs[0]}</p>;
}

export function IntakeForm({ programs }: { programs: Program[] }) {
  const [state, formAction, pending] = useActionState(createIntake, initialState);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  function handleProgramChange(programId: string) {
    setSelectedProgramId(programId);
    setBatches([]);
    if (!programId) return;
    setLoadingBatches(true);
    getBatchesByProgram(programId).then((data) => {
      setBatches(data);
      setLoadingBatches(false);
    });
  }

  const inputClass =
    "mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none disabled:bg-zinc-50 disabled:text-zinc-500";
  const labelClass = "block text-sm font-medium text-zinc-700";

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">{state.error}</p>
        </div>
      )}

      {/* Student Basics */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Student Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="legal_first_name" className={labelClass}>
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="legal_first_name"
              name="legal_first_name"
              type="text"
              required
              className={inputClass}
              placeholder="First name"
            />
            <FieldError errors={state.fieldErrors} name="legal_first_name" />
          </div>
          <div>
            <label htmlFor="legal_middle_name" className={labelClass}>
              Middle Name
            </label>
            <input
              id="legal_middle_name"
              name="legal_middle_name"
              type="text"
              className={inputClass}
              placeholder="Middle name"
              defaultValue=""
            />
          </div>
          <div>
            <label htmlFor="legal_last_name" className={labelClass}>
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="legal_last_name"
              name="legal_last_name"
              type="text"
              required
              className={inputClass}
              placeholder="Last name"
            />
            <FieldError errors={state.fieldErrors} name="legal_last_name" />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={inputClass}
              placeholder="student@example.com"
              defaultValue=""
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className={inputClass}
              placeholder="(416) 555-0100"
              defaultValue=""
            />
          </div>
          <div>
            <label htmlFor="alternate_phone" className={labelClass}>
              Alternate Phone
            </label>
            <input
              id="alternate_phone"
              name="alternate_phone"
              type="tel"
              className={inputClass}
              placeholder="(416) 555-0101"
              defaultValue=""
            />
          </div>
          <div>
            <label htmlFor="date_of_birth" className={labelClass}>
              Date of Birth
            </label>
            <input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              className={inputClass}
              defaultValue=""
            />
          </div>
        </div>
      </section>

      {/* Address */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Mailing Address
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="mailing_address_line_1" className={labelClass}>
              Address Line 1
            </label>
            <input
              id="mailing_address_line_1"
              name="mailing_address_line_1"
              type="text"
              className={inputClass}
              placeholder="Street address"
              defaultValue=""
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="mailing_address_line_2" className={labelClass}>
              Address Line 2
            </label>
            <input
              id="mailing_address_line_2"
              name="mailing_address_line_2"
              type="text"
              className={inputClass}
              placeholder="Apt, suite, unit, etc."
              defaultValue=""
            />
          </div>
          <div>
            <label htmlFor="city" className={labelClass}>
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              className={inputClass}
              placeholder="City"
              defaultValue=""
            />
          </div>
          <div>
            <label htmlFor="province" className={labelClass}>
              Province
            </label>
            <select id="province" name="province" className={inputClass} defaultValue="">
              <option value="">Select province</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="postal_code" className={labelClass}>
              Postal Code
            </label>
            <input
              id="postal_code"
              name="postal_code"
              type="text"
              className={inputClass}
              placeholder="A1A 1A1"
              defaultValue=""
            />
          </div>
          <div>
            <label htmlFor="country" className={labelClass}>
              Country
            </label>
            <input
              id="country"
              name="country"
              type="text"
              className={inputClass}
              defaultValue="Canada"
            />
          </div>
        </div>
      </section>

      {/* Program & Batch */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Program Interest
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="program_id" className={labelClass}>
              Program
            </label>
            <select
              id="program_id"
              name="program_id"
              className={inputClass}
              value={selectedProgramId}
              onChange={(e) => handleProgramChange(e.target.value)}
            >
              <option value="">Select a program</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.program_name} ({p.program_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="batch_id" className={labelClass}>
              Batch
            </label>
            <select
              id="batch_id"
              name="batch_id"
              className={inputClass}
              disabled={!selectedProgramId || loadingBatches}
            >
              <option value="">
                {loadingBatches
                  ? "Loading batches..."
                  : selectedProgramId
                    ? "Select a batch"
                    : "Select a program first"}
              </option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_name}
                  {b.start_date ? ` — starts ${b.start_date}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lead_source" className={labelClass}>
              Lead Source
            </label>
            <select
              id="lead_source"
              name="lead_source"
              className={inputClass}
              defaultValue=""
            >
              <option value="">Select lead source</option>
              {leadSources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Price Discussion */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Price Discussion
        </h2>
        <p className="mb-4 text-sm text-zinc-500">
          Record any pricing discussed with the student. The admin team will
          finalize fees separately.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price_discussed" className={labelClass}>
              Price Discussed ($)
            </label>
            <input
              id="price_discussed"
              name="price_discussed"
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="0.00"
              defaultValue=""
            />
          </div>
          <div>
            <label htmlFor="deposit_discussed" className={labelClass}>
              Deposit Discussed ($)
            </label>
            <input
              id="deposit_discussed"
              name="deposit_discussed"
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="0.00"
              defaultValue=""
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="payment_notes" className={labelClass}>
              Payment Notes
            </label>
            <textarea
              id="payment_notes"
              name="payment_notes"
              rows={3}
              className={inputClass}
              placeholder="Any payment arrangements or notes discussed..."
              defaultValue=""
            />
          </div>
        </div>
      </section>

      {/* Sales Notes */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Notes for Admin
        </h2>
        <div>
          <label htmlFor="sales_notes" className={labelClass}>
            Sales Notes
          </label>
          <textarea
            id="sales_notes"
            name="sales_notes"
            rows={4}
            className={inputClass}
            placeholder="Any additional notes for the admissions admin team..."
            defaultValue=""
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
        <Link
          href="/dashboard/intake"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          <span className="inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Intakes
          </span>
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {pending ? "Saving..." : "Create Intake"}
        </button>
      </div>
    </form>
  );
}
