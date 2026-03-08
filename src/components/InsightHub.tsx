"use client";

import { Lightbulb, TrendingUp, TrendingDown, Repeat, Zap, DollarSign } from "lucide-react";
import { getCategoryEmoji } from "@/lib/category-emoji";
import type { AnalysisResult, MonthlyResult } from "@/lib/types";

interface InsightHubProps {
  result: AnalysisResult;
  previousResult?: AnalysisResult;
  monthlyResults?: MonthlyResult[];
  activeMonth: string;
}

interface Insight {
  icon: React.ReactNode;
  text: string;
  detail?: string;
  type: "warning" | "info" | "positive" | "neutral";
}

export default function InsightHub({ result, previousResult, monthlyResults, activeMonth }: InsightHubProps) {
  const insights: Insight[] = [];

  // 1. Top spending category
  if (result.categoryBreakdown.length > 0) {
    const top = result.categoryBreakdown[0];
    insights.push({
      icon: <DollarSign className="w-4 h-4" />,
      text: `Top spending: ${getCategoryEmoji(top.category)} ${top.category} — $${top.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (${top.percentage}% of expenses)`,
      detail: `${top.count} transactions, avg $${(top.total / top.count).toFixed(0)} each`,
      type: top.percentage >= 30 ? "warning" : "info",
    });
  }

  // 2. Month-over-month comparison (if previous month data available)
  if (previousResult) {
    const diff = result.totalExpenses - previousResult.totalExpenses;
    const pctChange = previousResult.totalExpenses > 0
      ? Math.round((diff / previousResult.totalExpenses) * 100)
      : 0;

    if (Math.abs(pctChange) >= 5) {
      const increased = diff > 0;
      insights.push({
        icon: increased ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
        text: `Spending ${increased ? "up" : "down"} ${Math.abs(pctChange)}% vs last month ($${Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${increased ? "more" : "less"})`,
        type: increased ? "warning" : "positive",
      });
    }

    // Find which categories changed most
    const prevCatMap = new Map(previousResult.categoryBreakdown.map((c) => [c.category, c.total]));
    let biggestIncrease = { category: "", diff: 0, pct: 0 };
    for (const cat of result.categoryBreakdown) {
      const prevTotal = prevCatMap.get(cat.category) || 0;
      const catDiff = cat.total - prevTotal;
      const catPct = prevTotal > 0 ? Math.round((catDiff / prevTotal) * 100) : 0;
      if (catDiff > biggestIncrease.diff && catPct >= 15) {
        biggestIncrease = { category: cat.category, diff: catDiff, pct: catPct };
      }
    }
    if (biggestIncrease.category) {
      insights.push({
        icon: <TrendingUp className="w-4 h-4" />,
        text: `${getCategoryEmoji(biggestIncrease.category)} ${biggestIncrease.category} increased ${biggestIncrease.pct}% vs last month (+$${biggestIncrease.diff.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })})`,
        type: "warning",
      });
    }
  }

  // 3. Recurring charges summary
  if (result.recurring.length > 0) {
    const totalRecurring = result.recurring.reduce((sum, r) => sum + r.amount, 0);
    insights.push({
      icon: <Repeat className="w-4 h-4" />,
      text: `${result.recurring.length} recurring charges detected — ~$${totalRecurring.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/month`,
      detail: result.recurring.slice(0, 2).map((r) => r.description).join(", ") + (result.recurring.length > 2 ? ` +${result.recurring.length - 2} more` : ""),
      type: "info",
    });
  }

  // 4. Spending spikes
  if (result.spikes.length > 0) {
    const topSpike = result.spikes[0];
    insights.push({
      icon: <Zap className="w-4 h-4" />,
      text: `Spending spike: ${topSpike.description} — $${topSpike.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} on ${topSpike.date}`,
      detail: `${getCategoryEmoji(topSpike.category)} ${topSpike.category}`,
      type: "warning",
    });
  }

  // 5. Average daily spending
  const dayCount = (() => {
    if (!result.dateRange.from || !result.dateRange.to) return 1;
    const from = new Date(result.dateRange.from);
    const to = new Date(result.dateRange.to);
    const diff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  })();
  const dailyAvg = result.totalExpenses / dayCount;
  insights.push({
    icon: <DollarSign className="w-4 h-4" />,
    text: `Average daily spending: $${dailyAvg.toFixed(0)}/day over ${dayCount} days`,
    type: "neutral",
  });

  // 6. Income vs expense ratio
  if (result.totalIncome > 0) {
    const savingsRate = Math.round(((result.totalIncome - result.totalExpenses) / result.totalIncome) * 100);
    insights.push({
      icon: savingsRate >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
      text: savingsRate >= 0
        ? `Savings rate: ${savingsRate}% — you saved $${(result.totalIncome - result.totalExpenses).toFixed(0)} this period`
        : `Overspending by $${Math.abs(result.totalIncome - result.totalExpenses).toFixed(0)} — expenses exceed income by ${Math.abs(savingsRate)}%`,
      type: savingsRate >= 20 ? "positive" : savingsRate >= 0 ? "info" : "warning",
    });
  }

  // 7. Multi-month trend (if viewing "all" with multiple months)
  if (activeMonth === "all" && monthlyResults && monthlyResults.length >= 3) {
    const expenses = monthlyResults.map((m) => m.result.totalExpenses);
    const isIncreasing = expenses.every((v, i) => i === 0 || v >= expenses[i - 1] * 0.95);
    const isDecreasing = expenses.every((v, i) => i === 0 || v <= expenses[i - 1] * 1.05);
    if (isIncreasing && !isDecreasing) {
      insights.push({
        icon: <TrendingUp className="w-4 h-4" />,
        text: `Spending has been trending upward over the last ${monthlyResults.length} months`,
        type: "warning",
      });
    } else if (isDecreasing && !isIncreasing) {
      insights.push({
        icon: <TrendingDown className="w-4 h-4" />,
        text: `Spending has been trending downward — nice! 🎉`,
        type: "positive",
      });
    }
  }

  if (insights.length === 0) return null;

  const typeStyles = {
    warning: "border-l-[var(--catto-orange-400)] bg-[var(--catto-orange-50)]",
    info: "border-l-[var(--catto-blue-400)] bg-[var(--catto-blue-50)]",
    positive: "border-l-[var(--catto-green-400)] bg-[var(--catto-green-50)]",
    neutral: "border-l-[var(--catto-slate-300)] bg-[var(--catto-slate-50)]",
  };

  const iconStyles = {
    warning: "text-[var(--catto-orange-500)]",
    info: "text-[var(--catto-blue-500)]",
    positive: "text-[var(--catto-green-600)]",
    neutral: "text-[var(--catto-slate-500)]",
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--catto-slate-100)] shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-[var(--catto-primary)]" />
        <h3 className="text-lg font-bold text-[var(--catto-slate-900)]">Insight Hub 🔔</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.slice(0, 6).map((insight, i) => (
          <div
            key={i}
            className={`border-l-4 rounded-lg p-3 sm:p-4 ${typeStyles[insight.type]}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 shrink-0 ${iconStyles[insight.type]}`}>
                {insight.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--catto-slate-800)]">{insight.text}</p>
                {insight.detail && (
                  <p className="text-xs text-[var(--catto-slate-500)] mt-1">{insight.detail}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
