import { describe, it, expect } from "vitest";
import { _test } from "./pdf-parser";
import { detectBankAdapter, getAllAdapters } from "./bank-adapters";
import { clearWarnings, addWarning, getWarnings, warnSkipped, infoNote } from "./parse-warnings";

const { resolveYear, normalizeDate, detectStatementYear, fixYearOrder, startDate, findAmounts, isNoiseLine, parseAmountValue } = _test;

// ─── resolveYear ───

describe("resolveYear", () => {
  it("uses explicit year when provided", () => {
    expect(resolveYear("2025", undefined, "01", undefined)).toBe(2025);
    expect(resolveYear("24", undefined, "06", undefined)).toBe(2024);
  });

  it("converts Buddhist Era year", () => {
    expect(resolveYear("2567", undefined, "01", undefined)).toBe(2024);
  });

  it("rejects implausible years", () => {
    expect(resolveYear("1001", undefined, "01", undefined)).toBeNull();
    expect(resolveYear("3000", undefined, "01", undefined)).toBeNull();
  });

  it("uses fallbackYear when no explicit year", () => {
    expect(resolveYear(undefined, 2026, "06", undefined)).toBe(2026);
  });

  describe("cross-year with start/end dates (CommBank fix)", () => {
    it("assigns correct year for statement spanning Nov 2025 → Jan 2026", () => {
      // Statement: Nov 2025 to Jan 2026 → closingYear=2026, closingMonth=1, startMonth=11, startYear=2025
      // November transaction → should be 2025
      expect(resolveYear(undefined, 2026, "11", 1, 11, 2025)).toBe(2025);
      // December transaction → should be 2025
      expect(resolveYear(undefined, 2026, "12", 1, 11, 2025)).toBe(2025);
      // January transaction → should be 2026
      expect(resolveYear(undefined, 2026, "01", 1, 11, 2025)).toBe(2026);
    });

    it("assigns correct year for statement spanning Dec 2025 → Feb 2026", () => {
      expect(resolveYear(undefined, 2026, "12", 2, 12, 2025)).toBe(2025);
      expect(resolveYear(undefined, 2026, "01", 2, 12, 2025)).toBe(2026);
      expect(resolveYear(undefined, 2026, "02", 2, 12, 2025)).toBe(2026);
    });

    it("handles same-year statement correctly", () => {
      // Statement: Jan 2026 to Mar 2026 → no year boundary
      expect(resolveYear(undefined, 2026, "01", 3, 1, 2026)).toBe(2026);
      expect(resolveYear(undefined, 2026, "02", 3, 1, 2026)).toBe(2026);
      expect(resolveYear(undefined, 2026, "03", 3, 1, 2026)).toBe(2026);
    });
  });

  describe("cross-year fallback (closing month only)", () => {
    it("adjusts year when closing is Jan and tx is Dec", () => {
      // Closing month is Jan (01), tx month is Dec (12) → likely previous year
      expect(resolveYear(undefined, 2026, "12", 1)).toBe(2025);
    });

    it("adjusts year when closing is Feb and tx is Nov", () => {
      expect(resolveYear(undefined, 2026, "11", 2)).toBe(2025);
    });

    it("does NOT adjust when closing is June and tx is July", () => {
      // This should NOT subtract — July comes after June in the same year
      expect(resolveYear(undefined, 2026, "07", 6)).toBe(2026);
    });

    it("does NOT adjust when closing is Dec and tx is Jan", () => {
      expect(resolveYear(undefined, 2026, "01", 12)).toBe(2026);
    });

    it("does NOT adjust when closing is Sept and tx is March", () => {
      expect(resolveYear(undefined, 2026, "03", 9)).toBe(2026);
    });
  });
});

// ─── normalizeDate ───

describe("normalizeDate", () => {
  it("passes through ISO dates", () => {
    expect(normalizeDate("2024-01-15")).toBe("2024-01-15");
  });

  it("parses DD Mon YYYY", () => {
    expect(normalizeDate("15 Jan 2024")).toBe("2024-01-15");
    expect(normalizeDate("1 Feb 2024")).toBe("2024-02-01");
  });

  it("parses DD Mon (no year) with fallback", () => {
    expect(normalizeDate("15 Jan", 2026, 1)).toBe("2026-01-15");
  });

  it("handles cross-year with start/end info", () => {
    // Nov date in a statement that closes in Jan 2026, started Nov 2025
    expect(normalizeDate("15 Nov", 2026, 1, 11, 2025)).toBe("2025-11-15");
    expect(normalizeDate("10 Jan", 2026, 1, 11, 2025)).toBe("2026-01-10");
  });

  it("parses DD/MM/YYYY", () => {
    expect(normalizeDate("15/01/2024")).toBe("2024-01-15");
  });

  it("parses YYYY/MM/DD", () => {
    expect(normalizeDate("2024/03/15")).toBe("2024-03-15");
  });

  it("parses October 25, 2024 (Amex format)", () => {
    expect(normalizeDate("October 25, 2024")).toBe("2024-10-25");
  });

  it("handles 2-digit year", () => {
    expect(normalizeDate("15 Jan 24")).toBe("2024-01-15");
  });

  it("handles Buddhist Era year in slash format", () => {
    expect(normalizeDate("15/01/2567")).toBe("2024-01-15");
  });
});

