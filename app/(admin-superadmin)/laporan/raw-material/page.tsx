"use client";

import {
  Award,
  BarChart2,
  Layers,
  Loader2,
  Recycle,
  Scale,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getRawMaterialReport } from "@/app/(admin-superadmin)/laporan/raw-material/action";

interface ChartDataPoint {
  weekLabel?: string;
  monthLabel?: string;
  yearLabel?: string;
  totalRaw: number;
  totalDeposited: number;
  [key: string]: string | number | undefined;
}

interface RankingPoint {
  userId: number;
  name: string;
  totalWeight: number;
}

interface ReportSegment {
  overall: {
    totalRawWeight: number;
    totalDepositedWeight: number;
    overallPercentage: number;
  };
  byCategory: {
    category: string;
    rawWeight: number;
    depositedWeight: number;
    percentage: number;
    classifications: { name: string; weight: number }[];
  }[];
  byRole: {
    role: string;
    totalWeight: number;
    sharePercentage: number;
    rawContributionPercentage: number;
    categories: { category: string; weight: number }[];
  }[];
  topCategories: {
    category: string;
    depositedWeight: number;
    rawWeight: number;
    percentage: number;
  }[];
  rankings: {
    Konsumen: RankingPoint[];
    Warmiendo: RankingPoint[];
    "Bank Sampah": RankingPoint[];
  };
}

interface ReportData {
  success: boolean;
  weekly: ReportSegment;
  monthly: ReportSegment;
  yearly: ReportSegment;
  weeklyData: ChartDataPoint[];
  monthlyData: ChartDataPoint[];
  yearlyData: ChartDataPoint[];
}

