"use client";

import { ShieldCheck } from "lucide-react";
import type { AICoachingData } from "@/lib/types";

interface AICoachingProps {
  coaching: AICoachingData;
}

const TIP_EMOJIS = ["😺", "🧶", "🍗", "🎯", "💡", "🐾", "✨", "🎀"];

export default function AICoaching({ coaching }: AICoachingProps) {
  return (
    <section className="bg-[var(--catto-primary-light)] rounded-xl p-4 sm:p-6 md:p-8 border border-[var(--catto-primary-20)]">
      <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-6">
        <span className="text-3xl">✨</span>
        <h3 className="text-xl sm:text-2xl font-bold text-[var(--catto-slate-800)]">AI Cat Coaching Suggestions</h3>
        <span className="catto-badge catto-badge-green">
          <ShieldCheck className="w-3 h-3" />
          PII-free analysis
        </span>
      </div>

      {/* Summary */}
      {coaching.summary && (
        <p className="text-sm text-[var(--catto-slate-600)] bg-white rounded-xl p-4 mb-4 leading-relaxed border border-[var(--catto-primary-20)] shadow-sm">
          {coaching.summary}
        </p>
      )}

      {/* Suggestions */}
      {coaching.suggestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coaching.suggestions.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 bg-white rounded-xl border border-[var(--catto-primary-20)] shadow-sm hover:border-[var(--catto-primary)] transition-all"
            >
              <div className="text-2xl p-2 bg-[var(--catto-primary-light)] rounded-lg shrink-0">
                {TIP_EMOJIS[i % TIP_EMOJIS.length]}
              </div>
              <div>
                <p className="font-bold text-sm text-[var(--catto-slate-900)] mb-1">
                  {tip.split(".")[0]}.
                </p>
                <p className="text-xs text-[var(--catto-slate-500)] leading-relaxed">
                  {tip.split(".").slice(1).join(".").trim()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-[var(--catto-slate-400)] mt-5 text-center">
        This is light coaching based on aggregated stats &mdash; not financial advice. AI never saw your personal details. 🐾
      </p>
    </section>
  );
}
