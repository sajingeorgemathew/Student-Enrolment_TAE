// ACADEMIC-03: server-only workbook parser for the legacy student Excel import
// preview. Uses exceljs to read an uploaded .xlsx buffer and produce normalized
// rows. No database access and no writes happen here.

import ExcelJS from "exceljs";
import {
  normalizeStudentNumberForImport,
  normalizeNameForImport,
  normalizeEmailForImport,
  looksLikeEmail,
  is900SeriesStudentNumber,
  type ProgramPrefix,
} from "./normalize";
import type {
  ParsedLegacyRow,
  ParseResult,
  RowWarning,
  SkippedSheet,
} from "./types";

// Canonical field names mapped from normalized header text. Headers are matched
// by name, never by column letter, because sheets differ in layout.
type FieldName =
  | "studentId"
  | "firstName"
  | "middleName"
  | "lastName"
  | "dob"
  | "status"
  | "phone"
  | "email"
  | "address"
  | "password"
  | "srNo";

const HEADER_MAP: Record<string, FieldName> = {
  "student id": "studentId",
  "first name": "firstName",
  "middle name": "middleName",
  "last name": "lastName",
  "yyyy mm dd": "dob",
  dob: "dob",
  "date of birth": "dob",
  status: "status",
  wp: "status",
  "wp status": "status",
  "contact no": "phone",
  phone: "phone",
  email: "email",
  address: "address",
  password: "password",
  "sr no": "srNo",
};

// Markers that identify legend/summary/repeated-header rows. A row with no
// usable student number or email whose text matches one of these is treated as
// a non-student row and skipped. These are only consulted for rows that already
// lack an id and email, so real students are never affected.
const LEGEND_MARKERS = [
  "legend",
  "note",
  "notes",
  "total",
  "colour",
  "color",
  "key",
  "placement",
  "withdrawal",
  "enrollment pending",
  "other reason",
  "drop",
  "first name",
  "last name",
  "middle name",
  "student id",
  "graduated",
  // Merged-cell batch title rows repeated inside sheets, for example
  // "PSW Evening Batch - 12th May 2025".
  "evening batch",
];

const MAX_HEADER_SCAN_ROWS = 6;

// Keep raw cell text readable when echoed inside a warning message. Some cells
// contain long junk (for example a row of dots used as a visual divider).
function truncateForMessage(value: string, max = 40): string {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Convert a raw exceljs cell value to a plain string, handling the object
// shapes exceljs produces: hyperlinks ({ text, hyperlink }), formula results
// ({ formula, result }), and rich text ({ richText: [...] }).
function cellToString(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "object") {
    const obj = value as unknown as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text;
    if (Array.isArray(obj.richText)) {
      return obj.richText
        .map((part) => (part as { text?: string }).text ?? "")
        .join("");
    }
    if ("result" in obj) {
      const result = obj.result;
      if (result == null) return "";
      if (result instanceof Date) return result.toISOString().slice(0, 10);
      return String(result);
    }
    if (typeof obj.hyperlink === "string") return obj.hyperlink;
    return "";
  }
  return String(value);
}

function cellToDate(value: ExcelJS.CellValue): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = cellToString(value).trim();
  if (!text) return null;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

// Find the header row index (1-based) for a worksheet by scanning the first few
// rows for one that contains a "Student ID" header. Returns null if none found.
function findHeaderRow(ws: ExcelJS.Worksheet): number | null {
  const maxScan = Math.min(MAX_HEADER_SCAN_ROWS, ws.rowCount);
  for (let r = 1; r <= maxScan; r++) {
    const row = ws.getRow(r);
    let hasStudentId = false;
    for (let c = 1; c <= ws.columnCount; c++) {
      const header = normalizeHeader(cellToString(row.getCell(c).value));
      if (HEADER_MAP[header] === "studentId") {
        hasStudentId = true;
        break;
      }
    }
    if (hasStudentId) return r;
  }
  return null;
}

// Build a map of column index -> field name from a header row. Only the first
// occurrence of each field is kept so duplicate placement-section columns (for
// example a second "STATUS") do not override the student columns.
function buildColumnMap(
  ws: ExcelJS.Worksheet,
  headerRowIndex: number
): Map<number, FieldName> {
  const map = new Map<number, FieldName>();
  const seen = new Set<FieldName>();
  const headerRow = ws.getRow(headerRowIndex);
  for (let c = 1; c <= ws.columnCount; c++) {
    const header = normalizeHeader(cellToString(headerRow.getCell(c).value));
    const field = HEADER_MAP[header];
    if (field && !seen.has(field)) {
      map.set(c, field);
      seen.add(field);
    }
  }
  return map;
}

