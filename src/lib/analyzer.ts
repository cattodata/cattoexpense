import type {
  RawTransaction,
  Transaction,
  AnalysisResult,
  CategoryBreakdown,
  MonthlyData,
  RecurringItem,
  SpendingSpike,
  MultiMonthAnalysis,
  MonthlyResult,
} from "./types";
import { categorizeTransaction, subcategorizeTransaction } from "./categorizer";
import { detectCountry } from "./country-detector";

/** Transfer subcategories excluded from expense/income totals (not real spending) */
const EXCLUDED_TRANSFER_SUBCATS = new Set(["Credit Card Repayment", "Internal Transfer"]);

/** Categories excluded from both income and expense totals */
const NON_SPENDING_CATEGORIES = new Set(["Refund", "Reimbursement"]);

function isExcludedTransfer(t: Transaction): boolean {
  return (
    (t.category === "Transfer" && EXCLUDED_TRANSFER_SUBCATS.has(t.subcategory || "")) ||
    NON_SPENDING_CATEGORIES.has(t.category)
  );
}

// ── Income-side classification patterns ──
// These patterns separate real income from transfers, refunds, and reimbursements.

// Credit card payments / internal account moves → Transfer (exclude from income)
const CC_PAYMENT_PATTERNS = [
  /\bamex\b|american\s?express/i,
  /hsbc/i,
  /card\s?(?:repayment|payment)/i,
  /autopay/i,
  /\bbpay\b/i,
  /payment\s+(?:received|thank)/i,
];

// Internal transfers between own accounts → Transfer (exclude from income)
const INTERNAL_TRANSFER_PATTERNS = [
  /savings|goal\s?saver/i,
  /netbank/i,
  /own\s?account/i,
  /\bsaving\b/i,
  /\btransfer\s+(?:to|from)\s+xx\d/i,
  /loan\s?repayment/i,
];

// Refund patterns on positive amounts → Refund (not income)
const REFUND_PATTERNS = [
  /\brefund\b/i,
  /mcare\s?benefit|medicare\s?benefit/i,
];

// Reimbursement patterns (friends paying back) → not real income
const REIMBURSEMENT_PATTERNS = [
  /fast\s?transfer\s?from/i,
];

function classifyIncomeTransaction(description: string, isRefund?: boolean): { category: string; subcategory?: string } {
  const cleaned = description.trim();

  if (isRefund) {
    return { category: "Refund" };
  }

  if (CC_PAYMENT_PATTERNS.some((p) => p.test(cleaned))) {
    return { category: "Transfer", subcategory: "Credit Card Repayment" };
  }

  if (REFUND_PATTERNS.some((p) => p.test(cleaned))) {
    return { category: "Refund" };
  }

  if (INTERNAL_TRANSFER_PATTERNS.some((p) => p.test(cleaned))) {
    return { category: "Transfer", subcategory: "Internal Transfer" };
  }

  if (REIMBURSEMENT_PATTERNS.some((p) => p.test(cleaned))) {
    return { category: "Reimbursement" };
  }

  // Unclassified positive amounts — generic credit/inflow, not counted as spending
  return { category: "Credit" };
}

function classifyTransactions(
  raw: RawTransaction[],
  aiCategories?: Record<number, string>
): Transaction[] {
  return raw.map((t, i) => {
    const aiCat = aiCategories?.[i];
    const category = aiCat || categorizeTransaction(t.description, t.amount);
    const type: "income" | "expense" = t.amount >= 0 ? "income" : "expense";

    let finalCategory: string;
    let forcedSubcategory: string | undefined;

    if (type === "income") {
      const result = classifyIncomeTransaction(t.description, t.isRefund);
      finalCategory = result.category;
      forcedSubcategory = result.subcategory;
    } else {
      finalCategory = category;
    }

    const subcategory = forcedSubcategory ?? subcategorizeTransaction(t.description, finalCategory, t.amount);

    return {
      ...t,
      category: finalCategory,
      subcategory,
      type,
      country: detectCountry(t.description),
    };
  });
}

function computeCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
  const expenses = transactions.filter((t) => t.type === "expense" && !isExcludedTransfer(t));
  const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const map = new Map<string, { total: number; count: number }>();
  for (const t of expenses) {
    const existing = map.get(t.category) || { total: 0, count: 0 };
    existing.total += Math.abs(t.amount);
    existing.count += 1;
    map.set(t.category, existing);
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
      percentage: totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

function computeMonthlyData(transactions: Transaction[]): MonthlyData[] {
  const map = new Map<string, number>();

  for (const t of transactions) {
    const month = t.date.slice(0, 7);
    if (t.type === "expense" && !isExcludedTransfer(t)) {
      map.set(month, (map.get(month) || 0) + Math.abs(t.amount));
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, expenses]) => ({
      month,
      income: 0,
      expenses: Math.round(expenses * 100) / 100,
    }));
}

