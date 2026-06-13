// ACADEMIC-03: normalization helpers for the legacy student Excel import
// preview. These are pure functions (no server/database dependencies) so they
// can be unit reasoned about and reused by both the parser and the matcher.

// ACADEMIC-03-RULES: student numbers are program-specific. PSW monthly sheets
// normalize with a PSW prefix and the ELCE sheet normalizes with an ELCE
// prefix, so ELCE 12101 becomes ELCE12101 and never PSW12101.
export type ProgramPrefix = "PSW" | "ELCE";

export interface NormalizedStudentNumber {
  // The original trimmed value as it appeared in the workbook.
  raw: string;
  // The canonical program-prefixed value used for matching, or null when no
  // digits could be found.
  normalized: string | null;
  // A clearly separated suffix such as "drop" from "125301/drop". Kept only as
  // context, never folded into the normalized id.
  suffix: string | null;
  warnings: string[];
}

// Normalize a raw Student ID value for matching against database student
// numbers, which are stored program-prefixed (for example PSW125315).
//
// The default prefix comes from the sheet's program. An explicit PSW or ELCE
// prefix written in the cell always wins over the sheet default.
//
// Rules with defaultPrefix "PSW":
//   125315       -> PSW125315
//   PSW125315    -> PSW125315
//   PSW 125315   -> PSW125315
//   psw125315    -> PSW125315
//   125301/drop  -> PSW125301 with warning "Student number contains suffix: drop"
//
// Rules with defaultPrefix "ELCE":
//   12101        -> ELCE12101
//   ELCE12101    -> ELCE12101
//   ELCE 12101   -> ELCE12101
export function normalizeStudentNumberForImport(
  rawValue: unknown,
  defaultPrefix: ProgramPrefix = "PSW"
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

  // The canonical id is prefix + digits, but only when the source value
  // actually looks like a student id: an optional program prefix (with
  // optional separator punctuation) followed by digits only. Free text such as
  // a batch banner row ("PSW Evening Batch - 12th May 2025") must not be
  // turned into a fake id from whatever digits it happens to contain.
  let body = working;
  let prefix: ProgramPrefix = defaultPrefix;
  if (body.startsWith("PSW")) {
    prefix = "PSW";
    body = body.slice(3);
  } else if (body.startsWith("ELCE")) {
    prefix = "ELCE";
    body = body.slice(4);
  }
  body = body.replace(/^[-.#:]+/, "");
  if (!/^\d+$/.test(body)) {
    warnings.push(
      body
        ? "Value does not look like a student number"
        : "Student number has no digits"
    );
    return { raw, normalized: null, suffix, warnings };
  }

  return { raw, normalized: `${prefix}${body}`, suffix, warnings };
}

// ACADEMIC-03-RULES: 900 Series ids mark re-enrolled/reappearing students.
// A row is 900 Series when the digits of its normalized id start with 900.
export function is900SeriesStudentNumber(normalized: string | null): boolean {
  if (!normalized) return false;
  const digits = normalized.replace(/^[A-Z]+/, "");
  return digits.startsWith("900");
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
