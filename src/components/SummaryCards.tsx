"use client";

import { TrendingUp, TrendingDown, ArrowDownUp, Hash, DollarSign, Calendar } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

interface SummaryCardsProps {
  result: AnalysisResult;
}

export default function SummaryCards({ result }: SummaryCardsProps) {
  const topCategory = result.categoryBreakdown.length > 0
    ? result.categoryBreakdown[0].category
    : "N/A";

  const cards = [
    {
      label: "Total Income",
      value: `$${result.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      iconBg: "bg-[var(--catto-green-100)]",
      iconColor: "text-[var(--catto-green-600)]",
      valueColor: "text-[var(--catto-green-600)]",
    },
    {
      label: "Total Expenses",
      value: `$${result.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      iconBg: "bg-[var(--catto-orange-100)]",
      iconColor: "text-[var(--catto-orange-600)]",
      valueColor: "text-[var(--catto-orange-600)]",
    },
    {
      label: "Net Flow",
      value: `$${result.netFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: ArrowDownUp,
      iconBg: "bg-[var(--catto-blue-100)]",
      iconColor: "text-[var(--catto-blue-600)]",
      valueColor: result.netFlow >= 0 ? "text-[var(--catto-green-600)]" : "text-[var(--catto-red-500)]",
    },
    {
      label: "Transactions",
      value: `${result.transactions.length}`,
      icon: Hash,
      iconBg: "bg-[var(--catto-blue-100)]",
      iconColor: "text-[var(--catto-blue-500)]",
      valueColor: "text-[var(--catto-blue-500)]",
    },
    {
      label: "Top Category",
      value: topCategory,
      icon: DollarSign,
      iconBg: "bg-[var(--catto-orange-100)]",
      iconColor: "text-[var(--catto-orange-500)]",
      valueColor: "text-[var(--catto-green-600)]",
    },
    {
      label: "Period",
      value: `${result.dateRange.from} → ${result.dateRange.to}`,
      icon: Calendar,
      iconBg: "bg-[var(--catto-slate-100)]",
      iconColor: "text-[var(--catto-slate-500)]",
      valueColor: "text-[var(--catto-slate-900)]",
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
            <p className={`text-lg font-black ${card.valueColor} truncate`}>{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
