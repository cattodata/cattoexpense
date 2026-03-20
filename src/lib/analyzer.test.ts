import { describe, it, expect } from "vitest";
import { analyze, analyzeMultiMonth } from "./analyzer";
import type { RawTransaction } from "./types";

function makeTx(overrides: Partial<RawTransaction> = {}): RawTransaction {
  return {
    date: "2024-01-15",
    amount: -50,
    description: "Test Merchant",
    ...overrides,
  };
}

describe("analyze", () => {
  it("computes basic totals", () => {
    const transactions: RawTransaction[] = [
      makeTx({ amount: -100, description: "Woolworths" }),
      makeTx({ amount: -50, description: "Uber" }),
      makeTx({ amount: 3000, description: "Salary" }),
    ];
    const result = analyze(transactions);
    expect(result.totalExpenses).toBe(150);
    expect(result.totalIncome).toBe(3000);
    expect(result.netFlow).toBe(2850);
  });

  it("classifies income vs expense", () => {
    const transactions: RawTransaction[] = [
      makeTx({ amount: -25, description: "Coffee" }),
      makeTx({ amount: 1000, description: "Salary" }),
    ];
    const result = analyze(transactions);
    const expense = result.transactions.find(t => t.amount === -25);
    const income = result.transactions.find(t => t.amount === 1000);
    expect(expense?.type).toBe("expense");
    expect(income?.type).toBe("income");
  });

  it("excludes CC repayments from expense totals", () => {
    const transactions: RawTransaction[] = [
      makeTx({ amount: -100, description: "Woolworths" }),
      makeTx({ amount: -500, description: "Transfer To Amex Repayment" }),
    ];
    const result = analyze(transactions);
    // CC repayment should be excluded from expense total
    expect(result.totalExpenses).toBe(100);
  });

  it("excludes internal transfers from income", () => {
    const transactions: RawTransaction[] = [
      makeTx({ amount: 3000, description: "Salary" }),
      makeTx({ amount: 500, description: "Transfer From Savings" }),
    ];
    const result = analyze(transactions);
    // Only salary should count as real income
    expect(result.totalIncome).toBe(3000);
  });

  it("detects refunds", () => {
    const transactions: RawTransaction[] = [
      makeTx({ amount: 50, description: "Refund from Amazon", isRefund: true }),
    ];
    const result = analyze(transactions);
    const refund = result.transactions[0];
    expect(refund.category).toBe("Refund");
  });

  it("computes category breakdown", () => {
    const transactions: RawTransaction[] = [
      makeTx({ amount: -100, description: "Woolworths" }),
      makeTx({ amount: -50, description: "Coles" }),
      makeTx({ amount: -30, description: "Netflix" }),
    ];
    const result = analyze(transactions);
    const groceries = result.categoryBreakdown.find(c => c.category === "Groceries");
    expect(groceries).toBeDefined();
    expect(groceries!.total).toBe(150);
    expect(groceries!.count).toBe(2);
  });

  it("computes monthly data", () => {
    const transactions: RawTransaction[] = [
      makeTx({ date: "2024-01-15", amount: -100, description: "Woolworths" }),
      makeTx({ date: "2024-02-15", amount: -50, description: "Coles" }),
    ];
    const result = analyze(transactions);
    expect(result.monthlyData).toHaveLength(2);
    expect(result.monthlyData[0].month).toBe("2024-01");
    expect(result.monthlyData[0].expenses).toBe(100);
    expect(result.monthlyData[1].month).toBe("2024-02");
  });

  it("detects recurring transactions", () => {
    const transactions: RawTransaction[] = [
      makeTx({ date: "2024-01-01", amount: -15, description: "Netflix" }),
      makeTx({ date: "2024-02-01", amount: -15, description: "Netflix" }),
      makeTx({ date: "2024-03-01", amount: -15, description: "Netflix" }),
    ];
    const result = analyze(transactions);
    expect(result.recurring.length).toBeGreaterThan(0);
    expect(result.recurring[0].description).toContain("netflix");
    expect(result.recurring[0].occurrences).toBe(3);
  });

  it("detects spending spikes", () => {
    const transactions: RawTransaction[] = [
      makeTx({ amount: -20, description: "Coffee1" }),
      makeTx({ amount: -25, description: "Lunch1" }),
      makeTx({ amount: -15, description: "Snack1" }),
      makeTx({ amount: -18, description: "Coffee2" }),
      makeTx({ amount: -22, description: "Lunch2" }),
      makeTx({ amount: -12, description: "Snack2" }),
      makeTx({ amount: -20, description: "Coffee3" }),
      makeTx({ amount: -25, description: "Lunch3" }),
      makeTx({ amount: -16, description: "Snack3" }),
      makeTx({ amount: -5000, description: "Laptop Purchase" }), // Spike
    ];
    const result = analyze(transactions);
    expect(result.spikes.length).toBeGreaterThan(0);
    expect(result.spikes[0].amount).toBe(5000);
  });

  it("computes date range", () => {
    const transactions: RawTransaction[] = [
      makeTx({ date: "2024-01-01", amount: -10, description: "A" }),
      makeTx({ date: "2024-03-31", amount: -10, description: "B" }),
    ];
    const result = analyze(transactions);
    expect(result.dateRange.from).toBe("2024-01-01");
    expect(result.dateRange.to).toBe("2024-03-31");
  });

  it("handles empty input", () => {
    const result = analyze([]);
    expect(result.transactions).toHaveLength(0);
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.netFlow).toBe(0);
  });

  it("classifies BPAY to HSBC as Transfer (excluded from spending)", () => {
    const transactions: RawTransaction[] = [
      makeTx({ amount: -200, description: "BPAY HSBC Card Payment" }),
    ];
    const result = analyze(transactions);
    expect(result.totalExpenses).toBe(0); // excluded
    const tx = result.transactions[0];
    expect(tx.category).toBe("Transfer");
  });
});

describe("analyzeMultiMonth", () => {
  it("splits transactions by month", () => {
    const transactions: RawTransaction[] = [
      makeTx({ date: "2024-01-15", amount: -100, description: "Woolworths" }),
      makeTx({ date: "2024-01-20", amount: -50, description: "Coles" }),
      makeTx({ date: "2024-02-15", amount: -30, description: "Netflix" }),
    ];
    const result = analyzeMultiMonth(transactions);
    expect(result.months).toHaveLength(2);
    expect(result.months[0].month).toBe("2024-01");
    expect(result.months[0].result.transactions).toHaveLength(2);
    expect(result.months[1].month).toBe("2024-02");
    expect(result.months[1].result.transactions).toHaveLength(1);
  });

  it("computes overall across all months", () => {
    const transactions: RawTransaction[] = [
      makeTx({ date: "2024-01-15", amount: -100, description: "Woolworths" }),
      makeTx({ date: "2024-02-15", amount: -50, description: "Coles" }),
    ];
    const result = analyzeMultiMonth(transactions);
    expect(result.overall.totalExpenses).toBe(150);
  });
});
