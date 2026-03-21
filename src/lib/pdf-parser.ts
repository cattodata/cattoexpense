import type { RawTransaction } from "./types";
import { clearWarnings, warnSkipped, infoNote } from "./parse-warnings";
import { detectBankAdapter, type BankAdapter } from "./bank-adapters";

// --- Amount Parsing ---

interface AmountMatch {
  value: number;
  index: number;
  raw: string;
}

function parseAmountValue(raw: string): number | null {
  let cleaned = raw.trim();
  const isCredit = /CR$/i.test(cleaned);
  const isDebit = /DR$/i.test(cleaned);
  cleaned = cleaned.replace(/\s*(CR|DR)\s*$/i, "");
  const isParenNeg = cleaned.startsWith("(") && cleaned.endsWith(")");
  const hasLeadingMinus = /^\s*-/.test(cleaned);
  // Trailing minus (CBA format: "9.62-" means credit/refund)
  const hasTrailingMinus = /\d-\s*$/.test(cleaned);
  cleaned = cleaned.replace(/[$£€¥₹฿()\s-]/g, "").replace(/,/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  if (isParenNeg || isDebit || hasLeadingMinus || hasTrailingMinus) return -Math.abs(num);
  if (isCredit) return Math.abs(num);
  return num;
}

/**
 * Find all amounts on a line — both currency-prefixed ($) and plain decimals.
 * Also handles CBA debit format: "16,000.00 (" where trailing ( means debit.
 */
function findAmounts(line: string): AmountMatch[] {
  const results: AmountMatch[] = [];
  const coveredRanges: [number, number][] = [];

  // 1. Currency-prefixed amounts ($, £, €, ฿) — accept 1-3 decimal places
  const currRe = /-?\s?[$£€¥₹฿]\s?[\d,]+\.\d{1,3}-?(?:\s*(?:CR|DR))?/gi;
  let m: RegExpExecArray | null;
  while ((m = currRe.exec(line)) !== null) {
    const val = parseAmountValue(m[0]);
    if (val !== null && val !== 0) {
      results.push({ value: val, index: m.index, raw: m[0] });
      coveredRanges.push([m.index, m.index + m[0].length]);
    }
  }

  // 2. Plain decimal amounts — always check (don't skip if currency found)
  // Also captures trailing ( for CBA debit format: "110.00 ("
  // Accept 1-3 decimal places for international formats
  const plainRe = /([\d,]+\.\d{1,3}-?)(\s*\()?/g;
  let pm: RegExpExecArray | null;
  while ((pm = plainRe.exec(line)) !== null) {
    if (pm.index < 6) continue;
    // Skip if overlapping with already-found currency amount
    const overlaps = coveredRanges.some(([s, e]) => pm!.index >= s && pm!.index < e);
    if (overlaps) continue;

    const val = parseAmountValue(pm[1]);
    if (val !== null && val !== 0) {
      // Trailing ( means debit in CBA account statements
      const isDebit = pm[2]?.trim() === "(";
      const finalVal = isDebit ? -Math.abs(val) : val;
      results.push({ value: finalVal, index: pm.index, raw: pm[0] });
    }
  }

  // Sort by position in line (left to right)
  results.sort((a, b) => a.index - b.index);
  return results;
}

/**
 * Filter out balance column amounts.
 * In 3-column statements (Debit/Credit/Balance), the rightmost amount
 * ending in CR/DR is the running balance — not a transaction amount.
 */
function filterOutBalance(amounts: AmountMatch[]): AmountMatch[] {
  if (amounts.length <= 1) return amounts;
  const last = amounts[amounts.length - 1];
  if (/CR|DR/i.test(last.raw)) {
    return amounts.slice(0, -1);
  }
  return amounts;
}

// --- Date Parsing ---

const THAI_MONTHS: Record<string, string> = {
  "ม.ค.": "01", "มกราคม": "01",
  "ก.พ.": "02", "กุมภาพันธ์": "02",
  "มี.ค.": "03", "มีนาคม": "03",
  "เม.ย.": "04", "เมษายน": "04",
  "พ.ค.": "05", "พฤษภาคม": "05",
  "มิ.ย.": "06", "มิถุนายน": "06",
  "ก.ค.": "07", "กรกฎาคม": "07",
  "ส.ค.": "08", "สิงหาคม": "08",
  "ก.ย.": "09", "กันยายน": "09",
  "ต.ค.": "10", "ตุลาคม": "10",
  "พ.ย.": "11", "พฤศจิกายน": "11",
  "ธ.ค.": "12", "ธันวาคม": "12",
};

function thaiYearToAD(y: number): number {
  return y > 2400 ? y - 543 : y < 100 ? y + 2000 : y;
}

const EN_MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  january: "01", february: "02", march: "03", april: "04", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

/**
 * Resolve the year for a transaction date that has no explicit year.
 *
 * Cross-year logic: statements can span two calendar years (e.g. Nov 2025 → Jan 2026).
 * - closingYear/closingMonth = end of statement period
 * - startYear/startMonth = start of statement period (if known)
 *
 * We use the range [startMonth..closingMonth] to decide which year a transaction
 * belongs to. If startMonth > closingMonth, the statement crosses a year boundary
 * and months >= startMonth belong to (closingYear - 1).
 */
function resolveYear(
  rawYear: string | undefined,
  fallbackYear: number | undefined,
  mm: string,
  closingMonth: number | undefined,
  startMonth?: number,
  startYear?: number,
): number | null {
  if (rawYear) {
    let yr = parseInt(rawYear);
    if (yr < 100) yr += 2000;
    yr = thaiYearToAD(yr);
    // Reject implausible years (merchant numbers like 1001)
    if (yr < 1900 || yr > 2100) return null;
    return yr;
  }
  const yr = fallbackYear || new Date().getFullYear();
  const txMonth = parseInt(mm);

  // If we know both start and end of the statement period
  if (startMonth && closingMonth && startYear !== undefined) {
    if (startYear < yr) {
      // Statement crosses year boundary (e.g. Nov 2025 → Jan 2026)
      // Months >= startMonth belong to startYear, months <= closingMonth belong to yr
      if (txMonth >= startMonth) return startYear;
      return yr;
    }
    // Same year — no adjustment needed
    return yr;
  }

  // Fallback: simple cross-year heuristic (when we only know closing month)
  // Only subtract a year if the statement clearly spans a year boundary:
  // closingMonth is early in the year (Jan-Mar) and txMonth is late (Oct-Dec)
  if (closingMonth && closingMonth <= 3 && txMonth >= 10) {
    return yr - 1;
  }
  return yr;
}

function normalizeDate(raw: string, fallbackYear?: number, closingMonth?: number, startMonth?: number, startYear?: number): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // Thai date: DD <ThaiMonth> YYYY(BE)
  for (const [thaiMonth, mm] of Object.entries(THAI_MONTHS)) {
    const escaped = thaiMonth.replace(/\./g, "\\.");
    const re = new RegExp(`^(\\d{1,2})\\s*${escaped}\\.?\\s*(\\d{2,4})$`, "i");
    const m = trimmed.match(re);
    if (m) {
      const dd = m[1].padStart(2, "0");
      const yy = thaiYearToAD(parseInt(m[2]));
      return `${yy}-${mm}-${dd}`;
    }
  }

  // "01 Jan 2024", "01 Jan 24", or "01 Jan" (day-first English month)
  // Also handles extra whitespace/punctuation between parts
  const dayFirstMatch = trimmed.match(
    /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?(?:\s+(\d{2,4}))?$/i
  );
  if (dayFirstMatch) {
    const dd = dayFirstMatch[1].padStart(2, "0");
    const mm = EN_MONTHS[dayFirstMatch[2].toLowerCase().slice(0, 3)];
    const yr = resolveYear(dayFirstMatch[3], fallbackYear, mm, closingMonth, startMonth, startYear);
    if (yr === null) return "";
    return `${yr}-${mm}-${dd}`;
  }

  // "October 25" or "October 25, 2024" — full month name first (Amex)
  const fullMonthFirstMatch = trimmed.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:,?\s+(\d{2,4}))?$/i
  );
  if (fullMonthFirstMatch) {
    const mm = EN_MONTHS[fullMonthFirstMatch[1].toLowerCase()];
    const dd = fullMonthFirstMatch[2].padStart(2, "0");
    const yr = resolveYear(fullMonthFirstMatch[3], fallbackYear, mm, closingMonth, startMonth, startYear);
    if (yr === null) return "";
    return `${yr}-${mm}-${dd}`;
  }

  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY (also handles YYYY/MM/DD)
  const slashMatch = trimmed.match(/^(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (slashMatch) {
    const [, a, b, c] = slashMatch;
    // YYYY/MM/DD format (first part is 4 digits)
    if (a.length === 4) {
      const yr = thaiYearToAD(parseInt(a));
      return `${yr}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
    }
    let y = c;
    if (y.length === 2) y = `20${y}`;
    let yr = parseInt(y);
    yr = thaiYearToAD(yr);
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (numA > 12) return `${yr}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
    if (numB > 12) return `${yr}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`;
    // Default: DD/MM/YYYY (AU banks)
    return `${yr}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
  }

  // Last resort — only use Date() parser for strings that contain a year
  if (/\b\d{4}\b/.test(trimmed)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  warnSkipped("date", `Could not parse date: "${trimmed}"`, trimmed);
  return "";
}

// Build Thai month alternation for startDate regex
const THAI_MONTH_ALTS = Object.keys(THAI_MONTHS)
  .map((k) => k.replace(/\./g, "\\."))
  .join("|");
const THAI_DATE_START_RE = new RegExp(
  `^(\\d{1,2}\\s*(?:${THAI_MONTH_ALTS})\\.?\\s*\\d{2,4})\\b`
);

function startDate(line: string): string | null {
  const m1 = line.match(/^(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})\b/);
  if (m1) return m1[1];
  // "January 25" or "October 25, 2024" — full month name first (Amex)
  const m5 = line.match(
    /^((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{2,4})?)\b/i
  );
  if (m5) return m5[1];
  // "Jan 01, 2024" — month first (abbreviated)
  const m2 = line.match(
    /^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{2,4})\b/i
  );
  if (m2) return m2[1];
  // "01 Jan" or "01 Jan 2024" or "01 Jan 24" — day first (CommBank, Westpac, ANZ, etc.)
  // Year part only matches 2-digit (24) or 4-digit starting with 19/20 to avoid capturing merchant numbers like "1001"
  const m4 = line.match(
    /^(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?(?:\s+(?:(?:19|20)\d{2}|\d{2}(?!\d)))?)\b/i
  );
  if (m4) return m4[1];
  const m3 = line.match(THAI_DATE_START_RE);
  if (m3) return m3[1];
  return null;
}

// --- Bank Detection ---

const BANK_PATTERNS: [RegExp, string][] = [
  [/\bhsbc\b/i, "HSBC"],
  [/\bkasikorn|\bkbank|\bกสิกรไทย\b/i, "KBank"],
  [/\bscb\b|siam\s*commercial|\bไทยพาณิชย์\b/i, "SCB"],
  [/\bbangkok\s*bank|\bกรุงเทพ\b|\bbbl\b/i, "Bangkok Bank"],
  [/\bkrungsri|\bayudhya|\bกรุงศรีอยุธยา\b/i, "Krungsri"],
  [/\bktb\b|\bkrungthai|\bกรุงไทย\b/i, "Krungthai"],
  [/\btmb\b|\bttb\b|\bthanachart|\bทหารไทยธนชาต\b/i, "TTB"],
  [/\buob\b/i, "UOB"],
  [/\bciti\b|\bcitibank\b/i, "Citibank"],
  [/\banz\b/i, "ANZ"],
  [/\bcommbank|\bcommonwealth\b/i, "CommBank"],
  [/\bwestpac\b/i, "Westpac"],
  [/\bnab\b|national\s*australia/i, "NAB"],
  [/\bchase\b|\bjpmorgan\b/i, "Chase"],
  [/\bamex\b|american\s*express/i, "Amex"],
  [/\bbarclays\b/i, "Barclays"],
];

function detectBank(lines: string[]): string {
  const sample = lines.slice(0, 80).join(" ");
  for (const [re, name] of BANK_PATTERNS) {
    if (re.test(sample)) return name;
  }
  return "Unknown";
}

// --- Statement Type Detection ---

function isCreditCardStatement(lines: string[]): boolean {
  const sample = lines.slice(0, 60).join(" ").toLowerCase();
  let score = 0;
  if (/credit\s*card/.test(sample)) score += 2;
  if (/credit\s*limit/.test(sample)) score += 2;
  if (/minimum\s*payment/.test(sample)) score += 1;
  if (/available\s*credit/.test(sample)) score += 1;
  if (/cash\s*(?:advance|rate)/.test(sample)) score += 1;
  // Thai credit card patterns
  if (/วงเงินคงเหลือ|ยอดชำระขั้นต่ำ|บัตรเครดิต/.test(sample)) score += 3;
  // Amex patterns
  if (/\bamex\b|american\s*express/i.test(sample)) score += 2;
  if (/card\s*member/i.test(sample)) score += 1;
  if (/membership\s*rewards?/i.test(sample)) score += 1;
  return score >= 3;
}

// --- Noise Filtering ---

const SKIP_RE: RegExp[] = [
  /opening\s+balance/i,
  /closing\s+balance/i,
  /minimum\s+payment/i,
  /payment\s+due\s+date/i,
  /statement\s+period/i,
  /credit\s+limit/i,
  /available\s+credit/i,
  /interest\s+rate/i,
  /original\s+transaction\s+amount/i,
  /page\s+\d+\s+of\s+\d+/i,
  /transaction\s+date.*(?:detail|description|amount)/i,
  /account\s+number.*(?:statement|payment)/i,
  /biller\s+code/i,
  /receipt\s+number/i,
  /^\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\b/,
  /if\s+you\s+make\b/i,
  /you\s+will\s+(?:pay|end)/i,
  /please\s+(?:visit|refer|present|detach)/i,
  /issued\s+by\b/i,
  /resolving\s+disputes/i,
  /having\s+trouble/i,
  /repayment\s+warning/i,
  /years?\s+and\s+\d+\s+months?/i,
  /saving\s+of\s+\$/i,
  /estimated\s+total/i,
  /(?:visit|go\s+to|see|log\s+on|log\s+in)\s+.*https?:\/\//i,
  /(?:visit|go\s+to|see|log\s+on|log\s+in)\s+.*www\.\w/i,
  /^https?:\/\//i,
  /^www\.\w/i,
  /(?:afca|abn|gpo\s+box)\b/i,
  /complaint/i,
  /pay\s+(?:online|by\s+mail|in\s+person)\b/i,
  /scan\s+the\s+qr/i,
  /financial\s+institution/i,
  /only\s+the\s+minimum/i,
  /for\s+a\s+list\s+of/i,
  /see\s+any\s+transactions/i,
  /contact\s+us/i,
  /this\s+calculation/i,
  /e-statements/i,
  /manage\s+your/i,
  /\brewards?\s+points?\b/i,
  /\bregister\s+call\b/i,
  /\bbranch(?:es)?\s+(?:are|open)\b/i,
  /enclose\s+this/i,
  /ensure\s+the\s+account/i,
  /payments?\s+made\s+after/i,
  /to\s+organi[sz]e/i,
  /^\s*[•●○■□▪▫]/,
  /(?:previous|current|available|running|statement)\s+balance/i,
  /balance\s+(?:brought|carried|forward|due|b\/f|c\/f)/i,
  /your\s+(?:payment|balance|account|card)\b/i,
  /payment\s+slip/i,
  /cheque\s+payable/i,
  /cut[\s-]*off/i,
  /easy\s+pay/i,
  /bpay\s+(?:biller|code|reference|crn)\b/i,
  /p\.a\.\b/i,
  /credit\s+cards?\s+online/i,
  /you\s+can\s+access/i,
  /set\s+up\s+/i,
  /make\s+a\s+(?:payment|redemption)/i,
  /recent\s+transactions/i,
  /please\s+note/i,
  /please\s+allow/i,
  /please\s+present/i,
  /^\$[\d,]+\.\d{2}\s+\d+\s+years?/i,
  // Interest rates and fee summary lines (CBA footer)
  /(?:purchase|cash\s+advance|penalty|annual|promotional)\s+rate/i,
  /\d+\.\d+\s*%/,
  /interest\s+charged\s+on/i,
  /monthly\s+fee\s+waived/i,
  /fee\s+saved/i,
  /fee\s+waived/i,
  /\brate\s+\d+\.\d+/i,
  // Fee lines where actual charge is $0.00 (CBA fee-free cards show "$0.00 $X.XX" = fee saved)
  /\bfee\b.*(?:\$\s*0\.00|(?:^|\s)0\.00(?:\s|$))/i,
  // Amex noise: currency name lines (foreign transactions)
  /^(?:JAPANESE\s+YEN|EUROPEAN\s+UNION\s+EURO|BRITISH\s+POUND|US\s+DOLLAR|CANADIAN\s+DOLLAR|NEW\s+ZEALAND\s+DOLLAR|SINGAPORE\s+DOLLAR|HONG\s+KONG\s+DOLLAR|THAI(?:LAND)?\s+BAHT|CHINESE\s+YUAN|KOREAN\s+WON|SWISS\s+FRANC|INDIAN\s+RUPEE|INDONESIAN\s+RUPIAH|MALAYSIAN\s+RINGGIT|PHILIPPINE\s+PESO|TAIWANESE\s+DOLLAR|VIETNAMESE\s+DONG|UNITED\s+ARAB|ICELANDIC\s+KRONA|SWEDISH\s+KRONA|NORWEGIAN\s+KRONE|DANISH\s+KRONE|SOUTH\s+AFRICAN\s+RAND|FIJI\s+DOLLAR)(?:\s+(?:CR|DR))?\s*$/i,
  // Amex noise: conversion commission lines
  /includes?\s+(?:a\s+)?conversion\s+commission/i,
  /conversion\s+(?:rate|fee|commission)/i,
  // Amex noise: section headers and subtotals
  /^total\s+(?:of\s+)?(?:new\s+)?(?:payments?|charges?|credits?|(?:standard\s+)?transactions?|interest)\b/i,
  /^(?:new\s+)?(?:charges?|payments?|credits?|(?:standard\s+)?transactions?)(?:\s+for\b|\s*$)/i,
  /^card\s+number\b/i,
  /^prepared\s+for\b/i,
  /^(?:other\s+)?(?:transactions?|debits?|credits?|charges?)\s+(?:this\s+)?(?:month|period|statement)\b/i,
  /^(?:balance|amount)\s+(?:due|owing|payable)\b/i,
  /^(?:closing\s+date|payment\s+due|due\s+date)\b/i,
  /membership\s+(?:since|number|rewards?)\b/i,
  /^card\s+(?:member|holder)\s+since\b/i,
  /^(?:new|previous)\s+balance\b/i,
  /^payments?\s+received\b/i,
  /^interest\s+charges?\b/i,
];

function isNoiseLine(line: string): boolean {
  return SKIP_RE.some((re) => re.test(line));
}

/** Detect Amex foreign currency name lines (e.g. "THAILAND BAHT", "ICELANDIC KRONA CR") */
const FOREIGN_CURRENCY_RE = /^(?:JAPANESE\s+YEN|EUROPEAN\s+UNION\s+EURO|BRITISH\s+POUND|US\s+DOLLAR|CANADIAN\s+DOLLAR|NEW\s+ZEALAND\s+DOLLAR|SINGAPORE\s+DOLLAR|HONG\s+KONG\s+DOLLAR|THAI(?:LAND)?\s+BAHT|CHINESE\s+YUAN|KOREAN\s+WON|SWISS\s+FRANC|INDIAN\s+RUPEE|INDONESIAN\s+RUPIAH|MALAYSIAN\s+RINGGIT|PHILIPPINE\s+PESO|TAIWANESE\s+DOLLAR|VIETNAMESE\s+DONG|UNITED\s+ARAB|ICELANDIC\s+KRONA|SWEDISH\s+KRONA|NORWEGIAN\s+KRONE|DANISH\s+KRONE|SOUTH\s+AFRICAN\s+RAND|FIJI\s+DOLLAR)(?:\s+(?:CR|DR))?\s*$/i;

function isForeignCurrencyLine(line: string): boolean {
  return FOREIGN_CURRENCY_RE.test(line.trim());
}

/** Detect credit card bill payments — these are transfers, not income. */
function isCardPayment(description: string): boolean {
  return /\b(?:bpay\s+payment|payment\s+received|payment\s*-?\s*thank|autopay|auto\s+pay|direct\s+debit\s+payment|internet\s+banking\s+payment|phone\s+banking\s+payment|payment\s+received\s+with\s+thanks)\b/i.test(description);
}

/** Detect refund/credit lines — these ARE income (money returned to card). */
function isRefundOrCredit(description: string, amountRaw: string): boolean {
  if (/CR$/i.test(amountRaw.trim())) return true;
  return /\b(?:refund|return|reversal|cashback|cash\s*back|credit\s*adj|rebate)\b/i.test(description);
}

/** Check for standalone CR/DR after the captured amount text. */
function hasTrailingCR(source: string, amtIndex: number, amtRaw: string): boolean {
  const after = source.slice(amtIndex + amtRaw.length).trim();
  return /^CR\b/i.test(after);
}

function isFeeOrChargeLine(description: string): boolean {
  if (description.length > 60 || description.length < 3) return false;
  return /\b(?:fee|charge|interest|surcharge|levy|tax)\b/i.test(description);
}

interface PageItem { x: number; y: number; str: string }

async function extractPageItems(arrayBuffer: ArrayBuffer): Promise<PageItem[][]> {
  const pdfjsLib = await import("pdfjs-dist");

  // Self-host the worker to avoid CDN supply-chain risks
  const basePath = process.env.NODE_ENV === "production" ? "/cattoexpense" : "";
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${basePath}/pdf.worker.min.mjs`;

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const allPages: PageItem[][] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const pageItems: PageItem[] = [];
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const tx =
        "transform" in item ? (item.transform as number[]) : [1, 0, 0, 1, 0, 0];
      // Filter out rotated/vertical text (e.g. CommBank margin codes like "38.724.1.3.ZZ396...")
      // Normal horizontal text has transform [fontSize, 0, 0, fontSize, x, y]
      // Rotated text has non-zero tx[1] or tx[2]
      if (Math.abs(tx[1]) > 0.1 || Math.abs(tx[2]) > 0.1) continue;

      let str = item.str;
      // Some PDFs render decimal points as spaces: "$43,400 00" → "$43,400.00", "5 90" → "5.90"
      // Also handle single-space or multiple-space separators between integer and decimal parts.
      // Only applies to strings that are entirely amount-like (prevents false positives).
      const trimStr = str.trim();
      if (/\d\s+\d{1,3}\s*$/.test(trimStr) && /^-?[$£€¥₹฿]?[\s-]?[\d,]+\s+\d{1,3}\s*$/.test(trimStr)) {
        str = str.replace(/(\d)\s+(\d{1,3})\s*$/, "$1.$2");
      }

      pageItems.push({ x: tx[4], y: tx[5], str });
    }
    allPages.push(pageItems);
  }

  return allPages;
}

function groupItemsIntoLines(allPages: PageItem[][], yThreshold: number): string[] {
  const lines: string[] = [];

  for (const pageItems of allPages) {
    // Sort by Y descending (PDF origin = bottom-left → top-down visual order)
    const sorted = [...pageItems].sort((a, b) => b.y - a.y);

    // Group items into lines — items within yThreshold of each group's reference Y
    // (AMEX and some bank PDFs place items on the same visual line at slightly different Y)
    let groupRefY = sorted[0]?.y ?? 0;
    let currentGroup: PageItem[] = [];

    for (const item of sorted) {
      if (currentGroup.length > 0 && Math.abs(item.y - groupRefY) > yThreshold) {
        currentGroup.sort((a, b) => a.x - b.x);
        const lineText = currentGroup.map((it) => it.str).join(" ").trim();
        if (lineText) lines.push(lineText);
        currentGroup = [];
        groupRefY = item.y;
      }
      currentGroup.push(item);
    }
    if (currentGroup.length > 0) {
      currentGroup.sort((a, b) => a.x - b.x);
      const lineText = currentGroup.map((it) => it.str).join(" ").trim();
      if (lineText) lines.push(lineText);
    }
  }

  // Merge standalone CR/DR markers with the previous line
  // (PDF text extraction may place CR/DR at a slightly different Y-position)
  for (let i = lines.length - 1; i > 0; i--) {
    if (/^\s*(?:CR|DR)\s*$/i.test(lines[i])) {
      lines[i - 1] += " " + lines[i].trim();
      lines.splice(i, 1);
    }
  }

  // Merge standalone ( with previous line (CBA debit indicator on separate Y-position)
  for (let i = lines.length - 1; i > 0; i--) {
    if (/^\s*\(\s*$/.test(lines[i])) {
      lines[i - 1] += " (";
      lines.splice(i, 1);
    }
  }

  return lines;
}

/** Parse a header date like "16 Jan 2026" or "January 16, 2026" into {month, year} */
function parseHeaderDate(str: string): { month: number; year: number } | null {
  // "16 Jan 2026" or "16 January 2026"
  const dayFirst = str.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(20\d{2})/i);
  if (dayFirst) {
    return {
      month: parseInt(EN_MONTHS[dayFirst[2].toLowerCase().slice(0, 3)] || "0"),
      year: parseInt(dayFirst[3]),
    };
  }
  // "January 16, 2026"
  const monthFirst = str.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+(20\d{2})/i);
  if (monthFirst) {
    return {
      month: parseInt(EN_MONTHS[monthFirst[1].toLowerCase()] || "0"),
      year: parseInt(monthFirst[2]),
    };
  }
  return null;
}

