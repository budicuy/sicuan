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

export default function WarmiendoGuidePage() {
  const [activeSection, setActiveSection] = useState<string>("intro");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const sections: GuideSection[] = [
    {
      id: "intro",
      title: "Pendahuluan",
      subtitle: "Peran & kemitraan Warmiendo",
      icon: BookOpen,
    },
    {
      id: "setor",
      title: "Setor Sampah & AI",
      subtitle: "Panduan setor & pembacaan otomatis AI",
      icon: ShoppingBag,
    },
    {
      id: "pricing",
      title: "Rentang Berat & Tarif",
      subtitle: "Insentif flat-rate per rentang berat",
      icon: Scale,
    },
    {
      id: "credit",
      title: "Sistem Kredit Rupiah",
      subtitle: "Mendapatkan rupiah langsung tanpa poin",
      icon: Award,
    },
    {
      id: "pencairan",
      title: "Pencairan Saldo & Dokumen",
      subtitle: "Metode transfer, tunai, & unduh surat",
      icon: Coins,
    },
  ];

  const faqs = [
    {
      q: "Mengapa Warmiendo tidak mendapatkan Poin Sirkular seperti nasabah Konsumen?",
      a: "Program kemitraan Warmiendo dirancang khusus untuk memberikan insentif ekonomi produktif secara langsung. Seluruh hasil setoran sampah Anda dikonversi menjadi Kredit Rupiah (saldo kas) yang dapat langsung dicairkan sebagai dana segar untuk mendukung perputaran modal usaha Anda.",
    },
    {
      q: "Berapa lama proses persetujuan pencairan saldo oleh Admin?",
      a: "Setelah Anda mengajukan pencairan saldo di dashboard dan melampirkan foto tanda tangan, Admin SICUAN akan memverifikasi permohonan Anda. Proses transfer bank atau penyiapan dana tunai membutuhkan waktu 1-2 hari kerja.",
    },
    {
      q: "Apa yang harus saya lakukan jika hasil pembacaan timbangan oleh AI tidak akurat?",
      a: "Anda tidak perlu khawatir. Jika pembacaan AI tidak akurat karena kualitas foto atau faktor pencahayaan, silakan pilih opsi 'Kirim ke Validasi Manual'. Petugas kami akan memeriksa foto secara manual dan menginput berat bersih yang benar sesuai timbangan Anda.",
    },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header Board */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Panduan Warmiendo
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Panduan operasional dan pemanfaatan reward saldo kredit bagi mitra
              usaha Warmiendo SICUAN.
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
                      ? "bg-amber-50 text-amber-700 font-bold border border-amber-100 shadow-xs"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-white text-amber-600 shadow-xs"
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
                        ? "text-amber-500 translate-x-0.5"
                        : "text-neutral-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm min-h-125 flex flex-col justify-between">
          <div className="space-y-6">
            {/* 1. PENDAHULUAN */}
            {activeSection === "intro" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Pendahuluan
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Peran strategis Warmiendo dalam ekosistem sirkular.
                  </p>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Warmiendo adalah salah satu pilar utama dalam menyerap kembali
                  sampah kemasan produk (terutama mie instan). Melalui kemitraan
                  ini, setiap sampah plastik yang Anda setorkan (Karton, Etiket,
                  Paper Cup) dikonversi secara langsung menjadi{" "}
                  <strong>insentif ekonomi bernilai rupiah (Kredit)</strong>{" "}
                  untuk menambah modal usaha Anda.
                </p>
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-amber-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    Manfaat untuk Warmiendo:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-neutral-600">
                    <li>
                      Mengubah limbah kemasan warung menjadi tambahan modal
                      operasional.
                    </li>
                    <li>
                      Sistem flat-rate range berat yang sangat menguntungkan
                      untuk setoran harian/mingguan.
                    </li>
                    <li>
                      Opsi pencairan yang fleksibel: Transfer Bank langsung atau
                      Tarik Tunai di lokasi.
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
                    Mempelajari cara menyetor sampah menggunakan aplikasi.
                  </p>
                </div>
                <div className="space-y-3 text-xs text-neutral-600">
                  <p>
                    Unggah foto timbangan digital Anda untuk memudahkan
                    pendataan berat sampah secara otomatis melalui kecerdasan
                    buatan. Langkah setoran:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      Buka menu <strong>Setor Sampah</strong> di dashboard.
                    </li>
                    <li>
                      Pilih jenis sampah: <strong>Karton</strong> (kardus
                      mie/bumbu), <strong>Etiket</strong> (plastik bungkus mie),
                      atau <strong>Paper Cup</strong>.
                    </li>
                    <li>
                      Unggah foto timbangan digital yang memperlihatkan angka
                      berat bersih dengan jelas.
                    </li>
                    <li>
                      AI akan membaca angka timbangan Anda secara otomatis. Jika
                      AI salah membaca, pilih opsi{" "}
                      <strong>Kirim ke Validasi Manual</strong> agar divalidasi
                      manual oleh Admin.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* 3. RANGE BERAT */}
            {activeSection === "pricing" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Rentang Berat & Tarif
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Standardisasi nominal reward per range berat bersih.
                  </p>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  SICUAN menggunakan sistem flat-pricing berbasis{" "}
                  <strong>range berat</strong> untuk memastikan kestabilan dan
                  kemudahan transaksi.
                </p>
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-neutral-800">
                    Cara Kerja Rentang Berat:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-neutral-500">
                    <li>
                      Nominal saldo rupiah disesuaikan dengan rentang berat
                      (contoh: setoran 1.2 Kg masuk ke tier 1–5 Kg, mendapatkan
                      tarif flat tier tersebut).
                    </li>
                    <li>
                      Rentang berat disamakan di semua kategori produk sampah
                      untuk kepraktisan kalkulasi.
                    </li>
                    <li>
                      Petugas Admin berhak melakukan penyesuaian jika timbangan
                      yang diajukan tidak sesuai dengan kondisi fisik sampah
                      pada foto yang diunggah.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* 4. CREDIT SYSTEM */}
            {activeSection === "credit" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-neutral-150 pb-3">
                  <h2 className="text-lg font-black text-neutral-800">
                    Sistem Kredit Rupiah
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Memahami bagaimana reward saldo kredit bertambah.
                  </p>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Berbeda dari nasabah perorangan, Warmiendo{" "}
                  <strong>tidak mengumpulkan poin belanja</strong>. Semua
                  kontribusi penyetoran sampah langsung dikonversi ke dalam
                  bentuk saldo <strong>Kredit</strong> (Rupiah). Saldo Kredit
                  ini bersifat akumulatif dan akan terus bertambah setiap kali
                  setoran sampah Anda berstatus{" "}
                  <strong>&quot;diterima&quot;</strong>.
                </p>
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
                    Prosedur penarikan dana reward modal usaha Anda.
                  </p>
                </div>
                <div className="space-y-3 text-xs text-neutral-600">
                  <p>
                    Tarik saldo Kredit Anda kapan saja melalui menu{" "}
                    <strong>Pencairan Dana</strong>:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Nominal Minimal</strong>: Minimal pencairan dana
                      adalah Rp 10.000.
                    </li>
                    <li>
                      <strong>Tanda Tangan</strong>: Anda wajib melampirkan foto
                      tanda tangan sebagai bukti persetujuan penarikan dana.
                    </li>
                    <li>
                      <strong>Metode Pencairan</strong>:
                      <ul className="list-circle pl-5 mt-1 space-y-1 text-neutral-500">
                        <li>
                          <strong>Transfer Bank</strong>: Saldo dikirim ke
                          rekening bank terdaftar. Anda bisa mengunduh foto
                          bukti transfer asli (tombol{" "}
                          <strong>Lihat Bukti</strong>) dan dokumen surat
                          pertanggungjawaban (tombol{" "}
                          <strong>Unduh Surat</strong>) setelah status pencairan
                          berhasil.
                        </li>
                        <li>
                          <strong>Tunai</strong>: Dana diserahkan tunai. Hanya
                          menampilkan tombol <strong>Unduh Surat</strong> bukti
                          pembayaran saja.
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
