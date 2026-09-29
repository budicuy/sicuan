"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Coins,
  FileText,
  Loader2,
  Package,
  Scale,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getBankSampahMonthlyDetail } from "@/app/(admin-superadmin)/laporan/setoran/action";
import type { BankSampahMonthlyDetailResult } from "@/app/types";

interface DetailTotalSetoranModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetData: {
    userId: number;
    nasabahName: string;
    year: number;
    month: number;
  } | null;
}

export function DetailTotalSetoranModal({
  isOpen,
  onClose,
  targetData,
}: DetailTotalSetoranModalProps) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<BankSampahMonthlyDetailResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !targetData) {
      setDetail(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getBankSampahMonthlyDetail({
      userId: targetData.userId,
      year: targetData.year,
      month: targetData.month,
    })
      .then((res) => {
        if (!isMounted) return;
        if (res) {
          setDetail(res);
        } else {
          setError("Gagal memuat rincian akumulasi setoran bank sampah.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error fetching bank sampah monthly detail:", err);
        setError("Terjadi kesalahan saat mengambil data akumulasi.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-start justify-between bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs shrink-0">
              <Scale className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 leading-snug">
                Detail Total Setoran Bank Sampah
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-neutral-700">
                  {detail?.nasabahName || targetData?.nasabahName}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-medium text-[11px] border border-purple-200/60">
                  <Calendar className="w-3 h-3" />
                  Periode {detail?.bulanNama ?? `Bulan ${targetData?.month}`}{" "}
                  {targetData?.year}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors border-0 cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-xs font-medium text-neutral-500">
                Menghitung akumulasi kilo dan range harga...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          ) : detail ? (
            <>
              {/* Highlight Metrik Utama */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
                  <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-medium mb-1">
                    <Package className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Total Setoran Diterima</span>
                  </div>
                  <div className="text-lg font-black text-neutral-900">
                    {detail.totalSetoranDiterima}{" "}
                    <span className="text-xs font-normal text-neutral-500">
                      Transaksi
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/70">
                  <div className="flex items-center gap-1.5 text-purple-700 text-xs font-semibold mb-1">
                    <Scale className="w-3.5 h-3.5 text-purple-600" />
                    <span>Total Semua Kategori</span>
                  </div>
                  <div className="text-lg font-black text-purple-900">
                    {detail.grandTotalBeratKg.toLocaleString("id-ID")}{" "}
                    <span className="text-xs font-medium text-purple-700">
                      kg
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-semibold mb-1">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Total Reward Bulan Ini</span>
                  </div>
                  <div className="text-lg font-black text-emerald-700">
                    Rp {detail.grandTotalKredit.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {/* Status Range Tercapai */}
              <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="text-xs font-semibold text-purple-900">
                    Range Tarif Tercapai:
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-purple-200 text-purple-800 text-xs font-bold shadow-2xs">
                  <span>{detail.globalRangeLabel}</span>
                </div>
              </div>

              {/* Info Note tentang Sistem Akumulasi Gabungan */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-blue-900 text-xs leading-relaxed flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    Ketentuan Reward Bank Sampah:
                  </span>{" "}
                  Reward dihitung secara kumulatif dari total seluruh kilogram
                  sampah (semua kategori sampah digabungkan) pada bulan ini,
                  kemudian dicocokkan ke tabel tarif range harga sampah.
                </div>
              </div>

              {/* Rincian Komposisi per Kategori Sampah */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2.5 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-neutral-400" />
                  Komposisi Berat per Kategori Sampah
                </h4>
                <div className="rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-100/80 text-neutral-600 font-semibold border-b border-neutral-200">
                      <tr>
                        <th className="px-3.5 py-2.5">
                          Kategori / Jenis Sampah
                        </th>
                        <th className="px-3.5 py-2.5 text-right">
                          Berat Disetor (kg)
                        </th>
                        <th className="px-3.5 py-2.5 text-right">Porsi (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {detail.rincianJenis.map((item) => (
                        <tr
                          key={item.jenisSampah}
                          className="hover:bg-neutral-50/60 transition-colors"
                        >
                          <td className="px-3.5 py-2.5 font-bold text-neutral-800">
                            {item.jenisSampah}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono text-neutral-700">
                            {item.totalBeratKg.toLocaleString("id-ID")} kg
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono text-neutral-600">
                            {item.persentase ?? 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-neutral-50/90 font-bold border-t border-neutral-200 text-neutral-900">
                      <tr>
                        <td className="px-3.5 py-2.5">
                          Total Akumulasi Gabungan
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-purple-700">
                          {detail.grandTotalBeratKg.toLocaleString("id-ID")} kg
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-purple-700">
                          100%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Rincian Transaksi Setoran Penyusun */}
              {detail.transaksiList.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-neutral-400" />
                    Daftar Transaksi Setoran Diterima (
                    {detail.transaksiList.length})
                  </h4>
                  <div className="rounded-xl border border-neutral-200 overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-neutral-50 text-neutral-600 font-semibold sticky top-0 border-b border-neutral-200">
                        <tr>
                          <th className="px-3 py-2">No. Setor</th>
                          <th className="px-3 py-2">Tanggal</th>
                          <th className="px-3 py-2">Jenis</th>
                          <th className="px-3 py-2 text-right">Berat</th>
                          <th className="px-3 py-2">Metode</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {detail.transaksiList.map((tx) => (
                          <tr
                            key={tx.id}
                            className="hover:bg-neutral-50/50 transition-colors"
                          >
                            <td className="px-3 py-1.5 font-mono text-neutral-700">
                              {tx.nomorSetor}
                            </td>
                            <td className="px-3 py-1.5 text-neutral-500">
                              {tx.tanggalSetor}
                            </td>
                            <td className="px-3 py-1.5 text-neutral-700">
                              {tx.jenisSampah}
                            </td>
                            <td className="px-3 py-1.5 text-right font-bold text-neutral-800">
                              {tx.beratKg.toLocaleString("id-ID")} kg
                            </td>
                            <td className="px-3 py-1.5 text-neutral-500 capitalize">
                              {tx.metodeSetor || "Langsung"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 flex justify-end bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