/** Try to find year and closing month from statement header lines.
 *
 *  CommBank fix: look for "Statement Period: DD Mon YYYY to DD Mon YYYY" and
 *  extract BOTH the start and end dates. The closing (end) date determines
 *  the year + closingMonth. The start date's month is also stored so the
 *  cross-year logic knows which months belong to which year.
 */
function detectStatementYear(lines: string[]): {
  year: number | undefined;
  closingMonth: number | undefined;
  startMonth: number | undefined;
  startYear: number | undefined;
} {
  const sample = lines.slice(0, 80).join(" ");

  // 1. "Statement Period: DD Mon YYYY to DD Mon YYYY" (CommBank, ANZ, etc.)
  //    Also matches "from DD Mon YYYY to DD Mon YYYY"
  const periodRangeMatch = sample.match(
    /(?:statement\s+period|account\s+summary)[^]*?(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+20\d{2})\s+(?:to|-|–)\s+(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+20\d{2})/i
  );
  if (periodRangeMatch) {
    const startDate = parseHeaderDate(periodRangeMatch[1]);
    const endDate = parseHeaderDate(periodRangeMatch[2]);
    if (endDate) {
      return {
        year: endDate.year,
        closingMonth: endDate.month,
        startMonth: startDate?.month,
        startYear: startDate?.year,
      };
    }
  }

  // 2. "Closing Date" with a specific date
  const closingMatch = sample.match(
    /closing\s+date[^]*?(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+20\d{2})/i
  );
  if (closingMatch) {
    const d = parseHeaderDate(closingMatch[1]);
    if (d) return { year: d.year, closingMonth: d.month, startMonth: undefined, startYear: undefined };
  }

  // 3. "Statement Period" / "Statement Date" with year (may or may not have month)
  const periodDateMatch = sample.match(/(?:statement\s+period|closing\s+date|statement\s+date)[^]*?(?:(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+)?(20\d{2})/i);
  if (periodDateMatch) {
    const year = parseInt(periodDateMatch[2]);
    const month = periodDateMatch[1] ? parseInt(EN_MONTHS[periodDateMatch[1].toLowerCase()] || "0") : undefined;
    return { year, closingMonth: month || undefined, startMonth: undefined, startYear: undefined };
  }

  // 4. Amex: first full date in header (e.g. "January 16, 2026")
  const fullDateMatch = sample.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+(20\d{2})/i);
  if (fullDateMatch) {
    const year = parseInt(fullDateMatch[2]);
    const month = parseInt(EN_MONTHS[fullDateMatch[1].toLowerCase()] || "0");
    return { year, closingMonth: month || undefined, startMonth: undefined, startYear: undefined };
  }

  // 5. Day-first date in header (e.g. "16 Jan 2026")
  const dayFirstDateMatch = sample.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(20\d{2})/i);
  if (dayFirstDateMatch) {
    const year = parseInt(dayFirstDateMatch[3]);
    const month = parseInt(EN_MONTHS[dayFirstDateMatch[2].toLowerCase().slice(0, 3)] || "0");
    return { year, closingMonth: month || undefined, startMonth: undefined, startYear: undefined };
  }

  // 6. Generic fallback — year only
  const yearMatch = sample.match(/\b(20\d{2})\b/);
  return { year: yearMatch ? parseInt(yearMatch[1]) : undefined, closingMonth: undefined, startMonth: undefined, startYear: undefined };
}

