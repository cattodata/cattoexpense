"use client";

import Link from "next/link";
import { ShieldCheck, ArrowLeft, FileSpreadsheet, FileText, Globe, CheckCircle } from "lucide-react";

interface BankInfo {
  name: string;
  region: string;
  formats: string[];
  notes?: string;
}

const SUPPORTED_BANKS: { region: string; flag: string; banks: BankInfo[] }[] = [
  {
    region: "Tested & Supported — Australia",
    flag: "\uD83C\uDDE6\uD83C\uDDFA",
    banks: [
      { name: "CommBank", region: "Australia", formats: ["PDF", "CSV"], notes: "Transaction & credit card statements" },
      { name: "American Express (Amex)", region: "Australia", formats: ["PDF", "CSV"], notes: "Credit card statements" },
      { name: "HSBC", region: "Australia", formats: ["PDF", "CSV"] },
    ],
  },
];

const COMING_SOON_BANKS: { region: string; flag: string; banks: { name: string; region: string }[] }[] = [
  {
    region: "Australia",
    flag: "\uD83C\uDDE6\uD83C\uDDFA",
    banks: [
      { name: "ANZ", region: "AU" },
      { name: "Westpac", region: "AU" },
      { name: "NAB", region: "AU" },
    ],
  },
  {
    region: "International",
    flag: "\uD83C\uDF0F",
    banks: [
      { name: "Citibank", region: "Global" },
      { name: "Chase (JPMorgan)", region: "US" },
      { name: "Barclays", region: "UK" },
      { name: "UOB", region: "SG/TH" },
    ],
  },
  {
    region: "Thailand",
    flag: "\uD83C\uDDF9\uD83C\uDDED",
    banks: [
      { name: "KBank (Kasikorn)", region: "TH" },
      { name: "SCB (Siam Commercial)", region: "TH" },
      { name: "Bangkok Bank (BBL)", region: "TH" },
      { name: "Krungsri (Bank of Ayudhya)", region: "TH" },
      { name: "Krungthai (KTB)", region: "TH" },
      { name: "TTB (TMBThanachart)", region: "TH" },
    ],
  },
];

export default function SupportedPage() {
  const totalBanks = SUPPORTED_BANKS.reduce((sum, g) => sum + g.banks.length, 0);

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
          <div className="flex items-center gap-2 text-[var(--catto-blue-500)]">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-bold hidden sm:inline">Supported Banks</span>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        {/* Hero */}
        <section className="text-center mb-16">
          <div className="w-20 h-20 rounded-full bg-[var(--catto-blue-50)] flex items-center justify-center mx-auto mb-6">
            <Globe className="w-10 h-10 text-[var(--catto-blue-500)]" />
          </div>
          <h1 className="catto-heading text-3xl md:text-5xl mb-4">
            Supported <span className="text-[var(--catto-blue-500)]">Banks & Formats</span>
          </h1>
          <p className="text-lg text-[var(--catto-slate-500)] max-w-2xl mx-auto leading-relaxed">
            Currently tested with {totalBanks} banks (Australia). More coming soon — we auto-detect the format and parse it correctly.
          </p>
        </section>

        {/* File Formats */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-[var(--catto-slate-900)] mb-6 text-center">Supported Formats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: FileText,
                format: "PDF",
                desc: "Text-based bank statement PDFs. Not scanned images.",
                color: "var(--catto-red-500)",
                bg: "var(--catto-red-50)",
              },
              {
                icon: FileSpreadsheet,
                format: "CSV",
                desc: "Comma-separated files exported from online banking.",
                color: "var(--catto-green-600)",
                bg: "var(--catto-green-50)",
              },
              {
                icon: FileSpreadsheet,
                format: "TXT",
                desc: "Tab-delimited or text exports from banks.",
                color: "var(--catto-blue-500)",
                bg: "var(--catto-blue-50)",
              },
            ].map((f) => (
              <div key={f.format} className="bg-white rounded-xl border border-[var(--catto-slate-100)] p-5 text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: f.bg }}
                >
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-[var(--catto-slate-900)] mb-1">{f.format}</h3>
                <p className="text-xs text-[var(--catto-slate-500)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Banks by Region */}
        <section className="mb-16 space-y-10">
          {SUPPORTED_BANKS.map((group) => (
            <div key={group.region}>
              <h2 className="text-xl font-extrabold text-[var(--catto-slate-900)] mb-4 flex items-center gap-2">
                <span className="text-2xl">{group.flag}</span> {group.region}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.banks.map((bank) => (
                  <div
                    key={bank.name}
                    className="bg-white rounded-xl border border-[var(--catto-slate-100)] p-4 flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-[var(--catto-green-500)] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-bold text-[var(--catto-slate-900)] text-sm">{bank.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {bank.formats.map((fmt) => (
                          <span
                            key={fmt}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--catto-slate-100)] text-[var(--catto-slate-600)]"
                          >
                            {fmt}
                          </span>
                        ))}
                        {bank.notes && (
                          <span className="text-[10px] text-[var(--catto-slate-400)]">{bank.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Coming Soon */}
        <section className="mb-16 space-y-8">
          <h2 className="text-2xl font-extrabold text-[var(--catto-slate-900)] text-center">Coming Soon</h2>
          <div className="flex items-center justify-center gap-2 -mt-4 px-4 py-2 rounded-full bg-[var(--catto-orange-50)] border border-[var(--catto-orange-400)] mx-auto w-fit">
            <span className="text-xs font-semibold text-[var(--catto-orange-600)]">Parser rules implemented but not yet verified with real statements — results may be incomplete</span>
          </div>
          {COMING_SOON_BANKS.map((group) => (
            <div key={group.region}>
              <h3 className="text-lg font-bold text-[var(--catto-slate-700)] mb-3 flex items-center gap-2">
                <span className="text-xl">{group.flag}</span> {group.region}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {group.banks.map((bank) => (
                  <div
                    key={bank.name}
                    className="rounded-lg border border-dashed border-[var(--catto-slate-200)] bg-[var(--catto-slate-50)] p-3 flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-[var(--catto-slate-300)] shrink-0" />
                    <span className="text-sm text-[var(--catto-slate-500)]">{bank.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Generic CSV/XLSX */}
        <section className="mb-16">
          <div className="bg-[var(--catto-blue-50)] rounded-xl border border-[var(--catto-blue-200)] p-6 text-center">
            <h3 className="font-bold text-[var(--catto-slate-900)] mb-2">Bank not listed?</h3>
            <p className="text-sm text-[var(--catto-slate-600)] leading-relaxed max-w-lg mx-auto">
              CattoExpense can also parse <strong>any CSV or XLSX</strong> file with Date, Description, and Amount columns —
              even if your bank isn&apos;t listed above. Just export from your online banking and upload.
              PDF support requires bank-specific formatting rules.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="catto-btn-primary text-base py-3 px-8 w-full sm:w-auto justify-center">
              Back to App
            </Link>
            <Link href="/security" className="catto-btn-secondary text-base py-3 px-8 w-full sm:w-auto justify-center">
              Security & Architecture
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--catto-primary-20)] py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-center gap-2 text-sm text-[var(--catto-slate-400)]">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          All data processed locally — close the tab and everything is gone
        </div>
      </footer>
    </div>
  );
}
