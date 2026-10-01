"use server";

import { eq } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import type { PetaRole } from "@/app/lib/peta-sampah-data";
import { db } from "@/db";
import { nasabah } from "@/db/schema";

export interface PetaWaypoint {
  stepNumber: number;
  badge: string;
  title: string;
  subtitle: string;
  actor: string;
  locationName: string;
  address: string;
  coords: [number, number]; // [lat, lng]
  iconType: "source" | "truck" | "bank" | "factory" | "reward";
  status: "completed" | "active" | "target";
  description: string;
  sampahFlow: string;
  rewardCuan: string;
  metrics: {
    label: string;
    value: string;
  };
}

export interface RolePetaSpasialResult {
  role: PetaRole;
  userName: string;
  roleLabel: string;
  userCoords: [number, number];
  waypoints: PetaWaypoint[];
  routePolyline: [number, number][];
  totalDistanceKm: number;
  totalEstimasiCuan: string;
}

// Koordinat Resmi Pabrik & Reward Hub PT. Indofood
const INDOFOOD_PABRIK: {
  name: string;
  latitude: number;
  longitude: number;
  alamat: string;
} = {
  name: "Pabrik Daur Ulang PT. Indofood CBP Sukses Makmur",
  latitude: -3.5495692587301937,
  longitude: 114.73002728210881,
  alamat: "Kawasan Industri Liang Anggang, Jl. A. Yani Km. 21, Banjarbaru",
};

const INDOFOOD_REWARD_HUB: {
  name: string;
  latitude: number;
  longitude: number;
  alamat: string;
} = {
  name: "Sentra Logistik & Klaim Reward PT. Indofood",
  latitude: -3.5422,
  longitude: 114.7231,
  alamat: "Hub Distribusi Sembako & Reward Cuan Indofood CBP",
};

async function getCurrentUserFromToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return decodeJwt(token) as {
      id: number;
      name: string;
      role: string;
      username: string;
    };
  } catch {
    return null;
  }
}

