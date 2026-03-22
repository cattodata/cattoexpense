"use client";

import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] font-[family-name:var(--font-jakarta)]">
      <header className="sticky top-0 z-50 border-b border-[var(--catto-primary-20)] bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 flex h-14 items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-4 h-4 text-[var(--catto-slate-500)]" />
            <div className="w-8 h-8 rounded-full bg-[var(--catto-primary)] flex items-center justify-center text-sm font-bold text-[var(--catto-slate-900)]">
              CE
            </div>
            <span className="text-lg font-extrabold tracking-tight text-[var(--catto-slate-900)]">CattoExpense</span>
          </Link>
        </div>
      </header>

      <main id="main-content" className="max-w-2xl mx-auto px-6 py-12 md:py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[var(--catto-orange-50)] flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-[var(--catto-orange-600)]" />
          </div>
          <h1 className="catto-heading text-2xl md:text-3xl">Disclaimer</h1>
        </div>

        <div className="space-y-8 text-sm text-[var(--catto-slate-600)] leading-relaxed">
          {/* 1. Personal project */}
          <section>
            <h2 className="text-base font-extrabold text-[var(--catto-slate-900)] mb-2">Personal project</h2>
            <p>
              CattoExpense is a free, open-source personal side project built for learning and experimentation.
              It is not a commercial product, not operated by a business, and is not sold, licensed, or
              supported in any professional capacity. There is no ABN or commercial entity behind this project.
            </p>
          </section>

          {/* 2. Not financial advice */}
          <section>
            <h2 className="text-base font-extrabold text-[var(--catto-slate-900)] mb-2">Not financial advice</h2>
            <div className="bg-[var(--catto-orange-50)] border border-[var(--catto-orange-200)] rounded-lg p-4 space-y-2 text-[var(--catto-orange-700)]">
              <p>
                This application does not provide financial product advice within the meaning of the
                {" "}<em>Corporations Act 2001</em> (Cth). The developer does not hold an Australian Financial
                Services Licence (AFSL) and is not authorised to provide financial advice.
              </p>
              <p>
                CattoExpense is not a financial service, financial product, or tax tool.
                Do not use it for tax filing, financial planning, investment decisions, or any
                purpose with financial consequences.
              </p>
            </div>
          </section>

          {/* 3. No warranty + liability */}
          <section>
            <h2 className="text-base font-extrabold text-[var(--catto-slate-900)] mb-2">No warranty</h2>
            <p>
              This software is provided <strong>&quot;as is&quot;</strong> without warranty of any kind, express or implied.
              The developer is not liable for any damages arising from use of this tool, including but not limited to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Loss of data or financial information</li>
              <li>Financial losses from decisions based on the app&apos;s output</li>
              <li>Inaccurate parsing, categorization, or totals</li>
              <li>Unauthorized access to data on your device</li>
            </ul>
            <p className="mt-2 font-semibold">Use entirely at your own risk.</p>
          </section>

          {/* 4. Accuracy */}
          <section>
            <h2 className="text-base font-extrabold text-[var(--catto-slate-900)] mb-2">Accuracy</h2>
            <p>
              Transaction categorization uses automated pattern matching and may produce errors.
              The parser may misread amounts, dates, or descriptions depending on your bank&apos;s
              statement format. Categorization is best-effort and not guaranteed to be correct.
            </p>
            <p className="mt-2">
              <strong>Always verify against your original bank statements.</strong> Do not assume
              the output of this tool is accurate.
            </p>
          </section>

          {/* 5. Data + AI */}
          <section>
            <h2 className="text-base font-extrabold text-[var(--catto-slate-900)] mb-2">Your data</h2>
            <p>
              All processing happens in your browser. No data is sent to any server, no accounts
              are required, and nothing is stored after you close the tab. The developer has no
              access to any data you upload.
            </p>
            <p className="mt-2">
              <strong>AI features (opt-in only):</strong> If you choose to use AI categorization or
              coaching, personally identifiable information (card numbers, account numbers, names) is
              stripped before anything leaves your browser. Only masked descriptions and aggregated
              totals are sent to the Google Gemini API using your own API key. Google&apos;s{" "}
              <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="text-[var(--catto-blue-600)] underline">
                terms of service
              </a>{" "}
              apply to that usage.
            </p>
          </section>
        </div>

        <div className="mt-10 flex gap-3">
          <Link href="/" className="catto-btn-primary text-base py-3 px-8 justify-center">
            Back to App
          </Link>
          <Link href="/security" className="catto-btn-secondary text-base py-3 px-8 justify-center">
            Security Architecture
          </Link>
        </div>
      </main>

      <footer className="border-t border-[var(--catto-primary-20)] py-6 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-center gap-4 text-xs text-[var(--catto-slate-400)]">
          <Link href="/disclaimer" className="hover:text-[var(--catto-slate-600)]">Disclaimer</Link>
          <span>·</span>
          <Link href="/security" className="hover:text-[var(--catto-slate-600)]">Security</Link>
        </div>
      </footer>
    </div>
  );
}
