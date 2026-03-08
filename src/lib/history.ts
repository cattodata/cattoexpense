/** Analysis history storage — localStorage-based, per user */

import type { AnalysisResult } from "./types";

export interface AnalysisRecord {
  id: string;
  userId: string;
  fileName: string;
  analyzedAt: string;
  dateRange: { from: string; to: string };
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  transactionCount: number;
  topCategory: string;
  /** Full result stored for re-viewing */
  result: AnalysisResult;
}

const HISTORY_KEY = "catto_history";

function getAllRecords(): AnalysisRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAllRecords(records: AnalysisRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
}

export function saveAnalysis(userId: string, fileName: string, result: AnalysisResult): AnalysisRecord {
  const records = getAllRecords();

  // Check if same period already analyzed by this user — update instead of duplicate
  const existingIndex = records.findIndex(
    (r) => r.userId === userId && r.dateRange.from === result.dateRange.from && r.dateRange.to === result.dateRange.to
  );

  const record: AnalysisRecord = {
    id: existingIndex >= 0 ? records[existingIndex].id : crypto.randomUUID(),
    userId,
    fileName,
    analyzedAt: new Date().toISOString(),
    dateRange: result.dateRange,
    totalIncome: result.totalIncome,
    totalExpenses: result.totalExpenses,
    netFlow: result.netFlow,
    transactionCount: result.transactions.length,
    topCategory: result.topCategory,
    result,
  };

  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.unshift(record); // newest first
  }

  saveAllRecords(records);
  return record;
}

export function getUserHistory(userId: string): AnalysisRecord[] {
  return getAllRecords()
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime());
}

export function deleteAnalysis(userId: string, recordId: string) {
  const records = getAllRecords().filter((r) => !(r.id === recordId && r.userId === userId));
  saveAllRecords(records);
}

export function getAnalyzedMonths(userId: string): string[] {
  const records = getUserHistory(userId);
  const months = new Set<string>();
  for (const r of records) {
    // Extract months covered by each analysis
    for (const t of r.result.transactions) {
      const date = new Date(t.date);
      if (!isNaN(date.getTime())) {
        months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
      }
    }
  }
  return Array.from(months).sort().reverse();
}
