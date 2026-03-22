"use client";

import { useState } from "react";
import { Lightbulb, TrendingUp, TrendingDown, Repeat, Zap, DollarSign, Calendar, MapPin, ShoppingBag, Clock, ChevronDown } from "lucide-react";
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

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function InsightHub({ result, previousResult, monthlyResults, activeMonth }: InsightHubProps) {
  const [expanded, setExpanded] = useState(false);
  const insights: Insight[] = [];
  const expenses = result.transactions.filter((t) => t.type === "expense");

  // 1. Top spending category
  if (result.categoryBreakdown.length > 0) {
    const top = result.categoryBreakdown[0];
    insights.push({
      icon: <DollarSign className="w-4 h-4" />,
      text: `Top spending: ${getCategoryEmoji(top.category)} ${top.category} — $${fmt(top.total)} (${top.percentage}% of expenses)`,
      detail: `${top.count} transactions, avg $${(top.total / top.count).toFixed(0)} each`,
      type: top.percentage >= 30 ? "warning" : "info",
    });
  }

  // 2. Month-over-month comparison
  if (previousResult) {
    const diff = result.totalExpenses - previousResult.totalExpenses;
    const pctChange = previousResult.totalExpenses > 0
      ? Math.round((diff / previousResult.totalExpenses) * 100)
      : 0;

    if (Math.abs(pctChange) >= 5) {
      const increased = diff > 0;
      insights.push({
        icon: increased ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
        text: `Spending ${increased ? "up" : "down"} ${Math.abs(pctChange)}% vs last month ($${fmt(Math.abs(diff))} ${increased ? "more" : "less"})`,
        type: increased ? "warning" : "positive",
      });
    }

    // Biggest category increase
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
        text: `${getCategoryEmoji(biggestIncrease.category)} ${biggestIncrease.category} increased ${biggestIncrease.pct}% vs last month (+$${fmt(biggestIncrease.diff)})`,
        type: "warning",
      });
    }

    // New/disappeared categories
    const curCats = new Set(result.categoryBreakdown.map((c) => c.category));
    const prevCats = new Set(previousResult.categoryBreakdown.map((c) => c.category));
    const newCats = result.categoryBreakdown.filter((c) => !prevCats.has(c.category) && c.total > 50);
    if (newCats.length > 0) {
      const c = newCats[0];
      insights.push({
        icon: <ShoppingBag className="w-4 h-4" />,
        text: `New this month: ${getCategoryEmoji(c.category)} ${c.category} ($${fmt(c.total)}, ${c.count} transactions) — wasn't in previous month`,
        type: "info",
      });
    }
    const goneCats = previousResult.categoryBreakdown.filter((c) => !curCats.has(c.category) && c.total > 50);
    if (goneCats.length > 0) {
      insights.push({
        icon: <TrendingDown className="w-4 h-4" />,
        text: `${getCategoryEmoji(goneCats[0].category)} ${goneCats[0].category} spending gone this month (was $${fmt(goneCats[0].total)} last month)`,
        type: "positive",
      });
    }
  }

  // 3. Recurring charges summary
  if (result.recurring.length > 0) {
    const totalRecurring = result.recurring.reduce((sum, r) => sum + r.amount, 0);
    const annualized = totalRecurring * 12;
    insights.push({
      icon: <Repeat className="w-4 h-4" />,
      text: `${result.recurring.length} recurring charges — ~$${fmt(totalRecurring)}/month ($${fmt(annualized)}/year)`,
      detail: result.recurring.slice(0, 2).map((r) => r.description).join(", ") + (result.recurring.length > 2 ? ` +${result.recurring.length - 2} more` : ""),
      type: "info",
    });
  }

  // 4. Spending spikes
  if (result.spikes.length > 0) {
    const topSpike = result.spikes[0];
    insights.push({
      icon: <Zap className="w-4 h-4" />,
      text: `Spending spike: ${topSpike.description} — $${fmt(topSpike.amount)} on ${topSpike.date}`,
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

  // 6. Multi-month trend
  if (activeMonth === "all" && monthlyResults && monthlyResults.length >= 3) {
    const monthExpenses = monthlyResults.map((m) => m.result.totalExpenses);
    const isIncreasing = monthExpenses.every((v, i) => i === 0 || v >= monthExpenses[i - 1] * 0.95);
    const isDecreasing = monthExpenses.every((v, i) => i === 0 || v <= monthExpenses[i - 1] * 1.05);
    if (isIncreasing && !isDecreasing) {
      insights.push({
        icon: <TrendingUp className="w-4 h-4" />,
        text: `Spending trending upward over the last ${monthlyResults.length} months`,
        type: "warning",
      });
    } else if (isDecreasing && !isIncreasing) {
      insights.push({
        icon: <TrendingDown className="w-4 h-4" />,
        text: `Spending trending downward — nice!`,
        type: "positive",
      });
    }
  }

  // 7. Weekend vs weekday spending
  if (expenses.length >= 10) {
    let weekdayTotal = 0, weekdayDays = new Set<string>();
    let weekendTotal = 0, weekendDays = new Set<string>();
    for (const t of expenses) {
      const day = new Date(t.date).getDay();
      const amt = Math.abs(t.amount);
      if (day === 0 || day === 6) {
        weekendTotal += amt;
        weekendDays.add(t.date);
      } else {
        weekdayTotal += amt;
        weekdayDays.add(t.date);
      }
    }
    const wdPerDay = weekdayDays.size > 0 ? weekdayTotal / weekdayDays.size : 0;
    const wePerDay = weekendDays.size > 0 ? weekendTotal / weekendDays.size : 0;
    if (wdPerDay > 0 && wePerDay > 0) {
      const ratio = Math.round(((wePerDay - wdPerDay) / wdPerDay) * 100);
      if (Math.abs(ratio) >= 20) {
        insights.push({
          icon: <Calendar className="w-4 h-4" />,
          text: ratio > 0
            ? `Weekend spending ${ratio}% higher — $${wePerDay.toFixed(0)}/day vs $${wdPerDay.toFixed(0)}/day on weekdays`
            : `Weekday spending ${Math.abs(ratio)}% higher — $${wdPerDay.toFixed(0)}/day vs $${wePerDay.toFixed(0)}/day on weekends`,
          type: ratio > 30 ? "warning" : "info",
        });
      }
    }
  }

  // 8. Latte Factor — small purchase accumulation
  if (expenses.length >= 10) {
    const threshold = 15;
    const catSmall = new Map<string, { total: number; count: number }>();
    for (const t of expenses) {
      const amt = Math.abs(t.amount);
      if (amt > 0 && amt < threshold) {
        const e = catSmall.get(t.category) || { total: 0, count: 0 };
        e.total += amt;
        e.count++;
        catSmall.set(t.category, e);
      }
    }
    let topSmall = { category: "", total: 0, count: 0 };
    for (const [cat, data] of catSmall) {
      if (data.count > topSmall.count) topSmall = { category: cat, ...data };
    }
    if (topSmall.count >= 5 && topSmall.total >= 50) {
      const pctOfTotal = result.totalExpenses > 0 ? Math.round((topSmall.total / result.totalExpenses) * 100) : 0;
      insights.push({
        icon: <ShoppingBag className="w-4 h-4" />,
        text: `${topSmall.count} small purchases (<$${threshold}) in ${getCategoryEmoji(topSmall.category)} ${topSmall.category} = $${fmt(topSmall.total)} (${pctOfTotal}% of total)`,
        detail: `Avg $${(topSmall.total / topSmall.count).toFixed(2)} each`,
        type: topSmall.total >= 200 ? "warning" : "info",
      });
    }
  }

  // 9. Paycheck cycle — spending distribution across the month
  if (expenses.length >= 15 && dayCount >= 25) {
    const thirds: [number, number, number] = [0, 0, 0];
    for (const t of expenses) {
      const d = new Date(t.date).getDate();
      if (d <= 10) thirds[0] += Math.abs(t.amount);
      else if (d <= 20) thirds[1] += Math.abs(t.amount);
      else thirds[2] += Math.abs(t.amount);
    }
    const total = thirds[0] + thirds[1] + thirds[2];
    if (total > 0) {
      const firstPct = Math.round((thirds[0] / total) * 100);
      const lastPct = Math.round((thirds[2] / total) * 100);
      if (firstPct >= 45) {
        insights.push({
          icon: <Clock className="w-4 h-4" />,
          text: `${firstPct}% of spending in first 10 days of the month — possible paycheck-cycle overspending`,
          detail: `Days 1-10: $${fmt(thirds[0])}, Days 11-20: $${fmt(thirds[1])}, Days 21+: $${fmt(thirds[2])}`,
          type: "warning",
        });
      } else if (lastPct >= 45) {
        insights.push({
          icon: <Clock className="w-4 h-4" />,
          text: `${lastPct}% of spending in last 10 days — spending concentrated at month-end`,
          detail: `Days 1-10: $${fmt(thirds[0])}, Days 11-20: $${fmt(thirds[1])}, Days 21+: $${fmt(thirds[2])}`,
          type: "info",
        });
      }
    }
  }

  // 10. Category concentration
  if (result.categoryBreakdown.length >= 3) {
    const top2 = result.categoryBreakdown.slice(0, 2);
    const top2Pct = top2.reduce((s, c) => s + c.percentage, 0);
    if (top2Pct >= 55) {
      insights.push({
        icon: <DollarSign className="w-4 h-4" />,
        text: `${getCategoryEmoji(top2[0].category)} ${top2[0].category} + ${getCategoryEmoji(top2[1].category)} ${top2[1].category} = ${top2Pct}% of all spending`,
        type: top2Pct >= 70 ? "warning" : "info",
      });
    }
  }

  // 11. Annual projection
  if (monthlyResults && monthlyResults.length >= 2) {
    const avgMonthly = monthlyResults.reduce((s, m) => s + m.result.totalExpenses, 0) / monthlyResults.length;
    const projected = avgMonthly * 12;
    insights.push({
      icon: <TrendingUp className="w-4 h-4" />,
      text: `Projected annual spending: $${fmt(projected)} ($${fmt(avgMonthly)}/month avg over ${monthlyResults.length} months)`,
      type: projected > avgMonthly * 14 ? "warning" : "neutral",
    });
  }

  // 12. Top merchant by frequency
  if (expenses.length >= 10) {
    const merchantCount = new Map<string, { count: number; total: number }>();
    for (const t of expenses) {
      const key = t.description.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
      const e = merchantCount.get(key) || { count: 0, total: 0 };
      e.count++;
      e.total += Math.abs(t.amount);
      merchantCount.set(key, e);
    }
    let topMerchant = { name: "", count: 0, total: 0 };
    for (const [name, data] of merchantCount) {
      if (data.count > topMerchant.count) topMerchant = { name, ...data };
    }
    if (topMerchant.count >= 4) {
      insights.push({
        icon: <Repeat className="w-4 h-4" />,
        text: `Most visited: "${topMerchant.name}" — ${topMerchant.count}x, $${fmt(topMerchant.total)} total`,
        type: "neutral",
      });
    }
  }

  // 13. International spending
  if (expenses.length >= 5) {
    const countries = new Map<string, { count: number; total: number }>();
    for (const t of expenses) {
      if (t.country && t.country !== "Unknown") {
        const e = countries.get(t.country) || { count: 0, total: 0 };
        e.count++;
        e.total += Math.abs(t.amount);
        countries.set(t.country, e);
      }
    }
    if (countries.size >= 2) {
      const sorted = Array.from(countries.entries()).sort((a, b) => b[1].total - a[1].total);
      const topCountry = sorted[0];
      const intlTotal = sorted.slice(1).reduce((s, [, d]) => s + d.total, 0);
      if (intlTotal > 0 && result.totalExpenses > 0) {
        const intlPct = Math.round((intlTotal / result.totalExpenses) * 100);
        if (intlPct >= 5) {
          insights.push({
            icon: <MapPin className="w-4 h-4" />,
            text: `International spending: $${fmt(intlTotal)} (${intlPct}% of total) across ${countries.size - 1} countries outside ${topCountry[0]}`,
            type: "info",
          });
        }
      }
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

  const visible = expanded ? insights : insights.slice(0, 6);

  return (
    <div className="bg-white rounded-xl border border-[var(--catto-slate-100)] shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-[var(--catto-primary)]" />
        <h3 className="text-lg font-bold text-[var(--catto-slate-900)]">Insight Hub</h3>
        <span className="text-xs text-[var(--catto-slate-400)]">({insights.length})</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visible.map((insight, i) => (
          <div
            key={i}
            className={`border-l-4 rounded-lg p-3 sm:p-4 ${typeStyles[insight.type]}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 shrink-0 ${iconStyles[insight.type]}`}>
                {insight.icon}
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-sm font-semibold text-[var(--catto-slate-800)] break-words">{insight.text}</p>
                {insight.detail && (
                  <p className="text-xs text-[var(--catto-slate-500)] mt-1">{insight.detail}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {insights.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm font-medium text-[var(--catto-blue-500)] hover:text-[var(--catto-blue-700)] flex items-center gap-1 cursor-pointer"
        >
          {expanded ? "Show less" : `Show ${insights.length - 6} more insights`}
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}
