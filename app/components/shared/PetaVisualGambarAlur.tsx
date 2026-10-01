"use client";

import {
  Download,
  Gift,
  Maximize2,
  Printer,
  Recycle,
  Sparkles,
  Store,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { TourGuide } from "@/app/components/shared/TourGuide";
import { PETA_SAMPAH_DATA, type PetaRole } from "@/app/lib/peta-sampah-data";

interface PetaVisualGambarAlurProps {
  userRole: PetaRole;
  userName?: string;
}

const tourSteps = [
  {
    element: "#tour-visual-header",
    popover: {
      title: "Visual Gambar Alur Sampah & Reward",
      description:
        "Infografis bergambar resmi yang memetakan seluruh perjalanan sirkular kemasan Indofood dari lokasi Anda hingga menjadi reward bahan baku dan cuan tunai.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-visual-hero-image",
    popover: {
      title: "Gambar Alur 5 Tahapan Sirkular",
      description:
        "Ilustrasi 3D alur rantai nilai: 1. Sumber Sampah -> 2. Armada Logistik Jemput -> 3. Bank Sampah Sortir -> 4. Pabrik Daur Ulang PT Indofood -> 5. Sentra Reward Produk & Saldo.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-visual-actions",
    popover: {
      title: "Unduh Gambar & Cetak PDF Rapi",
      description:
        "Unduh file gambar infografis asli beresolusi tinggi (HD) atau cetak sebagai dokumen PDF resmi dengan tata letak rapi berstandar A4.",
      side: "left" as const,
    },
  },
  {
    element: "#tour-visual-role-steps",
    popover: {
      title: "Penyesuaian Alur Sesuai Peran Anda",
      description:
        "Rincian alur yang disesuaikan khusus untuk peran Anda dalam ekosistem pengelolaan sampah terpadu PT Indofood.",
      side: "top" as const,
    },
  },
];

export function PetaVisualGambarAlur({
  userRole,
  userName,
}: PetaVisualGambarAlurProps) {
  const data = PETA_SAMPAH_DATA[userRole];
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [selectedStation, setSelectedStation] = useState<number>(1);

  const imageSrc = "/images/peta-alur-sampah-indofood.jpg";
  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const docRefNumber = `DOC-SICUAN/ALUR-${data.role.toUpperCase()}/${new Date().getFullYear()}${String(
    new Date().getMonth() + 1,
  ).padStart(2, "0")}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = () => {
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = `peta-alur-sampah-indofood-${data.role}.jpg`;
    link.click();
  };

  const activeStep =
    data.steps.find((s) => s.stepNumber === selectedStation) || data.steps[0];

  return (
    <div className="space-y-6">
      {/* Tour Guide System */}
      <TourGuide steps={tourSteps} />

      {/* ══════════════════════════════════════════════════════════════════════════════
          1. TAMPILAN WEB INTERAKTIF (DISEMBUNYIKAN SAAT DICETAK KE PDF)
      ══════════════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-6 print:hidden">
        {/* ── HEADER HALAMAN ── */}
        <div
          id="tour-visual-header"
          className="flex flex-col gap-4 rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                {data.badgeLabel}
              </span>
              <span className="text-xs text-neutral-400">•</span>
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                Mitra: {userName || "Pengguna SiCuan"}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
              {data.title}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-3xl">
              Infografis visual alur perjalanan sampah kemasan mi instan dari
              hulu hingga hilir menjadi reward sembako dan cuan resmi PT
              Indofood CBP Sukses Makmur Tbk.
            </p>
          </div>

          {/* Action Buttons */}
          <div
            id="tour-visual-actions"
            className="flex flex-wrap items-center gap-2.5"
          >
            {/* Unduh Gambar Asli HD */}
            <button
              type="button"
              onClick={handleDownloadImage}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all"
            >
              <Download className="h-4 w-4" />
              Unduh Gambar (HD)
            </button>

            {/* Lihat Gambar Layar Penuh */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 active:scale-95 transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              <Maximize2 className="h-4 w-4 text-neutral-500" />
              Perbesar
            </button>

            {/* Cetak / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-100 active:scale-95 transition-all dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <Printer className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Cetak / Simpan PDF
            </button>
          </div>
        </div>

        {/* ── HERO VISUAL GAMBAR ALUR SAMPAH KE REWARD (UTAMA) ── */}
        <div
          id="tour-visual-hero-image"
          className="group relative overflow-hidden rounded-3xl border border-neutral-200/90 bg-slate-950 p-2 shadow-xl dark:border-neutral-800"
        >
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-900">
            <Image
              src={imageSrc}
              alt="Peta Visual Alur Sampah dan Reward PT Indofood"
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="object-contain transition-transform duration-500 group-hover:scale-[1.01]"
            />

            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute top-4 right-4 flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Perbesar Gambar
            </button>

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-black/80 via-black/60 to-transparent p-3 backdrop-blur-md text-white">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 font-black text-xs text-neutral-950">
                  5
                </span>
                <div>
                  <p className="text-xs font-bold leading-tight">
                    Alur Lengkap: Dari Warung & Konsumen Menuju Cuan Indofood
                  </p>
                  <p className="text-[10px] text-neutral-300">
                    PT Indofood CBP Sukses Makmur Tbk x SiCuan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadImage}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                <Download className="h-3.5 w-3.5" />
                Download JPG
              </button>
            </div>
          </div>
        </div>

        {/* ── INTERAKTIF: PENJELASAN 5 STASIUN PADA GAMBAR ── */}
        <div
          id="tour-visual-role-steps"
          className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-100 pb-4 dark:border-neutral-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Panduan Detail Stasiun Gambar
              </span>
              <h3 className="text-lg font-black text-neutral-900 dark:text-white sm:text-xl">
                5 Tahapan Perjalanan Sampah pada Gambar di Atas
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Klik stasiun untuk melihat aktivitas spesifik bagi peran{" "}
                {data.badgeLabel}.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {data.steps.map((st) => {
              const isCurrent = selectedStation === st.stepNumber;
              return (
                <button
                  key={st.stepNumber}
                  type="button"
                  onClick={() => setSelectedStation(st.stepNumber)}
                  className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-all ${
                    isCurrent
                      ? "border-emerald-500 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20 dark:border-emerald-400 dark:bg-emerald-950/30"
                      : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/40"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-black text-xs ${
                      st.stepNumber === 5
                        ? "bg-amber-500 text-neutral-950"
                        : isCurrent
                          ? "bg-emerald-600 text-white"
                          : "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200"
                    }`}
                  >
                    {st.stepNumber}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase text-neutral-400">
                      Stasiun {st.stepNumber}
                    </span>
                    <p className="truncate text-xs font-bold text-neutral-900 dark:text-white">
                      {st.title.split(":")[0]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-neutral-200/70 bg-neutral-50/80 p-5 dark:border-neutral-800 dark:bg-neutral-800/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200/80 pb-3 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 font-black text-white text-sm shadow-sm">
                  {activeStep.stepNumber}
                </span>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Stasiun {activeStep.stepNumber}: {activeStep.badgeText}
                  </span>
                  <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                    {activeStep.title}
                  </h4>
                </div>
              </div>
              <span className="rounded-xl bg-white px-3 py-1 text-xs font-semibold text-neutral-700 shadow-sm border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200">
                📍 {activeStep.location}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
              <div className="rounded-xl bg-white p-3.5 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-neutral-400">
                  Pihak Terlibat
                </span>
                <p className="font-semibold text-neutral-900 dark:text-white text-sm">
                  {activeStep.actor}
                </p>
                <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                  Bertanggung jawab dalam kelancaran alur di titik ini.
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50/80 p-3.5 border border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                  Perjalanan Fisik Sampah
                </span>
                <p className="text-emerald-950 dark:text-emerald-200 leading-relaxed">
                  {activeStep.description}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50/80 p-3.5 border border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-800/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
                  Nilai Reward & Cuan
                </span>
                <p className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                  {activeStep.rewardInfo || "Poin & Insentif Kemitraan"}
                </p>
                <p className="text-amber-800/80 dark:text-amber-300/80 text-[11px]">
                  Dapat langsung ditukarkan di katalog resmi SiCuan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── KATALOG VISUAL REWARD PRODUK INDOFOOD ── */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-100 pb-4 dark:border-neutral-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Stasiun 5: Muara Cuan & Keuntungan
              </span>
              <h3 className="text-lg font-black text-neutral-900 dark:text-white sm:text-xl">
                Katalog Reward Resmi PT. Indofood CBP Sukses Makmur
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Semua poin setoran dapat ditukarkan secara resmi menjadi produk
                sembako dan insentif tunai.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/40 to-white p-4 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-neutral-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20">
                <Gift className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-neutral-900 dark:text-white">
                Minyak Goreng Bimoli
              </h4>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Pouch 1 Liter & 2 Liter Spesial kemasan resmi Indofood untuk
                kebutuhan gerai dan rumah tangga.
              </p>
              <div className="mt-3 pt-2 border-t border-amber-100 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  Reward Terlaris
                </span>
                <span className="text-[10px] text-neutral-400">
                  Tukar di Menu Reward
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-b from-blue-50/40 to-white p-4 dark:border-blue-900/40 dark:from-blue-950/20 dark:to-neutral-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20">
                <Store className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-neutral-900 dark:text-white">
                Tepung Terigu Segitiga Biru
              </h4>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Tepung terigu serbaguna 1 kg Bogasari untuk bahan baku gorengan
                dan olahan warung.
              </p>
              <div className="mt-3 pt-2 border-t border-blue-100 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400">
                  Bahan Pokok Usaha
                </span>
                <span className="text-[10px] text-neutral-400">
                  Gratis Pasokan
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 to-white p-4 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:to-neutral-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20">
                <Recycle className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-neutral-900 dark:text-white">
                Kecap Indofood & Mi Instan
              </h4>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Karton mi instan Indomie dan botol kecap manis refill langsung
                dari distributor pabrik.
              </p>
              <div className="mt-3 pt-2 border-t border-emerald-100 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  Paling Diminati
                </span>
                <span className="text-[10px] text-neutral-400">
                  Klaim Instan
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-b from-purple-50/40 to-white p-4 dark:border-purple-900/40 dark:from-purple-950/20 dark:to-neutral-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20">
                <Wallet className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-neutral-900 dark:text-white">
                Saldo E-Wallet & Kas Bank
              </h4>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Cairkan poin menjadi saldo rupiah GoPay, OVO, DANA atau transfer
                bank langsung.
              </p>
              <div className="mt-3 pt-2 border-t border-purple-100 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400">
                  Cuan Fleksibel
                </span>
                <span className="text-[10px] text-neutral-400">
                  Cair 1x24 Jam
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          2. TAMPILAN DOKUMEN CETAK PDF KHUSUS (2 HALAMAN RESMI TERENCANA)
          MUNCUL OTOMATIS SAAT WINDOW.PRINT() / CETAK PDF
      ══════════════════════════════════════════════════════════════════════════════ */}
      <div className="hidden print:block font-sans text-neutral-900 bg-white">
        {/* ────────────────────────────────────────────────────────────────────────
            HALAMAN 1: INFOGRAFIS UTAMA & IKHTISAR ALUR SIRKULAR
        ──────────────────────────────────────────────────────────────────────── */}
        <div className="print-page-1 flex flex-col justify-between min-h-[96vh]">
          <div>
            {/* KOP RESMI DOKUMEN KEMITRAAN */}
            <div className="border-b-2 border-emerald-800 pb-2.5 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-emerald-800">
                      SICUAN
                    </span>
                    <span className="text-sm font-semibold text-neutral-400">
                      |
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      PT. INDOFOOD CBP SUKSES MAKMUR TBK
                    </span>
                  </div>
                  <p className="text-[9.5px] text-neutral-500 mt-0.5">
                    Sistem Terpadu Pengelolaan Rantai Pasok Sampah Kemasan &
                    Ekonomi Sirkular Berkelanjutan
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-900 border border-emerald-300">
                    DOKUMEN RESMI KEMITRAAN
                  </span>
                  <p className="text-[8.5px] text-neutral-500 font-mono mt-0.5">
                    {docRefNumber}
                  </p>
                </div>
              </div>

              {/* IDENTITAS PENGGUNA */}
              <div className="mt-2 pt-1.5 border-t border-neutral-200 grid grid-cols-3 gap-2 text-[9.5px] text-neutral-700">
                <div>
                  <span className="text-neutral-400 block text-[8.5px] uppercase font-medium">
                    Peran Pengguna:
                  </span>
                  <span className="font-bold text-emerald-800">
                    {data.badgeLabel}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[8.5px] uppercase font-medium">
                    Nama Mitra Terdaftar:
                  </span>
                  <span className="font-bold text-neutral-900">
                    {userName || "Mitra Resmi SiCuan"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-400 block text-[8.5px] uppercase font-medium">
                    Tanggal Terbit:
                  </span>
                  <span className="font-bold text-neutral-900">
                    {currentDate}
                  </span>
                </div>
              </div>
            </div>

            {/* JUDUL DOKUMEN */}
            <div className="text-center my-2">
              <h2 className="text-sm font-black uppercase tracking-wide text-neutral-900">
                Peta Visual Alur Perjalanan Sampah Kemasan Hingga Menjadi Reward
              </h2>
              <p className="text-[9px] text-neutral-600 mt-0.5 max-w-2xl mx-auto">
                Dokumentasi visual transformasi kemasan mi instan Indofood dari
                pengumpulan di sumber hingga penerimaan manfaat reward bernilai
                ekonomis.
              </p>
            </div>

            {/* GAMBAR ALUR UTAMA (UKURAN PROPORSIONAL AGAR PAS SEMPURNA DI HALAMAN 1) */}
            <div className="my-2 border border-neutral-300 rounded-xl p-1.5 bg-neutral-50">
              <div className="relative aspect-[16/9] w-full max-h-[290px] overflow-hidden rounded-lg mx-auto">
                <Image
                  src={imageSrc}
                  alt="Peta Alur Cetak PDF"
                  fill
                  priority
                  sizes="800px"
                  className="object-contain"
                />
              </div>
              <p className="text-center text-[8.5px] text-neutral-500 italic mt-1">
                Gambar 1: Rantai Nilai Sirkular 5 Stasiun Pengelolaan Sampah PT.
                Indofood CBP Sukses Makmur Tbk x SiCuan
              </p>
            </div>

            {/* 5 PILAR IKHTISAR STASIUN (GRID 5 KOLOM RAPI DI BAWAH GAMBAR) */}
            <div className="my-3">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                Ikhtisar 5 Stasiun Rantai Perjalanan Sampah:
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-[8.5px]">
                {data.steps.map((st) => (
                  <div
                    key={st.stepNumber}
                    className="border border-neutral-200 rounded-lg p-2 bg-neutral-50/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-800 text-white font-bold text-[8px]">
                          {st.stepNumber}
                        </span>
                        <span className="text-[7.5px] font-bold text-emerald-700 uppercase">
                          {st.badgeText}
                        </span>
                      </div>
                      <p className="font-bold text-neutral-900 text-[8.5px] leading-tight line-clamp-2">
                        {st.title.split(":")[0]}
                      </p>
                      <p className="text-neutral-500 text-[7.5px] mt-0.5 truncate">
                        📍 {st.location.split("/")[0]}
                      </p>
                    </div>
                    <div className="mt-1.5 pt-1 border-t border-neutral-200 text-amber-800 font-semibold text-[7.5px]">
                      🎁 {st.rewardInfo?.split("|")[0] || "Poin Terakreditasi"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DAMPAK POSITIF & PAYUNG HUKUM KEMITRAAN */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2 text-[8.5px] text-emerald-950 flex items-center justify-between">
              <div>
                <span className="font-bold block text-emerald-900">
                  Prinsip Ekonomi Sirkular & Zero Waste:
                </span>
                <span>
                  Setiap kemasan terpilah diselamatkan dari TPA dan diolah
                  kembali menjadi produk bermanfaat serta mengurangi emisi
                  karbon.
                </span>
              </div>
              <span className="font-bold text-emerald-800 text-[9px] shrink-0 ml-4">
                Program Resmi Binaan PT Indofood
              </span>
            </div>
          </div>

          {/* FOOTER HALAMAN 1 */}
          <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-[8px] text-neutral-400">
            <span>
              Sistem Pengelolaan Sampah SiCuan • PT Indofood CBP Sukses Makmur
              Tbk
            </span>
            <span>Halaman 1 dari 2</span>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────────────
            HALAMAN 2: MATRIKS DETAIL 5 STASIUN, KATALOG REWARD & PENGESAHAN
        ──────────────────────────────────────────────────────────────────────── */}
        <div className="print-page-2 flex flex-col justify-between min-h-[96vh]">
          <div>
            {/* RUNNING HEADER HALAMAN 2 */}
            <div className="border-b border-neutral-300 pb-2 mb-3 flex items-center justify-between text-[9px]">
              <div className="flex items-center gap-1.5 font-bold text-neutral-700">
                <span className="text-emerald-800">SICUAN x INDOFOOD</span>
                <span className="text-neutral-300">•</span>
                <span>Matriks Rincian SOP & Pengesahan Kemitraan</span>
              </div>
              <span className="text-neutral-400 font-mono text-[8px]">
                {docRefNumber}
              </span>
            </div>

            {/* TABEL RINCIAN 5 TAHAPAN (SEMUA 5 BARIS TAMPIL LENGKAP & UTUH DI HALAMAN 2) */}
            <div className="mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                Tabel Spesifikasi & Alur Pelaksanaan 5 Stasiun:
              </h3>

              <table className="w-full border-collapse border border-neutral-300 text-[9px]">
                <thead>
                  <tr className="bg-emerald-800 text-white">
                    <th className="border border-neutral-300 p-1.5 text-center w-7">
                      No
                    </th>
                    <th className="border border-neutral-300 p-1.5 text-left w-36">
                      Stasiun & Kategori
                    </th>
                    <th className="border border-neutral-300 p-1.5 text-left w-36">
                      Pihak & Lokasi
                    </th>
                    <th className="border border-neutral-300 p-1.5 text-left">
                      Alur Fisik Perubahan Sampah
                    </th>
                    <th className="border border-neutral-300 p-1.5 text-left w-44">
                      Manfaat Reward & Cuan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.steps.map((st, idx) => (
                    <tr
                      key={st.stepNumber}
                      className={idx % 2 === 0 ? "bg-white" : "bg-neutral-50"}
                    >
                      <td className="border border-neutral-300 p-1.5 text-center font-bold text-neutral-800 align-top">
                        {st.stepNumber}
                      </td>
                      <td className="border border-neutral-300 p-1.5 align-top">
                        <span className="font-bold text-neutral-900 block leading-tight">
                          {st.title.split(":")[0]}
                        </span>
                        <span className="inline-block rounded bg-neutral-200 px-1 py-0.2 text-[7.5px] font-semibold text-neutral-700 mt-0.5">
                          {st.badgeText}
                        </span>
                      </td>
                      <td className="border border-neutral-300 p-1.5 align-top">
                        <span className="font-semibold block text-neutral-800 leading-tight">
                          {st.actor}
                        </span>
                        <span className="text-neutral-500 text-[8px] block mt-0.5">
                          📍 {st.location}
                        </span>
                      </td>
                      <td className="border border-neutral-300 p-1.5 align-top text-neutral-700 leading-relaxed text-[8.5px]">
                        {st.description}
                      </td>
                      <td className="border border-neutral-300 p-1.5 align-top">
                        <span className="font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 block text-[8px] leading-tight">
                          🎁 {st.rewardInfo || "Poin Kemitraan Resmi"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* RINGKASAN KATALOG REWARD RESMI PT INDOFOOD */}
            <div className="mb-4 rounded-lg border border-neutral-300 bg-neutral-50 p-2.5">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-1 mb-2">
                <span className="text-[9.5px] font-bold uppercase text-neutral-800">
                  Katalog Reward Resmi PT Indofood CBP Sukses Makmur Tbk
                </span>
                <span className="text-[8.5px] text-emerald-800 font-semibold">
                  Tukar Poin Kapan Saja di Aplikasi SiCuan
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[8.5px]">
                <div className="border border-neutral-200 rounded p-1.5 bg-white">
                  <span className="font-bold text-neutral-900 block">
                    Minyak Goreng Bimoli
                  </span>
                  <span className="text-neutral-600 block mt-0.5 text-[8px]">
                    Pouch 1L & 2L Spesial kemasan resmi.
                  </span>
                  <span className="text-emerald-700 font-bold text-[7.5px] block mt-1">
                    ✓ Kebutuhan Pokok
                  </span>
                </div>
                <div className="border border-neutral-200 rounded p-1.5 bg-white">
                  <span className="font-bold text-neutral-900 block">
                    Tepung Segitiga Biru
                  </span>
                  <span className="text-neutral-600 block mt-0.5 text-[8px]">
                    Bogasari kemasan 1 kg serbaguna.
                  </span>
                  <span className="text-emerald-700 font-bold text-[7.5px] block mt-1">
                    ✓ Bahan Baku Usaha
                  </span>
                </div>
                <div className="border border-neutral-200 rounded p-1.5 bg-white">
                  <span className="font-bold text-neutral-900 block">
                    Kecap & Mi Instan
                  </span>
                  <span className="text-neutral-600 block mt-0.5 text-[8px]">
                    Karton Indomie & botol kecap manis.
                  </span>
                  <span className="text-emerald-700 font-bold text-[7.5px] block mt-1">
                    ✓ Pasokan Gerai
                  </span>
                </div>
                <div className="border border-neutral-200 rounded p-1.5 bg-white">
                  <span className="font-bold text-neutral-900 block">
                    Saldo Kas & E-Wallet
                  </span>
                  <span className="text-neutral-600 block mt-0.5 text-[8px]">
                    Transfer ke GoPay, OVO, DANA, giro bank.
                  </span>
                  <span className="text-emerald-700 font-bold text-[7.5px] block mt-1">
                    ✓ Pencairan Tunai
                  </span>
                </div>
              </div>
            </div>

            {/* LEMBAR PENGESAHAN & TANDA TANGAN KEMITRAAN */}
            <div className="mt-4 pt-3 border-t border-neutral-200">
              <div className="grid grid-cols-2 gap-8 text-[9.5px]">
                <div className="text-center">
                  <p className="text-neutral-500">Mengetahui & Menyetujui,</p>
                  <p className="font-bold text-neutral-900 mt-0.5">
                    Divisi Keberlanjutan & Kemitraan
                  </p>
                  <p className="font-bold text-emerald-800 text-[10px]">
                    PT. INDOFOOD CBP SUKSES MAKMUR TBK
                  </p>
                  <div className="h-12 flex items-center justify-center">
                    <span className="text-[8px] text-neutral-400 italic border-b border-dashed border-neutral-400 pb-0.5">
                      [ Tanda Tangan & Cap Digital Terverifikasi ]
                    </span>
                  </div>
                  <p className="font-bold text-neutral-900">
                    Sistem Otomasi SiCuan Indonesia
                  </p>
                  <p className="text-[8px] text-neutral-500">
                    ID Verifikasi: SICUAN-VERIFIED
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-neutral-500">
                    Diterima & Dilaksanakan Oleh,
                  </p>
                  <p className="font-bold text-neutral-900 mt-0.5">
                    Mitra / Pengelola Terdaftar
                  </p>
                  <p className="font-bold text-neutral-800 text-[10px]">
                    {data.badgeLabel}
                  </p>
                  <div className="h-12 flex items-center justify-center">
                    <span className="text-[8px] text-neutral-400 italic border-b border-dashed border-neutral-400 pb-0.5">
                      [ Tanda Tangan Mitra ]
                    </span>
                  </div>
                  <p className="font-bold text-neutral-900">
                    ({" "}
                    {userName ||
                      "...................................................."}{" "}
                    )
                  </p>
                  <p className="text-[8px] text-neutral-500">
                    Akun Resmi SiCuan
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER HALAMAN 2 */}
          <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-[8px] text-neutral-400">
            <span>
              Dokumen Resmi Kemitraan Sirkular • Dicetak Sah melalui Sistem
              SiCuan
            </span>
            <span>Halaman 2 dari 2</span>
          </div>
        </div>
      </div>

      {/* ── MODAL LIGHTBOX LAYAR PENUH UNTUK MELIHAT GAMBAR SECARA MAKSIMAL ── */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative max-h-[92vh] max-w-6xl w-full flex flex-col items-center">
            <div className="flex w-full items-center justify-between pb-3 text-white">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">
                  Peta Visual Alur Sampah & Reward PT. Indofood (Tampilan Penuh
                  HD)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh Gambar
                </button>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black border border-white/10 shadow-2xl">
              <Image
                src={imageSrc}
                alt="Peta Alur Sampah HD"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT-ONLY STYLING & PAGE SETUP ── */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }
        @media print {
          html,
          body {
            background: #ffffff !important;
            color: #111827 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav,
          aside,
          header,
          footer,
          button,
          .tour-guide-container,
          #tour-visual-actions {
            display: none !important;
          }
          .print-page-1 {
            page-break-after: always !important;
            break-after: page !important;
          }
          .print-page-2 {
            page-break-before: always !important;
            break-before: page !important;
          }
        }
      `}</style>
    </div>
  );
}
