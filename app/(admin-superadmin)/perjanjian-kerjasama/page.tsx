"use client";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileClock,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Store,
  Truck,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  calculateOneMonthExpiry,
  createSuratPerjanjian,
  getMitraOptions,
  getSuratHistoryByMitra,
  getSuratPerjanjianList,
  renewSuratPerjanjian,
} from "@/app/(admin-superadmin)/perjanjian-kerjasama/action";
import { AnimatedCounter } from "@/app/components/shared/AnimatedCounter";
import { type Column, DataTable } from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { FormModal } from "@/app/components/shared/FormModal";
import { TourGuide } from "@/app/components/shared/TourGuide";
import type { SuratPerjanjianItem, SuratPerjanjianSummary } from "@/app/types";

const tourSteps = [
  {
    element: "#tour-pks-header",
    popover: {
      title: "1. Surat Perjanjian Kerja Sama (SPK)",
      description:
        "Portal manajemen surat perjanjian kerja sama resmi dengan seluruh mitra. Dokumen berlaku selama 1 bulan dan dapat diperpanjang secara berkala.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-pks-summary",
    popover: {
      title: "2. Ringkasan Status Surat",
      description:
        "Pantau jumlah surat yang aktif, surat yang sudah lewat masa berlaku 1 bulan (expired), jumlah mitra yang bekerja sama, dan arsip riwayat surat lama.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-pks-tabs",
    popover: {
      title: "3. Filter Status & Kategori",
      description:
        "Gunakan tab filter ini untuk melihat surat berdasarkan status masa berlakunya atau berdasarkan jenis mitranya (Bank Sampah atau Warmindo).",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-pks-table",
    popover: {
      title: "4. Tabel Data Surat & Aksi",
      description:
        "Lihat masa berlaku, unduh berkas PDF asli, lakukan perpanjangan surat dengan mengunggah surat baru, atau periksa riwayat arsip kerja sama terdahulu.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-pks-btn-add",
    popover: {
      title: "5. Terbitkan Surat Baru",
      description:
        "Klik tombol ini untuk membuat dan mengunggah berkas surat perjanjian kerja sama baru dengan mitra.",
      side: "bottom" as const,
    },
  },
];

export default function PerjanjianKerjasamaPage() {
  const [data, setData] = useState<SuratPerjanjianItem[]>([]);
  const [summary, setSummary] = useState<SuratPerjanjianSummary>({
    totalAktif: 0,
    totalExpired: 0,
    totalDiarsipkan: 0,
    totalMitra: 0,
  });
  const [_loading, setLoading] = useState(true);

  // Filter States
  const [tabFilter, setTabFilter] = useState<
    "semua" | "aktif" | "expired" | "bank-sampah" | "warmindo" | "diarsipkan"
  >("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedSuratForRenew, setSelectedSuratForRenew] =
    useState<SuratPerjanjianItem | null>(null);
  const [historyMitra, setHistoryMitra] = useState<{
    userId: number;
    namaMitra: string;
    items: SuratPerjanjianItem[];
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Mitra Options for Select
  const [mitraOptions, setMitraOptions] = useState<
    Awaited<ReturnType<typeof getMitraOptions>>
  >([]);

  // Form States (Create)
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [nomorSurat, setNomorSurat] = useState("");
  const [judul, setJudul] = useState(
    "Perjanjian Kerja Sama Pengelolaan Sampah Anorganik",
  );
  const [tanggalMulai, setTanggalMulai] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [tanggalBerakhirPreview, setTanggalBerakhirPreview] = useState("");
  const [catatan, setCatatan] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string>("");

  // Transition & Feedback
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({ isOpen: false, type: "success", title: "", message: "" });

  const showFeedback = (
    type: "success" | "error",
    title: string,
    message: string,
  ) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  // Hitung preview tanggal berakhir 1 bulan
  useEffect(() => {
    if (tanggalMulai) {
      calculateOneMonthExpiry(tanggalMulai).then(setTanggalBerakhirPreview);
    }
  }, [tanggalMulai]);

  const loadData = useCallback(() => {
    setLoading(true);
    let statusParam: string | undefined;
    let kategoriParam: string | undefined;

    if (tabFilter === "aktif") statusParam = "aktif";
    else if (tabFilter === "expired") statusParam = "expired";
    else if (tabFilter === "diarsipkan") statusParam = "diarsipkan";
    else if (tabFilter === "bank-sampah") kategoriParam = "bank-sampah";
    else if (tabFilter === "warmindo") kategoriParam = "warmindo";

    getSuratPerjanjianList({
      search: searchQuery,
      status: statusParam,
      kategoriMitra: kategoriParam,
      page: 1,
      limit: 100,
    }).then((res) => {
      setData(res.data);
      setSummary(res.summary);
      setLoading(false);
    });
  }, [tabFilter, searchQuery]);

  useEffect(() => {
    loadData();
    getMitraOptions().then(setMitraOptions);
  }, [loadData]);

  // Handle PDF file selection
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setFormError("Hanya file berformat PDF (.pdf) yang diperbolehkan.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFormError("Ukuran file PDF maksimal adalah 15 MB.");
      return;
    }

    setPdfFile(file);
    setFormError("");

    const reader = new FileReader();
    reader.onloadend = () => {
      setPdfBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Reset Form
  const resetForm = () => {
    setSelectedUserId("");
    setNomorSurat("");
    setJudul("Perjanjian Kerja Sama Pengelolaan Sampah Anorganik");
    setTanggalMulai(new Date().toISOString().split("T")[0]);
    setCatatan("");
    setPdfFile(null);
    setPdfBase64("");
    setFormError("");
  };

  // Open Create Modal
  const handleOpenAddModal = () => {
    resetForm();
    // Generate nomor surat default
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const rand = Math.floor(100 + Math.random() * 900);
    setNomorSurat(`SPK/INDF/${year}${month}/${rand}`);
    setIsAddModalOpen(true);
  };

  // Open Renew Modal
  const handleOpenRenewModal = (item: SuratPerjanjianItem) => {
    setSelectedSuratForRenew(item);
    setFormError("");
    setTanggalMulai(new Date().toISOString().split("T")[0]);
    setPdfFile(null);
    setPdfBase64("");
    setCatatan("");
    setJudul(`Perpanjangan: ${item.judul}`);

    // Generate nomor perpanjangan baru
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const rand = Math.floor(100 + Math.random() * 900);
    setNomorSurat(`SPK-EXT/INDF/${year}${month}/${rand}`);

    setIsRenewModalOpen(true);
  };

  // Open History Modal
  const handleOpenHistoryModal = async (item: SuratPerjanjianItem) => {
    setLoadingHistory(true);
    setIsHistoryModalOpen(true);
    const historyList = await getSuratHistoryByMitra(item.userId);
    setHistoryMitra({
      userId: item.userId,
      namaMitra: item.mitra?.name || "Mitra",
      items: historyList,
    });
    setLoadingHistory(false);
  };

  // Submit Create
  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUserId || !nomorSurat || !tanggalMulai || !pdfBase64) {
      setFormError("Pastikan seluruh kolom bertanda bintang (*) telah diisi.");
      return;
    }

    const formData = new FormData();
    formData.append("userId", String(selectedUserId));
    formData.append("nomorSurat", nomorSurat);
    formData.append("judul", judul);
    formData.append("tanggalMulai", tanggalMulai);
    formData.append("catatan", catatan);
    formData.append("pdfBase64", pdfBase64);
    formData.append("fileName", pdfFile?.name || "dokumen-spk.pdf");

    startTransition(async () => {
      const res = await createSuratPerjanjian({ success: false }, formData);
      if (res.success) {
        setIsAddModalOpen(false);
        showFeedback(
          "success",
          "Surat Berhasil Diterbitkan!",
          res.message || "Surat Perjanjian Kerja Sama berhasil disimpan.",
        );
        loadData();
      } else {
        const msg =
          res.errors?._form?.[0] ||
          res.errors?.nomorSurat?.[0] ||
          "Gagal menerbitkan surat perjanjian.";
        setFormError(msg);
      }
    });
  };

  // Submit Renew
  const handleRenewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSuratForRenew || !nomorSurat || !tanggalMulai || !pdfBase64) {
      setFormError("Pastikan nomor surat baru dan file PDF telah diunggah.");
      return;
    }

    const formData = new FormData();
    formData.append("suratLamaId", String(selectedSuratForRenew.id));
    formData.append("nomorSurat", nomorSurat);
    formData.append("judul", judul);
    formData.append("tanggalMulai", tanggalMulai);
    formData.append("catatan", catatan);
    formData.append("pdfBase64", pdfBase64);
    formData.append("fileName", pdfFile?.name || "perpanjangan-spk.pdf");

    startTransition(async () => {
      const res = await renewSuratPerjanjian({ success: false }, formData);
      if (res.success) {
        setIsRenewModalOpen(false);
        showFeedback(
          "success",
          "Perpanjangan Berhasil!",
          res.message ||
            "Surat lama telah diarsipkan dan surat baru telah aktif.",
        );
        loadData();
      } else {
        const msg =
          res.errors?._form?.[0] ||
          res.errors?.nomorSurat?.[0] ||
          "Gagal memproses perpanjangan surat.";
        setFormError(msg);
      }
    });
  };

  // Table Columns
  const columns: Column<SuratPerjanjianItem>[] = [
    {
      header: "Mitra Pengelola",
      render: (row) => {
        const isBS =
          row.kategoriMitra === "bank-sampah" ||
          row.kategoriMitra === "bank-sampah-b";
        return (
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isBS
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-amber-50 text-amber-600 border border-amber-200"
              }`}
            >
              {row.kategoriMitra === "bank-sampah-b" ? (
                <Truck className="w-4.5 h-4.5" />
              ) : isBS ? (
                <Building2 className="w-4.5 h-4.5" />
              ) : (
                <Store className="w-4.5 h-4.5" />
              )}
            </div>
            <div>
              <span className="font-bold text-neutral-900 text-xs sm:text-sm block">
                {row.mitra?.name || "Mitra Pengelola"}
              </span>
              <span className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                <span
                  className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                    row.kategoriMitra === "bank-sampah-b"
                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                      : isBS
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {row.kategoriMitra === "bank-sampah-b"
                    ? "Bank Sampah (Tipe B)"
                    : isBS
                      ? "Bank Sampah"
                      : "Warmindo"}
                </span>
                {row.mitra?.alamat && <span>• {row.mitra.alamat}</span>}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Nomor & Judul Surat",
      sortKey: "nomorSurat",
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-bold text-neutral-800 block">
            {row.nomorSurat}
          </span>
          <span
            className="text-xs text-neutral-600 line-clamp-1 max-w-xs"
            title={row.judul}
          >
            {row.judul}
          </span>
        </div>
      ),
    },
    {
      header: "Masa Berlaku (1 Bulan)",
      sortKey: "tanggalBerakhir",
      render: (row) => {
        const startStr = new Date(row.tanggalMulai).toLocaleDateString(
          "id-ID",
          { day: "numeric", month: "short", year: "numeric" },
        );
        const endStr = new Date(row.tanggalBerakhir).toLocaleDateString(
          "id-ID",
          { day: "numeric", month: "short", year: "numeric" },
        );

        return (
          <div className="text-xs space-y-1">
            <span className="font-medium text-neutral-800 block">
              {startStr} &mdash; <strong>{endStr}</strong>
            </span>
            {row.status === "diarsipkan" ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">
                <History className="w-3 h-3" />
                Diarsipkan (Telah Diperpanjang)
              </span>
            ) : row.status === "expired" ||
              (row.sisaHari && row.sisaHari < 0) ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                Lewat {Math.abs(row.sisaHari ?? 0)} hari (Butuh Perpanjangan)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Clock className="w-3 h-3 text-emerald-600" />
                Sisa {row.sisaHari} hari lagi
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Status",
      sortKey: "status",
      render: (row) => {
        if (row.status === "diarsipkan") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
              <History className="w-3.5 h-3.5" />
              Diarsipkan
            </span>
          );
        }
        if (row.status === "expired") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
              <XCircle className="w-3.5 h-3.5 text-red-600" />
              Expired
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Aktif
          </span>
        );
      },
    },
    {
      header: "Berkas PDF",
      render: (row) => (
        <div className="flex items-center gap-2">
          <a
            href={row.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={row.fileName}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-50 hover:bg-emerald-50 text-neutral-700 hover:text-emerald-700 text-xs font-bold border border-neutral-200 hover:border-emerald-200 transition-colors cursor-pointer"
            title="Unduh / Pratinjau Dokumen PDF"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>PDF</span>
          </a>
          {row.fileSize ? (
            <span className="text-[10px] text-neutral-400">
              {Math.round(row.fileSize / 1024)} KB
            </span>
          ) : null}
        </div>
      ),
    },
    {
      header: "Aksi",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.status !== "diarsipkan" && (
            <button
              type="button"
              onClick={() => handleOpenRenewModal(row)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Perpanjang Surat 1 Bulan ke Depan"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Perpanjang</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenHistoryModal(row)}
            className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
            title="Lihat Riwayat Arsip SPK Mitra Ini"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <TourGuide steps={tourSteps} />

      {/* Header Banner */}
      <div
        id="tour-pks-header"
        className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl"
      >
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Manajemen Kerja Sama Mitra</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Surat Perjanjian Kerja Sama (SPK)
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-xl">
              Kelola dan pantau seluruh dokumen surat perjanjian kerja sama
              dengan mitra. Pastikan masa berlaku surat selalu aktif dan
              diperbarui secara berkala.
            </p>
          </div>

          <button
            id="tour-pks-btn-add"
            type="button"
            onClick={handleOpenAddModal}
            className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Terbitkan SPK Baru</span>
          </button>
        </div>
      </div>

      {/* Warning Banner: Jika ada surat expired / lewat 1 bulan */}
      {summary.totalExpired > 0 && (
        <div
          id="tour-pks-warning"
          className="p-5 rounded-3xl bg-red-50 border-2 border-red-200/80 text-red-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-black text-red-900 flex items-center gap-2">
                <span>Peringatan: Masa Berlaku SPK Berakhir!</span>
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold">
                  {summary.totalExpired} Surat Expired
                </span>
              </h3>
              <p className="text-xs text-red-700/90 mt-0.5">
                Terdapat <strong>{summary.totalExpired} mitra</strong> yang masa
                berlaku surat perjanjian kerja samanya telah melewati 1 bulan.
                Silakan lakukan perpanjangan dengan mengunggah berkas surat
                baru.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTabFilter("expired")}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
          >
            Lihat Surat Expired &rarr;
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div
        id="tour-pks-summary"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              SPK Aktif (1 Bulan)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900">
              <AnimatedCounter value={summary.totalAktif} />
            </span>
            <span className="text-xs font-bold text-emerald-600">Surat</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Masih dalam masa berlaku
          </p>
        </div>

        <div
          className={`rounded-2xl p-5 border shadow-xs transition-all ${
            summary.totalExpired > 0
              ? "bg-red-50/50 border-red-200"
              : "bg-white border-neutral-200/80"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Perlu Perpanjangan
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                summary.totalExpired > 0
                  ? "bg-red-100 text-red-600 border border-red-200"
                  : "bg-neutral-50 text-neutral-400 border border-neutral-200"
              }`}
            >
              <FileClock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                summary.totalExpired > 0 ? "text-red-600" : "text-neutral-900"
              }`}
            >
              <AnimatedCounter value={summary.totalExpired} />
            </span>
            <span
              className={`text-xs font-bold ${
                summary.totalExpired > 0 ? "text-red-600" : "text-neutral-500"
              }`}
            >
              Expired
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Lewat dari masa 1 bulan
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Mitra Terikat Kerja Sama
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900">
              <AnimatedCounter value={summary.totalMitra} />
            </span>
            <span className="text-xs font-bold text-blue-600">Mitra</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Bank Sampah &amp; Warmindo
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Total Arsip Lama
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900">
              <AnimatedCounter value={summary.totalDiarsipkan} />
            </span>
            <span className="text-xs font-bold text-purple-600">Dokumen</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Tersimpan aman di Cloud
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        id="tour-pks-tabs"
        className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-neutral-200"
      >
        {[
          { id: "semua", label: "Semua Surat" },
          { id: "aktif", label: "Aktif (Masih Berlaku)" },
          {
            id: "expired",
            label: "Perlu Perpanjangan / Expired",
            badge: summary.totalExpired,
          },
          { id: "bank-sampah", label: "Bank Sampah" },
          { id: "warmindo", label: "Warmindo" },
          { id: "diarsipkan", label: "Arsip / Riwayat Lama" },
        ].map((tab) => {
          const isActive = tabFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setTabFilter(
                  tab.id as
                    | "semua"
                    | "aktif"
                    | "expired"
                    | "bank-sampah"
                    | "warmindo"
                    | "diarsipkan",
                )
              }
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold animate-pulse">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Table Section */}
      <div
        id="tour-pks-table"
        className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-neutral-900">
              Daftar Surat Perjanjian Kerja Sama
            </h2>
            <p className="text-xs text-neutral-500">
              Menampilkan {data.length} berkas surat perjanjian kerja sama
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data}
          searchPlaceholder="Cari nomor surat, nama mitra, perihal..."
          search={searchQuery}
          onSearchChange={setSearchQuery}
          currentPage={page}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          totalItems={data.length}
        />
      </div>

      {/* Modal Terbitkan SPK Baru */}
      {isAddModalOpen && (
        <FormModal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          title="Terbitkan Surat Perjanjian Baru (SPK)"
          onSubmit={handleCreateSubmit}
          isPending={isPending}
          globalError={formError}
          submitLabel={isPending ? "Menyimpan Dokumen..." : "Terbitkan SPK"}
        >
          <div className="space-y-4 pt-1">
            {/* Pilihan Mitra */}
            <div className="space-y-1">
              <label
                htmlFor="selectMitra"
                className="text-xs font-bold text-neutral-700 block"
              >
                Pilih Mitra (Bank Sampah / Warmindo){" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                id="selectMitra"
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
              >
                <option value="">-- Pilih Mitra Pengelola --</option>
                {mitraOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (
                    {m.role === "bank-sampah-b"
                      ? "Bank Sampah Tipe B"
                      : m.role === "bank-sampah"
                        ? "Bank Sampah Tipe A"
                        : "Warmindo"}
                    ) {m.alamat ? `- ${m.alamat}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Nomor Surat & Judul */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="nomorSurat"
                  className="text-xs font-bold text-neutral-700 block"
                >
                  Nomor Surat SPK <span className="text-red-500">*</span>
                </label>
                <input
                  id="nomorSurat"
                  type="text"
                  required
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                  placeholder="Contoh: SPK/INDF/2026/001"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="tanggalMulai"
                  className="text-xs font-bold text-neutral-700 block"
                >
                  Tanggal Mulai Berlaku <span className="text-red-500">*</span>
                </label>
                <input
                  id="tanggalMulai"
                  type="date"
                  required
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Info Masa Berlaku 1 Bulan */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                <Clock className="w-4 h-4 text-emerald-600" />
                Masa Berlaku Otomatis 1 Bulan:
              </span>
              <p className="text-[11px] text-emerald-700">
                Surat berlaku mulai{" "}
                <strong>
                  {new Date(tanggalMulai).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>{" "}
                sampai dengan{" "}
                <strong>
                  {tanggalBerakhirPreview
                    ? new Date(tanggalBerakhirPreview).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )
                    : "1 bulan ke depan"}
                </strong>
                . Sistem akan otomatis memberikan peringatan perpanjangan saat
                mendekati atau melewati tanggal berakhir.
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="judul"
                className="text-xs font-bold text-neutral-700 block"
              >
                Perihal / Judul Kerja Sama{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="judul"
                type="text"
                required
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Perjanjian Kerja Sama..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Upload File PDF */}
            <div className="space-y-1.5">
              <label
                htmlFor="filePdfInput"
                className="text-xs font-bold text-neutral-700 block"
              >
                Unggah Dokumen Surat (Format PDF){" "}
                <span className="text-red-500">*</span>
              </label>
              <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-emerald-500 bg-neutral-50 hover:bg-emerald-50/40 cursor-pointer transition-colors text-center group">
                <Upload className="w-6 h-6 text-neutral-400 group-hover:text-emerald-600 mb-1.5" />
                <span className="text-xs font-bold text-neutral-800">
                  {pdfFile ? pdfFile.name : "Klik untuk Memilih File PDF"}
                </span>
                <span className="text-[10px] text-neutral-400 mt-0.5">
                  {pdfFile
                    ? `${Math.round(pdfFile.size / 1024)} KB`
                    : "Dokumen resmi berekstensi .pdf (Maks. 15MB)"}
                </span>
                <input
                  id="filePdfInput"
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={handlePdfChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="catatan"
                className="text-xs font-bold text-neutral-700 block"
              >
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                id="catatan"
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Kesepakatan target jemput 500 kg per bulan."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
        </FormModal>
      )}

      {/* Modal Perpanjang SPK (Renew) */}
      {isRenewModalOpen && selectedSuratForRenew && (
        <FormModal
          isOpen={true}
          onClose={() => setIsRenewModalOpen(false)}
          title={`Perpanjang SPK: ${selectedSuratForRenew.mitra?.name}`}
          onSubmit={handleRenewSubmit}
          isPending={isPending}
          globalError={formError}
          submitLabel={
            isPending
              ? "Memproses Perpanjangan..."
              : "Perpanjang & Arsipkan Lama"
          }
        >
          <div className="space-y-4 pt-1">
            {/* Box Surat Lama yang akan diarsipkan */}
            <div className="p-3.5 rounded-2xl bg-neutral-100 border border-neutral-200 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                Surat yang Digantikan (Otomatis Diarsipkan):
              </span>
              <span className="font-mono font-bold text-neutral-900 block">
                {selectedSuratForRenew.nomorSurat}
              </span>
              <span className="text-neutral-600 block">
                {selectedSuratForRenew.judul} &bull; Periode:{" "}
                {new Date(
                  selectedSuratForRenew.tanggalMulai,
                ).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })}{" "}
                -{" "}
                {new Date(
                  selectedSuratForRenew.tanggalBerakhir,
                ).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Nomor Surat Baru */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="nomorSuratBaru"
                  className="text-xs font-bold text-neutral-700 block"
                >
                  Nomor Surat Baru <span className="text-red-500">*</span>
                </label>
                <input
                  id="nomorSuratBaru"
                  type="text"
                  required
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                  placeholder="Nomor surat perpanjangan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="tanggalMulaiBaru"
                  className="text-xs font-bold text-neutral-700 block"
                >
                  Tanggal Mulai Periode Baru{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="tanggalMulaiBaru"
                  type="date"
                  required
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Info Berakhir 1 Bulan Baru */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                <Clock className="w-4 h-4 text-emerald-600" />
                Masa Berlaku Perpanjangan (1 Bulan):
              </span>
              <p className="text-[11px] text-emerald-700">
                Surat baru ini akan berlaku s.d.{" "}
                <strong>
                  {tanggalBerakhirPreview
                    ? new Date(tanggalBerakhirPreview).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )
                    : "1 bulan ke depan"}
                </strong>
                . Surat lama akan berstatus <em>&apos;Diarsipkan&apos;</em> dan
                tetap tersimpan utuh di riwayat.
              </p>
            </div>

            {/* Upload PDF Baru */}
            <div className="space-y-1.5">
              <label
                htmlFor="filePdfRenewInput"
                className="text-xs font-bold text-neutral-700 block"
              >
                Unggah Dokumen Surat Baru (Format PDF){" "}
                <span className="text-red-500">*</span>
              </label>
              <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-emerald-500 bg-neutral-50 hover:bg-emerald-50/40 cursor-pointer transition-colors text-center group">
                <Upload className="w-6 h-6 text-neutral-400 group-hover:text-emerald-600 mb-1.5" />
                <span className="text-xs font-bold text-neutral-800">
                  {pdfFile
                    ? pdfFile.name
                    : "Klik untuk Mengunggah Dokumen PDF Baru"}
                </span>
                <span className="text-[10px] text-neutral-400 mt-0.5">
                  {pdfFile
                    ? `${Math.round(pdfFile.size / 1024)} KB`
                    : "Maksimal 15 MB"}
                </span>
                <input
                  id="filePdfRenewInput"
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={handlePdfChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="catatanRenew"
                className="text-xs font-bold text-neutral-700 block"
              >
                Catatan Perpanjangan (Opsional)
              </label>
              <input
                id="catatanRenew"
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Perpanjangan MoU periode ke-2"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
        </FormModal>
      )}

      {/* Modal Riwayat Arsip SPK Mitra */}
      {isHistoryModalOpen && historyMitra && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 flex items-center justify-between border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">
                    Riwayat Arsip SPK: {historyMitra.namaMitra}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Daftar seluruh surat kerja sama yang pernah diterbitkan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingHistory ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                  Memuat riwayat arsip...
                </div>
              ) : historyMitra.items.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  Belum ada dokumen SPK sebelumnya.
                </div>
              ) : (
                <div className="relative border-l-2 border-neutral-200 ml-4 pl-6 space-y-6">
                  {historyMitra.items.map((item, _idx) => (
                    <div key={item.id} className="relative group">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white ${
                          item.status === "aktif"
                            ? "border-emerald-500 bg-emerald-500"
                            : item.status === "expired"
                              ? "border-red-500 bg-red-500"
                              : "border-neutral-400"
                        }`}
                      />
                      <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 hover:bg-white transition-all space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-neutral-900">
                            {item.nomorSurat}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === "aktif"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : item.status === "expired"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-neutral-200 text-neutral-700"
                            }`}
                          >
                            {item.status === "aktif"
                              ? "Surat Aktif"
                              : item.status === "expired"
                                ? "Expired"
                                : "Diarsipkan"}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-700 font-medium">
                          {item.judul}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200/60 text-[11px] text-neutral-500">
                          <span>
                            Berlaku:{" "}
                            {new Date(item.tanggalMulai).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}{" "}
                            &mdash;{" "}
                            {new Date(item.tanggalBerakhir).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={item.fileName}
                            className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh PDF</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback((f) => ({ ...f, isOpen: false }))}
      />
    </div>
  );
}
