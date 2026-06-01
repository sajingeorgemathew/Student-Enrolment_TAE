"use client";

import { useState } from "react";
import { Download, ChevronDown, ChevronUp } from "lucide-react";
import type { ContractGenerationRecord } from "./actions";

function downloadUrl(storagePath: string, fileName: string): string {
  const params = new URLSearchParams({
    bucket: "student-documents",
    path: storagePath,
    fileName,
  });
  return `/api/documents/download?${params.toString()}`;
}

export function ContractGenerationHistory({
  generations,
  canDownload = false,
}: {
  generations: ContractGenerationRecord[];
  canDownload?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);

  if (generations.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No generated contracts recorded yet.
      </p>
    );
  }

  const latest = generations[0];
  const hasHistory = generations.length > 1;
  const olderRecords = generations.slice(1);

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-zinc-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-900">
              Latest generated contract
            </p>
            <p className="mt-1 text-sm text-zinc-600">{latest.file_name}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Generated{" "}
              {new Date(latest.generated_at).toLocaleDateString("en-CA")}{" "}
              {new Date(latest.generated_at).toLocaleTimeString("en-CA", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {latest.generated_by_name
                ? ` by ${latest.generated_by_name}`
                : ""}
            </p>
          </div>
          {latest.storage_path && canDownload && (
            <a
              href={downloadUrl(latest.storage_path, latest.file_name)}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          )}
          {!latest.storage_path && (
            <span className="text-xs text-zinc-400">
              Downloaded at generation time
            </span>
          )}
        </div>
      </div>

      {hasHistory && (
        <div>
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            {showAll ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {showAll ? "Hide" : "Show"} previous generations (
            {olderRecords.length})
          </button>

          {showAll && (
            <div className="mt-3 space-y-2">
              {olderRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-md border border-zinc-100 px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm text-zinc-700">{record.file_name}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(record.generated_at).toLocaleDateString(
                        "en-CA"
                      )}{" "}
                      {new Date(record.generated_at).toLocaleTimeString(
                        "en-CA",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                      {record.generated_by_name
                        ? ` by ${record.generated_by_name}`
                        : ""}
                    </p>
                  </div>
                  {record.storage_path && canDownload && (
                    <a
                      href={downloadUrl(record.storage_path, record.file_name)}
                      className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
