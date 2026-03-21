"use client";

import { useState, useCallback, useEffect } from "react";
import { ShieldCheck, LockKeyhole, Eye, Trash2, LogOut, User as UserIcon, AlertTriangle, Globe } from "lucide-react";
import Link from "next/link";
import FileUpload from "@/components/FileUpload";
import Dashboard from "@/components/Dashboard";
import AuthScreen from "@/components/AuthScreen";
import HistoryPanel from "@/components/HistoryPanel";
import FocusTrapDialog from "@/components/FocusTrapDialog";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider, useToast } from "@/components/Toast";
import type { RawTransaction, AnalysisResult, MonthlyResult } from "@/lib/types";
import { analyzeMultiMonth } from "@/lib/analyzer";
import { getCurrentUser, logout, wipeAllData } from "@/lib/auth";
import type { User } from "@/lib/auth";
import { saveAnalysis, getUserHistory } from "@/lib/history";
import type { AnalysisRecord } from "@/lib/history";

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export default function Home() {
  return (
    <ToastProvider>
      <HomeInner />
    </ToastProvider>
  );
}

function HomeInner() {
  const { toast } = useToast();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [rawTransactions, setRawTransactions] = useState<RawTransaction[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [fileName, setFileName] = useState("statement");
  const [monthlyResults, setMonthlyResults] = useState<MonthlyResult[]>([]);
  const [aiCategories, setAiCategories] = useState<Record<number, string> | undefined>(undefined);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  // Restore session from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  // Load history on mount / user change (async)
  useEffect(() => {
    if (user) {
      getUserHistory(user.id).then(setHistory);
    } else {
      setHistory([]);
    }
  }, [user]);

  // Auto-lock on inactivity (15 min)
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
        setUser(null);
        setHistory([]);
        setResult(null);
        toast("Session locked due to inactivity", "info");
      }, INACTIVITY_TIMEOUT_MS);
    };
    const events = ["mousedown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [user, toast]);

  const refreshHistory = useCallback(async () => {
    if (user) {
      setHistory(await getUserHistory(user.id));
    }
  }, [user]);

  const handleParsed = async (transactions: RawTransaction[], uploadedFileName?: string) => {
    setRawTransactions(transactions);
    const multi = analyzeMultiMonth(transactions);
    setResult(multi.overall);
    setMonthlyResults(multi.months);
    if (uploadedFileName) setFileName(uploadedFileName);
    toast(`Analyzed ${transactions.length} transactions`, "success");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Auto-save if logged in
    if (user) {
      await saveAnalysis(user.id, uploadedFileName || "statement", multi.overall);
      await refreshHistory();
    }
  };

  const handleReset = () => {
    setResult(null);
    setRawTransactions([]);
    setMonthlyResults([]);
    setAiCategories(undefined);
  };

  const handleAuth = async (loggedInUser: User) => {
    setUser(loggedInUser);
    setShowAuth(false);
    setHistory(await getUserHistory(loggedInUser.id));
    toast(`Welcome, ${loggedInUser.displayName}!`, "success");
    if (loggedInUser.passwordWarning) {
      setTimeout(() => toast(loggedInUser.passwordWarning!, "error"), 500);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setHistory([]);
  };

  const handleWipeAll = async () => {
    await wipeAllData();
    setUser(null);
    setHistory([]);
    setResult(null);
    setShowWipeConfirm(false);
    toast("All data wiped from this browser", "success");
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      <ErrorBoundary>
        <Dashboard
          result={result}
          rawTransactions={rawTransactions}
          monthlyResults={monthlyResults}
          onResultUpdate={async (updated, newAiCategories) => {
            setResult(updated);
            if (newAiCategories) setAiCategories(newAiCategories);
            const cats = newAiCategories || aiCategories;
            const multi = analyzeMultiMonth(rawTransactions, cats);
            setMonthlyResults(multi.months);
            if (user) {
              await saveAnalysis(user.id, fileName, updated);
              await refreshHistory();
            }
          }}
          onReset={handleReset}
        />
      </ErrorBoundary>
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
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
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
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[var(--catto-slate-100)] text-[var(--catto-slate-400)] hover:text-[var(--catto-red-500)] transition-colors cursor-pointer"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowWipeConfirm(true)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[var(--catto-red-50)] text-[var(--catto-slate-400)] hover:text-[var(--catto-red-500)] transition-colors cursor-pointer"
                  title="Wipe all data"
                  aria-label="Wipe all data"
                >
                  <Trash2 className="w-4 h-4" />
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

      <main id="main-content" className="max-w-4xl mx-auto px-6">
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
        <section className="pb-10">
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
                title: "Your Browser Only 🗑️",
                desc: "Data stays in your browser only. Nothing is sent to any server. Clear anytime.",
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

        {/* Learn More Links */}
        <section className="pb-20">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/security" className="catto-btn-secondary py-3 px-6 justify-center">
              <ShieldCheck className="w-4 h-4 text-[var(--catto-green-600)]" /> How We Keep Your Data Safe
            </Link>
            <Link href="/supported" className="catto-btn-secondary py-3 px-6 justify-center">
              <Globe className="w-4 h-4 text-[var(--catto-blue-500)]" /> Supported Banks & Formats
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--catto-primary-20)] py-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--catto-slate-400)]">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            All data processed locally — close this page and everything is gone
          </div>
        </div>
      </footer>

      {/* Wipe All Data Confirmation */}
      <FocusTrapDialog open={showWipeConfirm} onClose={() => setShowWipeConfirm(false)} ariaLabelledBy="wipe-dialog-title">
        <div className="flex items-center gap-3 text-[var(--catto-red-600)]">
          <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          <h3 id="wipe-dialog-title" className="text-lg font-bold">Wipe All Data?</h3>
        </div>
        <p className="text-sm text-[var(--catto-slate-600)]">
          This will permanently delete all accounts, analysis history, and settings from this browser. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowWipeConfirm(false)}
            className="flex-1 catto-btn-secondary justify-center py-2.5"
          >
            Cancel
          </button>
          <button
            onClick={handleWipeAll}
            className="flex-1 bg-[var(--catto-red-600)] text-white rounded-xl py-2.5 px-4 text-sm font-bold hover:bg-[var(--catto-red-700)] transition-colors cursor-pointer"
          >
            Wipe Everything
          </button>
        </div>
      </FocusTrapDialog>
    </div>
  );
}
