"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  FileSpreadsheet,
  FileText,
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
import {
  generateUnifiedReportPdfAction,
  getExportCountAction,
  getExportDataAction,
  getUnifiedReport,
} from "@/app/(admin-superadmin)/laporan/setoran/action";
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
        "Halaman analisis yang menggabungkan data setoran dari seluruh kategori nasabah (Warmindo, Bank Sampah, Konsumen).",
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
  const [chartData, setChartData] = useState<UnifiedReportData | null>(null);
  const [tableData, setTableData] = useState<UnifiedReportData | null>(null);
  const [isChartPending, startChartTransition] = useTransition();
  const [isTablePending, startTableTransition] = useTransition();

  // Chart/Graphic Filters
  const [chartYear, setChartYear] = useState(() => new Date().getFullYear());
  const [chartMonth, setChartMonth] = useState<number | null>(null);
  const [chartKategori, setChartKategori] = useState("Semua");
  const [chartJenisSampah, setChartJenisSampah] = useState("Semua");
  const [chartStatus, setChartStatus] = useState("Semua");
  const [chartMetodeSetor, setChartMetodeSetor] = useState("Semua");
  const [isChartAdvancedOpen, setIsChartAdvancedOpen] = useState(false);

  // Table Filters
  const [tableYear, setTableYear] = useState(() => new Date().getFullYear());
  const [tableMonth, setTableMonth] = useState<number | null>(null);
  const [tableKategori, setTableKategori] = useState("Semua");
  const [tableJenisSampah, setTableJenisSampah] = useState("Semua");
  const [tableStatus, setTableStatus] = useState("Semua");
  const [tableMetodeSetor, setTableMetodeSetor] = useState("Semua");

  // Pagination & Sort
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Tour
  const [_isTourActive, setIsTourActive] = useState(false);

  // Export Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<"pdf" | "excel">("pdf");
  const [exportColumns, setExportColumns] = useState<string[]>([
    "nomorSetor",
    "nasabah",
    "kategoriNasabah",
    "jenisSampah",
    "beratKg",
    "tanggalSetor",
    "status",
    "metodeSetor",
    "kredit",
  ]);
  const [isExporting, setIsExporting] = useState(false);

  // New Export Custom Filter States
  const [exportYear, setExportYear] = useState(() => new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState<number | null>(null);
  const [exportKategori, setExportKategori] = useState("Semua");
  const [exportJenisSampah, setExportJenisSampah] = useState("Semua");
  const [exportStatus, setExportStatus] = useState("Semua");
  const [exportMetodeSetor, setExportMetodeSetor] = useState("Semua");
  const [exportOrientation, setExportOrientation] = useState<
    "portrait" | "landscape"
  >("portrait");
  const [exportCount, setExportCount] = useState<number>(0);
  const [isCounting, setIsCounting] = useState(false);

  // Effect to fetch count dynamically
  useEffect(() => {
    if (!isExportModalOpen) return;

    let isSubscribed = true;
    const fetchCount = async () => {
      setIsCounting(true);
      const res = await getExportCountAction({
        selectedYear: exportYear,
        selectedMonth: exportMonth,
        kategori: exportKategori,
        jenisSampah: exportJenisSampah,
        status: exportStatus,
        metodeSetor: exportMetodeSetor,
      });
      if (isSubscribed && res.success) {
        setExportCount(res.count);
      }
      if (isSubscribed) {
        setIsCounting(false);
      }
    };

    const timer = setTimeout(fetchCount, 300); // Debounce count requests
    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [
    isExportModalOpen,
    exportYear,
    exportMonth,
    exportKategori,
    exportJenisSampah,
    exportStatus,
    exportMetodeSetor,
  ]);

  const openExportModal = (type: "pdf" | "excel") => {
    setExportType(type);
    setExportYear(tableYear);
    setExportMonth(tableMonth);
    setExportKategori(tableKategori);
    setExportJenisSampah(tableJenisSampah);
    setExportStatus(tableStatus);
    setExportMetodeSetor(tableMetodeSetor);
    setExportOrientation("portrait");
    setIsExportModalOpen(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportType === "pdf") {
        const res = await generateUnifiedReportPdfAction({
          selectedYear: exportYear,
          selectedMonth: exportMonth,
          kategori: exportKategori,
          jenisSampah: exportJenisSampah,
          status: exportStatus,
          metodeSetor: exportMetodeSetor,
          columns: exportColumns,
          orientation: exportOrientation,
        });

        if (res.success && res.pdfBase64) {
          const link = document.createElement("a");
          link.href = `data:application/pdf;base64,${res.pdfBase64}`;
          link.download = res.fileName || "Laporan_Setoran.pdf";
          link.click();
          setIsExportModalOpen(false);
        } else {
          alert(res.message || "Gagal membuat PDF");
        }
      } else {
        // Excel (CSV) export
        const res = await getExportDataAction({
          selectedYear: exportYear,
          selectedMonth: exportMonth,
          kategori: exportKategori,
          jenisSampah: exportJenisSampah,
          status: exportStatus,
          metodeSetor: exportMetodeSetor,
        });

        if (res.success && res.items) {
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

          // Generate styled Excel CSV content
          const csvRows: string[][] = [];

          // 1. Meta / Filter Info
          csvRows.push(["LAPORAN SETORAN SAMPAH TERPADU"]);
          csvRows.push(["Sistem Pengelolaan Sampah PT. Indofood (SICUAN)"]);
          csvRows.push([]);
          csvRows.push(["Tahun", String(exportYear)]);
          csvRows.push([
            "Bulan",
            exportMonth ? BULAN_NAMES[exportMonth - 1] : "Semua Bulan",
          ]);
          csvRows.push(["Kategori Nasabah", exportKategori]);
          csvRows.push(["Jenis Sampah", exportJenisSampah]);
          csvRows.push(["Status", exportStatus]);
          csvRows.push(["Metode Setor", exportMetodeSetor]);
          csvRows.push([]);

          // 2. Metrics Summary
          csvRows.push(["RINGKASAN METRIK UTAMA"]);
          csvRows.push([
            "Total Setoran",
            `${res.items.length} kali`,
            "Total Berat",
            `${res.summary.totalBerat} kg`,
          ]);
          csvRows.push([
            "Total Kredit",
            `Rp ${res.summary.totalKredit.toLocaleString("id-ID")}`,
            "Total Poin",
            `${res.summary.totalPoin} pt`,
          ]);
          csvRows.push([]);

          // 3. Table Headers
          const colDefinitions = [
            { key: "nomorSetor", label: "No. Setor" },
            { key: "nasabah", label: "Nasabah" },
            { key: "kategoriNasabah", label: "Kategori" },
            { key: "jenisSampah", label: "Jenis" },
            { key: "beratKg", label: "Berat" },
            { key: "tanggalSetor", label: "Tanggal" },
            { key: "status", label: "Status" },
            { key: "metodeSetor", label: "Metode" },
            { key: "kredit", label: "Kredit/Poin" },
          ];

          const activeCols = colDefinitions.filter((col) =>
            exportColumns.includes(col.key),
          );
          csvRows.push(activeCols.map((col) => col.label));

          // 4. Table Body
          for (const item of res.items) {
            const rowValue = activeCols.map((col) => {
              switch (col.key) {
                case "nomorSetor":
                  return item.nomorSetor;
                case "nasabah":
                  return item.nasabah;
                case "kategoriNasabah":
                  return item.kategoriNasabah === "warmindo"
                    ? "Warmindo"
                    : item.kategoriNasabah === "bank-sampah"
                      ? "Bank Sampah"
                      : "Konsumen";
                case "jenisSampah":
                  return item.jenisSampah;
                case "beratKg":
                  return `${item.beratKg} kg`;
                case "tanggalSetor":
                  return item.tanggalSetor;
                case "status":
                  return item.status.toUpperCase();
                case "metodeSetor":
                  return item.metodeSetor === "ekspedisi"
                    ? "Ekspedisi"
                    : "Langsung";
                case "kredit":
                  if (item.kredit > 0) return `Rp ${item.kredit}`;
                  if (item.totalPoin > 0) return `${item.totalPoin} pt`;
                  return "-";
                default:
                  return "";
              }
            });
            csvRows.push(rowValue);
          }

          // Build CSV string with UTF-8 BOM
          const csvContent =
            "\uFEFF" +
            csvRows
              .map((row) =>
                row
                  .map((val) => {
                    const escaped = String(val).replace(/"/g, '""');
                    return escaped.includes(",") || escaped.includes("\n")
                      ? `"${escaped}"`
                      : escaped;
                  })
                  .join(","),
              )
              .join("\n");

          const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `Laporan_Setoran_${tableYear}${tableMonth ? `_${tableMonth}` : ""}.csv`;
          link.click();
          URL.revokeObjectURL(url);
          setIsExportModalOpen(false);
        } else {
          alert(res.message || "Gagal mengambil data ekspor");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengekspor dokumen");
    } finally {
      setIsExporting(false);
    }
  };

  const loadChartData = useCallback(() => {
    startChartTransition(async () => {
      const result = await getUnifiedReport({
        selectedYear: chartYear,
        selectedMonth: chartMonth,
        kategori: chartKategori,
        jenisSampah: chartJenisSampah,
        status: chartStatus,
        metodeSetor: chartMetodeSetor,
        page: 1,
        limit: 1,
      });
      setChartData(result);
    });
  }, [
    chartYear,
    chartMonth,
    chartKategori,
    chartJenisSampah,
    chartStatus,
    chartMetodeSetor,
  ]);

  const loadTableData = useCallback(() => {
    startTableTransition(async () => {
      const result = await getUnifiedReport({
        selectedYear: tableYear,
        selectedMonth: tableMonth,
        kategori: tableKategori,
        jenisSampah: tableJenisSampah,
        status: tableStatus,
        metodeSetor: tableMetodeSetor,
        page,
        limit: pageSize,
        sortBy,
        sortOrder,
      });
      setTableData(result);
    });
  }, [
    tableYear,
    tableMonth,
    tableKategori,
    tableJenisSampah,
    tableStatus,
    tableMetodeSetor,
    page,
    pageSize,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  useEffect(() => {
    loadTableData();
  }, [loadTableData]);

  const resetChartFilters = () => {
    setChartYear(new Date().getFullYear());
    setChartMonth(null);
    setChartKategori("Semua");
    setChartJenisSampah("Semua");
    setChartStatus("Semua");
    setChartMetodeSetor("Semua");
  };

  const resetTableFilters = () => {
    setTableYear(new Date().getFullYear());
    setTableMonth(null);
    setTableKategori("Semua");
    setTableJenisSampah("Semua");
    setTableStatus("Semua");
    setTableMetodeSetor("Semua");
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

  const summary = chartData?.summary;
  const totalPages = Math.ceil((tableData?.totalDetailData ?? 0) / pageSize);

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

      {/* ── Chart Filter Bar ───────────────────────────────────────────── */}
      <div
        id="tour-setoran-filters"
        className="bg-blue-50/10 border border-blue-100/70 p-5 rounded-2xl shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2 text-neutral-800">
            <Filter className="w-4 h-4 text-primary-500" />
            <span className="font-bold text-xs">
              Filter Grafik & Metrik Utama
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetChartFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:border-neutral-400 transition-colors bg-white shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filter Grafik
            </button>
            <button
              type="button"
              onClick={() => setIsChartAdvancedOpen(!isChartAdvancedOpen)}
              className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
            >
              {isChartAdvancedOpen
                ? "Sembunyikan Filter Lanjutan"
                : "Tampilkan Filter Lanjutan"}
              {isChartAdvancedOpen ? (
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
              htmlFor="chart-filter-tahun"
              className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
            >
              Tahun
            </label>
            <input
              id="chart-filter-tahun"
              type="number"
              value={chartYear}
              onChange={(e) => {
                setChartYear(Number(e.target.value));
              }}
              className="bg-white border border-neutral-200 rounded-xl text-xs font-bold px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-750 font-mono shadow-2xs w-full"
              min={2020}
              max={2100}
            />
          </div>

          {/* Bulan */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="chart-filter-bulan"
              className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
            >
              Bulan
            </label>
            <select
              id="chart-filter-bulan"
              value={chartMonth ?? ""}
              onChange={(e) => {
                setChartMonth(e.target.value ? Number(e.target.value) : null);
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
              htmlFor="chart-filter-metode"
              className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
            >
              Metode Setor
            </label>
            <select
              id="chart-filter-metode"
              value={chartMetodeSetor}
              onChange={(e) => {
                setChartMetodeSetor(e.target.value);
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
        {isChartAdvancedOpen && (
          <div className="pt-4 border-t border-neutral-100/80 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Kategori Nasabah */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="chart-filter-kategori"
                className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
              >
                Kategori Nasabah
              </label>
              <select
                id="chart-filter-kategori"
                value={chartKategori}
                onChange={(e) => {
                  setChartKategori(e.target.value);
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
                htmlFor="chart-filter-jenis"
                className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
              >
                Jenis Sampah
              </label>
              <select
                id="chart-filter-jenis"
                value={chartJenisSampah}
                onChange={(e) => {
                  setChartJenisSampah(e.target.value);
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
                htmlFor="chart-filter-status"
                className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
              >
                Status Setoran
              </label>
              <select
                id="chart-filter-status"
                value={chartStatus}
                onChange={(e) => {
                  setChartStatus(e.target.value);
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

      {/* ── Loading Overlay untuk Grafik ─────────────────────────── */}
      {isChartPending && !chartData && (
        <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <Loader2 className="w-7 h-7 text-primary-500 animate-spin" />
          <span className="ml-3 text-sm font-semibold text-neutral-500">
            Memuat data grafik & metrik...
          </span>
        </div>
      )}

      {/* ── Grafik & Metrik Utama ────────────────────────────────── */}
      <div
        className={
          isChartPending ? "opacity-60 transition-opacity duration-200" : ""
        }
      >
        {chartData && (
          <>
            {/* ── Metric Cards ───────────────────────────────────────── */}
            <div
              id="tour-setoran-metrics"
              className="space-y-5 bg-neutral-50/60 rounded-2xl p-4 border border-neutral-100"
            >
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
                  icon={
                    <CheckCircle2 className="w-8 h-8 text-emerald-200/80" />
                  }
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
                        {chartMonth
                          ? BULAN_NAMES[chartMonth - 1]
                          : BULAN_NAMES[new Date().getMonth()]}{" "}
                        - {chartYear}
                      </p>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                      Total:{" "}
                      {chartData.weeklyTrend
                        .reduce((sum, item) => sum + item.Volume, 0)
                        .toLocaleString("id-ID")}{" "}
                      Kg
                    </span>
                  </div>

                  <div className="w-full h-52 mt-2">
                    {chartData.weeklyTrend.some((w) => w.Volume > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData.weeklyTrend}
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
                            formatter={(value: any) => [
                              `${value} Kg`,
                              "Volume",
                            ]}
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
                        Tahun {chartYear}
                      </p>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Total: {summary?.totalBerat.toLocaleString("id-ID") ?? 0}{" "}
                      Kg
                    </span>
                  </div>

                  <div className="w-full h-52 mt-2">
                    {chartData.monthlyTrend.some((m) => m.totalBerat > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData.monthlyTrend.map((m) => ({
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
                            formatter={(value: any) => [
                              `${value} Kg`,
                              "Volume",
                            ]}
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
                      {chartData.yearlyTrend
                        .reduce((sum, item) => sum + item.Volume, 0)
                        .toLocaleString("id-ID")}{" "}
                      Kg
                    </span>
                  </div>

                  <div className="w-full h-52 mt-2">
                    {chartData.yearlyTrend.some((y) => y.Volume > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData.yearlyTrend}
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
                            formatter={(value: any) => [
                              `${value} Kg`,
                              "Volume",
                            ]}
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
                items={chartData.categoryDistribution}
                colorMap={CATEGORY_BAR}
                labelMap={CATEGORY_LABEL}
              />

              {/* Waste Type Distribution */}
              <DistributionPanel
                title="Distribusi per Jenis Sampah"
                items={chartData.wasteTypeDistribution}
                colorMap={WASTE_TYPE_BAR}
              />

              {/* Status Distribution */}
              <DistributionPanel
                title="Distribusi per Status"
                items={chartData.statusDistribution}
                colorMap={STATUS_BAR}
                labelMap={STATUS_LABEL}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Loading Overlay untuk Tabel ──────────────────────────── */}
      {isTablePending && !tableData && (
        <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-neutral-200 shadow-sm">
          <Loader2 className="w-7 h-7 text-primary-500 animate-spin" />
          <span className="ml-3 text-sm font-semibold text-neutral-500">
            Memuat data tabel setoran...
          </span>
        </div>
      )}

      {/* ── Detail Data Table Section ─────────────────────────────────── */}
      <div
        className={
          isTablePending ? "opacity-60 transition-opacity duration-200" : ""
        }
      >
        {tableData && (
          <div
            id="tour-setoran-detail"
            className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-neutral-800">
                  Rincian Data Setoran
                </h3>
                <p className="text-xs text-neutral-400 font-medium mt-0.5">
                  Total {tableData.totalDetailData.toLocaleString("id-ID")} data
                  setoran terdaftar
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openExportModal("excel")}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-250 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Ekspor Excel
                </button>
                <button
                  type="button"
                  onClick={() => openExportModal("pdf")}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-250 hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Cetak PDF
                </button>
              </div>
            </div>

            {/* Table Filters Toolbar */}
            <div className="p-4 bg-neutral-50/50 border-b border-neutral-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5">
                  Filter Tabel Setoran
                </span>
                <button
                  type="button"
                  onClick={resetTableFilters}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:border-neutral-400 transition-colors bg-white shadow-2xs cursor-pointer w-fit"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Filter Tabel
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {/* Tahun */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="table-filter-tahun"
                    className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
                  >
                    Tahun
                  </label>
                  <input
                    id="table-filter-tahun"
                    type="number"
                    value={tableYear}
                    onChange={(e) => {
                      setTableYear(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-white border border-neutral-200 rounded-lg text-xs font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-750 font-mono shadow-2xs w-full"
                    min={2020}
                    max={2100}
                  />
                </div>

                {/* Bulan */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="table-filter-bulan"
                    className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
                  >
                    Bulan
                  </label>
                  <select
                    id="table-filter-bulan"
                    value={tableMonth ?? ""}
                    onChange={(e) => {
                      setTableMonth(
                        e.target.value ? Number(e.target.value) : null,
                      );
                      setPage(1);
                    }}
                    className="bg-white border border-neutral-200 rounded-lg text-xs font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs w-full"
                  >
                    <option value="">Semua</option>
                    {BULAN_NAMES.map((name, idx) => (
                      <option key={name} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kategori */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="table-filter-kategori"
                    className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
                  >
                    Kategori
                  </label>
                  <select
                    id="table-filter-kategori"
                    value={tableKategori}
                    onChange={(e) => {
                      setTableKategori(e.target.value);
                      setPage(1);
                    }}
                    className="bg-white border border-neutral-200 rounded-lg text-xs font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs w-full"
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
                    htmlFor="table-filter-jenis"
                    className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
                  >
                    Jenis Sampah
                  </label>
                  <select
                    id="table-filter-jenis"
                    value={tableJenisSampah}
                    onChange={(e) => {
                      setTableJenisSampah(e.target.value);
                      setPage(1);
                    }}
                    className="bg-white border border-neutral-200 rounded-lg text-xs font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs w-full"
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
                    htmlFor="table-filter-status"
                    className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
                  >
                    Status
                  </label>
                  <select
                    id="table-filter-status"
                    value={tableStatus}
                    onChange={(e) => {
                      setTableStatus(e.target.value);
                      setPage(1);
                    }}
                    className="bg-white border border-neutral-200 rounded-lg text-xs font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs w-full"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Metode */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="table-filter-metode"
                    className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
                  >
                    Metode Setor
                  </label>
                  <select
                    id="table-filter-metode"
                    value={tableMetodeSetor}
                    onChange={(e) => {
                      setTableMetodeSetor(e.target.value);
                      setPage(1);
                    }}
                    className="bg-white border border-neutral-200 rounded-lg text-xs font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs w-full"
                  >
                    {METODE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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
                    <SortableHeader
                      label="Kategori"
                      column="kategoriNasabah"
                      current={sortBy}
                      order={sortOrder}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Jenis"
                      column="jenisSampah"
                      current={sortBy}
                      order={sortOrder}
                      onSort={handleSort}
                    />
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
                    <SortableHeader
                      label="Metode"
                      column="metodeSetor"
                      current={sortBy}
                      order={sortOrder}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Kredit/Poin"
                      column="kredit"
                      align="right"
                      current={sortBy}
                      order={sortOrder}
                      onSort={handleSort}
                    />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {tableData.detailData.length > 0 ? (
                    tableData.detailData.map((row) => (
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
                  {Math.min(page * pageSize, tableData.totalDetailData)} dari{" "}
                  {tableData.totalDetailData.toLocaleString("id-ID")} data
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
        )}
      </div>

      {/* ── Export Modal with Options ───────────────────────────── */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-neutral-250 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-250">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/85">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Pengaturan Ekspor Laporan
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Pilih opsi kolom dan konfigurasi untuk laporan{" "}
                  {exportType.toUpperCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 font-extrabold text-xl p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Export format info */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center gap-3">
                {exportType === "pdf" ? (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100 text-rose-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-neutral-800">
                        Format PDF Terpadu (A4)
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        Sempurna untuk dicetak, dibagikan, atau diarsipkan.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-neutral-800">
                        Format Excel (CSV Spreadsheet)
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        Mendukung formula, filter lanjutan, dan pengolahan data
                        spreadsheet.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Column Selection */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Kolom yang Ingin Diekspor
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExportColumns([
                          "nomorSetor",
                          "nasabah",
                          "kategoriNasabah",
                          "jenisSampah",
                          "beratKg",
                          "tanggalSetor",
                          "status",
                          "metodeSetor",
                          "kredit",
                        ])
                      }
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-[10px] text-neutral-300">|</span>
                    <button
                      type="button"
                      onClick={() => setExportColumns(["nomorSetor"])}
                      className="text-[10px] font-bold text-neutral-500 hover:text-neutral-700 transition-colors cursor-pointer"
                    >
                      Bersihkan
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "nomorSetor", label: "Nomor Setor" },
                    { id: "nasabah", label: "Nama Nasabah" },
                    { id: "kategoriNasabah", label: "Kategori Nasabah" },
                    { id: "jenisSampah", label: "Jenis Sampah" },
                    { id: "beratKg", label: "Berat Sampah (kg)" },
                    { id: "tanggalSetor", label: "Tanggal Setor" },
                    { id: "status", label: "Status Setoran" },
                    { id: "metodeSetor", label: "Metode Setor" },
                    { id: "kredit", label: "Kredit / Poin" },
                  ].map((col) => {
                    const isChecked = exportColumns.includes(col.id);
                    return (
                      <label
                        key={col.id}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${isChecked ? "bg-indigo-50/60 border-indigo-200 text-indigo-900" : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              if (exportColumns.length > 1) {
                                setExportColumns(
                                  exportColumns.filter((c) => c !== col.id),
                                );
                              }
                            } else {
                              setExportColumns([...exportColumns, col.id]);
                            }
                          }}
                          className="rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                        {col.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* PDF Page Orientation */}
              {exportType === "pdf" && (
                <div className="space-y-2.5">
                  <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Orientasi Halaman PDF
                  </span>
                  <div className="flex gap-3">
                    {[
                      { id: "portrait", label: "Portrait (A4 Tegak)" },
                      { id: "landscape", label: "Landscape (A4 Mendatar)" },
                    ].map((opt) => {
                      const isSelected = exportOrientation === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setExportOrientation(
                              opt.id as "portrait" | "landscape",
                            )
                          }
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer select-none ${
                            isSelected
                              ? "bg-indigo-50/60 border-indigo-250 text-indigo-900 shadow-2xs"
                              : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Filter Ekspor Kustom */}
              <div className="space-y-3.5 pt-1 border-t border-neutral-100">
                <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Kustomisasi Filter Data Ekspor
                </span>
                <div className="grid grid-cols-2 gap-3.5 bg-neutral-50/65 rounded-2xl border border-neutral-200 p-4">
                  {/* Tahun */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="export-filter-tahun"
                      className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
                    >
                      Tahun
                    </label>
                    <input
                      id="export-filter-tahun"
                      type="number"
                      value={exportYear}
                      onChange={(e) => setExportYear(Number(e.target.value))}
                      className="bg-white border border-neutral-200 rounded-lg text-xs font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-750 font-mono shadow-2xs w-full"
                      min={2020}
                      max={2100}
                    />
                  </div>

                  {/* Bulan */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="export-filter-bulan"
                      className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
                    >
                      Bulan
                    </label>
                    <select
                      id="export-filter-bulan"
                      value={exportMonth ?? ""}
                      onChange={(e) =>
                        setExportMonth(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className="bg-white border border-neutral-200 rounded-lg text-xs font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs w-full"
                    >
                      <option value="">Semua Bulan</option>
                      {BULAN_NAMES.map((name, idx) => (
                        <option key={name} value={idx + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kategori / Role */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="export-filter-kategori"
                      className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
                    >
                      Kategori / Role
                    </label>
                    <select
                      id="export-filter-kategori"
                      value={exportKategori}
                      onChange={(e) => setExportKategori(e.target.value)}
                      className="bg-white border border-neutral-200 rounded-lg text-xs font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs w-full"
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
                      htmlFor="export-filter-jenis"
                      className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
                    >
                      Jenis Sampah
                    </label>
                    <select
                      id="export-filter-jenis"
                      value={exportJenisSampah}
                      onChange={(e) => setExportJenisSampah(e.target.value)}
                      className="bg-white border border-neutral-200 rounded-lg text-xs font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs w-full"
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
                      htmlFor="export-filter-status"
                      className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
                    >
                      Status Setoran
                    </label>
                    <select
                      id="export-filter-status"
                      value={exportStatus}
                      onChange={(e) => setExportStatus(e.target.value)}
                      className="bg-white border border-neutral-200 rounded-lg text-xs font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs w-full"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Metode Setor */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="export-filter-metode"
                      className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5"
                    >
                      Metode Setor
                    </label>
                    <select
                      id="export-filter-metode"
                      value={exportMetodeSetor}
                      onChange={(e) => setExportMetodeSetor(e.target.value)}
                      className="bg-white border border-neutral-200 rounded-lg text-xs font-bold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer text-neutral-700 shadow-2xs w-full"
                    >
                      {METODE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                {isCounting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                    Menghitung data...
                  </>
                ) : (
                  <span>
                    Jumlah data:{" "}
                    <strong className="text-neutral-800 font-bold">
                      {exportCount} baris
                    </strong>
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  disabled={isExporting}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-neutral-250 text-neutral-500 hover:bg-neutral-50 transition-colors cursor-pointer bg-white"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting || isCounting || exportCount === 0}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer min-w-32"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Unduh Laporan"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
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
      className={`bg-linear-to-br ${gradient} rounded-2xl p-6 text-white shadow-lg ring-1 ring-black/5 relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl transition-all duration-300`}
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
  align = "left",
  onSort,
}: {
  label: string;
  column: string;
  current: string;
  order: "asc" | "desc";
  align?: "left" | "right";
  onSort: (col: string) => void;
}) {
  const isActive = current === column;
  return (
    <th
      className={`px-4 py-3 ${align === "right" ? "text-right" : "text-left"} font-bold text-neutral-500 uppercase tracking-wider cursor-pointer select-none hover:text-neutral-700 transition-colors whitespace-nowrap group`}
      onClick={() => onSort(column)}
    >
      <span
        className={`inline-flex items-center gap-1.5 ${align === "right" ? "justify-end w-full" : ""}`}
      >
        {label}
        {isActive ? (
          order === "asc" ? (
            <ArrowUp className="w-3.5 h-3.5 text-primary-600 shrink-0" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-primary-600 shrink-0" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-400 transition-colors shrink-0" />
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
