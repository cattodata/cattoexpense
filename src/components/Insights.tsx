"use client";

import { Repeat, Zap } from "lucide-react";
import { CATEGORY_COLORS } from "@/lib/categorizer";
import type { RecurringItem, SpendingSpike } from "@/lib/types";

interface InsightsProps {
  recurring: RecurringItem[];
  spikes: SpendingSpike[];
}

export default function Insights({ recurring, spikes }: InsightsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Recurring Charges */}
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl border border-[var(--catto-slate-100)] shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Repeat className="w-5 h-5 text-[var(--catto-primary)]" />
          <h3 className="text-xl font-bold text-[var(--catto-slate-900)]">Recurring Charges 🔄</h3>
        </div>
        {recurring.length === 0 ? (
          <p className="text-sm text-[var(--catto-slate-400)]">No recurring charges detected. 🐱</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recurring.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[var(--catto-slate-50)] hover:bg-[var(--catto-primary-light)] transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[var(--catto-slate-900)] truncate capitalize">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[item.category] || "#94a3b8" }}
                    />
                    <span className="text-xs text-[var(--catto-slate-400)]">{item.category}</span>
                    <span className="text-xs text-[var(--catto-slate-400)]">&bull; {item.occurrences}x</span>
                  </div>
                </div>
                <p className="text-sm font-black text-[var(--catto-orange-600)] ml-3">
                  ${item.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spending Spikes */}
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl border border-[var(--catto-slate-100)] shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-[var(--catto-orange-400)]" />
          <h3 className="text-xl font-bold text-[var(--catto-slate-900)]">Spending Spikes ⚡</h3>
        </div>
        {spikes.length === 0 ? (
          <p className="text-sm text-[var(--catto-slate-400)]">No unusual spending spikes detected. 😸</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {spikes.map((spike, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[var(--catto-orange-50)] hover:bg-[var(--catto-orange-100)] transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[var(--catto-slate-900)] truncate">
                    {spike.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[spike.category] || "#94a3b8" }}
                    />
                    <span className="text-xs text-[var(--catto-slate-400)]">{spike.category}</span>
                    <span className="text-xs text-[var(--catto-slate-400)]">&bull; {spike.date}</span>
                  </div>
                </div>
                <p className="text-sm font-black text-[var(--catto-orange-600)] ml-3">
                  ${spike.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
