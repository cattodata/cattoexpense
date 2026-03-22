"use client";

import { Flame, ShoppingBag, Zap, RefreshCw, TrendingUp, Calendar } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { getCategoryEmoji } from "@/lib/category-emoji";

interface SummaryCardsProps {
  result: AnalysisResult;
  previousResult?: AnalysisResult;
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from);
  const b = new Date(to);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

export default function SummaryCards({ result, previousResult }: SummaryCardsProps) {
  const expenses = result.transactions.filter((t) => t.type === "expense");
  const days = daysBetween(result.dateRange.from, result.dateRange.to);
  const months = Math.max(1, Math.round(days / 30));

  // Daily burn rate
  const dailyBurn = expenses.length > 0 ? result.totalExpenses / days : 0;

  // Top category
  const topCat = result.categoryBreakdown[0];

  // Biggest single expense
  const biggest = expenses.length > 0
    ? expenses.reduce((max, t) => Math.abs(t.amount) > Math.abs(max.amount) ? t : max, expenses[0])
    : null;

  // Recurring total per month
  const recurringMonthly = result.recurring.reduce((s, r) => s + Math.abs(r.amount), 0);
  const recurringCount = result.recurring.length;

  // Busiest month
  const busiestMonth = result.monthlyData.length > 0
    ? result.monthlyData.reduce((max, m) => m.expenses > max.expenses ? m : max, result.monthlyData[0])
    : null;

  // Period label
  const periodLabel = months >= 12
    ? `${Math.round(months / 12 * 10) / 10} yrs`
    : `${months} mo`;

  // Change indicator
  const pct = previousResult && previousResult.totalExpenses > 0
    ? Math.round(((result.totalExpenses - previousResult.totalExpenses) / previousResult.totalExpenses) * 100)
    : null;

  const cards: {
    label: string;
    value: string;
    sub: string;
    icon: typeof Flame;
    iconBg: string;
    iconColor: string;
    valueColor: string;
    badge?: { text: string; color: string } | null;
  }[] = [
    {
      label: "Daily Burn Rate",
      value: `$${fmt(dailyBurn)}`,
      sub: `$${fmt(result.totalExpenses, 2)} over ${periodLabel}`,
      icon: Flame,
      iconBg: "bg-[var(--catto-orange-100)]",
      iconColor: "text-[var(--catto-orange-600)]",
      valueColor: "text-[var(--catto-orange-600)]",
      badge: pct !== null && Math.abs(pct) >= 1
        ? { text: `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct)}% vs prev`, color: pct > 0 ? "text-[var(--catto-orange-600)]" : "text-[var(--catto-green-600)]" }
        : null,
    },
    {
      label: "Top Spend",
      value: topCat ? `${getCategoryEmoji(topCat.category)} ${topCat.category}` : "N/A",
      sub: topCat ? `${topCat.percentage}% · $${fmt(topCat.total, 2)}` : "",
      icon: ShoppingBag,
      iconBg: "bg-[var(--catto-primary-light)]",
      iconColor: "text-[var(--catto-primary-hover)]",
      valueColor: "text-[var(--catto-slate-900)]",
    },
    {
      label: "Biggest Hit",
      value: biggest ? `$${fmt(Math.abs(biggest.amount), 2)}` : "—",
      sub: biggest ? biggest.description.slice(0, 30) : "",
      icon: Zap,
      iconBg: "bg-[var(--catto-red-100)]",
      iconColor: "text-[var(--catto-red-500)]",
      valueColor: "text-[var(--catto-red-500)]",
    },
    {
      label: "Recurring",
      value: recurringCount > 0 ? `$${fmt(recurringMonthly)}/mo` : "None",
      sub: recurringCount > 0 ? `${recurringCount} subscription${recurringCount > 1 ? "s" : ""} detected` : "No recurring charges found",
      icon: RefreshCw,
      iconBg: "bg-[var(--catto-blue-100)]",
      iconColor: "text-[var(--catto-blue-600)]",
      valueColor: "text-[var(--catto-blue-600)]",
    },
    {
      label: "Busiest Month",
      value: busiestMonth ? `$${fmt(busiestMonth.expenses, 0)}` : "—",
      sub: busiestMonth ? busiestMonth.month : "",
      icon: TrendingUp,
      iconBg: "bg-[var(--catto-orange-100)]",
      iconColor: "text-[var(--catto-orange-500)]",
      valueColor: "text-[var(--catto-orange-500)]",
    },
    {
      label: "Period",
      value: `${result.transactions.length} txns`,
      sub: `${result.dateRange.from} → ${result.dateRange.to}`,
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
          <div className={`p-3 rounded-xl ${card.iconBg} shrink-0`}>
            <card.icon className={`w-5 h-5 ${card.iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[var(--catto-slate-500)] text-xs font-medium">{card.label}</p>
            <p className={`text-base sm:text-lg font-black ${card.valueColor} truncate`}>{card.value}</p>
            <div className="flex items-center gap-2">
              <p className="text-[var(--catto-slate-400)] text-xs truncate">{card.sub}</p>
              {card.badge && <span className={`text-[10px] font-bold ${card.badge.color} whitespace-nowrap`}>{card.badge.text}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
