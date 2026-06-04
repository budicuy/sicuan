"use client";

import { Mail, MapPin, Phone, Recycle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary-950 text-white pt-16 pb-8 border-t border-primary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-primary-900">
          {/* Brand */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white">
                <Recycle className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                SICUAN
              </span>
            </div>

            <p className="text-xs text-primary-200 max-w-sm leading-relaxed">
              Sistem Informasi Cerdas Ubah Anorganik Jadi Nilai merupakan
              inisiatif pengelolaan daur ulang kemasan limbah anorganik terpadu
              di wilayah Banjarmasin.
            </p>

            <div className="space-y-2 pt-2 text-xs text-primary-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-500" />
                <span>Cabang Banjarmasin, Kalimantan Selatan</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-500" />
                <span>(0511) 3254924 (Jam Operasional 07:00 - 17:00 WITA)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-500" />
                <span>info@sicuan.id</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-bold text-primary-400 uppercase tracking-wider">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2.5 text-xs text-primary-200">
              {[
                { href: "#fitur", label: "Fitur Utama" },
                { href: "#mitra", label: "Skema Kemitraan" },
                { href: "#kalkulator", label: "Kalkulator Estimasi" },
                { href: "#alur", label: "Alur Proses Setoran" },
                { href: "#faq", label: "FAQ" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <a href={href} className="hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-bold text-primary-400 uppercase tracking-wider">
              Informasi &amp; Regulasi
            </h4>
            <p className="text-xs text-primary-200 leading-relaxed">
              Platform SICUAN dikembangkan untuk mendukung kebijakan lingkungan
              ESG nasional, mengurangi sampah anorganik sekali pakai dari
              kemasan plastik produk kami.
            </p>
            <div className="bg-primary-900 border border-primary-800 rounded-xl p-3.5 text-[10px] text-primary-200">
              <span>
                Terverifikasi Sistem Mutu &amp; Standar Keamanan Data
                Perusahaan.
              </span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-primary-300 gap-4">
          <span>
            &copy; {new Date().getFullYear()} SICUAN Banjarmasin. All rights
            reserved.
          </span>
          <div className="flex gap-6">
            <a href="#fitur" className="hover:text-white transition-colors">
              Kebijakan Privasi
            </a>
            <a href="#fitur" className="hover:text-white transition-colors">
              Syarat &amp; Ketentuan
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
