import type { AnalysisResult } from "./types";
import { encrypt, decrypt, deriveAesKey, bytesToHex } from "./crypto";

export async function exportXLSX(result: AnalysisResult): Promise<void> {
  const XLSX = await import("xlsx");
  const rows = result.transactions.map((t) => ({
    Date: t.date,
    Description: t.description,
    Amount: t.amount,
    Category: t.category,
    Subcategory: t.subcategory || "",
    Country: t.country || "",
    Type: t.type,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const summaryRows = [
    { Metric: "Total Expenses", Value: result.totalExpenses },
    { Metric: "Date Range", Value: `${result.dateRange.from} to ${result.dateRange.to}` },
    ...result.categoryBreakdown.map((c) => ({
      Metric: c.category,
      Value: c.total,
    })),
  ];
  const ws2 = XLSX.utils.json_to_sheet(summaryRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");
  XLSX.writeFile(wb, `cattoexpense-${result.dateRange.from}-to-${result.dateRange.to}.xlsx`);
}

export async function exportPDF(result: AnalysisResult): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(18);
  doc.text("CattoExpense Report", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text(
    `${result.dateRange.from} to ${result.dateRange.to}`,
    pageWidth / 2,
    28,
    { align: "center" }
  );

  // Summary table
  autoTable(doc, {
    startY: 35,
    head: [["Metric", "Value"]],
    body: [
      ["Total Expenses", `$${Math.abs(result.totalExpenses).toLocaleString("en-AU", { minimumFractionDigits: 2 })}`],
      ["Transactions", `${result.transactions.length}`],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Category breakdown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterSummary = (doc as any).lastAutoTable?.finalY || 80;
  autoTable(doc, {
    startY: afterSummary + 10,
    head: [["Category", "Total", "Count", "%"]],
    body: result.categoryBreakdown.map((c) => [
      c.category,
      `$${Math.abs(c.total).toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
      `${c.count}`,
      `${c.percentage.toFixed(1)}%`,
    ]),
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Transactions (top 100)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterCats = (doc as any).lastAutoTable?.finalY || 150;
  const txnData = result.transactions.slice(0, 100);
  autoTable(doc, {
    startY: afterCats + 10,
    head: [["Date", "Description", "Amount", "Category"]],
    body: txnData.map((t) => [
      t.date,
      t.description.slice(0, 40),
      `$${t.amount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
      t.category,
    ]),
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: { 2: { halign: "right" } },
    styles: { fontSize: 7 },
  });

  // Recurring charges
  if (result.recurring.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Recurring Charges", 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [["Description", "Amount", "Occurrences", "Category"]],
      body: result.recurring.slice(0, 10).map((r) => [
        r.description.slice(0, 40),
        `$${Math.abs(r.amount).toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
        `${r.occurrences}x`,
        r.category,
      ]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: { 1: { halign: "right" } },
    });
  }

  doc.save(`cattoexpense-${result.dateRange.from}-to-${result.dateRange.to}.pdf`);
}

// ── Encrypted export/import ──

/** Export analysis as password-encrypted .catto file */
export async function exportEncrypted(result: AnalysisResult, password: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveAesKey(password, salt);

  const json = JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    result,
  });

  const encrypted = await encrypt(json, key);

  const saltHex = bytesToHex(salt);
  const blob = new Blob([saltHex + "|" + encrypted], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cattoexpense-${result.dateRange.from}-to-${result.dateRange.to}.catto`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Import a .catto encrypted file — returns the analysis result */
export async function importEncrypted(file: File, password: string): Promise<AnalysisResult> {
  const text = await file.text();
  const separatorIdx = text.indexOf("|");
  if (separatorIdx === -1) throw new Error("Invalid encrypted file format");

  const saltHex = text.slice(0, separatorIdx);
  const encrypted = text.slice(separatorIdx + 1);

  const salt = Uint8Array.from(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const key = await deriveAesKey(password, salt);

  try {
    const json = await decrypt(encrypted, key);
    const data = JSON.parse(json);
    return data.result;
  } catch {
    throw new Error("Wrong password or corrupted file");
  }
}
