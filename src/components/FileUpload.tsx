"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, FileText, AlertCircle, Loader2, Plus, Trash2, CreditCard, Lock, Eye, Clock, Key } from "lucide-react";
import { parseCSV } from "@/lib/parser";
import { parsePDF } from "@/lib/pdf-parser";
import { importEncrypted } from "@/lib/export";
import type { RawTransaction, ColumnMapping, AnalysisResult } from "@/lib/types";

interface ParsedFile {
  id: string;
  name: string;
  bank: string;
  transactions: RawTransaction[];
}

interface FileUploadProps {
  onParsed: (transactions: RawTransaction[], fileName?: string) => void;
  onImportResult?: (result: AnalysisResult, fileName: string) => void;
}

export default function FileUpload({ onParsed, onImportResult }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({ date: "", amount: "", description: "" });
  const [cattoFile, setCattoFile] = useState<File | null>(null);
  const [cattoPassword, setCattoPassword] = useState("");
  const [cattoLoading, setCattoLoading] = useState(false);
  const [cattoError, setCattoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addParsedFile = useCallback(
    (name: string, bank: string, transactions: RawTransaction[]) => {
      const tagged = transactions.map((t) => ({
        ...t,
        source: t.source && t.source !== "Unknown" ? t.source : bank,
      }));
      setParsedFiles((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name, bank, transactions: tagged },
      ]);
    },
    []
  );

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      setHeaders(null);
      setLoading(true);

      const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 25MB.`);
        setLoading(false);
        return;
      }

      const ext = file.name.toLowerCase().split(".").pop();

      if (ext === "catto") {
        setCattoFile(file);
        setCattoPassword("");
        setCattoError(null);
        setLoading(false);
        return;
      }

      if (ext !== "csv" && ext !== "txt" && ext !== "pdf") {
        setError("Unsupported file format. Please upload a CSV, PDF, or .catto file.");
        setLoading(false);
        return;
      }

      if (ext === "pdf") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          try {
            if (!arrayBuffer || arrayBuffer.byteLength === 0) {
              setError("PDF file appears to be empty.");
              setLoading(false);
              return;
            }
            const { transactions, rawLines, bankName } = await parsePDF(arrayBuffer);
            if (transactions.length === 0) {
              setError(`No transactions found in this PDF (detected: ${bankName || "Unknown"}).\n\nTips:\n• Make sure it's a text-based statement PDF, not a scanned image\n• Try downloading a fresh copy from your bank's website\n• CSV or XLSX exports usually work more reliably`);
              setLoading(false);
              return;
            }
            addParsedFile(file.name, bankName, transactions);
            setLoading(false);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            setError(`Failed to parse PDF: ${msg}. Make sure it\u2019s a text-based PDF, not a scanned image.`);
            setLoading(false);
          }
        };
        reader.onerror = () => {
          setError("Failed to read the PDF file.");
          setLoading(false);
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text || text.trim().length === 0) {
          setError("File appears to be empty.");
          setLoading(false);
          return;
        }
        const result = parseCSV(text);
        if (result.needsMapping) {
          setHeaders(result.headers);
          setFileContent(text);
          setPendingFileName(file.name);
          setLoading(false);
          return;
        }
        if (result.transactions.length === 0) {
          setError("No valid transactions found. Check your file format.");
          setLoading(false);
          return;
        }
        addParsedFile(file.name, file.name.replace(/\.[^.]+$/, ""), result.transactions);
        setLoading(false);
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
        setLoading(false);
      };
      reader.readAsText(file);
    },
    [addParsedFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) processFile(file);
    },
    [processFile]
  );

  const handleMappingSubmit = () => {
    if (!mapping.date || !mapping.amount || !mapping.description) {
      setError("Please map all three columns.");
      return;
    }
    if (!fileContent) return;
    const result = parseCSV(fileContent, mapping);
    if (result.transactions.length === 0) {
      setError("No valid transactions found with the selected columns.");
      return;
    }
    addParsedFile(pendingFileName || "file.csv", "Unknown", result.transactions);
    setHeaders(null);
    setFileContent(null);
    setPendingFileName(null);
  };

  const removeFile = (id: string) => {
    setParsedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateBankName = (id: string, bank: string) => {
    setParsedFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, bank, transactions: f.transactions.map((t) => ({ ...t, source: bank })) }
          : f
      )
    );
  };

  const handleAnalyzeAll = () => {
    const all = parsedFiles.flatMap((f) =>
      f.transactions.map((t) => ({ ...t, sourceFile: f.name }))
    );
    if (all.length === 0) return;
    const names = parsedFiles.map((f) => f.name).join(", ");
    onParsed(all, names);
  };

  const handleCattoImport = async () => {
    if (!cattoFile || !cattoPassword) return;
    setCattoLoading(true);
    setCattoError(null);
    try {
      const result = await importEncrypted(cattoFile, cattoPassword);
      onImportResult?.(result, cattoFile.name);
      setCattoFile(null);
      setCattoPassword("");
    } catch {
      setCattoError("Wrong password or corrupted file. Please try again.");
    } finally {
      setCattoLoading(false);
    }
  };

  const totalTx = parsedFiles.reduce((s, f) => s + f.transactions.length, 0);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* .catto import password prompt */}
      {cattoFile && (
        <div className="catto-card p-8 text-left">
          <h3 className="text-lg font-bold text-[var(--catto-slate-800)] mb-1 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[var(--catto-primary)]" /> Import Encrypted File
          </h3>
          <p className="text-sm text-[var(--catto-slate-500)] mb-4">
            Enter the password used to encrypt <strong>{cattoFile.name}</strong>
          </p>
          <input
            type="password"
            value={cattoPassword}
            onChange={(e) => setCattoPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCattoImport(); }}
            placeholder="Enter password"
            autoFocus
            className="w-full rounded-xl border border-[var(--catto-primary-20)] px-3 py-2.5 text-sm text-[var(--catto-slate-800)] focus:ring-2 focus:ring-[var(--catto-primary)] focus:border-[var(--catto-primary)] outline-none transition-all mb-3"
          />
          {cattoError && (
            <p className="text-sm text-[var(--catto-red-600)] mb-3 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> {cattoError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => { setCattoFile(null); setCattoPassword(""); setCattoError(null); }}
              className="catto-btn-secondary text-sm flex-1 justify-center py-2.5"
            >
              Cancel
            </button>
            <button
              onClick={handleCattoImport}
              disabled={cattoLoading || !cattoPassword}
              className="catto-btn-primary flex-1 justify-center py-2.5"
            >
              {cattoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              {cattoLoading ? "Decrypting..." : "Decrypt & Open"}
            </button>
          </div>
        </div>
      )}

      {/* Column mapping UI */}
      {headers && (
        <div className="catto-card p-8 text-left">
          <h3 className="text-lg font-bold text-[var(--catto-slate-800)] mb-2">Map Your Columns</h3>
          <p className="text-sm text-[var(--catto-slate-500)] mb-6">
            We couldn&apos;t auto-detect your columns. Please select which column is which.
          </p>
          {(["date", "amount", "description"] as const).map((field) => (
            <div key={field} className="mb-4">
              <label className="block text-sm font-medium text-[var(--catto-slate-700)] mb-1 capitalize">
                {field}
              </label>
              <select
                className="w-full rounded-xl border border-[var(--catto-primary-20)] px-3 py-2.5 text-sm text-[var(--catto-slate-800)] focus:ring-2 focus:ring-[var(--catto-primary)] focus:border-[var(--catto-primary)] outline-none transition-all"
                value={mapping[field]}
                onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
              >
                <option value="">Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          ))}
          <button
            onClick={handleMappingSubmit}
            className="w-full mt-2 catto-btn-primary justify-center py-3"
          >
            Add File
          </button>
        </div>
      )}

      {/* Parsed files list */}
      {parsedFiles.length > 0 && (
        <div className="catto-card p-6 space-y-3 text-left">
          <h3 className="text-lg font-bold text-[var(--catto-slate-800)] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[var(--catto-primary)]" />
            Uploaded Statements ({parsedFiles.length})
          </h3>
          {parsedFiles.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 bg-[var(--catto-slate-50)] rounded-xl px-4 py-3 border border-[var(--catto-slate-100)]"
            >
              <FileText className="w-4 h-4 text-[var(--catto-slate-400)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--catto-slate-700)] truncate">{f.name}</p>
                <p className="text-xs text-[var(--catto-slate-400)]">{f.transactions.length} transactions</p>
              </div>
              <input
                type="text"
                value={f.bank}
                onChange={(e) => updateBankName(f.id, e.target.value)}
                placeholder="Bank name"
                className="w-24 sm:w-32 text-xs border border-[var(--catto-primary-20)] rounded-lg px-2 py-1.5 text-[var(--catto-slate-700)] focus:ring-2 focus:ring-[var(--catto-primary)] focus:border-[var(--catto-primary)] outline-none shrink-0"
              />
              <button
                onClick={() => removeFile(f.id)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[var(--catto-red-50)] rounded-lg transition-colors cursor-pointer"
                aria-label={`Remove ${f.name}`}
              >
                <Trash2 className="w-4 h-4 text-[var(--catto-red-400)]" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="catto-btn-secondary text-sm"
            >
              <Plus className="w-4 h-4" />
              Add More
            </button>
            <button
              onClick={handleAnalyzeAll}
              className="flex-1 catto-btn-primary justify-center py-2.5"
            >
              Analyze All ({totalTx} transactions)
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.pdf,.catto"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              for (const file of files) processFile(file);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Upload drop zone */}
      {parsedFiles.length === 0 && !headers && !loading && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload bank statement files"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
          className={`catto-dropzone ${dragOver ? "dragover" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.pdf,.catto"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              for (const file of files) processFile(file);
              e.target.value = "";
            }}
          />

          <div className="flex flex-col items-center gap-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${dragOver ? "bg-[var(--catto-primary-20)]" : "bg-[var(--catto-primary-light)]"} transition-colors`}>
              <Upload className={`w-8 h-8 ${dragOver ? "text-[var(--catto-primary)]" : "text-[var(--catto-primary)]"}`} />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--catto-slate-900)]">
                Drop your bank statements here
              </h3>
              <p className="text-[var(--catto-slate-500)] mt-2">
                We accept PDF, CSV, and TXT. Max file size 25MB.
              </p>
            </div>
            <button className="catto-btn-primary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              Choose Files
            </button>
          </div>
        </div>
      )}

      {/* Security badges */}
      {parsedFiles.length === 0 && !headers && !loading && (
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-[var(--catto-slate-400)]">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> 100% Local Processing
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> No data sent to servers
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Stays in your browser
          </span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="catto-dropzone border-[var(--catto-primary)] bg-[var(--catto-primary-light)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-[var(--catto-primary)] animate-spin" />
            <div>
              <p className="text-lg font-bold text-[var(--catto-slate-900)]">Parsing statement...</p>
              <p className="text-sm text-[var(--catto-slate-500)] mt-1">
                Processing locally — nothing leaves your browser
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-[var(--catto-red-600)] bg-[var(--catto-red-50)] rounded-xl px-4 py-3 text-sm border border-red-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error.split("\n")[0]}</span>
          </div>
          {error.includes("\n") && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-[var(--catto-slate-500)] hover:text-[var(--catto-slate-700)]">Show debug info</summary>
              <pre className="mt-2 text-xs text-[var(--catto-slate-600)] bg-white/50 rounded-lg p-3 overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap">{error.split("\n").slice(2).join("\n")}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
