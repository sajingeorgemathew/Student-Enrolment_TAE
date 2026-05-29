"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

export function GenerateWordButton({
  applicationId,
}: {
  applicationId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `/api/contracts/generate-docx?applicationId=${encodeURIComponent(applicationId)}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Download failed" }));
        setError(err.error || "Failed to generate contract");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const fileNameMatch = disposition.match(/filename="([^"]+)"/);
      const fileName = fileNameMatch
        ? fileNameMatch[1]
        : "Student Enrolment Contract.docx";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setSuccess("Contract generated and downloaded.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileText className="h-4 w-4" />
        {loading ? "Generating..." : "Generate Word Contract"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      {success && (
        <p className="mt-2 text-sm text-green-700">{success}</p>
      )}
    </div>
  );
}