function extractTransactionsFromLines(lines: string[], adapter: BankAdapter): RawTransaction[] {
  const bankName = adapter.name;
  const creditCard = isCreditCardStatement(lines);
  const { year: statementYear, closingMonth, startMonth, startYear } = detectStatementYear(lines);
  const transactions: RawTransaction[] = [];
  let lastDate = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length < 5) continue;
    if (isNoiseLine(line)) continue;

    const dateRaw = startDate(line);
    const rawAmounts = findAmounts(line);
    const amounts = filterOutBalance(rawAmounts);

    if (dateRaw && amounts.length > 0) {
      // --- Dated transaction line (with amount on same line) ---
      const date = normalizeDate(dateRaw, statementYear, closingMonth, startMonth, startYear);
      if (!date) continue;
      lastDate = date;

      const txAmt = amounts[0];
      let desc = line.slice(dateRaw.length, txAmt.index).trim();
      // Strip leading card-last-4 (e.g. "6211 ")
      desc = desc.replace(/^\d{4}\s+/, "").trim();
      if (desc.length < 2) continue;
      // Skip balance, total, and summary lines
      if (/\b(?:opening|closing|previous|current|available|running)\s+balance\b/i.test(desc)) continue;
      if (/\bbalance\s+(?:brought|carried|forward|b\/f|c\/f)\b/i.test(desc)) continue;
      if (/^(?:total|sub-?total|grand\s+total)\b/i.test(desc)) continue;

      // Strip trailing dash/minus left over from "-$xx.xx" after amount extraction
      desc = desc.replace(/\s*-\s*$/, "").trim();
      if (desc.length < 2) continue;

      let amount = txAmt.value;
      // Amex foreign currency: when 2+ amounts on the line and a subsequent
      // line is a foreign currency name, the LAST amount is the AUD amount.
      let foreignSkipLines = 0;
      if (amounts.length >= 2) {
        for (let k = 1; k <= 3 && i + k < lines.length; k++) {
          const followLine = lines[i + k]?.trim() ?? "";
          if (startDate(followLine)) break;
          if (isForeignCurrencyLine(followLine)) {
            amount = amounts[amounts.length - 1].value;
            foreignSkipLines = k;
            break;
          }
          if (!isNoiseLine(followLine) && findAmounts(followLine).length > 0) break;
        }
      }
      // Fallback: check for conversion commission line with AUD amount
      if (foreignSkipLines === 0) {
        for (let k = 1; k <= 5 && i + k < lines.length; k++) {
          const followLine = lines[i + k]?.trim() ?? "";
          if (startDate(followLine)) break;
          if (/conversion\s+commission/i.test(followLine)) {
            const audAmts = findAmounts(followLine).filter(a => /\$/.test(a.raw));
            if (audAmts.length > 0) {
              amount = audAmts[0].value;
              foreignSkipLines = k;
            }
            break;
          }
          if (isNoiseLine(followLine)) continue;
          if (findAmounts(followLine).length > 0) break;
        }
      }
      let isRefund = false;
      if (creditCard) {
        const isCr = isRefundOrCredit(desc, txAmt.raw) || hasTrailingCR(line, txAmt.index, txAmt.raw) || txAmt.value < 0;
        if (isCardPayment(desc)) continue;
        isRefund = isCr;
        amount = isCr ? Math.abs(amount) : -Math.abs(amount);
      } else if (adapter.trailingMinusIsCredit || adapter.parenMeansDebit) {
        // Bank-specific sign conventions for transaction/savings accounts
        const hasTrailing = /\d-\s*$/.test(txAmt.raw);
        if (adapter.trailingMinusIsCredit && hasTrailing) {
          // Trailing minus = credit (income) → make positive
          amount = Math.abs(amount);
          isRefund = isRefundOrCredit(desc, txAmt.raw);
        } else {
          // Plain amount or parens = debit (expense) → make negative
          amount = -Math.abs(amount);
        }
      }
      transactions.push({ date, amount, description: desc, source: bankName, isRefund: isRefund || undefined });
      if (foreignSkipLines > 0) i += foreignSkipLines;

    } else if (dateRaw && amounts.length === 0) {
      // --- Date line without amount → try merging next 1-5 lines ---
      let merged = line;
      let linesConsumed = 0;
      let foundAmts: AmountMatch[] = [];

      let trailingCrDr = "";
      for (let j = 1; j <= 5 && i + j < lines.length; j++) {
        const nextLine = lines[i + j]?.trim() ?? "";
        if (startDate(nextLine)) break;
        if (isNoiseLine(nextLine)) {
          const crMatch = nextLine.match(/\b(CR|DR)\s*$/i);
          if (crMatch) trailingCrDr = crMatch[1];
          linesConsumed = j;
          continue;
        }
        merged += " " + nextLine;
        linesConsumed = j;
        foundAmts = filterOutBalance(findAmounts(merged));
        if (foundAmts.length > 0) {
          // Amex foreign currency: if 2+ amounts and next line is currency name,
          // use the last amount (AUD) instead of first (foreign)
          if (foundAmts.length >= 2) {
            for (let k = j + 1; k <= j + 3 && i + k < lines.length; k++) {
              const followLine = lines[i + k]?.trim() ?? "";
              if (startDate(followLine)) break;
              if (isForeignCurrencyLine(followLine)) {
                const crMatch = followLine.match(/\b(CR|DR)\s*$/i);
                if (crMatch) trailingCrDr = crMatch[1];
                foundAmts[0] = { ...foundAmts[0], value: foundAmts[foundAmts.length - 1].value };
                linesConsumed = k;
                break;
              }
              if (!isNoiseLine(followLine) && findAmounts(followLine).length > 0) break;
            }
          }
          // Found amount — keep scanning subsequent noise lines for CR/DR
          // and Amex foreign currency conversion commission
          for (let k = j + 1; k <= j + 5 && i + k < lines.length; k++) {
            const followLine = lines[i + k]?.trim() ?? "";
            if (startDate(followLine)) break;
            // Amex foreign currency: override with AUD amount from conversion line
            if (/conversion\s+commission/i.test(followLine)) {
              const audAmts = findAmounts(followLine).filter(a => /\$/.test(a.raw));
              if (audAmts.length > 0) {
                foundAmts[0] = { ...foundAmts[0], value: audAmts[0].value };
              }
              linesConsumed = k;
              break;
            }
            if (isNoiseLine(followLine)) {
              const crMatch = followLine.match(/\b(CR|DR)\s*$/i);
              if (crMatch) trailingCrDr = crMatch[1];
              linesConsumed = k;
              continue;
            }
            // Non-noise line with amounts → different transaction, stop
            if (findAmounts(followLine).length > 0) break;
            // Short non-noise, no-amount lines (city/address continuation) → skip
            linesConsumed = k;
          }
          break;
        }
      }
      // Propagate CR/DR from noise lines back to the merged amount
      if (trailingCrDr && foundAmts.length > 0) {
        merged += " " + trailingCrDr;
      }

      if (foundAmts.length === 0) continue;

      const date = normalizeDate(dateRaw, statementYear, closingMonth, startMonth, startYear);
      if (!date) continue;
      lastDate = date;

      const txAmt = foundAmts[0];
      let desc = merged.slice(dateRaw.length, txAmt.index).trim();
      desc = desc.replace(/^\d{4}\s+/, "").trim();
      // Strip trailing foreign currency amounts (e.g. "15,950" JPY, "21,89" EUR)
      desc = desc.replace(/\s+\d{1,3}(?:[,.]\d{2,3})+$/, "").trim();
      if (desc.length < 2) { i += linesConsumed; continue; }
      if (/\b(?:opening|closing|previous|current|available|running)\s+balance\b/i.test(desc)) { i += linesConsumed; continue; }
      if (/\bbalance\s+(?:brought|carried|forward|b\/f|c\/f)\b/i.test(desc)) { i += linesConsumed; continue; }
      if (/^(?:total|sub-?total|grand\s+total)\b/i.test(desc)) { i += linesConsumed; continue; }

      desc = desc.replace(/\s*-\s*$/, "").trim();
      if (desc.length < 2) { i += linesConsumed; continue; }

      let amount = txAmt.value;
      let isRefund = false;
      if (creditCard) {
        const isCr = isRefundOrCredit(desc, txAmt.raw) || hasTrailingCR(merged, txAmt.index, txAmt.raw) || txAmt.value < 0;
        if (isCardPayment(desc)) { i += linesConsumed; continue; }
        isRefund = isCr;
        amount = isCr ? Math.abs(amount) : -Math.abs(amount);
      } else if (adapter.trailingMinusIsCredit || adapter.parenMeansDebit) {
        const hasTrailing = /\d-\s*$/.test(txAmt.raw);
        if (adapter.trailingMinusIsCredit && hasTrailing) {
          amount = Math.abs(amount);
          isRefund = isRefundOrCredit(desc, txAmt.raw);
        } else {
          amount = -Math.abs(amount);
        }
      }
      transactions.push({ date, amount, description: desc, source: bankName, isRefund: isRefund || undefined });
      i += linesConsumed;

    } else if (!dateRaw && amounts.length > 0 && lastDate) {
      // --- Non-dated fee/charge line ---
      const txAmt = amounts[0];
      const desc = line.slice(0, txAmt.index).trim();
      if (!isFeeOrChargeLine(desc)) continue;

      let amount = txAmt.value;
      let isRefund = false;
      if (creditCard) {
        const isCr = isRefundOrCredit(desc, txAmt.raw) || hasTrailingCR(line, txAmt.index, txAmt.raw) || txAmt.value < 0;
        if (isCardPayment(desc)) continue;
        isRefund = isCr;
        amount = isCr ? Math.abs(amount) : -Math.abs(amount);
      } else if (adapter.trailingMinusIsCredit || adapter.parenMeansDebit) {
        const hasTrailing = /\d-\s*$/.test(txAmt.raw);
        if (adapter.trailingMinusIsCredit && hasTrailing) {
          amount = Math.abs(amount);
          isRefund = isRefundOrCredit(desc, txAmt.raw);
        } else {
          amount = -Math.abs(amount);
        }
      }
      transactions.push({ date: lastDate, amount, description: desc, source: bankName, isRefund: isRefund || undefined });
    }
  }

  return transactions;
}

