"use client";

import imageCompression from "browser-image-compression";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Download,
  Eye,
  FileCheck2,
  FileText,
  HelpCircle,
  Info,
  Loader2,
  Package,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { getBuktiPembayaranPdfBase64 } from "@/app/(admin-superadmin)/pencairan-dana/action";
import {
  getBankSampahPeriodsWithSetoran,
  getDisbursementHistory,
  type PeriodItem,
  requestDisbursement,
} from "@/app/(bank-sampah)/ajukan-pencairan-dana/bank-sampah-pencairan/action";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { TourGuide } from "@/app/components/shared/TourGuide";
import type { DisbursementHistoryItem, MetodePembayaran } from "@/app/types";

const pencairanSteps = [
  {
    element: "#tour-bank-sampah-pencairan-saldo",
    popover: {
      title: "Ringkasan Saldo & Kredit",
      description:
        "Pantau total kredit yang siap dicairkan, dana yang telah berhasil dicairkan, dan akumulasi berat sampah yang telah diverifikasi oleh petugas.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-bank-sampah-pencairan-periods",
    popover: {
      title: "Daftar Periode Setoran Sampah",
      description:
        "Hanya periode bulan yang memiliki setoran sampah riil yang akan muncul di sini. Setiap kartu menampilkan total berat, estimasi kredit, dan status pencairannya.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-bank-sampah-pencairan-action",
    popover: {
      title: "Pencairan & Detail Setoran",
      description:
        "Klik 'Cairkan Dana' untuk mengajukan pencairan pada bulan yang sudah selesai. Jika dana sudah dicairkan, tombol akan terkunci dan Anda dapat melihat detail atau mengunduh surat bukti pembayaran.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-bank-sampah-pencairan-history",
    popover: {
      title: "Riwayat Pencairan Dana",
      description:
        "Daftar seluruh transaksi pencairan dana yang pernah Anda ajukan beserta bukti transfer dari admin dan unduhan PDF resmi.",
      side: "top" as const,
    },
  },
];

function formatRp(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function formatTanggal(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({
  status,
  isCurrentMonth,
}: {
  status: "belum_dicairkan" | "pending" | "berhasil" | "ditolak";
  isCurrentMonth?: boolean;
}) {
  if (isCurrentMonth) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <Clock className="w-3.5 h-3.5 text-blue-600" />
        Bulan Berjalan
      </span>
    );
  }

  switch (status) {
    case "berhasil":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Sudah Dicairkan
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Menunggu Verifikasi
        </span>
      );
    case "ditolak":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="w-3.5 h-3.5 text-red-600" />
          Pengajuan Ditolak
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          Siap Dicairkan
        </span>
      );
  }
}

export default function BankSampahPencairanPage() {
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [profile, setProfile] = useState<{
    id: number;
    name: string;
    role: string;
    jenisBank: string;
    noRekening: string;
    alamat: string;
    noTelepon: string;
    idPelanggan: string;
  } | null>(null);
  const [summary, setSummary] = useState({
    totalKreditTersedia: 0,
    totalKreditDicairkan: 0,
    totalBeratKg: 0,
    totalPeriode: 0,
  });
  const [history, setHistory] = useState<DisbursementHistoryItem[]>([]);

  // Selected period for Detail Modal
  const [selectedPeriodDetail, setSelectedPeriodDetail] =
    useState<PeriodItem | null>(null);

  // Selected period for Withdrawal Form Modal
  const [withdrawPeriod, setWithdrawPeriod] = useState<PeriodItem | null>(null);

  // Withdrawal form inputs
  const [metode, setMetode] = useState<MetodePembayaran>("transfer");
  const [keterangan, setKeterangan] = useState("");
  const [ttdBase64, setTtdBase64] = useState<string | null>(null);
  const [ttdError, setTtdError] = useState("");
  const [isCompressingTtd, setIsCompressingTtd] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Proof Image Preview Modal
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  // Tour Guide State
  const [isTourActive, setIsTourActive] = useState(false);
  const savedTourState = useRef<{
    periods: PeriodItem[];
    summary: typeof summary;
    history: DisbursementHistoryItem[];
  } | null>(null);

  // Table pagination & filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: "",
  });

  // Feedback Notification
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({ isOpen: false, type: "success", title: "", message: "" });

  const showFeedback = useCallback(
    (type: "success" | "error", title: string, message: string) => {
      setFeedback({ isOpen: true, type, title, message });
    },
    [],
  );

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [periodsRes, historyRes] = await Promise.all([
        getBankSampahPeriodsWithSetoran(),
        getDisbursementHistory(),
      ]);

      if (periodsRes.success && periodsRes.data) {
        setPeriods(periodsRes.data.periods);
        setProfile(periodsRes.data.profile);
        setSummary(periodsRes.data.summary);
      } else {
        showFeedback(
          "error",
          "Gagal Memuat Periode",
          periodsRes.message || "Terjadi kesalahan saat memuat data periode.",
        );
      }

      setHistory((historyRes as DisbursementHistoryItem[]) || []);
    } catch {
      showFeedback(
        "error",
        "Koneksi Gagal",
        "Terjadi kesalahan saat menghubungi server.",
      );
    } finally {
      setLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Tour Guide Handlers
  const handleTourStart = () => {
    savedTourState.current = {
      periods,
      summary,
      history,
    };
    setIsTourActive(true);

    // Mock realistic state for demo tour
    if (periods.length === 0) {
      setPeriods([
        {
          key: "2026-05",
          year: 2026,
          month: 5,
          monthName: "Mei",
          totalBeratKg: 45.5,
          kredit: 550000,
          dataSampah: [
            { jenis: "Etiket", beratKg: 25.5, kredit: 320000 },
            { jenis: "Karton", beratKg: 20.0, kredit: 230000 },
          ],
          statusPencairan: "belum_dicairkan",
          isCurrentMonth: false,
          canWithdraw: true,
          disbursement: null,
        },
        {
          key: "2026-04",
          year: 2026,
          month: 4,
          monthName: "April",
          totalBeratKg: 60.0,
          kredit: 720000,
          dataSampah: [{ jenis: "Etiket", beratKg: 60.0, kredit: 720000 }],
          statusPencairan: "berhasil",
          isCurrentMonth: false,
          canWithdraw: false,
          disbursement: {
            id: 101,
            jumlah: 720000,
            status: "berhasil",
            metodePembayaran: "transfer",
            createdAt: new Date("2026-05-02"),
            keterangan: "Pencairan rutin April",
            buktiTransfer: null,
            buktiPembayaranId: 1,
            ttdPenyerahUrl: null,
          },
        },
      ]);
      setSummary({
        totalKreditTersedia: 550000,
        totalKreditDicairkan: 720000,
        totalBeratKg: 105.5,
        totalPeriode: 2,
      });
    }
  };

  const handleTourEnd = () => {
    setIsTourActive(false);
    if (savedTourState.current) {
      setPeriods(savedTourState.current.periods);
      setSummary(savedTourState.current.summary);
      setHistory(savedTourState.current.history);
    }
  };

  // Upload Signature Handler
  const handleTtdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setTtdError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setTtdError("File harus berupa gambar (JPG, PNG, atau WEBP).");
      return;
    }
    setIsCompressingTtd(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });
      const reader = new FileReader();
      reader.onload = () => {
        setTtdBase64(reader.result as string);
        setIsCompressingTtd(false);
      };
      reader.onerror = () => {
        setTtdError("Gagal membaca file gambar tanda tangan.");
        setIsCompressingTtd(false);
      };
      reader.readAsDataURL(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setTtdBase64(reader.result as string);
        setIsCompressingTtd(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Disbursement Request
  const handleSubmitWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawPeriod) return;

    if (isTourActive) {
      setWithdrawPeriod(null);
      showFeedback(
        "success",
        "Simulasi Berhasil",
        `Simulasi pengajuan pencairan dana sebesar ${formatRp(withdrawPeriod.kredit)} berhasil dilakukan.`,
      );
      return;
    }

    if (!ttdBase64) {
      setTtdError("Tanda tangan penyerah wajib diunggah sebelum mengajukan.");
      return;
    }

    if (
      metode === "transfer" &&
      (!profile?.jenisBank || !profile?.noRekening)
    ) {
      showFeedback(
        "error",
        "Rekening Belum Lengkap",
        "Silakan lengkapi informasi rekening bank Anda di menu Profil Saya.",
      );
      return;
    }

    const formData = new FormData();
    // Kirim nominal sesuai kredit bulan tersebut (backend akan validasi dan hitung ulang dari database)
    formData.set("jumlah", withdrawPeriod.kredit.toString());
    formData.set("metodePembayaran", metode);
    formData.set("keterangan", keterangan);
    formData.set("ttdPenyerah", ttdBase64);
    formData.set("selectedYear", withdrawPeriod.year.toString());
    formData.set("selectedMonth", withdrawPeriod.month.toString());

    startTransition(async () => {
      const res = await requestDisbursement(
        { success: false, message: "" },
        formData,
      );
      if (res.success) {
        setWithdrawPeriod(null);
        setTtdBase64(null);
        setKeterangan("");
        setTtdError("");
        showFeedback("success", "Pengajuan Berhasil", res.message || "");
        loadAllData();
      } else {
        showFeedback(
          "error",
          "Pengajuan Gagal",
          res.message || "Gagal memproses pengajuan pencairan dana.",
        );
      }
    });
  };

  // Download Bukti Pembayaran PDF
  const handleDownloadPdf = async (docId: number) => {
    try {
      const res = await getBuktiPembayaranPdfBase64(docId);
      if (res.success && res.pdfBase64) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${res.pdfBase64}`;
        link.download = res.fileName || "Bukti-Pembayaran.pdf";
        link.click();
      } else {
        showFeedback(
          "error",
          "Gagal Mengunduh",
          res.message || "Gagal mengunduh dokumen PDF.",
        );
      }
    } catch {
      showFeedback(
        "error",
        "Gagal Mengunduh",
        "Terjadi kesalahan saat mengunduh PDF.",
      );
    }
  };

  // Table Columns
  const columns: Column<DisbursementHistoryItem>[] = [
    {
      header: "Periode",
      render: (item) => {
        if (item.periodeBulan && item.periodeTahun) {
          const bulanList = [
            "",
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
          return (
            <span className="font-bold text-neutral-800 text-xs">
              {bulanList[item.periodeBulan]} {item.periodeTahun}
            </span>
          );
        }
        return (
          <span className="text-neutral-400 text-xs font-mono">
            {formatTanggal(item.createdAt)}
          </span>
        );
      },
    },
    {
      header: "Tanggal Pengajuan",
      render: (item) => (
        <span className="text-xs text-neutral-600">
          {formatTanggal(item.createdAt)}
        </span>
      ),
    },
    {
      header: "Metode & Tujuan",
      render: (item) => (
        <div>
          <span
            className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase ${
              item.metodePembayaran === "tunai"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {item.metodePembayaran === "tunai" ? "Tunai" : "Transfer"}
          </span>
          {item.metodePembayaran !== "tunai" && item.jenisBank && (
            <div className="text-[11px] font-medium text-neutral-600 mt-1">
              {item.jenisBank} - {item.noRekening}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Nominal",
      render: (item) => (
        <span className="text-sm font-black text-neutral-900">
          {formatRp(item.jumlah)}
        </span>
      ),
    },
    {
      header: "Status",
      render: (item) => {
        const s = item.status as "pending" | "berhasil" | "ditolak";
        return (
          <div className="flex flex-col gap-1.5 items-start">
            <StatusBadge status={s} />
            <div className="flex items-center gap-2 mt-0.5">
              {item.buktiTransfer && (
                <button
                  type="button"
                  onClick={() => setViewProofUrl(item.buktiTransfer)}
                  className="text-[10px] text-primary-600 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  <Eye className="w-3 h-3" /> Bukti
                </button>
              )}
              {item.status === "berhasil" && item.buktiPembayaranId && (
                <button
                  type="button"
                  onClick={() => {
                    if (item.buktiPembayaranId) {
                      handleDownloadPdf(item.buktiPembayaranId);
                    }
                  }}
                  className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  <Download className="w-3 h-3" /> Surat PDF
                </button>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  const filters: TableFilter<DisbursementHistoryItem>[] = [
    {
      id: "status",
      label: "Status",
      options: [
        { label: "Semua Status", value: "" },
        { label: "Pending", value: "pending" },
        { label: "Berhasil", value: "berhasil" },
        { label: "Ditolak", value: "ditolak" },
      ],
    },
  ];

  const filteredHistory = history.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      (item.jenisBank ?? "").toLowerCase().includes(q) ||
      (item.noRekening ?? "").includes(search) ||
      item.jumlah.toString().includes(search);
    const matchStatus =
      !filterValues.status || item.status === filterValues.status;
    return matchSearch && matchStatus;
  });

  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const isBankSetup = Boolean(profile?.jenisBank && profile?.noRekening);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-sm font-semibold text-neutral-500">
          Memuat data setoran & pencairan bank sampah...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto animate-in fade-in duration-300">
      <TourGuide
        steps={pencairanSteps}
        onStart={handleTourStart}
        onEnd={handleTourEnd}
      />

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2.5 bg-primary-100 rounded-2xl text-primary-600">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            Pencairan Dana Bank Sampah
          </h1>
          <p className="text-sm text-neutral-500 mt-1 ml-12">
            Kelola saldo kredit hasil setoran sampah dan ajukan pencairan dana
            per periode bulan.
          </p>
        </div>

        {/* Tour Guide Button Helper */}
        <button
          type="button"
          onClick={() => {
            const tourBtn = document.querySelector(
              "[data-tour-trigger]",
            ) as HTMLButtonElement | null;
            tourBtn?.click();
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-600 hover:text-primary-600 hover:border-primary-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-primary-500" />
          Panduan Pencairan
        </button>
      </div>

      {/* ── SUMMARY STATS CARDS ── */}
      <div
        id="tour-bank-sampah-pencairan-saldo"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* Card 1: Kredit Siap Dicairkan */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-6 shadow-md">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/80">
                Kredit Siap Dicairkan
              </p>
              <p className="text-2xl sm:text-3xl font-black mt-1 tracking-tight text-white">
                {formatRp(summary.totalKreditTersedia)}
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 shrink-0">
              <Coins className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <p className="text-xs text-white/60 mt-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            Dari periode yang telah selesai & siap diajukan
          </p>
        </div>

        {/* Card 2: Total Dana Telah Dicairkan */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-neutral-200 p-6 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Total Dana Telah Dicairkan
              </p>
              <p className="text-2xl sm:text-3xl font-black mt-1 tracking-tight text-neutral-900">
                {formatRp(summary.totalKreditDicairkan)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shrink-0">
              <Banknote className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Total kumulatif pencairan berstatus berhasil
          </p>
        </div>

        {/* Card 3: Total Sampah Diterima */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-neutral-200 p-6 shadow-xs sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Total Sampah Disetor
              </p>
              <p className="text-2xl sm:text-3xl font-black mt-1 tracking-tight text-neutral-900">
                {summary.totalBeratKg.toFixed(1)}{" "}
                <span className="text-base font-semibold text-neutral-500">
                  kg
                </span>
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 shrink-0">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-3 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            Tersebar di {summary.totalPeriode} periode bulan setoran
          </p>
        </div>
      </div>

      {/* ── REKENING INFO BANNER ── */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-white rounded-xl border border-neutral-200 shrink-0 text-neutral-700">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Rekening Bank Tujuan Pencairan
            </p>
            {isBankSetup ? (
              <p className="text-sm font-bold text-neutral-800 truncate">
                {profile?.jenisBank} —{" "}
                <span className="font-mono text-neutral-600 font-semibold">
                  {profile?.noRekening}
                </span>{" "}
                <span className="text-xs text-neutral-400 font-normal">
                  (a.n. {profile?.name})
                </span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                Informasi rekening bank belum diisi. Lengkapi profil Anda
                sebelum mengajukan transfer.
              </p>
            )}
          </div>
        </div>
        <Link
          href="/profil/bank-sampah-profil"
          className="self-start sm:self-auto px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap shadow-xs"
        >
          {isBankSetup ? "Ubah Rekening" : "Lengkapi Rekening"}
        </Link>
      </div>

      {/* ── DAFTAR PERIODE BULAN (HANYA YANG ADA SETORAN) ── */}
      <div id="tour-bank-sampah-pencairan-periods" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              Periode Setoran Sampah
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Hanya menampilkan bulan yang memiliki setoran sampah yang telah
              diterima.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-full">
            {periods.length} Bulan Terdata
          </span>
        </div>

        {periods.length === 0 ? (
          /* Empty State jika belum ada setoran sama sekali */
          <div className="bg-white border border-dashed border-neutral-300 rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400">
              <Package className="w-7 h-7" />
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-bold text-neutral-800">
                Belum Ada Setoran Sampah Terverifikasi
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Data periode akan otomatis muncul di sini setiap kali ada
                setoran sampah dari Bank Sampah Anda yang disetujui (status
                Diterima) oleh petugas.
              </p>
            </div>
          </div>
        ) : (
          /* List Kartu Periode */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {periods.map((item) => (
              <div
                key={item.key}
                className="bg-white border border-neutral-200 hover:border-neutral-300 transition-all rounded-3xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Month & Status Badge */}
                  <div className="flex items-start justify-between gap-2 pb-4 border-b border-neutral-100">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Periode Setoran
                      </span>
                      <h3 className="text-lg font-black text-neutral-900">
                        {item.monthName} {item.year}
                      </h3>
                    </div>
                    <StatusBadge
                      status={item.statusPencairan}
                      isCurrentMonth={item.isCurrentMonth}
                    />
                  </div>

                  {/* Card Content: Total Berat & Kredit */}
                  <div className="grid grid-cols-2 gap-3 my-4">
                    <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-100">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Total Berat
                      </p>
                      <p className="text-base font-black text-neutral-800 mt-0.5">
                        {item.totalBeratKg.toFixed(2)}{" "}
                        <span className="text-xs font-semibold text-neutral-500">
                          kg
                        </span>
                      </p>
                    </div>
                    <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-100">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Nilai Kredit
                      </p>
                      <p className="text-base font-black text-emerald-600 mt-0.5">
                        {formatRp(item.kredit)}
                      </p>
                    </div>
                  </div>

                  {/* Rincian Singkat Jenis Sampah */}
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                      Rincian Sampah Diterima:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.dataSampah.map((ds) => (
                        <span
                          key={ds.jenis}
                          className="px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-medium"
                        >
                          {ds.jenis}:{" "}
                          <span className="font-bold">{ds.beratKg} kg</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Catatan Khusus Bulan Berjalan atau Status Selesai */}
                  {item.isCurrentMonth && (
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-700 flex items-center gap-2 mb-4">
                      <Info className="w-4 h-4 shrink-0 text-blue-500" />
                      <span>
                        Bulan berjalan belum dapat dicairkan. Pengajuan dapat
                        dilakukan mulai bulan berikutnya.
                      </span>
                    </div>
                  )}

                  {item.statusPencairan === "berhasil" && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-xs text-emerald-800 flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>Dana telah dicairkan oleh admin.</span>
                      </div>
                      {item.disbursement?.buktiPembayaranId && (
                        <button
                          type="button"
                          onClick={() => {
                            if (item.disbursement?.buktiPembayaranId) {
                              handleDownloadPdf(
                                item.disbursement.buktiPembayaranId,
                              );
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer bg-transparent border-0 p-0"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                      )}
                    </div>
                  )}

                  {item.statusPencairan === "pending" && (
                    <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl text-xs text-amber-800 flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>
                        Pengajuan sedang diproses & menunggu transfer dari
                        admin.
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div
                  id="tour-bank-sampah-pencairan-action"
                  className="pt-4 border-t border-neutral-100 flex items-center gap-2"
                >
                  {/* Tombol Lihat Detail: Selalu Ada */}
                  <button
                    type="button"
                    onClick={() => setSelectedPeriodDetail(item)}
                    className="flex-1 py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Lihat Detail
                  </button>

                  {/* Tombol Cairkan Dana: HANYA ADA JIKA canWithdraw (Belum dicairkan & bukan bulan berjalan) */}
                  {item.canWithdraw && (
                    <button
                      type="button"
                      onClick={() => setWithdrawPeriod(item)}
                      className="flex-1 py-2.5 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary-600/20 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      Cairkan Dana
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── TABEL RIWAYAT PENCAIRAN DANA ── */}
      <div
        id="tour-bank-sampah-pencairan-history"
        className="bg-white border border-neutral-200 rounded-3xl shadow-xs overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-neutral-100 rounded-xl text-neutral-700">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-800">
                Riwayat Pengajuan Pencairan Dana
              </h2>
              <p className="text-[11px] text-neutral-400">
                Semua transaksi pencairan yang pernah diajukan pada sistem.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <DataTable
            data={paginatedHistory}
            columns={columns}
            totalItems={filteredHistory.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            searchPlaceholder="Cari riwayat pencairan..."
            filters={filters}
            filterValues={filterValues}
            onFilterChange={(id, value) => {
              setFilterValues({ ...filterValues, [id]: value });
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* ── MODAL DETAIL SETORAN ── */}
      {selectedPeriodDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-neutral-900">
                  Detail Setoran Periode {selectedPeriodDetail.monthName}{" "}
                  {selectedPeriodDetail.year}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPeriodDetail(null)}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 text-neutral-400 flex items-center justify-center bg-transparent border-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Status & Ringkasan */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Total Nilai Kredit
                  </p>
                  <p className="text-xl font-black text-emerald-600 mt-0.5">
                    {formatRp(selectedPeriodDetail.kredit)}
                  </p>
                </div>
                <StatusBadge
                  status={selectedPeriodDetail.statusPencairan}
                  isCurrentMonth={selectedPeriodDetail.isCurrentMonth}
                />
              </div>

              {/* Rincian Per Jenis Sampah */}
              <div>
                <p className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Daftar Sampah Diterima
                </p>
                <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-100">
                  {selectedPeriodDetail.dataSampah.map((s) => (
                    <div
                      key={s.jenis}
                      className="px-4 py-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-neutral-800">
                          {s.jenis}
                        </span>
                        <span className="text-neutral-500 ml-2">
                          ({s.beratKg} kg)
                        </span>
                      </div>
                      <span className="font-bold text-neutral-700">
                        {formatRp(s.kredit)}
                      </span>
                    </div>
                  ))}
                  <div className="px-4 py-3 bg-neutral-50 flex items-center justify-between text-xs font-bold text-neutral-900">
                    <span>
                      Total ({selectedPeriodDetail.totalBeratKg.toFixed(2)} kg)
                    </span>
                    <span className="text-emerald-700">
                      {formatRp(selectedPeriodDetail.kredit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rekening Tujuan */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-xs space-y-1">
                <p className="font-bold text-neutral-500 uppercase text-[10px] tracking-wider">
                  Rekening Penerima
                </p>
                <p className="font-bold text-neutral-800">
                  {profile?.jenisBank} - {profile?.noRekening}
                </p>
                <p className="text-neutral-500">Atas Nama: {profile?.name}</p>
              </div>

              {/* Info Pencairan Jika Ada */}
              {selectedPeriodDetail.disbursement && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-2">
                  <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Informasi Pengajuan Pencairan
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-neutral-700 pt-1">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase block">
                        Metode
                      </span>
                      <span className="font-semibold uppercase">
                        {selectedPeriodDetail.disbursement.metodePembayaran}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase block">
                        Tanggal Diajukan
                      </span>
                      <span className="font-semibold">
                        {formatTanggal(
                          selectedPeriodDetail.disbursement.createdAt,
                        )}
                      </span>
                    </div>
                  </div>
                  {selectedPeriodDetail.disbursement.buktiPembayaranId && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            selectedPeriodDetail.disbursement?.buktiPembayaranId
                          ) {
                            handleDownloadPdf(
                              selectedPeriodDetail.disbursement
                                .buktiPembayaranId,
                            );
                          }
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Unduh Bukti Pembayaran Resmi (PDF)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPeriodDetail(null)}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PENGAJUAN PENCAIRAN DANA ── */}
      {withdrawPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh]">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-neutral-900">
                  Ajukan Pencairan Dana Periode {withdrawPeriod.monthName}{" "}
                  {withdrawPeriod.year}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawPeriod(null)}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 text-neutral-400 flex items-center justify-center bg-transparent border-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitWithdrawal}
              className="flex-1 overflow-y-auto p-6 space-y-5"
            >
              {/* Nominal Terkunci Sesuai Akumulasi Database */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 border border-emerald-200 rounded-2xl p-4 text-center">
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Nominal Pencairan Periode Ini
                </p>
                <p className="text-3xl font-black text-emerald-700 mt-1">
                  {formatRp(withdrawPeriod.kredit)}
                </p>
                <p className="text-[11px] text-emerald-600 mt-1">
                  Nominal dihitung secara otomatis dan dikunci berdasarkan
                  setoran diterima ({withdrawPeriod.totalBeratKg} kg).
                </p>
              </div>

              {/* Rekening Tujuan */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Rekening Penerima
                  </p>
                  <Link
                    href="/profil/bank-sampah-profil"
                    className="text-[10px] font-bold text-primary-600 hover:underline"
                  >
                    Ubah
                  </Link>
                </div>
                {isBankSetup ? (
                  <>
                    <p className="text-sm font-bold text-neutral-800">
                      {profile?.jenisBank} - {profile?.noRekening}
                    </p>
                    <p className="text-xs text-neutral-500">
                      a.n. {profile?.name}
                    </p>
                  </>
                ) : (
                  <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Rekening belum
                    diisi. Mohon lengkapi di menu Profil.
                  </p>
                )}
              </div>

              {/* Metode Pembayaran */}
              <div>
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2">
                  Metode Pencairan
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMetode("transfer")}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      metode === "transfer"
                        ? "border-primary-600 bg-primary-50/50 text-primary-900 font-bold"
                        : "border-neutral-200 bg-white text-neutral-600"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-primary-600" />
                    <span className="text-xs">Transfer Bank</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetode("tunai")}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      metode === "tunai"
                        ? "border-primary-600 bg-primary-50/50 text-primary-900 font-bold"
                        : "border-neutral-200 bg-white text-neutral-600"
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs">Tunai (Cash)</span>
                  </button>
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label
                  htmlFor="keterangan-input"
                  className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-1.5"
                >
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  id="keterangan-input"
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Contoh: Pencairan dana kas operasional bank sampah"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                />
              </div>

              {/* Tanda Tangan */}
              <div>
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-1.5">
                  Tanda Tangan Penyerah (Wajib)
                </span>
                <div className="border-2 border-dashed border-neutral-300 rounded-2xl p-4 text-center hover:border-primary-400 transition-colors">
                  {ttdBase64 ? (
                    <div className="space-y-3 flex flex-col items-center">
                      <div className="bg-neutral-50 p-2 rounded-xl border border-neutral-200 max-h-36 max-w-full overflow-hidden">
                        {/* biome-ignore lint/performance/noImgElement: user signature preview */}
                        <img
                          src={ttdBase64}
                          alt="Tanda Tangan"
                          className="max-h-32 object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setTtdBase64(null)}
                        className="text-xs font-bold text-red-600 hover:underline cursor-pointer bg-transparent border-0"
                      >
                        Ganti Tanda Tangan
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-primary-600 hover:underline">
                          Unggah Foto Tanda Tangan
                        </span>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Format PNG, JPG, atau WEBP (Maks. 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleTtdUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {isCompressingTtd && (
                  <p className="text-[11px] text-primary-600 font-semibold mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Mengompresi
                    gambar tanda tangan...
                  </p>
                )}
                {ttdError && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">
                    {ttdError}
                  </p>
                )}
              </div>

              {/* Tombol Submit Modal */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={
                    isPending ||
                    isCompressingTtd ||
                    (metode === "transfer" && !isBankSetup) ||
                    !ttdBase64
                  }
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-primary-600/20 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Mengirim
                      Pengajuan...
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" /> Kirim Pengajuan
                      Pencairan
                    </>
                  )}
                </button>
                <p className="text-[11px] text-neutral-400 text-center mt-2">
                  Pengajuan akan diteruskan ke Admin untuk diverifikasi dan
                  ditransfer.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL VIEW BUKTI TRANSFER ── */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-100 p-6 relative animate-in zoom-in-95 duration-200 space-y-4">
            <button
              type="button"
              onClick={() => setViewProofUrl(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 border-0 bg-transparent cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-neutral-800 flex items-center gap-2 pb-3 border-b border-neutral-100">
              <Eye className="w-5 h-5 text-primary-600" /> Bukti Transfer
              Pencairan Dana
            </h3>
            <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50 max-h-96 flex items-center justify-center">
              {/* biome-ignore lint/performance/noImgElement: R2 remote proof image */}
              <img
                src={viewProofUrl}
                alt="Bukti Transfer"
                className="max-h-96 object-contain w-full"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewProofUrl(null)}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors border-0 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FEEDBACK MODAL ── */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}
