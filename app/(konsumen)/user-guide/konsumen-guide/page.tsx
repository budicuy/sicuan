"use client";

import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Gift,
  HelpCircle,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";

interface GuideSection {
  id: string;
  title: string;
  subtitle: string;
  icon: import("lucide-react").LucideIcon;
}

export default function KonsumenGuidePage() {
  const [activeSection, setActiveSection] = useState<string>("intro");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const sections: GuideSection[] = [
    {
      id: "intro",
      title: "Pendahuluan",
      subtitle: "Peran Konsumen & lingkungan sirkular",
      icon: BookOpen,
    },
    {
      id: "setor",
      title: "Setor Sampah & AI",
      subtitle: "Cara setor & membaca timbangan digital",
      icon: ShoppingBag,
    },
    {
      id: "points",
      title: "Sistem Poin Sirkular",
      subtitle: "Perhitungan poin linear per Kilogram",
      icon: Award,
    },
    {
      id: "kupon",
      title: "Penukaran Kupon",
      subtitle: "Cara klaim diskon & voucher hadiah",
      icon: Gift,
    },
  ];

  const faqs = [
    {
      q: "Apakah Poin Sirkular Konsumen bisa dicairkan menjadi uang tunai?",
      a: "Poin sirkular konsumen tidak dapat dicairkan menjadi uang tunai langsung. Poin tersebut khusus dirancang untuk ditukarkan dengan berbagai macam produk bermanfaat atau kupon/voucher potongan harga yang tersedia di katalog hadiah menu 'Tukar Kupon'.",
    },
    {
      q: "Bagaimana cara kerja perhitungan Poin Sirkular?",
      a: "Konsumen tidak menggunakan sistem flat-rate (range berat). Setiap gram sampah yang Anda setorkan dihargai secara linear. Misalkan tarif poin adalah 10 poin/Kg, maka jika Anda menyetorkan 1.5 Kg sampah, Anda akan mendapatkan 15 Poin secara akurat.",
    },
    {
      q: "Di mana saya bisa melihat riwayat kupon yang telah saya tukarkan?",
      a: "Kupon yang berhasil Anda tukarkan menggunakan poin akan langsung terbit kode vouchernya. Anda dapat melihat daftar kode kupon aktif tersebut di bagian bawah halaman 'Tukar Kupon'.",
    },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header Board */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Panduan Konsumen
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Panduan lengkap pengumpulan poin sirkular dan penukaran kupon
              hadiah bagi nasabah Konsumen SICUAN.
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
                      ? "bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-xs"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-white text-blue-600 shadow-xs"
                        : "bg-neutral-100 text-neutral-50"
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
                        ? "text-blue-500 translate-x-0.5"
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
                    Peran aktif Konsumen retail dalam menjaga lingkungan.
                  </p>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Selamat datang di portal nasabah{" "}
                  <strong>Konsumen SICUAN</strong>! Melalui portal ini, Anda
                  dapat berpartisipasi langsung dalam memilah dan menyetorkan
                  sampah plastik/karton rumah tangga Anda. Setiap sampah yang
                  berhasil didaur ulang akan dikonversi menjadi{" "}
                  <strong>Poin Sirkular</strong> yang dapat ditukarkan dengan
                  berbagai voucher kupon belanja/retail.
                </p>
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-blue-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    Manfaat untuk Anda:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-neutral-600">
                    <li>
                      Membantu mengurangi penumpukan sampah plastik di
                      lingkungan rumah tangga.
                    </li>
                    <li>
                      Mendapatkan reward Poin Sirkular secara instan untuk
                      setiap gram sampah yang disetorkan.
                    </li>
                    <li>
                      Menukarkan poin dengan produk kupon potongan harga belanja
                      kebutuhan harian.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* 2. SETOR SAMPAH */}
            {activeSection === "setor" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Setor Sampah & AI Vision
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Cara menyetor sampah dan melakukan pemindaian timbangan.
                  </p>
                </div>
                <div className="space-y-3 text-xs text-neutral-600">
                  <p>
                    Unggah foto timbangan digital Anda untuk memudahkan
                    pendataan berat bersih sampah secara otomatis:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      Pilih menu <strong>Setor Sampah</strong> pada navigasi
                      samping.
                    </li>
                    <li>
                      Pilih kategori sampah yang ingin Anda setorkan (Karton,
                      Etiket, atau Paper Cup).
                    </li>
                    <li>
                      Unggah foto timbangan digital yang secara jelas
                      menampilkan angka berat bersih sampah Anda.
                    </li>
                    <li>
                      Teknologi AI akan memindai foto Anda dan memasukkan
                      beratnya secara otomatis. Jika AI tidak mendeteksinya
                      dengan benar, pilih opsi{" "}
                      <strong>Kirim ke Validasi Manual</strong> agar diperiksa
                      secara manual oleh Admin.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* 3. POINTS SYSTEM */}
            {activeSection === "points" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Sistem Poin Sirkular
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Bagaimana poin sirkular Anda dikalkulasi.
                  </p>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  SICUAN menghargai setiap kontribusi kecil Anda dengan sistem{" "}
                  <strong>kalkulasi linear per Kilogram</strong>:
                </p>
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-neutral-800">
                    Aturan Perolehan Poin:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-neutral-500">
                    <li>
                      Tidak ada syarat minimal berat setoran yang ketat, poin
                      langsung dikonversi per gram sampah (linear).
                    </li>
                    <li>
                      Jumlah Poin = Tarif Poin Kategori (Poin/Kg) x Berat Bersih
                      Sampah (Kg).
                    </li>
                    <li>
                      Poin sirkular akan langsung masuk ke akun Anda setelah
                      status setoran berubah menjadi{" "}
                      <strong>&quot;diterima&quot;</strong>.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* 4. TUKAR KUPON */}
            {activeSection === "kupon" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Penukaran Kupon Hadiah
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Cara menukarkan poin sirkular Anda dengan voucher kupon.
                  </p>
                </div>
                <div className="space-y-3 text-xs text-neutral-600">
                  <p>
                    Kumpulkan poin sirkular Anda dan tukarkan dengan berbagai
                    penawaran menarik di menu <strong>Tukar Kupon</strong>:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Katalog Hadiah</strong>: Pilih kupon belanja yang
                      tersedia sesuai jumlah poin yang Anda miliki.
                    </li>
                    <li>
                      <strong>Redeem Voucher</strong>: Klik tombol &quot;Tukar
                      Kupon&quot;, sistem akan mengurangi saldo poin Anda secara
                      otomatis.
                    </li>
                    <li>
                      <strong>Gunakan Voucher</strong>: Kode voucher unik akan
                      langsung terbit di riwayat penukaran bagian bawah halaman.
                      Tunjukkan kode voucher tersebut ke outlet rekanan saat
                      bertransaksi.
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
