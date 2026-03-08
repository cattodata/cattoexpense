"use client";

import { useState, useCallback } from "react";
import { ShieldCheck, LockKeyhole, Eye, Trash2, LogOut, User as UserIcon } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import Dashboard from "@/components/Dashboard";
import AuthScreen from "@/components/AuthScreen";
import HistoryPanel from "@/components/HistoryPanel";
import type { RawTransaction, AnalysisResult, MonthlyResult } from "@/lib/types";
import { analyzeMultiMonth } from "@/lib/analyzer";
import { getCurrentUser, logout } from "@/lib/auth";
import type { User } from "@/lib/auth";
import { saveAnalysis, getUserHistory } from "@/lib/history";
import type { AnalysisRecord } from "@/lib/history";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [rawTransactions, setRawTransactions] = useState<RawTransaction[]>([]);
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [showAuth, setShowAuth] = useState(false);
  const [authChecked] = useState(true);
  const [history, setHistory] = useState<AnalysisRecord[]>(() => {
    const u = getCurrentUser();
    return u ? getUserHistory(u.id) : [];
  });
  const [fileName, setFileName] = useState("statement");
  const [monthlyResults, setMonthlyResults] = useState<MonthlyResult[]>([]);
  const [aiCategories, setAiCategories] = useState<Record<number, string> | undefined>(undefined);

  const refreshHistory = useCallback(() => {
    if (user) {
      setHistory(getUserHistory(user.id));
    }
  }, [user]);

  const handleParsed = (transactions: RawTransaction[], uploadedFileName?: string) => {
    setRawTransactions(transactions);
    const multi = analyzeMultiMonth(transactions);
    setResult(multi.overall);
    setMonthlyResults(multi.months);
    if (uploadedFileName) setFileName(uploadedFileName);

    // Auto-save if logged in
    if (user) {
      saveAnalysis(user.id, uploadedFileName || "statement", multi.overall);
      refreshHistory();
    }
  };

  const handleReset = () => {
    setResult(null);
    setRawTransactions([]);
    setMonthlyResults([]);
    setAiCategories(undefined);
  };

  const handleAuth = (loggedInUser: User) => {
    setUser(loggedInUser);
    setShowAuth(false);
    setHistory(getUserHistory(loggedInUser.id));
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setHistory([]);
  };

  const handleViewHistory = (record: AnalysisRecord) => {
    setResult(record.result);
    const restoredRaw = record.result.transactions.map((t) => ({
      date: t.date,
      amount: t.amount,
      description: t.description,
      source: t.source,
      isRefund: t.category === "Refund" ? true : undefined,
    }));
    setRawTransactions(restoredRaw);
    const multi = analyzeMultiMonth(restoredRaw);
    setMonthlyResults(multi.months);
  };

  // Don't render until we check localStorage
  if (!authChecked) return null;

  // Show auth screen
  if (showAuth && !user) {
    return (
      <AuthScreen
        onAuth={handleAuth}
        onSkip={() => setShowAuth(false)}
      />
    );
  }

  if (result) {
    return (
      <Dashboard
        result={result}
        rawTransactions={rawTransactions}
        monthlyResults={monthlyResults}
        onResultUpdate={(updated, newAiCategories) => {
          setResult(updated);
          if (newAiCategories) setAiCategories(newAiCategories);
          const cats = newAiCategories || aiCategories;
          const multi = analyzeMultiMonth(rawTransactions, cats);
          setMonthlyResults(multi.months);
          if (user) {
            saveAnalysis(user.id, fileName, updated);
            refreshHistory();
          }
        }}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] font-[family-name:var(--font-jakarta)]">
      {/* Top Bar — same as dashboard */}
      <header className="sticky top-0 z-50 border-b border-[var(--catto-primary-20)] bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--catto-primary)] flex items-center justify-center text-sm font-bold text-[var(--catto-slate-900)]">
              CE
            </div>
            <span className="text-lg font-extrabold tracking-tight text-[var(--catto-slate-900)]">CattoExpense</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[var(--catto-green-600)]">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm font-bold hidden sm:inline">100% Local Processing</span>
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--catto-slate-700)] hidden sm:inline">
                  <UserIcon className="w-3.5 h-3.5 inline mr-1" />
                  {user.displayName}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-full hover:bg-[var(--catto-slate-100)] text-[var(--catto-slate-400)] hover:text-[var(--catto-red-500)] transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="catto-btn-primary text-xs py-1.5 px-3"
              >
                <UserIcon className="w-3.5 h-3.5" /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6">
        {/* Hero — clean & simple like original */}
        <section className="text-center py-16 md:py-24">
          <h1 className="catto-heading text-4xl md:text-6xl mb-4">
            Analyze your spending{" "}
            <span className="text-[var(--catto-primary)]">without giving up your privacy</span> 🐱
          </h1>
          <p className="text-lg text-[var(--catto-slate-500)] max-w-2xl mx-auto leading-relaxed">
            Upload your bank statement. Get instant insights. No account, no upload, no data stored — everything stays on your device. 🔒✨
          </p>
        </section>

        {/* Upload Zone */}
        <section className="pb-8">
          <FileUpload onParsed={handleParsed} />
        </section>

        {/* History Panel — only show if logged in with history */}
        {user && history.length > 0 && (
          <section className="pb-8">
            <HistoryPanel
              history={history}
              onViewAnalysis={handleViewHistory}
              onHistoryChange={refreshHistory}
            />
          </section>
        )}

        {/* Features — 3 simple cards like original */}
        <section className="pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: LockKeyhole,
                title: "No Upload 🔒",
                desc: "Your file is read locally using the browser's FileReader API — it never leaves your device.",
              },
              {
                icon: Eye,
                title: "No Tracking 👀",
                desc: "No cookies, no analytics, no account needed. We don't know who you are.",
              },
              {
                icon: Trash2,
                title: "No Storage 🗑️",
                desc: "Close the page and all data is gone. Nothing is saved anywhere — ever.",
              },
            ].map((f) => (
              <div key={f.title} className="flex flex-col items-center gap-4 p-6">
                <div className="w-14 h-14 rounded-full bg-[var(--catto-primary-light)] flex items-center justify-center">
                  <f.icon className="w-6 h-6 text-[var(--catto-primary)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--catto-slate-900)]">{f.title}</h3>
                <p className="text-sm text-[var(--catto-slate-500)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--catto-primary-20)] py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-center gap-2 text-sm text-[var(--catto-slate-400)]">
          <ShieldCheck className="w-4 h-4" />
          All data processed locally — close this page and everything is gone 🐾
        </div>
      </footer>
    </div>
  );
}
