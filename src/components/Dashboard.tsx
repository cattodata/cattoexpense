"use client";

import { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Sparkles,
  Loader2,
  Key,
  X,
  ShieldCheck,
  Download,
  Calendar,
  List,
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { AnalysisResult, RawTransaction, AICoachingData, MonthlyResult } from "@/lib/types";
import { exportCSV, exportPDF } from "@/lib/export";
import { maskTransactionsForAI, createSafeSummary, exportMaskedCSV } from "@/lib/masker";
import { aiCategorize, aiCoach } from "@/lib/ai-service";
import { analyze } from "@/lib/analyzer";
import { getCategoryEmoji } from "@/lib/category-emoji";
import SummaryCards from "./SummaryCards";
import { ExpenseBreakdownChart, CategoryBarChart, IncomeExpensesChart, SubcategoryDonutChart } from "./Charts";
import Insights from "./Insights";
import AICoaching from "./AICoaching";
import PrivacyPreview from "./PrivacyPreview";
import InsightHub from "./InsightHub";

interface DashboardProps {
  result: AnalysisResult;
  rawTransactions: RawTransaction[];
  onResultUpdate: (result: AnalysisResult, aiCategories?: Record<number, string>) => void;
  onReset: () => void;
  monthlyResults?: MonthlyResult[];
}

export default function Dashboard({ result, rawTransactions, onResultUpdate, onReset, monthlyResults }: DashboardProps) {
  const [exporting, setExporting] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [coaching, setCoaching] = useState<AICoachingData | null>(null);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState<string>("all");

  // Category detail table state
  const [catSearch, setCatSearch] = useState("");
  const [catCountryFilter, setCatCountryFilter] = useState<string>("all");
  const [catSubcategoryFilter, setCatSubcategoryFilter] = useState<string>("all");
  const [catSortField, setCatSortField] = useState<"date" | "amount" | "description" | "subcategory" | "country">("amount");
  const [catSortDir, setCatSortDir] = useState<"asc" | "desc">("desc");

  // All Transactions table state
  const [txSearch, setTxSearch] = useState("");
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>("all");
  const [txCountryFilter, setTxCountryFilter] = useState<string>("all");
  const [txTypeFilter, setTxTypeFilter] = useState<string>("all");
  const [txSortField, setTxSortField] = useState<"date" | "amount" | "description" | "category" | "subcategory" | "country">("date");
  const [txSortDir, setTxSortDir] = useState<"asc" | "desc">("desc");
  const [txExpanded, setTxExpanded] = useState(false);
  const [txShowCount, setTxShowCount] = useState(25);

  // Determine which result to show based on selected month
  const hasMultipleMonths = monthlyResults && monthlyResults.length > 1;
  const activeResult = activeMonth === "all"
    ? result
    : monthlyResults?.find((m) => m.month === activeMonth)?.result || result;

  // Transfer exclusion toggles — all excluded by default
  const [excludedSubcats, setExcludedSubcats] = useState<Set<string>>(new Set());

  // Initialize excluded subcats from the active result when it changes
  const excludedGroupsKey = useMemo(() =>
    (activeResult.excludedTransferGroups || []).map((g) => g.subcategory).sort().join("|"),
    [activeResult.excludedTransferGroups]
  );

  // Keep toggles in sync when switching months/results
  useMemo(() => {
    setExcludedSubcats(new Set((activeResult.excludedTransferGroups || []).map((g) => g.subcategory)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludedGroupsKey]);

  // Compute adjusted totals based on toggle selections
  const adjustedResult = useMemo(() => {
    const groups = activeResult.excludedTransferGroups || [];
    if (groups.length === 0) return activeResult;

    let addBackExpense = 0;
    let addBackIncome = 0;
    for (const g of groups) {
      if (!excludedSubcats.has(g.subcategory)) {
        addBackExpense += g.expenseTotal;
        addBackIncome += g.incomeTotal;
      }
    }

    if (addBackExpense === 0 && addBackIncome === 0) return activeResult;

    const newIncome = Math.round((activeResult.totalIncome + addBackIncome) * 100) / 100;
    const newExpenses = Math.round((activeResult.totalExpenses + addBackExpense) * 100) / 100;
    return {
      ...activeResult,
      totalIncome: newIncome,
      totalExpenses: newExpenses,
      netFlow: Math.round((newIncome - newExpenses) * 100) / 100,
    };
  }, [activeResult, excludedSubcats]);

  // Compute previous month result for comparison
  const previousResult = useMemo(() => {
    if (!monthlyResults || monthlyResults.length < 2) return undefined;
    if (activeMonth === "all") {
      // Compare last two months
      return monthlyResults[monthlyResults.length - 2]?.result;
    }
    const idx = monthlyResults.findIndex((m) => m.month === activeMonth);
    if (idx > 0) return monthlyResults[idx - 1].result;
    return undefined;
  }, [activeMonth, monthlyResults]);

  const handleExport = async (type: "csv" | "pdf") => {
    setExporting(true);
    try {
      if (type === "csv") exportCSV(activeResult);
      else exportPDF(activeResult);
    } finally {
      setTimeout(() => setExporting(false), 500);
    }
  };

  const handleAIEnhance = async () => {
    if (!apiKey.trim()) {
      setAiError("Please enter your Gemini API key.");
      return;
    }
    setAiError(null);
    setAiLoading(true);
    try {
      const masked = maskTransactionsForAI(rawTransactions);
      const { categories } = await aiCategorize(apiKey.trim(), masked);
      const enhanced = analyze(rawTransactions, categories);
      onResultUpdate(enhanced, categories);
      const safeSummary = createSafeSummary(enhanced);
      const coachResult = await aiCoach(apiKey.trim(), safeSummary);
      setCoaching(coachResult);
      setAiEnhanced(true);
      setShowAIPanel(false);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI analysis failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] font-[family-name:var(--font-jakarta)]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--catto-primary-20)] bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--catto-primary)] flex items-center justify-center text-sm font-bold text-[var(--catto-slate-900)]">
              CE
            </div>
            <span className="text-lg font-extrabold tracking-tight text-[var(--catto-slate-900)]">CattoExpense</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--catto-green-600)]">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm font-bold hidden sm:inline">100% Local Processing</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Page Header + Action Buttons */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-[var(--catto-slate-900)]">Your Spending Analysis 🐱</h1>
            <p className="text-[var(--catto-slate-500)] mt-1">
              {activeResult.transactions.length} transactions &bull; {activeResult.dateRange.from} to {activeResult.dateRange.to}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!aiEnhanced ? (
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="catto-btn-primary text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Enhance with AI
              </button>
            ) : (
              <span className="catto-badge catto-badge-green flex items-center gap-1 px-3 py-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Enhanced
              </span>
            )}
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting}
              className="catto-btn-primary text-sm bg-[var(--catto-blue-500)] text-white shadow-blue-200"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting}
              className="catto-btn-primary text-sm bg-[var(--catto-blue-600)] text-white shadow-blue-200"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={() => exportMaskedCSV(rawTransactions)}
              className="catto-btn-primary text-sm bg-[var(--catto-purple-500)] text-white shadow-purple-200"
            >
              <ShieldCheck className="w-4 h-4" /> Masked CSV
            </button>
            <button
              onClick={onReset}
              className="catto-btn-secondary text-sm"
            >
              <RotateCcw className="w-4 h-4" /> New Analysis
            </button>
          </div>
        </div>

        {/* Month Tabs — only show when multiple months */}
        {hasMultipleMonths && (
          <div className="bg-white rounded-xl border border-[var(--catto-slate-100)] shadow-sm p-2">
            <div className="flex items-center gap-1 overflow-x-auto">
              <Calendar className="w-4 h-4 text-[var(--catto-slate-400)] ml-2 shrink-0" />
              <button
                onClick={() => { setActiveMonth("all"); setSelectedCategory(null); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                  activeMonth === "all"
                    ? "bg-[var(--catto-primary)] text-[var(--catto-slate-900)] shadow-sm"
                    : "text-[var(--catto-slate-500)] hover:bg-[var(--catto-slate-50)] hover:text-[var(--catto-slate-700)]"
                }`}
              >
                📊 All Months
              </button>
              {monthlyResults!.map((m) => (
                <button
                  key={m.month}
                  onClick={() => { setActiveMonth(m.month); setSelectedCategory(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                    activeMonth === m.month
                      ? "bg-[var(--catto-primary)] text-[var(--catto-slate-900)] shadow-sm"
                      : "text-[var(--catto-slate-500)] hover:bg-[var(--catto-slate-50)] hover:text-[var(--catto-slate-700)]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Enhancement Panel */}
        {showAIPanel && (
          <div className="bg-white rounded-xl border border-[var(--catto-slate-100)] shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--catto-primary)]" />
                <h3 className="text-lg font-bold text-[var(--catto-slate-900)]">AI-Powered Analysis ✨</h3>
              </div>
              <button onClick={() => setShowAIPanel(false)} className="p-1.5 hover:bg-[var(--catto-slate-100)] rounded-full transition-colors cursor-pointer">
                <X className="w-4 h-4 text-[var(--catto-slate-500)]" />
              </button>
            </div>

            <div className="bg-[var(--catto-primary-light)] rounded-xl p-4 text-sm text-[var(--catto-slate-600)] space-y-2">
              <p className="font-bold text-[var(--catto-slate-800)]">How privacy is protected:</p>
              <ul className="space-y-1 text-xs">
                <li>✅ Personal info is <strong>stripped locally</strong> before anything is sent</li>
                <li>✅ AI categorization sees only masked descriptions</li>
                <li>✅ AI coaching sees only <strong>aggregated totals</strong></li>
                <li>✅ Your API key stays in browser memory only</li>
              </ul>
            </div>

            <PrivacyPreview sampleDescriptions={rawTransactions.slice(0, 5).map((t) => t.description)} />

            <div>
              <label className="block text-sm font-medium text-[var(--catto-slate-700)] mb-1.5">
                <Key className="w-3.5 h-3.5 inline mr-1" /> Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full rounded-lg border border-[var(--catto-primary-20)] px-3 py-2.5 text-sm text-[var(--catto-slate-800)] focus:ring-2 focus:ring-[var(--catto-primary)] focus:border-[var(--catto-primary)] outline-none"
              />
              <p className="text-xs text-[var(--catto-slate-400)] mt-1">
                Key is used for this session only and never saved.
              </p>
            </div>

            {aiError && (
              <div className="text-sm text-[var(--catto-red-600)] bg-[var(--catto-red-50)] rounded-xl px-4 py-2 border border-[var(--catto-red-100)]">
                {aiError}
              </div>
            )}

            <button
              onClick={handleAIEnhance}
              disabled={aiLoading}
              className="w-full catto-btn-primary justify-center py-2.5"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing with AI (PII masked)...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run AI Analysis
                </>
              )}
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <SummaryCards result={adjustedResult} previousResult={previousResult} />

        {/* Excluded Transfer Toggles */}
        {activeResult.excludedTransferGroups && activeResult.excludedTransferGroups.length > 0 && (
          <div className="bg-[var(--catto-blue-50)] border border-[var(--catto-blue-200)] rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-[var(--catto-blue-700)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Excluded Transfers
            </h4>
            <p className="text-xs text-[var(--catto-blue-500)]">
              These transactions are excluded from your income & expense totals. Uncheck to include them back.
            </p>
            {activeResult.excludedTransferGroups.map((group) => {
              const isExcluded = excludedSubcats.has(group.subcategory);
              const groupTotal = group.expenseTotal + group.incomeTotal;
              const top3 = group.transactions.slice(0, 3);
              return (
                <div key={group.subcategory} className={`rounded-lg border p-3 transition-colors ${isExcluded ? "bg-white border-[var(--catto-blue-200)]" : "bg-[var(--catto-orange-50)] border-[var(--catto-orange-200)]"}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isExcluded}
                      onChange={() => {
                        setExcludedSubcats((prev) => {
                          const next = new Set(prev);
                          if (next.has(group.subcategory)) {
                            next.delete(group.subcategory);
                          } else {
                            next.add(group.subcategory);
                          }
                          return next;
                        });
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-[var(--catto-blue-300)] text-[var(--catto-blue-500)] accent-[var(--catto-blue-500)]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[var(--catto-slate-800)]">
                          🔄 {group.subcategory}
                        </span>
                        <span className="text-sm font-bold text-[var(--catto-slate-600)] whitespace-nowrap">
                          {group.count}× · ${groupTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {!isExcluded && (
                        <span className="text-xs text-[var(--catto-orange-600)] font-medium">⚠ Included in totals</span>
                      )}
                      <div className="mt-1.5 space-y-0.5">
                        {top3.map((tx, i) => {
                          const short = tx.desc.length > 40 ? tx.desc.slice(0, 37) + "..." : tx.desc;
                          return (
                            <p key={i} className="text-xs text-[var(--catto-slate-500)] truncate">
                              └ {short} · ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} · {tx.date}
                            </p>
                          );
                        })}
                        {group.transactions.length > 3 && (
                          <p className="text-xs text-[var(--catto-slate-400)]">
                            … and {group.transactions.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        )}

        {/* Other Anomaly Notes */}
        {activeResult.anomalyNotes && activeResult.anomalyNotes.length > 0 && (
          <div className="bg-[var(--catto-blue-50)] border border-[var(--catto-blue-200)] rounded-xl p-5 space-y-2">
            <h4 className="text-sm font-bold text-[var(--catto-blue-700)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Smart Notes
            </h4>
            {activeResult.anomalyNotes.map((note, i) => (
              <p key={i} className={`text-sm ${note.startsWith("  └") ? "text-[var(--catto-blue-500)] pl-4 text-xs" : "text-[var(--catto-blue-600)]"}`}>
                {note.startsWith("  └") ? note : `• ${note}`}
              </p>
            ))}
          </div>
        )}

        {/* Insight Hub */}
        <InsightHub
          result={adjustedResult}
          previousResult={previousResult}
          monthlyResults={monthlyResults}
          activeMonth={activeMonth}
        />

        {/* Pie Chart + Bar Chart side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpenseBreakdownChart
            categoryBreakdown={activeResult.categoryBreakdown}
            onCategoryClick={(category) => setSelectedCategory(category)}
          />
          <CategoryBarChart
            categoryBreakdown={activeResult.categoryBreakdown}
            onCategoryClick={(category) => setSelectedCategory(category)}
          />
        </div>

        {/* Top Money Drains — full width */}
        {activeResult.categoryBreakdown.length > 0 && (
          <div className="bg-white rounded-xl border border-[var(--catto-slate-100)] shadow-xl p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Download className="w-5 h-5 text-[var(--catto-orange-500)]" />
              <h3 className="text-xl font-bold text-[var(--catto-slate-900)]">Top Money Drains 💸</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeResult.categoryBreakdown.slice(0, 6).map((cat) => {
                const catTxns = activeResult.transactions.filter((t) => t.category === cat.category);
                const subMap = new Map<string, { total: number; count: number }>();
                for (const t of catTxns) {
                  const sub = t.subcategory || "Other";
                  const existing = subMap.get(sub) || { total: 0, count: 0 };
                  existing.total += Math.abs(t.amount);
                  existing.count += 1;
                  subMap.set(sub, existing);
                }
                const subs = Array.from(subMap.entries())
                  .map(([name, data]) => ({ name, ...data }))
                  .sort((a, b) => b.total - a.total);
                const hasSubs = !(subs.length <= 1 && subs[0]?.name === "Other");

                return (
                  <div
                    key={cat.category}
                    className="p-4 rounded-xl border border-[var(--catto-slate-100)] hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedCategory(cat.category)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--catto-primary-light)] flex items-center justify-center text-xl shrink-0">
                        {getCategoryEmoji(cat.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[var(--catto-slate-900)]">{cat.category}</p>
                        <p className="text-xs text-[var(--catto-slate-500)]">{cat.count} transactions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-[var(--catto-orange-600)]">
                          ${cat.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-[var(--catto-slate-400)]">{cat.percentage}%</p>
                      </div>
                    </div>
                    {hasSubs && (
                      <div className="mt-3 pt-3 border-t border-[var(--catto-slate-100)] space-y-1.5">
                        {subs.slice(0, 4).map((sub) => (
                          <div key={sub.name} className="flex items-center justify-between text-xs">
                            <span className="text-[var(--catto-slate-600)] truncate flex-1">{sub.name}</span>
                            <span className="text-[var(--catto-slate-500)] ml-2 tabular-nums">
                              ${sub.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-[var(--catto-slate-400)] ml-2 w-8 text-right">
                              {cat.total > 0 ? Math.round((sub.total / cat.total) * 100) : 0}%
                            </span>
                          </div>
                        ))}
                        {subs.length > 4 && (
                          <p className="text-xs text-[var(--catto-slate-400)] italic">+{subs.length - 4} more...</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recurring Charges & Spending Spikes */}
        <Insights recurring={activeResult.recurring} spikes={activeResult.spikes} />

        {/* Category Detail (click to expand) — Sub-Dashboard */}
        {selectedCategory && (() => {
          const catTransactions = activeResult.transactions.filter((t) => t.category === selectedCategory);
          const catTotal = catTransactions.reduce((s, t) => s + Math.abs(t.amount), 0);
          const catCount = catTransactions.length;

          // Build subcategory breakdown
          const subMap = new Map<string, { total: number; count: number }>();
          for (const t of catTransactions) {
            const sub = t.subcategory || "Other";
            const existing = subMap.get(sub) || { total: 0, count: 0 };
            existing.total += Math.abs(t.amount);
            existing.count += 1;
            subMap.set(sub, existing);
          }
          const subBreakdown = Array.from(subMap.entries())
            .map(([name, data]) => ({ name, ...data, pct: catTotal > 0 ? Math.round((data.total / catTotal) * 100) : 0 }))
            .sort((a, b) => b.total - a.total);
          const hasSubcategories = !(subBreakdown.length <= 1 && subBreakdown[0]?.name === "Other");

          // Sub-dashboard palette
          const SUB_COLORS = ["#60a5fa","#f472b6","#34d399","#fbbf24","#a78bfa","#fb923c","#22d3ee","#f87171","#4ade80","#e879f9"];

          return (
            <div className="bg-white rounded-xl border border-[var(--catto-slate-100)] shadow-xl overflow-hidden">
              {/* Header bar */}
              <div className="bg-gradient-to-r from-[var(--catto-primary-light)] to-white px-4 sm:px-8 py-4 sm:py-6 border-b border-[var(--catto-slate-100)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-extrabold text-[var(--catto-slate-900)]">
                      {getCategoryEmoji(selectedCategory)} {selectedCategory}
                    </h3>
                    <p className="text-sm text-[var(--catto-slate-500)] mt-1">
                      {catCount} transactions · Total ${catTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      {catCount > 0 && <> · Avg ${(catTotal / catCount).toLocaleString(undefined, { minimumFractionDigits: 2 })} per transaction</>}
                    </p>
                  </div>
                  <button
                    onClick={() => { setSelectedCategory(null); setCatSearch(""); setCatCountryFilter("all"); setCatSubcategoryFilter("all"); }}
                    className="p-2 hover:bg-white/80 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-[var(--catto-slate-500)]" />
                  </button>
                </div>
              </div>

              {/* Subcategory breakdown: donut + cards */}
              {hasSubcategories && (
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-[var(--catto-slate-100)] bg-[var(--catto-slate-50)]/50">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Subcategory Donut */}
                    <SubcategoryDonutChart
                      subcategories={subBreakdown}
                      categoryName={selectedCategory}
                      onSubcategoryClick={(sub) => setCatSubcategoryFilter(catSubcategoryFilter === sub ? "all" : sub)}
                    />
                    {/* Subcategory Cards */}
                    <div className="lg:col-span-2">
                      <h4 className="text-sm font-bold text-[var(--catto-slate-500)] uppercase tracking-wider mb-4">Subcategories</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {subBreakdown.map((sub, idx) => (
                      <button
                        key={sub.name}
                        onClick={() => setCatSubcategoryFilter(catSubcategoryFilter === sub.name ? "all" : sub.name)}
                        className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                          catSubcategoryFilter === sub.name
                            ? "border-[var(--catto-primary)] bg-[var(--catto-primary-light)] shadow-md scale-[1.02]"
                            : "border-[var(--catto-slate-100)] bg-white hover:border-[var(--catto-slate-200)] hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SUB_COLORS[idx % SUB_COLORS.length] }} />
                          <span className="text-xs font-bold text-[var(--catto-slate-700)] truncate">{sub.name}</span>
                        </div>
                        <p className="text-lg font-extrabold text-[var(--catto-slate-900)]">
                          ${sub.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-[var(--catto-slate-400)]">{sub.count} txn</span>
                          <span className="text-xs font-bold text-[var(--catto-slate-500)]">{sub.pct}%</span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 h-1.5 rounded-full bg-[var(--catto-slate-100)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${sub.pct}%`, backgroundColor: SUB_COLORS[idx % SUB_COLORS.length] }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters & Table */}
              <div className="px-4 sm:px-8 py-4 sm:py-6">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--catto-slate-400)]" />
                    <input
                      type="text"
                      placeholder="Search description..."
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--catto-slate-200)] rounded-lg bg-white text-[var(--catto-slate-800)] placeholder:text-[var(--catto-slate-400)] focus:outline-none focus:ring-2 focus:ring-[var(--catto-primary)] focus:border-transparent"
                    />
                  </div>
                  <select
                    value={catCountryFilter}
                    onChange={(e) => setCatCountryFilter(e.target.value)}
                    className="text-sm border border-[var(--catto-slate-200)] rounded-lg px-3 py-2 bg-white text-[var(--catto-slate-700)] focus:outline-none focus:ring-2 focus:ring-[var(--catto-primary)]"
                  >
                    <option value="all">All Countries</option>
                    {Array.from(new Set(catTransactions.map((t) => t.country || "Unknown"))).sort().map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {(catSearch || catCountryFilter !== "all" || catSubcategoryFilter !== "all") && (
                    <button
                      onClick={() => { setCatSearch(""); setCatCountryFilter("all"); setCatSubcategoryFilter("all"); }}
                      className="text-xs text-[var(--catto-slate-500)] hover:text-[var(--catto-slate-800)] underline cursor-pointer"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {(() => {
                  const catFiltered = catTransactions
                    .filter((t) => {
                      if (catSearch && !t.description.toLowerCase().includes(catSearch.toLowerCase())) return false;
                      if (catCountryFilter !== "all" && (t.country || "Unknown") !== catCountryFilter) return false;
                      if (catSubcategoryFilter !== "all" && (t.subcategory || "Other") !== catSubcategoryFilter) return false;
                      return true;
                    });
                  const catSorted = catFiltered.slice().sort((a, b) => {
                    let cmp = 0;
                    switch (catSortField) {
                      case "date": cmp = a.date.localeCompare(b.date); break;
                      case "amount": cmp = Math.abs(a.amount) - Math.abs(b.amount); break;
                      case "description": cmp = a.description.localeCompare(b.description); break;
                      case "subcategory": cmp = (a.subcategory || "").localeCompare(b.subcategory || ""); break;
                      case "country": cmp = (a.country || "").localeCompare(b.country || ""); break;
                    }
                    return catSortDir === "desc" ? -cmp : cmp;
                  });
                  const CatSortIcon = ({ field }: { field: typeof catSortField }) => {
                    if (catSortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
                    return catSortDir === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
                  };
                  const toggleCatSort = (field: typeof catSortField) => {
                    if (catSortField === field) {
                      setCatSortDir((d) => d === "asc" ? "desc" : "asc");
                    } else {
                      setCatSortField(field);
                      setCatSortDir(field === "amount" ? "desc" : "asc");
                    }
                  };
                  return (
                    <>
                      <p className="text-sm text-[var(--catto-slate-400)] mb-3">
                        {catFiltered.length} of {catCount} transactions
                        {catSubcategoryFilter !== "all" && <span className="font-semibold text-[var(--catto-slate-600)]"> · {catSubcategoryFilter}</span>}
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[var(--catto-slate-100)] text-left text-[var(--catto-slate-500)]">
                              <th className="pb-3 pr-4 font-medium cursor-pointer select-none" onClick={() => toggleCatSort("date")}>
                                <span className="inline-flex items-center">Date<CatSortIcon field="date" /></span>
                              </th>
                              <th className="pb-3 pr-4 font-medium cursor-pointer select-none" onClick={() => toggleCatSort("description")}>
                                <span className="inline-flex items-center">Description<CatSortIcon field="description" /></span>
                              </th>
                              <th className="pb-3 pr-4 font-medium cursor-pointer select-none hidden sm:table-cell" onClick={() => toggleCatSort("subcategory")}>
                                <span className="inline-flex items-center">Subcategory<CatSortIcon field="subcategory" /></span>
                              </th>
                              <th className="pb-3 pr-4 font-medium cursor-pointer select-none hidden md:table-cell" onClick={() => toggleCatSort("country")}>
                                <span className="inline-flex items-center">Country<CatSortIcon field="country" /></span>
                              </th>
                              <th className="pb-3 font-medium text-right cursor-pointer select-none" onClick={() => toggleCatSort("amount")}>
                                <span className="inline-flex items-center justify-end">Amount<CatSortIcon field="amount" /></span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {catSorted.map((t, i) => (
                              <tr key={i} className="border-b border-[var(--catto-slate-50)] hover:bg-[var(--catto-primary-light)] transition-colors">
                                <td className="py-3 pr-4 text-[var(--catto-slate-600)] whitespace-nowrap">{t.date}</td>
                                <td className="py-3 pr-4 text-[var(--catto-slate-800)] font-medium max-w-[180px] sm:max-w-none truncate">{t.description}</td>
                                <td className="py-3 pr-4 whitespace-nowrap hidden sm:table-cell">
                                  {t.subcategory ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--catto-primary-light)] text-[var(--catto-slate-600)]">
                                      {t.subcategory}
                                    </span>
                                  ) : <span className="text-[var(--catto-slate-300)]">—</span>}
                                </td>
                                <td className="py-3 pr-4 text-[var(--catto-slate-500)] whitespace-nowrap text-xs hidden md:table-cell">{t.country || "—"}</td>
                                <td className={`py-3 text-right font-black whitespace-nowrap ${t.type === "income" ? "text-[var(--catto-green-600)]" : "text-[var(--catto-orange-600)]"}`}>
                                  {t.type === "income" ? "+" : "-"}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {catSorted.length === 0 && (
                          <p className="text-center text-[var(--catto-slate-400)] py-8">No transactions match your filters</p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          );
        })()}

        {/* Income vs Expenses Over Time (only when multi-month data) */}
        {hasMultipleMonths && activeMonth === "all" && (
          <IncomeExpensesChart
            monthlyData={activeResult.monthlyData}
            totalIncome={adjustedResult.totalIncome}
            incomeTransactions={activeResult.transactions.filter((t) => t.type === "income" && t.category === "Income")}
          />
        )}

        {/* AI Coaching */}
        {coaching && <AICoaching coaching={coaching} />}

        {/* All Transactions — collapsible */}
        <div className="bg-white rounded-xl border border-[var(--catto-slate-100)] shadow-xl overflow-hidden">
          <button
            onClick={() => { setTxExpanded(!txExpanded); setTxShowCount(25); }}
            className="w-full flex items-center justify-between p-4 sm:p-6 md:p-8 cursor-pointer hover:bg-[var(--catto-slate-50)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <List className="w-5 h-5 text-[var(--catto-primary)]" />
              <h3 className="text-xl font-bold text-[var(--catto-slate-900)]">All Transactions 📋</h3>
              <span className="text-sm text-[var(--catto-slate-400)] ml-2">({activeResult.transactions.length})</span>
            </div>
            {txExpanded ? <ChevronUp className="w-5 h-5 text-[var(--catto-slate-400)]" /> : <ChevronDown className="w-5 h-5 text-[var(--catto-slate-400)]" />}
          </button>

          {txExpanded && (
          <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--catto-slate-400)]" />
              <input
                type="text"
                placeholder="Search description..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--catto-slate-200)] rounded-lg bg-white text-[var(--catto-slate-800)] placeholder:text-[var(--catto-slate-400)] focus:outline-none focus:ring-2 focus:ring-[var(--catto-primary)] focus:border-transparent"
              />
            </div>
            <select
              value={txCategoryFilter}
              onChange={(e) => setTxCategoryFilter(e.target.value)}
              className="text-sm border border-[var(--catto-slate-200)] rounded-lg px-3 py-2 bg-white text-[var(--catto-slate-700)] focus:outline-none focus:ring-2 focus:ring-[var(--catto-primary)]"
            >
              <option value="all">All Categories</option>
              {Array.from(new Set(activeResult.transactions.map((t) => t.category))).sort().map((cat) => (
                <option key={cat} value={cat}>{getCategoryEmoji(cat)} {cat}</option>
              ))}
            </select>
            <select
              value={txCountryFilter}
              onChange={(e) => setTxCountryFilter(e.target.value)}
              className="text-sm border border-[var(--catto-slate-200)] rounded-lg px-3 py-2 bg-white text-[var(--catto-slate-700)] focus:outline-none focus:ring-2 focus:ring-[var(--catto-primary)]"
            >
              <option value="all">All Countries</option>
              {Array.from(new Set(activeResult.transactions.map((t) => t.country || "Unknown"))).sort().map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={txTypeFilter}
              onChange={(e) => setTxTypeFilter(e.target.value)}
              className="text-sm border border-[var(--catto-slate-200)] rounded-lg px-3 py-2 bg-white text-[var(--catto-slate-700)] focus:outline-none focus:ring-2 focus:ring-[var(--catto-primary)]"
            >
              <option value="all">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            {(txSearch || txCategoryFilter !== "all" || txCountryFilter !== "all" || txTypeFilter !== "all") && (
              <button
                onClick={() => { setTxSearch(""); setTxCategoryFilter("all"); setTxCountryFilter("all"); setTxTypeFilter("all"); }}
                className="text-xs text-[var(--catto-slate-500)] hover:text-[var(--catto-slate-800)] underline cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>

          {(() => {
            const filtered = activeResult.transactions.filter((t) => {
              if (txSearch && !t.description.toLowerCase().includes(txSearch.toLowerCase())) return false;
              if (txCategoryFilter !== "all" && t.category !== txCategoryFilter) return false;
              if (txCountryFilter !== "all" && (t.country || "Unknown") !== txCountryFilter) return false;
              if (txTypeFilter !== "all" && t.type !== txTypeFilter) return false;
              return true;
            });
            const sorted = filtered.slice().sort((a, b) => {
              let cmp = 0;
              switch (txSortField) {
                case "date": cmp = a.date.localeCompare(b.date); break;
                case "amount": cmp = Math.abs(a.amount) - Math.abs(b.amount); break;
                case "description": cmp = a.description.localeCompare(b.description); break;
                case "category": cmp = a.category.localeCompare(b.category); break;
                case "subcategory": cmp = (a.subcategory || "").localeCompare(b.subcategory || ""); break;
                case "country": cmp = (a.country || "").localeCompare(b.country || ""); break;
              }
              return txSortDir === "desc" ? -cmp : cmp;
            });
            const SortIcon = ({ field }: { field: typeof txSortField }) => {
              if (txSortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
              return txSortDir === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
            };
            const toggleSort = (field: typeof txSortField) => {
              if (txSortField === field) {
                setTxSortDir((d) => d === "asc" ? "desc" : "asc");
              } else {
                setTxSortField(field);
                setTxSortDir(field === "amount" ? "desc" : "asc");
              }
            };
            return (
              <>
                <p className="text-sm text-[var(--catto-slate-400)] mb-3">
                  {filtered.length} of {activeResult.transactions.length} transactions
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--catto-slate-100)] text-left text-[var(--catto-slate-500)]">
                        <th className="pb-3 pr-4 font-medium cursor-pointer select-none" onClick={() => toggleSort("date")}>
                          <span className="inline-flex items-center">Date<SortIcon field="date" /></span>
                        </th>
                        <th className="pb-3 pr-4 font-medium cursor-pointer select-none" onClick={() => toggleSort("description")}>
                          <span className="inline-flex items-center">Description<SortIcon field="description" /></span>
                        </th>
                        <th className="pb-3 pr-4 font-medium cursor-pointer select-none" onClick={() => toggleSort("category")}>
                          <span className="inline-flex items-center">Category<SortIcon field="category" /></span>
                        </th>
                        <th className="pb-3 pr-4 font-medium cursor-pointer select-none hidden sm:table-cell" onClick={() => toggleSort("subcategory")}>
                          <span className="inline-flex items-center">Subcategory<SortIcon field="subcategory" /></span>
                        </th>
                        <th className="pb-3 pr-4 font-medium cursor-pointer select-none hidden md:table-cell" onClick={() => toggleSort("country")}>
                          <span className="inline-flex items-center">Country<SortIcon field="country" /></span>
                        </th>
                        <th className="pb-3 font-medium text-right cursor-pointer select-none" onClick={() => toggleSort("amount")}>
                          <span className="inline-flex items-center justify-end">Amount<SortIcon field="amount" /></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.slice(0, txShowCount).map((t, i) => (
                        <tr key={i} className="border-b border-[var(--catto-slate-50)] hover:bg-[var(--catto-primary-light)] transition-colors">
                          <td className="py-3 pr-4 text-[var(--catto-slate-600)] whitespace-nowrap">{t.date}</td>
                          <td className="py-3 pr-4 text-[var(--catto-slate-800)] font-medium max-w-[180px] sm:max-w-none truncate">{t.description}</td>
                          <td className="py-3 pr-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--catto-primary-light)] text-[var(--catto-slate-700)]">
                              {getCategoryEmoji(t.category)} {t.category}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-[var(--catto-slate-500)] text-xs whitespace-nowrap hidden sm:table-cell">{t.subcategory || "—"}</td>
                          <td className="py-3 pr-4 text-[var(--catto-slate-500)] whitespace-nowrap text-xs">{t.country || "—"}</td>
                          <td className={`py-3 text-right font-black whitespace-nowrap ${t.type === "income" ? "text-[var(--catto-green-600)]" : "text-[var(--catto-orange-600)]"}`}>
                            {t.type === "income" ? "+" : "-"}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sorted.length > txShowCount && (
                    <div className="flex items-center justify-center gap-3 pt-4">
                      <button
                        onClick={() => setTxShowCount((c) => c + 50)}
                        className="text-sm font-bold text-[var(--catto-blue-600)] hover:underline cursor-pointer"
                      >
                        Show 50 more
                      </button>
                      <span className="text-[var(--catto-slate-300)]">·</span>
                      <button
                        onClick={() => setTxShowCount(sorted.length)}
                        className="text-sm font-bold text-[var(--catto-blue-600)] hover:underline cursor-pointer"
                      >
                        Show all ({sorted.length})
                      </button>
                    </div>
                  )}
                  {sorted.length === 0 && (
                    <p className="text-center text-[var(--catto-slate-400)] py-8">No transactions match your filters</p>
                  )}
                </div>
              </>
            );
          })()}
          </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--catto-primary-20)] py-6 mt-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-center gap-2 text-sm text-[var(--catto-slate-400)]">
          <ShieldCheck className="w-4 h-4" />
          All data processed locally — close this page and everything is gone 🐾
        </div>
      </footer>
    </div>
  );
}
