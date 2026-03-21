# CattoExpense — Project Guide for Claude

## What This Is

Privacy-first expense analyzer. Users upload bank statements (PDF/CSV/XLSX) → parsed entirely in-browser → categorized → visualized with charts and insights. **No server, no backend, no database.** All data stays in the user's browser.

## Hard Rules

- **Static site only** — `output: "export"` in next.config.ts. No API routes, no server actions, no SSR. Must deploy to GitHub Pages.
- **Financial data never leaves the browser** — except opt-in AI features where data is PII-masked first (`masker.ts`).
- **Always run tests after touching parsers** — `npm run test`. The parser code is extremely sensitive to format changes. Even small tweaks can break bank statement parsing.
- **Always run build before finishing** — `npm run build` must pass.
- **No unnecessary dependencies** — keep the bundle small. Prefer browser APIs over npm packages.

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16 (static export) |
| UI | React 19, Tailwind CSS 4 |
| Charts | Recharts |
| PDF parsing | pdfjs-dist |
| CSV parsing | PapaParse |
| Export | jsPDF + jspdf-autotable, xlsx |
| Icons | lucide-react |
| Testing | Vitest + @vitest/coverage-v8 |
| Deploy | GitHub Pages via GitHub Actions |

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page (client component)
├── components/
│   ├── Dashboard.tsx       # Main dashboard with charts, filters, insights
│   ├── FileUpload.tsx      # Drag-drop file upload
│   ├── Charts.tsx          # Donut, bar, area charts
│   ├── SummaryCards.tsx    # Income/expense/net KPIs
│   ├── AICoaching.tsx      # AI spending tips
│   ├── AuthScreen.tsx      # Local auth (localStorage)
│   ├── HistoryPanel.tsx    # Past analyses
│   ├── InsightHub.tsx      # Cross-month comparisons
│   ├── Insights.tsx        # Recurring charges, spikes
│   └── PrivacyPreview.tsx  # Show PII masking demo
└── lib/
    ├── types.ts            # All TypeScript interfaces
    ├── parser.ts           # CSV/XLSX column detection & parsing
    ├── pdf-parser.ts       # PDF statement parsing (sensitive!)
    ├── bank-adapters.ts    # 15+ bank-specific quirk handlers
    ├── categorizer.ts      # 400+ regex rules for merchant categorization
    ├── category-emoji.ts   # Category → emoji mapping
    ├── country-detector.ts # Transaction → country detection (12 countries)
    ├── analyzer.ts         # Aggregation, recurring detection, spikes
    ├── ai-service.ts       # Google Gemini API (PII-masked, opt-in)
    ├── masker.ts           # PII stripping (card numbers, names, etc.)
    ├── auth.ts             # localStorage-based auth (SHA-256)
    ├── history.ts          # Save/load analysis history
    ├── export.ts           # XLSX and PDF report generation
    └── parse-warnings.ts   # Parser warning/info collection
```

## Bank Adapter System

`bank-adapters.ts` defines per-bank parsing quirks. Each adapter specifies:
- `detectPatterns` — regex to identify the bank from statement text
- `dateFormat` — DMY, MDY, YMD
- `spaceAsDecimal` — CommBank uses "5 90" for "$5.90"
- `trailingMinusIsCredit` — CommBank uses "9.62-" for credits
- `parenMeansDebit` — CommBank uses "(110.00)" for debits

**Currently supported:** CommBank, ANZ, Westpac, NAB, Amex, HSBC, UOB, Citibank, KBank, SCB, Bangkok Bank, Krungsri, KTB, TMBThanachart, and more.

**To add a new bank:** Add an entry to `BANK_ADAPTERS` array in `bank-adapters.ts`, then add test cases in `pdf-parser.test.ts`.

## PDF Parser — Handle With Care

`pdf-parser.ts` is the most complex and fragile file (~1100 LOC). It has two extraction strategies:
1. **Column-position-based** — uses X/Y coordinates of PDF text items
2. **Line-based regex** — falls back to joining text into lines and regex matching

Key internals:
- `detectStatementYear()` — extracts year + closing month from header (cross-year logic)
- `resolveYear()` — assigns correct year to dateless transactions (e.g., CommBank "01 Jan")
- `normalizeDate()` — converts any date format to ISO YYYY-MM-DD
- `fixYearOrder()` — post-parse sanity check for year consistency

**Common pitfall:** CommBank statements omit the year from transaction dates. The parser infers it from the statement period header. If the header format changes, ALL dates can be wrong.

## Testing

```bash
npm run test          # Run all tests (129+ tests)
npm run test:watch    # Watch mode
```

4 test files cover: bank adapters, parse warnings, CSV parser, PDF parser (date resolution, cross-year, amount parsing, noise filtering).

## AI Features

- **AI Categorization** — sends PII-masked descriptions to Gemini in batches of 50
- **AI Coaching** — sends only aggregated category totals (never individual transactions)
- User provides their own Gemini API key (stored in memory only, never persisted)

## User Languages

The primary user communicates in **Thai** (ภาษาไทย). Respond in Thai when the user writes in Thai.
