"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface Props {
  bucket: string;
  storagePath: string;
  fileName: string;
}

export function DocumentDownloadButton({ bucket, storagePath, fileName }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ bucket, path: storagePath, fileName });
    const link = document.createElement("a");
    link.href = `/api/documents/download?${params.toString()}`;
    link.download = fileName;
    link.click();
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {loading ? "Preparing..." : "Download File"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
