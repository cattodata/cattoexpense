import { describe, it, expect } from "vitest";
import { parseCSV, detectColumns } from "./parser";

describe("detectColumns", () => {
  it("detects standard English headers", () => {
    const result = detectColumns(["Date", "Description", "Amount"]);
    expect(result).toEqual({ date: "Date", amount: "Amount", description: "Description" });
  });

  it("detects case-insensitive headers", () => {
    const result = detectColumns(["DATE", "DESCRIPTION", "AMOUNT"]);
    expect(result).toEqual({ date: "DATE", amount: "AMOUNT", description: "DESCRIPTION" });
  });

  it("detects Thai headers", () => {
    const result = detectColumns(["วันที่", "รายละเอียด", "จำนวนเงิน"]);
    expect(result).toEqual({ date: "วันที่", amount: "จำนวนเงิน", description: "รายละเอียด" });
  });

  it("detects debit/credit columns", () => {
    const result = detectColumns(["Date", "Description", "Debit", "Credit"]);
    expect(result).not.toBeNull();
    expect(result!.date).toBe("Date");
    expect(result!.description).toBe("Description");
  });

  it("detects fuzzy headers (substring match)", () => {
    const result = detectColumns(["Transaction Date", "Transaction Description", "Transaction Amount"]);
    expect(result).not.toBeNull();
    expect(result!.date).toBe("Transaction Date");
  });

  it("returns null for unrecognizable headers", () => {
    const result = detectColumns(["Col1", "Col2", "Col3"]);
    expect(result).toBeNull();
  });
});

describe("parseCSV", () => {
  it("parses basic CSV with standard headers", () => {
    const csv = `Date,Description,Amount
2024-01-15,Woolworths,-45.50
2024-01-16,Salary,3500.00`;
    const result = parseCSV(csv);
    expect(result.needsMapping).toBe(false);
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toMatchObject({
      date: "2024-01-15",
      amount: -45.5,
      description: "Woolworths",
    });
    expect(result.transactions[1].amount).toBe(3500);
  });

  it("handles DD/MM/YYYY dates", () => {
    const csv = `Date,Description,Amount
15/01/2024,Test,-10.00`;
    const result = parseCSV(csv);
    expect(result.transactions[0].date).toBe("2024-01-15");
  });

  it("handles Buddhist Era years", () => {
    const csv = `Date,Description,Amount
15/01/2567,Test,-10.00`;
    const result = parseCSV(csv);
    expect(result.transactions[0].date).toBe("2024-01-15");
  });

  it("handles YYYY/MM/DD dates", () => {
    const csv = `Date,Description,Amount
2024/03/15,Test,-10.00`;
    const result = parseCSV(csv);
    expect(result.transactions[0].date).toBe("2024-03-15");
  });

  it("handles parenthesized negative amounts", () => {
    const csv = `Date,Description,Amount
2024-01-15,Refund,(25.00)`;
    const result = parseCSV(csv);
    expect(result.transactions[0].amount).toBe(-25);
  });

  it("handles trailing minus (CBA format)", () => {
    const csv = `Date,Description,Amount
2024-01-15,Refund,9.62-`;
    const result = parseCSV(csv);
    expect(result.transactions[0].amount).toBe(-9.62);
  });

  it("handles CR/DR suffixes", () => {
    const csv = `Date,Description,Amount
2024-01-15,Payment,100.00CR
2024-01-16,Purchase,50.00DR`;
    const result = parseCSV(csv);
    expect(result.transactions[0].amount).toBe(100);
    expect(result.transactions[1].amount).toBe(-50);
  });

  it("handles debit/credit columns", () => {
    const csv = `Date,Description,Debit,Credit
2024-01-15,Woolworths,45.50,
2024-01-16,Salary,,3500.00`;
    const result = parseCSV(csv);
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0].amount).toBe(-45.5);
    expect(result.transactions[1].amount).toBe(3500);
  });

  it("skips rows with zero amount", () => {
    const csv = `Date,Description,Amount
2024-01-15,Valid,-10.00
2024-01-16,Zero,0.00`;
    const result = parseCSV(csv);
    expect(result.transactions).toHaveLength(1);
  });

  it("skips rows with missing description", () => {
    const csv = `Date,Description,Amount
2024-01-15,,-10.00`;
    const result = parseCSV(csv);
    expect(result.transactions).toHaveLength(0);
  });

  it("handles currency symbols in amounts", () => {
    const csv = `Date,Description,Amount
2024-01-15,Test,$45.50
2024-01-16,Test2,฿1500.00`;
    const result = parseCSV(csv);
    expect(result.transactions[0].amount).toBe(45.5);
    expect(result.transactions[1].amount).toBe(1500);
  });

  it("returns needsMapping when columns can't be detected", () => {
    const csv = `Col1,Col2,Col3
a,b,c`;
    const result = parseCSV(csv);
    expect(result.needsMapping).toBe(true);
    expect(result.transactions).toHaveLength(0);
  });

  it("handles 2-digit years", () => {
    const csv = `Date,Description,Amount
15/01/24,Test,-10.00`;
    const result = parseCSV(csv);
    expect(result.transactions[0].date).toBe("2024-01-15");
  });
});