export async function parsePDF(
  arrayBuffer: ArrayBuffer
): Promise<{ transactions: RawTransaction[]; rawLines: string[]; bankName: string }> {
  clearWarnings();
  try {
    const allPages = await extractPageItems(arrayBuffer);

    // Build lines (for metadata detection shared by all strategies)
    const metaLines = groupItemsIntoLines(allPages, 5);
    // Use adapter for bank detection — centralises bank-specific quirks
    const adapter = detectBankAdapter(metaLines);
    const bankName = adapter.name;
    const creditCard = isCreditCardStatement(metaLines);
    const { year: statementYear, closingMonth, startMonth, startYear } = detectStatementYear(metaLines);

    infoNote("bank", `Detected bank: ${bankName}${creditCard ? " (credit card)" : ""}`, bankName);
    if (statementYear) {
      infoNote("date", `Statement year: ${statementYear}, closing: month ${closingMonth ?? "?"}${startMonth ? `, start: ${startYear}-${startMonth}` : ""}`);
    }

    // Strategy 1: Column-position-based table extraction (most universal).
    // Uses X/Y positions of text items directly — works for any tabular PDF.
    const columnResult = extractFromTableColumns(allPages, adapter, creditCard, statementYear, closingMonth, startMonth, startYear);
    if (columnResult.length > 0) {
      const fixed = fixYearOrder(columnResult);
      infoNote("general", `Extracted ${fixed.length} transactions using column-position strategy`);
      return { transactions: fixed, rawLines: metaLines, bankName };
    }

    // Strategy 2: Line-based regex extraction with adaptive Y-thresholds.
    for (const threshold of [3, 5, 8, 12, 18]) {
      const lines = groupItemsIntoLines(allPages, threshold);
      const lineAdapter = detectBankAdapter(lines);
      const transactions = extractTransactionsFromLines(lines, lineAdapter);
      if (transactions.length > 0) {
        const fixed = fixYearOrder(transactions);
        infoNote("general", `Extracted ${fixed.length} transactions using line-based strategy (Y-threshold=${threshold})`);
        return { transactions: fixed, rawLines: lines, bankName: lineAdapter.name };
      }
    }

    warnSkipped("general", "No transactions found in PDF — format may be unsupported");
    return { transactions: [], rawLines: metaLines, bankName };
  } finally {
    // Zero out the PDF ArrayBuffer to prevent sensitive financial data lingering in memory
    try { new Uint8Array(arrayBuffer).fill(0); } catch { /* buffer may be detached */ }
  }
}

