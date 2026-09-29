"use client";

import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Coins,
  FileText,
  Folder,
  HelpCircle,
  Scale,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

interface GuideSection {
  id: string;
  title: string;
  subtitle: string;
  icon: import("lucide-react").LucideIcon;
}

export default function UserGuidePage() {
  const [activeSection, setActiveSection] = useState<string>("intro");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const sections: GuideSection[] = [
    {
      id: "intro",
      title: "Pendahuluan",
      subtitle: "Gambaran umum & arsitektur portal",
      icon: BookOpen,
    },
    {
      id: "master-data",
      title: "Manajemen Master Data",
      subtitle: "Kelola User, Harga, Poin & Raw Material",
      icon: Folder,
    },
    {
      id: "setoran",
      title: "Setoran & Validasi",
      subtitle: "AI Verification vs Validasi Manual",
      icon: Scale,
    },
    {
      id: "pencairan",
      title: "Pencairan Dana",
      subtitle: "Persetujuan transaksi & pencairan saldo",
      icon: Coins,
    },
    {
      id: "laporan",
      title: "Laporan Kontribusi",
      subtitle: "Analitik sirkularitas raw material",
      icon: FileText,
    },
  ];

  const faqs = [
    {
      q: "Bagaimana cara melakukan validasi manual jika AI gagal mendeteksi berat?",
      a: "Masuk ke menu Setoran & Kontribusi, pilih peran nasabah yang bersangkutan. Cari data setoran berstatus 'Pending'. Periksa foto timbangan yang diunggah oleh nasabah secara saksama. Setelah itu, klik tombol 'Validasi Manual' dan masukkan berat bersih (Kg) yang divalidasi oleh Anda secara manual untuk menyimpan data.",
    },
    {
      q: "Mengapa penambahan harga sampah secara otomatis membuat range di ketiga kategori sekaligus?",
      a: "Fitur ini dirancang untuk menjaga konsistensi standardisasi harga sampah sirkular. Saat Anda menambahkan tier berat baru (misal: 1–5 Kg), sistem akan otomatis menduplikasi aturan tersebut ke kategori Karton, Etiket, dan Paper Cup dengan nominal harga yang sama agar adil di semua lini setoran.",
    },
    {
      q: "Bagaimana sistem menghitung persentase sirkularitas raw material Indofood?",
      a: "Rasio sirkularitas dihitung dengan membagi total berat sampah yang berhasil dikumpulkan (disetorkan) oleh seluruh aktor (Konsumen + Warmindo + Bank Sampah) dengan total berat raw material yang dirilis oleh pabrik Indofood untuk kategori & periode yang bersangkutan.",
    },
  ];

  const _getPercentageColor = (pct: number) => {
    if (pct >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (pct >= 50) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header Board */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Panduan Pengguna (User Guide)
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Panduan operasional dan dokumentasi fitur lengkap untuk
              Administrator & Superadmin SICUAN.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-2">
            Topik Panduan
          </p>
          <div className="bg-white rounded-2xl border border-neutral-200 p-2.5 shadow-sm space-y-1">
            {sections.map((section) => {
              const IconComp = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3.5 p-3 rounded-xl transition-all border-0 text-left cursor-pointer ${
                    isActive
                      ? "bg-primary-50 text-primary-700 font-bold border border-primary-100 shadow-xs"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-white text-primary-600 shadow-xs"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-tight">
                      {section.title}
                    </p>
                    <span className="text-[10px] text-neutral-450 block truncate mt-0.5">
                      {section.subtitle}
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 ml-auto shrink-0 transition-transform ${
                      isActive
                        ? "text-primary-500 translate-x-0.5"
                        : "text-neutral-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="bg-neutral-900 text-white rounded-2xl p-5 relative overflow-hidden shadow-md">
            <div className="absolute right-[-10px] bottom-[-20px] opacity-10 pointer-events-none">
              <HelpCircle className="w-36 h-36" />
            </div>
            <h4 className="text-xs font-black tracking-tight flex items-center gap-1.5">
              💡 Butuh Bantuan Eksternal?
            </h4>
            <p className="text-[10px] text-neutral-300 leading-relaxed mt-2">
              Jika Anda mengalami kendala server, data tidak sinkron, atau
              kegagalan sistem integrasi AI, hubungi Tim Teknis SICUAN melalui
              email developer.
            </p>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm min-h-[550px] flex flex-col justify-between">
          <div className="space-y-6">
            {/* 1. PENDAHULUAN */}
            {activeSection === "intro" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Pendahuluan
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Gambaran umum sistem circular economy SICUAN.
                  </p>
                </div>
                <p className="text-xs text-neutral-650 leading-relaxed">
                  SICUAN (Circular Economy Ecosystem) adalah platform digital
                  yang mendigitalkan ekosistem sirkularitas pengelolaan sampah
                  plastik/karton dari mitra pabrikan hingga ke nasabah akhir.
                  Sistem mendeteksi berat sampah dengan bantuan AI vision dan
                  memberikan reward poin & saldo uang secara instan.
                </p>

                <div className="bg-primary-50/50 border border-primary-100 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Users className="w-4.5 h-4.5 text-primary-600" />
                    Tiga Peran Nasabah Utama:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-white p-3 rounded-lg border border-neutral-200/60 shadow-2xs">
                      <p className="text-[11px] font-bold text-neutral-800">
                        1. Konsumen
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-1">
                        Nasabah rumah tangga umum. Penyetoran sampah
                        menghasilkan poin belanja (tidak menghasilkan saldo
                        uang/kredit).
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-neutral-200/60 shadow-2xs">
                      <p className="text-[11px] font-bold text-neutral-800">
                        2. Warmindo
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-1">
                        Mitra usaha warung makan. Penyetoran sampah hanya
                        menghasilkan saldo uang tunai/kredit sirkular (tidak
                        mendapatkan poin).
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-neutral-200/60 shadow-2xs">
                      <p className="text-[11px] font-bold text-neutral-800">
                        3. Bank Sampah
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-1">
                        Mitra pengumpul volume besar. Menghasilkan poin dan
                        saldo uang tunai dengan standardisasi range berat
                        tertentu.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MASTER DATA */}
            {activeSection === "master-data" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Manajemen Master Data
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Cara mengelola parameter dasar, harga, kupon, dan logistik.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Harga Sampah */}
                  <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/30 space-y-2">
                    <h4 className="font-extrabold text-neutral-800 flex items-center gap-2">
                      <span className="w-5.5 h-5.5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[11px]">
                        1
                      </span>
                      Standardisasi Harga & Auto-Seeding 3 Kategori
                    </h4>
                    <p className="text-neutral-600 pl-7 leading-relaxed">
                      Sistem menerapkan flat-rate pricing berdasarkan range
                      berat (misal: 1–5 Kg = Rp 25.000). Saat Admin menambahkan
                      range baru:
                    </p>
                    <ul className="list-disc pl-11 text-neutral-500 space-y-1">
                      <li>
                        Sistem otomatis menduplikasi tier tersebut ke tiga
                        kategori utama:{" "}
                        <strong>Karton, Etiket, dan Paper Cup</strong>.
                      </li>
                      <li>
                        Hal ini bertujuan untuk memudahkan proses input dan
                        memastikan keseragaman nominal tier di seluruh jenis
                        sampah.
                      </li>
                      <li>
                        <strong>Aturan Validasi Overlap</strong>: Sistem akan
                        menolak submit secara matematis jika rentang berat baru
                        bertubrukan (overlap) dengan rentang berat yang sudah
                        ada.
                      </li>
                    </ul>
                  </div>

                  {/* Poin, Kupon & Raw Material */}
                  <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/30 space-y-2">
                    <h4 className="font-extrabold text-neutral-800 flex items-center gap-2">
                      <span className="w-5.5 h-5.5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[11px]">
                        2
                      </span>
                      Poin, Kupon & Logistik Raw Material
                    </h4>
                    <ul className="list-disc pl-7 text-neutral-600 space-y-2 leading-relaxed">
                      <li>
                        <strong>Master Poin</strong>: Menentukan nilai poin per
                        Kg untuk masing-masing sampah (konversi poin selalu per
                        Kg, tidak menggunakan range).
                      </li>
                      <li>
                        <strong>Master Kupon</strong>: Tempat Admin mengelola
                        daftar kupon hadiah yang dapat ditukarkan oleh nasabah
                        menggunakan poin terkumpul.
                      </li>
                      <li>
                        <strong>Raw Material</strong>: Mengisi data input
                        mingguan/bulanan raw material yang dirilis oleh Indofood
                        untuk dibandingkan dengan persentase sampah terkumpul di
                        menu analitik.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SETORAN & VALIDASI */}
            {activeSection === "setoran" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Setoran & Validasi
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Mengelola siklus hidup pengiriman sampah dan validasi.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-2">
                    <h4 className="font-bold text-emerald-800 flex items-center gap-1.5">
                      🤖 Validasi Otomatis AI
                    </h4>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Saat nasabah mengunggah foto setoran sampah di timbangan,
                      AI vision mendeteksi digit berat bersih secara instan.
                    </p>
                    <span className="inline-block bg-emerald-100 text-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-full border border-emerald-200">
                      Proses Instan (&lt; 1 Menit)
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 space-y-2">
                    <h4 className="font-bold text-amber-800 flex items-center gap-1.5">
                      👤 Validasi Manual Admin
                    </h4>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Jika validasi AI tidak berhasil atau nasabah memilih
                      bypass AI dengan opsi validasi manual, setoran akan
                      berstatus pending dan masuk ke antrean verifikasi Admin.
                    </p>
                    <span className="inline-block bg-amber-100 text-amber-850 text-amber-800 font-bold text-[9px] px-2 py-0.5 rounded-full border border-amber-200">
                      Waktu Proses: 1–2 Hari Kerja
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/20 text-xs text-neutral-600 leading-relaxed">
                  💡 <strong>Catatan Penting</strong>: Saldo kredit uang tunai
                  (untuk Warmindo & Bank Sampah) dan Poin (untuk Konsumen & Bank
                  Sampah) baru akan ditambahkan secara resmi ke akun pengguna
                  setelah status setoran berhasil diubah menjadi{" "}
                  <strong>&quot;diterima&quot;</strong> (baik melalui validasi
                  AI instan maupun validasi manual Admin).
                </div>
              </div>
            )}

            {/* 4. PENCAIRAN DANA */}
            {activeSection === "pencairan" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Pencairan Dana
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Prosedur verifikasi dan penyaluran saldo tunai sirkular
                    mitra.
                  </p>
                </div>

                <div className="space-y-4 text-xs text-neutral-650 leading-relaxed">
                  <p>
                    Mitra usaha (Warmindo & Bank Sampah) dapat menukarkan saldo
                    kredit uang tunai yang mereka kumpulkan dari setoran sampah
                    dengan mengajukan permohonan pencairan dana. Langkah
                    penanganan bagi Admin:
                  </p>

                  <div className="relative border-l-2 border-primary-200 pl-4 ml-2 space-y-4">
                    <div className="relative">
                      <span className="absolute -left-7 top-0.5 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                        1
                      </span>
                      <p className="font-bold text-neutral-800">
                        Periksa Riwayat Rekening & Saldo
                      </p>
                      <p className="text-neutral-500 mt-0.5">
                        Pastikan nomor rekening, nama bank, dan nama pemilik
                        rekening tujuan sesuai dengan data profil resmi mitra
                        untuk meminimalisasi salah transfer.
                      </p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-7 top-0.5 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                        2
                      </span>
                      <p className="font-bold text-neutral-800">
                        Verifikasi Limit Pencairan
                      </p>
                      <p className="text-neutral-500 mt-0.5">
                        Sistem secara otomatis mengunci pengajuan jika saldo
                        kredit mitra tidak mencukupi nominal pengajuan pencairan
                        dana.
                      </p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-7 top-0.5 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                        3
                      </span>
                      <p className="font-bold text-neutral-800">
                        Ubah Status Pengajuan
                      </p>
                      <p className="text-neutral-500 mt-0.5">
                        Setelah transfer bank berhasil diproses secara manual
                        oleh tim keuangan Anda, segera ubah status permohonan di
                        dashboard dari <strong>Pending</strong> menjadi{" "}
                        <strong>Disetujui</strong> (atau{" "}
                        <strong>Ditolak</strong> disertai alasan jika ada data
                        yang tidak valid).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. LAPORAN & ANALITIK */}
            {activeSection === "laporan" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Laporan & Analitik Sirkularitas
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Mempelajari cara membaca grafik dan kontribusi raw material.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <p className="text-neutral-600 leading-relaxed">
                    Halaman <strong>Laporan Material</strong> menampilkan
                    performa penyerapan kembali sampah (sirkularitas) dari raw
                    material yang dirilis Indofood. Beberapa fitur utama kontrol
                    halaman:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-neutral-150 bg-neutral-50/50 space-y-1.5">
                      <h5 className="font-bold text-neutral-800 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-primary-650" />
                        Filter Periode Kustom
                      </h5>
                      <p className="text-neutral-500 leading-relaxed text-[11px]">
                        Gunakan filter global di bagian paling atas untuk
                        menyaring data per{" "}
                        <strong>Minggu, Bulan (Januari-Desember)</strong>, dan{" "}
                        <strong>Tahun</strong>. Grafik tren komparatif dan
                        peringkat Top 3 nasabah akan diperbarui secara
                        real-time.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-neutral-150 bg-neutral-50/50 space-y-1.5">
                      <h5 className="font-bold text-neutral-800 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-primary-650" />
                        Peringkat Mitra Teraktif (Top 3)
                      </h5>
                      <p className="text-neutral-500 leading-relaxed text-[11px]">
                        Menampilkan top 3 nasabah pengumpul volume sampah
                        terbesar di setiap peran (Konsumen, Warmindo, Bank
                        Sampah) berdasarkan filter tanggal yang sedang aktif.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FAQ Accordion */}
          <div className="mt-8 border-t border-neutral-200 pt-6">
            <h3 className="font-bold text-xs text-neutral-450 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-neutral-400" />
              Pertanyaan yang Sering Diajukan (FAQ)
            </h3>
            <div className="space-y-2">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="border border-neutral-200 rounded-xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex justify-between items-center p-3 text-left font-bold text-xs text-neutral-800 bg-neutral-50/50 hover:bg-neutral-50 border-0 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-500 transition-transform shrink-0 ml-4 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="p-3 text-xs text-neutral-600 bg-white leading-relaxed border-t border-neutral-150">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
