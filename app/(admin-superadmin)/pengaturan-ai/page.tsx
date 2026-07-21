"use client";

import { Loader2, Save, ShieldAlert, Sliders } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { getAppSettings, updateAppSettings } from "@/app/lib/settings-actions";

export default function PengaturanAiPage() {
  const [disableAiWarmindo, setDisableAiWarmindo] = useState(false);
  const [disableAiBankSampah, setDisableAiBankSampah] = useState(false);
  const [disableAiKonsumen, setDisableAiKonsumen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    getAppSettings()
      .then((data) => {
        setDisableAiWarmindo(data.disableAiWarmindo);
        setDisableAiBankSampah(data.disableAiBankSampah);
        setDisableAiKonsumen(data.disableAiKonsumen);
      })
      .catch((err) => {
        console.error("Gagal memuat pengaturan:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateAppSettings(
        disableAiWarmindo,
        disableAiBankSampah,
        disableAiKonsumen,
      );
      if (res.success) {
        setFeedback({
          isOpen: true,
          type: "success",
          title: "Berhasil!",
          message: res.message,
        });
      } else {
        setFeedback({
          isOpen: true,
          type: "error",
          title: "Gagal!",
          message: res.message,
        });
      }
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
          <Sliders className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            Pengaturan Deteksi AI
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Aktifkan atau matikan fitur pemindaian timbangan otomatis berbasis
            Gemini AI untuk setiap alur setoran.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">
            Memuat pengaturan sistem...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3 text-amber-800">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold">Pemberitahuan Penting:</p>
              <p className="mt-1">
                Jika fitur pendeteksi AI dinonaktifkan pada salah satu alur di
                bawah ini, halaman setoran terkait akan langsung menggunakan
                form input manual (tanpa memerlukan pemindaian foto timbangan
                oleh AI Gemini).
              </p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-100 pb-3">
              Status Fitur AI Per Alur Setoran
            </h2>

            <div className="divide-y divide-neutral-100">
              {/* Flow 1: Konsumen */}
              <div className="py-4 flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-neutral-800">
                    Alur Setor Sampah Konsumen
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed max-w-lg">
                    Mengontrol fitur pemindaian foto timbangan otomatis saat
                    nasabah konsumen menyetorkan sampah secara mandiri.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!disableAiKonsumen}
                    onChange={(e) => setDisableAiKonsumen(!e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  <span className="ml-3 text-xs font-semibold text-neutral-700 min-w-16">
                    {!disableAiKonsumen ? "Aktif (AI)" : "Nonaktif (Manual)"}
                  </span>
                </label>
              </div>

              {/* Flow 2: Bank Sampah */}
              <div className="py-4 flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-neutral-800">
                    Alur Setor Sampah Bank Sampah
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed max-w-lg">
                    Mengontrol fitur pemindaian foto timbangan otomatis saat
                    admin Bank Sampah melakukan pencatatan setoran sampah
                    internal.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!disableAiBankSampah}
                    onChange={(e) => setDisableAiBankSampah(!e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  <span className="ml-3 text-xs font-semibold text-neutral-700 min-w-16">
                    {!disableAiBankSampah ? "Aktif (AI)" : "Nonaktif (Manual)"}
                  </span>
                </label>
              </div>

              {/* Flow 3: Terima Sampah Warmindo */}
              <div className="py-4 flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-neutral-800">
                    Alur Terima Setoran Warmindo
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed max-w-lg">
                    Mengontrol fitur pemindaian foto timbangan verifikasi
                    otomatis saat admin Bank Sampah menerima dan memverifikasi
                    setoran fisik dari kurir Warmindo.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!disableAiWarmindo}
                    onChange={(e) => setDisableAiWarmindo(!e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  <span className="ml-3 text-xs font-semibold text-neutral-700 min-w-16">
                    {!disableAiWarmindo ? "Aktif (AI)" : "Nonaktif (Manual)"}
                  </span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-sm border-0 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Pengaturan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
