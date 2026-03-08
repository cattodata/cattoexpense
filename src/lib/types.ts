export interface RawTransaction {
  date: string;
  amount: number;
  description: string;
  source?: string; // bank/card issuer name
  isRefund?: boolean; // credit card refund/credit
}

export interface Transaction {
  date: string;
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  type: "income" | "expense";
  source?: string;
  country?: string;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export interface RecurringItem {
  description: string;
  amount: number;
  occurrences: number;
  category: string;
}

export interface SpendingSpike {
  date: string;
  amount: number;
  description: string;
  category: string;
}

export interface ExcludedTransferGroup {
  subcategory: string;
  count: number;
  expenseTotal: number;
  incomeTotal: number;
  transactions: { desc: string; amount: number; date: string; type: "income" | "expense" }[];
}

export interface AnalysisResult {
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyData: MonthlyData[];
  recurring: RecurringItem[];
  spikes: SpendingSpike[];
  topCategory: string;
  lowestCategory: string;
  dateRange: { from: string; to: string };
  anomalyNotes: string[];
  excludedTransferGroups: ExcludedTransferGroup[];
}

export interface ColumnMapping {
  date: string;
  amount: string;
  description: string;
}

export interface AICoachingData {
  summary: string;
  suggestions: string[];
}

export interface MonthlyResult {
  month: string; // "YYYY-MM"
  label: string; // "Jan 25", "Feb 25"
  result: AnalysisResult;
}

export interface MultiMonthAnalysis {
  overall: AnalysisResult;
  months: MonthlyResult[];
}


