"use client";

import {
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Recycle,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  bankSampahTerimaSetoran,
  getSetoranWarmiendoForBankSampah,
} from "@/app/(bank-sampah)/setor-sampah/bank-sampah-setor-sampah/action";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";

interface WarmiendoSetoranItem {
  id: number;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  status: string;
  catatan?: string | null;
  createdAt: Date;
  user?: { id: number; name: string; username: string; role: string } | null;
  ekspedisi?: { id: number; namaVendor: string; noTelepon: string } | null;
}

export default function TerimaSetoranWarmiendoPage() {
  const [warmiendoSetoran, setWarmiendoSetoran] = useState<
    WarmiendoSetoranItem[]
  >([]);
  const [warmiendoFilterStatus, setWarmiendoFilterStatus] = useState("Semua");
  const [isLoadingWarmiendo, setIsLoadingWarmiendo] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({ isOpen: false, type: "success", title: "", message: "" });

  const showFeedback = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => setFeedback({ isOpen: true, type, title, message });

  const loadWarmiendoSetoran = useCallback(async () => {
    setIsLoadingWarmiendo(true);
    const res = await getSetoranWarmiendoForBankSampah({
      page: 1,
      limit: 50,
      status: warmiendoFilterStatus !== "Semua" ? warmiendoFilterStatus : "",
    });
    setWarmiendoSetoran(res.data as WarmiendoSetoranItem[]);
    setIsLoadingWarmiendo(false);
  }, [warmiendoFilterStatus]);

  useEffect(() => {
    loadWarmiendoSetoran();
  }, [loadWarmiendoSetoran]);

  const handleTerimaWarmiendo = async (id: number) => {
    setProcessingId(id);
    startTransition(async () => {
      const res = await bankSampahTerimaSetoran(id);
      setProcessingId(null);
      if (res.success) {
        showFeedback("success", "Berhasil!", res.message);
        loadWarmiendoSetoran();
      } else {
        showFeedback("error", "Gagal!", res.message);
      }
    });
  };

  const formatTanggal = (dateStr: string) =>
    new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getStatusBadge = (status: string) => {
    if (status === "diterima")
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "diverifikasi")
      return "bg-sky-100 text-sky-700 border-sky-200";
    if (status === "diserahkan")
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (status === "pending")
      return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getStatusLabel = (status: string) => {
    if (status === "pending") return "Menunggu Verifikasi";
    if (status === "diverifikasi") return "Menunggu Pickup";
    if (status === "diserahkan") return "Sedang Dikirim";
    if (status === "diterima") return "Diterima";
    if (status === "ditolak") return "Ditolak";
    return status;
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary-100">
            <Recycle className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Terima Setoran Warmiendo
            </h1>
            <p className="text-sm text-neutral-500">
              Verifikasi dan terima kiriman setoran sampah dari mitra Warmiendo
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Filter & Header */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-neutral-900">
                Daftar Setoran Warmiendo
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Konfirmasi penerimaan sampah dari mitra Warmiendo
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                "pending",
                "diverifikasi",
                "diserahkan",
                "diterima",
                "Semua",
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setWarmiendoFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    warmiendoFilterStatus === s
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300"
                  }`}
                >
                  {s === "pending"
                    ? "Pending"
                    : s === "diverifikasi"
                      ? "Diverifikasi"
                      : s === "diserahkan"
                        ? "Dikirim"
                        : s === "diterima"
                          ? "Diterima"
                          : "Semua"}
                </button>
              ))}
              <button
                type="button"
                onClick={loadWarmiendoSetoran}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 transition-all cursor-pointer"
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Info Banner */}
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex gap-3 items-start">
          <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-xs text-sky-800 space-y-1">
            <p className="font-bold">Alur Verifikasi Setoran Warmiendo:</p>
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                Pending
              </span>
              <span className="text-sky-500">
                → Diverifikasi oleh Admin &amp; Ekspedisi →
              </span>
              <span className="font-semibold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                Diverifikasi
              </span>
              <span className="text-sky-500">→ Warmiendo konfirmasi →</span>
              <span className="font-semibold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                Dikirim
              </span>
              <span className="text-sky-500">→ Terima Sampah →</span>
              <span className="font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                Diterima
              </span>
              <span className="text-sky-500">
                → Tercatat dalam rekap akumulasi bulanan
              </span>
            </div>
          </div>
        </div>

        {/* List Setoran */}
        {isLoadingWarmiendo ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-sm text-neutral-500">
              Memuat data setoran Warmiendo...
            </p>
          </div>
        ) : warmiendoSetoran.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 flex flex-col items-center justify-center gap-3">
            <Package className="w-10 h-10 text-neutral-300" />
            <p className="text-sm text-neutral-500 font-medium">
              Tidak ada setoran dengan status ini
            </p>
            <p className="text-xs text-neutral-400">
              Coba pilih filter status lain di atas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {warmiendoSetoran.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Card Header */}
                <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-neutral-900 truncate">
                        {item.nomorSetor}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {item.user?.name ?? "Warmiendo"} ·{" "}
                        {formatTanggal(item.tanggalSetor)}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border shrink-0 ${getStatusBadge(item.status)}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-4 py-3 flex-1 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Jenis Sampah</span>
                    <span className="font-semibold text-neutral-800">
                      {item.jenisSampah}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Berat</span>
                    <span className="font-bold text-primary-700">
                      {item.beratKg} kg
                    </span>
                  </div>
                  {item.ekspedisi && (
                    <div className="flex items-start justify-between text-xs gap-2">
                      <span className="text-neutral-500 shrink-0">
                        Ekspedisi
                      </span>
                      <span className="font-semibold text-neutral-800 text-right">
                        {item.ekspedisi.namaVendor}
                        <span className="text-neutral-500 font-normal block">
                          {item.ekspedisi.noTelepon}
                        </span>
                      </span>
                    </div>
                  )}
                  {item.catatan && (
                    <p className="text-[11px] text-neutral-500 bg-neutral-50 rounded-lg p-2 border border-neutral-100 italic">
                      &ldquo;{item.catatan}&rdquo;
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                {item.status === "pending" && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Menunggu verifikasi admin &amp; ekspedisi</span>
                    </div>
                  </div>
                )}

                {item.status === "diverifikasi" && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-700">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Menunggu konfirmasi penyerahan dari Warmiendo</span>
                    </div>
                  </div>
                )}

                {item.status === "diserahkan" && (
                  <div className="px-4 pb-4 space-y-2">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-700">
                      <Truck className="w-3.5 h-3.5 shrink-0" />
                      <span>Sampah dalam perjalanan ke Bank Sampah</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTerimaWarmiendo(item.id)}
                      disabled={isPending && processingId === item.id}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs border-0 cursor-pointer transition-all shadow-sm"
                    >
                      {isPending && processingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      Terima &amp; Konfirmasi Sampah Diterima
                    </button>
                  </div>
                )}

                {item.status === "diterima" && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Sampah diterima &middot; Tercatat dalam rekap akumulasi
                      bulanan
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}
