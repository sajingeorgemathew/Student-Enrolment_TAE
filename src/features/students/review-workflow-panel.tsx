"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, RotateCcw } from "lucide-react";
import { submitToAdminReview } from "@/features/intake/actions";
import {
  saveAdminNotes,
  markInformationNeeded,
  markReadyForContract,
  reopenToAdminReview,
} from "@/features/students/hub-actions";
import type { WorkflowActionResult } from "@/features/students/hub-actions";

interface ReadinessItem {
  label: string;
  ready: boolean;
}

interface Props {
  applicationId: string;
  studentId: string;
  status: string;
  submittedToAdminAt: string | null;
  adminReviewedAt: string | null;
  readyForContractAt: string | null;
  contractGeneratedAt: string | null;
  adminOwnerName: string | null;
  salesNotes: string | null;
  adminNotes: string | null;
  readinessItems: ReadinessItem[];
  role: string | null;
  readOnly?: boolean;
}

const statusLabels: Record<string, string> = {
  new_intake: "New Intake",
  admin_review: "Admin Review",
  information_needed: "Information Needed",
  ready_for_contract: "Ready for Contract",
  contract_generated: "Contract Generated",
  signature_pending: "Signature Pending",
  signed: "Signed",
  archived: "Archived",
};

const statusColors: Record<string, string> = {
  new_intake: "bg-blue-100 text-blue-800",
  admin_review: "bg-amber-100 text-amber-800",
  information_needed: "bg-orange-100 text-orange-800",
  ready_for_contract: "bg-green-100 text-green-800",
  contract_generated: "bg-purple-100 text-purple-800",
  signature_pending: "bg-indigo-100 text-indigo-800",
  signed: "bg-emerald-100 text-emerald-800",
  archived: "bg-zinc-100 text-zinc-600",
};

function getNextAction(status: string): string {
  switch (status) {
    case "new_intake":
      return "Complete intake details and send to admin review.";
    case "admin_review":
      return "Admin is reviewing - mark ready for contract or request more information.";
    case "information_needed":
      return "Address admin feedback and resend to admin review.";
    case "ready_for_contract":
      return "Generate the Word contract.";
    case "contract_generated":
      return "Send contract for signature.";
    case "signature_pending":
      return "Awaiting signed contract.";
    case "signed":
      return "Contract signed - enrollment complete.";
    case "archived":
      return "Application archived.";
    default:
      return "";
  }
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-CA");
}

