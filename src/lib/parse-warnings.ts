/**
 * Centralized parse-warning system.
 * Instead of silently dropping lines that don't match, parsers push
 * warnings here so the UI can surface them to the user.
 */

export type ParseWarningLevel = "info" | "warn" | "error";

export interface ParseWarning {
  level: ParseWarningLevel;
  stage: "date" | "amount" | "column" | "noise" | "bank" | "category" | "general";
  message: string;
  /** The raw input that caused the warning (for debugging) */
  raw?: string;
  /** Line number or index in the source file */
  line?: number;
}

let warnings: ParseWarning[] = [];

export function clearWarnings(): void {
  warnings = [];
}

export function addWarning(w: ParseWarning): void {
  warnings.push(w);
}

export function getWarnings(): ParseWarning[] {
  return [...warnings];
}

/** Convenience: warn about a line that was skipped */
export function warnSkipped(
  stage: ParseWarning["stage"],
  reason: string,
  raw?: string,
  line?: number,
): void {
  addWarning({ level: "warn", stage, message: reason, raw, line });
}

/** Convenience: info-level note */
export function infoNote(
  stage: ParseWarning["stage"],
  message: string,
  raw?: string,
): void {
  addWarning({ level: "info", stage, message, raw });
}
