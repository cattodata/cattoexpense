/**
 * PII Masking Module
 *
 * Strips personally identifiable information from transaction data
 * BEFORE any external AI call. This runs entirely in-browser.
 *
 * What gets masked:
 * - Account numbers, card numbers
 * - Names (when preceded by identifiers like "to:", "from:", etc.)
 * - Email addresses
 * - Phone numbers
 * - Addresses (street numbers + common suffixes)
 * - Reference/transaction IDs
 *
 * What is KEPT (needed for AI categorization):
 * - Merchant/store names (Starbucks, Netflix, etc.)
 * - Transaction type keywords (purchase, payment, withdrawal)
 * - Amount (passed separately, not in description)
 * - Date (passed separately)
 */

// Regex patterns for PII detection
const PATTERNS = {
  // Credit/debit card numbers: 4+ consecutive digits optionally separated by spaces/dashes
  cardNumber: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{0,4}\b/g,

  // Account numbers: "acct", "account", "a/c" followed by digits
  accountNumber: /(?:acct?\.?|account|a\/c)\s*[#:]?\s*\d{4,}/gi,

  // Standalone long digit sequences (6+ digits likely an ID/account)
  longDigits: /\b\d{6,}\b/g,

  // Last-4 patterns like "ending in 1234" or "****1234"
  lastFour: /(?:ending\s+(?:in\s+)?|x{3,}|\*{3,})\d{4}/gi,

  // Email addresses
  email: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,

  // Phone numbers (various formats)
  phone: /(?:\+?\d{1,3}[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/g,

  // Street addresses: number + street name + suffix
  address:
    /\b\d{1,5}\s+(?:[A-Z][a-z]+\s+){1,3}(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Ln|Lane|Rd|Road|Ct|Court|Way|Pl|Place|Cir|Circle)\b\.?/gi,

  // "To: Name" or "From: Name" patterns
  toFromName: /(?:to|from|payee|payer|beneficiary|sender|recipient)\s*:\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}/gi,

  // Reference/confirmation numbers
  refNumber: /(?:ref|reference|conf|confirmation|transaction|txn|trx|trace)\s*[#:]?\s*[A-Z0-9\-]{4,}/gi,

  // Sort codes (UK) / routing numbers
  sortCode: /\b\d{2}[\-]\d{2}[\-]\d{2}\b/g,

  // BSB numbers (Australia) — format: XXX-XXX
  bsb: /\b\d{3}-\d{3}\b/g,

  // IBAN
  iban: /\b[A-Z]{2}\d{2}\s?[A-Z0-9]{4}\s?\d{4}\s?\d{4}(?:\s?\d{4}){0,4}\b/g,

  // SSN-like patterns
  ssn: /\b\d{3}[\-\s]\d{2}[\-\s]\d{4}\b/g,

  // ZIP/postal codes standalone (5 or 5-4 digit US zip)
  zip: /\b\d{5}(?:\-\d{4})?\b/g,
};

// --- Merchant-level masking patterns ---

// "ATF <NAME>" = "As Trustee For" — reveals beneficiary identity
const ATF_RE = /\bATF\s+[A-Z][A-Z\s]{2,}/gi;

// Company legal suffixes — noise that doesn't help AI but reveals entity info
const CORP_SUFFIX_RE =
  /[,.]?\s*(?:PTY\s+LTD|P\/L|LTD|LIMITED|INC|CORP|CO\b|PLC|LLC|GMBH|SA\b|AG\b|NV\b|BV\b)\b\.?/gi;

// Location names after merchant — reveal where user shops
// Common AU suburbs + generic patterns like "B01" "B02" store codes
const LOCATION_SUFFIX_RE =
  /\s+(?:MACQUARIE|PARRAMATT?A|CHATSWOOD|SYDNEY|MELBOURNE|BRISBANE|PERTH|ADELAIDE|CANBERRA|HOBART|DARWIN|GOLD\s?COAST|BONDI|MANLY|SURRY\s?HILLS|NEWTOWN|REDFERN|RANDWICK|BURWOOD|STRATHFIELD|EPPING|RYDE|HURSTVILLE|BANKSTOWN|CASTLE\s?HILL|PENRITH|BLACKTOWN|LIVERPOOL|CAMPBELLTOWN|HORNSBY|DEE\s?WHY|BROOKVALE|MOSMAN|NEUTRAL\s?BAY|NORTH\s?SYDNEY|LANE\s?COVE|EASTWOOD|CARLINGFORD|TOP\s?RYDE|BAULKHAM\s?HILLS|WETHERILL\s?PARK|MIRANDA|CRONULLA|WOLLONGONG|NEWCASTLE|GEELONG|AU)\b/gi;

// URL-like domains in descriptions (HELP.UBER.COM, AMAZON.COM.AU)
const URL_DOMAIN_RE = /\s+[A-Z0-9\-]+\.[A-Z]{2,}\.[A-Z]{2,}(?:\.[A-Z]{2})?/gi;
const SHORT_DOMAIN_RE = /\s+[A-Z0-9\-]+\.(?:COM|NET|ORG|IO|CO|AU|UK|US)\b/gi;

// Merchant prefixes like "SMP*", "TBL*" — card network junk (keep brand names like UBER)
const MERCHANT_PREFIX_RE = /^(?:SMP|TBL|SQ|SP|PP|TST|GPA|WPY|CKO|INT|PAY|WWW|WEB)\s?\*\s?/i;

// Store/branch codes like "B02", "#1234"
const STORE_CODE_RE = /\s+(?:B\d{1,3}|#\d{2,5})\b/g;

/**
 * Mask a single transaction description, removing PII while preserving
 * merchant/category-relevant keywords for AI categorization.
 */
export function maskDescription(description: string): string {
  let masked = description;

  // --- Standard PII (order: most specific first) ---
  masked = masked.replace(PATTERNS.iban, "[IBAN]");
  masked = masked.replace(PATTERNS.ssn, "[ID]");
  masked = masked.replace(PATTERNS.email, "[EMAIL]");
  masked = masked.replace(PATTERNS.accountNumber, "[ACCT]");
  masked = masked.replace(PATTERNS.cardNumber, "[CARD]");
  masked = masked.replace(PATTERNS.lastFour, "[CARD]");
  masked = masked.replace(PATTERNS.phone, "[PHONE]");
  masked = masked.replace(PATTERNS.address, "[ADDR]");
  masked = masked.replace(PATTERNS.toFromName, "[NAME]");
  masked = masked.replace(PATTERNS.refNumber, "[REF]");
  masked = masked.replace(PATTERNS.sortCode, "[CODE]");
  masked = masked.replace(PATTERNS.bsb, "[BSB]");
  masked = masked.replace(PATTERNS.zip, "[ZIP]");
  masked = masked.replace(PATTERNS.longDigits, "[ID]");

  // --- Merchant-level masking ---
  masked = masked.replace(ATF_RE, " [NAME]");
  masked = masked.replace(CORP_SUFFIX_RE, "");
  masked = masked.replace(LOCATION_SUFFIX_RE, "");
  masked = masked.replace(URL_DOMAIN_RE, "");
  masked = masked.replace(SHORT_DOMAIN_RE, "");
  masked = masked.replace(MERCHANT_PREFIX_RE, "");
  masked = masked.replace(STORE_CODE_RE, "");

  // --- Cleanup ---
  // Remove stray asterisks left from merchant prefixes (e.g. "UBER *EATS" → "UBER EATS")
  masked = masked.replace(/\s?\*\s?/g, " ");
  // Remove trailing commas, slashes, dots left after suffix removal
  masked = masked.replace(/[,./]+\s*$/g, "");
  masked = masked.replace(/(\[(?:ID|CARD|ACCT|REF|CODE|NAME)\]\s*){2,}/g, "[ID] ");
  masked = masked.replace(/\s{2,}/g, " ").trim();

  return masked;
}

export interface MaskedTransaction {
  date: string;
  amount: number;
  maskedDescription: string;
  type: "income" | "expense";
}

/**
 * Prepare transactions for AI — mask all PII, keep only what's needed
 * for categorization and analysis.
 */
export function maskTransactionsForAI(
  transactions: Array<{ date: string; amount: number; description: string }>
): MaskedTransaction[] {
  return transactions.map((t) => ({
    date: t.date,
    amount: t.amount,
    maskedDescription: maskDescription(t.description),
    type: t.amount >= 0 ? "income" as const : "expense" as const,
  }));
}

/**
 * Create an aggregated summary safe to send to AI for coaching.
 * Contains NO individual transaction details — only category totals.
 */
export function createSafeSummary(analysis: {
  totalExpenses: number;
  categoryBreakdown: Array<{ category: string; total: number; count: number; percentage: number }>;
  monthlyData: Array<{ month: string; expenses: number }>;
  recurring: Array<{ amount: number; occurrences: number; category: string }>;
}): string {
  const lines: string[] = [
    `Total Expenses: $${analysis.totalExpenses.toLocaleString()}`,
    "",
    "Expense Breakdown:",
    ...analysis.categoryBreakdown.map(
      (c) => `  ${c.category}: $${c.total.toLocaleString()} (${c.percentage}%, ${c.count} transactions)`
    ),
    "",
    "Monthly Trend:",
    ...analysis.monthlyData.map(
      (m) => `  ${m.month}: expenses $${m.expenses.toLocaleString()}`
    ),
  ];

  if (analysis.recurring.length > 0) {
    lines.push("", "Recurring charges:");
    for (const r of analysis.recurring.slice(0, 10)) {
      lines.push(`  ${r.category}: $${r.amount} x${r.occurrences}`);
    }
  }

  return lines.join("\n");
}

/**
 * Export masked transactions as CSV string and trigger download.
 * Keeps: date, masked description, amount, type, source (bank name).
 * This file can be safely shared with external AI tools.
 */
export function exportMaskedCSV(
  transactions: Array<{ date: string; amount: number; description: string; source?: string }>
): void {
  const header = "Date,Description (Masked),Amount,Type,Bank";
  const rows = transactions.map((t) => {
    const masked = maskDescription(t.description);
    const type = t.amount >= 0 ? "income" : "expense";
    const bank = t.source || "Unknown";
    // Escape CSV fields that may contain commas or quotes
    const escapeCsv = (s: string) => {
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    return `${t.date},${escapeCsv(masked)},${t.amount.toFixed(2)},${type},${escapeCsv(bank)}`;
  });

  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "masked-transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
}