export function ReviewWorkflowPanel({
  applicationId,
  status,
  submittedToAdminAt,
  adminReviewedAt,
  readyForContractAt,
  contractGeneratedAt,
  adminOwnerName,
  salesNotes,
  adminNotes,
  readinessItems,
  role,
  readOnly = false,
}: Props) {
  const router = useRouter();
  const isAdmin = role === "admin" || role === "super_admin";
  const isSales = role === "sales";
  const isViewer = role === "viewer";

  const [notes, setNotes] = useState(adminNotes ?? "");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [missingItems, setMissingItems] = useState<string[] | null>(null);

  const readinessMissing = readinessItems.filter((item) => !item.ready);

  const canSendToReview =
    !readOnly &&
    isSales &&
    (status === "new_intake" || status === "information_needed");

  const canMarkInfoNeeded = !readOnly && isAdmin && status === "admin_review";
  const canMarkReady = !readOnly && isAdmin && status === "admin_review";
  const canReopen =
    !readOnly &&
    isAdmin &&
    (status === "ready_for_contract" ||
      status === "contract_generated" ||
      status === "signature_pending");

  // Sales can only act in the intake stages. In every later stage their view is
  // locked, so explain why instead of leaving the panel empty.
  const salesLocked =
    isSales &&
    !readOnly &&
    status !== "new_intake" &&
    status !== "information_needed";

  function clearMessages() {
    setActionError(null);
    setActionSuccess(null);
    setMissingItems(null);
  }

  function handleSendToReview() {
    clearMessages();
    startTransition(async () => {
      const result = await submitToAdminReview(applicationId);
      if (result.success) {
        setActionSuccess("Sent to admin review.");
        router.refresh();
      } else {
        setActionError(result.error ?? "Something went wrong.");
      }
    });
  }

  function handleSaveNotes() {
    clearMessages();
    startTransition(async () => {
      const result = await saveAdminNotes(applicationId, notes);
      if (result.success) {
        setActionSuccess("Notes saved.");
        router.refresh();
      } else {
        setActionError(result.error ?? "Could not save notes.");
      }
    });
  }

  function handleMarkInfoNeeded() {
    clearMessages();
    startTransition(async () => {
      const result = await markInformationNeeded(applicationId, notes);
      if (result.success) {
        setActionSuccess("Marked as information needed.");
        router.refresh();
      } else {
        setActionError(result.error ?? "Could not update status.");
      }
    });
  }

  function handleMarkReady() {
    clearMessages();
    startTransition(async () => {
      const result: WorkflowActionResult =
        await markReadyForContract(applicationId);
      if (result.success) {
        setActionSuccess("Marked as ready for contract.");
        router.refresh();
      } else if (result.missingItems && result.missingItems.length > 0) {
        setMissingItems(result.missingItems);
        setActionError(
          "Cannot mark ready for contract. Missing items must be completed first."
        );
      } else {
        setActionError(result.error ?? "Could not update status.");
      }
    });
  }

  function handleReopen() {
    clearMessages();
    if (!notes.trim()) {
      setActionError(
        "Add a reason in Admin Notes before reopening to admin review."
      );
      return;
    }
    startTransition(async () => {
      const result = await reopenToAdminReview(applicationId, notes);
      if (result.success) {
        setActionSuccess("Reopened to admin review.");
        router.refresh();
      } else {
        setActionError(result.error ?? "Could not reopen application.");
      }
    });
  }

  return (
    <div className="space-y-5">
      {actionError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {actionSuccess}
        </div>
      )}

      {missingItems && missingItems.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="mb-1 text-sm font-medium text-amber-800">
            Missing items:
          </p>
          <ul className="text-sm text-amber-700">
            {missingItems.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs font-medium text-zinc-500">
            Current Status
          </dt>
          <dd className="mt-1">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                statusColors[status] ?? "bg-zinc-100 text-zinc-600"
              }`}
            >
              {statusLabels[status] ?? status}
            </span>
          </dd>
        </div>

        {submittedToAdminAt && (
          <div>
            <dt className="text-xs font-medium text-zinc-500">
              Submitted to Admin
            </dt>
            <dd className="mt-1 text-sm text-zinc-900">
              {formatDate(submittedToAdminAt)}
            </dd>
          </div>
        )}

        {adminReviewedAt && (
          <div>
            <dt className="text-xs font-medium text-zinc-500">
              Admin Reviewed
            </dt>
            <dd className="mt-1 text-sm text-zinc-900">
              {formatDate(adminReviewedAt)}
            </dd>
          </div>
        )}

        {readyForContractAt && (
          <div>
            <dt className="text-xs font-medium text-zinc-500">
              Ready for Contract
            </dt>
            <dd className="mt-1 text-sm text-zinc-900">
              {formatDate(readyForContractAt)}
            </dd>
          </div>
        )}

        {contractGeneratedAt && (
          <div>
            <dt className="text-xs font-medium text-zinc-500">
              Contract Generated
            </dt>
            <dd className="mt-1 text-sm text-zinc-900">
              {formatDate(contractGeneratedAt)}
            </dd>
          </div>
        )}

        {adminOwnerName && (
          <div>
            <dt className="text-xs font-medium text-zinc-500">
              Reviewed By
            </dt>
            <dd className="mt-1 text-sm text-zinc-900">{adminOwnerName}</dd>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 pt-4">
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-xs font-medium text-zinc-500">
            Next Recommended Action
          </p>
          <p className="mt-1 text-sm text-zinc-700">
            {getNextAction(status)}
          </p>
        </div>
      </div>

      {salesNotes && (
        <div className="border-t border-zinc-100 pt-4">
          <p className="text-xs font-medium text-zinc-500">Sales Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">
            {salesNotes}
          </p>
        </div>
      )}

      <div className="border-t border-zinc-100 pt-4">
        <p className="text-xs font-medium text-zinc-500">Admin Notes</p>
        {isAdmin && !readOnly ? (
          <div className="mt-1 space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
              placeholder="Add notes for this review..."
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isPending}
                className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">
            {adminNotes || (
              <span className="text-zinc-400">No admin notes yet.</span>
            )}
          </p>
        )}
      </div>

      {readinessMissing.length > 0 && (
        <div className="border-t border-zinc-100 pt-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="mb-1 text-sm font-medium text-amber-800">
              Missing readiness items:
            </p>
            <ul className="text-sm text-amber-700">
              {readinessMissing.map((item) => (
                <li key={item.label}>- {item.label}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {salesLocked && (
        <div className="border-t border-zinc-100 pt-4">
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
            <p className="text-sm text-zinc-600">
              This application has moved past intake and is now read-only for
              sales. An admin can request more information if changes are
              needed.
            </p>
          </div>
        </div>
      )}

      {isViewer && (
        <div className="border-t border-zinc-100 pt-4">
          <p className="text-sm text-zinc-500">
            You have read-only access to this application.
          </p>
        </div>
      )}

      {!isViewer &&
        (canSendToReview ||
          canMarkInfoNeeded ||
          canMarkReady ||
          canReopen) && (
          <div className="border-t border-zinc-200 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              {canSendToReview && (
                <button
                  type="button"
                  onClick={handleSendToReview}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  <Send className="h-3 w-3" />
                  {isPending ? "Sending..." : "Send to Admin Review"}
                </button>
              )}

              {canMarkInfoNeeded && (
                <button
                  type="button"
                  onClick={handleMarkInfoNeeded}
                  disabled={isPending}
                  className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-500 disabled:opacity-50"
                >
                  {isPending ? "Updating..." : "Mark Information Needed"}
                </button>
              )}

              {canMarkReady && (
                <button
                  type="button"
                  onClick={handleMarkReady}
                  disabled={isPending}
                  className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                >
                  {isPending ? "Checking..." : "Mark Ready for Contract"}
                </button>
              )}

              {canReopen && (
                <button
                  type="button"
                  onClick={handleReopen}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" />
                  {isPending ? "Reopening..." : "Reopen to Admin Review"}
                </button>
              )}
            </div>
            {canReopen && (
              <p className="mt-2 text-xs text-zinc-400">
                Reopening returns this application to admin review for
                corrections. Generated contracts, documents, fees, and
                checklists are preserved. Add a reason in Admin Notes above
                before reopening.
              </p>
            )}
          </div>
        )}
    </div>
  );
}