/** Post-parse sanity check: detect & fix year errors by ensuring dates are in order.
 *  Bank statements list transactions chronologically. If a date suddenly jumps
 *  backward by a full year, the cross-year logic likely assigned the wrong year.
 */
function fixYearOrder(transactions: RawTransaction[]): RawTransaction[] {
  if (transactions.length < 2) return transactions;

  // Check if the years are consistent — all transactions should be within ~1 year
  const years = transactions.map(t => parseInt(t.date.slice(0, 4)));
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  // If range is > 2 years, something is very wrong
  if (maxYear - minYear > 2) {
    warnSkipped("date", `Year range spans ${maxYear - minYear} years (${minYear}-${maxYear}) — possible parsing error`);
  }

  // Fix pattern: if most dates are year X but a few are year X-1 (or X+1),
  // and those outliers break the chronological order, fix them.
  // Count dates per year
  const yearCounts = new Map<number, number>();
  for (const y of years) yearCounts.set(y, (yearCounts.get(y) || 0) + 1);
  if (yearCounts.size <= 1) return transactions; // All same year, no fix needed

  // Find the dominant year
  let dominantYear = minYear;
  let dominantCount = 0;
  for (const [y, c] of yearCounts) {
    if (c > dominantCount) { dominantYear = y; dominantCount = c; }
  }

  // Only fix if dominant year accounts for >70% of transactions
  if (dominantCount / transactions.length < 0.7) return transactions;

  // Fix outlier transactions that break chronological order
  const fixed = transactions.map((t, i) => {
    const yr = parseInt(t.date.slice(0, 4));
    if (yr === dominantYear) return t;

    // Check if this transaction's date is out of chronological order
    const prev = i > 0 ? transactions[i - 1].date : null;
    const next = i < transactions.length - 1 ? transactions[i + 1].date : null;

    // If date is chronologically between prev and next when using dominant year, fix it
    const fixedDate = dominantYear + t.date.slice(4);
    const isOutOfOrder = (prev && t.date < prev && fixedDate >= prev) ||
                         (next && t.date > next && fixedDate <= next);

    if (isOutOfOrder) {
      warnSkipped("date", `Fixed year ${yr} → ${dominantYear} for "${t.description}" (was out of order)`, t.date);
      return { ...t, date: fixedDate };
    }
    return t;
  });

  return fixed;
}

