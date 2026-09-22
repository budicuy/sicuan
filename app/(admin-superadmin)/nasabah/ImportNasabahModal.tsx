"use client";

import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { ImportBatchResult } from "@/app/(admin-superadmin)/nasabah/action";
import { importNasabahBatch } from "@/app/(admin-superadmin)/nasabah/action";
import {
  downloadNasabahTemplate,
  type ParsedNasabahRow,
  parseNasabahExcelFile,
} from "@/app/lib/nasabah-excel";

interface ImportNasabahModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportNasabahModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportNasabahModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedNasabahRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportBatchResult | null>(
    null,
  );

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setParseError(null);
    setImportResult(null);
    setIsParsing(false);
    setIsImporting(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setParseError(null);
    setImportResult(null);
    setIsParsing(true);

    try {
      const rows = await parseNasabahExcelFile(file);
      setParsedRows(rows);
    } catch (err) {
      console.error("Gagal membaca file Excel:", err);
      setParseError(
        err instanceof Error
          ? err.message
          : "Gagal membaca file Excel. Pastikan format sesuai template.",
      );
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (
      !file.name.endsWith(".csv") &&
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls")
    ) {
      setParseError(
        "Hanya file CSV (.csv) atau Excel (.xlsx) yang diperbolehkan.",
      );
      return;
    }

    setSelectedFile(file);
    setParseError(null);
    setImportResult(null);
    setIsParsing(true);

    try {
      const rows = await parseNasabahExcelFile(file);
      setParsedRows(rows);
    } catch (err) {
      console.error("Gagal membaca file CSV:", err);
      setParseError(
        err instanceof Error
          ? err.message
          : "Gagal membaca file CSV. Pastikan format sesuai template.",
      );
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleProcessImport = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);

    try {
      const result = await importNasabahBatch(parsedRows);
      setImportResult(result);
      if (result.successCount > 0) {
        onSuccess();
      }
    } catch (err) {
      console.error("Gagal mengimpor nasabah:", err);
      setParseError("Terjadi kesalahan saat memproses data ke server.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-tight">
                Import Data Nasabah via CSV
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Tambahkan akun dan data profil nasabah secara massal dari file
                CSV
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Banner Unduh Template */}
          <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Belum memiliki format file?
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  Unduh template CSV resmi yang sudah dilengkapi kolom dan
                  contoh data pengisian.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadNasabahTemplate}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-300 shadow-2xs transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Template (.csv)
            </button>
          </div>

          {/* Hasil Import (Jika sudah selesai) */}
          {importResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-emerald-700 block">
                      Berhasil Diimpor
                    </span>
                    <span className="text-2xl font-black text-emerald-900">
                      {importResult.successCount}
                    </span>
                    <span className="text-xs text-emerald-600 ml-1">akun</span>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border flex items-center gap-3 ${
                    importResult.failedCount > 0
                      ? "bg-red-50 border-red-200"
                      : "bg-neutral-50 border-neutral-200 text-neutral-400"
                  }`}
                >
                  <XCircle
                    className={`w-8 h-8 shrink-0 ${
                      importResult.failedCount > 0
                        ? "text-red-600"
                        : "text-neutral-400"
                    }`}
                  />
                  <div>
                    <span
                      className={`text-xs font-semibold block ${
                        importResult.failedCount > 0
                          ? "text-red-700"
                          : "text-neutral-500"
                      }`}
                    >
                      Gagal Diimpor
                    </span>
                    <span
                      className={`text-2xl font-black ${
                        importResult.failedCount > 0
                          ? "text-red-900"
                          : "text-neutral-700"
                      }`}
                    >
                      {importResult.failedCount}
                    </span>
                    <span className="text-xs ml-1">baris</span>
                  </div>
                </div>
              </div>

              {/* Rincian Error jika ada */}
              {importResult.errors.length > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden bg-white">
                  <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span className="text-xs font-bold text-red-900">
                      Daftar Kesalahan Baris CSV:
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-neutral-100 text-xs">
                    {importResult.errors.map((err, i) => (
                      <div
                        key={`${err.rowNumber}-${i}`}
                        className="p-3 flex items-start gap-3 hover:bg-neutral-50"
                      >
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono font-bold text-[10px] shrink-0">
                          Baris {err.rowNumber}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-neutral-900">
                            {err.name} (@{err.username})
                          </p>
                          <p className="text-red-600 text-xs mt-0.5">
                            {err.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Dropzone Upload */}
              <section
                aria-label="Area unggah file CSV"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-neutral-300 hover:border-primary-500 rounded-2xl p-6 text-center transition-colors bg-neutral-50/50 hover:bg-primary-50/20"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-primary-600 mx-auto mb-3 shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-neutral-800">
                  Tarik dan lepas file CSV di sini, atau{" "}
                  <label className="text-primary-600 hover:underline cursor-pointer">
                    pilih file
                    <input
                      type="file"
                      accept=".csv, text/csv, .xlsx, .xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Format yang didukung: .csv (atau .xlsx, ukuran maks: 5 MB)
                </p>

                {selectedFile && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-700 shadow-2xs">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>{selectedFile.name}</span>
                    <span className="text-neutral-400">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </section>

              {/* Parsing State */}
              {isParsing && (
                <div className="py-6 text-center text-neutral-500 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                  Membaca dan memvalidasi file Excel...
                </div>
              )}

              {/* Error Parsing */}
              {parseError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Pratinjau Data */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Pratinjau Data ({parsedRows.length} baris terdeteksi)
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Menampilkan maks. 5 data teratas
                    </span>
                  </div>

                  <div className="border border-neutral-200 rounded-xl overflow-x-auto bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 border-b border-neutral-200 font-semibold text-neutral-600">
                        <tr>
                          <th className="py-2.5 px-3">No</th>
                          <th className="py-2.5 px-3">Nama Lengkap</th>
                          <th className="py-2.5 px-3">Username</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">NIK</th>
                          <th className="py-2.5 px-3">No. Telp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {parsedRows.slice(0, 5).map((row, idx) => (
                          <tr
                            key={`${row.username}-${idx}`}
                            className="hover:bg-neutral-50/50"
                          >
                            <td className="py-2 px-3 text-neutral-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-semibold text-neutral-800">
                              {row.name}
                            </td>
                            <td className="py-2 px-3 font-mono text-neutral-600">
                              @{row.username}
                            </td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-neutral-100 text-neutral-700 border border-neutral-200">
                                {row.role}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-neutral-600">
                              {row.status}
                            </td>
                            <td className="py-2 px-3 font-mono text-neutral-500">
                              {row.nik || "-"}
                            </td>
                            <td className="py-2 px-3 text-neutral-500">
                              {row.noTelepon || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-end gap-3">
          {importResult ? (
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Selesai & Tutup
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={isImporting}
                className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-all cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProcessImport}
                disabled={parsedRows.length === 0 || isImporting || isParsing}
                className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Memproses Impor...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Mulai Impor ({parsedRows.length} Data)
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