function detectRecurring(transactions: Transaction[]): RecurringItem[] {
  const expenses = transactions.filter((t) => t.type === "expense");

  // Group by normalized description
  const groups = new Map<string, { totalAmount: number; count: number; category: string }>();
  for (const t of expenses) {
    const key = t.description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.totalAmount += Math.abs(t.amount);
    } else {
      groups.set(key, { totalAmount: Math.abs(t.amount), count: 1, category: t.category });
    }
  }

  return Array.from(groups.entries())
    .filter(([, data]) => data.count >= 2)
    .map(([desc, data]) => ({
      description: desc,
      amount: Math.round((data.totalAmount / data.count) * 100) / 100,
      occurrences: data.count,
      category: data.category,
    }))
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 20);
}

function detectSpikes(transactions: Transaction[]): SpendingSpike[] {
  const expenses = transactions.filter((t) => t.type === "expense");
  if (expenses.length === 0) return [];

  const amounts = expenses.map((t) => Math.abs(t.amount));
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(amounts.reduce((sum, x) => sum + (x - mean) ** 2, 0) / amounts.length);
  const threshold = mean + 2 * stdDev;

  return expenses
    .filter((t) => Math.abs(t.amount) > threshold)
    .map((t) => ({
      date: t.date,
      amount: Math.abs(t.amount),
      description: t.description,
      category: t.category,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
}

export function analyze(
  raw: RawTransaction[],
  aiCategories?: Record<number, string>,
): AnalysisResult {
  const transactions = classifyTransactions(raw, aiCategories);
  return buildResultFromClassified(transactions);
}

/** Build an AnalysisResult from already-classified Transaction[] (no re-categorization) */
export function buildResultFromClassified(transactions: Transaction[]): AnalysisResult {
  const totalIncome = 0; // Income display removed — app is expense-focused

  const totalExpenses = transactions
    .filter((t) => t.type === "expense" && !isExcludedTransfer(t))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const categoryBreakdown = computeCategoryBreakdown(transactions);
  const monthlyData = computeMonthlyData(transactions);
  const recurring = detectRecurring(transactions);
  const spikes = detectSpikes(transactions);

  const dates = transactions.map((t) => t.date).sort();

  const topCategory = categoryBreakdown[0]?.category || "N/A";
  const lowestCategory = categoryBreakdown[categoryBreakdown.length - 1]?.category || "N/A";

  const expenseTransfers = transactions.filter((t) => t.type === "expense" && isExcludedTransfer(t));
  const incomeTransfers = transactions.filter((t) => t.type === "income" && t.category === "Transfer");
  const allExcluded = [...expenseTransfers, ...incomeTransfers];

  const excludedTransferGroups: import("./types").ExcludedTransferGroup[] = [];
  if (allExcluded.length > 0) {
    const bySub = new Map<string, import("./types").ExcludedTransferGroup>();
    for (const t of allExcluded) {
      const sub = t.subcategory || "Other Transfer";
      const entry = bySub.get(sub) || { subcategory: sub, count: 0, expenseTotal: 0, incomeTotal: 0, transactions: [] };
      entry.count++;
      if (t.type === "expense") {
        entry.expenseTotal += Math.abs(t.amount);
      } else {
        entry.incomeTotal += Math.abs(t.amount);
      }
      entry.transactions.push({ desc: t.description, amount: Math.abs(t.amount), date: t.date, type: t.type });
      bySub.set(sub, entry);
    }
    for (const group of bySub.values()) {
      group.transactions.sort((a, b) => b.amount - a.amount);
      excludedTransferGroups.push(group);
    }
  }

  return {
    transactions,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netFlow: Math.round((totalIncome - totalExpenses) * 100) / 100,
    categoryBreakdown,
    monthlyData,
    recurring,
    spikes,
    topCategory,
    lowestCategory,
    dateRange: {
      from: dates[0] || "",
      to: dates[dates.length - 1] || "",
    },
    anomalyNotes: [],
    excludedTransferGroups,
  };
}

/** Partition already-classified transactions by month and build per-month results */
export function buildMonthlyResults(transactions: Transaction[]): MonthlyResult[] {
  const monthMap = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const month = t.date.slice(0, 7); // YYYY-MM
    if (!month || month.length < 7) continue;
    const list = monthMap.get(month) || [];
    list.push(t);
    monthMap.set(month, list);
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, txns]) => {
      const d = new Date(month + "-01");
      const label = d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
      return { month, label, result: buildResultFromClassified(txns) };
    });
}

/** Split transactions by month and analyze each separately + overall */
export function analyzeMultiMonth(
  raw: RawTransaction[],
  aiCategories?: Record<number, string>,
): MultiMonthAnalysis {
  const overall = analyze(raw, aiCategories);
  const months = buildMonthlyResults(overall.transactions);
  return { overall, months };
}
