---
name: test-bank
description: Run the bank parser test suite with verbose output and optional coverage report
disable-model-invocation: true
---

# /test-bank — Bank Parser Test Suite

Run all parser-related tests to verify bank statement parsing is correct.

## What to do

1. Run `npx vitest run --reporter=verbose` from the project root
2. If user passes `--coverage`, run `npx vitest run --coverage` instead
3. Summarize the results:
   - Total tests passed/failed
   - If any failed: show the failure details and the affected bank/parser
   - If all passed: confirm with count

## Key test files

- `src/lib/pdf-parser.test.ts` — PDF parsing, date resolution, cross-year, amounts
- `src/lib/parser.test.ts` — CSV/XLSX column detection, date formats
- `src/lib/categorizer.test.ts` — Merchant → category matching
- `src/lib/analyzer.test.ts` — Aggregation, recurring detection

## Important context

The parser code is very sensitive. Small changes can break parsing for specific banks (especially CommBank which uses unusual formats like space-as-decimal and no-year dates). Always check that ALL tests pass, not just the ones related to the change.
