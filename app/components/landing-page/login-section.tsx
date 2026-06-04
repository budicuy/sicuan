"use client";

import { Clock, FileText, Lock, ShieldCheck } from "lucide-react";

export function LoginSection() {
  return (
    <section
      id="login"
      className="py-24 bg-white border-t border-b border-neutral-200/60 scroll-mt-20 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-tr from-primary-900 to-emerald-950 rounded-[2rem] text-white p-8 sm:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <span className="text-xs font-bold text-primary-300 uppercase tracking-widest block">
                Gerbang Akses Sistem
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Siap Mengubah Limbah Jadi Nilai?
              </h2>
              <p className="text-primary-100 leading-relaxed">
                Masuk ke dashboard personal Anda untuk memantau tabungan setoran
                sampah, menukarkan poin, mengajukan resi ekspedisi, atau
                melakukan pencairan dana tunai.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a
                  id="hero-cta-login"
                  href="#masuk"
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-center rounded-xl transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/25"
                >
                  Masuk ke Dashboard
                </a>
                <a
                  id="hero-cta-support"
                  href="#faq"
                  className="px-8 py-4 bg-transparent border border-white/30 hover:border-white text-white text-center font-bold rounded-xl transition-all"
                >
                  Hubungi Dukungan
                </a>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10 space-y-4">
              <h4 className="font-bold text-lg text-emerald-300">
                Akses Cepat &amp; Keamanan Terjaga
              </h4>
              <p className="text-xs text-primary-100 leading-relaxed">
                Sistem SICUAN menggunakan autentikasi enkripsi tingkat tinggi
                untuk mengamankan data profil, histori tabungan saldo sampah,
                dan informasi rekening perbankan Anda.
              </p>
              <div className="h-px bg-white/10 my-4" />
              <div className="grid grid-cols-2 gap-4 text-xs font-medium text-primary-100">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Data Akun Terenkripsi</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Akses Portal Terlindungi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Akses Layanan 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Pencatatan Transparan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
