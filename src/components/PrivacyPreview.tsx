"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { maskDescription } from "@/lib/masker";

interface PrivacyPreviewProps {
  sampleDescriptions: string[];
}

export default function PrivacyPreview({ sampleDescriptions }: PrivacyPreviewProps) {
  const [showRaw, setShowRaw] = useState(false);
  const samples = sampleDescriptions.slice(0, 5);

  if (samples.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-[var(--catto-slate-100)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--catto-green-500)]" />
          <span className="text-sm font-semibold text-[var(--catto-slate-700)]">AI sees only masked data</span>
        </div>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center gap-1 text-xs text-[var(--catto-slate-400)] hover:text-[var(--catto-slate-600)] transition-colors cursor-pointer min-h-[44px] px-2"
        >
          {showRaw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showRaw ? "Hide original" : "Compare with original"}
        </button>
      </div>

      <div className="space-y-2">
        {samples.map((desc, i) => (
          <div key={i} className="text-xs space-y-1">
            {showRaw && (
              <div className="flex items-start gap-2">
                <span className="shrink-0 px-1.5 py-0.5 rounded bg-[var(--catto-red-50)] text-[var(--catto-red-500)] font-semibold text-[10px]">
                  RAW
                </span>
                <span className="text-[var(--catto-slate-600)] font-mono break-all">{desc}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-[var(--catto-green-50)] text-[var(--catto-green-600)] font-semibold text-[10px]">
                AI
              </span>
              <span className="text-[var(--catto-slate-800)] font-mono break-all">
                {maskDescription(desc)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