export async function getRolePetaSpasialData(
  targetRole: PetaRole,
): Promise<RolePetaSpasialResult> {
  const tokenUser = await getCurrentUserFromToken();
  const userId = tokenUser?.id;

  // 1. Ambil data profil nasabah login bila ada
  let dbUser = null;
  if (userId) {
    dbUser = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, userId),
    });
  }

  // 2. Ambil data Bank Sampah Tipe A mitra
  const bankSampahA = await db.query.nasabah.findFirst({
    where: eq(nasabah.role, "bank-sampah"),
  });

  // 3. Ambil data Bank Sampah Tipe B bila ada
  const bankSampahB = await db.query.nasabah.findFirst({
    where: eq(nasabah.role, "bank-sampah-b"),
  });

  // Tentukan nama user & lokasi user default sesuai role
  const defaultCoordsByRole: Record<PetaRole, [number, number]> = {
    warmindo: [-3.32426, 114.59102], // Banjarmasin Utara (Sultan Adam)
    "bank-sampah": [-3.29826, 114.58602], // Banjarmasin Utara (Kayu Tangi)
    "bank-sampah-b": [-3.4421, 114.8315], // Banjarbaru (Loktabat)
    konsumen: [-3.315, 114.602], // Banjarmasin Timur
  };

  const defaultAddressByRole: Record<PetaRole, string> = {
    warmindo: "Jl. Sultan Adam No. 42, Banjarmasin Utara",
    "bank-sampah": "Jl. Brigjend H. Hasan Basry No. 88, Banjarmasin",
    "bank-sampah-b": "Jl. A. Yani Km 34 No. 12, Banjarbaru",
    konsumen: "Komp. Mandiri Lestari Blok B-14, Banjarmasin",
  };

  const defaultNameByRole: Record<PetaRole, string> = {
    warmindo: "Warmindo Berkah Barokah",
    "bank-sampah": "Bank Sampah Induk Barokah (Tipe A)",
    "bank-sampah-b": "Bank Sampah Unit Mobile Bintang (Tipe B)",
    konsumen: "Nasabah Konsumen Rumah Tangga",
  };

  const userLat = dbUser?.latitude ?? defaultCoordsByRole[targetRole][0];
  const userLng = dbUser?.longitude ?? defaultCoordsByRole[targetRole][1];
  const userName =
    dbUser?.name ?? tokenUser?.name ?? defaultNameByRole[targetRole];
  const userAddress = dbUser?.alamat ?? defaultAddressByRole[targetRole];

  // Koordinat Bank Sampah A
  const bankALat = bankSampahA?.latitude ?? -3.29826;
  const bankALng = bankSampahA?.longitude ?? 114.58602;
  const bankAName = bankSampahA?.name ?? "Bank Sampah Induk (Tipe A)";
  const bankAAddress = bankSampahA?.alamat ?? "Jl. Hasan Basry, Banjarmasin";

  // Koordinat Bank Sampah B / Armada Penjemput
  const bankBLat = bankSampahB?.latitude ?? -3.4421;
  const bankBLng = bankSampahB?.longitude ?? 114.8315;
  const _bankBName = bankSampahB?.name ?? "Armada Mobile Bank Sampah Tipe B";
  const _bankBAddress = bankSampahB?.alamat ?? "Jl. A. Yani Km 34, Banjarbaru";

  // Titik transit / armada bergerak antara user dan bank sampah
  const transitLat = (userLat + bankALat) / 2 + 0.006;
  const transitLng = (userLng + bankALng) / 2 - 0.005;

  let waypoints: PetaWaypoint[] = [];
  let roleLabel = "";
  let totalEstimasiCuan = "";

  if (targetRole === "warmindo") {
    roleLabel = "Mitra Gerai Warmindo";
    totalEstimasiCuan = "100 - 150 Poin / kg (~Sembako Bimoli & Terigu)";
    waypoints = [
      {
        stepNumber: 1,
        badge: "Titik Asal / Hulu",
        title: "Pemilahan & Setor di Gerai Warmindo",
        subtitle: "Pilah Bungkus Mie, Bumbu & Kardus",
        actor: `Pemilik & Tim ${userName}`,
        locationName: userName,
        address: userAddress,
        coords: [userLat, userLng],
        iconType: "source",
        status: "active",
        description:
          "Sampah kemasan Indomie (etiket plastik, sachet bumbu, kardus box) dipilah rapi di dapur gerai Warmindo dalam keadaan kering.",
        sampahFlow: "Kemasan mie instan & karton terpilah siap diangkut",
        rewardCuan: "100 Poin/kg Karton, 150 Poin/kg Etiket Plastik",
        metrics: { label: "Estimasi Setoran", value: "25 - 50 kg / minggu" },
      },
      {
        stepNumber: 2,
        badge: "Armada Logistik",
        title: "Penjemputan oleh Armada Ekspedisi / Bank Sampah B",
        subtitle: "Layanan Door-to-Door SiCuan",
        actor: "Kurir Ekspedisi SiCuan & Armada Bank Sampah B",
        locationName: "Titik Penjemputan Gerai",
        address: `Rute Logistik Area ${userAddress}`,
        coords: [transitLat, transitLng],
        iconType: "truck",
        status: "target",
        description:
          "Armada kurir atau Bank Sampah B mendatangi gerai Warmindo tanpa biaya kirim untuk mengambil sampah yang telah diajukan di aplikasi.",
        sampahFlow: "Sampah dimuat ke kendaraan angkut SiCuan",
        rewardCuan: "Bebas Biaya Kirim & Hemat Waktu Operasional",
        metrics: { label: "Status Logistik", value: "Armada Standby" },
      },
      {
        stepNumber: 3,
        badge: "Verifikasi & Timbangan",
        title: "Pusat Verifikasi Bank Sampah Tipe A",
        subtitle: "Penimbangan Digital & Pengepresan Baling",
        actor: `Petugas ${bankAName}`,
        locationName: bankAName,
        address: bankAAddress,
        coords: [bankALat, bankALng],
        iconType: "bank",
        status: "target",
        description:
          "Sampah ditimbang dengan timbangan digital resmi yang terverifikasi ke sistem, lalu dipres menjadi baling plastik padat.",
        sampahFlow: "Plastik & karton dipres menjadi baling siap daur ulang",
        rewardCuan: "Poin langsung masuk otomatis ke akun Warmindo",
        metrics: {
          label: "Verifikasi Data",
          value: "100% Akurat & Transparan",
        },
      },
      {
        stepNumber: 4,
        badge: "Industri Daur Ulang",
        title: "Pabrik PT. Indofood CBP Sukses Makmur",
        subtitle: "Fasilitas Pengolahan & Daur Ulang Sirkular",
        actor: "Divisi Keberlanjutan & Daur Ulang PT Indofood",
        locationName: INDOFOOD_PABRIK.name,
        address: INDOFOOD_PABRIK.alamat,
        coords: [INDOFOOD_PABRIK.latitude, INDOFOOD_PABRIK.longitude],
        iconType: "factory",
        status: "target",
        description:
          "Baling kemasan plastik diolah menjadi butiran daur ulang (r-PET/r-PP) dan produk bernilai guna dalam rantai ekonomi sirkular.",
        sampahFlow: "Daur ulang bahan baku kemasan berkelanjutan",
        rewardCuan: "Penerbitan Kuota Reward & Insentif Top Kontributor",
        metrics: { label: "Dampak Lingkungan", value: "-85% Emisi Plastik" },
      },
      {
        stepNumber: 5,
        badge: "Puncak Cuan & Reward",
        title: "Sentra Penukaran Reward Bahan Baku Indofood",
        subtitle: "Klaim Minyak Bimoli, Terigu & Sembako Murah",
        actor: "Mitra Warmindo & Indofood Hub",
        locationName: INDOFOOD_REWARD_HUB.name,
        address: INDOFOOD_REWARD_HUB.alamat,
        coords: [INDOFOOD_REWARD_HUB.latitude, INDOFOOD_REWARD_HUB.longitude],
        iconType: "reward",
        status: "target",
        description:
          "Poin yang terkumpul ditukarkan langsung dengan pasokan minyak goreng Bimoli, tepung Segitiga Biru, kecap, hingga reward kas bulanan.",
        sampahFlow: "Siklus tuntas: Sampah berubah jadi modal usaha gerai",
        rewardCuan: "Hemat s/d Rp 1.500.000 / bulan untuk kebutuhan warung",
        metrics: { label: "Keuntungan Gerai", value: "Profit Maksimal" },
      },
    ];
  } else if (targetRole === "bank-sampah") {
    roleLabel = "Pengelola Bank Sampah Tipe A";
    totalEstimasiCuan = "Margin Rp 2.500 - Rp 4.500 / kg + Dana Operasional";
    waypoints = [
      {
        stepNumber: 1,
        badge: "Sumber Sampah Komunitas",
        title: "Penerimaan Sampah dari Mitra Warmindo & Warga",
        subtitle: "Konsolidasi Pasokan Wilayah",
        actor: "Jaringan Warmindo, Konsumen & Pos Satelit",
        locationName: "Zona Kemitraan Komunitas",
        address: `Wilayah Agregasi ${userAddress}`,
        coords: [userLat + 0.015, userLng - 0.01],
        iconType: "source",
        status: "active",
        description:
          "Bank Sampah Tipe A menghimpun pasokan sampah terpilah dari puluhan gerai Warmindo binaan dan warga sekitar.",
        sampahFlow: "Volume masuk kemasan karton & plastik anorganik",
        rewardCuan: "Akumulasi volume setor untuk kuota industri",
        metrics: { label: "Target Pasokan", value: "2 - 5 Ton / minggu" },
      },
      {
        stepNumber: 2,
        badge: "Armada Agregasi",
        title: "Penjemputan Armada Logistik & Pengiriman Mandiri",
        subtitle: "Sistem Logistik Terjadwal SiCuan",
        actor: "Armada Truk SiCuan & Ekspedisi Bank Sampah B",
        locationName: "Pos Rute Distribusi Angkut",
        address: "Jalur Logistik Utama Kota",
        coords: [(userLat + bankBLat) / 2, (userLng + bankBLng) / 2],
        iconType: "truck",
        status: "target",
        description:
          "Pengangkutan pasokan sampah secara terkoordinasi langsung menuju fasilitas utama Bank Sampah Tipe A.",
        sampahFlow: "Mobilisasi bahan daur ulang dalam jumlah besar",
        rewardCuan: "Efisiensi biaya angkut via rute terintegrasi SiCuan",
        metrics: { label: "Armada", value: "Roda 3 & Truk Pickup" },
      },
      {
        stepNumber: 3,
        badge: "Fasilitas Utama Olah",
        title: `Gudang & Mesin Baling ${userName}`,
        subtitle: "Sortir, Timbang & Pengepresan Baling Skala Besar",
        actor: `Petugas Operator ${userName}`,
        locationName: userName,
        address: userAddress,
        coords: [userLat, userLng],
        iconType: "bank",
        status: "target",
        description:
          "Pengepresan baling hidrolik berstandar industri dengan kapasitas baling 50-100 kg per baling untuk efisiensi kontainer.",
        sampahFlow: "Sampah padat dipres berstandar kirim pabrik Indofood",
        rewardCuan: "Nilai jual baling terstandarisasi jauh lebih tinggi",
        metrics: { label: "Kapasitas Olah", value: "10 Ton / bulan" },
      },
      {
        stepNumber: 4,
        badge: "Pengiriman Industri",
        title: "Penerimaan di Pabrik PT. Indofood CBP",
        subtitle: "Verifikasi Mutu & Berat Skala Pabrik",
        actor: "Quality Control Daur Ulang PT Indofood",
        locationName: INDOFOOD_PABRIK.name,
        address: INDOFOOD_PABRIK.alamat,
        coords: [INDOFOOD_PABRIK.latitude, INDOFOOD_PABRIK.longitude],
        iconType: "factory",
        status: "target",
        description:
          "Truk kontainer menurunkan baling plastik untuk dicek kadar air, densitas, dan kebersihan sebelum masuk jalur giling.",
        sampahFlow: "Baling masuk jalur peleburan & daur ulang industri",
        rewardCuan: "Penerbitan Surat Pembayaran Resmi & Bukti Timbang Pabrik",
        metrics: { label: "Status Penerimaan", value: "Lolos Uji Mutu QC" },
      },
      {
        stepNumber: 5,
        badge: "Cair Dana & Insentif",
        title: "Pencairan Dana Kemitraan & Bonus Produksi",
        subtitle: "Transfer Kas Bank & Insentif Mitra Unggulan",
        actor: "Finance PT Indofood & Bank Sampah A",
        locationName: INDOFOOD_REWARD_HUB.name,
        address: INDOFOOD_REWARD_HUB.alamat,
        coords: [INDOFOOD_REWARD_HUB.latitude, INDOFOOD_REWARD_HUB.longitude],
        iconType: "reward",
        status: "target",
        description:
          "Dana hasil penjualan sampah langsung ditransfer ke rekening bank resmi, disertai insentif performa bulanan dari PT Indofood.",
        sampahFlow:
          "Omzet puluhan juta rupiah dari pengelolaan sampah bernilai",
        rewardCuan: "Pencairan dana langsung ke rekening giro Bank Sampah",
        metrics: { label: "Perputaran Kas", value: "Rp 15jt - 50jt / bulan" },
      },
    ];
  } else if (targetRole === "bank-sampah-b") {
    roleLabel = "Bank Sampah Unit Mobile (Tipe B)";
    totalEstimasiCuan = "Poin Instan + Margin Jemput + Bonus Armada Mobile";
    waypoints = [
      {
        stepNumber: 1,
        badge: "4 Sumber Jemput",
        title: "Titik Sumber: Warmindo, Pabrik, Karyawan & Warga",
        subtitle: "Operasi Jemput Bola Wilayah",
        actor: "Tim Petugas Lapangan Bank Sampah B",
        locationName: "Area Operasi Jemput Banjarbaru - Martapura",
        address: "Wilayah Pelayanan Mobile",
        coords: [userLat + 0.02, userLng + 0.015],
        iconType: "source",
        status: "active",
        description:
          "Petugas mobile mendatangi 4 segmen sumber sampah: gerai Warmindo, rumah karyawan Indofood, area luar pabrik, dan perumahan warga.",
        sampahFlow: "Sampah kemasan mie & kardus ditimbang di tempat",
        rewardCuan: "Pemberian poin langsung di lokasi penjemputan",
        metrics: { label: "Cakupan Rute", value: "4 Segmen Strategis" },
      },
      {
        stepNumber: 2,
        badge: "Armada Motor & Pickup",
        title: `Armada Mobile ${userName}`,
        subtitle: "Keliling Aktif Jemput Bola SiCuan",
        actor: "Driver & Kurir Armada Bank Sampah B",
        locationName: "Pos Bergerak Armada",
        address: `Rute Aktif ${userAddress}`,
        coords: [userLat + 0.008, userLng - 0.008],
        iconType: "truck",
        status: "target",
        description:
          "Armada roda tiga dan pikap bergerak menjemput setoran sampah berdasarkan notifikasi order real-time pada aplikasi SiCuan.",
        sampahFlow: "Pengangkutan cepat mencegah penumpukan sampah di warung",
        rewardCuan: "Insentif per kilometer jemput & komisi per kilogram",
        metrics: { label: "Kecepatan Respon", value: "< 2 Jam Jemput" },
      },
      {
        stepNumber: 3,
        badge: "Pos Transit & Sortir",
        title: `Pos Transit Bank Sampah B (${userName})`,
        subtitle: "Sortir Cepat & Penimbangan Elektronik",
        actor: `Tim Gudang ${userName}`,
        locationName: userName,
        address: userAddress,
        coords: [userLat, userLng],
        iconType: "bank",
        status: "target",
        description:
          "Sampah yang terkumpul disortir berdasarkan jenis kemasan, dipadatkan, dan disiapkan untuk disalurkan ke Bank Sampah Tipe A atau Indofood.",
        sampahFlow: "Akumulasi volume sampah mobile siap salur",
        rewardCuan: "Poin agregasi tersimpan aman di dompet SiCuan",
        metrics: { label: "Kapasitas Harian", value: "500 - 1.000 kg / hari" },
      },
      {
        stepNumber: 4,
        badge: "Salur Industri",
        title: "Penyaluran ke Daur Ulang PT. Indofood",
        subtitle: "Sinergi Rantai Pasok Berkelanjutan",
        actor: "Logistik PT Indofood & Bank Sampah B",
        locationName: INDOFOOD_PABRIK.name,
        address: INDOFOOD_PABRIK.alamat,
        coords: [INDOFOOD_PABRIK.latitude, INDOFOOD_PABRIK.longitude],
        iconType: "factory",
        status: "target",
        description:
          "Sampah diserahkan ke fasilitas daur ulang Indofood untuk diproses dan diverifikasi sebagai kontribusi reduksi sampah.",
        sampahFlow: "Masuk ke ekosistem daur ulang industri resmi",
        rewardCuan: "Validasi poin bonus kemitraan Bank Sampah B",
        metrics: { label: "Tingkat Daur Ulang", value: "100% Terlacak" },
      },
      {
        stepNumber: 5,
        badge: "Reward & Cuan Armada",
        title: "Penukaran Reward Sembako & Insentif Armada",
        subtitle: "Katalog Khusus Bank Sampah B",
        actor: "Manajemen Bank Sampah B & SiCuan",
        locationName: INDOFOOD_REWARD_HUB.name,
        address: INDOFOOD_REWARD_HUB.alamat,
        coords: [INDOFOOD_REWARD_HUB.latitude, INDOFOOD_REWARD_HUB.longitude],
        iconType: "reward",
        status: "target",
        description:
          "Poin ditukarkan di menu 'Tukar Reward Bank Sampah B' untuk paket sembako, voucher BBM operasional armada, dan insentif tunai pengemudi.",
        sampahFlow: "Operasional armada mobile mandiri dan menguntungkan",
        rewardCuan: "Klaim Paket Sembako Indofood, Kupon BBM & Saldo Kas",
        metrics: { label: "Manfaat Armada", value: "Insentif Operasional" },
      },
    ];
  } else {
    // Konsumen
    roleLabel = "Nasabah Konsumen Rumah Tangga";
    totalEstimasiCuan = "Saldo E-Wallet (GoPay, OVO, DANA) & Voucher Belanja";
    waypoints = [
      {
        stepNumber: 1,
        badge: "Sumber Rumah Tangga",
        title: "Pemilahan Sampah di Rumah Konsumen",
        subtitle: "Pilah Sampah Kemasan Mi & Plastik Bersih",
        actor: userName,
        locationName: `Kediaman ${userName}`,
        address: userAddress,
        coords: [userLat, userLng],
        iconType: "source",
        status: "active",
        description:
          "Pilah bungkus kemasan mi instan, kardus biskuit, dan botol plastik di rumah. Pastikan bersih dan kering sebelum disetorkan.",
        sampahFlow: "Sampah rumah tangga terpilah dari sumbernya",
        rewardCuan: "Tiap kg sampah terpilah bernilai poin langsung",
        metrics: { label: "Estimasi Rumah", value: "3 - 10 kg / setoran" },
      },
      {
        stepNumber: 2,
        badge: "Drop Point / Jemput",
        title: "Titik Drop Point & Kurir Penjemput",
        subtitle: "Pilihan Drop Box atau Dijemput Kurir",
        actor: "Armada Kurir SiCuan & Petugas Drop Box",
        locationName: "Drop Point Terdekat",
        address: "Jl. Sultan Adam / Drop Box Indomaret Mitra",
        coords: [transitLat, transitLng],
        iconType: "truck",
        status: "target",
        description:
          "Bawa ke Drop Point Bank Sampah terdekat atau gunakan opsi penjemputan armada SiCuan jika volume sampah memenuhi kuota minimal.",
        sampahFlow: "Penyerahan sampah dengan scan barcode setoran",
        rewardCuan: "Kemudahan setoran tanpa ribet",
        metrics: { label: "Aksesibilitas", value: "Dekat & Fleksibel" },
      },
      {
        stepNumber: 3,
        badge: "Bank Sampah Terdekat",
        title: `Pemeriksaan di ${bankAName}`,
        subtitle: "Penimbangan Digital & Pencatatan Poin",
        actor: `Petugas Kasir ${bankAName}`,
        locationName: bankAName,
        address: bankAAddress,
        coords: [bankALat, bankALng],
        iconType: "bank",
        status: "target",
        description:
          "Petugas menimbang sampah dan memindai QR nasabah. Poin nasabah langsung bertambah secara real-time di aplikasi ponsel Anda.",
        sampahFlow: "Sampah dipisahkan ke wadah fraksi daur ulang",
        rewardCuan: "Saldo poin bertambah detik itu juga",
        metrics: { label: "Pencatatan", value: "Real-time Notifikasi" },
      },
      {
        stepNumber: 4,
        badge: "Pengolahan Pabrik",
        title: "Fasilitas Daur Ulang PT. Indofood",
        subtitle: "Transformasi Kemasan Menjadi Barang Berguna",
        actor: "PT Indofood CBP Sukses Makmur Tbk",
        locationName: INDOFOOD_PABRIK.name,
        address: INDOFOOD_PABRIK.alamat,
        coords: [INDOFOOD_PABRIK.latitude, INDOFOOD_PABRIK.longitude],
        iconType: "factory",
        status: "target",
        description:
          "Kemasan mi instan Anda diproses menjadi produk daur ulang bernilai ekonomi, mencegah sampah mencemari sungai dan lautan.",
        sampahFlow: "Sampah plastik diselamatkan dari Tempat Pembuangan Akhir",
        rewardCuan: "Kontribusi nyata pada kebersihan lingkungan kota",
        metrics: { label: "Reduksi Sampah", value: "Zero Waste to Landfill" },
      },
      {
        stepNumber: 5,
        badge: "Cair Reward & Saldo",
        title: "Penukaran Poin ke Saldo E-Wallet & Voucher",
        subtitle: "Cairkan ke GoPay, OVO, DANA atau Voucher Sembako",
        actor: "Nasabah Konsumen & SiCuan Reward",
        locationName: INDOFOOD_REWARD_HUB.name,
        address: INDOFOOD_REWARD_HUB.alamat,
        coords: [INDOFOOD_REWARD_HUB.latitude, INDOFOOD_REWARD_HUB.longitude],
        iconType: "reward",
        status: "target",
        description:
          "Poin yang Anda kumpulkan dapat dicairkan kapan saja menjadi saldo e-wallet rupiah, pulsa, token listrik, atau kupon produk Indofood.",
        sampahFlow: "Sampah rumah tangga berubah menjadi tabungan cuan nyata",
        rewardCuan: "Cair langsung ke rekening GoPay, OVO, DANA, ShopeePay",
        metrics: { label: "Pilihan Reward", value: "E-Wallet & Sembako" },
      },
    ];
  }

  const routePolyline = waypoints.map((w) => w.coords);

  // Hitung jarak perkiraan total rute
  let totalDistKm = 0;
  for (let i = 0; i < routePolyline.length - 1; i++) {
    const [lat1, lon1] = routePolyline[i];
    const [lat2, lon2] = routePolyline[i + 1];
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistKm += R * c;
  }

  return {
    role: targetRole,
    userName,
    roleLabel,
    userCoords: [userLat, userLng],
    waypoints,
    routePolyline,
    totalDistanceKm: Number(totalDistKm.toFixed(1)),
    totalEstimasiCuan,
  };
}
