"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import {
  getKuponDetailForValidation,
  markKuponAsUsed,
  type ValidatorState,
} from "@/app/kupon-validasi/action";

function ValidationContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";

  const [data, setData] = useState<ValidatorState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!code) {
      setError("Kode kupon tidak valid atau tidak disertakan.");
      setLoading(false);
      return;
    }

    getKuponDetailForValidation(code)
      .then((res: ValidatorState) => {
        if (res.success) {
          setData(res);
        } else {
          setError(res.message || "Kupon tidak valid.");
        }
      })
      .catch(() => {
        setError("Terjadi kesalahan koneksi.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [code]);

  const handleMarkAsUsed = () => {
    if (!data?.kuponData?.id) return;
    const kuponId = data.kuponData.id;
    startTransition(async () => {
      const res = await markKuponAsUsed(kuponId);
      if (res.success) {
        // Refresh details
        const updated = await getKuponDetailForValidation(code);
        setData(updated);
        setConfirmOpen(false);
      } else {
        alert(res.message);
      }
    });
  };

  const formatTanggal = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${day} ${month} ${year} pukul ${hours}.${minutes}.${seconds}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-sm font-semibold text-neutral-500">
          Memvalidasi Kupon...
        </p>
      </div>
    );
  }

  const kupon = data?.kuponData;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 py-4 px-6 md:px-12 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-lg">
            ♻
          </div>
          <span className="text-base font-extrabold tracking-tight text-red-600">
            SICUAN VALIDATOR
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          VERIFIKASI RESMI
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {error || !kupon ? (
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl p-8 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200 shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-neutral-900 uppercase">
                Kupon Tidak Valid
              </h2>
              <p className="text-sm text-neutral-500 mt-2">
                {error || "Kode kupon tidak dikenali atau salah."}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden max-w-lg w-full flex flex-col justify-between relative">
            {/* Success / Invalid Status Header Banner */}
            {kupon.status === "aktif" ? (
              <div className="p-6 text-center space-y-4 border-b border-neutral-100">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-emerald-600 uppercase tracking-tight">
                    KUPON ASLI & AKTIF
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Kupon ini valid dan siap untuk ditukarkan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center space-y-4 border-b border-neutral-100">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-neutral-500 flex items-center justify-center mx-auto border border-neutral-200">
                  <AlertTriangle className="w-9 h-9" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-neutral-700 uppercase tracking-tight">
                    KUPON SUDAH DIGUNAKAN
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Kupon ini valid tetapi sudah tidak berlaku lagi.
                  </p>
                </div>
              </div>
            )}

            {/* Details Box */}
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 border border-neutral-200/80 rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    NAMA REWARD
                  </span>
                  <span className="text-base font-black text-neutral-850 mt-1 block">
                    {kupon.rewardNama}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-200/60 pt-4">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      NAMA PEMILIK
                    </span>
                    <span className="text-sm font-semibold text-neutral-750 mt-1 block">
                      {kupon.pemilikNama}
                    </span>
                  </div>
                  <div>
                    {kupon.status === "aktif" ? (
                      <>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                          BIAYA POIN
                        </span>
                        <span className="text-sm font-mono font-bold text-neutral-700 mt-1 block">
                          💰 {kupon.biayaPoin} Poin
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                          STATUS
                        </span>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-200 text-neutral-700 border border-neutral-300 uppercase tracking-wider">
                          DIGUNAKAN
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-200/60 pt-4">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      KODE UNIK
                    </span>
                    <span className="text-xs font-mono font-bold text-neutral-700 mt-1 block">
                      {kupon.kodeUnik}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      TANGGAL TUKAR
                    </span>
                    <span className="text-xs font-semibold text-neutral-750 mt-1 block">
                      {new Date(kupon.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {kupon.status === "digunakan" && kupon.tanggalGunakan && (
                  <div className="border-t border-neutral-200/60 pt-4">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">
                      WAKTU PENGGUNAAN (SCAN)
                    </span>
                    <span className="text-xs font-semibold text-red-600 mt-1 block">
                      📅 {formatTanggal(kupon.tanggalGunakan)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {kupon.status === "aktif" && (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-0"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Tandai Telah Digunakan (Merchant)
                </button>
              )}

              {kupon.status === "digunakan" && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-center">
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Kupon ini tidak dapat digunakan untuk kedua kalinya. Silakan
                    hubungi SICUAN jika terjadi kesalahan penukaran.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal overlay */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-6 shadow-2xl border border-neutral-200 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-neutral-900">
                Tandai kupon digunakan?
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Apakah Anda yakin ingin menandai kupon ini sebagai{" "}
                <span className="font-bold text-red-600">TELAH DIGUNAKAN</span>?
                Kupon yang sudah digunakan{" "}
                <span className="font-bold">
                  tidak dapat digunakan atau di-scan kembali
                </span>
                . Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2 px-4 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-semibold hover:bg-neutral-50 cursor-pointer bg-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleMarkAsUsed}
                disabled={isPending}
                className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer border-0 flex items-center justify-center gap-1.5"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Ya, Gunakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-4 text-center">
        <p className="text-[10px] text-neutral-400">
          © 2026 SICUAN. Hak Cipta Dilindungi. Sistem Validasi Kupon Cerdas
          Anorganik.
        </p>
      </footer>
    </div>
  );
}

export default function KuponValidasiPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-sm font-semibold text-neutral-500">
            Memuat validator...
          </p>
        </div>
      }
    >
      <ValidationContent />
    </Suspense>
  );
}