export default function LaporanRawMaterialPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly" | "yearly">(
    "weekly",
  );
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(6); // June
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [_isPending, startTransition] = useTransition();

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

  useEffect(() => {
    let active = true;
    setLoading(true);
    startTransition(async () => {
      try {
        const res = await getRawMaterialReport(
          selectedYear,
          selectedMonth,
          selectedWeek,
        );
        if (active) {
          setData(res);
        }
      } catch (err) {
        console.error("Gagal memuat laporan raw material:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });
    return () => {
      active = false;
    };
  }, [selectedYear, selectedMonth, selectedWeek]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-sm font-semibold text-neutral-500">
          Membuat laporan...
        </p>
      </div>
    );
  }

  // Resolve active report segment based on the global filter tab
  const activeSegment =
    activeTab === "weekly"
      ? data.weekly
      : activeTab === "monthly"
        ? data.monthly
        : data.yearly;

  // Get active chart data
  const chartData =
    activeTab === "weekly"
      ? data.weeklyData
      : activeTab === "monthly"
        ? data.monthlyData
        : data.yearlyData;

  const activeRankings = activeSegment.rankings;

  const getPeriodLabel = () => {
    const monthName = monthNamesIndo[selectedMonth - 1] || "Juni";
    if (activeTab === "weekly")
      return `Minggu ${selectedWeek} (${monthName} ${selectedYear})`;
    if (activeTab === "monthly") return `${monthName} ${selectedYear}`;
    return `Tahun ${selectedYear}`;
  };

  const xAxisKey =
    activeTab === "weekly"
      ? "weekLabel"
      : activeTab === "monthly"
        ? "monthLabel"
        : "yearLabel";

  const getPercentageColor = (pct: number) => {
    if (pct >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (pct >= 50) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

  const getProgressBarColor = (pct: number) => {
    if (pct >= 80) return "bg-emerald-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Board */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20 shrink-0">
            <Recycle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Laporan Kontribusi Setoran Sampah
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Perbandingan data raw material yang dikeluarkan Indofood dengan
              hasil sampah yang disetorkan (Konsumen + Warmiendo + Bank Sampah).
            </p>
          </div>
        </div>

        {/* Global Filters & Dropdowns */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 w-full md:w-auto">
          {/* Global Filter Switcher */}
          <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200 shrink-0 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab("weekly")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all border-0 cursor-pointer ${
                activeTab === "weekly"
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/50"
              }`}
            >
              Mingguan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("monthly")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all border-0 cursor-pointer ${
                activeTab === "monthly"
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/50"
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("yearly")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all border-0 cursor-pointer ${
                activeTab === "yearly"
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/50"
              }`}
            >
              Tahunan
            </button>
          </div>

          {/* Selectors */}
          <div className="flex items-center gap-2">
            {/* Dropdown Minggu (Only show when activeTab is "weekly") */}
            {activeTab === "weekly" && (
              <label className="flex flex-col gap-0.5 min-w-17.5 text-[8px] font-bold text-neutral-400 uppercase tracking-wider">
                Minggu
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] font-bold px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer text-neutral-800 normal-case"
                >
                  {[1, 2, 3, 4, 5].map((wk) => (
                    <option key={wk} value={wk}>
                      Minggu {wk}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* Dropdown Bulan (Show when activeTab is "weekly" or "monthly") */}
            {(activeTab === "weekly" || activeTab === "monthly") && (
              <label className="flex flex-col gap-0.5 min-w-23.75 text-[8px] font-bold text-neutral-400 uppercase tracking-wider">
                Bulan
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] font-bold px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer text-neutral-800 normal-case"
                >
                  {monthNamesIndo.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* Input Tahun (Always show) */}
            <label className="flex flex-col gap-0.5 min-w-18.75 text-[8px] font-bold text-neutral-400 uppercase tracking-wider">
              Tahun
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] font-bold px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 text-neutral-800 w-20"
                min={2000}
                max={2100}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm hover:scale-[1.01] transition-transform flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Total Raw Material Indofood
            </span>
            <h2 className="text-2xl font-black text-neutral-800 tracking-tight">
              {activeSegment.overall.totalRawWeight.toFixed(2)} Kg
            </h2>
            <span className="text-[10px] text-neutral-500 block">
              {getPeriodLabel()} (Master Data)
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm hover:scale-[1.01] transition-transform flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Total Sampah Disetorkan
            </span>
            <h2 className="text-2xl font-black text-neutral-800 tracking-tight">
              {activeSegment.overall.totalDepositedWeight.toFixed(2)} Kg
            </h2>
            <span className="text-[10px] text-neutral-500 block">
              Seluruh Aktor ({getPeriodLabel()})
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm hover:scale-[1.01] transition-transform flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Kontribusi Daur Ulang
            </span>
            <h2 className="text-2xl font-black text-neutral-800 tracking-tight flex items-baseline gap-1">
              {activeSegment.overall.overallPercentage.toFixed(1)}%
              <span className="text-xs font-semibold text-neutral-500">
                tercapai
              </span>
            </h2>
            <span className="text-[10px] text-neutral-500 block">
              Efektivitas penyerapan sirkular
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Charts & Rankings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Charts Container */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between min-h-105">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-100 pb-4 mb-6">
            <h3 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary-600" />
              Perbandingan Volume Raw Material vs Setoran Sampah (Kg)
            </h3>
            {/* Active Period Indicator */}
            <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 select-none">
              <span className="px-3 py-1 rounded-md text-[10px] font-black text-primary-700 bg-white shadow-xs">
                {activeTab === "weekly"
                  ? "Mingguan"
                  : activeTab === "monthly"
                    ? "Bulanan"
                    : "Tahunan"}
              </span>
            </div>
          </div>

          <div className="flex-1 w-full h-70">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey={xAxisKey}
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    fontSize: "11px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                  }}
                  formatter={(value) => [`${Number(value).toFixed(2)} Kg`]}
                />
                <Legend
                  iconSize={10}
                  fontSize={10}
                  wrapperStyle={{ fontSize: "10px", marginTop: "10px" }}
                />
                <Bar
                  dataKey="totalRaw"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  name="Raw Material Indofood"
                />
                <Bar
                  dataKey="totalDeposited"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Sampah Didaur Ulang"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Recycle Categories Ranking */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-neutral-800 border-b border-neutral-100 pb-3 mb-4 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-primary-600" />
              Kontribusi Sampah Terbanyak
            </h3>
            <div className="space-y-4">
              {activeSegment.topCategories.map((item, idx) => (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="flex items-center gap-2 text-neutral-700">
                      <span className="w-5 h-5 rounded-full bg-primary-50 text-primary-700 text-[10px] font-bold flex items-center justify-center border border-primary-100 shrink-0">
                        {idx + 1}
                      </span>
                      {item.category}
                    </span>
                    <span className="text-neutral-500 font-mono text-[11px]">
                      {item.depositedWeight.toFixed(1)} /{" "}
                      {item.rawWeight.toFixed(1)} Kg
                    </span>
                  </div>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span
                          className={`text-[9px] font-bold inline-block py-0.5 px-2 uppercase rounded-full border ${getPercentageColor(item.percentage)}`}
                        >
                          {item.percentage.toFixed(1)}% Kontribusi
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-neutral-100">
                      <div
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getProgressBarColor(item.percentage)} transition-all duration-500`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary-50/50 border border-primary-100 rounded-xl p-3 text-[11px] text-neutral-600 leading-relaxed mt-4">
            💡 <strong>Rasio Kontribusi</strong> di atas dihitung dengan membagi
            total berat sampah yang disetorkan para nasabah dengan total berat
            raw material yang dirilis Indofood. Rasio yang lebih tinggi
            menunjukkan tingkat sirkularitas yang lebih baik.
          </div>
        </div>
      </div>

      {/* Category & Classification Breakdown Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <h3 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
            <Layers className="w-4.5 h-4.5 text-primary-600" />
            Detail Perbandingan per Kategori & Klasifikasi
          </h3>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-neutral-150">
          {activeSegment.byCategory.map((cat, idx) => (
            <div
              key={cat.category}
              className={`space-y-4 ${idx === 0 ? "md:pr-6" : idx === 1 ? "md:px-6" : "md:pl-6"} ${idx > 0 ? "pt-4 md:pt-0" : ""}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-neutral-900 text-sm">
                    {cat.category}
                  </h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Ringkasan Klasifikasi Produk
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPercentageColor(cat.percentage)}`}
                >
                  {cat.percentage.toFixed(1)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressBarColor(cat.percentage)} rounded-full`}
                  style={{ width: `${Math.min(100, cat.percentage)}%` }}
                />
              </div>

              {/* Aggregated weight info */}
              <div className="grid grid-cols-2 gap-3 bg-neutral-50 rounded-xl p-3 text-xs border border-neutral-150/50">
                <div>
                  <p className="text-[9px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Total Raw
                  </p>
                  <p className="font-bold text-neutral-800 mt-0.5">
                    {cat.rawWeight.toFixed(1)} Kg
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Total Setor
                  </p>
                  <p className="font-bold text-emerald-600 mt-0.5">
                    {cat.depositedWeight.toFixed(1)} Kg
                  </p>
                </div>
              </div>

              {/* Classifications details */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Detail Raw Material Indofood:
                </p>
                <div className="divide-y divide-neutral-100 text-xs">
                  {cat.classifications.map((cls) => (
                    <div
                      key={cls.name}
                      className="flex justify-between py-2 text-neutral-700"
                    >
                      <span>{cls.name}</span>
                      <span className="font-semibold text-neutral-900">
                        {cls.weight.toFixed(1)} Kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Contribution Breakdown */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
          <h3 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-primary-600" />
            Laporan Kontribusi Setoran per Peran (Aktor)
          </h3>
          <span className="text-[10px] bg-primary-50 text-primary-700 font-bold px-2 py-0.5 rounded-full border border-primary-200">
            Perbandingan Aktor ({getPeriodLabel()})
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-neutral-150">
          {activeSegment.byRole.map((roleData, idx) => (
            <div
              key={roleData.role}
              className={`space-y-4 ${idx === 0 ? "md:pr-6" : idx === 1 ? "md:px-6" : "md:pl-6"} ${idx > 0 ? "pt-4 md:pt-0" : ""}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-neutral-900 text-sm">
                    {roleData.role}
                  </h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Kontribusi terhadap Total Daur Ulang
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                  {roleData.sharePercentage.toFixed(1)}% Share
                </span>
              </div>

              {/* Aggregated weight info */}
              <div className="grid grid-cols-2 gap-3 bg-neutral-50 rounded-xl p-3 text-xs border border-neutral-150/50">
                <div>
                  <p className="text-[9px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Total Disetor
                  </p>
                  <p className="font-bold text-neutral-800 mt-0.5">
                    {roleData.totalWeight.toFixed(1)} Kg
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Vs Raw Indofood
                  </p>
                  <p className="font-bold text-primary-600 mt-0.5">
                    {roleData.rawContributionPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Progress bar of raw contribution */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold text-neutral-500">
                  <span>Kontribusi Sirkular</span>
                  <span>{roleData.rawContributionPercentage.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, roleData.rawContributionPercentage)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Category Breakdown details */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Detail Jenis Sampah:
                </p>
                <div className="divide-y divide-neutral-100 text-xs">
                  {roleData.categories.map((cat) => (
                    <div
                      key={cat.category}
                      className="flex justify-between py-2 text-neutral-700"
                    >
                      <span>{cat.category}</span>
                      <span className="font-semibold text-neutral-900">
                        {cat.weight.toFixed(1)} Kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 3 Nasabah/Mitra Rankings per Role */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-primary-600 animate-pulse" />
              Peringkat Nasabah / Mitra Teraktif (Top 3)
            </h3>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              Urutan kontributor dengan akumulasi volume setoran sampah
              terbesar.
            </p>
          </div>
          <span className="text-[10px] bg-primary-50 text-primary-700 font-bold px-2 py-0.5 rounded-full border border-primary-200 uppercase">
            Periode:{" "}
            {activeTab === "weekly"
              ? "Minggu 1 (Juni 2026)"
              : activeTab === "monthly"
                ? "Juni 2026"
                : "Tahun 2026"}
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-neutral-150">
          {(["Konsumen", "Warmiendo", "Bank Sampah"] as const).map(
            (role, idx) => {
              const roleRankings = activeRankings[role] || [];
              return (
                <div
                  key={role}
                  className={`space-y-4 ${idx === 0 ? "md:pr-6" : idx === 1 ? "md:px-6" : "md:pl-6"} ${idx > 0 ? "pt-4 md:pt-0" : ""}`}
                >
                  <div>
                    <h4 className="font-extrabold text-neutral-900 text-sm">
                      {role === "Konsumen"
                        ? "Peran Konsumen"
                        : role === "Warmiendo"
                          ? "Peran Mitra Warmiendo"
                          : "Peran Mitra Bank Sampah"}
                    </h4>
                    <p className="text-[10px] text-neutral-450 text-neutral-400 mt-0.5">
                      Top 3 Setoran Terbanyak
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {roleRankings.length === 0 ? (
                      <div className="py-8 text-center text-xs text-neutral-400 bg-neutral-50 rounded-xl border border-neutral-200/50">
                        Belum ada data setoran untuk periode ini.
                      </div>
                    ) : (
                      roleRankings.map((rank, rankIdx) => {
                        const medalColors = [
                          "bg-amber-100 text-amber-700 border-amber-200", // Gold
                          "bg-neutral-100 text-neutral-700 border-neutral-200 bg-gray-100", // Silver
                          "bg-orange-100 text-orange-700 border-orange-200", // Bronze
                        ];
                        return (
                          <div
                            key={rank.userId}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-150 bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center border shrink-0 ${medalColors[rankIdx] || "bg-neutral-50 text-neutral-500"}`}
                              >
                                {rankIdx + 1}
                              </span>
                              <span className="text-xs font-bold text-neutral-800 truncate max-w-36 sm:max-w-44">
                                {rank.name}
                              </span>
                            </div>
                            <span className="text-xs font-black text-primary-600 shrink-0 font-mono">
                              {rank.totalWeight.toFixed(1)} Kg
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}
