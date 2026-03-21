"use client";

import { useState } from "react";
import { Clock, Trash2, Eye, Calendar, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { getCategoryEmoji } from "@/lib/category-emoji";
import type { AnalysisRecord } from "@/lib/history";
import { deleteAnalysis } from "@/lib/history";

interface HistoryPanelProps {
  history: AnalysisRecord[];
  onViewAnalysis: (record: AnalysisRecord) => void;
  onHistoryChange: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getMonthEmoji(month: string): string {
  const m = parseInt(month.split("-")[1]);
  const emojis = ["❄️", "💝", "🌸", "🌷", "🌻", "☀️", "🏖️", "🌅", "🍂", "🎃", "🍁", "🎄"];
  return emojis[(m - 1) % 12] || "📅";
}

export default function HistoryPanel({ history, onViewAnalysis, onHistoryChange }: HistoryPanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (history.length === 0) return null;

  const handleDelete = async (record: AnalysisRecord) => {
    if (confirm("Delete this analysis? This cannot be undone.")) {
      await deleteAnalysis(record.userId, record.id);
      onHistoryChange();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--catto-slate-100)] shadow-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-[var(--catto-primary-light)] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--catto-primary)]" />
          <h3 className="text-lg font-bold text-[var(--catto-slate-900)]">Analysis History 📋</h3>
          <span className="catto-badge catto-badge-blue text-xs px-2 py-0.5">{history.length}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--catto-slate-400)]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--catto-slate-400)]" />
        )}
      </button>

      {/* History List */}
      {expanded && (
        <div className="border-t border-[var(--catto-slate-100)] divide-y divide-[var(--catto-slate-50)]">
          {history.map((record) => (
            <div
              key={record.id}
              className="p-4 hover:bg-[var(--catto-primary-light)] transition-colors group"
            >
              <div className="flex items-start gap-3">
                {/* Month Emoji */}
                <div className="w-10 h-10 rounded-full bg-[var(--catto-primary-light)] flex items-center justify-center text-lg shrink-0">
                  {getMonthEmoji(record.dateRange.from)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[var(--catto-slate-900)] text-sm truncate">
                      {record.dateRange.from} → {record.dateRange.to}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--catto-slate-500)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(record.analyzedAt)}
                    </span>
                    <span>{record.transactionCount} transactions</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1 text-[var(--catto-green-600)] font-bold">
                      <TrendingUp className="w-3 h-3" />
                      ${record.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="flex items-center gap-1 text-[var(--catto-orange-600)] font-bold">
                      <TrendingDown className="w-3 h-3" />
                      ${record.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="flex items-center gap-1 text-[var(--catto-slate-600)]">
                      {getCategoryEmoji(record.topCategory)} {record.topCategory}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onViewAnalysis(record)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-[var(--catto-blue-100)] text-[var(--catto-blue-500)] transition-colors cursor-pointer"
                    title="View analysis"
                    aria-label="View analysis"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(record)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-[var(--catto-red-50)] text-[var(--catto-slate-400)] hover:text-[var(--catto-red-500)] transition-colors cursor-pointer"
                    title="Delete"
                    aria-label="Delete analysis"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
