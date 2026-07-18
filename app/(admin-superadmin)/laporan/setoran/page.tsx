"use client";

import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  Filter,
  Loader2,
  Package,
  Percent,
  Recycle,
  RotateCcw,
  Scale,
  Star,
  Truck,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getUnifiedReport } from "@/app/(admin-superadmin)/laporan/setoran/action";
import { AnimatedCounter } from "@/app/components/shared/AnimatedCounter";
import { TourGuide } from "@/app/components/shared/TourGuide";
import type { UnifiedReportData } from "@/app/types";

// ── Tour Guide Steps ─────────────────────────────────────────────────

const tourSteps = [
  {
    element: "#tour-setoran-header",
    popover: {
      title: "Laporan Setoran Sampah",
      description:
        "Halaman analisis terpadu yang menggabungkan data setoran dari seluruh kategori nasabah (Warmindo, Bank Sampah, Konsumen).",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-setoran-filters",
    popover: {
      title: "Filter & Penyaringan Data",
      description:
        "Gunakan filter tahun, bulan, kategori nasabah, jenis sampah, status, dan metode setor untuk menyaring data analisis.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-setoran-metrics",
    popover: {
      title: "Ringkasan Metrik Utama",
      description:
        "Menampilkan metrik kunci: total setoran, total berat, kredit, poin, rata-rata berat, tingkat penerimaan, dan status statistik.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-setoran-chart",
    popover: {
      title: "Grafik Tren Bulanan",
      description:
        "Visualisasi tren setoran per bulan dengan pembagian berat berdasarkan kategori nasabah (Warmindo, Bank Sampah, Konsumen).",
      side: "top" as const,
    },
  },
  {
    element: "#tour-setoran-distributions",
    popover: {
      title: "Distribusi Data",
      description:
        "Menampilkan distribusi setoran berdasarkan kategori nasabah, jenis sampah, dan status setoran dalam bentuk progress bar.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-setoran-detail",
    popover: {
      title: "Tabel Rincian Data",
      description:
        "Tabel lengkap semua data setoran dengan informasi detail termasuk nomor setor, nasabah, berat, status, dan kredit/poin.",
      side: "top" as const,
    },
  },
];

// ── Constants ─────────────────────────────────────────────────────────

const BULAN_NAMES = [
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

const KATEGORI_OPTIONS = [
  { value: "Semua", label: "Semua" },
  { value: "warmindo", label: "Warmindo" },
  { value: "bank-sampah", label: "Bank Sampah" },
  { value: "konsumen", label: "Konsumen" },
];

const JENIS_OPTIONS = [
  { value: "Semua", label: "Semua" },
  { value: "Karton", label: "Karton" },
  { value: "Etiket", label: "Etiket" },
  { value: "Paper Cup", label: "Paper Cup" },
];

const STATUS_OPTIONS = [
  { value: "Semua", label: "Semua Status" },
  { value: "pending", label: "Pending" },
  { value: "diverifikasi", label: "Diverifikasi" },
  { value: "diserahkan", label: "Diserahkan" },
  { value: "diterima", label: "Diterima" },
  { value: "ditolak", label: "Ditolak" },
];

const METODE_OPTIONS = [
  { value: "Semua", label: "Semua Metode" },
  { value: "langsung", label: "Langsung" },
  { value: "ekspedisi", label: "Ekspedisi" },
];

// ── Color Helpers ─────────────────────────────────────────────────────

const _CATEGORY_COLORS: Record<string, string> = {
  warmindo: "#10b981",
  "bank-sampah": "#3b82f6",
  konsumen: "#8b5cf6",
};

const CATEGORY_BG: Record<string, string> = {
  warmindo: "bg-emerald-100 text-emerald-700",
  "bank-sampah": "bg-blue-100 text-blue-700",
  konsumen: "bg-violet-100 text-violet-700",
};

const CATEGORY_BAR: Record<string, string> = {
  warmindo: "bg-emerald-500",
  "bank-sampah": "bg-blue-500",
  konsumen: "bg-violet-500",
};

const WASTE_TYPE_BAR: Record<string, string> = {
  Karton: "bg-amber-500",
  Etiket: "bg-rose-500",
  "Paper Cup": "bg-cyan-500",
};

const STATUS_BAR: Record<string, string> = {
  diterima: "bg-emerald-500",
  diverifikasi: "bg-blue-500",
  diserahkan: "bg-sky-500",
  pending: "bg-amber-500",
  ditolak: "bg-red-500",
};

const STATUS_BADGE: Record<string, string> = {
  diterima: "bg-emerald-100 text-emerald-700",
  diverifikasi: "bg-blue-100 text-blue-700",
  diserahkan: "bg-sky-100 text-sky-700",
  pending: "bg-amber-100 text-amber-700",
  ditolak: "bg-red-100 text-red-700",
};

const CATEGORY_LABEL: Record<string, string> = {
  warmindo: "Warmindo",
  "bank-sampah": "Bank Sampah",
  konsumen: "Konsumen",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  diverifikasi: "Diverifikasi",
  diserahkan: "Diserahkan",
  diterima: "Diterima",
  ditolak: "Ditolak",
};

// ── Main Page ─────────────────────────────────────────────────────────

export default function LaporanSetoranPage() {
  const [data, setData] = useState<UnifiedReportData | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [kategori, setKategori] = useState("Semua");
  const [jenisSampah, setJenisSampah] = useState("Semua");
  const [status, setStatus] = useState("Semua");
  const [metodeSetor, setMetodeSetor] = useState("Semua");
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  // Pagination & Sort
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Tour
  const [_isTourActive, setIsTourActive] = useState(false);

  const loadData = useCallback(() => {
    startTransition(async () => {
      const result = await getUnifiedReport({
        selectedYear,
        selectedMonth,
        kategori,
        jenisSampah,
        status,
        metodeSetor,
        page,
        limit: pageSize,
        sortBy,
        sortOrder,
      });
      setData(result);
    });
  }, [
    selectedYear,
    selectedMonth,
    kategori,
    jenisSampah,
    status,
    metodeSetor,
    page,
    pageSize,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetFilters = () => {
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(null);
    setKategori("Semua");
    setJenisSampah("Semua");
    setStatus("Semua");
    setMetodeSetor("Semua");
    setPage(1);
    setSortBy("id");
    setSortOrder("desc");
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const summary = data?.summary;
  const totalPages = Math.ceil((data?.totalDetailData ?? 0) / pageSize);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <TourGuide
        steps={tourSteps}
        onStart={() => setIsTourActive(true)}
        onEnd={() => setIsTourActive(false)}
      />

      {/* ── Header & Filters ─────────────────────────────────────── */}
      <div
        id="tour-setoran-header"
        className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Laporan Setoran Sampah
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Analisis data setoran terpadu dari seluruh kategori nasabah
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────── */}
      <div
        id="tour-setoran-filters"
        className="bg-blue-50/10 border border-blue-100/70 p-5 rounded-2xl shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2 text-neutral-800">
            <Filter className="w-4 h-4 text-primary-500" />
            <span className="font-bold text-xs">Filter Pencarian</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:border-neutral-400 transition-colors bg-white shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filter
            </button>
            <button
              type="button"
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              {isAdvancedFilterOpen
                ? "Sembunyikan Filter Lanjutan"
                : "Tampilkan Filter Lanjutan"}
              {isAdvancedFilterOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Basic Filters (Always Visible) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Tahun */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filter-tahun"
              className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
            >
              Tahun
            </label>
            <input
              id="filter-tahun"
              type="number"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-neutral-200 rounded-xl text-xs font-bold px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-750 font-mono shadow-2xs w-full"
              min={2020}
              max={2100}
            />
          </div>

          {/* Bulan */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filter-bulan"
              className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
            >
              Bulan
            </label>
            <select
              id="filter-bulan"
              value={selectedMonth ?? ""}
              onChange={(e) => {
                setSelectedMonth(
                  e.target.value ? Number(e.target.value) : null,
                );
                setPage(1);
              }}
              className="bg-white border border-neutral-200 rounded-xl text-xs font-bold px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs w-full"
            >
              <option value="">Semua Bulan</option>
              {BULAN_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Metode */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filter-metode"
              className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
            >
              Metode Setor
            </label>
            <select
              id="filter-metode"
              value={metodeSetor}
              onChange={(e) => {
                setMetodeSetor(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-neutral-200 rounded-xl text-xs font-bold px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs w-full"
            >
              {METODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Filters (Toggleable) */}
        {isAdvancedFilterOpen && (
          <div className="pt-4 border-t border-neutral-100/80 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Kategori Nasabah */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-kategori"
                className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
              >
                Kategori Nasabah
              </label>
              <select
                id="filter-kategori"
                value={kategori}
                onChange={(e) => {
                  setKategori(e.target.value);
                  setPage(1);
                }}
                className="bg-white border border-neutral-200 rounded-xl text-xs font-bold px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs w-full"
              >
                {KATEGORI_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Jenis Sampah */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-jenis"
                className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
              >
                Jenis Sampah
              </label>
              <select
                id="filter-jenis"
                value={jenisSampah}
                onChange={(e) => {
                  setJenisSampah(e.target.value);
                  setPage(1);
                }}
                className="bg-white border border-neutral-200 rounded-xl text-xs font-bold px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs w-full"
              >
                {JENIS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-status"
                className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
              >
                Status Setoran
              </label>
              <select
                id="filter-status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="bg-white border border-neutral-200 rounded-xl text-xs font-bold px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs w-full"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Loading Overlay ──────────────────────────────────────── */}
      {isPending && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-7 h-7 text-primary-500 animate-spin" />
          <span className="ml-3 text-sm font-semibold text-neutral-500">
            Memuat data laporan...
          </span>
        </div>
      )}

      {!isPending && data && (
        <>
          {/* ── Metric Cards ───────────────────────────────────────── */}
          <div id="tour-setoran-metrics" className="space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Total Setoran"
                value={summary?.totalSetoran ?? 0}
                suffix=" kali"
                icon={<Recycle className="w-8 h-8 text-blue-200/80" />}
                gradient="from-blue-600 to-blue-800"
                labelColor="text-blue-200"
              />
              <MetricCard
                label="Total Berat"
                value={summary?.totalBerat ?? 0}
                suffix=" Kg"
                icon={<Scale className="w-8 h-8 text-emerald-100/80" />}
                gradient="from-emerald-500 to-emerald-700"
                labelColor="text-emerald-100"
              />
              <MetricCard
                label="Total Kredit"
                value={summary?.totalKredit ?? 0}
                prefix="Rp "
                icon={<Coins className="w-8 h-8 text-cyan-200/80" />}
                gradient="from-cyan-600 to-cyan-800"
                labelColor="text-cyan-200"
                textSize="text-2xl"
              />
              <MetricCard
                label="Total Poin"
                value={summary?.totalPoin ?? 0}
                suffix=" pt"
                icon={<Star className="w-8 h-8 text-amber-200/80" />}
                gradient="from-amber-500 to-amber-700"
                labelColor="text-amber-100"
              />
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Rata-rata Berat"
                value={summary?.rataRataBerat ?? 0}
                suffix=" Kg"
                icon={<Package className="w-8 h-8 text-violet-200/80" />}
                gradient="from-violet-600 to-indigo-850"
                labelColor="text-violet-200"
              />
              <MetricCard
                label="Tingkat Penerimaan"
                value={summary?.tingkatPenerimaan ?? 0}
                suffix="%"
                icon={<Percent className="w-8 h-8 text-teal-200/80" />}
                gradient="from-teal-600 to-teal-800"
                labelColor="text-teal-200"
              />
              <MetricCard
                label="Total Diterima"
                value={summary?.totalDiterima ?? 0}
                icon={<CheckCircle2 className="w-8 h-8 text-emerald-200/80" />}
                gradient="from-emerald-600 to-green-800"
                labelColor="text-emerald-200"
              />
              <MetricCard
                label="Total Ditolak"
                value={summary?.totalDitolak ?? 0}
                icon={<AlertTriangle className="w-8 h-8 text-red-200/80" />}
                gradient="from-red-600 to-rose-800"
                labelColor="text-red-200"
              />
            </div>
          </div>

          {/* ── 3 Trend Cards (Weekly, Monthly, Yearly) ───────────── */}
          <div
            id="tour-setoran-chart"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Card Mingguan */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between min-h-90">
              <div>
                <div className="flex justify-between items-start border-b border-neutral-100 pb-3 mb-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-neutral-800">
                      Tren Mingguan
                    </h3>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Bulan{" "}
                      {selectedMonth
                        ? BULAN_NAMES[selectedMonth - 1]
                        : BULAN_NAMES[new Date().getMonth()]}{" "}
                      - {selectedYear}
                    </p>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                    Total:{" "}
                    {data.weeklyTrend
                      .reduce((sum, item) => sum + item.Volume, 0)
                      .toLocaleString("id-ID")}{" "}
                    Kg
                  </span>
                </div>

                <div className="w-full h-52 mt-2">
                  {data.weeklyTrend.some((w) => w.Volume > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data.weeklyTrend}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
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
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={9}
                          tickLine={false}
                          tickFormatter={(v) => `${v} kg`}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "10px",
                            fontSize: "10px",
                            border: "1px solid #e2e8f0",
                          }}
                          // biome-ignore lint/suspicious/noExplicitAny: Recharts Tooltip formatter
                          formatter={(value: any) => [`${value} Kg`, "Volume"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="Volume"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={{
                            stroke: "#2563eb",
                            strokeWidth: 2,
                            r: 3.5,
                            fill: "#fff",
                          }}
                          fillOpacity={1}
                          fill="url(#colorWeekly)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="Tidak ada data untuk tren mingguan." />
                  )}
                </div>
              </div>
            </div>

            {/* Card Bulanan */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between min-h-90">
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
                    Total: {summary?.totalBerat.toLocaleString("id-ID") ?? 0} Kg
                  </span>
                </div>

                <div className="w-full h-52 mt-2">
                  {data.monthlyTrend.some((m) => m.totalBerat > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data.monthlyTrend.map((m) => ({
                          name: m.bulan,
                          Volume: m.totalBerat,
                        }))}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
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
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={9}
                          tickLine={false}
                          tickFormatter={(v) => `${v} kg`}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "10px",
                            fontSize: "10px",
                            border: "1px solid #e2e8f0",
                          }}
                          // biome-ignore lint/suspicious/noExplicitAny: Recharts Tooltip formatter
                          formatter={(value: any) => [`${value} Kg`, "Volume"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="Volume"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{
                            stroke: "#10b981",
                            strokeWidth: 2,
                            r: 3.5,
                            fill: "#fff",
                          }}
                          fillOpacity={1}
                          fill="url(#colorMonthly)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="Tidak ada data untuk tren bulanan." />
                  )}
                </div>
              </div>
            </div>

            {/* Card Tahunan */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between min-h-90">
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
                  <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                    Total:{" "}
                    {data.yearlyTrend
                      .reduce((sum, item) => sum + item.Volume, 0)
                      .toLocaleString("id-ID")}{" "}
                    Kg
                  </span>
                </div>

                <div className="w-full h-52 mt-2">
                  {data.yearlyTrend.some((y) => y.Volume > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data.yearlyTrend}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
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
                              stopColor="#8b5cf6"
                              stopOpacity={0.15}
                            />
                            <stop
                              offset="95%"
                              stopColor="#8b5cf6"
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
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={9}
                          tickLine={false}
                          tickFormatter={(v) => `${v} kg`}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "10px",
                            fontSize: "10px",
                            border: "1px solid #e2e8f0",
                          }}
                          // biome-ignore lint/suspicious/noExplicitAny: Recharts Tooltip formatter
                          formatter={(value: any) => [`${value} Kg`, "Volume"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="Volume"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={{
                            stroke: "#8b5cf6",
                            strokeWidth: 2,
                            r: 3.5,
                            fill: "#fff",
                          }}
                          fillOpacity={1}
                          fill="url(#colorYearly)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="Tidak ada data untuk tren tahunan." />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── 3 Distribution Panels ────────────────────────────── */}
          <div
            id="tour-setoran-distributions"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Category Distribution */}
            <DistributionPanel
              title="Distribusi per Kategori"
              items={data.categoryDistribution}
              colorMap={CATEGORY_BAR}
              labelMap={CATEGORY_LABEL}
            />

            {/* Waste Type Distribution */}
            <DistributionPanel
              title="Distribusi per Jenis Sampah"
              items={data.wasteTypeDistribution}
              colorMap={WASTE_TYPE_BAR}
            />

            {/* Status Distribution */}
            <DistributionPanel
              title="Distribusi per Status"
              items={data.statusDistribution}
              colorMap={STATUS_BAR}
              labelMap={STATUS_LABEL}
            />
          </div>

          {/* ── Detail Data Table ─────────────────────────────────── */}
          <div
            id="tour-setoran-detail"
            className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-800">
                Rincian Data Setoran
              </h3>
              <span className="text-xs text-neutral-400 font-medium">
                {data.totalDetailData.toLocaleString("id-ID")} data
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-100">
                    <SortableHeader
                      label="No. Setor"
                      column="nomorSetor"
                      current={sortBy}
                      order={sortOrder}
                      onSort={handleSort}
                    />
                    <th className="px-4 py-3 text-left font-bold text-neutral-500 uppercase tracking-wider">
                      Nasabah
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-neutral-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-neutral-500 uppercase tracking-wider">
                      Jenis
                    </th>
                    <SortableHeader
                      label="Berat"
                      column="beratKg"
                      current={sortBy}
                      order={sortOrder}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Tanggal"
                      column="tanggalSetor"
                      current={sortBy}
                      order={sortOrder}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Status"
                      column="status"
                      current={sortBy}
                      order={sortOrder}
                      onSort={handleSort}
                    />
                    <th className="px-4 py-3 text-left font-bold text-neutral-500 uppercase tracking-wider">
                      Metode
                    </th>
                    <th className="px-4 py-3 text-right font-bold text-neutral-500 uppercase tracking-wider">
                      Kredit/Poin
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.detailData.length > 0 ? (
                    data.detailData.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-neutral-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-neutral-700 whitespace-nowrap">
                          {row.nomorSetor}
                        </td>
                        <td className="px-4 py-3 font-semibold text-neutral-800 whitespace-nowrap">
                          {row.nasabah}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${CATEGORY_BG[row.kategoriNasabah] ?? "bg-neutral-100 text-neutral-600"}`}
                          >
                            {CATEGORY_LABEL[row.kategoriNasabah] ??
                              row.kategoriNasabah}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                          {row.jenisSampah}
                        </td>
                        <td className="px-4 py-3 font-bold text-neutral-800 whitespace-nowrap">
                          {row.beratKg.toLocaleString("id-ID")} kg
                        </td>
                        <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                          {row.tanggalSetor}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[row.status] ?? "bg-neutral-100 text-neutral-600"}`}
                          >
                            {STATUS_LABEL[row.status] ?? row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                          {row.metodeSetor ? (
                            <span className="inline-flex items-center gap-1">
                              {row.metodeSetor === "ekspedisi" ? (
                                <Truck className="w-3 h-3" />
                              ) : null}
                              {row.metodeSetor === "ekspedisi"
                                ? "Ekspedisi"
                                : "Langsung"}
                            </span>
                          ) : (
                            "–"
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-neutral-800 whitespace-nowrap">
                          {row.kredit > 0
                            ? `Rp ${row.kredit.toLocaleString("id-ID")}`
                            : row.totalPoin > 0
                              ? `${row.totalPoin.toLocaleString("id-ID")} pt`
                              : "–"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-neutral-400"
                      >
                        <Recycle className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                        <p className="text-sm font-semibold">
                          Tidak ada data setoran.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  Menampilkan {(page - 1) * pageSize + 1}–
                  {Math.min(page * pageSize, data.totalDetailData)} dari{" "}
                  {data.totalDetailData.toLocaleString("id-ID")} data
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
                  >
                    ‹ Prev
                  </button>
                  {generatePageNumbers(page, totalPages).map((p) =>
                    p.value === "..." ? (
                      <span
                        key={p.key}
                        className="px-2 text-neutral-400 text-xs"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPage(p.value as number)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          page === p.value
                            ? "bg-neutral-900 text-white border-neutral-900"
                            : "border-neutral-200 hover:bg-neutral-50"
                        }`}
                      >
                        {p.value}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
                  >
                    Next ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub Components ────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  prefix,
  suffix,
  icon,
  gradient,
  labelColor,
  textSize = "text-3xl",
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  gradient: string;
  labelColor: string;
  textSize?: string;
}) {
  return (
    <div
      className={`bg-linear-to-br ${gradient} rounded-2xl p-5 text-white shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
    >
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
      <span
        className={`text-[10px] font-bold ${labelColor} uppercase tracking-wider block`}
      >
        {label}
      </span>
      <div className="flex justify-between items-center mt-3">
        <h2 className={`${textSize} font-black tracking-tight`}>
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
        </h2>
        {icon}
      </div>
    </div>
  );
}

function DistributionPanel({
  title,
  items,
  colorMap,
  labelMap,
}: {
  title: string;
  items: {
    label: string;
    count: number;
    totalBerat: number;
    persentase: number;
  }[];
  colorMap: Record<string, string>;
  labelMap?: Record<string, string>;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
      <h3 className="font-bold text-sm text-neutral-800 border-b border-neutral-100 pb-3 mb-4">
        {title}
      </h3>
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-700">
                  {labelMap?.[item.label] ?? item.label}
                </span>
                <span className="font-bold text-neutral-500">
                  {item.persentase}% · {item.totalBerat.toLocaleString("id-ID")}{" "}
                  kg
                </span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${colorMap[item.label] ?? "bg-neutral-400"}`}
                  style={{ width: `${Math.max(item.persentase, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="Belum ada data distribusi." />
      )}
    </div>
  );
}

function SortableHeader({
  label,
  column,
  current,
  order,
  onSort,
}: {
  label: string;
  column: string;
  current: string;
  order: "asc" | "desc";
  onSort: (col: string) => void;
}) {
  const isActive = current === column;
  return (
    <th
      className="px-4 py-3 text-left font-bold text-neutral-500 uppercase tracking-wider cursor-pointer select-none hover:text-neutral-700 transition-colors whitespace-nowrap"
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && (
          <span className="text-primary-600">
            {order === "asc" ? "↑" : "↓"}
          </span>
        )}
      </span>
    </th>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-neutral-50/50 rounded-2xl p-8 text-center">
      <Recycle className="w-8 h-8 text-neutral-300 mb-2" />
      <p className="text-xs font-semibold text-neutral-500">{message}</p>
    </div>
  );
}

// ── Pagination Helper ─────────────────────────────────────────────────

function generatePageNumbers(
  current: number,
  total: number,
): { key: string; value: number | "..." }[] {
  if (total <= 7)
    return Array.from({ length: total }, (_, i) => ({
      key: String(i + 1),
      value: i + 1,
    }));

  const pages: { key: string; value: number | "..." }[] = [
    { key: "1", value: 1 },
  ];
  if (current > 3) pages.push({ key: "ellipsis-start", value: "..." });

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push({ key: String(i), value: i });

  if (current < total - 2) pages.push({ key: "ellipsis-end", value: "..." });
  pages.push({ key: String(total), value: total });

  return pages;
}
