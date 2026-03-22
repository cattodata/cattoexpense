"use client";

import { useState } from "react";
import { Clock, Trash2, Eye, Calendar, TrendingDown, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { getCategoryEmoji } from "@/lib/category-emoji";
import type { AnalysisRecord } from "@/lib/history";
import { deleteAnalysis } from "@/lib/history";
import FocusTrapDialog from "@/components/FocusTrapDialog";

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
  const [deleteTarget, setDeleteTarget] = useState<AnalysisRecord | null>(null);

  if (history.length === 0) return null;

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteAnalysis(deleteTarget.userId, deleteTarget.id);
    setDeleteTarget(null);
    onHistoryChange();
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--catto-slate-100)] shadow-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between p-5 hover:bg-[var(--catto-primary-light)] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--catto-primary)]" aria-hidden="true" />
          <h3 className="text-lg font-bold text-[var(--catto-slate-900)]">Analysis History 📋</h3>
          <span className="catto-badge catto-badge-blue text-xs px-2 py-0.5">{history.length}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--catto-slate-400)]" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--catto-slate-400)]" aria-hidden="true" />
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
                <div className="w-10 h-10 rounded-full bg-[var(--catto-primary-light)] flex items-center justify-center text-lg shrink-0">
                  {getMonthEmoji(record.dateRange.from)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[var(--catto-slate-900)] text-sm truncate">
                      {record.dateRange.from} → {record.dateRange.to}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--catto-slate-500)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      {formatDate(record.analyzedAt)}
                    </span>
                    <span>{record.transactionCount} transactions</span>
                  </div>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                    <span className="flex items-center gap-1 text-[var(--catto-orange-600)] font-bold">
                      <TrendingDown className="w-3 h-3" aria-hidden="true" />
                      ${record.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="flex items-center gap-1 text-[var(--catto-slate-600)]">
                      {getCategoryEmoji(record.topCategory)} {record.topCategory}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onViewAnalysis(record)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-[var(--catto-blue-100)] text-[var(--catto-blue-500)] transition-colors cursor-pointer"
                    title="View analysis"
                    aria-label={`View analysis from ${record.dateRange.from}`}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(record)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-[var(--catto-red-50)] text-[var(--catto-slate-400)] hover:text-[var(--catto-red-500)] transition-colors cursor-pointer"
                    title="Delete"
                    aria-label={`Delete analysis from ${record.dateRange.from}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <FocusTrapDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} ariaLabelledBy="delete-dialog-title">
        <div className="flex items-center gap-3 text-[var(--catto-red-600)]">
          <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          <h3 id="delete-dialog-title" className="text-lg font-bold">Delete Analysis?</h3>
        </div>
        <p className="text-sm text-[var(--catto-slate-600)]">
          This will permanently delete the analysis for {deleteTarget?.dateRange.from} → {deleteTarget?.dateRange.to}. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 catto-btn-secondary justify-center py-2.5"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            className="flex-1 bg-[var(--catto-red-600)] text-white rounded-xl py-2.5 px-4 text-sm font-bold hover:bg-[var(--catto-red-700)] transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      </FocusTrapDialog>
    </div>
  );
}