// ─── detectStatementYear ───

describe("detectStatementYear", () => {
  it("detects CommBank statement period with range", () => {
    const lines = [
      "Commonwealth Bank",
      "Statement Period 25 Nov 2025 to 24 Jan 2026",
    ];
    const result = detectStatementYear(lines);
    expect(result.year).toBe(2026);
    expect(result.closingMonth).toBe(1); // January
    expect(result.startMonth).toBe(11); // November
    expect(result.startYear).toBe(2025);
  });

  it("detects closing date format", () => {
    const lines = [
      "Closing Date 31 Jan 2026",
    ];
    const result = detectStatementYear(lines);
    expect(result.year).toBe(2026);
    expect(result.closingMonth).toBe(1);
  });

  it("detects Amex full date in header", () => {
    const lines = [
      "American Express",
      "January 16, 2026",
    ];
    const result = detectStatementYear(lines);
    expect(result.year).toBe(2026);
    expect(result.closingMonth).toBe(1);
  });

  it("falls back to generic year", () => {
    const lines = [
      "Some Bank Statement 2026",
    ];
    const result = detectStatementYear(lines);
    expect(result.year).toBe(2026);
    expect(result.closingMonth).toBeUndefined();
  });
});

// ─── startDate ───

describe("startDate", () => {
  it("recognises DD/MM/YYYY", () => {
    expect(startDate("15/01/2024 Woolworths $45.50")).toBe("15/01/2024");
  });

  it("recognises DD Mon YYYY", () => {
    expect(startDate("15 Jan 2024 Woolworths")).toBe("15 Jan 2024");
  });

  it("recognises DD Mon (no year)", () => {
    expect(startDate("15 Jan Woolworths")).toBe("15 Jan");
  });

  it("recognises full month (Amex)", () => {
    expect(startDate("January 15, 2024 Starbucks")).toBe("January 15, 2024");
  });

  it("returns null for non-date lines", () => {
    expect(startDate("Woolworths $45.50")).toBeNull();
    expect(startDate("Opening Balance")).toBeNull();
  });
});

// ─── findAmounts ───

