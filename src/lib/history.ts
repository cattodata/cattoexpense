/** Analysis history storage — encrypted IndexedDB with localStorage fallback */

import type { AnalysisResult } from "./types";
import { secureGet, secureSet } from "./secure-store";

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

async function getAllRecords(): Promise<AnalysisRecord[]> {
  try {
    return (await secureGet<AnalysisRecord[]>(HISTORY_KEY)) ?? [];
  } catch (err) {
    console.warn("[CattoExpense] Failed to load history:", err);
    return [];
  }
}

async function saveAllRecords(records: AnalysisRecord[]): Promise<void> {
  await secureSet(HISTORY_KEY, records);
}

export async function saveAnalysis(userId: string, fileName: string, result: AnalysisResult): Promise<AnalysisRecord> {
  const records = await getAllRecords();

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
    records.unshift(record);
  }

  await saveAllRecords(records);
  return record;
}

export async function getUserHistory(userId: string): Promise<AnalysisRecord[]> {
  const records = await getAllRecords();
  return records
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime());
}

export async function deleteAnalysis(userId: string, recordId: string): Promise<void> {
  const records = await getAllRecords();
  const filtered = records.filter((r) => !(r.id === recordId && r.userId === userId));
  await saveAllRecords(filtered);
}
