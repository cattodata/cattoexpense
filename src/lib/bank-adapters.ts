/**
 * Bank-specific adapters.
 *
 * Each bank statement has quirks (trailing minus for debits, space-as-decimal,
 * CR/DR placement, etc.). Instead of scattering these special cases across the
 * parser, we centralise them here so adding a new bank is one self-contained
 * block and existing behaviour is easy to test in isolation.
 */

export interface BankAdapter {
  /** Human-readable name */
  name: string;
  /** Regex patterns to detect this bank in the first ~80 lines of a statement */
  detectPatterns: RegExp[];
  /** Whether amounts use trailing minus for credits (e.g. "9.62-") */
  trailingMinusIsCredit?: boolean;
  /** Whether a standalone "(" after an amount means debit */
  parenMeansDebit?: boolean;
  /** Whether PDFs may render decimal point as space ("5 90" → "5.90") */
  spaceAsDecimal?: boolean;
  /** How many header lines to scan for bank name (default: 80) */
  headerScanLines?: number;
  /** Default date format hint: "DMY" | "MDY" | "YMD" (default: "DMY") */
  dateFormat?: "DMY" | "MDY" | "YMD";
  /** Whether this is typically a credit card issuer */
  typicallyCreditCard?: boolean;
}

const BANK_ADAPTERS: BankAdapter[] = [
  {
    name: "CommBank",
    detectPatterns: [/\bcommbank|\bcommonwealth\b/i],
    trailingMinusIsCredit: true,
    parenMeansDebit: true,
    spaceAsDecimal: true,
    dateFormat: "DMY",
  },
  {
    name: "ANZ",
    detectPatterns: [/\banz\b/i],
    dateFormat: "DMY",
  },
  {
    name: "Westpac",
    detectPatterns: [/\bwestpac\b/i],
    dateFormat: "DMY",
  },
  {
    name: "NAB",
    detectPatterns: [/\bnab\b|national\s*australia/i],
    dateFormat: "DMY",
  },
  {
    name: "Amex",
    detectPatterns: [/\bamex\b|american\s*express/i],
    typicallyCreditCard: true,
    dateFormat: "MDY",
  },
  {
    name: "HSBC",
    detectPatterns: [/\bhsbc\b/i],
    dateFormat: "DMY",
  },
  {
    name: "KBank",
    detectPatterns: [/\bkasikorn|\bkbank/i, /กสิกรไทย/i],
    dateFormat: "DMY",
  },
  {
    name: "SCB",
    detectPatterns: [/\bscb\b|siam\s*commercial/i, /ไทยพาณิชย์/i],
    dateFormat: "DMY",
  },
  {
    name: "Bangkok Bank",
    detectPatterns: [/\bbangkok\s*bank|\bbbl\b/i, /กรุงเทพ/i],
    dateFormat: "DMY",
  },
  {
    name: "Krungsri",
    detectPatterns: [/\bkrungsri|\bayudhya/i, /กรุงศรีอยุธยา/i],
    dateFormat: "DMY",
  },
  {
    name: "Krungthai",
    detectPatterns: [/\bktb\b|\bkrungthai/i, /กรุงไทย/i],
    dateFormat: "DMY",
  },
  {
    name: "TTB",
    detectPatterns: [/\btmb\b|\bttb\b|\bthanachart/i, /ทหารไทยธนชาต/i],
    dateFormat: "DMY",
  },
  {
    name: "UOB",
    detectPatterns: [/\buob\b/i],
    dateFormat: "DMY",
  },
  {
    name: "Citibank",
    detectPatterns: [/\bciti\b|\bcitibank\b/i],
    dateFormat: "DMY",
  },
  {
    name: "Chase",
    detectPatterns: [/\bchase\b|\bjpmorgan\b/i],
    dateFormat: "MDY",
  },
  {
    name: "Barclays",
    detectPatterns: [/\bbarclays\b/i],
    dateFormat: "DMY",
  },
];

/**
 * Detect bank from statement header text and return its adapter.
 * Returns a default adapter for unknown banks.
 */
export function detectBankAdapter(headerLines: string[]): BankAdapter {
  const scanLines = 80;
  const sample = headerLines.slice(0, scanLines).join(" ");
  for (const adapter of BANK_ADAPTERS) {
    for (const re of adapter.detectPatterns) {
      if (re.test(sample)) return adapter;
    }
  }
  return {
    name: "Unknown",
    detectPatterns: [],
    dateFormat: "DMY",
  };
}

/** Get all registered bank adapters (for testing) */
export function getAllAdapters(): BankAdapter[] {
  return [...BANK_ADAPTERS];
}
