// ACADEMIC-03: normalization helpers for the legacy student Excel import
// preview. These are pure functions (no server/database dependencies) so they
// can be unit reasoned about and reused by both the parser and the matcher.

export interface NormalizedStudentNumber {
  // The original trimmed value as it appeared in the workbook.
  raw: string;
  // The canonical PSW-prefixed value used for matching, or null when no digits
  // could be found.
  normalized: string | null;
  // A clearly separated suffix such as "drop" from "125301/drop". Kept only as
  // context, never folded into the normalized id.
  suffix: string | null;
  warnings: string[];
}

// Normalize a raw Student ID value for matching against database student
// numbers, which are stored PSW-prefixed (for example PSW125315).
//
// Rules:
//   125315       -> PSW125315
//   PSW125315    -> PSW125315
//   PSW 125315   -> PSW125315
//   psw125315    -> PSW125315
//   125301/drop  -> PSW125301 with warning "Student number contains suffix: drop"
export function normalizeStudentNumberForImport(
  rawValue: unknown
): NormalizedStudentNumber {
  const warnings: string[] = [];
  const raw = rawValue == null ? "" : String(rawValue).trim();

  if (!raw) {
    return { raw: "", normalized: null, suffix: null, warnings };
  }

  let working = raw.toUpperCase();
  let suffix: string | null = null;

  // Pull off a clear suffix marker like "/drop". The portion before the first
  // slash is treated as the real id; the remainder becomes a warning only.
  if (working.includes("/")) {
    const slashIndex = working.indexOf("/");
    const suffixText = working.slice(slashIndex + 1).trim();
    working = working.slice(0, slashIndex);
    if (suffixText) {
      suffix = suffixText.toLowerCase();
      warnings.push(`Student number contains suffix: ${suffix}`);
    }
  }

  // Remove internal spaces so "PSW 125315" collapses to "PSW125315".
  working = working.replace(/\s+/g, "");

  // The canonical id is always PSW + the digits found in the value, regardless
  // of whether the source already had a PSW prefix or not.
  const digits = working.replace(/\D/g, "");
  if (!digits) {
    warnings.push("Student number has no digits");
    return { raw, normalized: null, suffix, warnings };
  }

  return { raw, normalized: `PSW${digits}`, suffix, warnings };
}

// Normalize a name for comparison and duplicate warnings.
//   "Preeti _"        -> "PREETI"
//   "Manpreet  Kaur"  -> "MANPREET KAUR"
export function normalizeNameForImport(rawValue: unknown): string {
  if (rawValue == null) return "";
  return String(rawValue)
    // underscores are used as placeholders for missing parts of the name
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

// Normalize an email for matching: trim and lowercase. Returns null for empty
// values. The "mailto:" prefix and stray %20 from spreadsheet hyperlinks are
// stripped so the comparable value is just the address.
export function normalizeEmailForImport(rawValue: unknown): string | null {
  if (rawValue == null) return null;
  let value = String(rawValue).trim().toLowerCase();
  if (value.startsWith("mailto:")) {
    value = value.slice("mailto:".length);
  }
  value = value.replace(/%20/g, "").trim();
  if (!value) return null;
  return value;
}

// Loose validity check used only to raise a warning, not to block a row.
export function looksLikeEmail(value: string | null): boolean {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
