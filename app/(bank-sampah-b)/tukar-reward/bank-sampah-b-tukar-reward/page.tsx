"use client";

import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  Coins,
  Eye,
  Gift,
  Package,
  Sparkles,
  Ticket,
  X,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getBankSampahBRewardData,
  submitTukarRewardBankSampahB,
} from "@/app/(bank-sampah-b)/tukar-reward/bank-sampah-b-tukar-reward/action";
import { AnimatedCounter } from "@/app/components/shared/AnimatedCounter";
import { type Column, DataTable } from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { FormModal } from "@/app/components/shared/FormModal";
import { TourGuide } from "@/app/components/shared/TourGuide";
import type { PenukaranRewardWarmindo, RewardWarmindo } from "@/app/types";

const rewardTourSteps = [
  {
    element: "#tour-bank-b-reward-points",
    popover: {
      title: "1. Saldo Poin Reward Anda",
      description:
        "Banner ini menampilkan total poin reward aktif yang Anda kumpulkan dari penjemputan sampah kemasan Indofood. Poin ini dapat langsung Anda tukarkan dengan berbagai hadiah menarik.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-bank-b-reward-tabs",
    popover: {
      title: "2. Kategori Hadiah",
      description:
        "Pilih kategori reward yang Anda inginkan: Uang Tunai (transfer bank/e-wallet), Voucher Belanja, atau Barang Fisik / Merchandise resmi Indofood.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-bank-b-reward-grid",
    popover: {
      title: "3. Katalog Hadiah & Klaim",
      description:
        "Pilih hadiah yang Anda minati. Jika saldo poin Anda mencukupi, tombol 'Tukar Hadiah' akan aktif untuk mengajukan klaim hadiah.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-bank-b-reward-history",
    popover: {
      title: "4. Riwayat Penukaran Reward",
      description:
        "Pantau status penukaran hadiah Anda di sini: dari status 'Pending' (sedang diverifikasi admin), 'Diproses', hingga 'Berhasil' lengkap dengan bukti transfer atau resi paket.",
      side: "top" as const,
    },
  },
];

export default function BankSampahBTukarRewardPage() {
  const [userPoin, setUserPoin] = useState(0);
  const [userProfile, setUserProfile] = useState<{
    id: number;
    name: string;
    jenisBank?: string | null;
    noRekening?: string | null;
    alamat?: string | null;
  } | null>(null);
  const [rewards, setRewards] = useState<RewardWarmindo[]>([]);
  const [history, setHistory] = useState<PenukaranRewardWarmindo[]>([]);
  const [_loading, setLoading] = useState(true);

  // Filter Tab state: "semua" | "uang" | "barang" | "voucher"
  const [categoryFilter, setCategoryFilter] = useState<
    "semua" | "uang" | "barang" | "voucher"
  >("semua");

  // History table states
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  // Modal claim state
  const [selectedReward, setSelectedReward] = useState<RewardWarmindo | null>(
    null,
  );
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  // Form states
  const [jenisBank, setJenisBank] = useState("");
  const [noRekening, setNoRekening] = useState("");
  const [atasNama, setAtasNama] = useState("");
  const [alamatPengiriman, setAlamatPengiriman] = useState("");
  const [catatan, setCatatan] = useState("");

  const [isPending, startTransition] = useTransition();
  const [globalError, setGlobalError] = useState("");
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

  const loadData = useCallback(() => {
    setLoading(true);
    getBankSampahBRewardData().then((res) => {
      if (res.success) {
        setUserPoin(res.userPoin);
        setUserProfile(res.userProfile);
        setRewards(res.rewards);
        setHistory(res.history);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenClaimModal = (reward: RewardWarmindo) => {
    setSelectedReward(reward);
    setGlobalError("");
    setJenisBank(userProfile?.jenisBank || "BCA");
    setNoRekening(userProfile?.noRekening || "");
    setAtasNama(userProfile?.name || "");
    setAlamatPengiriman(userProfile?.alamat || "");
    setCatatan("");
  };

  const handleClaimSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedReward) return;
    setGlobalError("");

    const formData = new FormData();
    formData.append("rewardId", String(selectedReward.id));
    if (selectedReward.kategori === "uang") {
      formData.append("jenisBank", jenisBank);
      formData.append("noRekening", noRekening);
      formData.append("atasNama", atasNama);
    } else if (selectedReward.kategori === "barang") {
      formData.append("alamatPengiriman", alamatPengiriman);
    }
    if (catatan) formData.append("catatan", catatan);

    startTransition(async () => {
      const res = await submitTukarRewardBankSampahB(
        { success: false },
        formData,
      );

      if (res.success) {
        setSelectedReward(null);
        showFeedback(
          "success",
          "Klaim Berhasil Diajukan!",
          res.message || "Pengajuan penukaran reward Anda berhasil dikirim.",
        );
        loadData();
      } else {
        const errorMsg =
          res.errors?._form?.[0] ||
          Object.values(res.errors || {})[0]?.[0] ||
          "Gagal memproses penukaran reward.";
        setGlobalError(errorMsg);
      }
    });
  };

  // Filter rewards by category
  const filteredRewards = rewards.filter((r) => {
    if (categoryFilter === "semua") return true;
    return r.kategori === categoryFilter;
  });

  // Filter history by search
  const filteredHistory = history.filter((h) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      h.namaReward.toLowerCase().includes(q) ||
      h.kategori.toLowerCase().includes(q) ||
      h.atasNama?.toLowerCase().includes(q) ||
      h.catatan?.toLowerCase().includes(q)
    );
  });

  // History table columns
  const historyColumns: Column<PenukaranRewardWarmindo>[] = [
    {
      header: "Nama Reward",
      sortKey: "namaReward",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              row.kategori === "uang"
                ? "bg-emerald-50 text-emerald-600"
                : row.kategori === "voucher"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-blue-50 text-blue-600"
            }`}
          >
            {row.kategori === "uang" ? (
              <Banknote className="w-4.5 h-4.5" />
            ) : row.kategori === "voucher" ? (
              <Ticket className="w-4.5 h-4.5" />
            ) : (
              <Package className="w-4.5 h-4.5" />
            )}
          </div>
          <div>
            <span className="font-bold text-neutral-900 text-xs sm:text-sm block">
              {row.namaReward}
            </span>
            <span className="text-[11px] text-neutral-500 capitalize">
              {row.kategori}
              {row.nominalUang
                ? ` • Rp ${row.nominalUang.toLocaleString("id-ID")}`
                : ""}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Poin Digunakan",
      sortKey: "poinDipotong",
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-black text-xs sm:text-sm text-neutral-800">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          {row.poinDipotong.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      header: "Status",
      sortKey: "status",
      render: (row) => {
        const statusConfig: Record<
          string,
          {
            label: string;
            icon: typeof Clock;
            bg: string;
            text: string;
            border: string;
          }
        > = {
          pending: {
            label: "Menunggu",
            icon: Clock,
            bg: "bg-amber-50",
            text: "text-amber-700",
            border: "border-amber-200",
          },
          diproses: {
            label: "Diproses",
            icon: Clock,
            bg: "bg-blue-50",
            text: "text-blue-700",
            border: "border-blue-200",
          },
          berhasil: {
            label: "Berhasil",
            icon: CheckCircle2,
            bg: "bg-emerald-50",
            text: "text-emerald-700",
            border: "border-emerald-200",
          },
          ditolak: {
            label: "Ditolak",
            icon: XCircle,
            bg: "bg-red-50",
            text: "text-red-700",
            border: "border-red-200",
          },
        };
        const cfg = statusConfig[row.status] || statusConfig.pending;
        const Icon = cfg.icon;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {cfg.label}
          </span>
        );
      },
    },
    {
      header: "Detail Tujuan",
      render: (row) => {
        if (row.kategori === "uang") {
          return (
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-neutral-800">
                {row.jenisBank} - {row.noRekening}
              </span>
              <span className="text-neutral-500 block">
                a.n. {row.atasNama}
              </span>
            </div>
          );
        }
        if (row.kategori === "barang") {
          return (
            <span
              className="text-xs text-neutral-600 line-clamp-2 max-w-xs"
              title={row.alamatPengiriman || ""}
            >
              {row.alamatPengiriman || "-"}
            </span>
          );
        }
        return <span className="text-xs text-neutral-400">Kode Voucher</span>;
      },
    },
    {
      header: "Tanggal",
      sortKey: "createdAt",
      render: (row) => (
        <span className="text-xs text-neutral-500">
          {new Date(row.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Aksi",
      render: (row) => {
        if (row.buktiTransfer) {
          return (
            <button
              type="button"
              onClick={() => setViewProofUrl(row.buktiTransfer)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Bukti
            </button>
          );
        }
        return <span className="text-xs text-neutral-300">-</span>;
      },
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <TourGuide steps={rewardTourSteps} />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide">
              <Gift className="w-3.5 h-3.5" />
              <span>Program Reward Bank Sampah Tipe B</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Katalog &amp; Penukaran Reward
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-xl">
              Tukarkan poin reward hasil penjemputan sampah anorganik kemasan
              Indofood Anda dengan uang tunai, voucher, atau merchandise resmi.
            </p>
          </div>

          {/* Saldo Poin Card */}
          <div
            id="tour-bank-b-reward-points"
            className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white shrink-0 min-w-[200px]"
          >
            <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider block">
              Saldo Poin Tersedia
            </span>
            <div className="text-3xl font-black text-white flex items-center gap-2 mt-1">
              <Coins className="w-6 h-6 text-amber-300 shrink-0" />
              <AnimatedCounter value={userPoin} />
            </div>
            <span className="text-[11px] text-emerald-200/80 mt-1 block">
              Siap ditukarkan kapan saja
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        id="tour-bank-b-reward-tabs"
        className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-neutral-200"
      >
        {[
          { id: "semua", label: "Semua Hadiah", icon: Sparkles },
          { id: "uang", label: "Uang Tunai", icon: Banknote },
          { id: "barang", label: "Barang & Merchandise", icon: Package },
          { id: "voucher", label: "Voucher Belanja", icon: Ticket },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = categoryFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setCategoryFilter(
                  tab.id as "semua" | "uang" | "barang" | "voucher",
                )
              }
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Reward Grid */}
      <div id="tour-bank-b-reward-grid" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-neutral-900">
              Pilihan Hadiah Tersedia
            </h2>
            <p className="text-xs text-neutral-500">
              Menampilkan {filteredRewards.length} reward aktif
            </p>
          </div>
        </div>

        {filteredRewards.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200">
            <Gift className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-700">
              Belum ada reward pada kategori ini
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Silakan periksa kategori lain untuk melihat daftar hadiah yang
              tersedia.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredRewards.map((reward) => {
              const isEligible = userPoin >= reward.poin && reward.stok > 0;
              const isOutOfStock =
                (reward.kategori === "barang" ||
                  reward.kategori === "voucher") &&
                reward.stok <= 0;

              return (
                <div
                  key={reward.id}
                  className="bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Image / Thumbnail */}
                  <div className="relative aspect-4/3 bg-neutral-100 flex items-center justify-center overflow-hidden">
                    {reward.gambar ? (
                      <Image
                        src={reward.gambar}
                        alt={reward.nama}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        {reward.kategori === "uang" ? (
                          <Banknote className="w-8 h-8" />
                        ) : reward.kategori === "voucher" ? (
                          <Ticket className="w-8 h-8" />
                        ) : (
                          <Package className="w-8 h-8" />
                        )}
                      </div>
                    )}
                    <span
                      className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${
                        reward.kategori === "uang"
                          ? "bg-emerald-500/90 text-white"
                          : reward.kategori === "voucher"
                            ? "bg-amber-500/90 text-white"
                            : "bg-blue-500/90 text-white"
                      }`}
                    >
                      {reward.kategori}
                    </span>
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold">
                          Stok Habis
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-neutral-900 text-sm sm:text-base leading-snug line-clamp-2">
                        {reward.nama}
                      </h3>
                      {reward.deskripsi && (
                        <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                          {reward.deskripsi}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 pt-2 border-t border-neutral-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                            Dibutuhkan
                          </span>
                          <span className="font-black text-emerald-700 text-base flex items-center gap-1">
                            <Coins className="w-4 h-4 text-amber-500" />
                            {reward.poin.toLocaleString("id-ID")}{" "}
                            <span className="text-xs font-semibold text-neutral-500">
                              Poin
                            </span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                            Stok
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              reward.stok > 0
                                ? "text-neutral-700"
                                : "text-red-600"
                            }`}
                          >
                            {reward.stok > 0 ? `${reward.stok} unit` : "Habis"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenClaimModal(reward)}
                        disabled={!isEligible}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isEligible
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                            : "bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200"
                        }`}
                      >
                        <span>
                          {isOutOfStock
                            ? "Stok Habis"
                            : userPoin < reward.poin
                              ? `Kurang ${(reward.poin - userPoin).toLocaleString("id-ID")} Poin`
                              : "Tukar Reward"}
                        </span>
                        {isEligible && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Riwayat Penukaran */}
      <div
        id="tour-bank-b-reward-history"
        className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-neutral-900">
              Riwayat Penukaran Hadiah
            </h2>
            <p className="text-xs text-neutral-500">
              Pantau status penukaran dan pengiriman hadiah Anda
            </p>
          </div>
        </div>

        <DataTable
          columns={historyColumns}
          data={filteredHistory}
          searchPlaceholder="Cari riwayat hadiah, nama..."
          search={historySearch}
          onSearchChange={setHistorySearch}
          currentPage={historyPage}
          onPageChange={setHistoryPage}
          pageSize={historyPageSize}
          onPageSizeChange={(e) => {
            setHistoryPageSize(Number(e.target.value));
            setHistoryPage(1);
          }}
          totalItems={filteredHistory.length}
        />
      </div>

      {/* Claim Modal */}
      {selectedReward && (
        <FormModal
          isOpen={true}
          onClose={() => setSelectedReward(null)}
          title={`Klaim Reward: ${selectedReward.nama}`}
          onSubmit={handleClaimSubmit}
          isPending={isPending}
          globalError={globalError}
          submitLabel={isPending ? "Memproses Klaim..." : "Konfirmasi Tukar"}
        >
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                  Reward Pilihan
                </span>
                <span className="font-bold text-neutral-800 text-sm block">
                  {selectedReward.nama}
                </span>
                <span className="text-xs text-emerald-700 font-semibold">
                  Potong {selectedReward.poin.toLocaleString("id-ID")} Poin
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                  Sisa Saldo Setelahnya
                </span>
                <span className="text-sm font-black text-neutral-900">
                  {(userPoin - selectedReward.poin).toLocaleString("id-ID")}{" "}
                  Poin
                </span>
              </div>
            </div>

            {/* Field Khusus Kategori Uang */}
            {selectedReward.kategori === "uang" && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label
                    htmlFor="jenisBank"
                    className="text-xs font-bold text-neutral-700 block"
                  >
                    Nama Bank / E-Wallet <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="jenisBank"
                    type="text"
                    required
                    value={jenisBank}
                    onChange={(e) => setJenisBank(e.target.value)}
                    placeholder="Contoh: BCA, Mandiri, BRI, Gopay, OVO"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="noRekening"
                    className="text-xs font-bold text-neutral-700 block"
                  >
                    Nomor Rekening / No. HP{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="noRekening"
                    type="text"
                    required
                    value={noRekening}
                    onChange={(e) => setNoRekening(e.target.value)}
                    placeholder="Contoh: 1234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="atasNama"
                    className="text-xs font-bold text-neutral-700 block"
                  >
                    Atas Nama Rekening <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="atasNama"
                    type="text"
                    required
                    value={atasNama}
                    onChange={(e) => setAtasNama(e.target.value)}
                    placeholder="Nama pemilik rekening"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Field Khusus Kategori Barang */}
            {selectedReward.kategori === "barang" && (
              <div className="space-y-1 pt-1">
                <label
                  htmlFor="alamatPengiriman"
                  className="text-xs font-bold text-neutral-700 block"
                >
                  Alamat Lengkap Pengiriman{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="alamatPengiriman"
                  rows={3}
                  required
                  value={alamatPengiriman}
                  onChange={(e) => setAlamatPengiriman(e.target.value)}
                  placeholder="Masukkan jalan, no rumah, RT/RW, kelurahan, kecamatan, kota/kab, dan kode pos"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
            )}

            {/* Catatan Tambahan */}
            <div className="space-y-1 pt-1">
              <label
                htmlFor="catatan"
                className="text-xs font-bold text-neutral-700 block"
              >
                Catatan Tambahan (Opsional)
              </label>
              <input
                id="catatan"
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Mohon konfirmasi sebelum pengiriman"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
        </FormModal>
      )}

      {/* Proof Viewer Modal */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-neutral-100">
              <h3 className="font-bold text-sm text-neutral-900">
                Bukti Pemenuhan Reward
              </h3>
              <button
                type="button"
                onClick={() => setViewProofUrl(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200">
                <Image
                  src={viewProofUrl}
                  alt="Bukti Transfer"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <div className="p-4 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewProofUrl(null)}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
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
