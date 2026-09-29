"use client";

import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Coins,
  HelpCircle,
  Scale,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";

interface GuideSection {
  id: string;
  title: string;
  subtitle: string;
  icon: import("lucide-react").LucideIcon;
}

export default function BankSampahGuidePage() {
  const [activeSection, setActiveSection] = useState<string>("intro");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const sections: GuideSection[] = [
    {
      id: "intro",
      title: "Pendahuluan",
      subtitle: "Peran & gambaran umum Bank Sampah",
      icon: BookOpen,
    },
    {
      id: "setor",
      title: "Mekanisme Setoran & AI",
      subtitle: "Cara menyetor sampah & verifikasi AI",
      icon: ShoppingBag,
    },
    {
      id: "pricing",
      title: "Standardisasi Harga & Range",
      subtitle: "Sistem flat-rate range berat & kategori",
      icon: Scale,
    },
    {
      id: "reward",
      title: "Poin vs Kredit (Reward Ganda)",
      subtitle: "Akumulasi poin linear & kredit tunai",
      icon: Award,
    },
    {
      id: "pencairan",
      title: "Pencairan Saldo & Dokumen",
      subtitle: "Panduan transfer bank, tunai & TTD",
      icon: Coins,
    },
  ];

  const faqs = [
    {
      q: "Bagaimana jika kamera HP saya buram dan AI gagal mendeteksi berat sampah?",
      a: "Jika sistem AI vision gagal membaca angka timbangan dari foto Anda, Anda dapat memilih opsi untuk mengirimkan setoran ke antrean validasi manual. Setoran akan berstatus 'Pending' dan petugas Admin SICUAN akan memvalidasinya secara manual dalam waktu 1-2 hari kerja.",
    },
    {
      q: "Mengapa nominal saldo kredit saya menggunakan range berat sedangkan poin dihitung per kg?",
      a: "Untuk mendukung pengumpulan volume besar, saldo uang tunai (kredit) menggunakan sistem flat-rate (contoh: 1–5 Kg dihargai sama). Sedangkan poin sirkular diberikan secara linear per kilogram (misal: 10 poin per Kg) agar tetap memberikan apresiasi presisi untuk setiap gram sampah tambahan yang Anda setorkan.",
    },
    {
      q: "Berapa batas nominal pencairan saldo kredit di Bank Sampah?",
      a: "Batas minimal pengajuan pencairan saldo kredit adalah Rp 10.000. Pastikan Anda sudah melengkapi informasi rekening bank di menu 'Profil Saya' jika memilih metode pembayaran Transfer, atau Anda bisa langsung memilih metode Tunai.",
    },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header Board */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Panduan Bank Sampah
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Panduan operasional dan alur bisnis khusus untuk Mitra Pengumpul
              Bank Sampah SICUAN.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar */}
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
                      ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-xs"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-white text-emerald-600 shadow-xs"
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
                        ? "text-emerald-500 translate-x-0.5"
                        : "text-neutral-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm min-h-[500px] flex flex-col justify-between">
          <div className="space-y-6">
            {/* 1. PENDAHULUAN */}
            {activeSection === "intro" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Pendahuluan
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Peran strategis Bank Sampah dalam SICUAN.
                  </p>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Sebagai mitra <strong>Bank Sampah</strong>, Anda berperan
                  sebagai pengumpul volume besar dalam rantai pasok sirkular.
                  Berbeda dari peran nasabah lainnya, Bank Sampah mendapatkan{" "}
                  <strong>apresiasi ganda</strong> berupa poin sirkular dan
                  saldo kredit uang tunai.
                </p>
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <Award className="w-4.5 h-4.5" />
                    Keunggulan Hak Istimewa Bank Sampah:
                  </h4>
                  <ul className="list-disc pl-5 text-[11px] text-neutral-600 space-y-1">
                    <li>
                      Mendapatkan harga sirkular yang terstandardisasi per
                      kategori sampah.
                    </li>
                    <li>
                      Mendapatkan poin linear untuk ditukarkan dengan berbagai
                      kupon retail/belanja menarik.
                    </li>
                    <li>
                      Mendapatkan saldo kredit rupiah yang dapat dicairkan
                      langsung ke rekening bank terdaftar atau ditarik tunai.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* 2. MEKANISME SETORAN */}
            {activeSection === "setor" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Mekanisme Setoran & Verifikasi AI
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Langkah penyetoran sampah yang tepat menggunakan asisten
                    digital.
                  </p>
                </div>
                <div className="space-y-3 text-xs text-neutral-600">
                  <p>
                    Setiap setoran sampah (Karton, Etiket, atau Paper Cup)
                    diverifikasi dengan teknologi AI Vision untuk membaca foto
                    berat bersih pada timbangan digital secara otomatis.
                    Langkah-langkah penyetoran:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      Pilih menu <strong>Setor Sampah</strong>, lalu pilih
                      kategori sampah yang ingin Anda setorkan.
                    </li>
                    <li>
                      Pilih/input tanggal penyetoran sampah (bisa diisi manual
                      sesuai tanggal setor aktual).
                    </li>
                    <li>
                      Unggah foto timbangan digital yang secara jelas
                      memperlihatkan digit angka berat bersih (Kg) beserta fisik
                      sampah di atasnya.
                    </li>
                    <li>
                      Sistem AI akan otomatis membaca berat bersih dalam
                      hitungan detik. Jika pembacaan AI tidak sesuai, Anda bisa
                      mengirimkannya ke antrean{" "}
                      <strong>Validasi Manual Admin</strong>.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* 3. PRICING & RANGE */}
            {activeSection === "pricing" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Standardisasi Harga & Range Berat
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Bagaimana nominal rupiah dihitung berdasarkan tier berat
                    bersih.
                  </p>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  SICUAN menerapkan <strong>flat-rate range berat</strong> untuk
                  memberikan insentif berkelanjutan bagi pengumpulan sampah
                  berskala besar.
                </p>
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-neutral-850">
                    Aturan Penentuan Harga:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-neutral-500">
                    <li>
                      Penghitungan saldo rupiah menggunakan rentang berat
                      (misal: 1–5 Kg mendapatkan harga yang sama).
                    </li>
                    <li>
                      Harga yang berlaku diseragamkan di ketiga kategori utama:{" "}
                      <strong>Karton, Etiket, dan Paper Cup</strong>.
                    </li>
                    <li>
                      Jika berat setoran melebihi atau tidak tercakup dalam
                      range tarif yang aktif, sistem akan mengarahkan transaksi
                      ke validasi khusus Admin untuk menghindari overlap tarif.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* 4. REWARD DOUBLE */}
            {activeSection === "reward" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Poin vs Kredit (Reward Ganda)
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Mempelajari cara sistem mengkalkulasi insentif Anda.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 space-y-2">
                    <h4 className="font-bold text-blue-800">
                      ⭐ Poin Sirkular
                    </h4>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Diberikan secara linear (misal: 10 Poin per Kg). Total
                      poin yang didapatkan = berat bersih (Kg) x tarif poin per
                      Kg. Poin dapat ditukarkan di menu{" "}
                      <strong>Tukar Kupon</strong>.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 space-y-2">
                    <h4 className="font-bold text-emerald-800">
                      💸 Kredit Saldo Rupiah
                    </h4>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Dihitung berdasarkan tier berat bersih yang disetorkan.
                      Saldo kredit rupiah ini dapat dicairkan langsung ke
                      rekening bank pribadi Anda secara instan.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. PENCAIRAN SALDO */}
            {activeSection === "pencairan" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Pencairan Saldo & Dokumen
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Panduan verifikasi, pengisian tanda tangan, dan pengunduhan
                    bukti transaksi.
                  </p>
                </div>
                <div className="space-y-3 text-xs text-neutral-600">
                  <p>
                    Anda dapat mencairkan reward saldo kredit di menu{" "}
                    <strong>Pencairan Dana</strong>. Alur proses pencairan:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Minimal Penarikan</strong>: Nominal pencairan
                      minimal adalah Rp 10.000.
                    </li>
                    <li>
                      <strong>Tanda Tangan Digital (TTD)</strong>: Anda wajib
                      mengunggah foto tanda tangan asli sebagai prasyarat sah
                      pengajuan pencairan dana.
                    </li>
                    <li>
                      <strong>Metode Transfer & Tunai</strong>:
                      <ul className="list-circle pl-5 mt-1 space-y-1 text-neutral-500">
                        <li>
                          Jika menggunakan <strong>Transfer</strong>, pastikan
                          rekening bank terdaftar di Profil Saya. Setelah Admin
                          menyetujui, Anda akan mendapatkan tombol{" "}
                          <strong>Lihat Bukti</strong> (foto bukti transfer) dan{" "}
                          <strong>Unduh Surat</strong>.
                        </li>
                        <li>
                          Jika menggunakan <strong>Tunai</strong>, tidak ada
                          foto bukti transfer, melainkan hanya tombol{" "}
                          <strong>Unduh Surat</strong> resmi sebagai bukti
                          penarikan kas.
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* FAQ */}
          <div className="mt-8 border-t border-neutral-200 pt-6">
            <h3 className="font-bold text-xs text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <HelpCircle className="w-4.5 h-4.5" />
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
