"use client";

import { useState } from "react";
import { submitToAdminReview } from "@/features/intake/actions";
import { Send } from "lucide-react";

export function SendToAdminButton({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await submitToAdminReview(applicationId);
    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
    }
    setLoading(false);
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        <Send className="h-3 w-3" />
        {loading ? "Sending..." : "Send to Admin Review"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
