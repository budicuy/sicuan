"use client";

import {
  Award,
  Building,
  CheckCircle,
  Coins,
  Gift,
  Leaf,
  TrendingUp,
  Truck,
  User,
} from "lucide-react";
import type React from "react";

// ─── Trash Types ────────────────────────────────────────────────────────────
export const TRASH_TYPES = [
  {
    id: "plastik",
    name: "Plastik Kemasan",
    price: 4500,
    points: 15,
    unit: "Kg",
    desc: "Kemasan mie instan, pouch bumbu, bungkus luar plastik",
  },
  {
    id: "paper-cup",
    name: "Paper Cup",
    price: 3000,
    points: 10,
    unit: "Kg",
    desc: "Gelas kertas makanan instan, cup minuman kertas",
  },
  {
    id: "karton",
    name: "Karton / Kardus",
    price: 2500,
    points: 8,
    unit: "Kg",
    desc: "Karton box pembungkus karton mi instan, kardus luar",
  },
];

// ─── Utensils Icon ──────────────────────────────────────────────────────────
export function UtensilsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>Utensils</title>
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z" />
      <path d="M19 15v7" />
    </svg>
  );
}

// ─── Roles ───────────────────────────────────────────────────────────────────
export const ROLES = [
  {
    id: "konsumen",
    name: "Konsumen Individu",
    icon: User,
    desc: "Masyarakat umum yang mengumpulkan kemasan produk makanan di sekitar rumah.",
    rewardType: "Poin & Kupon",
    rewardDesc:
      "Setiap setoran dikonversi menjadi Poin yang dapat ditukar dengan Kupon Belanja Produk Pangan sesuai tingkatan tier.",
    actionText: "Pelajari Alur Setoran",
    actionHref: "#alur",
    features: [
      "Setor sampah langsung ke drop point resmi kami",
      "Kumpulkan poin per kilogram setoran",
      "Tukar poin dengan Kupon Diskon Belanja Produk kami",
      "Tiering Kupon: Bronze (100 Poin), Silver (250 Poin), Gold (500 Poin)",
    ],
  },
  {
    id: "warmiendo",
    name: "Mitra Warmiendo",
    icon: UtensilsIcon,
    desc: "Warung makan mitra resmi yang menghasilkan limbah kemasan mie instan dalam jumlah besar.",
    rewardType: "Saldo Rekening",
    rewardDesc:
      "Dapatkan saldo Rupiah yang dapat dicairkan langsung ke rekening bank terdaftar atau dompet digital Anda.",
    actionText: "Hubungi Kontak Admin",
    actionHref: "mailto:info@sicuan.id",
    features: [
      "Metode setor langsung atau via ekspedisi rekanan",
      "Biaya ongkos kirim ekspedisi disubsidi sistem",
      "Reward saldo dikonversi langsung dari berat sampah",
      "Pencairan dana langsung ke rekening bank (H+1 kerja)",
    ],
  },
  {
    id: "bank-sampah",
    name: "Bank Sampah / TPS",
    icon: Building,
    desc: "Lembaga pengelola lingkungan atau Tempat Pemrosesan Sementara mitra ketiga.",
    rewardType: "Uang Tunai Tunai",
    rewardDesc:
      "Dapatkan konversi harga khusus per tonase sampah serta insentif pengelolaan lingkungan.",
    actionText: "Hubungi Kontak Admin",
    actionHref: "mailto:info@sicuan.id",
    features: [
      "Pencatatan volume sampah TPS terintegrasi",
      "Penjemputan terjadwal oleh truk logistik perusahaan",
      "Laporan audit keberlanjutan & volume real-time",
      "Sistem pencairan dana massal untuk pengelola",
    ],
  },
];

// ─── FAQs ────────────────────────────────────────────────────────────────────
export const FAQS = [
  {
    q: "Apa itu SICUAN?",
    a: "SICUAN (Sistem Informasi Cerdas Ubah Anorganik Jadi Nilai) adalah platform digital resmi wilayah Banjarmasin untuk mendukung sirkularitas ekonomi dengan mengelola dan mendaur ulang sampah kemasan plastik/kertas produk makanan menjadi bahan baku bernilai guna.",
  },
  {
    q: "Siapa saja yang bisa bergabung?",
    a: "Siapa saja bisa bergabung! Kami memiliki program khusus untuk Konsumen Individu, pemilik warung mitra (Warmiendo), serta pengelola komunitas/TPS (Bank Sampah) dengan skema reward yang disesuaikan masing-masing peran.",
  },
  {
    q: "Bagaimana cara menyetorkan sampah?",
    a: "Anda bisa menyetorkan secara langsung ke kantor divisi terdekat (untuk konsumen & Warmiendo), mengirim via ekspedisi mitra terdaftar (khusus Warmiendo), atau mendaftarkan penjemputan berkala bagi volume besar (khusus Bank Sampah).",
  },
  {
    q: "Bagaimana cara kerja penukaran poin konsumen?",
    a: "Setiap kilogram sampah anorganik yang Anda setorkan akan bernilai poin. Poin tersebut diakumulasikan dalam akun Anda. Setelah mencapai batas minimal tertentu (Tier Bronze: 100 Poin), Anda bisa langsung menukarkannya dengan kupon potongan harga belanja produk makanan langsung di aplikasi.",
  },
  {
    q: "Berapa lama proses pencairan saldo Warmiendo dan Bank Sampah?",
    a: "Setelah setoran Anda divalidasi oleh petugas Admin kami di gudang penyimpanan, nominal saldo Rupiah akan masuk ke akun Anda. Anda dapat mengajukan penarikan dana di dashboard, dan dana akan ditransfer ke rekening bank Anda dalam 1-2 hari kerja.",
  },
];

