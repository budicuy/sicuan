"use client";

import { Gift, Info, Minus, Plus } from "lucide-react";
import { TRASH_TYPES } from "@/app/components/landing-page/shared-data";

interface CalculatorSectionProps {
  calcRole: string;
  setCalcRole: (role: string) => void;
  calcTrash: string;
  setCalcTrash: (trash: string) => void;
  calcWeight: number;
  setCalcWeight: (w: number | ((prev: number) => number)) => void;
  calcResult: { points: number; cash: number };
}

export function CalculatorSection({
  calcRole,
  setCalcRole,
  calcTrash,
  setCalcTrash,
  calcWeight,
  setCalcWeight,
  calcResult,
}: CalculatorSectionProps) {
  return (
    <section
      id="kalkulator"
      className="py-24 bg-white border-t border-b border-neutral-200/50 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Intro */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-widest block">
              Simulasi Penghasilan Sampah
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              Kalkulator Estimasi Reward SICUAN
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              Ingin tahu seberapa besar nilai sampah anorganik yang Anda
              kumpulkan? Gunakan simulator kalkulator instan kami. Pilih profil
              Anda, jenis limbah kemasan, dan masukkan estimasi berat.
            </p>
            <div className="bg-primary-50 rounded-2xl p-5 border border-primary-100 flex items-start gap-4">
              <Info className="w-6 h-6 text-primary-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="font-bold text-xs text-primary-950">
                  Catatan Harga Aktif
                </h5>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Estimasi dihitung menggunakan harga periode berjalan (Juni
                  2026). Nilai per kilogram dapat berfluktuasi berdasarkan
                  ketetapan harga master dari manajemen perusahaan.
                </p>
              </div>
            </div>
          </div>

          {/* Calculator Widget */}
          <div className="lg:col-span-7 bg-primary-50/50 border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-lg">
            <div className="space-y-6">
              {/* 1. Role */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                  1. Pilih Profil Pengguna
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "konsumen", name: "Konsumen" },
                    { id: "warmiendo", name: "Warmiendo" },
                    { id: "bank-sampah", name: "Bank Sampah" },
                  ].map((role) => (
                    <button
                      type="button"
                      key={role.id}
                      onClick={() => setCalcRole(role.id)}
                      className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        calcRole === role.id
                          ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/10"
                          : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      {role.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Trash Type */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                  2. Pilih Jenis Sampah Anorganik
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TRASH_TYPES.map((trash) => (
                    <button
                      type="button"
                      key={trash.id}
                      onClick={() => setCalcTrash(trash.id)}
                      className={`p-4 rounded-xl text-left transition-all border cursor-pointer flex flex-col justify-between h-28 ${
                        calcTrash === trash.id
                          ? "bg-white border-primary-500 ring-2 ring-primary-500/20 shadow-md"
                          : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="font-bold text-xs text-neutral-900">
                          {trash.name}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            calcTrash === trash.id
                              ? "bg-primary-600"
                              : "bg-transparent"
                          }`}
                        />
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-snug">
                        {trash.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Weight */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                    3. Tentukan Berat Setoran
                  </span>
                  <span className="text-xs font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-md">
                    Min. 1 Kg
                  </span>
                </div>
                <div className="flex items-center gap-4 bg-white border border-neutral-200 rounded-xl p-4">
                  <button
                    type="button"
                    onClick={() => setCalcWeight((w) => Math.max(1, w - 5))}
                    className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                    disabled={calcWeight <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 text-center">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={calcWeight}
                      onChange={(e) =>
                        setCalcWeight(
                          Math.max(1, parseInt(e.target.value, 10) || 0),
                        )
                      }
                      className="text-2xl font-extrabold text-neutral-900 bg-transparent text-center focus:outline-none w-24"
                    />
                    <span className="text-sm font-bold text-neutral-500 ml-1">
                      Kg
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCalcWeight((w) => Math.min(1000, w + 5))}
                    className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={calcWeight > 200 ? 200 : calcWeight}
                  onChange={(e) => setCalcWeight(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>

              {/* 4. Results */}
              <div className="bg-primary-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 border border-primary-950">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[10px] text-primary-300 font-bold uppercase tracking-wider block">
                    Estimasi Reward Anda
                  </span>
                  <span className="text-xs text-neutral-300 block">
                    Perhitungan untuk {calcWeight} Kg{" "}
                    {TRASH_TYPES.find((t) => t.id === calcTrash)?.name}
                  </span>
                </div>

                <div className="text-center sm:text-right">
                  {calcRole === "konsumen" ? (
                    <div className="space-y-1">
                      <span className="text-3xl font-extrabold block text-primary-400">
                        {calcResult.points.toLocaleString("id-ID")} Poin
                      </span>
                      <span className="text-xs text-neutral-300 flex items-center gap-1 justify-center sm:justify-end">
                        <Gift className="w-3.5 h-3.5 text-amber-400" />
                        {calcResult.points >= 500
                          ? "Ekuivalen Kupon Gold 🥇"
                          : calcResult.points >= 250
                            ? "Ekuivalen Kupon Silver 🥈"
                            : calcResult.points >= 100
                              ? "Ekuivalen Kupon Bronze 🥉"
                              : "Kumpulkan hingga 100 Poin untuk kupon pertama"}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-3xl font-extrabold block text-emerald-400">
                        Rp {calcResult.cash.toLocaleString("id-ID")}
                      </span>
                      <span className="text-[10px] text-primary-200 block">
                        {calcRole === "bank-sampah"
                          ? "*Termasuk Bonus 10% Penyaluran TPS"
                          : "*Saldo dapat langsung dicairkan"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
