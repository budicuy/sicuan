"use client";

import {
  CheckCircle2,
  Coffee,
  Coins,
  Download,
  Gift,
  Layers,
  MapPin,
  Printer,
  Recycle,
  Scale,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { PETA_SAMPAH_DATA, type PetaRole } from "@/app/lib/peta-sampah-data";

interface PetaAlurSampahViewProps {
  userRole: PetaRole;
  userName?: string;
  extraContent?: React.ReactNode;
}

export function PetaAlurSampahView({
  userRole,
  userName,
  extraContent,
}: PetaAlurSampahViewProps) {
  const data = PETA_SAMPAH_DATA[userRole];
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"alur" | "gis" | "fraksi">("alur");

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case "Store":
        return Store;
      case "Truck":
        return Truck;
      case "Scale":
        return Scale;
      case "Coins":
        return Coins;
      case "Gift":
        return Gift;
      case "Layers":
        return Layers;
      case "Recycle":
        return Recycle;
      case "Sparkles":
        return Sparkles;
      case "MapPin":
        return MapPin;
      case "Coffee":
        return Coffee;
      default:
        return Recycle;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const themeColors = {
    amber: {
      badge: "bg-amber-500/20 border-amber-400/30 text-amber-300",
      accent: "text-amber-600",
      accentBg: "bg-amber-50 border-amber-200",
      btnPrimary:
        "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20",
      stepActive: "bg-amber-500 text-white ring-4 ring-amber-500/20",
      line: "from-amber-500 to-amber-600",
    },
    emerald: {
      badge: "bg-emerald-500/20 border-emerald-400/30 text-emerald-300",
      accent: "text-emerald-600",
      accentBg: "bg-emerald-50 border-emerald-200",
      btnPrimary:
        "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20",
      stepActive: "bg-emerald-500 text-white ring-4 ring-emerald-500/20",
      line: "from-emerald-500 to-emerald-600",
    },
    teal: {
      badge: "bg-teal-500/20 border-teal-400/30 text-teal-300",
      accent: "text-teal-600",
      accentBg: "bg-teal-50 border-teal-200",
      btnPrimary: "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20",
      stepActive: "bg-teal-500 text-white ring-4 ring-teal-500/20",
      line: "from-teal-500 to-teal-600",
    },
    blue: {
      badge: "bg-blue-500/20 border-blue-400/30 text-blue-300",
      accent: "text-blue-600",
      accentBg: "bg-blue-50 border-blue-200",
      btnPrimary: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20",
      stepActive: "bg-blue-500 text-white ring-4 ring-blue-500/20",
      line: "from-blue-500 to-blue-600",
    },
  }[data.accentColor];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 print:p-0 print:space-y-4">
      {/* Print Header Watermark (Hanya Tampil Saat Cetak / Download PDF) */}
      <div className="hidden print:block border-b-2 border-neutral-300 pb-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-neutral-900">
              SICUAN x PT INDOFOOD CBP SUKSES MAKMUR TBK
            </h1>
            <p className="text-xs text-neutral-600">
              Dokumen Panduan Resmi Peta Alur Sampah &amp; Skema Reward (
              {data.badgeLabel})
            </p>
          </div>
          <div className="text-right text-[10px] text-neutral-500">
            <p>
              Dicetak:{" "}
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            {userName && <p>Mitra: {userName}</p>}
          </div>
        </div>
      </div>

      {/* Header Banner Hero */}
      <div
        className={`bg-gradient-to-r ${data.bannerBg} rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl print:bg-white print:text-neutral-900 print:shadow-none print:border print:border-neutral-200 print:p-6`}
      >
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none print:hidden" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-bold tracking-wide ${themeColors.badge} print:bg-neutral-100 print:text-neutral-800 print:border-neutral-300`}
            >
              <Recycle className="w-3.5 h-3.5" />
              <span>{data.badgeLabel}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {data.title}
            </h1>
            <p className="text-neutral-200/90 text-xs sm:text-sm leading-relaxed print:text-neutral-700">
              {data.subTitle}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className={`px-5 py-3.5 ${themeColors.btnPrimary} font-bold text-xs sm:text-sm rounded-2xl shadow-lg flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]`}
              title="Cetak atau simpan panduan alur ini sebagai PDF"
            >
              <Download className="w-4.5 h-4.5" />
              <span>Unduh Panduan PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/10"
              title="Cetak langsung"
            >
              <Printer className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-3xl">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Prinsip Sirkularitas Daur Ulang
          </span>
          <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-medium">
            {data.overview}
          </p>
        </div>

        {/* 3 Impact Stats */}
        <div className="grid grid-cols-3 gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-neutral-100 pt-4 md:pt-0 md:pl-6">
          <div className="text-center md:text-left space-y-0.5">
            <span className="text-lg sm:text-xl font-black text-neutral-900 block">
              {data.ecoImpact.stat1.value}
            </span>
            <span className="text-[10px] text-neutral-500 font-semibold block">
              {data.ecoImpact.stat1.label}
            </span>
          </div>
          <div className="text-center md:text-left space-y-0.5">
            <span className="text-lg sm:text-xl font-black text-neutral-900 block">
              {data.ecoImpact.stat2.value}
            </span>
            <span className="text-[10px] text-neutral-500 font-semibold block">
              {data.ecoImpact.stat2.label}
            </span>
          </div>
          <div className="text-center md:text-left space-y-0.5">
            <span className="text-lg sm:text-xl font-black text-neutral-900 block">
              {data.ecoImpact.stat3.value}
            </span>
            <span className="text-[10px] text-neutral-500 font-semibold block">
              {data.ecoImpact.stat3.label}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Menu (khusus Warmindo yang memiliki extra GIS Content) */}
      {extraContent && (
        <div className="flex border-b border-neutral-200 gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("alur")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "alur"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <Recycle className="w-4 h-4" />
            <span>Peta Alur &amp; Edukasi Sirkular</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gis")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "gis"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Pelacakan Rute Setoran (Peta GIS)</span>
          </button>
        </div>
      )}

      {/* Konten Extra GIS (Jika Tab GIS Aktif pada Warmindo) */}
      {extraContent && activeTab === "gis" && (
        <div className="animate-in fade-in duration-200">{extraContent}</div>
      )}

      {/* Konten Utama Alur Perjalanan Sampah */}
      {(!extraContent || activeTab === "alur") && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Visual Lifecycle Stepper */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                  Tahapan Alur Perjalanan Sampah
                </h2>
                <p className="text-xs text-neutral-500">
                  5 langkah perjalanan sampah dari tangan Anda hingga proses
                  akhir daur ulang dan penerimaan reward
                </p>
              </div>
            </div>

            {/* Stepper Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              {data.steps.map((step, idx) => {
                const IconComponent = getStepIcon(step.iconName);
                const isSelected = activeStepIndex === idx;

                return (
                  <button
                    type="button"
                    key={step.stepNumber}
                    onClick={() => setActiveStepIndex(idx)}
                    className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between text-left relative overflow-hidden group hover:shadow-md ${
                      isSelected
                        ? "border-neutral-900 shadow-md ring-2 ring-neutral-900/10"
                        : "border-neutral-200/80 hover:border-neutral-300"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${
                            isSelected
                              ? themeColors.stepActive
                              : "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200"
                          }`}
                        >
                          {step.stepNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                          {step.badgeText}
                        </span>
                      </div>

                      <div className="w-10 h-10 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-700 group-hover:scale-105 transition-transform">
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div>
                        <h3 className="font-black text-xs sm:text-sm text-neutral-900 leading-tight">
                          {step.title}
                        </h3>
                        <p className="text-[11px] font-bold text-neutral-400 mt-0.5">
                          {step.subtitle}
                        </p>
                      </div>

                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-neutral-100 space-y-1.5 text-[11px] w-full">
                      <div className="flex items-center justify-between text-neutral-500">
                        <span className="font-semibold">Pelaku:</span>
                        <span className="font-bold text-neutral-800 text-right">
                          {step.actor}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-500">
                        <span className="font-semibold">Lokasi:</span>
                        <span className="font-bold text-neutral-800 text-right">
                          {step.location}
                        </span>
                      </div>
                      {step.rewardInfo && (
                        <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-700 font-bold text-[10px] mt-2 text-center w-full">
                          💡 {step.rewardInfo}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Diagram: Arsitektur Ekosistem Sirkular */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-neutral-900 rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-xl print:bg-white print:text-neutral-900 print:border print:border-neutral-200 print:shadow-none">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Infografis Diagram Sirkular
                </span>
                <h3 className="text-lg sm:text-xl font-black">
                  Ekosistem Rantai Pasok Daur Ulang SiCuan
                </h3>
              </div>
              <span className="text-xs text-neutral-400 bg-white/10 px-3 py-1 rounded-full border border-white/10 print:hidden">
                Closed-Loop Recycling Ecosystem
              </span>
            </div>

            {/* Horizontal Diagram Flow */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
              {[
                {
                  label: "1. Sumber Sampah",
                  sub: "Pemilahan Awal",
                  desc: "Karton, plastik etiket, cup Pop Mie",
                  icon: Store,
                },
                {
                  label: "2. Penjemputan",
                  sub: "Armada / Drop Point",
                  desc: "Kurir, Bank Sampah B, setor langsung",
                  icon: Truck,
                },
                {
                  label: "3. Bank Sampah",
                  sub: "Penimbangan & Audit",
                  desc: "Verifikasi timbangan AI, baling",
                  icon: Scale,
                },
                {
                  label: "4. Pabrik Indofood",
                  sub: "Fasilitas Daur Ulang",
                  desc: "Pengolahan jadi bahan baku baru",
                  icon: Recycle,
                },
                {
                  label: "5. Reward & Poin",
                  sub: "Cuan Berkelanjutan",
                  desc: "Sembako, e-wallet, insentif mitra",
                  icon: Coins,
                },
              ].map((node, i) => {
                const NodeIcon = node.icon;
                return (
                  <div
                    key={node.label}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-3 relative print:bg-neutral-50 print:border-neutral-300 print:text-neutral-900"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white print:bg-neutral-200 print:text-neutral-800">
                        <NodeIcon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-neutral-400">
                        Step 0{i + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-white print:text-neutral-900">
                        {node.label}
                      </h4>
                      <p className="text-[10px] text-emerald-400 font-semibold print:text-emerald-700">
                        {node.sub}
                      </p>
                      <p className="text-[11px] text-neutral-300 print:text-neutral-600 mt-1 leading-snug">
                        {node.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Fraksi Sampah & Skema Reward */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fraksi Sampah yang Diterima */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-neutral-900">
                    Fraksi Sampah yang Diterima
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Spesifikasi kemasan produk Indofood yang bernilai reward
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600">
                  <Layers className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-3">
                {data.fraksiList.map((fraksi) => {
                  const FraksiIcon = getStepIcon(fraksi.iconName);
                  return (
                    <div
                      key={fraksi.nama}
                      className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0">
                          <FraksiIcon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900">
                            {fraksi.nama}
                          </h4>
                          <p className="text-[11px] text-neutral-500">
                            {fraksi.keterangan}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shrink-0">
                        {fraksi.poinRate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skema & Cara Klaim Reward */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-neutral-900">
                      {data.rewardInfo.kategori}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Rincian keuntungan dan cara penukaran poin Anda
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Gift className="w-4 h-4" />
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  {data.rewardInfo.deskripsi}
                </p>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Pilihan Hadiah / Reward yang Tersedia:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {data.rewardInfo.items.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 text-xs font-semibold text-neutral-800"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Panduan Cara Klaim:
                </span>
                <p className="text-xs text-neutral-600 leading-relaxed font-medium bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
                  {data.rewardInfo.caraKlaim}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
