// ACADEMIC-03-CORRECTIONS: admin-reviewed decisions for specific legacy import
// rows. After ACADEMIC-03 / FIX / RULES built the preview, an admin reviewed the
// remaining review-needed edge cases and confirmed an explicit decision for each
// one. This module holds those decisions and matches them to parsed rows.
//
// Matching uses stable identifiers (sheet name + raw student id + normalized
// legal full name) so a decision applies to one specific row only. Broad
// name-only overrides are intentionally avoided - two students named
// "Manpreet Kaur" on different sheets must not share a decision.
//
// This is preview classification only. No database writes happen here.

import { normalizeNameForImport } from "./normalize";
import type { ParsedLegacyRow } from "./types";

// keep:    valid row, reviewed and allowed to import (no longer blocking).
// correct: keep the row but import it under a corrected student number.
// exclude: reviewed and removed from import (dropped off).
export type ReviewedDecisionKind = "keep" | "correct" | "exclude";

export interface ReviewedDecision {
  sheet: string;
  rawStudentId: string;
  fullName: string;
  kind: ReviewedDecisionKind;
  // For "correct": the corrected canonical student number to use for the
  // preview and for any future ACADEMIC-04 import.
  correctedStudentNumber?: string;
  reason: string;
}

// The confirmed reviewed decisions. Keys are matched on sheet + raw id +
// normalized name, so the exact spelling of the name here is normalized the same
// way as the parsed row before comparison.
const REVIEWED_DECISIONS: ReviewedDecision[] = [
  {
    sheet: "17th March",
    rawStudentId: "12521",
    fullName: "Manpreet Kaur",
    kind: "keep",
    reason: "Reviewed - March 17th Manpreet Kaur is correct",
  },
  {
    sheet: "6th Oct",
    rawStudentId: "125128",
    fullName: "Chandrashekar Sriramalu",
    kind: "keep",
    reason: "Reviewed - valid re-enrolment with different student number",
  },
  {
    sheet: "6th Oct",
    rawStudentId: "125135",
    fullName: "Preet Kaur",
    kind: "keep",
    reason: "Reviewed - October batch Preet Kaur is correct",
  },
  {
    sheet: "Jan 12th",
    rawStudentId: "125216",
    fullName: "Manpreet Kaur",
    kind: "keep",
    reason: "Reviewed - January batch Manpreet Kaur is correct",
  },
  {
    sheet: "April 27",
    rawStudentId: "12593",
    fullName: "Tara Khand Thakuri Shahi",
    kind: "correct",
    correctedStudentNumber: "PSW125293",
    reason: "Reviewed correction - source ID 12593 should import as PSW125293",
  },
  {
    sheet: "April 27",
    rawStudentId: "125213",
    fullName: "Alvin Saji",
    kind: "keep",
    reason: "Reviewed - April 27 re-enrolment is correct",
  },
  {
    sheet: "June 01",
    rawStudentId: "125303",
    fullName: "Souleyman Issa",
    kind: "exclude",
    reason: "Reviewed - dropped off, exclude from import",
  },
];

function decisionKey(
  sheet: string,
  rawStudentId: string,
  fullName: string
): string {
  return [
    sheet.trim().toLowerCase(),
    rawStudentId.trim(),
    normalizeNameForImport(fullName),
  ].join("|");
}

const DECISION_MAP = new Map<string, ReviewedDecision>(
  REVIEWED_DECISIONS.map((d) => [
    decisionKey(d.sheet, d.rawStudentId, d.fullName),
    d,
  ])
);

// Return the reviewed decision for a parsed row, or null if none applies. The
// row must match the decision's sheet, raw student id, and normalized name.
export function findReviewedDecision(
  row: ParsedLegacyRow
): ReviewedDecision | null {
  return (
    DECISION_MAP.get(
      decisionKey(row.sheet, row.rawStudentId, row.legalFullName)
    ) ?? null
  );
}