export async function parseLegacyWorkbook(
  buffer: ArrayBuffer | Buffer
): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  // exceljs accepts a Node Buffer for xlsx.load. The cast bridges a mismatch
  // between the @types/node Buffer generic and exceljs's bundled Buffer type.
  const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  await workbook.xlsx.load(
    nodeBuffer as unknown as Parameters<typeof workbook.xlsx.load>[0]
  );

  const rows: ParsedLegacyRow[] = [];
  const sheetsScanned: string[] = [];
  const sheetsSkipped: SkippedSheet[] = [];

  for (const ws of workbook.worksheets) {
    const headerRowIndex = findHeaderRow(ws);
    if (headerRowIndex == null) {
      sheetsSkipped.push({
        name: ws.name,
        reason: "No Student ID header row found",
      });
      continue;
    }

    const columnMap = buildColumnMap(ws, headerRowIndex);
    if (![...columnMap.values()].includes("studentId")) {
      sheetsSkipped.push({ name: ws.name, reason: "Could not map columns" });
      continue;
    }

    sheetsScanned.push(ws.name);
    // ACADEMIC-03-RULES: normalization is program/sheet aware. The ELCE sheet
    // is a separate program, so its ids normalize with an ELCE prefix; all
    // PSW monthly sheets (and any 900 Series sheet) normalize as PSW.
    const isElce = /elce/i.test(ws.name);
    const is900Sheet = /900/.test(ws.name);
    const programPrefix: ProgramPrefix = isElce ? "ELCE" : "PSW";

    for (let r = headerRowIndex + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const fields: Partial<Record<FieldName, string>> = {};
      let rawDob: ExcelJS.CellValue = null;

      for (const [colIndex, field] of columnMap) {
        const cell = row.getCell(colIndex);
        if (field === "dob") {
          rawDob = cell.value;
          continue;
        }
        // The Password column is read into the map only so it can be ignored
        // here. It is never copied into the output.
        if (field === "password") continue;
        fields[field] = cellToString(cell.value).trim();
      }

      const rawStudentId = (fields.studentId ?? "").trim();
      const legalFirstName = (fields.firstName ?? "").trim();
      const legalMiddleName = (fields.middleName ?? "").trim();
      const legalLastName = (fields.lastName ?? "").trim();
      const rawEmailValue = (fields.email ?? "").trim();
      const phone = (fields.phone ?? "").trim() || null;
      const address = (fields.address ?? "").trim() || null;
      const statusText = (fields.status ?? "").trim() || null;

      const studentNumber = normalizeStudentNumberForImport(
        rawStudentId,
        programPrefix
      );
      const normalizedEmail = normalizeEmailForImport(rawEmailValue);

      const legalFullName = [legalFirstName, legalMiddleName, legalLastName]
        .map((part) => part.replace(/_/g, " ").trim())
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      const normalizedName = normalizeNameForImport(legalFullName);

      // Skip purely empty rows entirely (no identity and no contact data).
      const hasAnyContent =
        rawStudentId ||
        legalFullName ||
        rawEmailValue ||
        phone ||
        address;
      if (!hasAnyContent) continue;

      // Detect legend/summary/repeated-header rows. Only meaningful for rows
      // that lack a usable id and email; the action uses it to decide skips.
      const blob = [rawStudentId, legalFullName, rawEmailValue, statusText]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const looksLikeLegend = LEGEND_MARKERS.some((m) => blob.includes(m));

      // Intrinsic warnings only. Classification-dependent warnings (such as
      // "missing student number") are added by the matcher.
      const warnings: RowWarning[] = [];
      if (studentNumber.suffix) {
        warnings.push({
          type: "student_number_suffix",
          level: "review",
          message: `Student number contains suffix: ${studentNumber.suffix}`,
        });
      }
      if (rawStudentId && !studentNumber.normalized) {
        warnings.push({
          type: "invalid_student_number",
          level: "review",
          message: `Student ID does not look like a ${programPrefix} number: ${truncateForMessage(
            rawStudentId
          )}`,
        });
      }
      if (rawEmailValue && !looksLikeEmail(normalizedEmail)) {
        warnings.push({
          type: "invalid_email_format",
          level: "review",
          message: `Email format looks invalid: ${truncateForMessage(
            rawEmailValue
          )}`,
        });
      }
      if (isElce) {
        warnings.push({
          type: "special_sheet_review",
          level: "review",
          message: "ELCE row - separate program import required",
        });
      }

      // ACADEMIC-03-RULES: 900 Series rows are re-enrolled/reappearing
      // students. The normalized PSW number is kept for reference, but the
      // row must never be imported as a new legacy student.
      const is900Series =
        !isElce &&
        (is900Sheet || is900SeriesStudentNumber(studentNumber.normalized));
      if (is900Series) {
        warnings.push({
          type: "reenrolment_900_series",
          level: "review",
          message:
            "900 Series re-enrolment row - original batch record should be kept",
        });
      }

      rows.push({
        sheet: ws.name,
        rowNumber: r,
        rawStudentId,
        normalizedStudentNumber: studentNumber.normalized,
        studentNumberSuffix: studentNumber.suffix,
        legalFirstName,
        legalMiddleName,
        legalLastName,
        legalFullName,
        normalizedName,
        dateOfBirth: cellToDate(rawDob),
        phone,
        rawEmail: rawEmailValue || null,
        normalizedEmail,
        statusText,
        address,
        isElce,
        is900Series,
        looksLikeLegend,
        warnings,
      });
    }
  }

  return { rows, sheetsScanned, sheetsSkipped };
}
