export type PetaRole =
  | "warmindo"
  | "bank-sampah"
  | "bank-sampah-b"
  | "konsumen";

export interface AlurStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  badgeText: string;
  highlightText?: string;
  actor: string;
  location: string;
  rewardInfo?: string;
}

export interface FraksiInfo {
  nama: string;
  keterangan: string;
  poinRate: string;
  iconName: string;
}

export interface RewardPetaInfo {
  kategori: string;
  deskripsi: string;
  items: string[];
  caraKlaim: string;
}

export interface RolePetaData {
  role: PetaRole;
  badgeLabel: string;
  title: string;
  subTitle: string;
  accentColor: "amber" | "emerald" | "teal" | "blue";
  bannerBg: string;
  overview: string;
  steps: AlurStep[];
  fraksiList: FraksiInfo[];
  rewardInfo: RewardPetaInfo;
  ecoImpact: {
    stat1: { value: string; label: string };
    stat2: { value: string; label: string };
    stat3: { value: string; label: string };
  };
}

export const PETA_SAMPAH_DATA: Record<PetaRole, RolePetaData> = {
  warmindo: {
    role: "warmindo",
    badgeLabel: "Mitra Gerai Warmindo",
    title: "Peta Perjalanan Sampah Warmindo",
    subTitle:
      "Alur daur ulang sampah kemasan mi instan dari dapur warung Anda hingga menjadi reward bahan baku dan produk resmi Indofood.",
    accentColor: "amber",
    bannerBg: "from-amber-950 via-slate-900 to-amber-900",
    overview:
      "Sebagai mitra Warmindo binaan PT Indofood, limbah kemasan mie, sachet bumbu, dan kardus mi instan yang Anda kumpulkan akan diangkut dan diproses secara bertanggung jawab menuju Bank Sampah dan pabrik daur ulang resmi, dengan reward bernilai ekonomis bagi warung Anda.",
    steps: [
      {
        stepNumber: 1,
        title: "Pemilahan di Warung",
        subtitle: "Langkah Awal di Gerai",
        description:
          "Kumpulkan dan pilah sampah kemasan bekas Indomie (karton pembungkus, bungkus etiket plastik, serta sachet bumbu). Pastikan kardus dilipat rapi dan kemasan plastik dalam kondisi kering serta bebas sisa makanan.",
        iconName: "Store",
        badgeText: "Hulu / Sumber",
        actor: "Pemilik & Kru Warmindo",
        location: "Gerai Warung Warmindo",
        rewardInfo: "Potensi berat 10 - 50 kg per minggu",
      },
      {
        stepNumber: 2,
        title: "Pengajuan Setor & Opsi Penjemputan",
        subtitle: "Digitalisasi via Web SiCuan",
        description:
          "Buka menu 'Setor Sampah', masukkan perkiraan berat dan pilih metode setoran: 'Via Ekspedisi' (dijemput oleh armada kurir atau Bank Sampah Tipe B langsung di lokasi warung) atau 'Datang Langsung' ke Bank Sampah tujuan.",
        iconName: "Truck",
        badgeText: "Logistik & Ekspedisi",
        actor: "Sistem SiCuan & Armada Penjemput",
        location: "Depan Gerai Warmindo",
        rewardInfo: "Layanan jemput tanpa biaya tambahan",
      },
      {
        stepNumber: 3,
        title: "Penimbangan & Audit Fisik",
        subtitle: "Verifikasi Presisi & Transparan",
        description:
          "Sampah diterima oleh Bank Sampah mitra resmi. Dilakukan penimbangan riil terstandarisasi dengan foto bukti skala digital untuk menjamin transparansi perhitungan timbangan.",
        iconName: "Scale",
        badgeText: "Verifikasi",
        actor: "Petugas Bank Sampah & Admin",
        location: "Gudang Bank Sampah",
        rewardInfo: "Timbangan diverifikasi ke sistem",
      },
      {
        stepNumber: 4,
        title: "Pemberian Poin & Akumulasi Saldo",
        subtitle: "Konversi Menjadi Cuan",
        description:
          "Setelah disetujui, sistem SiCuan langsung menambahkan Poin Warmindo ke akun Anda secara otomatis. Riwayat transaksi dan perolehan poin tercatat permanen.",
        iconName: "Coins",
        badgeText: "Reward Instan",
        actor: "Mesin Poin Otomatis SiCuan",
        location: "Dompet Digital SiCuan",
        rewardInfo: "1 kg Karton = 100 Poin | 1 kg Etiket = 150 Poin",
      },
      {
        stepNumber: 5,
        title: "Tukar Reward Bahan Baku & Apresiasi",
        subtitle: "Cuan Berkelanjutan untuk Warung",
        description:
          "Poin Warmindo dapat ditukarkan di menu 'Tukar Reward' dengan berbagai kebutuhan operasional warung: Minyak Goreng Bimoli, Tepung Segitiga Biru, Kecap Indofood, Mi Instan, hingga insentif Reward Top Kontributor bulanan.",
        iconName: "Gift",
        badgeText: "Hilir / Manfaat",
        actor: "Mitra Warmindo & Indofood",
        location: "Katalog Reward SiCuan",
        rewardInfo: "Dukungan operasional warung 100% gratis",
      },
    ],
    fraksiList: [
      {
        nama: "Karton Box Indomie",
        keterangan: "Kardus kemasan luar Indomie yang dilipat rapi dan kering.",
        poinRate: "100 Poin / kg",
        iconName: "Layers",
      },
      {
        nama: "Etiket Plastik & Bumbu",
        keterangan: "Bungkus plastik sachet Indomie, bumbu, dan minyak kering.",
        poinRate: "150 Poin / kg",
        iconName: "Recycle",
      },
      {
        nama: "Paper Cup Pop Mie",
        keterangan: "Gelas kertas Pop Mie yang sudah dikeringkan dan ditumpuk.",
        poinRate: "120 Poin / kg",
        iconName: "Coffee",
      },
    ],
    rewardInfo: {
      kategori: "Katalog Sembako & Reward Khusus Warmindo",
      deskripsi:
        "Tukarkan poin setoran sampah Anda menjadi pasokan bahan baku gerai Warmindo dari PT Indofood CBP Sukses Makmur Tbk.",
      items: [
        "Minyak Goreng Bimoli Spesial (Pouch 1L / 2L)",
        "Tepung Terigu Segitiga Biru & Cakra Kembar",
        "Kecap Manis Indofood & Saus Sambal Indofood",
        "Karton Mi Instan Indomie Aneka Rasa",
        "Bonus Reward Poin Tunai untuk 10 Top Kontributor Bulanan",
      ],
      caraKlaim:
        "Buka menu 'Tukar Reward', pilih barang yang diinginkan, lalu ajukan penukaran. Admin Indofood akan memverifikasi dan mengirimkan barang ke alamat warung Anda.",
    },
    ecoImpact: {
      stat1: { value: "100%", label: "Kemasan Terdaur Ulang" },
      stat2: { value: "3.2 kg", label: "Rata-rata Reduksi CO2 / kg" },
      stat3: { value: "Gratis", label: "Pasokan Bahan Baku Tambahan" },
    },
  },

  "bank-sampah": {
    role: "bank-sampah",
    badgeLabel: "Bank Sampah Pengolah (Tipe A)",
    title: "Peta Perjalanan Sampah Bank Sampah Tipe A",
    subTitle:
      "Alur penerimaan limbah terpilah dari masyarakat dan Warmindo, pemrosesan fraksi industri, hingga pengiriman agregasi ke pabrik Indofood.",
    accentColor: "emerald",
    bannerBg: "from-emerald-950 via-slate-900 to-teal-950",
    overview:
      "Bank Sampah Tipe A berfungsi sebagai pusat transit dan pengolahan awal limbah anorganik kemasan Indofood. Menampung sampah dari nasabah perorangan serta setoran langsung Warmindo, memilah sesuai fraksi industri, dan menyalurkannya langsung ke fasilitas daur ulang Indofood.",
    steps: [
      {
        stepNumber: 1,
        title: "Penerimaan Sampah dari Nasabah & Warmindo",
        subtitle: "Titik Kumpul Wilayah",
        description:
          "Menerima setoran sampah kemasan Indofood yang diantar langsung oleh nasabah masyarakat sekitar maupun pengiriman langsung dari mitra Warmindo binaan.",
        iconName: "Store",
        badgeText: "Penerimaan",
        actor: "Warga, Warmindo & Petugas",
        location: "Loket Drop Point Bank Sampah",
        rewardInfo: "Mencatat nomor resi resmi",
      },
      {
        stepNumber: 2,
        title: "Penimbangan Digital & Pencatatan Sistem",
        subtitle: "Audit Berat Riil",
        description:
          "Petugas menimbang sampah secara presisi menggunakan timbangan digital, mengunggah foto timbangan ke sistem SiCuan, dan menyetujui setoran agar poin nasabah segera aktif.",
        iconName: "Scale",
        badgeText: "Validasi",
        actor: "Operator Bank Sampah",
        location: "Meja Timbang Bank Sampah",
        rewardInfo: "Poin nasabah diterbitkan",
      },
      {
        stepNumber: 3,
        title: "Pemilahan Fraksi & Pengepakan Industri",
        subtitle: "Standar Raw Material Pabrik",
        description:
          "Sampah dipilah dan dikelompokkan ke dalam kategori bahan baku: Karton corrugated, etiket film multilayer, dan paper cup. Setelah mencapai kuota tonase, bahan dipadatkan (baling) siap angkut.",
        iconName: "Layers",
        badgeText: "Pengolahan",
        actor: "Kru Gudang Bank Sampah",
        location: "Gudang Pemilahan & Baling",
        rewardInfo: "Peningkatan nilai ekonomis fraksi",
      },
      {
        stepNumber: 4,
        title: "Pengiriman Agregasi ke Pabrik Indofood",
        subtitle: "Rantai Pasok Sirkular",
        description:
          "Bahan baku daur ulang dikirim menggunakan armada logistik resmi menuju fasilitas daur ulang dan pabrik pengolahan daur ulang limbah PT Indofood.",
        iconName: "Truck",
        badgeText: "Agregasi Industri",
        actor: "Armada Pengangkut & Logistik",
        location: "Rute Bank Sampah -> Pabrik Indofood",
        rewardInfo: "Surat Jalan & Manifest Pengiriman",
      },
      {
        stepNumber: 5,
        title: "Pencairan Dana Operasional & Insentif",
        subtitle: "Pendapatan Usaha Berkelanjutan",
        description:
          "Setelah pabrik mengonfirmasi penerimaan tonase bahan baku, Bank Sampah mengajukan 'Pencairan Dana' di web portal SiCuan. Dana operasional ditransfer langsung ke rekening bank pengelola.",
        iconName: "Coins",
        badgeText: "Pencairan Cuan",
        actor: "Pengelola Bank Sampah & Keuangan Indofood",
        location: "Menu Pencairan Dana",
        rewardInfo: "Transfer dana langsung ke rekening bank",
      },
    ],
    fraksiList: [
      {
        nama: "Karton Gelombang (OCC)",
        keterangan:
          "Kardus bekas kemasan Indofood siap cetak ulang / daur kertas.",
        poinRate: "Rp 1.500 - 2.500 / kg",
        iconName: "Layers",
      },
      {
        nama: "Film Plastik Multilayer (Etiket)",
        keterangan:
          "Bungkus plastik mie & bumbu untuk bahan baku pelet plastik.",
        poinRate: "Rp 1.000 - 2.000 / kg",
        iconName: "Recycle",
      },
      {
        nama: "Paper Cup Pop Mie Poly-coated",
        keterangan:
          "Cup kertas minuman & mi instan untuk daur pulp berkualitas.",
        poinRate: "Rp 1.200 - 2.200 / kg",
        iconName: "Coffee",
      },
    ],
    rewardInfo: {
      kategori: "Pencairan Dana Tunai & Insentif Manajemen",
      deskripsi:
        "Bank Sampah Tipe A menerima kompensasi finansial resmi berdasarkan tonase riil sampah yang disetorkan ke pabrik PT Indofood.",
      items: [
        "Pencairan dana langsung ke rekening Bank BCA, Mandiri, BRI, BNI",
        "Insentif operasional per kilogram sampah terpilah",
        "Dukungan SPK (Surat Perjanjian Kerja Sama) resmi bulanan",
        "Bantuan timbangan digital & perlengkapan kerja",
      ],
      caraKlaim:
        "Buka menu 'Pencairan Dana', masukkan nominal saldo yang ingin dicairkan, lalu unggah bukti kwitansi/rekening. Tim Finance Indofood akan memproses transfer dana dalam 1-2 hari kerja.",
    },
    ecoImpact: {
      stat1: { value: "> 5 Ton", label: "Rata-rata Kapasitas / Bulan" },
      stat2: { value: "98%", label: "Akurasi Sortasi Pabrik" },
      stat3: { value: "Resmi", label: "Payung Hukum Kemitraan SPK" },
    },
  },

  "bank-sampah-b": {
    role: "bank-sampah-b",
    badgeLabel: "Bank Sampah Penjemput (Tipe B)",
    title: "Peta Perjalanan Sampah Bank Sampah Tipe B",
    subTitle:
      "Alur armada mobile penjemputan sampah lapangan dari 4 sumber utama, deteksi AI, hingga penerimaan reward poin instan.",
    accentColor: "teal",
    bannerBg: "from-teal-950 via-slate-900 to-emerald-950",
    overview:
      "Bank Sampah Tipe B adalah armada mobile lincah yang bertugas aktif menjemput sampah kemasan Indofood langsung dari 4 pilar sumber: Warmindo, Karyawan Indofood, Factory Visit, dan Masyarakat. Dilengkapi verifikasi cerdas AI Vision untuk percepatan proses penjemputan.",
    steps: [
      {
        stepNumber: 1,
        title: "Penugasan & Penjemputan di 4 Sumber",
        subtitle: "Layanan Jemput Bola Lapangan",
        description:
          "Armada Bank Sampah Tipe B menerima tugas penjemputan sampah ke warung Warmindo, mess/kantor karyawan, area kunjungan industri, atau komunitas warga.",
        iconName: "Truck",
        badgeText: "Mobile Penjemputan",
        actor: "Armada Bank Sampah Tipe B",
        location: "Warmindo / Karyawan / Warga",
        rewardInfo: "4 Sumber Sampah Berkelanjutan",
      },
      {
        stepNumber: 2,
        title: "Penimbangan Lapangan & Foto Kamera",
        subtitle: "Input Praktis Cepat",
        description:
          "Petugas menimbang sampah di lokasi penjemputan menggunakan timbangan gantung/portable, lalu memotret angka skala timbangan menggunakan kamera HP di web SiCuan.",
        iconName: "Camera",
        badgeText: "Dokumentasi",
        actor: "Kurir Armada Tipe B",
        location: "Lokasi Penjemputan Lapangan",
        rewardInfo: "Foto bukti tambahan bersifat fleksibel",
      },
      {
        stepNumber: 3,
        title: "Validasi AI Vision & Deteksi Otomatis",
        subtitle: "Kecerdasan Buatan SiCuan",
        description:
          "Sistem Gemini AI Vision secara otomatis membaca angka berat dari foto timbangan. Jika gambar buram, tersedia tombol 'Ajukan Validasi Manual' langsung ke Admin.",
        iconName: "Sparkles",
        badgeText: "AI Automation",
        actor: "AI Vision SiCuan / Admin",
        location: "Sistem Cloud SiCuan",
        rewardInfo: "Deteksi instan dalam hitungan detik",
      },
      {
        stepNumber: 4,
        title: "Perolehan Reward Poin Instan",
        subtitle: "Poin Masuk Otomatis",
        description:
          "Setelah terdeteksi atau divalidasi, poin reward langsung ditambahkan ke saldo dompet Bank Sampah Tipe B Anda sama seperti hak poin konsumen.",
        iconName: "Coins",
        badgeText: "Reward Instan",
        actor: "Sistem SiCuan",
        location: "Dashboard Bank Sampah B",
        rewardInfo: "Perolehan poin langsung dapat dipantau",
      },
      {
        stepNumber: 5,
        title: "Penukaran Hadiah & Penyaluran Material",
        subtitle: "Manfaat Maksimal Armada",
        description:
          "Poin yang terkumpul dapat ditukarkan di katalog 'Tukar Reward', sementara sampah yang dijemput disalurkan ke Bank Sampah Tipe A atau pusat daur ulang Indofood.",
        iconName: "Gift",
        badgeText: "Klaim Cuan",
        actor: "Pengelola Tipe B & Admin",
        location: "Katalog Reward Bank Sampah B",
        rewardInfo: "Kupon hadiah, sembako & e-wallet",
      },
    ],
    fraksiList: [
      {
        nama: "Karton Box Indofood",
        keterangan: "Kardus bekas dari warung Warmindo & area pabrik.",
        poinRate: "100 Poin / kg",
        iconName: "Layers",
      },
      {
        nama: "Etiket Plastik Mi & Bumbu",
        keterangan: "Bungkus plastik mie instan dari warung dan perumahan.",
        poinRate: "150 Poin / kg",
        iconName: "Recycle",
      },
      {
        nama: "Paper Cup Pop Mie",
        keterangan: "Gelas Pop Mie dari event, factory visit, dan warung.",
        poinRate: "120 Poin / kg",
        iconName: "Coffee",
      },
    ],
    rewardInfo: {
      kategori: "Katalog Reward Poin Khusus Bank Sampah B",
      deskripsi:
        "Sebagai garda terdepan penjemput sampah lapangan, kumpulkan poin sebanyak-banyaknya dan tukarkan dengan aneka reward menarik.",
      items: [
        "Voucher Saldo Dompet Digital (GoPay, OVO, DANA, ShopeePay)",
        "Paket Sembako Indofood (Minyak, Mi Instan, Terigu, Kecap)",
        "Kupon Undian Hadiah Utama Bulanan",
        "Insentif Armada Khusus Mitra Penjemput",
      ],
      caraKlaim:
        "Buka menu 'Tukar Reward', tentukan jumlah poin yang akan dicairkan, lalu kirim pengajuan. Admin akan memproses verifikasi dan reward segera Anda terima.",
    },
    ecoImpact: {
      stat1: { value: "100%", label: "Layanan Jemput Bola" },
      stat2: { value: "AI-Powered", label: "Deteksi Timbangan Instan" },
      stat3: { value: "4 Pilar", label: "Sumber Sampah Terintegrasi" },
    },
  },

  konsumen: {
    role: "konsumen",
    badgeLabel: "Konsumen Peduli Lingkungan",
    title: "Peta Perjalanan Sampah Konsumen",
    subTitle:
      "Alur cerdas daur ulang kemasan bekas Indomie, Pop Mie, dan produk Indofood dari rumah Anda menjadi reward cuan digital.",
    accentColor: "blue",
    bannerBg: "from-blue-950 via-slate-900 to-indigo-950",
    overview:
      "Setiap bungkus Indomie dan cup Pop Mie yang Anda konsumsi bernilai cuan! Jangan buang ke tempat sampah biasa—kumpulkan, pilah, dan setorkan ke Bank Sampah SiCuan terdekat untuk ditukarkan menjadi saldo e-wallet dan aneka sembako.",
    steps: [
      {
        stepNumber: 1,
        title: "Kumpulkan & Bersihkan Kemasan Bekas",
        subtitle: "Mulai dari Rumah",
        description:
          "Setelah menikmati produk Indofood (Indomie, Pop Mie, Chitato, dll), bersihkan kemasan dari remah makanan, lalu keringkan dan kumpulkan ke dalam wadah khusus.",
        iconName: "Store",
        badgeText: "Pilah Rumah Tangga",
        actor: "Konsumen & Keluarga",
        location: "Rumah Tangga / Kost / Kantor",
        rewardInfo: "Minimal 0.5 kg untuk disetor",
      },
      {
        stepNumber: 2,
        title: "Bawa ke Drop Point Bank Sampah Terdekat",
        subtitle: "Penyetoran Praktis",
        description:
          "Bawa sampah kemasan Anda ke cabang Bank Sampah mitra SiCuan terdekat. Anda dapat melihat daftar lokasi Bank Sampah di menu peta lokasi atau profil.",
        iconName: "MapPin",
        badgeText: "Drop Point",
        actor: "Konsumen & Petugas Bank",
        location: "Bank Sampah Mitra SiCuan",
        rewardInfo: "Tersedia puluhan drop point",
      },
      {
        stepNumber: 3,
        title: "Penimbangan & Input Data Setoran",
        subtitle: "Transparansi Timbangan",
        description:
          "Petugas Bank Sampah akan menimbang sampah Anda. Nomor resi penyetoran akan dicatat langsung ke akun SiCuan Anda secara digital.",
        iconName: "Scale",
        badgeText: "Timbang Riil",
        actor: "Petugas Bank Sampah",
        location: "Meja Timbangan",
        rewardInfo: "Perhitungan berat transparan",
      },
      {
        stepNumber: 4,
        title: "Poin Masuk ke Saldo SiCuan",
        subtitle: "Cuan Otomatis Masuk",
        description:
          "Poin reward langsung bertambah di dompet akun Anda secara instan begitu setoran disetujui. Pantau riwayat poin di menu 'Laporan Setoran'.",
        iconName: "Coins",
        badgeText: "Poin Instan",
        actor: "Aplikasi Web SiCuan",
        location: "Akun Konsumen",
        rewardInfo: "1 kg Plastik Kemasan = 150 Poin",
      },
      {
        stepNumber: 5,
        title: "Tukarkan Poin Jadi Saldo & Sembako",
        subtitle: "Nikmati Hadiahnya",
        description:
          "Poin Anda dapat ditukarkan kapan saja di menu 'Tukar Kupon / Reward' dengan Saldo E-Wallet (GoPay, OVO, DANA, ShopeePay), Paket Sembako, atau Kupon Undian berhadiah spektakuler.",
        iconName: "Gift",
        badgeText: "Pencairan Reward",
        actor: "Konsumen",
        location: "Menu Tukar Reward",
        rewardInfo: "Saldo E-Wallet langsung cair",
      },
    ],
    fraksiList: [
      {
        nama: "Bungkus Plastik Indomie & Snack",
        keterangan: "Semua kemasan plastik snack & mi instan Indofood.",
        poinRate: "150 Poin / kg",
        iconName: "Recycle",
      },
      {
        nama: "Cup Kertas Pop Mie",
        keterangan: "Gelas mi instan Pop Mie yang sudah dibersihkan.",
        poinRate: "120 Poin / kg",
        iconName: "Coffee",
      },
      {
        nama: "Kardus Paket & Box",
        keterangan: "Kardus kemasan produk Indofood lipat kering.",
        poinRate: "100 Poin / kg",
        iconName: "Layers",
      },
    ],
    rewardInfo: {
      kategori: "Katalog Penukaran Poin Konsumen",
      deskripsi:
        "Tukarkan poin ramah lingkungan Anda dengan berbagai reward gaya hidup dan kebutuhan harian.",
      items: [
        "Saldo E-Wallet: GoPay, OVO, DANA, LinkAja, ShopeePay",
        "Paket Sembako Spesial Indofood (Minyak Bimoli, Terigu, Mi)",
        "Kupon Undian Berhadiah Gadget & Motor",
        "Merchandise Eksklusif SiCuan x Indofood",
      ],
      caraKlaim:
        "Buka menu 'Tukar Reward', pilih nominal e-wallet atau sembako yang diinginkan, masukkan nomor HP e-wallet Anda, dan saldo akan ditransfer oleh admin.",
    },
    ecoImpact: {
      stat1: { value: "Zero Waste", label: "Cegah Sampah ke TPA" },
      stat2: { value: "Cuan Nyata", label: "Tukar Jadi Saldo E-Wallet" },
      stat3: { value: "100%", label: "Daur Ulang Sirkular" },
    },
  },
};
