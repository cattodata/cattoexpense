"use client";

import { TrendingDown, Hash, DollarSign, Calendar, ArrowUpDown } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

interface SummaryCardsProps {
  result: AnalysisResult;
  previousResult?: AnalysisResult;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function ChangeIndicator({ current, previous, invertColor }: { current: number; previous: number; invertColor?: boolean }) {
  const pct = pctChange(current, previous);
  if (pct === null || Math.abs(pct) < 1) return null;
  const up = pct > 0;
  const isPositive = invertColor ? !up : up;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${isPositive ? "text-[var(--catto-green-600)]" : "text-[var(--catto-orange-600)]"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

export default function SummaryCards({ result, previousResult }: SummaryCardsProps) {
  const topCategory = result.categoryBreakdown.length > 0
    ? result.categoryBreakdown[0].category
    : "N/A";

  const expenseTxns = result.transactions.filter((t) => t.type === "expense");
  const avgTransaction = expenseTxns.length > 0
    ? expenseTxns.reduce((s, t) => s + Math.abs(t.amount), 0) / expenseTxns.length
    : 0;
  const largestExpense = expenseTxns.length > 0
    ? Math.max(...expenseTxns.map((t) => Math.abs(t.amount)))
    : 0;

  const cards = [
    {
      label: "Total Expenses",
      value: `$${result.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      iconBg: "bg-[var(--catto-orange-100)]",
      iconColor: "text-[var(--catto-orange-600)]",
      valueColor: "text-[var(--catto-orange-600)]",
      comparison: previousResult ? <ChangeIndicator current={result.totalExpenses} previous={previousResult.totalExpenses} invertColor /> : null,
    },
    {
      label: "Avg Transaction",
      value: `$${avgTransaction.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: ArrowUpDown,
      iconBg: "bg-[var(--catto-blue-100)]",
      iconColor: "text-[var(--catto-blue-600)]",
      valueColor: "text-[var(--catto-blue-600)]",
      comparison: null,
    },
    {
      label: "Largest Expense",
      value: `$${largestExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      iconBg: "bg-[var(--catto-red-100)]",
      iconColor: "text-[var(--catto-red-500)]",
      valueColor: "text-[var(--catto-red-500)]",
      comparison: null,
    },
    {
      label: "Transactions",
      value: `${result.transactions.length}`,
      icon: Hash,
      iconBg: "bg-[var(--catto-blue-100)]",
      iconColor: "text-[var(--catto-blue-500)]",
      valueColor: "text-[var(--catto-blue-500)]",
      comparison: null,
    },
    {
      label: "Top Category",
      value: topCategory,
      icon: DollarSign,
      iconBg: "bg-[var(--catto-orange-100)]",
      iconColor: "text-[var(--catto-orange-500)]",
      valueColor: "text-[var(--catto-green-600)]",
      comparison: null,
    },
    {
      label: "Period",
      value: `${result.dateRange.from} → ${result.dateRange.to}`,
      icon: Calendar,
      iconBg: "bg-[var(--catto-slate-100)]",
      iconColor: "text-[var(--catto-slate-500)]",
      valueColor: "text-[var(--catto-slate-900)]",
      comparison: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 catto-stagger">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white p-5 rounded-xl border border-[var(--catto-slate-100)] shadow-sm hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <div className={`p-3 rounded-xl ${card.iconBg}`}>
            <card.icon className={`w-5 h-5 ${card.iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[var(--catto-slate-500)] text-sm font-medium">{card.label}</p>
            <div className="flex items-center gap-2">
              <p className={`text-base sm:text-lg font-black ${card.valueColor} truncate`}>{card.value}</p>
              {card.comparison}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