describe("findAmounts", () => {
  it("finds currency-prefixed amounts", () => {
    const result = findAmounts("15 Jan Woolworths $45.50");
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].value).toBe(45.5);
  });

  it("finds plain decimal amounts", () => {
    const result = findAmounts("15 Jan Woolworths 45.50");
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles trailing minus (CBA credit)", () => {
    const result = findAmounts("15 Jan Refund $9.62-");
    expect(result.length).toBeGreaterThan(0);
    // Trailing minus parsed by parseAmountValue
  });

  it("handles CR/DR suffixes", () => {
    const result = findAmounts("15 Jan Payment $100.00 CR");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── parseAmountValue ───

describe("parseAmountValue", () => {
  it("parses positive amount", () => {
    expect(parseAmountValue("$45.50")).toBe(45.5);
  });

  it("parses negative with leading minus", () => {
    expect(parseAmountValue("-$45.50")).toBe(-45.5);
  });

  it("parses trailing minus (CBA credit)", () => {
    expect(parseAmountValue("9.62-")).toBe(-9.62);
  });

  it("parses CR suffix as positive", () => {
    expect(parseAmountValue("100.00CR")).toBe(100);
  });

  it("parses DR suffix as negative", () => {
    expect(parseAmountValue("50.00DR")).toBe(-50);
  });

  it("parses parenthesized negatives", () => {
    expect(parseAmountValue("(25.00)")).toBe(-25);
  });

  it("returns null for non-numeric", () => {
    expect(parseAmountValue("abc")).toBeNull();
  });
});

// ─── isNoiseLine ───

describe("isNoiseLine", () => {
  it("filters opening/closing balance", () => {
    expect(isNoiseLine("Opening Balance $1,234.56")).toBe(true);
    expect(isNoiseLine("Closing Balance")).toBe(true);
  });

  it("filters page numbers", () => {
    expect(isNoiseLine("Page 1 of 3")).toBe(true);
  });

  it("filters payment due date", () => {
    expect(isNoiseLine("Payment Due Date: 15 Feb 2026")).toBe(true);
  });

  it("does not filter real transactions", () => {
    expect(isNoiseLine("15 Jan Woolworths $45.50")).toBe(false);
    expect(isNoiseLine("Netflix $15.99")).toBe(false);
  });
});

// ─── fixYearOrder ───

describe("fixYearOrder", () => {
  it("fixes a single out-of-order year", () => {
    const txns = [
      { date: "2026-01-01", amount: -10, description: "A" },
      { date: "2026-01-05", amount: -20, description: "B" },
      { date: "2025-01-10", amount: -30, description: "C" }, // wrong year
      { date: "2026-01-15", amount: -40, description: "D" },
    ];
    clearWarnings();
    const fixed = fixYearOrder(txns);
    expect(fixed[2].date).toBe("2026-01-10");
  });

  it("does not change correct dates", () => {
    const txns = [
      { date: "2026-01-01", amount: -10, description: "A" },
      { date: "2026-01-15", amount: -20, description: "B" },
      { date: "2026-02-01", amount: -30, description: "C" },
    ];
    const fixed = fixYearOrder(txns);
    expect(fixed).toEqual(txns);
  });

  it("does not change legitimately cross-year statements", () => {
    const txns = [
      { date: "2025-11-15", amount: -10, description: "A" },
      { date: "2025-12-01", amount: -20, description: "B" },
      { date: "2026-01-05", amount: -30, description: "C" },
    ];
    const fixed = fixYearOrder(txns);
    // These are all in order, should not be changed
    expect(fixed[0].date).toBe("2025-11-15");
    expect(fixed[2].date).toBe("2026-01-05");
  });
});

// ─── bank-adapters ───

describe("bank-adapters", () => {
  describe("detectBankAdapter", () => {
    it("detects CommBank", () => {
      const adapter = detectBankAdapter(["Commonwealth Bank Statement"]);
      expect(adapter.name).toBe("CommBank");
      expect(adapter.spaceAsDecimal).toBe(true);
      expect(adapter.parenMeansDebit).toBe(true);
    });

    it("detects ANZ", () => {
      const adapter = detectBankAdapter(["ANZ Statement of Account"]);
      expect(adapter.name).toBe("ANZ");
    });

    it("detects Westpac", () => {
      const adapter = detectBankAdapter(["Westpac Banking Corporation"]);
      expect(adapter.name).toBe("Westpac");
    });

    it("detects NAB", () => {
      const adapter = detectBankAdapter(["National Australia Bank"]);
      expect(adapter.name).toBe("NAB");
    });

    it("detects Amex", () => {
      const adapter = detectBankAdapter(["American Express Statement"]);
      expect(adapter.name).toBe("Amex");
      expect(adapter.typicallyCreditCard).toBe(true);
    });

    it("detects HSBC", () => {
      const adapter = detectBankAdapter(["HSBC Bank Statement"]);
      expect(adapter.name).toBe("HSBC");
    });

    it("detects Thai banks — KBank", () => {
      const adapter = detectBankAdapter(["ธนาคารกสิกรไทย"]);
      expect(adapter.name).toBe("KBank");
    });

    it("detects Thai banks — SCB", () => {
      const adapter = detectBankAdapter(["ไทยพาณิชย์ Statement"]);
      expect(adapter.name).toBe("SCB");
    });

    it("returns Unknown for unrecognised bank", () => {
      const adapter = detectBankAdapter(["Some random PDF content"]);
      expect(adapter.name).toBe("Unknown");
      expect(adapter.dateFormat).toBe("DMY");
    });

    it("scans only first 80 lines", () => {
      const lines = Array(100).fill("Some text");
      lines[90] = "CommBank Statement";
      const adapter = detectBankAdapter(lines);
      expect(adapter.name).toBe("Unknown");
    });

    it("detects bank from first 80 lines", () => {
      const lines = Array(100).fill("Some text");
      lines[5] = "CommBank Statement";
      const adapter = detectBankAdapter(lines);
      expect(adapter.name).toBe("CommBank");
    });
  });

  describe("getAllAdapters", () => {
    it("returns all registered adapters", () => {
      const adapters = getAllAdapters();
      expect(adapters.length).toBeGreaterThan(10);
      const names = adapters.map(a => a.name);
      expect(names).toContain("CommBank");
      expect(names).toContain("Amex");
      expect(names).toContain("KBank");
    });
  });
});

// ─── parse-warnings ───

describe("parse-warnings", () => {
  it("collects and clears warnings", () => {
    clearWarnings();
    expect(getWarnings()).toHaveLength(0);
    addWarning({ level: "warn", stage: "date", message: "test warning" });
    expect(getWarnings()).toHaveLength(1);
    clearWarnings();
    expect(getWarnings()).toHaveLength(0);
  });

  it("warnSkipped adds a warn-level warning", () => {
    clearWarnings();
    warnSkipped("amount", "bad amount", "$abc", 42);
    const w = getWarnings();
    expect(w).toHaveLength(1);
    expect(w[0].level).toBe("warn");
    expect(w[0].stage).toBe("amount");
    expect(w[0].raw).toBe("$abc");
    expect(w[0].line).toBe(42);
  });

  it("infoNote adds an info-level warning", () => {
    clearWarnings();
    infoNote("bank", "Detected CommBank", "CommBank");
    const w = getWarnings();
    expect(w[0].level).toBe("info");
  });

  it("returns a copy of warnings (not mutable)", () => {
    clearWarnings();
    addWarning({ level: "warn", stage: "general", message: "test" });
    const w1 = getWarnings();
    w1.push({ level: "error", stage: "general", message: "injected" });
    expect(getWarnings()).toHaveLength(1);
  });
});
