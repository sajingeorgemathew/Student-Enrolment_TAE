"use client";

import { useState } from "react";
import { approveFeeSchedule, reopenFeeSchedule } from "@/features/fees/actions";
import { useRouter } from "next/navigation";

interface Props {
  feeScheduleId: string;
  applicationId: string;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  isAdmin: boolean;
}

export function FeeApprovalControls({
  feeScheduleId,
  applicationId,
  status,
  approvedBy,
  approvedAt,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isAdmin) return null;

  async function handleApprove() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await approveFeeSchedule(feeScheduleId, applicationId);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Approval failed.");
    } else {
      setSuccess("Fee schedule approved.");
      router.refresh();
    }
  }

  async function handleReopen() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await reopenFeeSchedule(feeScheduleId, applicationId);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Could not reopen fee schedule.");
    } else {
      setSuccess("Fee schedule reopened for correction.");
      router.refresh();
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {status === "approved" && approvedAt && (
        <div className="text-xs text-zinc-500">
          Approved{" "}
          {new Date(approvedAt).toLocaleDateString("en-CA")}
          {approvedBy ? ` by ${approvedBy}` : ""}
        </div>
      )}

      <div className="flex items-center gap-3">
        {(status === "draft" || status === "reopened") && (
          <button
            type="button"
            disabled={loading}
            onClick={handleApprove}
            className="inline-flex items-center rounded-md border border-green-600 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {loading ? "Processing..." : "Approve Fee Schedule"}
          </button>
        )}
        {status === "approved" && (
          <button
            type="button"
            disabled={loading}
            onClick={handleReopen}
            className="inline-flex items-center rounded-md border border-amber-600 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {loading ? "Processing..." : "Reopen for Correction"}
          </button>
        )}
      </div>
    </div>
  );
}
