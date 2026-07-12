"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  Recycle,
  Scale,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboardData } from "@/app/(admin-superadmin)/dashboard/admin-dashboard/action";
import { AnimatedCounter } from "@/app/components/shared/AnimatedCounter";
import { TourGuide } from "@/app/components/shared/TourGuide";

const adminDashboardSteps = [
  {
    element: "#tour-admin-dashboard-welcome",
    popover: {
      title: "Portal Administrator",
      description:
        "Selamat datang di Portal Administrator Sicuan. Dashboard ini memvisualisasikan data monitoring volume sampah daur ulang secara real-time.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-admin-dashboard-metrics",
    popover: {
      title: "Metrik Kunci Kemitraan",
      description:
        "Menampilkan total nasabah terdaftar, total volume setoran masuk harian & bulanan, rekap kupon ditukarkan, hingga dana berhasil dicairkan.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-admin-dashboard-distribution",
    popover: {
      title: "Distribusi Kategori Sampah",
      description:
        "Menampilkan persentase pembagian sampah global berdasarkan jenis karton, etiket, dan paper cup.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-admin-dashboard-contributors",
    popover: {
      title: "Peringkat Kontributor Teraktif",
      description:
        "Menampilkan 10 peringkat nasabah/mitra dengan total kontribusi setoran sampah terbesar.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-admin-dashboard-trend-weekly",
    popover: {
      title: "Tren Setoran Mingguan",
      description:
        "Menampilkan akumulasi setoran per minggu di bulan yang terpilih untuk memantau fluktuasi jangka pendek.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-admin-dashboard-trend-monthly",
    popover: {
      title: "Tren Setoran Bulanan",
      description:
        "Menampilkan perbandingan volume setoran dari bulan ke bulan dalam tahun yang terpilih.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-admin-dashboard-trend-yearly",
    popover: {
      title: "Tren Setoran Tahunan",
      description:
        "Menampilkan perkembangan volume setoran tahunan untuk memantau sirkularitas sampah jangka panjang (5 tahun terakhir).",
      side: "top" as const,
    },
  },
  {
    element: "#tour-admin-dashboard-unverified",
    popover: {
      title: "Setoran Menunggu Validasi",
      description:
        "Daftar setoran sampah masuk terbaru yang memerlukan verifikasi atau validasi dari Bank Sampah / Admin. Klik 'Validasi Data' untuk memproses.",
      side: "top" as const,
    },
  },
];

interface DashboardData {
  success: boolean;
  role: string;
  name: string;
  metrics?: {
    totalUsers?: number;
    totalSetoranKg?: number;
    totalSetoranTodayKg?: number;
    totalPendingSetoran?: number;
    totalDitolakSetoran?: number;
    totalNasabahCount?: number;
    totalSetoranDiterima?: number;
    totalSetoranPending?: number;
    totalPencairanBerhasil?: number;
    totalPencairanPending?: number;
    totalKuponDitukar?: number;
    totalSetoranMonthKg?: number;
    totalSetoranYearKg?: number;
    totalPencairanDana?: number;
  };
  profile?: {
    poin: number;
  };
  composition?: { name: string; value: number; color: string }[];
  topContributors?: {
    rank: number;
    name: string;
    total: number;
    percentage: string;
    color: string;
  }[];
  setoranHistory?: {
    date: string;
    Volume: number;
    Poin: number;
  }[];
  recentSetoran?: {
    id: number;
    nomorSetor: string;
    jenisSampah: string;
    beratKg: number;
    status: string;
    tanggalSetor: string;
  }[];
  recentPencairan?: {
    id: number;
    jumlah: number;
    status: string;
    createdAt: string | Date;
  }[];
  unverifiedSubmissions?: {
    id: number;
    nomorSetor: string;
    name: string;
    role: string;
    jenisSampah: string;
    beratKg: number;
    status: string;
    createdAt: string | Date;
  }[];
  weeklyTrends?: { name: string; Volume: number }[];
  monthlyTrends?: { name: string; Volume: number }[];
  yearlyTrends?: { name: string; Volume: number }[];
}

export default function DashboardPage() {
  const [_mounted, setMounted] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [_loading, setLoading] = useState(true);

  const [_isTourActive, setIsTourActive] = useState(false);

  const handleTourStart = () => {
    setIsTourActive(true);
  };

  const handleTourEnd = () => {
    setIsTourActive(false);
  };

  // Filters for Admin
  const [selectedMonth, setSelectedMonth] = useState<number>(
    () => new Date().getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(() =>
    new Date().getFullYear(),
  );

  const loadData = useCallback(() => {
    setLoading(true);
    getDashboardData(selectedMonth, selectedYear).then((res) => {
      if (res.success && res.role) {
        setData(res as DashboardData);
      }
      setLoading(false);
    });
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [loadData]);

  const role = data?.role ?? "admin";
  const name = data?.name ?? "-";
  const isMgmt = role === "admin" || role === "superadmin";

  // Render Admin / Superadmin View
  if (isMgmt) {
    const hasCompositionData =
      data?.composition?.some((c) => c.value > 0) ?? false;

    const monthNamesIndo = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const selectedMonthName = monthNamesIndo[selectedMonth - 1] ?? "";

    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-12">
        <TourGuide
          pageKey="admin_dashboard"
          steps={adminDashboardSteps}
          onStart={handleTourStart}
          onEnd={handleTourEnd}
        />

        {/* Welcome Board */}
        <div
          id="tour-admin-dashboard-welcome"
          className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
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
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex flex-wrap items-center gap-1.5">
                Selamat Datang <span className="text-primary-600">{name}</span>
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Portal{" "}
                {role === "superadmin"
                  ? "Super Administrator"
                  : "Administrator"}{" "}
                — Monitoring Real-time Sampah SICUAN
              </p>
            </div>
          </div>

          {/* Month & Year Selectors */}
          <div className="flex items-center gap-3 bg-neutral-50 p-2 rounded-2xl border border-neutral-200 shrink-0 w-full md:w-auto">
            <div className="flex flex-col gap-0.5 min-w-28">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block pl-1">
                Bulan Laporan
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white border border-neutral-200 rounded-xl text-xs font-bold px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs"
              >
                {[
                  "Januari",
                  "Februari",
                  "Maret",
                  "April",
                  "Mei",
                  "Juni",
                  "Juli",
                  "Agustus",
                  "September",
                  "Oktober",
                  "November",
                  "Desember",
                ].map((mName, idx) => (
                  <option key={mName} value={idx + 1}>
                    {mName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-0.5 min-w-20">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block pl-1">
                Tahun
              </span>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white border border-neutral-200 rounded-xl text-xs font-bold px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-750 shadow-2xs text-center w-full font-mono"
                min={2020}
                max={2100}
              />
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div id="tour-admin-dashboard-metrics" className="space-y-4">
          {/* Row 1 Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-linear-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">
                Total Nasabah / Mitra
              </span>
              <div className="flex justify-between items-center mt-3">
                <h2 className="text-3xl font-black tracking-tight">
                  <AnimatedCounter value={data?.metrics?.totalUsers ?? 0} />
                </h2>
                <Users className="w-8 h-8 text-blue-200/80" />
              </div>
            </div>

            <div className="bg-linear-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider block">
                Total Setoran Sampah
              </span>
              <div className="flex justify-between items-center mt-3">
                <h2 className="text-3xl font-black tracking-tight">
                  <AnimatedCounter
                    value={data?.metrics?.totalSetoranKg ?? 0}
                    suffix=" Kg"
                  />
                </h2>
                <Scale className="w-8 h-8 text-emerald-100/80" />
              </div>
            </div>

            <div className="bg-linear-to-br from-cyan-600 to-cyan-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider block">
                Setoran {selectedMonthName} {selectedYear}
              </span>
              <div className="flex justify-between items-center mt-3">
                <h2 className="text-3xl font-black tracking-tight">
                  <AnimatedCounter
                    value={data?.metrics?.totalSetoranMonthKg ?? 0}
                    suffix=" Kg"
                  />
                </h2>
                <TrendingUp className="w-8 h-8 text-cyan-200/80" />
              </div>
            </div>

            <div className="bg-linear-to-br from-teal-600 to-teal-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-bold text-teal-200 uppercase tracking-wider block">
                Setoran Tahun {selectedYear}
              </span>
              <div className="flex justify-between items-center mt-3">
                <h2 className="text-3xl font-black tracking-tight">
                  <AnimatedCounter
                    value={data?.metrics?.totalSetoranYearKg ?? 0}
                    suffix=" Kg"
                  />
                </h2>
                <TrendingUp className="w-8 h-8 text-teal-200/80" />
              </div>
            </div>
          </div>

          {/* Row 2 Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-linear-to-br from-violet-600 to-indigo-850 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">
                Menunggu Verifikasi
              </span>
              <div className="flex justify-between items-center mt-3">
                <h2 className="text-3xl font-black tracking-tight">
                  <AnimatedCounter
                    value={data?.metrics?.totalPendingSetoran ?? 0}
                  />
                </h2>
                <Clock className="w-8 h-8 text-indigo-200/80" />
              </div>
            </div>

            <div className="bg-linear-to-br from-red-600 to-rose-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-bold text-red-200 uppercase tracking-wider block">
                Setoran Ditolak
              </span>
              <div className="flex justify-between items-center mt-3">
                <h2 className="text-3xl font-black tracking-tight">
                  <AnimatedCounter
                    value={data?.metrics?.totalDitolakSetoran ?? 0}
                  />
                </h2>
                <AlertTriangle className="w-8 h-8 text-red-200/80" />
              </div>
            </div>

            <div className="bg-linear-to-br from-purple-600 to-fuchsia-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider block">
                Kupon Reward Ditukar
              </span>
              <div className="flex justify-between items-center mt-3">
                <h2 className="text-3xl font-black tracking-tight">
                  <AnimatedCounter
                    value={data?.metrics?.totalKuponDitukar ?? 0}
                  />
                </h2>
                <ShoppingBag className="w-8 h-8 text-purple-200/80" />
              </div>
            </div>

            <div className="bg-linear-to-br from-pink-600 to-rose-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-bold text-pink-200 uppercase tracking-wider block">
                Dana Dicairkan (Berhasil)
              </span>
              <div className="flex justify-between items-center mt-3">
                <h2 className="text-2xl font-black tracking-tight">
                  Rp{" "}
                  <AnimatedCounter
                    value={data?.metrics?.totalPencairanDana ?? 0}
                  />
                </h2>
                <Coins className="w-8 h-8 text-pink-200/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Global Distribution & Top Contributors */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Distribution (Left) */}
          <div
            id="tour-admin-dashboard-distribution"
            className="lg:col-span-5 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col min-h-87.5"
          >
            <h3 className="font-bold text-sm text-neutral-800 border-b border-neutral-100 pb-3 mb-4">
              Distribusi Kategori Sampah Global
            </h3>
            {hasCompositionData ? (
              <div className="flex-1 w-full relative flex flex-col items-center justify-center">
                <div className="w-full h-52">
                  <ResponsiveContainer width="100%" height={200} minWidth={0}>
                    <PieChart>
                      <Pie
                        data={data?.composition}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data?.composition?.map((entry) => (
                          <Cell
                            key={`donut-${entry.name}`}
                            fill={entry.color}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} Kg`, "Total Berat"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Indikator Angka */}
                <div className="mt-2 pt-3 border-t border-neutral-100 grid grid-cols-3 gap-2 text-center text-xs w-full">
                  {data?.composition?.map((entry) => (
                    <div key={entry.name} className="space-y-1">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-500 font-medium">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="truncate max-w-20">{entry.name}</span>
                      </div>
                      <p className="font-extrabold text-neutral-800">
                        <AnimatedCounter value={entry.value} suffix=" Kg" />
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50/50 rounded-2xl p-6 text-center">
                <Recycle className="w-8 h-8 text-neutral-300 mb-2" />
                <p className="text-xs font-semibold text-neutral-500">
                  Belum ada data setoran yang diterima.
                </p>
              </div>
            )}
          </div>

          {/* Top Contributors (Right) */}
          <div
            id="tour-admin-dashboard-contributors"
            className="lg:col-span-7 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-4">
              <h3 className="font-bold text-sm text-neutral-800">
                Top 10 Kontributor Teraktif
              </h3>
              <span className="text-[10px] bg-primary-50 text-primary-700 font-bold px-2 py-0.5 rounded-full border border-primary-200">
                Kontribusi Terbesar
              </span>
            </div>

            {data?.topContributors && data.topContributors.length > 0 ? (
              <div className="space-y-3.5">
                {data?.topContributors?.map((c) => (
                  <div key={c.rank} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-neutral-700">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary-50 text-primary-700 text-[10px] font-bold flex items-center justify-center border border-primary-100 shrink-0">
                          {c.rank}
                        </span>
                        <span>{c.name}</span>
                      </span>
                      <span className="text-neutral-600 font-mono">
                        <AnimatedCounter value={c.total} /> Kg ({c.percentage})
                      </span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${c.color} rounded-full`}
                        style={{ width: c.percentage }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50/50 rounded-2xl p-6 text-center">
                <Users className="w-8 h-8 text-neutral-300 mb-2" />
                <p className="text-xs font-semibold text-neutral-500">
                  Belum ada peringkat kontributor.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Three Temporal Statistic Cards: Mingguan, Bulanan, Tahunan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Mingguan */}
          <div
            id="tour-admin-dashboard-trend-weekly"
            className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between min-h-90"
          >
            <div>
              <div className="flex justify-between items-start border-b border-neutral-100 pb-3 mb-4">
                <div>
                  <h3 className="font-extrabold text-sm text-neutral-800">
                    Tren Mingguan
                  </h3>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    Bulan {selectedMonth} - {selectedYear}
                  </p>
                </div>
                <span className="text-[10px] bg-primary-50 text-primary-700 font-bold px-2 py-0.5 rounded-full border border-primary-200">
                  Total: {data?.metrics?.totalSetoranMonthKg ?? 0} Kg
                </span>
              </div>

              <div className="w-full h-48 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data?.weeklyTrends}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorWeekly"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2563eb"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2563eb"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={9}
                      tickLine={false}
                    />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        fontSize: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                      formatter={(value) => [`${value} Kg`, "Volume"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="Volume"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorWeekly)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Card Bulanan */}
          <div
            id="tour-admin-dashboard-trend-monthly"
            className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between min-h-90"
          >
            <div>
              <div className="flex justify-between items-start border-b border-neutral-100 pb-3 mb-4">
                <div>
                  <h3 className="font-extrabold text-sm text-neutral-800">
                    Tren Bulanan
                  </h3>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    Tahun {selectedYear}
                  </p>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Total: {data?.metrics?.totalSetoranYearKg ?? 0} Kg
                </span>
              </div>

              <div className="w-full h-48 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data?.monthlyTrends}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorMonthly"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={9}
                      tickLine={false}
                    />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        fontSize: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                      formatter={(value) => [`${value} Kg`, "Volume"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="Volume"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMonthly)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Card Tahunan */}
          <div
            id="tour-admin-dashboard-trend-yearly"
            className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between min-h-90"
          >
            <div>
              <div className="flex justify-between items-start border-b border-neutral-100 pb-3 mb-4">
                <div>
                  <h3 className="font-extrabold text-sm text-neutral-800">
                    Tren Tahunan
                  </h3>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    5 Tahun Terakhir
                  </p>
                </div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  Total: {data?.metrics?.totalSetoranKg ?? 0} Kg
                </span>
              </div>

              <div className="w-full h-48 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data?.yearlyTrends}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorYearly"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={9}
                      tickLine={false}
                    />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        fontSize: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                      formatter={(value) => [`${value} Kg`, "Volume"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="Volume"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorYearly)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Unverified Submissions Notification Section */}
        <div
          id="tour-admin-dashboard-unverified"
          className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
            <h3 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
              Pemberitahuan Setoran Baru (Menunggu Validasi)
            </h3>
            <span className="text-xs text-neutral-400 font-semibold">
              Menampilkan 5 setoran terbaru
            </span>
          </div>

          {data?.unverifiedSubmissions &&
          data.unverifiedSubmissions.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {data.unverifiedSubmissions.map((item) => {
                const isBS = item.role === "bank-sampah";
                const isWM = item.role === "warmindo";

                const badgeColor =
                  item.status === "pending"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : item.status === "diverifikasi"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200";

                const roleBadgeColor = isBS
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : isWM
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200";

                // Redirect link based on role
                const redirectPath = isBS
                  ? `/laporan/bank-sampah`
                  : `/laporan/warmindo`;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-3 hover:bg-neutral-50/50 px-2 rounded-xl transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-neutral-800">
                          {item.nomorSetor}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                        >
                          {item.status}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadgeColor}`}
                        >
                          {item.role === "bank-sampah"
                            ? "Bank Sampah"
                            : item.role === "warmindo"
                              ? "Mitra Warmindo"
                              : "Konsumen"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        Oleh:{" "}
                        <strong className="text-neutral-700">
                          {item.name}
                        </strong>{" "}
                        • Jenis:{" "}
                        <span className="font-semibold text-neutral-700">
                          {item.jenisSampah}
                        </span>{" "}
                        ({item.beratKg} Kg)
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-[10px] text-neutral-450 font-medium shrink-0">
                        {new Date(item.createdAt).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                      <a
                        href={redirectPath}
                        className="px-3.5 py-1.5 bg-neutral-100 hover:bg-primary-600 hover:text-white text-neutral-700 text-xs font-bold rounded-lg border border-neutral-200 transition-all cursor-pointer shadow-xs"
                      >
                        Validasi Data
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-neutral-400 font-medium">
              🎉 Semua setoran sampah telah terverifikasi dan divalidasi!
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render KONSUMEN (Customer) View
  if (role === "konsumen") {
    const hasCompositionData =
      data?.composition?.some((c) => c.value > 0) ?? false;
    const hasHistoryData =
      (data?.setoranHistory && data.setoranHistory.length > 0) ?? false;

    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-12">
        {/* Welcome Board */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20 shrink-0">
              <Star className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Halo, <span className="text-primary-600">{name}</span>!
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Kumpulkan poin dari setoran sampah anorganik Anda dan tukarkan
                dengan kupon menarik.
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-linear-to-br from-primary-600 to-emerald-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider block">
              Saldo Poin Utama
            </span>
            <div className="flex justify-between items-center mt-3">
              <h2 className="text-3xl font-black tracking-tight">
                <AnimatedCounter
                  value={data?.profile?.poin ?? 0}
                  suffix=" Poin"
                />
              </h2>
              <Star className="w-8 h-8 text-emerald-100/80 fill-emerald-100/20" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform">
            <div>
              <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider text-neutral-400 block">
                Total Berat Setor
              </span>
              <h2 className="text-2xl font-black text-neutral-800 tracking-tight mt-1.5">
                <AnimatedCounter
                  value={data?.metrics?.totalSetoranKg ?? 0}
                  suffix=" Kg"
                />
              </h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-200/50 flex items-center justify-center text-neutral-500 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform">
            <div>
              <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider text-neutral-400 block">
                Setoran Diterima
              </span>
              <h2 className="text-2xl font-black text-neutral-800 tracking-tight mt-1.5">
                <AnimatedCounter
                  value={data?.metrics?.totalSetoranDiterima ?? 0}
                  suffix=" Kali"
                />
              </h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform">
            <div>
              <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider text-neutral-400 block">
                Kupon Ditukar
              </span>
              <h2 className="text-2xl font-black text-neutral-800 tracking-tight mt-1.5">
                <AnimatedCounter
                  value={data?.metrics?.totalKuponDitukar ?? 0}
                  suffix=" Kupon"
                />
              </h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Star className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* History Chart (Left) */}
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between h-80">
            <h3 className="font-bold text-xs text-neutral-800 border-b border-neutral-100 pb-3 mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary-600" />
              Tren Setoran Sampah Terakhir (Kg)
            </h3>
            {hasHistoryData ? (
              <div className="flex-1 w-full h-full">
                <ResponsiveContainer width="100%" height={240} minWidth={0}>
                  <AreaChart
                    data={data?.setoranHistory}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={9}
                      tickLine={false}
                    />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        fontSize: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Volume"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#userGrad)"
                      name="Berat (Kg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50/50 rounded-2xl p-6 text-center">
                <ShoppingBag className="w-8 h-8 text-neutral-300 mb-2" />
                <p className="text-xs font-semibold text-neutral-500">
                  Belum ada riwayat setoran. Silahkan bawa sampah anorganik Anda
                  untuk disetor.
                </p>
              </div>
            )}
          </div>

          {/* Composition (Right) */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col min-h-80">
            <h3 className="font-bold text-xs text-neutral-800 border-b border-neutral-100 pb-3 mb-4">
              Komposisi Sampah Anda
            </h3>
            {hasCompositionData ? (
              <div className="flex-1 w-full relative flex flex-col items-center justify-center">
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height={170} minWidth={0}>
                    <PieChart>
                      <Pie
                        data={data?.composition}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data?.composition?.map((entry) => (
                          <Cell
                            key={`donut-${entry.name}`}
                            fill={entry.color}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} Kg`, "Berat"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Indikator Angka */}
                <div className="mt-2 pt-3 border-t border-neutral-100 grid grid-cols-3 gap-2 text-center text-xs w-full">
                  {data?.composition?.map((entry) => (
                    <div key={entry.name} className="space-y-1">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-500 font-medium">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="truncate max-w-20">{entry.name}</span>
                      </div>
                      <p className="font-extrabold text-neutral-800">
                        <AnimatedCounter value={entry.value} suffix=" Kg" />
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50/50 rounded-2xl p-6 text-center">
                <Recycle className="w-8 h-8 text-neutral-300 mb-2" />
                <p className="text-xs font-semibold text-neutral-500">
                  Kategori kosong.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-neutral-800 flex items-center gap-1.5 pb-2 border-b border-neutral-100">
            <Clock className="w-4.5 h-4.5 text-primary-600" />
            Setoran Sampah Terakhir
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
                  <th className="px-4 py-3 font-semibold">Nomor Setor</th>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Jenis Sampah</th>
                  <th className="px-4 py-3 font-semibold">Berat</th>
                  <th className="px-4 py-3 font-semibold text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data?.recentSetoran && data.recentSetoran.length > 0 ? (
                  data.recentSetoran.map((s) => (
                    <tr key={s.id} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-3 font-semibold text-neutral-800">
                        {s.nomorSetor}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(s.tanggalSetor).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-700">
                        {s.jenisSampah}
                      </td>
                      <td className="px-4 py-3 font-bold text-neutral-850">
                        {s.beratKg} Kg
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                            s.status === "diterima"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : s.status === "ditolak"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-neutral-400"
                    >
                      Belum ada setoran terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Render WARMINDO / BANK SAMPAH View
  const isWarmindo = role === "warmindo";
  const hasCompositionData =
    data?.composition?.some((c) => c.value > 0) ?? false;
  const hasHistoryData =
    (data?.setoranHistory && data.setoranHistory.length > 0) ?? false;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Welcome Board */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20 shrink-0">
            <Coins className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Halo Mitra, <span className="text-primary-600">{name}</span>!
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Dashboard Kemitraan {isWarmindo ? "Warmindo" : "Bank Sampah"}{" "}
              SICUAN — Cairkan reward tunai dari kontribusi Anda.
            </p>
          </div>
        </div>
      </div>
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance Card */}
        <div className="bg-linear-to-tr from-primary-950 via-primary-900 to-emerald-850 text-white rounded-2xl p-5 shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 sm:col-span-2">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-[10px] font-bold text-primary-300 uppercase tracking-widest block">
            KREDIT CAIR SEBAGAI UANG
          </span>
          <div className="flex justify-between items-end mt-4">
            <div>
              <span className="text-[9px] text-primary-200">
                Saldo Kredit Tersedia
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5">
                <AnimatedCounter value={0} prefix="Rp " />
              </h2>
            </div>
            <Coins className="w-8 h-8 text-emerald-400 shrink-0 mb-1" />
          </div>
        </div>

        {/* Total Setoran */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Total Setoran
            </span>
            <h2 className="text-xl font-black text-neutral-800 tracking-tight mt-1.5">
              <AnimatedCounter
                value={data?.metrics?.totalSetoranKg ?? 0}
                suffix=" Kg"
              />
            </h2>
          </div>
          <div className="w-9 h-9 rounded-xl bg-neutral-50 border border-neutral-200/50 flex items-center justify-center text-neutral-500 shrink-0">
            <Scale className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Total Pencairan */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Cair Berhasil
            </span>
            <h2 className="text-xl font-black tracking-tight mt-1.5 text-emerald-600">
              <AnimatedCounter
                value={data?.metrics?.totalPencairanBerhasil ?? 0}
                prefix="Rp "
              />
            </h2>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Chart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Waste setoran trend */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between h-80">
          <h3 className="font-bold text-xs text-neutral-800 border-b border-neutral-100 pb-3 mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary-600" />
            Riwayat Volume Setoran Kemitraan (Kg)
          </h3>
          {hasHistoryData ? (
            <div className="flex-1 w-full h-full">
              <ResponsiveContainer width="100%" height={240} minWidth={0}>
                <AreaChart
                  data={data?.setoranHistory}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="mitraGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={9}
                    tickLine={false}
                  />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      fontSize: "10px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Volume"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#mitraGrad)"
                    name="Berat (Kg)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50/50 rounded-2xl p-6 text-center">
              <ShoppingBag className="w-8 h-8 text-neutral-300 mb-2" />
              <p className="text-xs font-semibold text-neutral-500">
                Belum ada riwayat setoran kemitraan.
              </p>
            </div>
          )}
        </div>

        {/* Waste Composition */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col min-h-80">
          <h3 className="font-bold text-xs text-neutral-800 border-b border-neutral-100 pb-3 mb-4">
            Komposisi Bahan Disetor
          </h3>
          {hasCompositionData ? (
            <div className="flex-1 w-full relative flex flex-col items-center justify-center">
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height={170} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={data?.composition}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data?.composition?.map((entry) => (
                        <Cell key={`donut-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Kg`, "Berat"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Indikator Angka */}
              <div className="mt-2 pt-3 border-t border-neutral-100 grid grid-cols-3 gap-2 text-center text-xs w-full">
                {data?.composition?.map((entry) => (
                  <div key={entry.name} className="space-y-1">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-500 font-medium">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="truncate max-w-20">{entry.name}</span>
                    </div>
                    <p className="font-extrabold text-neutral-800">
                      <AnimatedCounter value={entry.value} suffix=" Kg" />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50/50 rounded-2xl p-6 text-center">
              <Recycle className="w-8 h-8 text-neutral-300 mb-2" />
              <p className="text-xs font-semibold text-neutral-500">
                Kategori kosong.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Two columns: recent deposits and recent withdrawals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent setoran */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-neutral-850 flex items-center gap-1.5 pb-2 border-b border-neutral-100">
            <ShoppingBag className="w-4 h-4 text-primary-650" />
            Setoran Sampah Terakhir
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-neutral-400 border-b border-neutral-100">
                  <th className="pb-2 font-semibold">Nomor</th>
                  <th className="pb-2 font-semibold">Jenis</th>
                  <th className="pb-2 font-semibold">Berat</th>
                  <th className="pb-2 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {data?.recentSetoran && data.recentSetoran.length > 0 ? (
                  data.recentSetoran.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2.5 font-semibold text-neutral-850">
                        {s.nomorSetor}
                      </td>
                      <td className="py-2.5 text-neutral-600">
                        {s.jenisSampah}
                      </td>
                      <td className="py-2.5 font-bold text-neutral-800">
                        {s.beratKg} Kg
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider ${
                            s.status === "diterima"
                              ? "bg-emerald-50 text-emerald-700"
                              : s.status === "ditolak"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-4 text-center text-neutral-400"
                    >
                      Belum ada setoran.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent withdrawals */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-neutral-850 flex items-center gap-1.5 pb-2 border-b border-neutral-100">
            <Coins className="w-4 h-4 text-emerald-650" />
            Pencairan Dana Terakhir
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-neutral-400 border-b border-neutral-100">
                  <th className="pb-2 font-semibold">Tanggal</th>
                  <th className="pb-2 font-semibold">Nominal</th>
                  <th className="pb-2 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {data?.recentPencairan && data.recentPencairan.length > 0 ? (
                  data.recentPencairan.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 text-neutral-550">
                        {new Date(p.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2.5 font-bold text-neutral-800">
                        Rp {p.jumlah.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider ${
                            p.status === "berhasil"
                              ? "bg-emerald-50 text-emerald-700"
                              : p.status === "ditolak"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-4 text-center text-neutral-400"
                    >
                      Belum ada pencairan dana.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