// ─── Column-Position-Based Table Extraction ───
// Instead of joining text items into lines and regex-ing, this approach uses
// the spatial X/Y positions of PDF text items to identify table columns:
//   leftmost items → date, rightmost item → amount, middle → description.
// This is inherently more robust than regex because it mirrors how all bank
// statements are structured: a table with Date | Description | Amount columns.

function groupIntoRows(items: PageItem[], yThreshold: number): PageItem[][] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => b.y - a.y);
  const rows: PageItem[][] = [];
  let current: PageItem[] = [sorted[0]];
  let refY = sorted[0].y;

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (Math.abs(item.y - refY) > yThreshold) {
      rows.push(current);
      current = [];
      refY = item.y;
    }
    current.push(item);
  }
  if (current.length > 0) rows.push(current);
  return rows;
}

/** Check if a string looks like a monetary amount (has .X-XXX decimal or currency sign) */
function looksLikeAmount(str: string): boolean {
  const s = str.trim();
  // Must have digits
  if (!/\d/.test(s)) return false;
  // Prefer .X to .XXX format (1-3 decimal places)
  if (/\d\.\d{1,3}\s*[-)]?\s*$/.test(s)) return true;
  // Currency-prefixed
  if (/[$£€¥₹฿]/.test(s) && /\d/.test(s)) return true;
  return false;
}

