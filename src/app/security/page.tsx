"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Server,
  HardDrive,
  ArrowLeft,
  FileText,
  Cpu,
  Trash2,
  KeyRound,
  Fingerprint,
} from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] font-[family-name:var(--font-jakarta)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--catto-primary-20)] bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-4 h-4 text-[var(--catto-slate-500)]" />
            <div className="w-8 h-8 rounded-full bg-[var(--catto-primary)] flex items-center justify-center text-sm font-bold text-[var(--catto-slate-900)]">
              CE
            </div>
            <span className="text-lg font-extrabold tracking-tight text-[var(--catto-slate-900)]">CattoExpense</span>
          </Link>
          <div className="flex items-center gap-2 text-[var(--catto-green-600)]">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-bold hidden sm:inline">Security & Architecture</span>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        {/* Hero */}
        <section className="text-center mb-8 sm:mb-16">
          <div className="w-20 h-20 rounded-full bg-[var(--catto-green-50)] flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-[var(--catto-green-600)]" />
          </div>
          <h1 className="catto-heading text-3xl md:text-5xl mb-4">
            Your data <span className="text-[var(--catto-green-600)]">never leaves</span> your browser
          </h1>
          <p className="text-lg text-[var(--catto-slate-500)] max-w-2xl mx-auto leading-relaxed">
            CattoExpense processes everything locally. No servers, no databases, no cloud storage.
            Here&apos;s exactly how it works.
          </p>
        </section>

        {/* Architecture Flow */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-[var(--catto-slate-900)] mb-8 text-center">How Your Data Flows</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                step: "1",
                icon: FileText,
                title: "You select a file",
                desc: "PDF, CSV, or XLSX — read by the browser's FileReader API. The file never touches any server.",
                color: "var(--catto-blue-500)",
                bg: "var(--catto-blue-50)",
              },
              {
                step: "2",
                icon: Cpu,
                title: "Parsed in-browser",
                desc: "Our parser extracts transactions using JavaScript running entirely in your browser tab.",
                color: "var(--catto-primary-hover)",
                bg: "var(--catto-primary-light)",
              },
              {
                step: "3",
                icon: HardDrive,
                title: "Analyzed locally",
                desc: "Categorization, charts, and insights are computed on your device. Zero network requests.",
                color: "var(--catto-green-600)",
                bg: "var(--catto-green-50)",
              },
              {
                step: "4",
                icon: Trash2,
                title: "Gone when you close",
                desc: "Close the tab and the data disappears. Optionally save encrypted history locally.",
                color: "var(--catto-orange-600)",
                bg: "var(--catto-orange-50)",
              },
            ].map((s) => (
              <div key={s.step} className="relative bg-white rounded-xl border border-[var(--catto-slate-100)] p-5 text-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white mx-auto mb-3"
                  style={{ background: s.color }}
                >
                  {s.step}
                </div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: s.bg }}
                >
                  <s.icon className="w-6 h-6" style={{ color: s.color }} />
                </div>
                <h3 className="font-bold text-[var(--catto-slate-900)] mb-1">{s.title}</h3>
                <p className="text-xs text-[var(--catto-slate-500)] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Security Features */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-[var(--catto-slate-900)] mb-8 text-center">Security Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Lock,
                title: "AES-256 Encryption",
                desc: "Saved history is encrypted with AES-GCM using a key derived from your password via PBKDF2 (100,000 iterations). Even if someone accesses your browser storage, they can't read your data without your password.",
              },
              {
                icon: EyeOff,
                title: "PII Masking for AI",
                desc: "When you opt into AI features, account numbers, card numbers, and names are stripped before anything is sent. The AI only sees masked descriptions and aggregated totals — never your raw financial data.",
              },
              {
                icon: Server,
                title: "No Server, No Database",
                desc: "CattoExpense is a static site hosted on GitHub Pages. There is no backend server, no API, no database. It's impossible for us to collect your data because we have nowhere to store it.",
              },
              {
                icon: Fingerprint,
                title: "Auto-Lock & Session Expiry",
                desc: "Your session auto-locks after 15 minutes of inactivity. Sessions expire after 30 days. The encryption key is held only in memory and cleared on logout.",
              },
              {
                icon: KeyRound,
                title: "Password-Protected Export",
                desc: "Export your analysis as an encrypted .catto file protected with a password of your choice. Uses PBKDF2 key derivation + AES-GCM encryption.",
              },
              {
                icon: Eye,
                title: "Content Security Policy",
                desc: "Strict CSP headers block unauthorized scripts, prevent clickjacking (frame-ancestors: none), and restrict connections to only the AI API endpoint you opt into.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-[var(--catto-slate-100)] p-5 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--catto-green-50)] flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-[var(--catto-green-600)]" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--catto-slate-900)] mb-1">{f.title}</h3>
                  <p className="text-sm text-[var(--catto-slate-500)] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What We DON'T Do */}
        <section className="mb-16">
          <div className="bg-[var(--catto-slate-50)] rounded-xl border border-[var(--catto-slate-200)] p-8">
            <h2 className="text-xl font-extrabold text-[var(--catto-slate-900)] mb-6 text-center">What We Don&apos;t Do</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "We don't upload your files anywhere",
                "We don't use cookies or tracking scripts",
                "We don't store your data on any server",
                "We don't require an account to use the app",
                "We don't send analytics or telemetry",
                "We don't persist your API key to storage",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="text-[var(--catto-red-500)] font-bold mt-0.5 shrink-0">&times;</span>
                  <span className="text-sm text-[var(--catto-slate-700)]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Architecture Diagram — Visual */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-[var(--catto-slate-900)] mb-3 text-center">Architecture</h2>
          <p className="text-sm text-[var(--catto-slate-400)] text-center mb-8">Everything inside the dashed border runs in your browser. Nothing crosses the line.</p>

          {/* Browser boundary */}
          <div className="relative rounded-2xl border-2 border-dashed border-[var(--catto-green-500)] bg-white p-6 md:p-8">
            {/* Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--catto-green-600)] text-white text-xs font-bold px-4 py-1 rounded-full">
              Your Browser — Offline
            </div>

            {/* Main pipeline */}
            <div className="flex flex-col items-center gap-2 mt-2">
              {/* Row 1: File → Parser → Categorizer */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-3 items-center w-full">
                <ArchNode
                  icon="📄"
                  title="Your File"
                  desc="PDF / CSV / XLSX"
                  color="var(--catto-blue-500)"
                  bg="var(--catto-blue-50)"
                />
                <ArchArrow />
                <ArchNode
                  icon="⚙️"
                  title="Parser"
                  desc="pdfjs-dist, PapaParse"
                  color="var(--catto-primary-hover)"
                  bg="var(--catto-primary-light)"
                />
                <ArchArrow />
                <ArchNode
                  icon="🏷️"
                  title="Categorizer"
                  desc="400+ regex rules"
                  color="var(--catto-orange-500)"
                  bg="var(--catto-orange-50)"
                />
              </div>

              <ArchArrowDown />

              {/* Row 2: Analyzer → Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center w-full md:w-2/3">
                <ArchNode
                  icon="📊"
                  title="Analyzer"
                  desc="Aggregation, recurring, insights"
                  color="var(--catto-green-600)"
                  bg="var(--catto-green-50)"
                />
                <ArchArrow />
                <ArchNode
                  icon="✨"
                  title="Dashboard"
                  desc="React + Recharts"
                  color="var(--catto-blue-600)"
                  bg="var(--catto-blue-50)"
                />
              </div>

              {/* Memory wipe note */}
              <div className="flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-[var(--catto-red-50)] border border-[var(--catto-red-200)]">
                <span className="text-base">🗑️</span>
                <span className="text-xs font-semibold text-[var(--catto-red-600)]">
                  File buffer zeroed from memory after parsing
                </span>
              </div>
            </div>
          </div>

          {/* Optional AI — outside the main flow */}
          <div className="mt-6 rounded-2xl border-2 border-dashed border-[var(--catto-slate-300)] bg-[var(--catto-slate-50)] p-6 md:p-8 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--catto-slate-500)] text-white text-xs font-bold px-4 py-1 rounded-full">
              Optional — Opt-in AI Only
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-3 items-center mt-2">
              <ArchNode
                icon="🛡️"
                title="PII Masker"
                desc="Strips names, card numbers, accounts"
                color="var(--catto-green-600)"
                bg="var(--catto-green-50)"
              />
              <ArchArrow />
              <ArchNode
                icon="📝"
                title="Masked Data"
                desc="Only safe descriptions & totals"
                color="var(--catto-slate-600)"
                bg="var(--catto-slate-100)"
              />
              <ArchArrow />
              <div className="relative">
                <ArchNode
                  icon="🤖"
                  title="Gemini AI"
                  desc="User's own API key (not stored)"
                  color="var(--catto-purple-500)"
                  bg="var(--catto-purple-50)"
                />
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--catto-orange-500)] flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">!</span>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-[var(--catto-slate-400)] mt-4">
              This is the <strong>only</strong> network request the app ever makes — and only when you explicitly ask for AI features.
            </p>
          </div>
        </section>

        {/* Open Source */}
        <section className="text-center mb-16">
          <p className="text-[var(--catto-slate-500)] text-sm">
            CattoExpense is open source. You can verify every claim above by reading the code yourself.
          </p>
        </section>

        {/* CTA */}
        <section className="pb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="catto-btn-primary text-base py-3 px-8 w-full sm:w-auto justify-center">
              Back to App
            </Link>
            <Link href="/supported" className="catto-btn-secondary text-base py-3 px-8 w-full sm:w-auto justify-center">
              Supported Banks
            </Link>
          </div>
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
    </div>
  );
}

