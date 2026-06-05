"use client";

import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  ExternalLink,
  Eye,
  HelpCircle,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  type Column,
  DataTable,
  type TableFilter,
} from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import {
  getDisbursementData,
  getDisbursementHistory,
  requestDisbursement,
} from "./action";

interface DisbursementHistoryItem {
  id: number;
  userId: number;
  jumlah: number;
  jenisBank: string;
  noRekening: string;
  status: string;
  buktiTransfer: string | null;
  createdAt: string | Date;
}

interface UserData {
  kredit: number;
  jenisBank: string;
  noRekening: string;
  user: {
    name: string;
    role: string;
  };
}

export default function PencairanDanaPage() {
  const [data, setData] = useState<UserData | null>(null);
  const [history, setHistory] = useState<DisbursementHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

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
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const showFeedback = useCallback(
    (type: "success" | "error", title: string, message: string) => {
      setFeedback({ isOpen: true, type, title, message });
    },
    [],
  );

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([getDisbursementData(), getDisbursementHistory()]).then(
      ([dataRes, historyRes]) => {
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
        setLoading(false);
      },
    );
  }, [showFeedback]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await requestDisbursement(
        { success: false, message: "" },
        formData,
      );
      if (res.success) {
        showFeedback("success", "Pencairan Berhasil", res.message);
        setCustomAmount("");
        loadData();
      } else {
        if (res.errors) {
          setErrors(res.errors);
        }
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

  const setAmount = (val: number) => {
    setCustomAmount(val.toString());
  };

  // DataTable Column definitions
  const columns: Column<DisbursementHistoryItem>[] = [
    {
      header: "Tanggal & Waktu",
      render: (item) => formatTanggal(item.createdAt),
    },
    {
      header: "Tujuan Transfer",
      render: (item) => (
        <div>
          <div className="font-bold text-neutral-800">{item.jenisBank}</div>
          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
            {item.noRekening}
          </div>
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

  // DataTable filters
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

  // Client-side filtering & pagination
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.jenisBank.toLowerCase().includes(search.toLowerCase()) ||
      item.noRekening.includes(search) ||
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
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
            Pencairan Dana
          </h1>
          <p className="text-xs text-neutral-500">
            Cairkan reward saldo kredit uang Anda langsung ke rekening bank
            terdaftar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Balance & Withdraw Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance Card */}
          <div className="relative overflow-hidden bg-gradient-to-tr from-primary-950 via-primary-900 to-emerald-850 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/5">
            <div className="absolute top-[-30%] right-[-10%] w-[45%] h-[150%] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold tracking-widest text-primary-300 uppercase">
                  SALDO REWARD UTAMA
                </span>
                <Coins className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs text-primary-200">
                  Total Kredit Tersedia
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-1 flex items-baseline gap-1">
                  Rp {currentKredit.toLocaleString("id-ID")}
                </h2>
              </div>

              {/* Bank Account Info widget */}
              <div className="pt-4 mt-2 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div>
                  <span className="text-primary-300 block text-[9px] uppercase font-bold tracking-wider">
                    Rekening Tujuan
                  </span>
                  {isBankSetup ? (
                    <span className="font-semibold text-white mt-0.5 block">
                      {data?.jenisBank} — {data?.noRekening}
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold mt-0.5 block flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{" "}
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

          {/* Disbursement Form Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/60 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <ArrowRightLeft className="w-5 h-5 text-primary-600" />
              <h3 className="text-base font-bold text-neutral-800">
                Formulir Pencairan
              </h3>
            </div>

            {!isBankSetup ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-amber-800 text-xs">
                  <span className="font-bold">
                    Informasi Rekening Diperlukan
                  </span>
                  <p className="leading-relaxed">
                    Anda belum mengisi informasi rekening bank pada profil.
                    Harap lengkapi nama bank dan nomor rekening Anda terlebih
                    dahulu di menu profil agar dapat mencairkan dana.
                  </p>
                  <Link
                    href="/profil/warmiendo-profil"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-700 hover:text-primary-800 pt-1"
                  >
                    Atur Rekening Sekarang <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Amount Field */}
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

                {/* Presets Grid */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Pilih Nominal Instan
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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

                {/* Submit button */}
                <div className="pt-4 border-t border-neutral-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      isPending ||
                      !customAmount ||
                      Number(customAmount) > currentKredit ||
                      Number(customAmount) < 10000
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
                        <span>Cairkan Kredit</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Terms / Instructions */}
        <div className="space-y-6">
          {/* Rules Card */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/60 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-neutral-800 flex items-center gap-1.5 pb-2 border-b border-neutral-100">
              <HelpCircle className="w-4.5 h-4.5 text-primary-600" />
              Syarat &amp; Ketentuan
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-600">
              <li className="flex gap-2">
                <span className="text-primary-600 font-bold">•</span>
                <span>
                  Pencairan dana diproses secara manual dalam{" "}
                  <strong>1-2 hari kerja</strong>.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary-600 font-bold">•</span>
                <span>
                  Batas minimal pencairan dana adalah <strong>Rp 10.000</strong>
                  .
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary-600 font-bold">•</span>
                <span>
                  Pastikan kebenaran nomor rekening Anda. Kesalahan input
                  rekening di luar tanggung jawab pengelola.
                </span>
              </li>
              <li className="flex gap-2 text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
                <span className="text-amber-600 font-bold">•</span>
                <span>
                  Apabila dana belum cair dalam 1-2 hari kerja, silakan{" "}
                  <strong>menghubungi admin</strong> untuk tindak lanjut.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* History Area using Shared DataTable */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/60 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
          <Clock className="w-5 h-5 text-primary-600" />
          <h3 className="text-base font-bold text-neutral-800">
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

      {/* View Proof Image Modal */}
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

            <h3 className="text-base font-bold text-neutral-800 pb-2 border-b border-neutral-150 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary-600" />
              Bukti Foto Transfer Pencairan
            </h3>

            <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50 max-h-[400px] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {/* biome-ignore lint/performance/noImgElement: R2 remote proof image preview is used */}
              <img
                src={viewProofUrl}
                alt="Bukti Transfer"
                className="max-h-[400px] object-contain w-full"
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

      {/* Feedback Modal */}
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
