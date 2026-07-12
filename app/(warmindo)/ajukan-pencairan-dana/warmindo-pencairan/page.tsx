"use client";

import imageCompression from "browser-image-compression";
import {
  AlertTriangle,
  ArrowRightLeft,
  Banknote,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  CreditCard,
  Download,
  Eye,
  FileText,
  Info,
  Loader2,
  LockKeyhole,
  Package,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { getBuktiPembayaranPdfBase64 } from "@/app/(admin-superadmin)/pencairan-dana/action";
import {
  getDisbursementDataForMonth,
  getDisbursementHistory,
  requestDisbursement,
} from "@/app/(warmindo)/ajukan-pencairan-dana/warmindo-pencairan/action";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/shared/DataTable";
import { DisbursementLetterPreview } from "@/app/components/shared/DisbursementLetterPreview";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { TourGuide } from "@/app/components/shared/TourGuide";

const pencairanSteps = [
  {
    element: "#tour-warmindo-pencairan-saldo",
    popover: {
      title: "Saldo Kredit Terkumpul",
      description:
        "Menampilkan jumlah total kredit Rupiah hasil verifikasi aktual setoran sampah Anda. Selama tour berjalan, nominal ini disimulasikan sebesar Rp 750.000.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-warmindo-pencairan-form",
    popover: {
      title: "Form Pengajuan Pencairan",
      description:
        "Pilih metode pencairan (Transfer Bank / Tunai) dan lengkapi data tanda tangan Anda (TTD). Rekening tujuan terisi otomatis jika Anda telah mengisinya di halaman profil.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-warmindo-pencairan-submit",
    popover: {
      title: "Kirim Pengajuan Pencairan",
      description:
        "Klik tombol ini untuk melihat pratinjau surat bukti pembayaran dan mengirimkan pengajuan pencairan dana Anda secara simulasi.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-warmindo-pencairan-history",
    popover: {
      title: "Riwayat Pengajuan Pencairan",
      description:
        "Setelah simulasi selesai, riwayat pengajuan baru Anda dengan status pending akan tercatat di tabel riwayat ini.",
      side: "top" as const,
    },
  },
];

import type {
  DataSampahPencairan,
  DisbursementHistoryItem,
  KategoriSumber,
  MetodePembayaran,
  UserDataPencairan,
} from "@/app/types";

// Alias lokal agar tidak perlu ganti nama di seluruh komponen
type DataSampahItem = DataSampahPencairan;
type UserData = UserDataPencairan;

const BULAN_ID = [
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    berhasil: "bg-emerald-100 text-emerald-700 border-emerald-200",
    ditolak: "bg-red-100 text-red-700 border-red-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] ?? styles.pending}`}
    >
      {status}
    </span>
  );
}

export default function PencairanDanaPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const [data, setData] = useState<UserData | null>(null);
  const [history, setHistory] = useState<DisbursementHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isTourActive, setIsTourActive] = useState(false);
  const savedStateRef = useRef<{
    data: UserData | null;
    history: DisbursementHistoryItem[];
    customAmount: string;
    metode: MetodePembayaran;
    keterangan: string;
    ttdBase64: string | null;
  } | null>(null);

  const handleTourStart = () => {
    savedStateRef.current = {
      data,
      history,
      customAmount,
      metode,
      keterangan,
      ttdBase64,
    };
    setIsTourActive(true);
    setCustomAmount("");
    setMetode("transfer");
    setKeterangan("");
    setTtdBase64(null);
  };

  const handleTourEnd = () => {
    setIsTourActive(false);
    if (savedStateRef.current) {
      setData(savedStateRef.current.data);
      setHistory(savedStateRef.current.history);
      setCustomAmount(savedStateRef.current.customAmount);
      setMetode(savedStateRef.current.metode);
      setKeterangan(savedStateRef.current.keterangan);
      setTtdBase64(savedStateRef.current.ttdBase64);
    }
  };

  // Step 1 form state
  const [customAmount, setCustomAmount] = useState("");
  const [metode, setMetode] = useState<MetodePembayaran>("transfer");
  const [keterangan, setKeterangan] = useState("");
  const [kategoriSumber, _setKategoriSumber] =
    useState<KategoriSumber>("tps-3r");
  const [ttdBase64, setTtdBase64] = useState<string | null>(null);
  const [ttdError, setTtdError] = useState("");
  const [isCompressingTtd, setIsCompressingTtd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Proof / history
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: "",
  });

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

  const loadMonthData = useCallback(
    (year: number, month: number) => {
      setLoading(true);
      Promise.all([
        getDisbursementDataForMonth(year, month),
        getDisbursementHistory(),
      ]).then(([dataRes, historyRes]) => {
        if (dataRes.success && dataRes.data) {
          const d = dataRes.data as UserData;
          setData(d);
          // Auto-set jumlah ke total kredit bulan tersebut
          setCustomAmount(d.kredit > 0 ? d.kredit.toString() : "");
        } else {
          showFeedback(
            "error",
            "Gagal Memuat",
            dataRes.message || "Gagal mengambil data saldo.",
          );
        }
        setHistory(historyRes as DisbursementHistoryItem[]);
        setLoading(false);
      });
    },
    [showFeedback],
  );

  useEffect(() => {
    loadMonthData(selectedYear, selectedMonth);
  }, [loadMonthData, selectedYear, selectedMonth]);

  const goToPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    const isCurrent =
      selectedYear === now.getFullYear() &&
      selectedMonth === now.getMonth() + 1;
    if (isCurrent) return;
    if (selectedMonth === 12) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const isCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  const handleTtdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setTtdError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setTtdError("File harus berupa gambar (JPG, PNG, WEBP).");
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
        setTtdError("Gagal membaca file.");
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

  // Step 1: validate then show confirm modal
  const handleOpenConfirm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    if (!ttdBase64) {
      setTtdError("Tanda tangan wajib diunggah sebelum mengajukan.");
      return;
    }
    setShowConfirmModal(true);
  };

  // Step 2: confirmed → submit to server
  const handleConfirmSubmit = () => {
    if (!ttdBase64) return;

    if (isTourActive) {
      document.dispatchEvent(new CustomEvent("close-tour-guide"));
      setShowConfirmModal(false);
      showFeedback(
        "success",
        "Pencairan Berhasil Diajukan! (Simulasi)",
        `Simulasi: Pengajuan pencairan dana sebesar Rp ${currentKredit.toLocaleString("id-ID")} berhasil dikirim.`,
      );
      setHistory((prev) => [
        {
          id: Date.now(),
          userId: 999,
          jumlah: currentKredit,
          metodePembayaran: metode,
          status: "pending",
          createdAt: new Date(),
          jenisBank: "BNI",
          noRekening: "123456xxx",
          buktiTransfer: null,
          buktiPembayaranId: null,
        },
        ...prev,
      ]);
      setCustomAmount("");
      setMetode("transfer");
      setKeterangan("");
      setTtdBase64(null);
      return;
    }

    const formData = new FormData();
    formData.set("jumlah", customAmount);
    formData.set("metodePembayaran", metode);
    formData.set("keterangan", keterangan);
    formData.set("ttdPenyerah", ttdBase64);
    formData.set("selectedYear", selectedYear.toString());
    formData.set("selectedMonth", selectedMonth.toString());

    startTransition(async () => {
      const res = await requestDisbursement(
        { success: false, message: "" },
        formData,
      );
      setShowConfirmModal(false);
      if (res.success) {
        showFeedback(
          "success",
          "Pencairan Berhasil Diajukan",
          res.message ?? "",
        );
        setCustomAmount("");
        setMetode("transfer");
        setKeterangan("");
        setTtdBase64(null);
        loadMonthData(selectedYear, selectedMonth);
      } else {
        if (res.errors) setErrors(res.errors);
        showFeedback(
          "error",
          "Pencairan Gagal",
          res.message || "Gagal melakukan pencairan dana.",
        );
      }
    });
  };

  const formatTanggal = (dateStr: string | Date) =>
    new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  // Derived
  const currentKredit = isTourActive ? 750000 : (data?.kredit ?? 0);
  const lastMonthKredit = isTourActive ? 0 : (data?.lastMonthKredit ?? 0);
  const isBankSetup = isTourActive
    ? true
    : !!(data?.jenisBank && data?.noRekening);
  const isCurrentMonthData = isTourActive
    ? false
    : (data?.isCurrentMonth ?? isCurrentMonth);
  const sudahDicairkan = isTourActive ? false : (data?.sudahDicairkan ?? false);
  const pencairanAktif = isTourActive ? undefined : data?.pencairanAktif;
  const dataSampah: DataSampahItem[] = isTourActive
    ? [
        { jenis: "Karton", beratKg: 45, kredit: 450000 },
        { jenis: "Etiket", beratKg: 25, kredit: 250000 },
        { jenis: "Paper Cup", beratKg: 5, kredit: 50000 },
      ]
    : ((data?.dataSampah as DataSampahItem[] | undefined) ?? []);

  const bulanLabel = `${BULAN_ID[selectedMonth - 1]} ${selectedYear}`;
  const bulanBerikutnya = `1 ${BULAN_ID[selectedMonth % 12]} ${selectedMonth === 12 ? selectedYear + 1 : selectedYear}`;

  // ── History table ──────────────────────────────────────────────────────────
  const columns: Column<DisbursementHistoryItem>[] = [
    {
      header: "Tanggal",
      render: (item) => (
        <span className="text-xs text-neutral-600">
          {formatTanggal(item.createdAt)}
        </span>
      ),
    },
    {
      header: "Metode",
      render: (item) => (
        <span
          className={`px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase ${item.metodePembayaran === "tunai" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}
        >
          {item.metodePembayaran === "tunai" ? "Tunai" : "Transfer"}
        </span>
      ),
    },
    {
      header: "Tujuan",
      render: (item) =>
        item.metodePembayaran !== "tunai" ? (
          <div>
            <div className="text-xs font-bold text-neutral-800">
              {item.jenisBank ?? "-"}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">
              {item.noRekening ?? "-"}
            </div>
          </div>
        ) : (
          <span className="text-[10px] text-neutral-400 italic">Tunai</span>
        ),
    },
    {
      header: "Jumlah",
      render: (item) => (
        <span className="text-sm font-black text-neutral-800">
          {formatRp(item.jumlah)}
        </span>
      ),
    },
    {
      header: "Status",
      render: (item) => (
        <div className="flex flex-col gap-1.5">
          <StatusBadge status={item.status} />
          {item.status === "berhasil" && (
            <div className="flex gap-2">
              {item.buktiTransfer && (
                <button
                  type="button"
                  onClick={() => setViewProofUrl(item.buktiTransfer)}
                  className="text-[10px] text-primary-600 font-bold flex items-center gap-0.5 bg-transparent border-0 cursor-pointer p-0 hover:underline"
                >
                  <Eye className="w-3 h-3" /> Bukti
                </button>
              )}
              {item.buktiPembayaranId && (
                <button
                  type="button"
                  onClick={() =>
                    item.buktiPembayaranId &&
                    handleDownloadPdf(item.buktiPembayaranId)
                  }
                  className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 bg-transparent border-0 cursor-pointer p-0 hover:underline"
                >
                  <Download className="w-3 h-3" /> Surat
                </button>
              )}
            </div>
          )}
        </div>
      ),
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

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-sm font-semibold text-neutral-500">
          Memuat data pencairan...
        </p>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12 max-w-4xl mx-auto">
      <TourGuide
        pageKey="warmindo_pencairan"
        steps={pencairanSteps}
        onStart={handleTourStart}
        onEnd={handleTourEnd}
      />

      {/* ── HEADER ── */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2.5">
          <div className="p-2 bg-primary-100 rounded-xl">
            <ArrowRightLeft className="w-5 h-5 text-primary-600" />
          </div>
          Pencairan Dana
        </h1>
        <p className="text-sm text-neutral-500 mt-1 ml-11">
          Cairkan kredit dari akumulasi setoran sampah per bulan.
        </p>
      </div>

      {/* ── KREDIT SUMMARY CARD ── */}
      <div
        id="tour-warmindo-pencairan-saldo"
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-primary-950 to-emerald-900 text-white p-6 shadow-xl"
      >
        {/* decorative blobs */}
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-6 w-40 h-40 bg-primary-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                Kredit Akumulatif
              </p>
              <p className="text-[13px] font-semibold text-white/70 mt-0.5">
                {bulanLabel}
              </p>
              <p className="text-4xl font-black mt-2 tracking-tight">
                {formatRp(currentKredit)}
              </p>
              {isCurrentMonthData && (
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg px-2.5 py-0.5 font-medium backdrop-blur-xs">
                    kredit bulan lalu:{" "}
                    <span className="font-bold text-white">
                      {formatRp(lastMonthKredit)}
                    </span>
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
                <Coins className="w-6 h-6 text-emerald-400" />
              </div>
              {/* Status Badge */}
              {isCurrentMonthData ? (
                <span className="flex items-center gap-1 text-[9px] font-bold bg-blue-400/20 text-blue-300 border border-blue-400/30 rounded-full px-2.5 py-1">
                  <Clock className="w-2.5 h-2.5" /> Berjalan
                </span>
              ) : sudahDicairkan ? (
                <span className="flex items-center gap-1 text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full px-2.5 py-1">
                  <LockKeyhole className="w-2.5 h-2.5" /> Dicairkan
                </span>
              ) : currentKredit > 0 ? (
                <span className="flex items-center gap-1 text-[9px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-full px-2.5 py-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Siap Dicairkan
                </span>
              ) : null}
            </div>
          </div>

          {/* Breakdown per jenis sampah */}
          {dataSampah.length > 0 ? (
            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-3">
                Rincian Setoran Diterima
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {dataSampah.map((item) => (
                  <div
                    key={item.jenis}
                    className="bg-white/5 hover:bg-white/10 transition-colors rounded-2xl px-3 py-2.5 border border-white/10"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Package className="w-3 h-3 text-white/40 shrink-0" />
                      <span className="text-[11px] font-semibold text-white/80 truncate">
                        {item.jenis}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] text-white/40">
                        {item.beratKg} kg
                      </span>
                      <span className="text-[11px] font-bold text-emerald-400">
                        {formatRp(item.kredit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2 text-white/40">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <p className="text-xs">
                Belum ada setoran diterima di {bulanLabel}.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── FORM CARD (period picker + rekening + form) ── */}
      <div
        id="tour-warmindo-pencairan-form"
        className="bg-white border border-neutral-200 rounded-3xl shadow-sm overflow-hidden"
      >
        {/* Period Picker — header card yang mencolok */}
        <div className="relative overflow-hidden bg-linear-to-br from-primary-900 via-primary-800 to-slate-800 px-5 py-5">
          {/* decorative */}
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <p className="text-[10px] font-bold tracking-widest text-white/50 uppercase mb-3">
            Pilih Periode Pencairan
          </p>

          <div className="flex items-center gap-3">
            {/* Prev */}
            <button
              type="button"
              onClick={goToPrevMonth}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer shrink-0 group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Label */}
            <div className="flex-1 text-center">
              <p className="text-xl font-black text-white tracking-tight">
                {bulanLabel}
              </p>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                {isCurrentMonthData ? (
                  <span className="flex items-center gap-1 text-[9px] font-bold bg-blue-400/25 text-blue-200 border border-blue-400/30 rounded-full px-2.5 py-1">
                    <Clock className="w-2.5 h-2.5" /> Sedang Berjalan
                  </span>
                ) : sudahDicairkan ? (
                  <span className="flex items-center gap-1 text-[9px] font-bold bg-amber-400/25 text-amber-200 border border-amber-400/30 rounded-full px-2.5 py-1">
                    <LockKeyhole className="w-2.5 h-2.5" /> Sudah Dicairkan
                  </span>
                ) : currentKredit > 0 ? (
                  <span className="flex items-center gap-1 text-[9px] font-bold bg-emerald-400/25 text-emerald-200 border border-emerald-400/30 rounded-full px-2.5 py-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Siap Dicairkan
                  </span>
                ) : (
                  <span className="text-[9px] text-white/40">
                    Tidak ada setoran
                  </span>
                )}
              </div>
            </div>

            {/* Next */}
            <button
              type="button"
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer shrink-0 disabled:opacity-25 disabled:cursor-not-allowed group"
            >
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Rekening info bar */}
        <div className="px-5 py-3.5 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-white rounded-lg border border-neutral-200 shrink-0">
              <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                Rekening Tujuan
              </p>
              {isBankSetup ? (
                <p className="text-xs font-bold text-neutral-700 truncate">
                  {data?.jenisBank}{" "}
                  <span className="font-mono font-normal text-neutral-500">
                    — {data?.noRekening}
                  </span>
                </p>
              ) : (
                <p className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" /> Rekening belum
                  diisi
                </p>
              )}
            </div>
          </div>
          <Link
            href="/profil/warmindo-profil"
            className="shrink-0 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap"
          >
            {isBankSetup ? "Ubah" : "Lengkapi"}
          </Link>
        </div>

        {/* Form body */}
        <div className="p-5">
          {/* ── STATE 1: Bulan berjalan ── */}
          {isCurrentMonthData ? (
            <div className="py-6 flex flex-col items-center gap-5 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Clock className="w-7 h-7 text-blue-400" />
              </div>
              <div className="max-w-sm space-y-2">
                <p className="font-bold text-neutral-800">
                  Bulan {bulanLabel} Masih Berjalan
                </p>
                <p className="text-sm text-neutral-500">
                  Pencairan baru dapat dilakukan di bulan berikutnya. Kredit
                  yang tampil adalah estimasi berjalan saat ini.
                </p>
              </div>
              {currentKredit > 0 && (
                <div className="w-full max-w-xs bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">
                    Estimasi Kredit Saat Ini
                  </p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">
                    {formatRp(currentKredit)}
                  </p>
                  <p className="text-xs text-emerald-500 mt-1.5 flex items-center justify-center gap-1">
                    <Info className="w-3 h-3" />
                    Bisa dicairkan mulai {bulanBerikutnya}
                  </p>
                </div>
              )}
            </div>
          ) : sudahDicairkan && pencairanAktif ? (
            /* ── STATE 2: Sudah dicairkan ── */
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <LockKeyhole className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Pencairan {bulanLabel} Sudah Diajukan
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Hanya satu pencairan per bulan yang diizinkan. Lihat detail
                    di bawah.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Nominal",
                    value: formatRp(pencairanAktif.jumlah),
                    bold: true,
                  },
                  {
                    label: "Metode",
                    value: pencairanAktif.metodePembayaran,
                    bold: false,
                  },
                  {
                    label: "Diajukan",
                    value: formatTanggal(pencairanAktif.createdAt),
                    bold: false,
                  },
                  {
                    label: "Status",
                    value: null,
                    status: pencairanAktif.status,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="bg-neutral-50 rounded-xl p-3 border border-neutral-100"
                  >
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      {row.label}
                    </p>
                    {row.status ? (
                      <div className="mt-1">
                        <StatusBadge status={row.status} />
                      </div>
                    ) : (
                      <p
                        className={`text-sm mt-1 ${row.bold ? "font-black text-neutral-900" : "font-semibold text-neutral-700 capitalize"}`}
                      >
                        {row.value}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Rincian Surat Bukti Pembayaran */}
              <div className="mt-6 pt-6 border-t border-neutral-100 space-y-3">
                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider block">
                  Surat Bukti Pembayaran
                </span>
                <div className="border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
                  <DisbursementLetterPreview
                    data={data}
                    customAmount={pencairanAktif.jumlah.toString()}
                    metode={pencairanAktif.metodePembayaran}
                    keterangan={pencairanAktif.keterangan || ""}
                    ttdBase64={pencairanAktif.ttdPenyerahUrl || null}
                    kategoriSumber={kategoriSumber}
                    ttdAdminBase64={pencairanAktif.ttdPenerimaUrl || null}
                  />
                </div>
              </div>
            </div>
          ) : dataSampah.length === 0 ? (
            /* ── STATE 3: Tidak ada setoran ── */
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="font-semibold text-neutral-600 text-sm">
                Tidak Ada Setoran di {bulanLabel}
              </p>
              <p className="text-xs text-neutral-400 max-w-xs">
                Pencairan hanya bisa dilakukan jika ada setoran yang berstatus
                diterima di bulan tersebut.
              </p>
            </div>
          ) : (
            /* ── STATE 4: Form aktif ── */
            <form onSubmit={handleOpenConfirm} className="space-y-5">
              {/* Metode */}
              <div>
                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider block mb-2">
                  Metode Pembayaran
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {(["transfer", "tunai"] as MetodePembayaran[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetode(m)}
                      className={`py-3 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        metode === m
                          ? "bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-600/20"
                          : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                      }`}
                    >
                      {m === "tunai" ? (
                        <Banknote className="w-4 h-4" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      <span className="capitalize">{m}</span>
                    </button>
                  ))}
                </div>
                {metode === "transfer" && !isBankSetup && (
                  <div className="mt-2.5 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Rekening bank belum diisi.{" "}
                      <Link
                        href="/profil/warmindo-profil"
                        className="font-bold underline"
                      >
                        Lengkapi sekarang.
                      </Link>
                    </p>
                  </div>
                )}
              </div>

              {/* Total Pencairan — otomatis = seluruh kredit bulan ini */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    Total Pencairan
                  </p>
                  <p className="text-2xl font-black text-emerald-800 mt-0.5 tracking-tight">
                    {formatRp(currentKredit)}
                  </p>
                  <p className="text-[10px] text-emerald-600/70 mt-1 flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    Seluruh kredit bulan {BULAN_ID[selectedMonth - 1]}{" "}
                    {selectedYear} akan dicairkan
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-2xl border border-emerald-200 shrink-0">
                  <Coins className="w-6 h-6 text-emerald-600" />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label
                  htmlFor="keterangan"
                  className="text-xs font-bold text-neutral-600 uppercase tracking-wider block mb-2"
                >
                  Keterangan{" "}
                  <span className="text-neutral-400 font-normal normal-case">
                    (opsional)
                  </span>
                </label>
                <input
                  id="keterangan"
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 border-2 border-neutral-200 text-sm focus:outline-none focus:border-primary-500 transition-colors placeholder:text-neutral-400"
                  placeholder="Catatan tambahan..."
                />
              </div>

              {/* TTD Upload */}
              <div>
                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider block mb-2">
                  Tanda Tangan <span className="text-red-500">*</span>
                </span>
                {isCompressingTtd ? (
                  <div className="h-28 rounded-xl border-2 border-dashed border-neutral-300 flex items-center justify-center gap-2 bg-neutral-50">
                    <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                    <span className="text-xs text-neutral-500">
                      Mengompresi gambar...
                    </span>
                  </div>
                ) : ttdBase64 ? (
                  <div className="relative rounded-xl border-2 border-primary-300 bg-primary-50/50 h-28 flex items-center justify-center overflow-hidden">
                    {/* biome-ignore lint/performance/noImgElement: TTD preview */}
                    <img
                      src={ttdBase64}
                      alt="Tanda Tangan"
                      className="max-h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setTtdBase64(null)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border-0 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="relative h-28 rounded-xl border-2 border-dashed border-neutral-300 hover:border-primary-400 transition-colors flex flex-col items-center justify-center gap-1.5 bg-neutral-50 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleTtdUpload}
                      className="sr-only"
                    />
                    <Camera className="w-6 h-6 text-neutral-400" />
                    <p className="text-xs font-semibold text-neutral-600">
                      Klik untuk upload foto tanda tangan
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      JPG, PNG, atau WEBP
                    </p>
                  </label>
                )}
                {(ttdError || errors.ttdPenyerah) && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">
                    {ttdError || errors.ttdPenyerah?.[0]}
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  id="tour-warmindo-pencairan-submit"
                  type="submit"
                  disabled={
                    isCompressingTtd ||
                    currentKredit <= 0 ||
                    (metode === "transfer" && !isBankSetup)
                  }
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Pratinjau & Ajukan Pencairan
                </button>
                <p className="text-center text-xs text-neutral-400 mt-2">
                  Pratinjau surat bukti pembayaran akan muncul sebelum
                  konfirmasi.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── RIWAYAT ── */}
      <div
        id="tour-warmindo-pencairan-history"
        className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-600" />
          <h2 className="text-sm font-bold text-neutral-800">
            Riwayat Pencairan Dana
          </h2>
        </div>
        <div className="p-5">
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
            searchPlaceholder="Cari bank atau rekening..."
            filters={filters}
            filterValues={filterValues}
            onFilterChange={(id, value) => {
              setFilterValues({ ...filterValues, [id]: value });
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* ── CONFIRMATION MODAL (Pratinjau Surat) ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-neutral-800">
                  Pratinjau Surat Bukti Pembayaran
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 border-0 bg-transparent cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Letter Preview - scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              <DisbursementLetterPreview
                data={data}
                customAmount={customAmount}
                metode={metode}
                keterangan={keterangan}
                ttdBase64={ttdBase64}
                kategoriSumber={kategoriSumber}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-100 shrink-0 bg-neutral-50/80">
              <div className="flex items-center gap-2 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700">
                  Pastikan data di atas sudah benar. Pencairan sebesar{" "}
                  <span className="font-bold">
                    {formatRp(Number(customAmount))}
                  </span>{" "}
                  akan diajukan ke admin untuk diproses.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl border-2 border-neutral-200 text-neutral-700 font-bold text-sm hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Periksa Lagi
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-primary-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Konfirmasi & Ajukan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BUKTI TRANSFER MODAL ── */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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
              Pencairan
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
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-700 text-white rounded-xl text-sm font-bold transition-colors border-0 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

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