/* ── Architecture diagram helper components ── */

function ArchNode({ icon, title, desc, color, bg }: {
  icon: string; title: string; desc: string; color: string; bg: string;
}) {
  return (
    <div
      className="rounded-xl border-2 p-4 text-center transition-transform hover:scale-[1.03]"
      style={{ borderColor: color, background: bg }}
    >
      <div className="text-2xl mb-1.5" aria-hidden="true">{icon}</div>
      <div className="text-sm font-bold" style={{ color }}>{title}</div>
      <div className="text-[11px] text-[var(--catto-slate-500)] mt-0.5 leading-snug">{desc}</div>
    </div>
  );
}

function ArchArrow() {
  return (
    <>
      <div className="flex md:hidden justify-center py-1" aria-hidden="true">
        <svg width="16" height="20" viewBox="0 0 16 20" fill="none" className="text-[var(--catto-slate-300)]">
          <path d="M8 0v14m0 0l-4.5-5M8 14l4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="hidden md:flex items-center justify-center" aria-hidden="true">
        <svg width="32" height="16" viewBox="0 0 32 16" fill="none" className="text-[var(--catto-slate-300)]">
          <path d="M0 8h24m0 0l-6-5.5M24 8l-6 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </>
  );
}

function ArchArrowDown() {
  return (
    <div className="flex items-center justify-center py-1" aria-hidden="true">
      <svg width="16" height="28" viewBox="0 0 16 28" fill="none" className="text-[var(--catto-slate-300)]">
        <path d="M8 0v20m0 0l-5.5-6M8 20l5.5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}
