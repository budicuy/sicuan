"use client";

import {
  AlertTriangle,
  Calendar,
  Clock,
  FileSpreadsheet,
  Filter,
  Recycle,
  Scale,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── DATA GENERATION FOR CHARTS ──────────────────────────────────────────────

// 1. Setoran Harian (30 Days of June 2026)
const DAILY_DATA = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  let val = 0;
  if (day <= 5) val = [12, 16, 21, 20, 18][day - 1];
  else if (day === 6) val = 12;
  else if (day === 7) val = 8;
  else val = 0; // matching the pattern in screen 2 where it drops to 0 after day 5
  return { name: day.toString(), Volume: val };
});

// 2. Setoran Mingguan (5 Weeks of June)
const WEEKLY_DATA = [
  { name: "01 Jun - 07 Jun", Volume: 64 },
  { name: "08 Jun - 14 Jun", Volume: 10 },
  { name: "15 Jun - 21 Jun", Volume: 2 },
  { name: "22 Jun - 28 Jun", Volume: 0 },
  { name: "29 Jun - 30 Jun", Volume: 0 },
];

// 3. Setoran Bulanan (12 Months of 2026)
const MONTHLY_DATA = [
  { name: "Januari", Volume: 550 },
  { name: "Februari", Volume: 510 },
  { name: "Maret", Volume: 430 },
  { name: "April", Volume: 530 },
  { name: "Mei", Volume: 500 },
  { name: "Juni", Volume: 180 },
  { name: "Juli", Volume: 0 },
  { name: "Agustus", Volume: 0 },
  { name: "September", Volume: 0 },
  { name: "Oktober", Volume: 0 },
  { name: "November", Volume: 0 },
  { name: "Desember", Volume: 0 },
];

// 4. Total Setoran Kategori (Comparing Plastik, Paper Cup, Karton in 2026)
const COMPARATIVE_DATA = [
  { name: "Jan", Plastik: 280, "Paper Cup": 180, Karton: 90 },
  { name: "Feb", Plastik: 250, "Paper Cup": 170, Karton: 90 },
  { name: "Mar", Plastik: 210, "Paper Cup": 150, Karton: 70 },
  { name: "Apr", Plastik: 270, "Paper Cup": 170, Karton: 90 },
  { name: "Mei", Plastik: 260, "Paper Cup": 160, Karton: 80 },
  { name: "Jun", Plastik: 90, "Paper Cup": 60, Karton: 30 },
  { name: "Jul", Plastik: 0, "Paper Cup": 0, Karton: 0 },
  { name: "Agu", Plastik: 0, "Paper Cup": 0, Karton: 0 },
  { name: "Sep", Plastik: 0, "Paper Cup": 0, Karton: 0 },
  { name: "Okt", Plastik: 0, "Paper Cup": 0, Karton: 0 },
  { name: "Nov", Plastik: 0, "Paper Cup": 0, Karton: 0 },
  { name: "Des", Plastik: 0, "Paper Cup": 0, Karton: 0 },
];

// 5. Pie Chart: Trash categories weight composition
const COMPOSITION_DATA = [
  { name: "Plastik", value: 1360, color: "#2563eb" }, // Royal Blue
  { name: "Paper Cup", value: 920, color: "#10b981" }, // Emerald
  { name: "Karton", value: 680, color: "#f59e0b" }, // Gold
];

