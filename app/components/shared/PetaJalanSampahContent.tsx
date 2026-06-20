"use client";

import {
  Building,
  Building2,
  ChevronRight,
  Coins,
  Factory,
  Home,
  Layers,
  Network,
  Recycle,
  Scale,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingUp,
  Truck,
  Utensils,
  Wallet,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface PetaJalanSampahContentProps {
  userRole?: "admin" | "superadmin" | "bank-sampah" | "konsumen" | "warmiendo";
}

// Node types
type SumberType = "rumah_tangga" | "nasabah_bank" | "warmindo" | "nasabah_tps";
type KelolaType = "perusahaan" | "bank_sampah" | "bank_sampah_induk" | "tps_3r";
type PengelolaanType = "pilah_timbang" | "pilah" | "timbang_olah";
type TujuanType = "produk_olahan" | "tpa";

export function PetaJalanSampahContent({
  userRole = "admin",
}: PetaJalanSampahContentProps) {
  // Selections state
  const [sumber, setSumber] = useState<SumberType>(() => {
    if (userRole === "konsumen") return "rumah_tangga";
    if (userRole === "warmiendo") return "warmindo";
    if (userRole === "bank-sampah") return "nasabah_bank";
    return "rumah_tangga";
  });
  const [kelola, setKelola] = useState<KelolaType>(() => {
    if (userRole === "warmiendo") return "perusahaan";
    return "bank_sampah";
  });
  const [pengelolaan, setPengelolaan] = useState<PengelolaanType>(() => {
    if (userRole === "warmiendo") return "timbang_olah";
    return "pilah_timbang";
  });
  const [tujuan, setTujuan] = useState<TujuanType>("produk_olahan");

  // Step tabs - Step 1 active by default
  const [activeStep, setActiveStep] = useState<number | null>(1);

  const handleSumberChange = (key: SumberType) => {
    setSumber(key);
    if (key === "rumah_tangga") {
      setKelola("bank_sampah");
      setPengelolaan("pilah_timbang");
      setTujuan("produk_olahan");
    } else if (key === "warmindo") {
      setKelola("perusahaan");
      setPengelolaan("timbang_olah");
      setTujuan("produk_olahan");
    } else if (key === "nasabah_bank") {
      setKelola("bank_sampah_induk");
      setPengelolaan("pilah_timbang");
      setTujuan("produk_olahan");
    } else if (key === "nasabah_tps") {
      setKelola("tps_3r");
      setPengelolaan("timbang_olah");
      setTujuan("produk_olahan");
    }
  };

  // Configuration data definitions
  const sumberOptions = {
    rumah_tangga: {
      label: "Rumah Tangga",
      desc: "Sumber utama sampah domestik harian yang dihasilkan langsung dari sisa konsumsi rumah tangga keluarga. Aliran ini mencakup berbagai jenis material anorganik bernilai guna seperti botol plastik PET (Polyethylene Terephthalate), botol kaca, kardus kemasan, kaleng aluminium, wadah plastik HDPE (High-Density Polyethylene), kertas koran, serta kemasan deterjen cair. Pemilahan sejak dari tingkat rumah tangga sangatlah kritikal; jika sampah tidak dipilah sejak awal, material berharga akan terkontaminasi oleh sampah organik basah dan sisa makanan, sehingga nilainya turun drastis dan menjadikannya sulit didaur ulang, yang pada akhirnya mempercepat kepunahan kapasitas TPA setempat.",
      icon: Home,
      score: 10,
      badge: "Individu",
    },
    nasabah_bank: {
      label: "Nasabah Bank Sampah",
      desc: "Sampah anorganik terpilah kualitas premium yang disetorkan oleh nasabah perorangan, sekolah, atau instansi yang telah sadar lingkungan ke unit Bank Sampah terdekat. Material yang terkumpul meliputi plastik jenis kerasan (botol air, mainan rusak), plastik lembaran (kantong belanja bersih), kertas dokumen/arsip, logam tembaga, besi tua, hingga minyak jelantah. Transaksi penyetoran ini dicatat dalam buku tabungan digital atau aplikasi, di mana nasabah mendapatkan kompensasi finansial berupa saldo uang elektronik atau poin loyalty. Sistem ini berhasil mengubah paradigma sampah menjadi komoditas ekonomi bernilai tinggi serta menstimulasi partisipasi aktif sirkularitas berbasis warga.",
      icon: Coins,
      score: 20,
      badge: "Komunitas",
    },
    warmindo: {
      label: "Sampah Warmindo",
      desc: "Aliran limbah komersial spesifik hasil operasional harian warung makan Warmindo yang memiliki karakteristik volume tinggi dan terpusat. Didominasi oleh bungkus mi instan kosong yang terbuat dari bahan plastik kemasan multilapis (multi-layered plastic/MLP/alufoil) yang secara historis sulit didaur ulang secara mekanis konvensional. Selain itu, terdapat juga limbah karton tebal bekas dus pembungkus mi instan, botol kecap manis plastik/kaca, botol saus cabai, kaleng bekas krimer kental manis, serta botol plastik minuman kemasan teh dan air mineral. Aliran sampah ini membutuhkan intervensi pengumpulan yang teratur karena memiliki potensi polusi visual dan lingkungan yang besar jika dibiarkan menumpuk.",
      icon: Utensils,
      score: 15,
      badge: "Mitra Bisnis",
    },
    nasabah_tps: {
      label: "Nasabah TPS 3R",
      desc: "Material sampah yang bersumber dari pengumpulan wilayah pemukiman terpadu (skala RW atau Kelurahan) yang dikirimkan ke fasilitas Tempat Pengolahan Sampah 3R (Reduce, Reuse, Recycle). Di fasilitas ini, sampah dari warga mengalami proses penyaringan sekunder yang ketat oleh petugas terlatih menggunakan meja sortir. Sampah dipilah menjadi tiga fraksi utama: sampah organik untuk pembuatan kompos/pakan maggot Black Soldier Fly (BSF), sampah anorganik bernilai ekonomis untuk dikirim ke rantai daur ulang, dan sisa residu yang benar-benar tidak dapat diolah lagi. Jalur ini menjadi benteng pertahanan krusial dalam mengurangi beban volume angkut dinas kebersihan kota.",
      icon: Building2,
      score: 20,
      badge: "Wilayah",
    },
  };

  const kelolaOptions = {
    perusahaan: {
      label: "Perusahaan (Corporate)",
      desc: "Tata kelola profesional oleh produsen swasta atau industri manufaktur melalui komitmen Tanggung Jawab Produsen yang Diperluas atau EPR (Extended Producer Responsibility). Perusahaan menginvestasikan dana untuk menyediakan dropbox pengumpulan kemasan pasca-konsumsi di tempat umum atau bekerja sama dengan rantai logistik terbalik (reverse logistics) untuk mengangkut kembali botol, kaleng, atau karton multi-layer mereka. Langkah ini memastikan produsen bertanggung jawab penuh atas daur hidup produknya (cradle-to-cradle), meningkatkan efisiensi daur ulang industri skala makro, serta mengurangi emisi karbon korporasi secara terukur.",
      icon: Building,
      score: 15,
    },
    bank_sampah: {
      label: "Bank Sampah Unit",
      desc: "Lembaga pengelola sampah mandiri di tingkat tapak (RT, RW, Dusun, atau Sekolah) yang dijalankan oleh pengurus komunitas relawan setempat. Berfungsi sebagai garda terdepan edukasi pemilahan sampah di masyarakat bawah. Bank Sampah Unit menyelenggarakan hari penimbangan terjadwal (misalnya setiap akhir pekan), menerima setoran sampah terpilah dari nasabah, melakukan klasifikasi jenis material secara mendetail, dan menyimpan tabungan nasabah. Kegiatan ini berkontribusi langsung pada penciptaan kohesi sosial, peningkatan literasi keuangan mikro warga, serta pengurangan volume sampah secara lokal sebelum sempat masuk ke sistem pengangkutan kota.",
      icon: Wallet,
      score: 25,
    },
    bank_sampah_induk: {
      label: "Bank Sampah Induk",
      desc: "Fasilitas konsolidasi sentral tingkat kota atau kabupaten yang menerima pasokan material anorganik dalam jumlah tonase besar (bulk) dari ratusan Bank Sampah Unit. Dikelola dengan struktur manajemen profesional, Bank Sampah Induk memiliki kapasitas untuk melakukan pemrosesan tingkat lanjut seperti pengepresan (baling), pemotongan, atau penggilingan sampah plastik. Karena mengumpulkan volume berskala industri, Bank Sampah Induk memiliki posisi tawar yang kuat dalam menentukan harga pasar dengan pabrik manufaktur daur ulang utama, sekaligus menjembatani logistik yang efisien antara pengumpul akar rumput dan industri manufaktur besar.",
      icon: Network,
      score: 25,
    },
    tps_3r: {
      label: "TPS 3R",
      desc: "Fasilitas pemrosesan sampah berbasis masyarakat (Community-Based Waste Management) yang didirikan oleh pemerintah daerah dan dikelola oleh Kelompok Swadaya Masyarakat (KSM) lokal. Menggunakan pendekatan teknologi tepat guna yang ramah lingkungan. Di TPS 3R, pemrosesan dilakukan secara harian untuk membagi aliran sampah organik (dimanfaatkan untuk pembuatan pupuk organik padat/cair maupun budidaya maggot BSF) dan sampah anorganik (disalurkan ke lapak daur ulang). TPS 3R berfungsi sangat strategis untuk mencegah terjadinya penumpukan sampah di tempat penampungan sementara pinggir jalan dan menekan biaya pembuangan akhir.",
      icon: Factory,
      score: 20,
    },
  };

  const pengelolaanOptions = {
    pilah_timbang: {
      label: "Pilah & Timbang",
      desc: "Metode pengelolaan yang sangat terstruktur dan presisi tinggi menggunakan integrasi teknologi pencatatan. Sampah anorganik disortir secara manual ke dalam lebih dari 15 kategori spesifik (seperti kertas HVS, kardus, plastik PET bening, plastik HDPE warna, kaleng seng, tembaga, dll.) oleh nasabah atau petugas. Setelah itu, berat material diukur menggunakan timbangan digital presisi tinggi yang telah dikalibrasi secara berkala. Hasil penimbangan langsung diinput ke dalam database cloud sistem informasi, di mana berat sampah dikonversi menjadi saldo poin digital secara otomatis. Proses ini memastikan akurasi data sirkularitas, transparansi transaksi ekonomi, dan kepuasan nasabah.",
      icon: Scale,
      score: 25,
    },
    pilah: {
      label: "Pilah Saja",
      desc: "Metode pengelolaan konvensional dengan tingkat kerumitan minimal yang berfokus pada pengelompokan dasar sampah ke dalam beberapa wadah terpisah (misalnya wadah plastik, kertas, logam, dan residu). Pemilahan dilakukan secara visual tanpa menggunakan alat ukur berat digital ataupun pencatatan data transaksi real-time. Meskipun mudah dan murah diimplementasikan di wilayah yang baru memulai program kebersihan, ketiadaan penimbangan menyulitkan pemantauan efektivitas volume daur ulang secara akurat dan tidak dapat mendukung program reward finansial interaktif yang memotivasi warga.",
      icon: Layers,
      score: 15,
    },
    timbang_olah: {
      label: "Timbang & Olah (Kreatif)",
      desc: "Metode pengelolaan lanjutan di mana material yang telah disortir dan ditimbang tidak hanya dijual mentah, melainkan langsung diolah menjadi produk jadi atau setengah jadi bernilai tambah tinggi di lokasi fasilitas pengelolaan. Sampah kertas diolah kembali menjadi bubur kertas untuk kerajinan seni; plastik jenis tertentu dicacah menggunakan mesin shredder menjadi flakes (pelet plastik kasar) siap cetak; kemasan multilapis disulap menjadi tas belanja tangguh, dompet, atau papan partisi bangunan (eco-board). Metode kreatif ini memaksimalkan keuntungan ekonomi lokal, membuka lapangan kerja baru bagi warga sekitar, serta memangkas jejak karbon transportasi logistik pengiriman sampah.",
      icon: Wrench,
      score: 30,
    },
  };

  const tujuanOptions = {
    produk_olahan: {
      label: "Produk Olahan (Upcycle)",
      desc: "Jalur ideal pemrosesan sirkular di mana material anorganik dikirim langsung ke industri daur ulang, pabrik peleburan logam, atau studio desain kreatif. Di sini, material mengalami transformasi fisik dan kimia: botol plastik PET dilelehkan dan dipintal menjadi serat polyester untuk pakaian olahraga; kertas koran bekas didaur ulang menjadi kardus kemasan baru; kaleng aluminium dilebur kembali menjadi bagian otomotif atau kaleng baru tanpa penurunan kualitas material. Langkah ini menghemat penggunaan energi fosil hingga 80%, menghemat konsumsi air bersih secara signifikan, menekan emisi gas rumah kaca, serta menjaga kelestarian sumber daya alam bumi dari eksploitasi berlebihan.",
      icon: ShoppingBag,
      score: 30,
    },
    tpa: {
      label: "Diproses ke TPA",
      desc: "Jalur linier konvensional di mana sampah diangkut secara borongan menggunakan truk pengangkut sampah kota untuk dibuang ke Tempat Pemrosesan Akhir (TPA) regional. Di lokasi TPA, sampah diletakkan begitu saja di hamparan tanah terbuka (open dumping) atau ditimbun tanah secara berkala (sanitary landfill). Karena sampah anorganik tidak terurai secara biologis, penumpukan ini secara konstan menyita lahan produktif, menimbulkan bau menyengat, menghasilkan air lindi (leachate) beracun yang merembes ke air tanah warga, serta menjadi sumber kebakaran akibat gas metana yang terperangkap. Jalur ini menunjukkan kegagalan total sistem pengelolaan sampah yang membebani APBD kota untuk biaya angkut dan pengelolaan dampak lingkungan.",
      icon: Truck,
      score: 5,
    },
  };

  // Get current objects
  const curSumber = sumberOptions[sumber];
  const curKelola = kelolaOptions[kelola];
  const curPengelolaan = pengelolaanOptions[pengelolaan];
  const curTujuan = tujuanOptions[tujuan];

  // Calculate Eco Score
  const rawScore =
    curSumber.score + curKelola.score + curPengelolaan.score + curTujuan.score;
  const _ecoScore = Math.min(100, rawScore);

  // Personalization banner messages
  const getWelcomeText = () => {
    switch (userRole) {
      case "admin":
      case "superadmin":
        return "Sebagai Administrator Dashboard, Anda dapat memantau dan merancang simulasi peta jalan sampah ini untuk meminimalkan penumpukan di TPA.";
      case "bank-sampah":
        return "Sebagai Mitra Bank Sampah, peran utama Anda berada pada pengelolaan penimbangan dan penyaluran sampah bernilai guna.";
      case "konsumen":
        return "Sebagai Konsumen Utama, alur sampah Anda dimulai dari pemilahan sampah organik & anorganik secara mandiri di rumah tangga.";
      case "warmiendo":
        return "Sebagai Mitra Warmiendo, Anda berkontribusi besar melacak kemasan produk mi instan dan karton untuk dialirkan kembali ke rantai daur ulang.";
      default:
        return "Simulasikan pergerakan alur sampah Anda mulai dari sumber awal hingga proses akhirnya.";
    }
  };

  return (
    <div className="space-y-6 pb-4 animate-in fade-in duration-350">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-primary-100/35 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center shadow-md shrink-0">
            <Image
              src="/logo.png"
              alt="SICUAN Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Peta Jalan <span className="text-blue-600">Sampah Anorganik</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5 max-w-2xl font-medium">
              {getWelcomeText()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-xl text-blue-700 text-xs font-bold border border-blue-100 shrink-0 self-stretch md:self-auto justify-center">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Interactive Simulator</span>
        </div>
      </div>

      {/* Main Single Grid Container */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-6">
        {/* Top Part: Visual Map */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-neutral-850 flex items-center gap-2 text-neutral-850">
              <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
              Alur Perjalanan Sampah Aktif
            </h2>
            <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-md font-medium">
              Live Flow
            </span>
          </div>

          {/* Quick Preset Selector */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-6 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Pilih Preset Alur
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSumber("rumah_tangga");
                  setKelola("bank_sampah");
                  setPengelolaan("pilah_timbang");
                  setTujuan("produk_olahan");
                }}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${
                  sumber === "rumah_tangga" &&
                  kelola === "bank_sampah" &&
                  pengelolaan === "pilah_timbang" &&
                  tujuan === "produk_olahan"
                    ? "bg-blue-600 text-white border-primary-600 shadow-sm"
                    : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                Alur Konsumen
              </button>
              <button
                type="button"
                onClick={() => {
                  setSumber("warmindo");
                  setKelola("perusahaan");
                  setPengelolaan("timbang_olah");
                  setTujuan("produk_olahan");
                }}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${
                  sumber === "warmindo" &&
                  kelola === "perusahaan" &&
                  pengelolaan === "timbang_olah" &&
                  tujuan === "produk_olahan"
                    ? "bg-blue-600 text-white border-primary-600 shadow-sm"
                    : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                Alur Warmiendo
              </button>
              <button
                type="button"
                onClick={() => {
                  setSumber("nasabah_bank");
                  setKelola("bank_sampah");
                  setPengelolaan("pilah_timbang");
                  setTujuan("produk_olahan");
                }}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${
                  sumber === "nasabah_bank" &&
                  kelola === "bank_sampah" &&
                  pengelolaan === "pilah_timbang" &&
                  tujuan === "produk_olahan"
                    ? "bg-blue-600 text-white border-primary-600 shadow-sm"
                    : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                Alur Bank Sampah
              </button>
              <button
                type="button"
                onClick={() => {
                  setSumber("nasabah_tps");
                  setKelola("tps_3r");
                  setPengelolaan("timbang_olah");
                  setTujuan("produk_olahan");
                }}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${
                  sumber === "nasabah_tps" &&
                  kelola === "tps_3r" &&
                  pengelolaan === "timbang_olah" &&
                  tujuan === "produk_olahan"
                    ? "bg-blue-600 text-white border-primary-600 shadow-sm"
                    : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                Alur TPS 3R
              </button>
            </div>
          </div>

          {/* Desktop Flow Diagram — Pure CSS, no SVG */}
          <div className="hidden md:block mb-8">
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-2xs p-6 pt-10 pb-10">
              {/* ── ROW 1: Labels ── */}
              <div className="grid grid-cols-3 gap-x-0 mb-3">
                {/* Step 1 Label */}
                <div className="flex flex-col justify-end items-center text-center h-12 px-2">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                    Step 1: Sumber
                  </span>
                  <span
                    className={`text-[10px] font-black ${
                      activeStep === 1 ? "text-blue-600" : "text-neutral-600"
                    }`}
                  >
                    {curSumber.label}
                  </span>
                </div>

                {/* Step 2 Label */}
                <div className="flex flex-col justify-end items-center text-center h-12 px-2">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                    Step 2: Pengelola
                  </span>
                  <span
                    className={`text-[10px] font-black ${
                      activeStep === 2 ? "text-blue-600" : "text-neutral-600"
                    }`}
                  >
                    {curKelola.label}
                  </span>
                </div>

                {/* Step 3 Label */}
                <div className="flex flex-col justify-end items-center text-center h-12 px-2">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                    Step 3: Metode
                  </span>
                  <span
                    className={`text-[10px] font-black ${
                      activeStep === 3 ? "text-blue-600" : "text-neutral-600"
                    }`}
                  >
                    {curPengelolaan.label}
                  </span>
                </div>
              </div>

              {/* ── ROW 1: Circles & Connectors ── */}
              <div className="relative">
                {/* Connector 1→2→3 */}
                <div className="absolute top-1/2 left-[16.67%] right-[16.67%] h-[3px] bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 -translate-y-1/2 z-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 animate-pulse opacity-60 rounded-full" />
                </div>

                <div className="grid grid-cols-3 gap-x-0">
                  {/* Circle 1 */}
                  <div className="flex justify-center relative z-10 px-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                        activeStep === 1
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110 ring-4 ring-blue-100"
                          : "bg-white text-neutral-500 border-2 border-neutral-200 hover:border-blue-400 hover:text-blue-600"
                      }`}
                    >
                      <curSumber.icon className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-[8px] border border-white">
                        1
                      </span>
                    </button>
                  </div>

                  {/* Circle 2 */}
                  <div className="flex justify-center relative z-10 px-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                        activeStep === 2
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110 ring-4 ring-blue-100"
                          : "bg-white text-neutral-500 border-2 border-neutral-200 hover:border-blue-400 hover:text-blue-600"
                      }`}
                    >
                      <curKelola.icon className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-[8px] border border-white">
                        2
                      </span>
                    </button>
                  </div>

                  {/* Circle 3 */}
                  <div className="flex justify-center relative z-10 px-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                        activeStep === 3
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110 ring-4 ring-blue-100"
                          : "bg-white text-neutral-500 border-2 border-neutral-200 hover:border-blue-400 hover:text-blue-600"
                      }`}
                    >
                      <curPengelolaan.icon className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-[8px] border border-white">
                        3
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── VERTICAL CONNECTOR on the right side (Node 3 ↓ Node 4) ── */}
              <div className="relative h-8">
                <div className="absolute top-0 bottom-0 left-[83.33%] w-[3px] bg-gradient-to-b from-blue-600 to-blue-700 -translate-x-1/2 z-0">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-600 to-blue-700 animate-pulse opacity-60 rounded-full" />
                </div>
              </div>

              {/* ── ROW 2: Circles & Connectors (Right to Left / Left to Right layout in grid) ── */}
              <div className="relative">
                {/* Connector 4←5←InfoCard */}
                <div className="absolute top-[28px] left-[16.67%] right-[16.67%] h-[3px] bg-gradient-to-l from-blue-500 via-blue-600 to-neutral-200 -translate-y-1/2 z-0">
                  <div className="absolute inset-0 bg-gradient-to-l from-blue-500 via-blue-600 to-neutral-200 animate-pulse opacity-60 rounded-full" />
                </div>

                <div className="grid grid-cols-3 gap-x-0 items-start">
                  {/* Column 1: Info Card */}
                  <div className="flex justify-center relative z-10 px-2">
                    <div className="w-40 bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex flex-col gap-1.5 shrink-0">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                        Dampak Alur
                      </span>
                      <span
                        className={`text-[9px] font-black self-start px-1.5 py-0.5 rounded-md border ${
                          tujuan === "produk_olahan"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {tujuan === "produk_olahan"
                          ? "Ekonomi Sirkular"
                          : "Residu TPA"}
                      </span>
                      <p className="text-[8px] text-neutral-500 leading-tight">
                        {tujuan === "produk_olahan"
                          ? "Bahan disalurkan ke rantai upcycling."
                          : "Bahan dibuang dan menumpuk di TPA."}
                      </p>
                    </div>
                  </div>

                  {/* Column 2: Circle 5 */}
                  <div className="flex justify-center relative z-10 px-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep(5)}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                        activeStep === 5
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110 ring-4 ring-blue-100"
                          : "bg-white text-neutral-500 border-2 border-neutral-200 hover:border-blue-400 hover:text-blue-600"
                      }`}
                    >
                      {tujuan === "produk_olahan" ? (
                        <Recycle className="w-5 h-5" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-[8px] border border-white">
                        5
                      </span>
                    </button>
                  </div>

                  {/* Column 3: Circle 4 */}
                  <div className="flex justify-center relative z-10 px-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep(4)}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                        activeStep === 4
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110 ring-4 ring-blue-100"
                          : "bg-white text-neutral-500 border-2 border-neutral-200 hover:border-blue-400 hover:text-blue-600"
                      }`}
                    >
                      <curTujuan.icon className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-[8px] border border-white">
                        4
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── ROW 2: Labels ── */}
              <div className="grid grid-cols-3 gap-x-0 mt-3">
                {/* Column 1 Placeholder */}
                <div />

                {/* Step 5 Label */}
                <div className="flex flex-col items-center text-center px-2">
                  <span
                    className={`text-[10px] font-black ${
                      activeStep === 5 ? "text-blue-600" : "text-neutral-600"
                    }`}
                  >
                    {tujuan === "produk_olahan"
                      ? "Ekonomi Sirkular"
                      : "Residu TPA"}
                  </span>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                    Step 5: Dampak
                  </span>
                </div>

                {/* Step 4 Label */}
                <div className="flex flex-col items-center text-center px-2">
                  <span
                    className={`text-[10px] font-black ${
                      activeStep === 4 ? "text-blue-600" : "text-neutral-600"
                    }`}
                  >
                    {curTujuan.label}
                  </span>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                    Step 4: Tujuan
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Vertical Flow Map (Visible only on small screens) */}
          <div className="md:hidden space-y-4 mb-6 relative pl-6 border-l-2 border-dashed border-blue-200 py-2">
            {/* Mobile Step 1 */}
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className={`w-full text-left font-normal relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                activeStep === 1
                  ? "bg-blue-50/50 border-blue-300 font-bold shadow-2xs"
                  : "bg-white border-neutral-200"
              }`}
            >
              <div
                className={`absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeStep === 1
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-blue-300 text-blue-600"
                }`}
              >
                1
              </div>
              <curSumber.icon
                className={`w-5 h-5 ${activeStep === 1 ? "text-blue-600" : "text-neutral-500"}`}
              />
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block font-semibold">
                  Sumber Sampah
                </span>
                <span className="text-xs text-neutral-800">
                  {curSumber.label}
                </span>
              </div>
            </button>

            {/* Mobile Step 2 */}
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className={`w-full text-left font-normal relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                activeStep === 2
                  ? "bg-blue-50/50 border-blue-300 font-bold shadow-2xs"
                  : "bg-white border-neutral-200"
              }`}
            >
              <div
                className={`absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeStep === 2
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-blue-300 text-blue-600"
                }`}
              >
                2
              </div>
              <curKelola.icon
                className={`w-5 h-5 ${activeStep === 2 ? "text-blue-600" : "text-neutral-500"}`}
              />
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block font-semibold">
                  Dikelola Oleh
                </span>
                <span className="text-xs text-neutral-800">
                  {curKelola.label}
                </span>
              </div>
            </button>

            {/* Mobile Step 3 */}
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className={`w-full text-left font-normal relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                activeStep === 3
                  ? "bg-blue-50/50 border-blue-300 font-bold shadow-2xs"
                  : "bg-white border-neutral-200"
              }`}
            >
              <div
                className={`absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeStep === 3
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-blue-300 text-blue-600"
                }`}
              >
                3
              </div>
              <curPengelolaan.icon
                className={`w-5 h-5 ${activeStep === 3 ? "text-blue-600" : "text-neutral-500"}`}
              />
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block font-semibold">
                  Metode Pengelolaan
                </span>
                <span className="text-xs text-neutral-800">
                  {curPengelolaan.label}
                </span>
              </div>
            </button>

            {/* Mobile Step 4 */}
            <button
              type="button"
              onClick={() => setActiveStep(4)}
              className={`w-full text-left font-normal relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                activeStep === 4
                  ? "bg-blue-50/50 border-blue-300 font-bold shadow-2xs"
                  : "bg-white border-neutral-200"
              }`}
            >
              <div
                className={`absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeStep === 4
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-blue-300 text-blue-600"
                }`}
              >
                4
              </div>
              <curTujuan.icon
                className={`w-5 h-5 ${activeStep === 4 ? "text-blue-600" : "text-neutral-500"}`}
              />
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block font-semibold">
                  Tujuan Akhir
                </span>
                <span className="text-xs text-neutral-800">
                  {curTujuan.label}
                </span>
              </div>
            </button>

            {/* Mobile Step 5 */}
            <button
              type="button"
              onClick={() => setActiveStep(5)}
              className={`w-full text-left font-normal relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                activeStep === 5
                  ? "bg-blue-50/50 border-blue-300 font-bold shadow-2xs"
                  : "bg-white border-neutral-200"
              }`}
            >
              <div
                className={`absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeStep === 5
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-blue-300 text-blue-600"
                }`}
              >
                5
              </div>
              {tujuan === "produk_olahan" ? (
                <Recycle
                  className={`w-5 h-5 ${activeStep === 5 ? "text-emerald-600" : "text-neutral-500"}`}
                />
              ) : (
                <Trash2
                  className={`w-5 h-5 ${activeStep === 5 ? "text-red-500" : "text-neutral-500"}`}
                />
              )}
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block font-semibold">
                  Proses Akhir
                </span>
                <span className="text-xs text-neutral-800 font-medium">
                  {tujuan === "produk_olahan"
                    ? "Ekonomi Sirkular"
                    : "Residu TPA"}
                </span>
              </div>
            </button>
          </div>
        </div>
        {/* Bottom Part: Explanation & Configurator (Expands when activeStep is not null) */}
        <div>
          {activeStep === null ? (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
              <Recycle className="w-10 h-10 text-neutral-400 animate-pulse mb-3" />
              <h3 className="text-sm font-bold text-neutral-700">
                Simulasi Alur Perjalanan Sampah
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mt-1">
                Klik salah satu lingkaran tahapan (Sumber, Pengelola, Metode,
                Tujuan, Akhir) pada peta di atas untuk melihat penjelasan dan
                mengubah opsi alur.
              </p>
            </div>
          ) : (
            <div className="bg-neutral-50/50 rounded-xl border border-neutral-200 p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
              {/* STEP 1: Sumber Sampah */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Langkah 1 dari 5
                    </span>
                    <h3 className="text-lg font-black text-neutral-900 mt-1">
                      Pilih Sumber Sampah
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Tentukan dari mana sampah anorganik ini pertama kali
                      dikumpulkan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.keys(sumberOptions) as SumberType[])
                      .filter((key) => {
                        if (userRole === "admin" || userRole === "superadmin")
                          return true;
                        return key === sumber;
                      })
                      .map((key) => {
                        const opt = sumberOptions[key];
                        const Icon = opt.icon;
                        const isSelected = sumber === key;
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => handleSumberChange(key)}
                            className={`text-left font-normal group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-50/40 border-blue-500 ring-2 ring-blue-50"
                                : "bg-white border-neutral-200 hover:bg-neutral-50/50 hover:border-neutral-300"
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200"
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5 flex-1">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs font-bold ${isSelected ? "text-blue-700" : "text-neutral-800"}`}
                                >
                                  {opt.label}
                                </span>
                                <span className="text-[8px] bg-neutral-150 px-1.5 py-0.5 rounded-md font-bold text-neutral-500">
                                  {opt.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-500 leading-relaxed">
                                {opt.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* STEP 2: Dikelola Oleh */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Langkah 2 dari 5
                    </span>
                    <h3 className="text-lg font-black text-neutral-900 mt-1">
                      Pilih Pengelola
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Tentukan entitas yang bertanggung jawab atas penampungan
                      dan tata kelola.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.keys(kelolaOptions) as KelolaType[])
                      .filter((key) => {
                        if (userRole === "admin" || userRole === "superadmin")
                          return true;
                        return key === kelola;
                      })
                      .map((key) => {
                        const opt = kelolaOptions[key];
                        const Icon = opt.icon;
                        const isSelected = kelola === key;
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => setKelola(key)}
                            className={`text-left font-normal group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-50/40 border-blue-500 ring-2 ring-blue-50"
                                : "bg-white border-neutral-200 hover:bg-neutral-50/50 hover:border-neutral-300"
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200"
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5 flex-1">
                              <span
                                className={`text-xs font-bold ${isSelected ? "text-blue-700" : "text-neutral-800"} block`}
                              >
                                {opt.label}
                              </span>
                              <p className="text-[11px] text-neutral-500 leading-relaxed">
                                {opt.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* STEP 3: Cara Pengelolaan */}
              {activeStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Langkah 3 dari 5
                    </span>
                    <h3 className="text-lg font-black text-neutral-900 mt-1">
                      Pilih Metode Pengelolaan
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Tentukan bagaimana sampah dipilah, ditakar, atau diproses
                      di fasilitas.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(Object.keys(pengelolaanOptions) as PengelolaanType[])
                      .filter((key) => {
                        if (userRole === "admin" || userRole === "superadmin")
                          return true;
                        return key === pengelolaan;
                      })
                      .map((key) => {
                        const opt = pengelolaanOptions[key];
                        const Icon = opt.icon;
                        const isSelected = pengelolaan === key;
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => setPengelolaan(key)}
                            className={`text-left font-normal group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-50/40 border-blue-500 ring-2 ring-blue-50"
                                : "bg-white border-neutral-200 hover:bg-neutral-50/50 hover:border-neutral-300"
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200"
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5 flex-1">
                              <span
                                className={`text-xs font-bold ${isSelected ? "text-blue-700" : "text-neutral-800"} block`}
                              >
                                {opt.label}
                              </span>
                              <p className="text-[11px] text-neutral-500 leading-relaxed">
                                {opt.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* STEP 4: Tujuan */}
              {activeStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Langkah 4 dari 5
                    </span>
                    <h3 className="text-lg font-black text-neutral-900 mt-1">
                      Pilih Aliran Tujuan
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Pilih ke mana sisa material ini akan bermuara untuk masa
                      depan lingkungan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.keys(tujuanOptions) as TujuanType[])
                      .filter((key) => {
                        if (userRole === "admin" || userRole === "superadmin")
                          return true;
                        return key === tujuan;
                      })
                      .map((key) => {
                        const opt = tujuanOptions[key];
                        const Icon = opt.icon;
                        const isSelected = tujuan === key;
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => setTujuan(key)}
                            className={`text-left font-normal group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-50/40 border-blue-500 ring-2 ring-blue-50"
                                : "bg-white border-neutral-200 hover:bg-neutral-50/50 hover:border-neutral-300"
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200"
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5 flex-1">
                              <span
                                className={`text-xs font-bold ${isSelected ? "text-blue-700" : "text-neutral-800"} block`}
                              >
                                {opt.label}
                              </span>
                              <p className="text-[11px] text-neutral-500 leading-relaxed">
                                {opt.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* STEP 5: Proses Akhir */}
              {activeStep === 5 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Tahap Akhir
                    </span>
                    <h3 className="text-lg font-black text-neutral-900 mt-1">
                      Dampak Proses Akhir
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Berikut adalah simulasi hasil akhir dari rantai penanganan
                      sampah pilihan Anda.
                    </p>
                  </div>

                  {tujuan === "produk_olahan" ? (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-white space-y-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                          <Recycle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-950">
                            Siklus Ekonomi Sirkular
                          </h4>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-sm">
                            ZERO WASTE POSSIBLE
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-emerald-900 leading-relaxed">
                        {
                          'Dengan memilih jalur daur ulang dan upcycling, Anda mendukung penuh terciptanya Ekonomi Sirkular (Circular Economy) yang berkelanjutan di tingkat lokal dan nasional. Model ini memutus secara radikal rantai ekonomi linier tradisional "ambil-buat-buang" yang sangat merusak. Di dalam ekosistem sirkular, material anorganik pasca-konsumsi diselamatkan sepenuhnya dari ekosistem pembuangan akhir dan dimasukkan kembali ke dalam rantai pasok industri manufaktur sebagai bahan baku sekunder (secondary raw materials). Keuntungan ekologis yang diperoleh dari proses ini sangat masif: meminimalkan kebutuhan ekstraksi minyak bumi mentah untuk pembuatan bijih plastik virgin, menghemat konsumsi energi manufaktur hingga 60-80%, menekan emisi gas rumah kaca secara signifikan guna memerangi pemanasan global, mencegah pencemaran plastik di aliran sungai dan lautan yang mengancam biota laut, serta membuka peluang ekonomi baru berupa lapangan kerja hijau (green jobs) yang meningkatkan taraf hidup masyarakat dan pemulung lokal secara bermartabat.'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-red-250 bg-white space-y-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center text-white">
                          <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-red-950">
                            Beban Residu di TPA
                          </h4>
                          <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded-sm">
                            LANDFILL DEPOSITION
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-red-900 leading-relaxed">
                        {
                          "Membiarkan sisa konsumsi anorganik berakhir begitu saja di TPA memicu dampak kerusakan lingkungan yang berkepanjangan, mahal, dan sistemik. Di lokasi Tempat Pemrosesan Akhir, sampah diletakkan tanpa pengolahan sirkular di hamparan tanah terbuka (open dumping) atau ditimbun tanah secara berkala (sanitary landfill). Karena sampah plastik membutuhkan waktu 100 hingga 500 tahun untuk terdegradasi secara alami, penumpukan ini menyita lahan produktif secara konstan dan memicu timbulan air lindi (leachate) beracun yang merembes ke air tanah konsumsi warga serta merusak ekosistem pertanian sekitar. Lebih parah lagi, tumpukan sampah anorganik yang tercampur sampah organik basah akan membusuk secara anaerobik dan melepaskan gas metana (CH₄) — gas rumah kaca berbahaya yang memiliki potensi pemanasan global 25 kali lebih kuat daripada karbon dioksida (CO₂). Degradasi plastik secara perlahan juga melepaskan jutaan partikel mikroplastik yang tidak kasat mata, menyusup ke rantai makanan manusia melalui air tanah, ikan, hingga garam dapur yang kita konsumsi sehari-hari."
                        }
                      </p>
                    </div>
                  )}

                  {/* Quick Tips */}
                  <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-xs">
                    <div className="flex gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-neutral-800 uppercase block">
                          Rekomendasi Aksi:
                        </span>
                        <p className="text-[11px] text-neutral-500 leading-relaxed">
                          {tujuan === "produk_olahan"
                            ? "Aksi Nyata Direkomendasikan: Pertahankan konsistensi Anda dalam memilah sampah di tingkat hulu. Ajak keluarga dan tetangga sekitar untuk mulai menabung sampah anorganik berkualitas mereka di Bank Sampah terdekat guna mengeskalasi volume sirkularitas material, mengumpulkan keuntungan finansial bersama, serta menjaga kelestarian bumi secara kolektif."
                            : "Aksi Darurat Direkomendasikan: Hentikan pembuangan langsung sampah tercampur ke wadah umum. Segera mulailah melakukan pemilahan sampah anorganik bernilai (kertas, kardus, botol plastik) dari rumah Anda, lalu salurkan ke Bank Sampah Unit atau TPS 3R terdekat. Tindakan kecil ini secara instan mengurangi beban angkut truk sampah kota dan menyelamatkan TPA kita dari kepunahan dini."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Button Controls */}
              <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() =>
                    setActiveStep((prev) =>
                      prev !== null ? Math.max(1, prev - 1) : null,
                    )
                  }
                  disabled={activeStep === 1}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer"
                >
                  Sebelumnya
                </button>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div
                      key={step}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        activeStep === step
                          ? "w-3 bg-blue-600"
                          : "bg-neutral-300"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(null)}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-600 cursor-pointer"
                  >
                    Tutup Penjelasan
                  </button>

                  {activeStep !== null && activeStep < 5 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveStep((prev) =>
                          prev !== null ? Math.min(5, prev + 1) : null,
                        )
                      }
                      className="px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-primary-700 text-white flex items-center gap-1 border-0 cursor-pointer shadow-sm"
                    >
                      Lanjut
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="px-3.5 py-2 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-1 border-0 cursor-pointer"
                    >
                      Ulangi Simulasi
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
