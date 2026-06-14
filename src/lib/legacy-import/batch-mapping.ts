// ACADEMIC-05: maps a legacy import source sheet name (for example "17th March")
// to an existing PSW batch. This is pure and has no database access: callers
// pass the existing batches they already loaded, and this resolves a match or
// returns null. It never creates a batch - a missing batch is reported as
// "needs batch linkage" so a wrong batch is never linked silently.

// The known PSW monthly source sheet names from the legacy master list. Used to
// recognise a sheet as a PSW batch sheet and to drive the mapping UI copy.
export const PSW_SOURCE_SHEETS = [
  "17th March",
  "12th May",
  "2nd July",
  "18th August",
  "6th Oct",
  "Dec 1st",
  "Jan 12th",
  "March 2",
  "April 27",
  "June 01",
] as const;

// A minimal batch shape - whatever the caller selected from public.batches.
export interface BatchLike {
  id: string;
  batch_name: string | null;
  batch_code: string | null;
}

// Canonical form of a batch/sheet label so small formatting differences do not
// block a match: lower case, ordinal suffixes removed ("1st" -> "1"), month
// names normalised to a short form, punctuation dropped, and tokens sorted so
// "17th March" and "March 17" resolve to the same key.
const MONTHS: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

export function canonicalBatchKey(value: string | null | undefined): string {
  if (!value) return "";
  const tokens = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(\d+)(st|nd|rd|th)\b/g, "$1")
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => {
      if (MONTHS[tok]) return `m${MONTHS[tok]}`;
      // Drop a leading zero on a day number so "01" and "1" agree.
      if (/^\d+$/.test(tok)) return `d${String(parseInt(tok, 10))}`;
      return tok;
    })
    // A bare batch label like "PSW" or "batch" carries no date signal; drop it
    // so it cannot accidentally make two different batches look equal.
    .filter((tok) => tok !== "psw" && tok !== "batch" && tok !== "evening");

  return tokens.sort().join(" ");
}

export type BatchMatch =
  | { status: "matched"; batchId: string }
  | { status: "needs_batch"; reason: string };

// Resolve a source sheet name to exactly one existing PSW batch. Requires an
// unambiguous canonical match against batch_name or batch_code. Anything else
// (no source sheet, no match, or more than one match) is reported as needing
// manual batch linkage rather than guessing.
export function resolveBatchForSheet(
  sourceSheet: string | null | undefined,
  batches: BatchLike[]
): BatchMatch {
  const key = canonicalBatchKey(sourceSheet);
  if (!key) {
    return {
      status: "needs_batch",
      reason: "No source sheet recorded for this student",
    };
  }

  const matches = batches.filter(
    (b) =>
      canonicalBatchKey(b.batch_name) === key ||
      canonicalBatchKey(b.batch_code) === key
  );

  if (matches.length === 1) {
    return { status: "matched", batchId: matches[0].id };
  }
  if (matches.length === 0) {
    return {
      status: "needs_batch",
      reason: `No PSW batch matches source sheet "${sourceSheet}"`,
    };
  }
  return {
    status: "needs_batch",
    reason: `Source sheet "${sourceSheet}" matches more than one PSW batch`,
  };
}