// 6. Top 10 Contributors (Nasabah Terbanyak)
const TOP_CONTRIBUTORS = [
  {
    rank: 1,
    name: "Warmiendo Ipul",
    total: 160,
    percentage: "23.9%",
    color: "bg-blue-600",
  },
  {
    rank: 2,
    name: "TPS Kelayan",
    total: 80,
    percentage: "11.9%",
    color: "bg-emerald-500",
  },
  {
    rank: 3,
    name: "Budi Santoso",
    total: 80,
    percentage: "11.9%",
    color: "bg-indigo-500",
  },
  {
    rank: 4,
    name: "Kedai Berkah",
    total: 60,
    percentage: "9.0%",
    color: "bg-cyan-500",
  },
  {
    rank: 5,
    name: "Warmiendo Rahma",
    total: 60,
    percentage: "9.0%",
    color: "bg-purple-500",
  },
  {
    rank: 6,
    name: "Ahmad Yani",
    total: 50,
    percentage: "7.5%",
    color: "bg-amber-500",
  },
  {
    rank: 7,
    name: "Toko Kelontong Amin",
    total: 50,
    percentage: "7.5%",
    color: "bg-rose-500",
  },
  {
    rank: 8,
    name: "Bank Sampah Melati",
    total: 50,
    percentage: "7.5%",
    color: "bg-blue-500",
  },
  {
    rank: 9,
    name: "Siti Aminah",
    total: 40,
    percentage: "6.0%",
    color: "bg-violet-500",
  },
  {
    rank: 10,
    name: "Warmiendo Udin",
    total: 40,
    percentage: "6.0%",
    color: "bg-fuchsia-500",
  },
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("Juni");
  const [selectedYear, setSelectedYear] = useState("2026");

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. WELCOME BOARD HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20 shrink-0">
            <Recycle className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex flex-wrap items-center gap-1.5">
              Selamat Datang{" "}
              <span className="text-primary-600">Super Administrator</span> di
              Dashboard SICUAN
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Sistem Informasi Cerdas Ubah Anorganik Jadi Nilai — Monitoring
              Real-time
            </p>
          </div>
        </div>
      </div>

      {/* 2. PREMIUM METRICS PANELS (5 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Karyawan Aktif */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">
              Total Karyawan Aktif
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight mt-4">731</h2>
          <div className="h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-blue-300 w-4/5" />
          </div>
        </div>

        {/* Card 2: Total Rekam Medis (Total Setoran Sampah) */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">
              Total Setoran (Kg)
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight mt-4">5.385</h2>
          <div className="h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-emerald-200 w-3/4" />
          </div>
        </div>

        {/* Card 3: Kunjungan Hari Ini (Setoran Hari Ini) */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-amber-100 uppercase tracking-wider">
              Setoran Hari Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight mt-4">12</h2>
          <div className="h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-amber-200 w-1/2" />
          </div>
        </div>

        {/* Card 4: On Progress */}
        <div className="bg-gradient-to-br from-red-600 to-rose-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-red-200 uppercase tracking-wider">
              Sedang Diproses
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight mt-4">2.351</h2>
          <div className="h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-red-300 w-2/3" />
          </div>
        </div>

        {/* Card 5: Warning Obat (Setoran Ditolak) */}
        <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-orange-200 uppercase tracking-wider">
              Setoran Ditolak
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight mt-4">26</h2>
          <div className="h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-orange-300 w-1/4" />
          </div>
        </div>
      </div>

      {/* 3. FILTER PERIODE DATA CARD */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-primary-950 font-bold text-sm">
          <Filter className="w-4 h-4 text-primary-600" />
          <span>Filter Periode Data</span>
          <span className="text-[10px] bg-neutral-100 text-neutral-500 font-medium px-2 py-0.5 rounded-full ml-auto">
            Pilih bulan &amp; tahun untuk melihat data
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5 space-y-1">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Bulan
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 cursor-pointer"
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
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5 space-y-1">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Tahun
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 cursor-pointer"
            >
              {["2024", "2025", "2026"].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-primary-600/10 hover:shadow-primary-600/20 border-0"
            >
              <Search className="w-4 h-4" />
              Tampilkan Data
            </button>
          </div>
        </div>
      </div>

      {/* 4. VISUAL CHART ANALYTICS CARD (Grid of 4 Recharts Charts) */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Card Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/10 text-white">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">
              Analisis Data Kunjungan &amp; Setoran
            </h3>
            <p className="text-[10px] text-blue-100 mt-0.5">
              Monitoring kuantitas setoran sampah secara real-time dan
              transparan
            </p>
          </div>
        </div>

        {/* 4-Chart Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50/50">
          {/* Chart 1: Kunjungan Harian */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between h-[300px]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-xs text-neutral-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Kunjungan Harian ({selectedMonth} {selectedYear})
              </h4>
              <span className="text-[9px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full font-medium">
                Harian
              </span>
            </div>
            <div className="flex-1 w-full h-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={DAILY_DATA}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="dailyGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
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
                      dataKey="name"
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
                      fill="url(#dailyGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-neutral-50 rounded-xl animate-pulse" />
              )}
            </div>
          </div>

          {/* Chart 2: Kunjungan Mingguan */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between h-[300px]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-xs text-neutral-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Kunjungan Mingguan (per minggu bulan {selectedMonth})
              </h4>
              <span className="text-[9px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full font-medium">
                Mingguan
              </span>
            </div>
            <div className="flex-1 w-full h-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={WEEKLY_DATA}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="weeklyGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#dc2626"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#dc2626"
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
                      fontSize={8}
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
                      stroke="#dc2626"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#weeklyGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-neutral-50 rounded-xl animate-pulse" />
              )}
            </div>
          </div>

          {/* Chart 3: Kunjungan Bulanan */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between h-[300px]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-xs text-neutral-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Kunjungan Bulanan ({selectedYear})
              </h4>
              <span className="text-[9px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full font-medium">
                Bulanan
              </span>
            </div>
            <div className="flex-1 w-full h-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={MONTHLY_DATA}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="monthlyGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2563eb"
                          stopOpacity={0.2}
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
                      fontSize={8}
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
                      fill="url(#monthlyGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-neutral-50 rounded-xl animate-pulse" />
              )}
            </div>
          </div>

          {/* Chart 4: Total Perbandingan Kategori */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between h-[300px]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-xs text-neutral-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Total Setoran per Kategori ({selectedYear})
              </h4>
              <span className="text-[9px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full font-medium">
                Bandingan
              </span>
            </div>
            <div className="flex-1 w-full h-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={COMPARATIVE_DATA}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={8}
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
                    <Legend
                      verticalAlign="top"
                      height={24}
                      iconSize={8}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "9px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Plastik"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Paper Cup"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Karton"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-neutral-50 rounded-xl animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. DIAGNOSA TERBANYAK (Top 10 Contributors & Donut Distribution) */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-600 px-6 py-4 text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/10 text-white">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">
              Jenis Sampah &amp; Penyetor Terbanyak
            </h3>
            <p className="text-[10px] text-purple-100 mt-0.5">
              Analisis kontributor setoran sampah anorganik terbesar periode
              berjalan
            </p>
          </div>
        </div>

        {/* Content Container (Donut Chart Left, Progress Bar Right) */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-neutral-50/50">
          {/* Donut Left (5 Columns on Large) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between min-h-[360px]">
            <h4 className="font-bold text-xs text-neutral-800 border-b border-neutral-100 pb-3 mb-4">
              Distribusi Kategori Sampah
            </h4>
            <div className="flex-1 w-full h-64 relative flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={COMPOSITION_DATA}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {COMPOSITION_DATA.map((entry) => (
                        <Cell key={`donut-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} Kg`, "Total Berat"]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      iconSize={8}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "10px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-neutral-50 rounded-xl animate-pulse" />
              )}
            </div>
          </div>

          {/* Progress Bars Right (7 Columns on Large) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-4">
              <h4 className="font-bold text-xs text-neutral-800">
                Top 10 Penyetor Terbanyak
              </h4>
              <span className="text-[9px] bg-purple-55 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200 bg-purple-50">
                67 Setoran Total
              </span>
            </div>

            <div className="space-y-4">
              {TOP_CONTRIBUTORS.map((contributor) => (
                <div key={contributor.rank} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-neutral-700">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold flex items-center justify-center border border-purple-100 shrink-0">
                        {contributor.rank}
                      </span>
                      <span>{contributor.name}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-neutral-600">
                      <span>{contributor.total} Kg</span>
                      <span className="text-neutral-400">
                        ({contributor.percentage})
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${contributor.color} rounded-full`}
                      style={{ width: contributor.percentage }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
