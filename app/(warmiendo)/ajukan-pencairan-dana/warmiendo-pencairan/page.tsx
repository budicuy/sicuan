"use client";

import imageCompression from "browser-image-compression";
import {
  AlertTriangle,
  ArrowRightLeft,
  Banknote,
  Camera,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getDisbursementData,
  getDisbursementHistory,
  getUserBuktiPembayaran,
  requestDisbursement,
} from "@/app/(warmiendo)/ajukan-pencairan-dana/warmiendo-pencairan/action";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/shared/DataTable";
import { DisbursementLetterPreview } from "@/app/components/shared/DisbursementLetterPreview";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { SyaratKetentuanCard } from "@/app/components/shared/SyaratKetentuanCard";

interface DisbursementHistoryItem {
  id: number;
  userId: number;
  jumlah: number;
  jenisBank: string | null;
  noRekening: string | null;
  status: string;
  metodePembayaran: string;
  buktiTransfer: string | null;
  createdAt: string | Date;
}

interface BuktiPembayaranItem {
  id: number;
  nomorDokumen: string;
  totalTagihan: number;
  periodeBulan: string;
  periodeTahun: number;
  status: string;
  createdAt: string | Date;
}

interface UserData {
  kredit: number;
  jenisBank: string;
  noRekening: string;
  alamat?: string;
  noTelepon?: string;
  idPelanggan?: string;
  dataSampah?: { jenis: string; beratKg: number; terlampir: boolean }[];
  totalBeratKg?: number;
  user: { id: number; name: string; role: string };
}

type MetodePembayaran = "tunai" | "transfer";

