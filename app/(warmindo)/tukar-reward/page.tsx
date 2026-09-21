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
  Ticket,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getWarmindoRewardData,
  submitTukarReward,
} from "@/app/(warmindo)/tukar-reward/action";
import { AnimatedCounter } from "@/app/components/shared/AnimatedCounter";
import { type Column, DataTable } from "@/app/components/shared/DataTable";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { FormModal } from "@/app/components/shared/FormModal";
import { TourGuide } from "@/app/components/shared/TourGuide";
import type { PenukaranRewardWarmindo, RewardWarmindo } from "@/app/types";

const rewardTourSteps = [
  {
    element: "#tour-warmindo-reward-points",
    popover: {
      title: "Saldo Poin Reward Anda",
      description:
        "Bagian ini menunjukkan akumulasi poin reward murni yang Anda kumpulkan dari setiap kilogram setoran sampah kemasan Indofood (10 poin / 100 gram). Poin ini menjadi modal untuk ditukarkan dengan beragam hadiah menarik tanpa dipungut biaya apapun.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-warmindo-reward-tabs",
    popover: {
      title: "Filter Kategori Hadiah",
      description:
        "Gunakan tombol filter ini untuk memilah reward berdasarkan jenisnya: Uang Tunai (langsung transfer ke rekening bank Anda), Voucher belanja, atau Barang Fisik (merchandise & alat operasional warung).",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-warmindo-reward-cards",
    popover: {
      title: "Katalog & Penukaran Hadiah",
      description:
        "Daftar kartu reward yang tersedia lengkap dengan foto, nama, deskripsi, stok, dan jumlah poin yang dibutuhkan. Jika poin Anda mencukupi, klik tombol 'Tukar Sekarang' untuk mengisi data penerimaan hadiah (rekening bank atau alamat pengiriman).",
      side: "top" as const,
    },
  },
  {
    element: "#tour-warmindo-reward-history",
    popover: {
      title: "Riwayat & Status Penukaran",
      description:
        "Pantau progres setiap penukaran reward Anda di sini. Anda dapat memantau apakah status masih Menunggu Verifikasi, Sedang Diproses, Dikirimkan, Disetujui (lengkap dengan bukti transfer atau kode resi), ataupun Ditolak beserta alasannya.",
      side: "top" as const,
    },
  },
];

export default function TukarRewardWarmindoPage() {
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
    getWarmindoRewardData().then((res) => {
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

    const formData = new FormData(e.currentTarget);
    formData.set("rewardId", selectedReward.id.toString());
    if (selectedReward.kategori === "uang") {
      formData.set("jenisBank", jenisBank);
      formData.set("noRekening", noRekening);
      formData.set("atasNama", atasNama);
    } else {
      formData.set("alamatPengiriman", alamatPengiriman);
    }
    formData.set("catatan", catatan);

    startTransition(async () => {
      const res = await submitTukarReward({ success: false }, formData);
      if (res.success) {
        setSelectedReward(null);
        showFeedback(
          "success",
          "Penukaran Berhasil Diajukan!",
          `Pengajuan reward "${selectedReward.nama}" telah dikirim ke admin untuk diproses. Poin Anda telah dipotong sebesar ${selectedReward.poin} poin.`,
        );
        loadData();
      } else {
        setGlobalError(
          res.errors?._form?.[0] || "Gagal mengajukan penukaran reward.",
        );
      }
    });
  };

  const filteredRewards = rewards.filter((r) => {
    if (categoryFilter === "semua") return true;
    return r.kategori === categoryFilter;
  });

  // History Columns
  const historyColumns: Column<PenukaranRewardWarmindo>[] = [
    {
      header: "Tanggal",
      sortKey: "createdAt",
      render: (item) => (
        <span className="text-xs text-neutral-600 font-medium">
          {new Date(item.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      header: "Reward",
      render: (item) => (
        <div>
          <span className="font-bold text-neutral-900 text-xs block">
            {item.namaReward}
          </span>
          <span
            className={`inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-bold uppercase ${
              item.kategori === "uang"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : item.kategori === "voucher"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {item.kategori === "uang"
              ? "Uang Tunai"
              : item.kategori === "voucher"
                ? "Voucher"
                : "Barang Fisik"}
          </span>
        </div>
      ),
    },
    {
      header: "Poin Ditukar",
      render: (item) => (
        <span className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
          {item.poinDipotong.toLocaleString("id-ID")} Poin
        </span>
      ),
    },
    {
      header: "Detail Penyaluran",
      render: (item) => (
        <div className="text-xs">
          {item.kategori === "uang" ? (
            <div>
              <span className="font-bold text-emerald-700 block">
                Rp {item.nominalUang?.toLocaleString("id-ID")}
              </span>
              <span className="text-[11px] text-neutral-600">
                {item.jenisBank} - {item.noRekening} (a.n. {item.atasNama})
              </span>
            </div>
          ) : item.kategori === "voucher" ? (
            <div>
              <span className="text-[11px] text-amber-800 font-semibold block">
                Voucher Reward
              </span>
              {item.nomorResi && (
                <span className="text-[10px] text-amber-700 font-mono font-bold block">
                  Kode/Link: {item.nomorResi}
                </span>
              )}
            </div>
          ) : (
            <div>
              <span className="text-[11px] text-neutral-700 line-clamp-1">
                {item.alamatPengiriman || "Sesuai profil"}
              </span>
              {item.nomorResi && (
                <span className="text-[10px] text-blue-600 font-mono block">
                  Resi: {item.nomorResi}
                </span>
              )}
            </div>
          )}
          {item.catatanAdmin && (
            <div className="text-[10px] text-amber-700 mt-0.5 italic">
              Note Admin: {item.catatanAdmin}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      sortKey: "status",
      render: (item) => (
        <div className="flex flex-col gap-1 items-start">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              item.status === "berhasil"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : item.status === "ditolak"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {item.status === "berhasil" ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : item.status === "ditolak" ? (
              <XCircle className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {item.status}
          </span>
          {item.buktiTransfer && (
            <button
              type="button"
              onClick={() => setViewProofUrl(item.buktiTransfer)}
              className="text-[10px] text-primary-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0 p-0"
            >
              <Eye className="w-3 h-3" /> Bukti Transfer
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <TourGuide steps={rewardTourSteps} />

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden print:hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20 shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Penukaran Reward Mitra Warmindo
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Tukarkan poin setoran sampah Anda menjadi Uang Tunai langsung ke
              rekening atau Merchandise/Alat operasional warung
            </p>
          </div>
        </div>
      </div>

      {/* Point Balance Card */}
      <div
        id="tour-warmindo-reward-points"
        className="relative overflow-hidden rounded-3xl bg-linear-to-tr from-primary-950 via-primary-900 to-amber-900 text-white p-6 sm:p-7 shadow-xl"
      >
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest bg-amber-400/20 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                Saldo Poin Tersedia
              </span>
              <span className="text-[11px] text-primary-200">
                (10 Poin / 100 gram)
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                <AnimatedCounter value={userPoin} />
              </h2>
              <span className="text-base sm:text-lg font-bold text-amber-300">
                Poin
              </span>
            </div>
            <p className="text-xs text-primary-100/80 mt-1 max-w-md">
              Kumpulkan terus poin dari setiap kilogram kemasan mie instan,
              karton, dan paper cup yang Anda setorkan.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/10 shrink-0">
            <Coins className="w-8 h-8 text-amber-300 shrink-0" />
            <div>
              <p className="text-[10px] text-primary-200 font-medium">
                Pilihan Hadiah
              </p>
              <p className="text-xs font-extrabold text-white">
                Uang, Voucher & Barang
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div
        id="tour-warmindo-reward-tabs"
        className="flex items-center justify-between flex-wrap gap-3 border-b border-neutral-200 pb-3"
      >
        <div className="flex items-center gap-2 bg-neutral-100/80 p-1 rounded-xl border border-neutral-200">
          <button
            type="button"
            onClick={() => setCategoryFilter("semua")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === "semua"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Semua Reward ({rewards.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("uang")}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === "uang"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <Banknote className="w-3.5 h-3.5" /> Uang Tunai (
            {rewards.filter((r) => r.kategori === "uang").length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("voucher")}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === "voucher"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <Ticket className="w-3.5 h-3.5" /> Voucher (
            {rewards.filter((r) => r.kategori === "voucher").length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("barang")}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === "barang"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <Package className="w-3.5 h-3.5" /> Barang Fisik (
            {rewards.filter((r) => r.kategori === "barang").length})
          </button>
        </div>

        <span className="text-xs text-neutral-500">
          Menampilkan {filteredRewards.length} pilihan reward
        </span>
      </div>

      {/* Rewards Catalog Grid */}
      <div
        id="tour-warmindo-reward-cards"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {filteredRewards.length > 0 ? (
          filteredRewards.map((reward) => {
            const canAfford = userPoin >= reward.poin;
            const isOutOfStock = reward.stok <= 0;

            return (
              <div
                key={reward.id}
                className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Image Header 16:9 */}
                <div className="relative w-full aspect-video bg-neutral-100 overflow-hidden flex items-center justify-center border-b border-neutral-100">
                  {reward.gambar ? (
                    /* biome-ignore lint/performance/noImgElement: dynamic user-uploaded image */
                    <img
                      src={reward.gambar}
                      alt={reward.nama}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex flex-col items-center justify-center gap-2 ${
                        reward.kategori === "uang"
                          ? "bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 text-emerald-600"
                          : reward.kategori === "voucher"
                            ? "bg-linear-to-br from-amber-500/10 via-amber-500/5 to-yellow-500/10 text-amber-600"
                            : "bg-linear-to-br from-blue-500/10 via-primary-500/5 to-primary-500/10 text-primary-600"
                      }`}
                    >
                      {reward.kategori === "uang" ? (
                        <Banknote className="w-12 h-12 opacity-80 group-hover:scale-110 transition-transform duration-300" />
                      ) : reward.kategori === "voucher" ? (
                        <Ticket className="w-12 h-12 opacity-80 group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <Package className="w-12 h-12 opacity-80 group-hover:scale-110 transition-transform duration-300" />
                      )}
                      <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                        {reward.kategori === "uang"
                          ? "Pencairan Saldo"
                          : reward.kategori === "voucher"
                            ? "Voucher Reward"
                            : "Reward Merchandise"}
                      </span>
                    </div>
                  )}

                  {/* Badge Category on Image */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-xs ${
                        reward.kategori === "uang"
                          ? "bg-emerald-50/95 text-emerald-800 border border-emerald-200"
                          : reward.kategori === "voucher"
                            ? "bg-amber-50/95 text-amber-800 border border-amber-200"
                            : "bg-blue-50/95 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {reward.kategori === "uang" ? (
                        <Banknote className="w-3 h-3" />
                      ) : reward.kategori === "voucher" ? (
                        <Ticket className="w-3 h-3" />
                      ) : (
                        <Package className="w-3 h-3" />
                      )}
                      {reward.kategori === "uang"
                        ? "Uang Tunai"
                        : reward.kategori === "voucher"
                          ? "Voucher"
                          : "Barang"}
                    </span>
                  </div>

                  {/* Stock Badge on Image */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider backdrop-blur-md shadow-xs ${
                        reward.stok <= 0
                          ? "bg-red-500/90 text-white"
                          : "bg-black/60 text-white"
                      }`}
                    >
                      {reward.stok <= 0 ? "Stok Habis" : `Stok: ${reward.stok}`}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-neutral-900 text-base group-hover:text-primary-600 transition-colors line-clamp-2">
                      {reward.nama}
                    </h3>

                    {reward.kategori === "uang" && reward.nominalUang && (
                      <div className="mt-1">
                        <span className="text-lg font-black text-emerald-600">
                          Rp {reward.nominalUang.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-neutral-500 mt-2 line-clamp-2 leading-relaxed">
                      {reward.deskripsi ||
                        "Tukarkan poin Anda dengan reward pilihan berkualitas."}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                      Dibutuhkan
                    </span>
                    <span className="font-mono text-sm font-black text-neutral-900">
                      {reward.poin.toLocaleString("id-ID")}{" "}
                      <span className="text-xs font-semibold text-neutral-500">
                        Poin
                      </span>
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={!canAfford || isOutOfStock}
                    onClick={() => handleOpenClaimModal(reward)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      !canAfford
                        ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                        : isOutOfStock
                          ? "bg-red-100 text-red-500 cursor-not-allowed"
                          : "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/20 hover:scale-[1.02]"
                    }`}
                  >
                    {!canAfford ? (
                      "Poin Kurang"
                    ) : isOutOfStock ? (
                      "Stok Habis"
                    ) : (
                      <>
                        Tukar Sekarang <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-neutral-200">
            <Gift className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-neutral-500">
              Tidak ada reward di kategori ini.
            </p>
          </div>
        )}
      </div>

      {/* History Table */}
      <div id="tour-warmindo-reward-history" className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-neutral-900">
              Riwayat Pengajuan Penukaran Reward
            </h3>
            <p className="text-xs text-neutral-500">
              Daftar penukaran poin yang telah Anda ajukan beserta status
              penyaluran
            </p>
          </div>
        </div>

        <DataTable
          data={history
            .filter((h) => {
              if (!historySearch) return true;
              const q = historySearch.toLowerCase();
              return (
                h.namaReward.toLowerCase().includes(q) ||
                h.catatanAdmin?.toLowerCase().includes(q) ||
                h.noRekening?.includes(q)
              );
            })
            .slice(
              (historyPage - 1) * historyPageSize,
              historyPage * historyPageSize,
            )}
          columns={historyColumns}
          totalItems={
            history.filter((h) => {
              if (!historySearch) return true;
              const q = historySearch.toLowerCase();
              return (
                h.namaReward.toLowerCase().includes(q) ||
                h.catatanAdmin?.toLowerCase().includes(q) ||
                h.noRekening?.includes(q)
              );
            }).length
          }
          currentPage={historyPage}
          pageSize={historyPageSize}
          onPageChange={setHistoryPage}
          onPageSizeChange={(e) => {
            setHistoryPageSize(Number(e.target.value));
            setHistoryPage(1);
          }}
          search={historySearch}
          onSearchChange={(val) => {
            setHistorySearch(val);
            setHistoryPage(1);
          }}
          searchPlaceholder="Cari riwayat..."
        />
      </div>

      {/* Claim Confirmation Form Modal */}
      {selectedReward && (
        <FormModal
          isOpen={!!selectedReward}
          onClose={() => setSelectedReward(null)}
          title={`Konfirmasi Tukar: ${selectedReward.nama}`}
          onSubmit={handleClaimSubmit}
          isPending={isPending}
          globalError={globalError}
          submitLabel="Ajukan Penukaran Sekarang"
        >
          {/* Summary Box */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-3 pb-2 border-b border-amber-200/60">
              <div className="w-12 h-12 rounded-xl bg-white border border-amber-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                {selectedReward.gambar ? (
                  /* biome-ignore lint/performance/noImgElement: dynamic user-uploaded image */
                  <img
                    src={selectedReward.gambar}
                    alt={selectedReward.nama}
                    className="w-full h-full object-cover"
                  />
                ) : selectedReward.kategori === "uang" ? (
                  <Banknote className="w-6 h-6 text-emerald-600" />
                ) : selectedReward.kategori === "voucher" ? (
                  <Ticket className="w-6 h-6 text-amber-600" />
                ) : (
                  <Package className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block">
                  Reward yang Dipilih
                </span>
                <span className="font-extrabold text-neutral-900 text-sm block truncate">
                  {selectedReward.nama}
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-neutral-600">Poin yang Dipotong:</span>
              <span className="font-mono font-black text-amber-800">
                -{selectedReward.poin.toLocaleString("id-ID")} Poin
              </span>
            </div>
            <div className="flex justify-between border-t border-amber-200/60 pt-1">
              <span className="text-neutral-600">Sisa Poin Anda:</span>
              <span className="font-mono font-bold text-neutral-800">
                {(userPoin - selectedReward.poin).toLocaleString("id-ID")} Poin
              </span>
            </div>
          </div>

          {selectedReward.kategori === "uang" ? (
            <>
              <div>
                <label
                  htmlFor="jenisBankInput"
                  className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                >
                  Bank / E-Wallet Tujuan <span className="text-red-500">*</span>
                </label>
                <select
                  id="jenisBankInput"
                  required
                  value={jenisBank}
                  onChange={(e) => setJenisBank(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 text-neutral-800"
                >
                  <option value="BCA">BCA</option>
                  <option value="BRI">BRI</option>
                  <option value="BNI">BNI</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="BSI">BSI</option>
                  <option value="GoPay">GoPay</option>
                  <option value="OVO">OVO</option>
                  <option value="Dana">Dana</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="noRekeningInput"
                  className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                >
                  Nomor Rekening / No. HP E-Wallet{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="noRekeningInput"
                  type="text"
                  required
                  value={noRekening}
                  onChange={(e) => setNoRekening(e.target.value)}
                  placeholder="Contoh: 1234567890"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 font-mono text-neutral-800"
                />
              </div>

              <div>
                <label
                  htmlFor="atasNamaInput"
                  className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                >
                  Nama Pemilik Rekening <span className="text-red-500">*</span>
                </label>
                <input
                  id="atasNamaInput"
                  type="text"
                  required
                  value={atasNama}
                  onChange={(e) => setAtasNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 text-neutral-800"
                />
              </div>
            </>
          ) : selectedReward.kategori === "voucher" ? (
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <Ticket className="w-4 h-4 text-amber-600" /> Informasi
                Penukaran Voucher
              </p>
              <p className="text-neutral-600 leading-relaxed">
                Kode voucher / kupon digital akan dikirimkan oleh admin dan
                dapat Anda lihat pada tabel riwayat penukaran di bawah setelah
                disetujui. Cantumkan nomor HP/WA pada catatan jika dibutuhkan
                verifikasi lebih lanjut.
              </p>
            </div>
          ) : (
            <div>
              <label
                htmlFor="alamatPengirimanInput"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
              >
                Alamat Pengiriman Barang <span className="text-red-500">*</span>
              </label>
              <textarea
                id="alamatPengirimanInput"
                required
                rows={3}
                value={alamatPengiriman}
                onChange={(e) => setAlamatPengiriman(e.target.value)}
                placeholder="Alamat lengkap warung/toko pengiriman barang..."
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 text-neutral-800"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="catatanMitraInput"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
            >
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              id="catatanMitraInput"
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan khusus atau waktu penerimaan..."
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-600 text-neutral-800"
            />
          </div>
        </FormModal>
      )}

      {/* View Transfer Proof Modal */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-lg w-full space-y-3 relative shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-neutral-900">
                Bukti Transfer Pembayaran
              </h3>
              <button
                type="button"
                onClick={() => setViewProofUrl(null)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-lg border bg-neutral-100 flex items-center justify-center">
              {/* biome-ignore lint/performance/noImgElement: transfer proof modal view */}
              <img
                src={viewProofUrl}
                alt="Bukti Transfer"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}