// ─── Mini Card ───────────────────────────────────────────────────────────────
export interface MiniCardData {
  id: string;
  type: "stats" | "points" | "progress" | "history" | "chart";
  title: string;
  subtitle?: string;
  value: string;
  trend?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  cardBg: string;
  cardBorder: string;
  iconColor: string;
  iconBg: string;
  glowColor: string;
  trendColor: string;
}

export const MINI_CARDS: MiniCardData[] = [
  {
    id: "warmiendo",
    type: "stats",
    title: "Warmiendo Ipul",
    subtitle: "Mitra #W-29402",
    value: "412.5 Kg",
    trend: "+12.4% bln ini",
    icon: UtensilsIcon,
    cardBg: "bg-gradient-to-br from-emerald-600 to-teal-900",
    cardBorder: "border-white/20 hover:border-white/40",
    iconColor: "text-white",
    iconBg: "bg-white/10 border-white/10",
    glowColor: "from-white/10",
    trendColor: "text-emerald-200",
  },
  {
    id: "budi",
    type: "points",
    title: "Budi Santoso",
    subtitle: "Kupon Belanja",
    value: "1.260 Poin",
    trend: "Gold Tier 🥇",
    icon: Award,
    cardBg: "bg-gradient-to-br from-amber-500 to-orange-800",
    cardBorder: "border-white/20 hover:border-white/40",
    iconColor: "text-white",
    iconBg: "bg-white/10 border-white/10",
    glowColor: "from-white/10",
    trendColor: "text-amber-200",
  },
  {
    id: "carbon",
    type: "progress",
    title: "Carbon Saved",
    subtitle: "Dampak Lingkungan",
    value: "0.42 Ton CO2",
    trend: "Efisiensi 94%",
    icon: Leaf,
    cardBg: "bg-gradient-to-br from-green-500 to-emerald-900",
    cardBorder: "border-white/20 hover:border-white/40",
    iconColor: "text-white",
    iconBg: "bg-white/10 border-white/10",
    glowColor: "from-white/10",
    trendColor: "text-green-200",
  },
  {
    id: "truk",
    type: "history",
    title: "Truk Armada #03",
    subtitle: "Bank Sampah",
    value: "1.2 Ton Karton",
    trend: "Dalam Perjalanan",
    icon: Truck,
    cardBg: "bg-gradient-to-br from-blue-500 to-indigo-900",
    cardBorder: "border-white/20 hover:border-white/40",
    iconColor: "text-white",
    iconBg: "bg-white/10 border-white/10",
    glowColor: "from-white/10",
    trendColor: "text-blue-200",
  },
  {
    id: "kedai",
    type: "stats",
    title: "Kedai Berkah",
    subtitle: "Setoran Plastik",
    value: "24.8 Kg",
    trend: "Terverifikasi",
    icon: CheckCircle,
    cardBg: "bg-gradient-to-br from-teal-500 to-cyan-900",
    cardBorder: "border-white/20 hover:border-white/40",
    iconColor: "text-white",
    iconBg: "bg-white/10 border-white/10",
    glowColor: "from-white/10",
    trendColor: "text-teal-200",
  },
  {
    id: "voucher",
    type: "points",
    title: "Tukar Voucher",
    subtitle: "Supermarket Mitra",
    value: "Voucher Belanja",
    trend: "Senilai Rp 75.000",
    icon: Gift,
    cardBg: "bg-gradient-to-br from-rose-500 to-pink-900",
    cardBorder: "border-white/20 hover:border-white/40",
    iconColor: "text-white",
    iconBg: "bg-white/10 border-white/10",
    glowColor: "from-white/10",
    trendColor: "text-rose-200",
  },
  {
    id: "volume",
    type: "chart",
    title: "Total Bulan Ini",
    subtitle: "Daur Ulang Kertas",
    value: "12,450 Kg",
    trend: "+18.7% bln lalu",
    icon: TrendingUp,
    cardBg: "bg-gradient-to-br from-lime-500 to-green-900",
    cardBorder: "border-white/20 hover:border-white/40",
    iconColor: "text-white",
    iconBg: "bg-white/10 border-white/10",
    glowColor: "from-white/10",
    trendColor: "text-lime-200",
  },
  {
    id: "retail",
    type: "stats",
    title: "Toko Kelontong",
    subtitle: "Mitra Retail",
    value: "Mitra Baru",
    trend: "Aktif Setor",
    icon: User,
    cardBg: "bg-gradient-to-br from-violet-500 to-purple-900",
    cardBorder: "border-white/20 hover:border-white/40",
    iconColor: "text-white",
    iconBg: "bg-white/10 border-white/10",
    glowColor: "from-white/10",
    trendColor: "text-violet-200",
  },
  {
    id: "rewards",
    type: "progress",
    title: "Bank Sampah",
    subtitle: "TPS Mitra #B-50912",
    value: "Rp 14.580.000",
    trend: "Ditransfer H+1",
    icon: Coins,
    cardBg: "bg-gradient-to-br from-fuchsia-500 to-pink-950",
    cardBorder: "border-white/20 hover:border-white/40",
    iconColor: "text-white",
    iconBg: "bg-white/10 border-white/10",
    glowColor: "from-white/10",
    trendColor: "text-fuchsia-200",
  },
];
