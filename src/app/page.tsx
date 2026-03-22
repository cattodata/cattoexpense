"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ShieldCheck, Globe, FileText, Cpu, HardDrive, Trash2, ArrowRight, LockKeyhole, Eye } from "lucide-react";
import Link from "next/link";
import FileUpload from "@/components/FileUpload";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider, useToast } from "@/components/Toast";

const Dashboard = dynamic(() => import("@/components/Dashboard"), { ssr: false });
import type { RawTransaction, AnalysisResult, MonthlyResult } from "@/lib/types";
import { analyzeMultiMonth, buildMonthlyResults } from "@/lib/analyzer";

// ── Auth & History disabled for security (stateless mode) ──
// To re-enable, uncomment the imports below and restore the auth/history
// blocks marked with "AUTH_DISABLED" and "HISTORY_DISABLED" in this file.
//
// import { getCurrentUser, logout, wipeAllData } from "@/lib/auth";
// import type { User } from "@/lib/auth";
// import { saveAnalysis, getUserHistory } from "@/lib/history";
// import type { AnalysisRecord } from "@/lib/history";
// import HistoryPanel from "@/components/HistoryPanel";
// import FocusTrapDialog from "@/components/FocusTrapDialog";
// const AuthScreen = dynamic(() => import("@/components/AuthScreen"), { ssr: false });

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
  const [fileName, setFileName] = useState("statement");
  const [monthlyResults, setMonthlyResults] = useState<MonthlyResult[]>([]);

  // AUTH_DISABLED: login/session state
  // const [user, setUser] = useState<User | null>(null);
  // const [showAuth, setShowAuth] = useState(false);
  // const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  // HISTORY_DISABLED: saved analysis history
  // const [history, setHistory] = useState<AnalysisRecord[]>([]);

  // AUTH_DISABLED: restore session on mount
  // useEffect(() => { setUser(getCurrentUser()); }, []);

  // HISTORY_DISABLED: load history on mount / user change
  // useEffect(() => {
  //   if (user) { getUserHistory(user.id).then(setHistory); }
  //   else { setHistory([]); }
  // }, [user]);

  // AUTH_DISABLED: auto-lock on inactivity (15 min)
  // useEffect(() => { ... }, [user, toast]);

  // HISTORY_DISABLED: refresh history helper
  // const refreshHistory = useCallback(async () => {
  //   if (user) { setHistory(await getUserHistory(user.id)); }
  // }, [user]);

  const handleParsed = async (transactions: RawTransaction[], uploadedFileName?: string) => {
    setRawTransactions(transactions);
    const multi = analyzeMultiMonth(transactions);
    setResult(multi.overall);
    setMonthlyResults(multi.months);
    if (uploadedFileName) setFileName(uploadedFileName);
    toast(`Analyzed ${transactions.length} transactions`, "success");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // HISTORY_DISABLED: auto-save if logged in
    // if (user) {
    //   await saveAnalysis(user.id, uploadedFileName || "statement", multi.overall);
    //   await refreshHistory();
    // }
  };

  const handleReset = () => {
    setResult(null);
    setRawTransactions([]);
    setMonthlyResults([]);
  };

  // AUTH_DISABLED: auth handlers
  // const handleAuth = async (loggedInUser: User) => { ... };
  // const handleLogout = () => { ... };
  // const handleWipeAll = async () => { ... };

  // HISTORY_DISABLED: view history handler
  // const handleViewHistory = (record: AnalysisRecord) => { ... };

  // AUTH_DISABLED: show auth screen
  // if (showAuth && !user) {
  //   return <AuthScreen onAuth={handleAuth} onSkip={() => setShowAuth(false)} />;
  // }

  if (result) {
    return (
      <ErrorBoundary>
        <Dashboard
          result={result}
          rawTransactions={rawTransactions}
          monthlyResults={monthlyResults}
          onResultUpdate={async (updated) => {
            setResult(updated);
            setMonthlyResults(buildMonthlyResults(updated.transactions));
            // HISTORY_DISABLED: auto-save on update
            // if (user) {
            //   await saveAnalysis(user.id, fileName, updated);
            //   await refreshHistory();
            // }
          }}
          onReset={handleReset}
        />
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] font-[family-name:var(--font-jakarta)]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--catto-primary-20)] bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--catto-primary)] flex items-center justify-center text-sm font-bold text-[var(--catto-slate-900)]">
              CE
            </div>
            <span className="text-lg font-extrabold tracking-tight text-[var(--catto-slate-900)]">CattoExpense</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--catto-green-600)]">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-bold hidden sm:inline">100% Local Processing</span>
          </div>
          {/* AUTH_DISABLED: login/logout/wipe buttons were here */}
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6">
        {/* Hero */}
        <section className="text-center py-16 md:py-24">
          <h1 className="catto-heading text-2xl sm:text-4xl md:text-6xl mb-4">
            Analyze your spending{" "}
            <span className="text-[var(--catto-primary)]">without giving up your privacy</span> 🐱
          </h1>
          <p className="text-lg text-[var(--catto-slate-500)] max-w-2xl mx-auto leading-relaxed">
            Upload your bank statement. Get instant insights. No account, no upload, no data stored — everything stays on your device. 🔒✨
          </p>
        </section>

        {/* Upload Zone */}
        <section className="pb-8">
          <FileUpload
            onParsed={handleParsed}
            onImportResult={(imported, importedFileName) => {
              setResult(imported);
              setRawTransactions(imported.transactions.map((t) => ({
                date: t.date,
                amount: t.amount,
                description: t.description,
                source: t.source,
                isRefund: t.category === "Refund" ? true : undefined,
              })));
              setMonthlyResults(buildMonthlyResults(imported.transactions));
              if (importedFileName) setFileName(importedFileName);
              toast(`Imported ${imported.transactions.length} transactions from encrypted file`, "success");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </section>

        {/* Trust Icons — 3 feature cards */}
        <section className="pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center catto-stagger">
            {[
              {
                icon: LockKeyhole,
                title: "No Upload",
                desc: "Your file is read locally using the browser's FileReader API — it never leaves your device.",
              },
              {
                icon: Eye,
                title: "No Tracking",
                desc: "No cookies, no analytics, no account needed. We don't know who you are.",
              },
              {
                icon: Trash2,
                title: "No Storage",
                desc: "Close the page and all data is gone. Nothing is saved anywhere — ever.",
              },
            ].map((f) => (
              <div key={f.title} className="catto-card flex flex-col items-center gap-4 p-6">
                <div className="w-14 h-14 rounded-full bg-[var(--catto-primary-light)] flex items-center justify-center">
                  <f.icon className="w-6 h-6 text-[var(--catto-primary-hover)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--catto-slate-900)]">{f.title}</h3>
                <p className="text-sm text-[var(--catto-slate-500)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HISTORY_DISABLED: History Panel was here */}
        {/* {user && history.length > 0 && (
          <section className="pb-8">
            <HistoryPanel history={history} onViewAnalysis={handleViewHistory} onHistoryChange={refreshHistory} />
          </section>
        )} */}

        {/* How Your Data Flows */}
        <section className="pb-10">
          <h2 className="text-center text-xl sm:text-2xl font-extrabold text-[var(--catto-slate-900)] mb-2">
            How your data flows
          </h2>
          <p className="text-center text-sm text-[var(--catto-slate-400)] mb-8">
            Everything happens inside your browser. Nothing crosses the line.
          </p>

          <div className="relative rounded-2xl border-2 border-dashed border-[var(--catto-primary)] bg-white p-5 sm:p-6">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--catto-primary-hover)] text-white text-[11px] font-bold px-3.5 py-0.5 rounded-full whitespace-nowrap">
              Your Browser — Offline
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-1">
              {[
                { icon: FileText, step: "1", title: "You pick a file", desc: "PDF / CSV / TXT — read by FileReader API" },
                { icon: Cpu, step: "2", title: "Parsed in-browser", desc: "JavaScript extracts transactions locally" },
                { icon: HardDrive, step: "3", title: "Analyzed on-device", desc: "Categories, charts, insights — zero network" },
                { icon: Trash2, step: "4", title: "Gone when you close", desc: "Close the tab and data vanishes forever" },
              ].map((s) => (
                <div key={s.step} className="relative text-center p-3 sm:p-4 rounded-xl border border-[var(--catto-slate-200)] bg-[var(--catto-primary-light)]">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white mx-auto mb-2 bg-[var(--catto-primary-hover)]">
                    {s.step}
                  </div>
                  <s.icon className="w-5 h-5 mx-auto mb-1.5 text-[var(--catto-primary-hover)]" />
                  <div className="text-xs sm:text-sm font-bold text-[var(--catto-slate-900)] mb-0.5">{s.title}</div>
                  <div className="text-[10px] sm:text-xs text-[var(--catto-slate-500)] leading-snug">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What we'll never do */}
        <section className="pb-10">
          <h3 className="text-center text-sm font-bold text-[var(--catto-slate-700)] mb-3">What we&apos;ll never do</h3>
          <div className="bg-[var(--catto-slate-50)] rounded-xl border border-[var(--catto-slate-200)] px-5 py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
              {[
                "Upload files to any server",
                "Use cookies or tracking scripts",
                "Require an account",
                "Collect analytics or telemetry",
                "Store data in any database",
                "Persist API keys to disk",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <span className="text-[var(--catto-primary-hover)] font-bold text-xs shrink-0">—</span>
                  <span className="text-xs text-[var(--catto-slate-600)]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTAs */}
        <section className="pb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/security" className="group catto-btn-secondary py-3 px-6 justify-center">
              <ShieldCheck className="w-4 h-4 text-[var(--catto-green-600)]" />
              Full security architecture
              <ArrowRight className="w-3.5 h-3.5 text-[var(--catto-slate-400)] group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/supported" className="catto-btn-secondary py-3 px-6 justify-center">
              <Globe className="w-4 h-4 text-[var(--catto-blue-500)]" /> Supported Banks & Formats
            </Link>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="pb-20">
          <p className="text-center text-xs text-[var(--catto-slate-400)] max-w-xl mx-auto leading-relaxed">
            Personal side project — not financial advice. Use at your own risk.{" "}
            <Link href="/disclaimer" className="underline hover:text-[var(--catto-slate-600)]">Disclaimer</Link>
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--catto-primary-20)] py-6">
        <div className="max-w-6xl mx-auto px-6 space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--catto-slate-400)]">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            All data processed locally — close this page and everything is gone
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-[var(--catto-slate-400)]">
            <Link href="/disclaimer" className="hover:text-[var(--catto-slate-600)]">Disclaimer</Link>
            <span>·</span>
            <Link href="/security" className="hover:text-[var(--catto-slate-600)]">Security</Link>
          </div>
        </div>
      </footer>

      {/* AUTH_DISABLED: Wipe All Data dialog was here */}
    </div>
  );
}