function extractFromTableColumns(
  allPages: PageItem[][],
  adapter: BankAdapter,
  creditCard: boolean,
  statementYear: number | undefined,
  closingMonth: number | undefined,
  startMonth?: number,
  startYear?: number,
): RawTransaction[] {
  const bankName = adapter.name;
  const transactions: RawTransaction[] = [];
  let lastDate = "";

  for (const pageItems of allPages) {
    // Try multiple Y-thresholds for row grouping
    let bestRows: PageItem[][] = [];
    let bestCount = 0;

    for (const yThresh of [3, 5, 8, 12, 18]) {
      const rows = groupIntoRows(pageItems, yThresh);
      // Count rows that have both a date (anywhere in first few items) and an amount on the right
      let count = 0;
      for (const row of rows) {
        if (row.length < 2) continue;
        const sorted = [...row].sort((a, b) => a.x - b.x);
        // Scan first 4 items for a date
        let hasDate = false;
        for (let d = 0; d < Math.min(4, sorted.length); d++) {
          const tryStr = sorted[d].str;
          if (startDate(tryStr)) { hasDate = true; break; }
          if (d + 1 < sorted.length) {
            const tryTwo = `${sorted[d].str} ${sorted[d + 1].str}`;
            if (startDate(tryTwo)) { hasDate = true; break; }
          }
        }
        if (!hasDate) continue;
        // Check rightmost 1-2 items for amount
        const lastStr = sorted[sorted.length - 1].str.trim();
        if (looksLikeAmount(lastStr)) { count++; continue; }
        if (sorted.length >= 3) {
          const last2 = `${sorted[sorted.length - 2].str} ${lastStr}`;
          if (looksLikeAmount(last2)) { count++; continue; }
        }
      }
      if (count > bestCount) {
        bestCount = count;
        bestRows = rows;
      }
    }

    if (bestCount === 0) continue;

    for (const row of bestRows) {
      if (row.length < 2) continue;
      const sorted = [...row].sort((a, b) => a.x - b.x);

      // ── Detect amount from rightmost items ──
      let amountStr = "";
      let amountItems = 0;
      const lastStr = sorted[sorted.length - 1].str.trim();

      // Handle CBA debit format: "110.00" then "(" as separate items
      if ((lastStr === "(" || lastStr === "()" ) && sorted.length >= 3) {
        const prevStr = sorted[sorted.length - 2].str.trim();
        if (looksLikeAmount(prevStr + " (")) {
          amountStr = prevStr + " (";
          amountItems = 2;
        }
      }
      if (!amountItems && looksLikeAmount(lastStr)) {
        amountStr = lastStr;
        amountItems = 1;
      }
      // Try last 2 items combined (e.g., "$" and "5.90" as separate items)
      if (!amountItems && sorted.length >= 3) {
        const last2 = `${sorted[sorted.length - 2].str} ${lastStr}`;
        if (looksLikeAmount(last2)) {
          amountStr = last2;
          amountItems = 2;
        }
      }
      if (!amountItems) continue;

      const amtVal = parseAmountValue(amountStr);
      if (amtVal === null || amtVal === 0) continue;

      // ── Detect date from first few items (leftmost) ──
      let dateRaw: string | null = null;
      let dateItems = 0;
      for (let d = 0; d < Math.min(4, sorted.length); d++) {
        const tryStr = sorted[d].str;
        const found1 = startDate(tryStr);
        if (found1) { dateRaw = found1; dateItems = d + 1; break; }
        if (d + 1 < sorted.length) {
          const tryTwo = `${sorted[d].str} ${sorted[d + 1].str}`;
          const found2 = startDate(tryTwo);
          if (found2) { dateRaw = found2; dateItems = d + 2; break; }
        }
      }

      if (!dateRaw) {
        // Non-dated row with amount — could be a fee/charge, use lastDate
        if (!lastDate) continue;
        const fullText = sorted.map(i => i.str).join(" ");
        if (!isFeeOrChargeLine(fullText)) continue;
        const desc = sorted.slice(0, sorted.length - amountItems).map(i => i.str).join(" ").trim();
        if (desc.length < 2) continue;
        let amount = amtVal;
        let isRefund = false;
        if (creditCard) {
          const isCr = isRefundOrCredit(desc, amountStr) || amtVal < 0;
          if (isCardPayment(desc)) continue;
          isRefund = isCr;
          amount = isCr ? Math.abs(amount) : -Math.abs(amount);
        } else if (adapter.trailingMinusIsCredit || adapter.parenMeansDebit) {
          const hasTrailing = /\d-\s*$/.test(amountStr);
          if (adapter.trailingMinusIsCredit && hasTrailing) {
            amount = Math.abs(amount);
            isRefund = isRefundOrCredit(desc, amountStr);
          } else {
            amount = -Math.abs(amount);
          }
        }
        transactions.push({ date: lastDate, amount, description: desc, source: bankName, isRefund: isRefund || undefined });
        continue;
      }

      const date = normalizeDate(dateRaw, statementYear, closingMonth, startMonth, startYear);
      if (!date) continue;
      lastDate = date;

      // ── Description = items between date and amount ──
      const descArr = sorted.slice(dateItems, sorted.length - amountItems);
      let desc = descArr.map(i => i.str).join(" ").trim();
      // Strip leading card-last-4 (e.g. "6211 ")
      desc = desc.replace(/^\d{4}\s+/, "").trim();
      if (desc.length < 2) continue;

      // Full-line noise check
      const fullLine = sorted.map(i => i.str).join(" ");
      if (isNoiseLine(fullLine)) continue;
      if (/\b(?:opening|closing|previous|current|available|running)\s+balance\b/i.test(desc)) continue;
      if (/\bbalance\s+(?:brought|carried|forward|b\/f|c\/f)\b/i.test(desc)) continue;
      if (/^(?:total|sub-?total|grand\s+total)\b/i.test(desc)) continue;

      let amount = amtVal;
      let isRefund = false;
      if (creditCard) {
        const isCr = isRefundOrCredit(desc, amountStr) || hasTrailingCR(fullLine, fullLine.lastIndexOf(amountStr), amountStr) || amtVal < 0;
        if (isCardPayment(desc)) continue;
        isRefund = isCr;
        amount = isCr ? Math.abs(amount) : -Math.abs(amount);
      } else if (adapter.trailingMinusIsCredit || adapter.parenMeansDebit) {
        const hasTrailing = /\d-\s*$/.test(amountStr);
        if (adapter.trailingMinusIsCredit && hasTrailing) {
          amount = Math.abs(amount);
          isRefund = isRefundOrCredit(desc, amountStr);
        } else {
          amount = -Math.abs(amount);
        }
      }

      transactions.push({ date, amount, description: desc, source: bankName, isRefund: isRefund || undefined });
    }
  }

  return transactions;
}

// ─── Test-only exports ───
export const _test = {
  resolveYear,
  normalizeDate,
  detectStatementYear,
  fixYearOrder,
  startDate,
  findAmounts,
  isNoiseLine,
  parseAmountValue,
};
