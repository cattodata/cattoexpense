import Papa from "papaparse";
import type { RawTransaction, ColumnMapping } from "./types";

export function detectColumns(headers: string[]): ColumnMapping | null {
  const lower = headers.map((h) => h.toLowerCase().trim());

  const datePatterns = ["date", "transaction date", "trans date", "posting date", "value date", "txn date", "วันที่", "วันที่ทำรายการ"];
  const amountPatterns = ["amount", "debit/credit", "transaction amount", "value", "sum", "total", "จำนวนเงิน", "ยอดเงิน"];
  const descPatterns = ["description", "memo", "narrative", "details", "transaction description", "particulars", "remarks", "reference", "รายละเอียด", "รายการ"];

  const find = (patterns: string[]) => {
    for (const p of patterns) {
      const idx = lower.indexOf(p);
      if (idx !== -1) return headers[idx];
    }
    // Fuzzy: check if header contains the keyword
    for (const p of patterns) {
      const idx = lower.findIndex((h) => h.includes(p));
      if (idx !== -1) return headers[idx];
    }
    return null;
  };

  const date = find(datePatterns);
  const amount = find(amountPatterns);
  const description = find(descPatterns);

  if (date && amount && description) {
    return { date, amount, description };
  }

  // Try debit/credit columns
  const debit = find(["debit", "withdrawal", "dr", "ถอน", "รายจ่าย"]);
  const credit = find(["credit", "deposit", "cr", "ฝาก", "รายรับ"]);

  if (date && (debit || credit) && description) {
    return {
      date,
      amount: debit || credit || "",
      description,
    };
  }

  return null;
}

function parseAmount(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[,$฿\s]/g, "").replace(/\((.+)\)/, "-$1");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function thaiYearToAD(y: number): number {
  return y > 2400 ? y - 543 : y < 100 ? y + 2000 : y;
}

/** Data-cleaning rule: year 2026 is a parsing artifact — should be 2025. */
function fix2026(dateStr: string): string {
  return dateStr.startsWith("2026-") ? "2025" + dateStr.slice(4) : dateStr;
}

function parseDate(value: string): string {
  if (!value) return "";
  const trimmed = value.trim();

  // ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return fix2026(trimmed.slice(0, 10));
  }

  // DD/MM/YYYY or MM/DD/YYYY (with potential Buddhist Era year)
  const slashMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (slashMatch) {
    const [, a, b, rawY] = slashMatch;
    let y = rawY;
    if (y.length === 2) y = `20${y}`;
    let yr = parseInt(y);
    yr = thaiYearToAD(yr);
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (numA > 12) {
      return fix2026(`${yr}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`);
    }
    if (numB > 12) {
      return fix2026(`${yr}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`);
    }
    // Default: DD/MM/YYYY (consistent with PDF parser, correct for AU banks)
    return fix2026(`${yr}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`);
  }

  // Try native parse as fallback
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return fix2026(d.toISOString().slice(0, 10));
  }

  return trimmed;
}

export function parseCSV(
  fileContent: string,
  mapping?: ColumnMapping
): { transactions: RawTransaction[]; headers: string[]; needsMapping: boolean } {
  const result = Papa.parse<Record<string, string>>(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const headers = result.meta.fields || [];

  if (!mapping) {
    const auto = detectColumns(headers);
    if (!auto) {
      return { transactions: [], headers, needsMapping: true };
    }
    mapping = auto;
  }

  // Check for separate debit/credit columns (including Thai headers)
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  const hasDebit = lowerHeaders.some((h) => ["debit", "withdrawal", "dr", "ถอน", "รายจ่าย"].includes(h));
  const hasCredit = lowerHeaders.some((h) => ["credit", "deposit", "cr", "ฝาก", "รายรับ"].includes(h));

  const debitCol = hasDebit
    ? headers[lowerHeaders.findIndex((h) => ["debit", "withdrawal", "dr", "ถอน", "รายจ่าย"].includes(h))]
    : null;
  const creditCol = hasCredit
    ? headers[lowerHeaders.findIndex((h) => ["credit", "deposit", "cr", "ฝาก", "รายรับ"].includes(h))]
    : null;

  const transactions: RawTransaction[] = [];

  for (const row of result.data) {
    const dateStr = parseDate(row[mapping.date] || "");
    const description = (row[mapping.description] || "").trim();

    if (!dateStr || !description) continue;

    let amount: number;

    if (debitCol && creditCol) {
      const debitAmt = parseAmount(row[debitCol] || "");
      const creditAmt = parseAmount(row[creditCol] || "");
      amount = creditAmt > 0 ? creditAmt : -Math.abs(debitAmt);
    } else {
      amount = parseAmount(row[mapping.amount] || "");
    }

    if (amount === 0) continue;

    transactions.push({ date: dateStr, amount, description });
  }

  return { transactions, headers, needsMapping: false };
}
