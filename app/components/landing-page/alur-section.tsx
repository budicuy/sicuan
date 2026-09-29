"use client";

import { Coins, FileText, Recycle, ShieldCheck } from "lucide-react";

export function AlurSection() {
  return (
    <section id="alur" className="py-24 bg-primary-50/20 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
          <h2 className="text-xs font-bold text-primary-600 uppercase tracking-widest">
            Langkah Sederhana Bergabung
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Bagaimana Sistem SICUAN Bekerja?
          </h3>
          <p className="text-neutral-500">
            Proses penyetoran dirancang dengan alur pelaporan yang mudah dan
            transparan. Ikuti 4 langkah mudah berikut ini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Step 1 */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 relative flex flex-col justify-between group hover:border-primary-400 transition-all duration-300">
            <span className="absolute top-4 right-4 text-4xl font-extrabold text-neutral-100 group-hover:text-primary-100 transition-colors">
              01
            </span>
            <div className="space-y-4 pt-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                <Recycle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-neutral-900 text-lg">
                Pilah &amp; Kumpulkan
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Pilah sampah anorganik berupa kemasan plastik mie instan, gelas
                kertas makanan instan, atau karton luar di tempat Anda.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 relative flex flex-col justify-between group hover:border-primary-400 transition-all duration-300">
            <span className="absolute top-4 right-4 text-4xl font-extrabold text-neutral-100 group-hover:text-primary-100 transition-colors">
              02
            </span>
            <div className="space-y-4 pt-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-neutral-900 text-lg">
                Input Data Form
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Login ke aplikasi SICUAN, masukkan estimasi jenis dan berat
                sampah, serta pilih metode pengiriman/setoran.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 relative flex flex-col justify-between group hover:border-primary-400 transition-all duration-300">
            <span className="absolute top-4 right-4 text-4xl font-extrabold text-neutral-100 group-hover:text-primary-100 transition-colors">
              03
            </span>
            <div className="space-y-4 pt-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-neutral-900 text-lg">
                Verifikasi Fisik
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Sampah yang diterima di drop-point akan ditimbang dan divalidasi
                oleh Admin gudang kami demi keamanan pencatatan.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 relative flex flex-col justify-between group hover:border-primary-400 transition-all duration-300">
            <span className="absolute top-4 right-4 text-4xl font-extrabold text-neutral-100 group-hover:text-primary-100 transition-colors">
              04
            </span>
            <div className="space-y-4 pt-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Coins className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-neutral-900 text-lg">
                Klaim Keuntungan
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Poin kupon otomatis bertambah (Konsumen), atau saldo Rupiah
                ditambahkan dan siap ditarik ke rekening (Mitra).
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
