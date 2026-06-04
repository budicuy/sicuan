"use client";

import { Award, ShieldCheck, Truck } from "lucide-react";

export function FeaturesSection() {
  return (
    <section
      id="fitur"
      className="py-24 bg-white border-b border-neutral-200/60 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
          <h2 className="text-xs font-bold text-primary-600 uppercase tracking-widest">
            Kemudahan Pengelolaan Sampah
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Fitur Utama SICUAN Untuk Keberlanjutan
          </h3>
          <p className="text-neutral-500">
            Platform modern yang dirancang untuk mempercepat administrasi
            penyetoran limbah anorganik, pembagian reward, hingga visualisasi
            audit dampak lingkungan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-100/50 transition-all duration-300 group space-y-6">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-neutral-900">
              3 Metode Setoran Fleksibel
            </h4>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Pilihan setoran yang fleksibel untuk berbagai profil. Setor secara
              langsung di drop-point, kirim via ekspedisi rekanan dengan ongkir
              bersubsidi, atau koordinasikan penjemputan massal TPS.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-primary-600 pt-2">
              <span>Setor Langsung &amp; Ekspedisi</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-100/50 transition-all duration-300 group space-y-6">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-neutral-900">
              Sistem Reward Berkeadilan
            </h4>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Skema insentif bervariasi sesuai peranan Anda. Poin belanja kupon
              untuk individu, saldo e-wallet/bank untuk mitra Warmiendo, serta
              kas tunai transfer bernilai khusus untuk Bank Sampah pengolah TPS.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-primary-600 pt-2">
              <span>Poin Kupon &amp; Saldo Rupiah</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-100/50 transition-all duration-300 group space-y-6">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-neutral-900">
              Validasi &amp; Verifikasi Ketat
            </h4>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Seluruh pengajuan setoran melalui proses penimbangan fisik serta
              dokumentasi digital di gudang. Admin memverifikasi via sistem
              secara transparan demi mencegah manipulasi data setoran.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-primary-600 pt-2">
              <span>Aman, Akurat &amp; Terpercaya</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
