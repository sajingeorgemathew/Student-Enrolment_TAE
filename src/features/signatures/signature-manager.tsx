"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, XCircle, Star } from "lucide-react";
import type { AdminSignature } from "./actions";
import {
  ALLOWED_SIGNATURE_MIME_TYPES,
  MAX_SIGNATURE_SIZE_BYTES,
  isAllowedSignatureMimeType,
} from "@/lib/signatures/signature-constants";

// ADMIN-SIGNATURE-01: admin-only signature management UI. Handles the upload
// form (name + image), validates type and size on the client before posting to
// the admin-only upload route, lists existing signatures with their preview and
// status, and exposes activate/deactivate and set-default actions. There is no
// hard delete.

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const labelClass = "block text-sm font-medium text-zinc-700";

const acceptAttr = ALLOWED_SIGNATURE_MIME_TYPES.join(",");

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-CA");
}

export function SignatureManager({
  signatures,
}: {
  signatures: AdminSignature[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Per-row busy state for status actions.
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setSuccess(null);
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a name for the signature.");
      return;
    }
    if (!file) {
      setError("Select a signature image to upload.");
      return;
    }
    if (!isAllowedSignatureMimeType(file.type)) {
      setError("Unsupported file type. Upload a PNG, JPG, or WebP image only.");
      return;
    }
    if (file.size > MAX_SIGNATURE_SIZE_BYTES) {
      setError("The image is too large. Maximum size is 2 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("name", trimmedName);
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch("/api/admin/signatures/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Could not upload the signature." }));
        setError(data.error || "Could not upload the signature.");
        return;
      }
      setSuccess(`Signature "${trimmedName}" uploaded.`);
      setName("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleStatusAction(
    id: string,
    action: "activate" | "deactivate" | "set_default"
  ) {
    setRowError(null);
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/signatures/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Could not update the signature." }));
        setRowError(data.error || "Could not update the signature.");
        return;
      }
      router.refresh();
    } catch {
      setRowError("Could not reach the server. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Upload form */}
      <form
        onSubmit={handleUpload}
        className="rounded-lg border border-zinc-200 bg-white p-5"
      >
        <h2 className="text-sm font-semibold text-zinc-900">Upload signature</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Allowed types: PNG, JPG, WebP. Maximum size: 2 MB. Transparent PNG is
          preferred but not required.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="signatureName">
              Name
            </label>
            <input
              id="signatureName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Director signature"
              className={`mt-1 ${inputClass}`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="signatureFile">
              Image file
            </label>
            <input
              id="signatureFile"
              ref={fileInputRef}
              type="file"
              accept={acceptAttr}
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
            />
            {file && (
              <p className="mt-1 text-xs text-zinc-500">
                {file.name} ({formatSize(file.size)})
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="mt-4">
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload signature"}
          </button>
        </div>
      </form>

      {/* Signature list */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Signatures
        </h2>

        {rowError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {rowError}
          </div>
        )}

        {signatures.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white py-12 text-center">
            <p className="text-sm font-medium text-zinc-600">
              No signatures yet
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Uploaded signatures will appear here.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {signatures.map((sig) => {
              const busy = busyId === sig.id;
              return (
                <li
                  key={sig.id}
                  className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {sig.name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {formatDate(sig.created_at)}
                        {sig.uploaded_by_name
                          ? ` / ${sig.uploaded_by_name}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {sig.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                      {sig.is_default && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          <Star className="h-3 w-3" />
                          Default
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preview through the private, role-guarded route */}
                  <div className="mt-3 flex h-28 items-center justify-center rounded-md border border-zinc-100 bg-zinc-50 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/admin/signatures/preview?id=${sig.id}`}
                      alt={`${sig.name} signature preview`}
                      className="max-h-24 max-w-full object-contain"
                    />
                  </div>

                  <p className="mt-2 text-xs text-zinc-400">
                    {formatSize(sig.file_size_bytes)} / {sig.mime_type}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {sig.is_active ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleStatusAction(sig.id, "deactivate")}
                        className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleStatusAction(sig.id, "activate")}
                        className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                      >
                        Activate
                      </button>
                    )}
                    {sig.is_active && !sig.is_default && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleStatusAction(sig.id, "set_default")}
                        className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                      >
                        Set as default
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
