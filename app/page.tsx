"use client";

import {
  ArrowRight,
  Award,
  Building,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  FileText,
  Gift,
  Info,
  Leaf,
  Lock,
  Mail,
  MapPin,
  Menu,
  Minus,
  Phone,
  Plus,
  Recycle,
  ShieldCheck,
  TrendingUp,
  Truck,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";

// Trash data constants
const TRASH_TYPES = [
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

const ROLES = [
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
    icon: UtensilsIcon, // Custom or fallback icon
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

// Helper fallback for Utensils icon
function UtensilsIcon(props: React.SVGProps<SVGSVGElement>) {
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

interface MiniCardData {
  id: string;
  type: "stats" | "points" | "progress" | "history" | "chart";
  title: string;
  subtitle?: string;
  value: string;
  trend?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  colorClass: string;
}

const MINI_CARDS: MiniCardData[] = [
  {
    id: "warmiendo",
    type: "stats",
    title: "Warmiendo Ipul",
    subtitle: "Mitra #W-29402",
    value: "412.5 Kg",
    trend: "+12.4% bln ini",
    icon: UtensilsIcon,
    colorClass: "from-green-500/10 to-emerald-500/5 border-green-500/20",
  },
  {
    id: "budi",
    type: "points",
    title: "Budi Santoso",
    subtitle: "Kupon Belanja",
    value: "1.260 Poin",
    trend: "Gold Tier 🥇",
    icon: Award,
    colorClass: "from-amber-500/10 to-yellow-500/5 border-amber-500/20",
  },
  {
    id: "carbon",
    type: "progress",
    title: "Carbon Saved",
    subtitle: "Dampak Lingkungan",
    value: "0.42 Ton CO2",
    trend: "Efisiensi 94%",
    icon: Leaf,
    colorClass: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
  },
  {
    id: "truk",
    type: "history",
    title: "Truk Armada #03",
    subtitle: "Bank Sampah",
    value: "1.2 Ton Karton",
    trend: "Dalam Perjalanan",
    icon: Truck,
    colorClass: "from-blue-500/10 to-indigo-500/5 border-blue-500/20",
  },
  {
    id: "kedai",
    type: "stats",
    title: "Kedai Berkah",
    subtitle: "Setoran Plastik",
    value: "24.8 Kg",
    trend: "Terverifikasi",
    icon: CheckCircle,
    colorClass: "from-green-500/10 to-teal-500/5 border-green-500/20",
  },
  {
    id: "voucher",
    type: "points",
    title: "Tukar Voucher",
    subtitle: "Supermarket Mitra",
    value: "Voucher Belanja",
    trend: "Senilai Rp 75.000",
    icon: Gift,
    colorClass: "from-rose-500/10 to-pink-500/5 border-rose-500/20",
  },
  {
    id: "volume",
    type: "chart",
    title: "Total Bulan Ini",
    subtitle: "Daur Ulang Kertas",
    value: "12,450 Kg",
    trend: "+18.7% bln lalu",
    icon: TrendingUp,
    colorClass: "from-emerald-500/10 to-green-500/5 border-emerald-500/20",
  },
  {
    id: "retail",
    type: "stats",
    title: "Toko Kelontong",
    subtitle: "Mitra Retail",
    value: "Mitra Baru",
    trend: "Aktif Setor",
    icon: User,
    colorClass: "from-violet-500/10 to-fuchsia-500/5 border-violet-500/20",
  },
  {
    id: "rewards",
    type: "progress",
    title: "Bank Sampah",
    subtitle: "TPS Mitra #B-50912",
    value: "Rp 14.580.000",
    trend: "Ditransfer H+1",
    icon: Coins,
    colorClass: "from-cyan-500/10 to-blue-500/5 border-cyan-500/20",
  },
];

function MiniCard({ card }: { card: MiniCardData }) {
  const IconComponent = card.icon;
  return (
    <div className="bg-neutral-900/85 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg h-[140px] w-full text-white transition-all duration-300 hover:border-primary-500/40 hover:shadow-primary-500/10 group overflow-hidden relative">
      {/* Glow dot in background */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-500/10 to-transparent blur-md rounded-full -z-10 group-hover:scale-125 transition-transform duration-500" />

      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center border border-neutral-700/50">
            <IconComponent className="w-4 h-4 text-primary-400 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h5 className="text-[11px] font-bold text-neutral-100 truncate max-w-[125px] leading-tight">
              {card.title}
            </h5>
            {card.subtitle && (
              <p className="text-[9px] text-neutral-400 truncate max-w-[125px] mt-0.5">
                {card.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider block">
          Volume / Status
        </p>
        <p className="text-sm font-extrabold text-white tracking-tight mt-0.5">
          {card.value}
        </p>
        {card.trend && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[9px] text-emerald-400 font-semibold">
              {card.trend}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const FAQS = [
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

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState("konsumen");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  // Calculator State
  const [calcRole, setCalcRole] = useState("konsumen");
  const [calcTrash, setCalcTrash] = useState("plastik");
  const [calcWeight, setCalcWeight] = useState(10);
  const [calcResult, setCalcResult] = useState({ points: 0, cash: 0 });

  // Update calculator calculations
  useEffect(() => {
    const selectedTrash = TRASH_TYPES.find((t) => t.id === calcTrash);
    if (!selectedTrash) return;

    const basePrice = selectedTrash.price;
    const basePoints = selectedTrash.points;

    // Apply adjustments based on role if any
    let multiplier = 1;
    if (calcRole === "bank-sampah") {
      // Bank sampah gets 10% higher price due to large volume sorting
      multiplier = 1.1;
    }

    setCalcResult({
      points: Math.round(basePoints * calcWeight),
      cash: Math.round(basePrice * calcWeight * multiplier),
    });
  }, [calcRole, calcTrash, calcWeight]);

  // Sustainability numbers animation sim
  const [stats, setStats] = useState({
    recycled: 12450,
    rewards: 37350000,
    partners: 142,
    co2: 9.3,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        recycled: prev.recycled + Math.floor(Math.random() * 3) + 1,
        rewards: prev.rewards + (Math.floor(Math.random() * 3) + 1) * 3500,
        partners: prev.partners + (Math.random() > 0.95 ? 1 : 0),
        co2: parseFloat((prev.co2 + 0.002).toFixed(3)),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-primary-950 text-white select-none"
            exit={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
            transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-20 h-20 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-xl shadow-primary-600/30 mb-6"
            >
              <Recycle className="w-12 h-12 animate-spin-slow" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-3xl font-extrabold tracking-widest text-white flex items-center gap-2"
            >
              SICUAN
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-xs text-primary-300 uppercase tracking-widest mt-2"
            >
              Ubah Anorganik Jadi Nilai
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {!showSplash && (
        <div className="flex flex-col min-h-dvh bg-primary-50 text-neutral-900 font-sans selection:bg-primary-200 selection:text-primary-900 overflow-x-hidden bg-grid-pattern">
          {/* BACKGROUND DECORATIONS */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-[800px] right-10 w-[600px] h-[600px] bg-secondary-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* 1. NAVBAR (relative, not sticky) */}
          <header className="relative z-50 w-full border-b border-neutral-200/50 glassmorphism transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-md shadow-primary-600/30">
                  <Recycle className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <span className="text-xl font-bold tracking-tight text-primary-950 flex items-center gap-1.5">
                    SICUAN
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium border border-primary-200">
                      Official
                    </span>
                  </span>
                  <p className="text-[9px] text-neutral-500 font-medium tracking-wider uppercase leading-none mt-0.5">
                    Daur Ulang Sampah Jadi Nilai Ekonomi
                  </p>
                </div>
              </div>

              {/* Desktop Nav Links with Premium Hover Effects */}
              <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-neutral-700">
                <a
                  href="#fitur"
                  className="relative py-2 hover:text-primary-600 transition-colors group"
                >
                  Fitur Utama
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
                </a>
                <a
                  href="#mitra"
                  className="relative py-2 hover:text-primary-600 transition-colors group"
                >
                  Skema Kemitraan
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
                </a>
                <a
                  href="#kalkulator"
                  className="relative py-2 hover:text-primary-600 transition-colors group"
                >
                  Kalkulator Reward
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
                </a>
                <a
                  href="#alur"
                  className="relative py-2 hover:text-primary-600 transition-colors group"
                >
                  Alur Setoran
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
                </a>
                <a
                  href="#faq"
                  className="relative py-2 hover:text-primary-600 transition-colors group"
                >
                  FAQ
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
                </a>
              </nav>

              {/* Nav CTAs */}
              <div className="hidden md:flex items-center gap-4">
                <a
                  id="nav-login-btn"
                  href="#login"
                  className="text-sm font-semibold text-primary-700 hover:text-primary-800 px-4 py-2 transition-colors rounded-lg hover:bg-primary-100/50"
                >
                  Masuk
                </a>
                <a
                  id="nav-register-btn"
                  href="#login"
                  className="text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg shadow-sm shadow-primary-600/10 hover:shadow-primary-600/20 transition-all duration-200"
                >
                  Mulai Setor
                </a>
              </div>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
              <div className="md:hidden border-b border-neutral-200 bg-white px-4 py-6 space-y-4 animate-fade-in">
                <nav className="flex flex-col gap-4 font-medium text-neutral-700 items-start">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      document
                        .getElementById("fitur")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-primary-600 py-1 transition-colors text-left w-full cursor-pointer"
                  >
                    Fitur Utama
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      document
                        .getElementById("mitra")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-primary-600 py-1 transition-colors text-left w-full cursor-pointer"
                  >
                    Skema Kemitraan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      document
                        .getElementById("kalkulator")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-primary-600 py-1 transition-colors text-left w-full cursor-pointer"
                  >
                    Kalkulator Reward
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      document
                        .getElementById("alur")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-primary-600 py-1 transition-colors text-left w-full cursor-pointer"
                  >
                    Alur Setoran
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      document
                        .getElementById("faq")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-primary-600 py-1 transition-colors text-left w-full cursor-pointer"
                  >
                    FAQ
                  </button>
                </nav>
                <div className="h-px bg-neutral-200 w-full my-4" />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      document
                        .getElementById("login")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="w-full text-center py-2.5 rounded-lg border border-neutral-200 font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      document
                        .getElementById("login")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="w-full text-center py-2.5 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 shadow-sm transition-colors cursor-pointer"
                  >
                    Mulai Setor
                  </button>
                </div>
              </div>
            )}
          </header>

          {/* 2. HERO SECTION */}
          <section className="relative pt-12 pb-24 md:py-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                {/* Hero text content */}
                <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                  {/* Badge */}
                  <motion.div
                    initial={{ opacity: 0, filter: "blur(8px)", y: 15 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold border border-primary-200/60 shadow-sm mx-auto lg:mx-0"
                  >
                    <Leaf className="w-3.5 h-3.5 text-primary-600 animate-pulse" />
                    <span>Program Keberlanjutan Lingkungan Perusahaan</span>
                  </motion.div>

                  {/* Title */}
                  <motion.h1
                    initial={{ opacity: 0, filter: "blur(12px)", y: 25 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 leading-[1.1]"
                  >
                    Ubah Sampah{" "}
                    <span className="text-primary-600">Anorganik</span> Jadi
                    Nilai Ekonomi
                  </motion.h1>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="text-lg text-neutral-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed"
                  >
                    SICUAN menghubungkan Konsumen, Mitra Warmiendo, dan Bank
                    Sampah di Banjarmasin untuk mengumpulkan kemasan produk
                    makanan. Setor limbah Anda, kumpulkan poin/rupiah, dan bantu
                    wujudkan bumi yang lebih hijau.
                  </motion.p>

                  {/* CTAs */}
                  <motion.div
                    initial={{ opacity: 0, filter: "blur(8px)", y: 15 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
                  >
                    <a
                      href="#login"
                      className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-600/20 hover:shadow-primary-600/35 transition-all duration-300 flex items-center justify-center gap-2 group"
                    >
                      Mulai Setor Sekarang
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                    <a
                      href="#mitra"
                      className="w-full sm:w-auto px-8 py-4 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 font-bold transition-all duration-300 flex items-center justify-center gap-2 hover:border-neutral-400"
                    >
                      Pelajari Skema Reward
                    </a>
                  </motion.div>

                  {/* Features inline list */}
                  <motion.div
                    initial={{ opacity: 0, filter: "blur(8px)", y: 15 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                    className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-200/80 max-w-xl mx-auto lg:mx-0"
                  >
                    <div>
                      <h4 className="text-xl font-bold text-primary-950">
                        100%
                      </h4>
                      <p className="text-xs text-neutral-500">
                        Transparan & Real-time
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-primary-950">
                        Rp 0
                      </h4>
                      <p className="text-xs text-neutral-500">
                        Biaya Administrasi
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-primary-950">
                        1-2 Hari
                      </h4>
                      <p className="text-xs text-neutral-500">
                        Pencairan Cepat
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* 3. HERO VISUAL - Premium 3D Scrolling Dashboard Wall (WOW element) */}
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.95,
                    y: 30,
                    filter: "blur(10px)",
                  }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
                  className="lg:col-span-5 relative mt-6 lg:mt-0"
                >
                  <div className="relative mx-auto max-w-[440px] lg:max-w-none h-[580px] overflow-hidden flex items-center justify-center">
                    {/* Subtle ambient glow effects behind the 3D grid */}
                    <div className="absolute top-10 left-10 w-48 h-48 rounded-full bg-primary-600/5 blur-[80px] pointer-events-none" />
                    <div className="absolute bottom-10 right-10 w-56 h-56 rounded-full bg-emerald-500/10 blur-[90px] pointer-events-none" />

                    {/* The 3D Perspective Grid */}
                    <div className="w-[125%] h-[125%] flex gap-4 [perspective:1000px] [transform-style:preserve-3d] justify-center items-center">
                      <div className="grid grid-cols-3 gap-3 w-full max-w-[560px] [transform:rotateX(15deg)_rotateY(-18deg)_rotateZ(4deg)_scale(0.95)]">
                        {/* Column 1 (Scroll Up) */}
                        <div className="h-[600px] relative flex flex-col gap-3 py-1 select-none">
                          <div className="flex flex-col gap-3 animate-ticker-up hover:[animation-play-state:paused] cursor-pointer">
                            {[MINI_CARDS[0], MINI_CARDS[3], MINI_CARDS[6]].map(
                              (card, idx) => (
                                <MiniCard
                                  key={`col1-1-${card.id}-${idx}`}
                                  card={card}
                                />
                              ),
                            )}
                            {[MINI_CARDS[0], MINI_CARDS[3], MINI_CARDS[6]].map(
                              (card, idx) => (
                                <MiniCard
                                  key={`col1-2-${card.id}-${idx}`}
                                  card={card}
                                />
                              ),
                            )}
                          </div>
                        </div>

                        {/* Column 2 (Scroll Down) */}
                        <div className="h-[600px] relative flex flex-col gap-3 py-1 select-none">
                          <div className="flex flex-col gap-3 animate-ticker-down hover:[animation-play-state:paused] cursor-pointer">
                            {[MINI_CARDS[1], MINI_CARDS[4], MINI_CARDS[7]].map(
                              (card, idx) => (
                                <MiniCard
                                  key={`col2-1-${card.id}-${idx}`}
                                  card={card}
                                />
                              ),
                            )}
                            {[MINI_CARDS[1], MINI_CARDS[4], MINI_CARDS[7]].map(
                              (card, idx) => (
                                <MiniCard
                                  key={`col2-2-${card.id}-${idx}`}
                                  card={card}
                                />
                              ),
                            )}
                          </div>
                        </div>

                        {/* Column 3 (Scroll Up) */}
                        <div className="h-[600px] relative flex flex-col gap-3 py-1 select-none">
                          <div className="flex flex-col gap-3 animate-ticker-up hover:[animation-play-state:paused] cursor-pointer">
                            {[MINI_CARDS[2], MINI_CARDS[5], MINI_CARDS[8]].map(
                              (card, idx) => (
                                <MiniCard
                                  key={`col3-1-${card.id}-${idx}`}
                                  card={card}
                                />
                              ),
                            )}
                            {[MINI_CARDS[2], MINI_CARDS[5], MINI_CARDS[8]].map(
                              (card, idx) => (
                                <MiniCard
                                  key={`col3-2-${card.id}-${idx}`}
                                  card={card}
                                />
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top fade overlay matching page background (primary-50) */}
                    <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-primary-50 via-primary-50/90 to-transparent z-40 pointer-events-none" />

                    {/* Bottom fade overlay matching page background (primary-50) */}
                    <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-primary-50 via-primary-50/90 to-transparent z-40 pointer-events-none" />
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          <section className="bg-primary-950 text-white py-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-grid-pattern pointer-events-none" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-white/10">
                <div className="p-4">
                  <span className="text-[11px] font-bold text-primary-400 uppercase tracking-widest block">
                    Total Sampah Didaur Ulang
                  </span>
                  <span className="text-3xl sm:text-4xl font-extrabold mt-2 block tracking-tight tabular-nums">
                    {stats.recycled.toLocaleString("id-ID")} Kg
                  </span>
                  <p className="text-xs text-neutral-400 mt-1">
                    Kemasan Anorganik Produk
                  </p>
                </div>

                <div className="p-4 pt-8 lg:pt-4">
                  <span className="text-[11px] font-bold text-primary-400 uppercase tracking-widest block">
                    Reward Dana Dibayarkan
                  </span>
                  <span className="text-3xl sm:text-4xl font-extrabold mt-2 block tracking-tight tabular-nums text-emerald-400">
                    Rp {stats.rewards.toLocaleString("id-ID")}
                  </span>
                  <p className="text-xs text-neutral-400 mt-1">
                    Ke Seluruh Lapisan Mitra
                  </p>
                </div>

                <div className="p-4 pt-8 lg:pt-4">
                  <span className="text-[11px] font-bold text-primary-400 uppercase tracking-widest block">
                    Mitra Terverifikasi
                  </span>
                  <span className="text-3xl sm:text-4xl font-extrabold mt-2 block tracking-tight tabular-nums">
                    {stats.partners} Mitra
                  </span>
                  <p className="text-xs text-neutral-400 mt-1">
                    Warmiendo & Bank Sampah
                  </p>
                </div>

                <div className="p-4 pt-8 lg:pt-4">
                  <span className="text-[11px] font-bold text-primary-400 uppercase tracking-widest block">
                    Pengurangan Emisi Karbon
                  </span>
                  <span className="text-3xl sm:text-4xl font-extrabold mt-2 block tracking-tight text-primary-300 tabular-nums">
                    {stats.co2.toFixed(3)} Ton
                  </span>
                  <p className="text-xs text-neutral-400 mt-1">
                    Ekuivalen Penyerapan CO₂
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. FITUR UTAMA SECTION */}
          <section
            id="fitur"
            className="py-24 bg-white border-b border-neutral-200/60 scroll-mt-20"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Section Header */}
              <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
                <h2 className="text-xs font-bold text-primary-600 uppercase tracking-widest">
                  Kemudahan Pengelolaan Sampah
                </h2>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
                  Fitur Utama SICUAN Untuk Keberlanjutan
                </h3>
                <p className="text-neutral-500">
                  Platform modern yang dirancang untuk mempercepat administrasi
                  penyetoran limbah anorganik, pembagian reward, hingga
                  visualisasi audit dampak lingkungan.
                </p>
              </div>

              {/* Grid of features */}
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
                    Pilihan setoran yang fleksibel untuk berbagai profil. Setor
                    secara langsung di drop-point, kirim via ekspedisi rekanan
                    dengan ongkir bersubsidi, atau koordinasikan penjemputan
                    massal TPS.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-primary-600 pt-2">
                    <span>Setor Langsung & Ekspedisi</span>
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
                    Skema insentif bervariasi sesuai peranan Anda. Poin belanja
                    kupon untuk individu, saldo e-wallet/bank untuk mitra
                    Warmiendo, serta kas tunai transfer bernilai khusus untuk
                    Bank Sampah pengolah TPS.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-primary-600 pt-2">
                    <span>Poin Kupon & Saldo Rupiah</span>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-100/50 transition-all duration-300 group space-y-6">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-bold text-neutral-900">
                    Validasi & Verifikasi Ketat
                  </h4>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    Seluruh pengajuan setoran melalui proses penimbangan fisik
                    serta dokumentasi digital di gudang. Admin memverifikasi via
                    sistem secara transparan demi mencegah manipulasi data
                    setoran.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-primary-600 pt-2">
                    <span>Aman, Akurat & Terpercaya</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. SKEMA KEMITRAAN & ROLE OVERVIEW (Tab Selector) */}
          <section id="mitra" className="py-24 bg-primary-50/30 scroll-mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Section Header */}
              <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
                <h2 className="text-xs font-bold text-primary-600 uppercase tracking-widest">
                  Sesuaikan dengan Profil Anda
                </h2>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
                  Pilih Cara Anda Berpartisipasi
                </h3>
                <p className="text-neutral-500">
                  Setiap pihak memegang peran krusial dalam rantai ekonomi
                  sirkular ini. Cari tahu apa yang bisa Anda lakukan dan
                  dapatkan melalui program SICUAN.
                </p>
              </div>

              {/* Interactive Role Tabs Selector */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto mb-12">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isActive = activeRoleTab === role.id;
                  return (
                    <button
                      type="button"
                      key={role.id}
                      onClick={() => setActiveRoleTab(role.id)}
                      className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${isActive
                        ? "bg-primary-600 text-white shadow-md shadow-primary-600/10"
                        : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {role.name}
                    </button>
                  );
                })}
              </div>

              {/* Active Tab Details Display */}
              <div className="max-w-5xl mx-auto">
                {ROLES.map((role) => {
                  if (role.id !== activeRoleTab) return null;
                  const Icon = role.icon;
                  return (
                    <div
                      key={role.id}
                      className="bg-white rounded-3xl border border-neutral-200 shadow-xl p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-fade-in"
                    >
                      {/* Info block */}
                      <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-lg text-xs font-bold border border-primary-200/50">
                          Skema Keuntungan
                        </div>

                        <h4 className="text-3xl font-extrabold text-neutral-900 flex items-center gap-3">
                          <Icon className="w-8 h-8 text-primary-600" />
                          {role.name}
                        </h4>

                        <p className="text-neutral-600 leading-relaxed">
                          {role.desc}
                        </p>

                        {/* Reward description panel */}
                        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 space-y-2">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-primary-700 block">
                            Bentuk Reward Utama: {role.rewardType}
                          </span>
                          <p className="text-sm text-primary-950 font-medium">
                            {role.rewardDesc}
                          </p>
                        </div>

                        <a
                          href={role.actionHref || "#login"}
                          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all duration-200 shadow-md shadow-primary-600/10"
                        >
                          {role.actionText}
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>

                      {/* Checklist & Visual block */}
                      <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-2xl p-6 lg:p-8 space-y-6">
                        <h5 className="font-bold text-neutral-800 text-sm border-b border-neutral-200 pb-3 uppercase tracking-wider">
                          Kemudahan & Fasilitas Akun:
                        </h5>

                        <ul className="space-y-4">
                          {role.features.map((feat) => (
                            <li key={feat} className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                              <span className="text-neutral-700 text-sm leading-relaxed">
                                {feat}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {role.id === "konsumen" && (
                          <div className="pt-2 border-t border-neutral-200 mt-4 flex items-center gap-3 text-xs text-neutral-500">
                            <Gift className="w-5 h-5 text-amber-600" />
                            <span>
                              Penukaran kupon produk mi instan, minyak goreng, &
                              voucher lainnya.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 7. INTERACTIVE REWARD CALCULATOR SECTION (WOW feature) */}
          <section
            id="kalkulator"
            className="py-24 bg-white border-t border-b border-neutral-200/50 scroll-mt-20"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Intro text */}
                <div className="lg:col-span-5 space-y-6">
                  <span className="text-xs font-bold text-primary-600 uppercase tracking-widest block">
                    Simulasi Penghasilan Sampah
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
                    Kalkulator Estimasi Reward SICUAN
                  </h2>
                  <p className="text-neutral-600 leading-relaxed">
                    Ingin tahu seberapa besar nilai sampah anorganik yang Anda
                    kumpulkan? Gunakan simulator kalkulator instan kami. Pilih
                    profil Anda, jenis limbah kemasan, dan masukkan estimasi
                    berat.
                  </p>

                  <div className="bg-primary-50 rounded-2xl p-5 border border-primary-100 flex items-start gap-4">
                    <Info className="w-6 h-6 text-primary-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-primary-950">
                        Catatan Harga Aktif
                      </h5>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        Estimasi dihitung menggunakan harga periode berjalan
                        (Juni 2026). Nilai per kilogram dapat berfluktuasi
                        berdasarkan ketetapan harga master dari manajemen
                        perusahaan.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Calculator Widget */}
                <div className="lg:col-span-7 bg-primary-50/50 border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-lg">
                  <div className="space-y-6">
                    {/* 1. Select Role */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                        1. Pilih Profil Pengguna
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "konsumen", name: "Konsumen" },
                          { id: "warmiendo", name: "Warmiendo" },
                          { id: "bank-sampah", name: "Bank Sampah" },
                        ].map((role) => (
                          <button
                            type="button"
                            key={role.id}
                            onClick={() => setCalcRole(role.id)}
                            className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${calcRole === role.id
                              ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/10"
                              : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                              }`}
                          >
                            {role.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Select Trash Type */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                        2. Pilih Jenis Sampah Anorganik
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {TRASH_TYPES.map((trash) => (
                          <button
                            type="button"
                            key={trash.id}
                            onClick={() => setCalcTrash(trash.id)}
                            className={`p-4 rounded-xl text-left transition-all border cursor-pointer flex flex-col justify-between h-28 ${calcTrash === trash.id
                              ? "bg-white border-primary-500 ring-2 ring-primary-500/20 shadow-md"
                              : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                              }`}
                          >
                            <div className="flex justify-between items-start w-full">
                              <span className="font-bold text-xs text-neutral-900">
                                {trash.name}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full ${calcTrash === trash.id ? "bg-primary-600" : "bg-transparent"}`}
                              />
                            </div>
                            <p className="text-[10px] text-neutral-400 leading-snug">
                              {trash.desc}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Input Weight */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                          3. Tentukan Berat Setoran
                        </span>
                        <span className="text-xs font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-md">
                          Min. 1 Kg
                        </span>
                      </div>

                      {/* Slider & Input controller */}
                      <div className="flex items-center gap-4 bg-white border border-neutral-200 rounded-xl p-4">
                        <button
                          type="button"
                          onClick={() =>
                            setCalcWeight((w) => Math.max(1, w - 5))
                          }
                          className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                          disabled={calcWeight <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <div className="flex-1 text-center">
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={calcWeight}
                            onChange={(e) =>
                              setCalcWeight(
                                Math.max(1, parseInt(e.target.value, 10) || 0),
                              )
                            }
                            className="text-2xl font-extrabold text-neutral-900 bg-transparent text-center focus:outline-none w-24"
                          />
                          <span className="text-sm font-bold text-neutral-500 ml-1">
                            Kg
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setCalcWeight((w) => Math.min(1000, w + 5))
                          }
                          className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Range Slider for UX */}
                      <input
                        type="range"
                        min="1"
                        max="200"
                        value={calcWeight > 200 ? 200 : calcWeight}
                        onChange={(e) =>
                          setCalcWeight(parseInt(e.target.value, 10))
                        }
                        className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                      />
                    </div>

                    {/* 4. Results Panel */}
                    <div className="bg-primary-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 border border-primary-950">
                      <div className="space-y-1 text-center sm:text-left">
                        <span className="text-[10px] text-primary-300 font-bold uppercase tracking-wider block">
                          Estimasi Reward Anda
                        </span>
                        <span className="text-xs text-neutral-300 block">
                          Perhitungan untuk {calcWeight} Kg{" "}
                          {TRASH_TYPES.find((t) => t.id === calcTrash)?.name}
                        </span>
                      </div>

                      <div className="text-center sm:text-right">
                        {calcRole === "konsumen" ? (
                          <div className="space-y-1">
                            <span className="text-3xl font-extrabold block text-primary-400">
                              {calcResult.points.toLocaleString("id-ID")} Poin
                            </span>
                            <span className="text-xs text-neutral-300 flex items-center gap-1 justify-center sm:justify-end">
                              <Gift className="w-3.5 h-3.5 text-amber-400" />
                              {calcResult.points >= 500
                                ? "Ekuivalen Kupon Gold 🥇"
                                : calcResult.points >= 250
                                  ? "Ekuivalen Kupon Silver 🥈"
                                  : calcResult.points >= 100
                                    ? "Ekuivalen Kupon Bronze 🥉"
                                    : "Kumpulkan hingga 100 Poin untuk kupon pertama"}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-3xl font-extrabold block text-emerald-400">
                              Rp {calcResult.cash.toLocaleString("id-ID")}
                            </span>
                            <span className="text-[10px] text-primary-200 block">
                              {calcRole === "bank-sampah"
                                ? "*Termasuk Bonus 10% Penyaluran TPS"
                                : "*Saldo dapat langsung dicairkan"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 8. ALUR SETORAN TIMELINE SECTION */}
          <section id="alur" className="py-24 bg-primary-50/20 scroll-mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Section Header */}
              <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
                <h2 className="text-xs font-bold text-primary-600 uppercase tracking-widest">
                  Langkah Sederhana Bergabung
                </h2>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
                  Bagaimana Sistem SICUAN Bekerja?
                </h3>
                <p className="text-neutral-500">
                  Proses penyetoran dirancang dengan alur pelaporan yang mudah
                  dan transparan. Ikuti 4 langkah mudah berikut ini.
                </p>
              </div>

              {/* Timeline workflow */}
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
                      Pilah & Kumpulkan
                    </h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Pilah sampah anorganik berupa kemasan plastik mie instan,
                      gelas kertas makanan instan, atau karton luar di tempat
                      Anda.
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
                      Login ke aplikasi SICUAN, masukkan estimasi jenis dan
                      berat sampah, serta pilih metode pengiriman/setoran.
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
                      Sampah yang diterima di drop-point akan ditimbang dan
                      divalidasi oleh Admin gudang kami demi keamanan
                      pencatatan.
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
                      Poin kupon otomatis bertambah (Konsumen), atau saldo
                      Rupiah ditambahkan dan siap ditarik ke rekening (Mitra).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 9. LOGIN / PORTAL ACCESS CALL TO ACTION */}
          <section
            id="login"
            className="py-24 bg-white border-t border-b border-neutral-200/60 scroll-mt-20 relative"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-tr from-primary-900 to-emerald-950 rounded-[2rem] text-white p-8 sm:p-16 relative overflow-hidden shadow-2xl">
                {/* Decors */}
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
                      Masuk ke dashboard personal Anda untuk memantau tabungan
                      setoran sampah, menukarkan poin, mengajukan resi
                      ekspedisi, atau melakukan pencairan dana tunai.
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

                  {/* Graphic/Features inside CTAs */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10 space-y-4">
                    <h4 className="font-bold text-lg text-emerald-300">
                      Akses Cepat & Keamanan Terjaga
                    </h4>
                    <p className="text-xs text-primary-100 leading-relaxed">
                      Sistem SICUAN menggunakan autentikasi enkripsi tingkat
                      tinggi untuk mengamankan data profil, histori tabungan
                      saldo sampah, dan informasi rekening perbankan Anda.
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

          {/* 10. FAQ SECTION */}
          <section id="faq" className="py-24 bg-primary-50/10 scroll-mt-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Section Header */}
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-xs font-bold text-primary-600 uppercase tracking-widest">
                  Pertanyaan Umum
                </h2>
                <h3 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                  Pertanyaan yang Sering Diajukan
                </h3>
                <p className="text-neutral-500">
                  Temukan jawaban atas pertanyaan seputar mekanisme setoran,
                  reward poin kupon, pencairan saldo, dan integrasi kemitraan
                  SICUAN.
                </p>
              </div>

              {/* Accordion Questions */}
              <div className="space-y-4">
                {FAQS.map((faq, i) => {
                  const isOpen = faqOpen === i;
                  return (
                    <div
                      key={faq.q}
                      className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden transition-all duration-200"
                    >
                      <button
                        type="button"
                        onClick={() => setFaqOpen(isOpen ? null : i)}
                        className="w-full flex items-center justify-between p-6 text-left font-bold text-neutral-850 hover:bg-neutral-50/50 transition-colors"
                      >
                        <span>{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-primary-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-neutral-500" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-6 pt-1 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 animate-slide-down">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 11. FOOTER */}
          <footer className="bg-primary-950 text-white pt-16 pb-8 border-t border-primary-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-primary-900">
                {/* Left brand details */}
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
                    inisiatif pengelolaan daur ulang kemasan limbah anorganik
                    terpadu di wilayah Banjarmasin.
                  </p>

                  <div className="space-y-2 pt-2 text-xs text-primary-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      <span>Cabang Banjarmasin, Kalimantan Selatan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary-500" />
                      <span>
                        (0511) 3254924 (Jam Operasional 07:00 - 17:00 WITA)
                      </span>
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
                    <li>
                      <a
                        href="#fitur"
                        className="hover:text-white transition-colors"
                      >
                        Fitur Utama
                      </a>
                    </li>
                    <li>
                      <a
                        href="#mitra"
                        className="hover:text-white transition-colors"
                      >
                        Skema Kemitraan
                      </a>
                    </li>
                    <li>
                      <a
                        href="#kalkulator"
                        className="hover:text-white transition-colors"
                      >
                        Kalkulator Estimasi
                      </a>
                    </li>
                    <li>
                      <a
                        href="#alur"
                        className="hover:text-white transition-colors"
                      >
                        Alur Proses Setoran
                      </a>
                    </li>
                    <li>
                      <a
                        href="#faq"
                        className="hover:text-white transition-colors"
                      >
                        FAQ
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Corporate/Tech info */}
                <div className="md:col-span-4 space-y-4">
                  <h4 className="text-xs font-bold text-primary-400 uppercase tracking-wider">
                    Informasi & Regulasi
                  </h4>
                  <p className="text-xs text-primary-200 leading-relaxed">
                    Platform SICUAN dikembangkan untuk mendukung kebijakan
                    lingkungan ESG nasional, mengurangi sampah anorganik sekali
                    pakai dari kemasan plastik produk kami.
                  </p>

                  <div className="bg-primary-900 border border-primary-800 rounded-xl p-3.5 text-[10px] text-primary-200">
                    <span>
                      Terverifikasi Sistem Mutu & Standar Keamanan Data
                      Perusahaan.
                    </span>
                  </div>
                </div>
              </div>

              {/* Copyrights row */}
              <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-primary-300 gap-4">
                <span>
                  &copy; {new Date().getFullYear()} SICUAN Banjarmasin. All
                  rights reserved.
                </span>
                <div className="flex gap-6">
                  <a
                    href="#fitur"
                    className="hover:text-white transition-colors"
                  >
                    Kebijakan Privasi
                  </a>
                  <a
                    href="#fitur"
                    className="hover:text-white transition-colors"
                  >
                    Syarat & Ketentuan
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
