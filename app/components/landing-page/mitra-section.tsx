"use client";

import { ArrowRight, CheckCircle, Gift } from "lucide-react";
import { ROLES } from "./shared-data";

interface MitraSectionProps {
  activeRoleTab: string;
  setActiveRoleTab: (id: string) => void;
}

export function MitraSection({
  activeRoleTab,
  setActiveRoleTab,
}: MitraSectionProps) {
  return (
    <section id="mitra" className="py-24 bg-primary-50/30 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold text-primary-600 uppercase tracking-widest">
            Sesuaikan dengan Profil Anda
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Pilih Cara Anda Berpartisipasi
          </h3>
          <p className="text-neutral-500">
            Setiap pihak memegang peran krusial dalam rantai ekonomi sirkular
            ini. Cari tahu apa yang bisa Anda lakukan dan dapatkan melalui
            program SICUAN.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto mb-12">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isActive = activeRoleTab === role.id;
            return (
              <button
                type="button"
                key={role.id}
                onClick={() => setActiveRoleTab(role.id)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary-600 text-white shadow-md shadow-primary-600/10"
                    : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {role.name}
              </button>
            );
          })}
        </div>

        {/* Active Tab Details */}
        <div className="max-w-5xl mx-auto">
          {ROLES.map((role) => {
            if (role.id !== activeRoleTab) return null;
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                className="bg-white rounded-3xl border border-neutral-200 shadow-xl p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-fade-in"
              >
                {/* Info block */}
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-lg text-xs font-bold border border-primary-200/50">
                    Skema Keuntungan
                  </div>
                  <h4 className="text-3xl font-extrabold text-neutral-900 flex items-center gap-3">
                    <Icon className="w-8 h-8 text-primary-600" />
                    {role.name}
                  </h4>
                  <p className="text-neutral-600 leading-relaxed">
                    {role.desc}
                  </p>

                  <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 space-y-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-primary-700 block">
                      Bentuk Reward Utama: {role.rewardType}
                    </span>
                    <p className="text-sm text-primary-950 font-medium">
                      {role.rewardDesc}
                    </p>
                  </div>

                  <a
                    href={role.actionHref || "#login"}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all duration-200 shadow-md shadow-primary-600/10"
                  >
                    {role.actionText}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>

                {/* Checklist block */}
                <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-2xl p-6 lg:p-8 space-y-6">
                  <h5 className="font-bold text-neutral-800 text-sm border-b border-neutral-200 pb-3 uppercase tracking-wider">
                    Kemudahan &amp; Fasilitas Akun:
                  </h5>
                  <ul className="space-y-4">
                    {role.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                        <span className="text-neutral-700 text-sm leading-relaxed">
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {role.id === "konsumen" && (
                    <div className="pt-2 border-t border-neutral-200 mt-4 flex items-center gap-3 text-xs text-neutral-500">
                      <Gift className="w-5 h-5 text-amber-600" />
                      <span>
                        Penukaran kupon produk mi instan, minyak goreng, &amp;
                        voucher lainnya.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
