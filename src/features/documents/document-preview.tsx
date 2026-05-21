"use client";

import { useState } from "react";
import { getDocumentSignedUrl } from "@/features/documents/actions";
import { Download, ExternalLink, Eye, FileText } from "lucide-react";

interface Props {
  bucket: string;
  storagePath: string;
  fileName: string;
}

type FileCategory = "pdf" | "image" | "unsupported";

function getFileCategory(fileName: string, storagePath: string): FileCategory {
  const name = (fileName || storagePath || "").toLowerCase();
  const ext = name.split(".").pop() ?? "";

  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "image";
  return "unsupported";
}

function getCategoryLabel(category: FileCategory): string {
  switch (category) {
    case "pdf":
      return "PDF";
    case "image":
      return "Image";
    default:
      return "Document";
  }
}

export function DocumentPreview({ bucket, storagePath, fileName }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const category = getFileCategory(fileName, storagePath);
  const canPreview = category === "pdf" || category === "image";

  async function fetchSignedUrl(): Promise<string | null> {
    setError(null);
    const result = await getDocumentSignedUrl(bucket, storagePath);
    if (result.error || !result.url) {
      setError(result.error ?? "Could not generate file link.");
      return null;
    }
    return result.url;
  }

  async function handlePreview() {
    setLoading(true);
    const url = await fetchSignedUrl();
    if (url) {
      setSignedUrl(url);
      setShowPreview(true);
    }
    setLoading(false);
  }

  async function handleOpenInNewTab() {
    setLoading(true);
    const url = await fetchSignedUrl();
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setLoading(false);
  }

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {canPreview && (
          <button
            onClick={handlePreview}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            {loading ? "Loading..." : "Preview Document"}
          </button>
        )}
        <button
          onClick={handleOpenInNewTab}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          <ExternalLink className="h-4 w-4" />
          Open in New Tab
        </button>
        <button
          onClick={handleDownload}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Download File
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {!canPreview && !showPreview && (
        <div className="flex items-center gap-3 rounded-md border border-dashed border-zinc-300 px-4 py-6">
          <FileText className="h-8 w-8 text-zinc-400" />
          <div>
            <p className="text-sm font-medium text-zinc-700">{fileName}</p>
            <p className="text-xs text-zinc-500">
              {getCategoryLabel(category)} files cannot be previewed in the
              browser. Use &quot;Open in New Tab&quot; or &quot;Download
              File&quot; to view this document.
            </p>
          </div>
        </div>
      )}

      {showPreview && signedUrl && category === "pdf" && (
        <div className="overflow-hidden rounded-md border border-zinc-200">
          <iframe
            src={signedUrl}
            title={`Preview of ${fileName}`}
            className="h-[600px] w-full"
          />
        </div>
      )}

      {showPreview && signedUrl && category === "image" && (
        <div className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signedUrl}
            alt={`Preview of ${fileName}`}
            className="mx-auto max-h-[600px] rounded object-contain"
          />
        </div>
      )}
    </div>
  );
}