export default function PencairanDanaPage() {
  const [data, setData] = useState<UserData | null>(null);
  const [history, setHistory] = useState<DisbursementHistoryItem[]>([]);
  const [dokumenList, setDokumenList] = useState<BuktiPembayaranItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");
  const [metode, setMetode] = useState<MetodePembayaran>("transfer");
  const [keterangan, setKeterangan] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  // TTD upload state
  const [ttdBase64, setTtdBase64] = useState<string | null>(null);
  const [ttdError, setTtdError] = useState("");
  const [isCompressingTtd, setIsCompressingTtd] = useState(false);

  // DataTable states
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

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      getDisbursementData(),
      getDisbursementHistory(),
      getUserBuktiPembayaran(),
    ]).then(([dataRes, historyRes, dokumenRes]) => {
      if (dataRes.success && dataRes.data) {
        setData(dataRes.data as UserData);
      } else {
        showFeedback(
          "error",
          "Gagal Memuat",
          dataRes.message || "Gagal mengambil data saldo.",
        );
      }
      setHistory(historyRes as DisbursementHistoryItem[]);
      setDokumenList(dokumenRes as BuktiPembayaranItem[]);
      setLoading(false);
    });
  }, [showFeedback]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!ttdBase64) {
      setTtdError("Tanda tangan wajib diunggah sebelum mengajukan.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("metodePembayaran", metode);
    formData.set("keterangan", keterangan);
    formData.set("ttdPenyerah", ttdBase64);

    startTransition(async () => {
      const res = await requestDisbursement(
        { success: false, message: "" },
        formData,
      );
      if (res.success) {
        showFeedback("success", "Pencairan Berhasil Diajukan", res.message);
        setCustomAmount("");
        setMetode("transfer");
        setKeterangan("");
        setTtdBase64(null);
        loadData();
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

  const formatTanggal = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const setAmount = (val: number) => setCustomAmount(val.toString());

  const getMetodeBadge = (m: string) => {
    if (m === "tunai")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  const columns: Column<DisbursementHistoryItem>[] = [
    {
      header: "Tanggal & Waktu",
      render: (item) => formatTanggal(item.createdAt),
    },
    {
      header: "Metode",
      render: (item) => (
        <span
          className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full border uppercase tracking-wider ${getMetodeBadge(item.metodePembayaran)}`}
        >
          {item.metodePembayaran === "tunai" ? "Tunai" : "Transfer"}
        </span>
      ),
    },
    {
      header: "Tujuan Transfer",
      render: (item) => (
        <div>
          {item.metodePembayaran !== "tunai" ? (
            <>
              <div className="font-bold text-neutral-800">
                {item.jenisBank ?? "-"}
              </div>
              <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                {item.noRekening ?? "-"}
              </div>
            </>
          ) : (
            <span className="text-[10px] text-neutral-500 italic">
              Pencairan Tunai
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Jumlah Pencairan",
      render: (item) => (
        <span className="font-bold text-neutral-800 text-sm">
          Rp {item.jumlah.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      header: "Status",
      render: (item) => (
        <div className="flex flex-col items-start gap-1">
          <span
            className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full border uppercase tracking-wider ${
              item.status === "berhasil"
                ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                : item.status === "ditolak"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {item.status}
          </span>
          {item.status === "berhasil" && item.buktiTransfer && (
            <button
              type="button"
              onClick={() => setViewProofUrl(item.buktiTransfer)}
              className="text-[10px] text-primary-600 hover:text-primary-750 font-bold flex items-center gap-1 border-0 bg-transparent cursor-pointer p-0 mt-0.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Lihat Bukti
            </button>
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
    const matchesSearch =
      (item.jenisBank ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (item.noRekening ?? "").includes(search) ||
      item.jumlah.toString().includes(search);
    const matchesStatus =
      !filterValues.status || item.status === filterValues.status;
    return matchesSearch && matchesStatus;
  });

  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-sm font-semibold text-neutral-500">
          Memuat info pencairan dana...
        </p>
      </div>
    );
  }

  const presets = [10000, 25000, 50000, 100000, 200000, 500000];
  const currentKredit = data?.kredit ?? 0;
  const isBankSetup = !!(data?.jenisBank && data?.noRekening);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-primary-100/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div>
          <h1 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary-600" />
            Pencairan Dana
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Cairkan reward saldo kredit ke rekening bank terdaftar atau tunai.
          </p>
        </div>
      </div>

      {/* Row 1: Balance Card + Syarat & Ketentuan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balance Card */}
        <div className="md:col-span-2 relative overflow-hidden bg-linear-to-tr from-primary-950 via-primary-900 to-emerald-850 text-white rounded-2xl p-5 shadow-md border border-white/5">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[10px] font-bold tracking-widest text-primary-300 uppercase block">
              SALDO REWARD UTAMA
            </span>
            <div className="flex justify-between items-end mt-3">
              <div>
                <span className="text-xs text-primary-200">
                  Total Kredit Tersedia
                </span>
                <h2 className="text-3xl font-black tracking-tight mt-0.5">
                  Rp {currentKredit.toLocaleString("id-ID")}
                </h2>
              </div>
              <Coins className="w-8 h-8 text-emerald-400 shrink-0 mb-1" />
            </div>
            <div className="pt-3 mt-3 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
              <div>
                <span className="text-primary-300 block text-[9px] uppercase font-bold tracking-wider">
                  Rekening Tujuan
                </span>
                {isBankSetup ? (
                  <span className="font-semibold text-white mt-0.5 block">
                    {data?.jenisBank} — {data?.noRekening}
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Rekening belum diset
                  </span>
                )}
              </div>
              <Link
                href="/profil/warmiendo-profil"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all font-bold text-[10px] uppercase text-white tracking-wider border border-white/10 flex items-center gap-1.5 shrink-0"
              >
                <CreditCard className="w-3.5 h-3.5" />
                {isBankSetup ? "Ubah Rekening" : "Lengkapi Profil"}
              </Link>
            </div>
          </div>
        </div>

        <SyaratKetentuanCard />
      </div>

      {/* Row 2: Form + Pratinjau Surat side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Formulir Pencairan */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 mb-5">
            <ArrowRightLeft className="w-4.5 h-4.5 text-primary-600" />
            <h3 className="text-sm font-bold text-neutral-800">
              Formulir Pencairan
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Metode Pembayaran */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                Metode Pembayaran
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(["tunai", "transfer"] as MetodePembayaran[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMetode(m)}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      metode === m
                        ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                        : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {m === "tunai" ? (
                      <Banknote className="w-3.5 h-3.5" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5" />
                    )}
                    <span className="capitalize">{m}</span>
                  </button>
                ))}
              </div>
              {metode !== "tunai" && !isBankSetup && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <span className="font-bold block">Rekening Diperlukan</span>
                    <p>Lengkapi info rekening bank di profil untuk transfer.</p>
                    <Link
                      href="/profil/warmiendo-profil"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-700 hover:text-primary-800 pt-1"
                    >
                      Atur Rekening <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                Jumlah Pencairan (Rp)
              </span>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center font-bold text-neutral-400 text-sm">
                  Rp
                </span>
                <input
                  id="jumlah"
                  name="jumlah"
                  type="number"
                  required
                  min={10000}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all text-neutral-800"
                  placeholder="Masukkan nominal pencairan"
                />
              </div>
              {errors.jumlah && (
                <p className="text-[11px] font-semibold text-red-600">
                  {errors.jumlah[0]}
                </p>
              )}
              <p className="text-[10px] text-neutral-400">
                Minimal pencairan adalah Rp 10.000.
              </p>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Pilih Nominal Instan
              </span>
              <div className="grid grid-cols-6 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    disabled={preset > currentKredit}
                    className={`py-2 px-1 text-center font-bold text-xs rounded-xl border transition-all cursor-pointer ${
                      customAmount === preset.toString()
                        ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                        : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                  >
                    {preset >= 1000 ? `${preset / 1000}K` : preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Keterangan */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                Keterangan (opsional)
              </span>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600 transition-all"
                placeholder="Catatan tambahan..."
              />
            </div>

            {/* TTD Upload */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                Tanda Tangan Anda (Wajib)
              </span>
              <p className="text-[10px] text-neutral-400">
                Upload foto tanda tangan sebagai bukti persetujuan pencairan.
              </p>
              {isCompressingTtd ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 h-28 flex items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                  <p className="text-xs text-neutral-500">Mengompresi...</p>
                </div>
              ) : ttdBase64 ? (
                <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50 h-28 flex items-center justify-center">
                  {/* biome-ignore lint/performance/noImgElement: TTD preview */}
                  <img
                    src={ttdBase64}
                    alt="Tanda Tangan"
                    className="max-h-28 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setTtdBase64(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white border-0 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative rounded-2xl border-2 border-dashed border-neutral-300 hover:border-primary-500/50 transition-all p-5 text-center bg-neutral-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTtdUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1.5 text-neutral-500">
                    <div className="p-2.5 bg-white rounded-full w-fit mx-auto shadow-xs border border-neutral-100">
                      <Camera className="w-5 h-5 text-neutral-400" />
                    </div>
                    <p className="text-xs font-bold text-neutral-700">
                      Upload Foto Tanda Tangan
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      JPG, PNG, atau WEBP
                    </p>
                  </div>
                </div>
              )}
              {(ttdError || errors.ttdPenyerah) && (
                <p className="text-[11px] font-semibold text-red-600">
                  {ttdError || errors.ttdPenyerah?.[0]}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-neutral-100 flex justify-end">
              <button
                type="submit"
                disabled={
                  isPending ||
                  isCompressingTtd ||
                  !customAmount ||
                  Number(customAmount) > currentKredit ||
                  Number(customAmount) < 10000 ||
                  (metode !== "tunai" && !isBankSetup)
                }
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wider"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ajukan Pencairan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <DisbursementLetterPreview
          data={data}
          customAmount={customAmount}
          metode={metode}
          keterangan={keterangan}
          ttdBase64={ttdBase64}
        />
      </div>

      {/* Row 3: Dokumen PDF (jika ada) */}
      {dokumenList.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
          <h4 className="font-bold text-sm text-neutral-800 flex items-center gap-1.5 pb-3 border-b border-neutral-100 mb-4">
            <FileText className="w-4.5 h-4.5 text-primary-600" />
            Dokumen Bukti Pembayaran
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dokumenList.slice(0, 6).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-neutral-800 truncate">
                    {doc.nomorDokumen}
                  </p>
                  <p className="text-[9px] text-neutral-400 mt-0.5">
                    {doc.periodeBulan} {doc.periodeTahun}
                  </p>
                </div>
                <a
                  href={`/api/bukti-pembayaran/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 p-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-600 transition-all border-0 shrink-0"
                  title="Download PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 4: Riwayat Pencairan */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 mb-5">
          <Clock className="w-4.5 h-4.5 text-primary-600" />
          <h3 className="text-sm font-bold text-neutral-800">
            Riwayat Pencairan Dana
          </h3>
        </div>
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
          searchPlaceholder="Cari tujuan bank atau nomor rekening..."
          filters={filters}
          filterValues={filterValues}
          onFilterChange={(filterId, value) => {
            setFilterValues({ ...filterValues, [filterId]: value });
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Bukti Transfer Modal */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden p-6 relative animate-in zoom-in-95 duration-200 space-y-4">
            <button
              type="button"
              onClick={() => setViewProofUrl(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all border-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-neutral-800 pb-2 border-b border-neutral-100 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary-600" />
              Bukti Foto Transfer Pencairan
            </h3>
            <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50 max-h-96 flex items-center justify-center">
              {/* biome-ignore lint/performance/noImgElement: R2 remote proof image preview */}
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
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all border-0 cursor-pointer"
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
