import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisResult } from "./types";

export function exportCSV(result: AnalysisResult): void {
  const rows = result.transactions.map((t) => ({
    Date: t.date,
    Description: t.description,
    Amount: t.amount,
    Category: t.category,
    Subcategory: t.subcategory || "",
    Country: t.country || "",
    Type: t.type,
  }));

  const wb = XLSX.utils.book_new();

  // Transactions sheet
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");

  // Summary sheet
  const summaryData = [
    ["Total Income", result.totalIncome],
    ["Total Expenses", result.totalExpenses],
    ["Net Flow", result.netFlow],
    ["Date Range", `${result.dateRange.from} to ${result.dateRange.to}`],
    [],
    ["Category", "Total", "Count", "Percentage"],
    ...result.categoryBreakdown.map((c) => [c.category, c.total, c.count, `${c.percentage}%`]),
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  XLSX.writeFile(wb, "expense-analysis.xlsx");
}

export function exportPDF(result: AnalysisResult): void {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text("Expense Analysis Report", 14, 22);

  // Date range
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Period: ${result.dateRange.from} to ${result.dateRange.to}`, 14, 30);

  // Summary
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text("Summary", 14, 42);

  autoTable(doc, {
    startY: 46,
    head: [["Metric", "Value"]],
    body: [
      ["Total Income", `$${result.totalIncome.toLocaleString()}`],
      ["Total Expenses", `$${result.totalExpenses.toLocaleString()}`],
      ["Net Flow", `$${result.netFlow.toLocaleString()}`],
      ["Transactions", `${result.transactions.length}`],
    ],
    theme: "striped",
    headStyles: { fillColor: [99, 102, 241] },
  });

  // Category breakdown
  const afterSummary = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 90;
  doc.setFontSize(14);
  doc.text("Category Breakdown", 14, afterSummary + 12);

  autoTable(doc, {
    startY: afterSummary + 16,
    head: [["Category", "Total", "Count", "%"]],
    body: result.categoryBreakdown.map((c) => [
      c.category,
      `$${c.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      c.count.toString(),
      `${c.percentage}%`,
    ]),
    theme: "striped",
    headStyles: { fillColor: [99, 102, 241] },
  });

  // Recurring
  // Transaction details table
  const afterCat = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 150;
  if (afterCat > 240) doc.addPage();
  const txY = afterCat > 240 ? 20 : afterCat + 12;
  doc.setFontSize(14);
  doc.text("All Transactions", 14, txY);

  autoTable(doc, {
    startY: txY + 4,
    head: [["Date", "Description", "Category", "Subcategory", "Country", "Amount"]],
    body: result.transactions.map((t) => [
      t.date,
      t.description,
      t.category,
      t.subcategory || "",
      t.country || "",
      `${t.type === "income" ? "+" : "-"}$${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    ]),
    theme: "striped",
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 55 },
      5: { halign: "right" },
    },
  });

  // Recurring charges
  if (result.recurring.length > 0) {
    const afterTx = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 150;
    if (afterTx > 240) doc.addPage();
    const recY = afterTx > 240 ? 20 : afterTx + 12;
    doc.setFontSize(14);
    doc.text("Recurring Charges", 14, recY);

    autoTable(doc, {
      startY: recY + 4,
      head: [["Description", "Amount", "Occurrences", "Category"]],
      body: result.recurring.slice(0, 10).map((r) => [
        r.description,
        `$${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        r.occurrences.toString(),
        r.category,
      ]),
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241] },
    });
  }

  doc.save("expense-analysis.pdf");
}
