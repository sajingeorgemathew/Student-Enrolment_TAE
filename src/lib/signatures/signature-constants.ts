// ADMIN-SIGNATURE-01: shared signature upload constraints.
// Used by both the client upload form and the server upload route so the
// allowed types and size limit stay in sync.

export const SIGNATURE_STORAGE_BUCKET = "admin-signatures";

// Allowed image mime types. Must match the admin_signatures_mime_type_check
// constraint in the migration.
export const ALLOWED_SIGNATURE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type SignatureMimeType = (typeof ALLOWED_SIGNATURE_MIME_TYPES)[number];

// Maximum signature file size: 2 MB.
export const MAX_SIGNATURE_SIZE_BYTES = 2 * 1024 * 1024;

export const MAX_SIGNATURE_NAME_LENGTH = 120;

export function isAllowedSignatureMimeType(
  value: string
): value is SignatureMimeType {
  return (ALLOWED_SIGNATURE_MIME_TYPES as readonly string[]).includes(value);
}

// Turn an arbitrary upload file name into a storage-safe name. Keeps the
// extension where possible and falls back to a generic name. This never affects
// the directory portion of the storage path (the signature id).
export function safeSignatureFileName(originalName: string): string {
  const trimmed = (originalName || "").trim();
  const dot = trimmed.lastIndexOf(".");
  const rawExt = dot >= 0 ? trimmed.slice(dot + 1).toLowerCase() : "";
  const ext = /^[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : "";
  const base = (dot >= 0 ? trimmed.slice(0, dot) : trimmed)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const safeBase = base || "signature";
  return ext ? `${safeBase}.${ext}` : safeBase;
}
