"use client";

import {
  Award,
  Gift,
  History,
  Info,
  Loader2,
  Search,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getAvailableCoupons,
  getKonsumenPoints,
  getRedemptionHistory,
  getUserRole,
  redeemCoupon,
} from "@/app/(konsumen)/tukar-kupon/action";
import { ConfirmModal } from "@/app/components/shared/ConfirmModal";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { QrModal } from "@/app/components/shared/QrModal";

interface Kupon {
  id: number;
  nama: string;
  deskripsi: string;
  poin: number;
  tier: "silver" | "gold" | "diamond";
  createdAt: Date;
  updatedAt: Date;
}

interface RedemptionHistoryItem {
  id: number;
  createdAt: Date;
  kodeUnik: string;
  status: "aktif" | "digunakan";
  tanggalGunakan: Date | null;
  kupon: {
    nama: string;
    deskripsi: string;
    poin: number;
    tier: "silver" | "gold" | "diamond";
  };
}

export default function TukarKuponPage() {
  const [points, setPoints] = useState(0);
  const [coupons, setCoupons] = useState<Kupon[]>([]);
  const [history, setHistory] = useState<RedemptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"penukaran" | "kupon-saya">(
    "penukaran",
  );

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [affordableOnly, setAffordableOnly] = useState(false);

  const [selectedKupon, setSelectedKupon] = useState<Kupon | null>(null);
  const [activeQrKupon, setActiveQrKupon] =
    useState<RedemptionHistoryItem | null>(null);
  const [isPending, startTransition] = useTransition();
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userPoints, availCoupons, redempHistory, userRole] =
        await Promise.all([
          getKonsumenPoints(),
          getAvailableCoupons(),
          getRedemptionHistory(),
          getUserRole(),
        ]);
      setPoints(userPoints);
      setCoupons(availCoupons as Kupon[]);
      setHistory(redempHistory as RedemptionHistoryItem[]);
      setRole(userRole);
    } catch (error) {
      console.error("Gagal memuat data penukaran kupon:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRedeemClick = (kupon: Kupon) => {
    setSelectedKupon(kupon);
  };

  const handleConfirmRedeem = () => {
    if (!selectedKupon) return;

    startTransition(async () => {
      const res = await redeemCoupon(selectedKupon.id);
      setSelectedKupon(null);
      if (res.success) {
        setFeedback({
          isOpen: true,
          type: "success",
          title: "Penukaran Berhasil!",
          message: res.message || "Kupon Anda berhasil ditukarkan.",
        });
        loadData();
      } else {
        setFeedback({
          isOpen: true,
          type: "error",
          title: "Penukaran Gagal",
          message: res.message || "Terjadi kesalahan saat menukar kupon.",
        });
      }
    });
  };

  const getTierDetails = (tier: string) => {
    switch (tier) {
      case "diamond":
        return {
          gradient: "from-cyan-500 via-blue-600 to-indigo-700",
          shadow: "shadow-cyan-500/20",
          badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
          iconColor: "text-cyan-400",
        };
      case "gold":
        return {
          gradient: "from-amber-400 via-orange-500 to-yellow-600",
          shadow: "shadow-amber-500/20",
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          iconColor: "text-amber-300",
        };
      default:
        return {
          gradient: "from-slate-400 via-neutral-500 to-slate-600",
          shadow: "shadow-slate-500/20",
          badge: "bg-slate-50 text-slate-700 border-slate-200",
          iconColor: "text-slate-300",
        };
    }
  };

  // Filter Logic for Penukaran Coupons list
  const filteredCoupons = coupons.filter((item) => {
    const matchesSearch =
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTier = selectedTier === "all" || item.tier === selectedTier;
    const matchesAffordable = !affordableOnly || points >= item.poin;

    return matchesSearch && matchesTier && matchesAffordable;
  });

  // Filter Logic for Kupon Saya list (history)
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.kupon.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kupon.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTier =
      selectedTier === "all" || item.kupon.tier === selectedTier;

    return matchesSearch && matchesTier;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-sm font-medium text-neutral-500">
          Memuat katalog penukaran kupon...
        </p>
      </div>
    );
  }

  if (role === "warmiendo" || role === "bank-sampah") {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <div className="p-6 bg-white border border-neutral-200 rounded-3xl flex flex-col items-center gap-3 shadow-sm">
          <div className="p-3 bg-red-50 rounded-full text-red-600">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-base font-extrabold text-neutral-800">
            Akses Ditolak
          </h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Halaman penukaran kupon hanya dapat diakses oleh user dengan peranan{" "}
            <strong>Konsumen</strong>. Sebagai mitra{" "}
            <strong>
              {role === "warmiendo" ? "Warmiendo" : "Bank Sampah"}
            </strong>
            , reward Anda adalah saldo tunai yang dapat dicairkan melalui menu{" "}
            <strong>Pencairan Dana</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 uppercase">
            Tukar Reward Kupon
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Kumpulkan poin dari setoran sampah Anda dan tukarkan dengan kupon
            reward Tier sesuai kebutuhan Anda.
          </p>
        </div>
      </div>

      {/* Points Display Widget */}
      <div className="bg-linear-to-r from-orange-500 via-orange-600 to-red-600 rounded-2xl p-5 text-white flex items-center gap-4 shadow-md border border-orange-600 max-w-lg">
        <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg text-white">
          <Award className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <span className="text-[10px] text-orange-100 font-bold uppercase tracking-wider block">
            TOTAL POIN AKTIF
          </span>
          <span className="text-2xl font-black font-mono text-white block mt-0.5">
            {points.toLocaleString("id-ID")}{" "}
            <span className="text-xs font-bold text-orange-200">Poin</span>
          </span>
        </div>
      </div>

      {/* Tabs Controller */}
      <div className="flex border-b border-neutral-200 bg-neutral-100/60 p-1 rounded-xl w-fit gap-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab("penukaran");
            setSearchQuery("");
            setSelectedTier("all");
            setAffordableOnly(false);
          }}
          className={`py-2 px-5 text-xs font-bold transition-all rounded-lg cursor-pointer flex items-center gap-2 border-0 ${
            activeTab === "penukaran"
              ? "bg-white text-primary-700 shadow-sm"
              : "text-neutral-500 hover:text-neutral-800 bg-transparent"
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          Kupon Tersedia
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("kupon-saya");
            setSearchQuery("");
            setSelectedTier("all");
            setAffordableOnly(false);
          }}
          className={`py-2 px-5 text-xs font-bold transition-all rounded-lg cursor-pointer flex items-center gap-2 border-0 relative ${
            activeTab === "kupon-saya"
              ? "bg-white text-primary-700 shadow-sm"
              : "text-neutral-500 hover:text-neutral-800 bg-transparent"
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          Kupon Saya
          {history.filter((h) => h.status === "aktif").length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-bold rounded-full w-5 h-5 flex items-center justify-center text-[9px] border border-white shadow-sm animate-pulse">
              {history.filter((h) => h.status === "aktif").length}
            </span>
          )}
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-full">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Cari kupon saya..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10 transition-all text-neutral-800 bg-white"
        />
      </div>

      {/* Dynamic Tab Content */}
      {activeTab === "penukaran" && (
        <div className="space-y-5">
          {filteredCoupons.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center max-w-md mx-auto">
              <Ticket className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-neutral-700">
                Kupon tidak ditemukan
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Cobalah mengubah kata kunci pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCoupons.map((item) => {
                const details = getTierDetails(item.tier);
                const isAffordable = points >= item.poin;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300 ${!isAffordable ? "opacity-75" : ""}`}
                  >
                    {/* Coupon Card Top Gradient Header */}
                    <div
                      className={`bg-linear-to-br ${details.gradient} p-5 text-white relative min-h-25 flex flex-col justify-between`}
                    >
                      <div className="absolute right-3 top-3 opacity-15">
                        <Ticket className="w-20 h-20 rotate-12" />
                      </div>

                      <div className="flex justify-between items-start z-10">
                        <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/15">
                          {item.tier} TIER
                        </span>
                        <span className="text-xs font-mono font-semibold flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {item.poin.toLocaleString("id-ID")} Poin
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base tracking-tight mt-4 z-10 truncate">
                        {item.nama}
                      </h3>
                    </div>

                    {/* Coupon Card Bottom Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4 bg-white">
                      <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">
                        {item.deskripsi}
                      </p>

                      <div className="pt-2">
                        {isAffordable ? (
                          <button
                            type="button"
                            onClick={() => handleRedeemClick(item)}
                            className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-750 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border-0"
                          >
                            <Ticket className="w-4 h-4" />
                            Tukarkan Sekarang
                          </button>
                        ) : (
                          <div className="w-full py-2.5 px-4 bg-neutral-100 text-neutral-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-neutral-200 cursor-not-allowed select-none">
                            <Info className="w-4 h-4" />
                            Poin Tidak Cukup
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "kupon-saya" && (
        <div className="space-y-4">
          {filteredHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center max-w-md mx-auto">
              <History className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-neutral-700">
                Kupon tidak ditemukan
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Klaim kupon reward favorit Anda terlebih dahulu.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl">
              {filteredHistory.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all relative overflow-hidden"
                  >
                    {/* Status Badge Tag */}
                    <div className="absolute right-5 top-5">
                      {item.status === "aktif" ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                          AKTIF
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-500 border border-neutral-200 uppercase tracking-wider">
                          DIGUNAKAN
                        </span>
                      )}
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0">
                        <Ticket className="w-5 h-5 text-neutral-500" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-neutral-900 leading-snug">
                          {item.kupon.nama}
                        </h4>
                        <p className="text-[10px] text-neutral-400 font-bold tracking-wide">
                          KODE: {item.kodeUnik}
                        </p>
                        <p className="text-[11px] text-neutral-500 flex items-center gap-1.5 pt-1">
                          📅 Ditukar:{" "}
                          {new Date(item.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}{" "}
                          pukul{" "}
                          {new Date(item.createdAt)
                            .getHours()
                            .toString()
                            .padStart(2, "0")}
                          .
                          {new Date(item.createdAt)
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")}
                        </p>
                      </div>
                    </div>

                    {/* QR Code detail button action */}
                    <div className="border-t border-neutral-100 pt-3 flex justify-between items-center">
                      <span className="text-[11px] font-mono font-bold text-neutral-500">
                        -{item.kupon.poin.toLocaleString("id-ID")} Poin
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveQrKupon(item)}
                        className="py-1.5 px-4 bg-slate-50 hover:bg-slate-100 text-neutral-700 border border-neutral-200 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        🖳 Lihat Detail & QR Code
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!selectedKupon}
        onClose={() => setSelectedKupon(null)}
        onConfirm={handleConfirmRedeem}
        message={`Apakah Anda yakin ingin menukarkan ${selectedKupon?.poin.toLocaleString("id-ID")} poin dengan kupon "${selectedKupon?.nama}"?`}
        isPending={isPending}
        variant="success"
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />

      {/* QR Validator Code view modal */}
      {activeQrKupon && (
        <QrModal
          isOpen={!!activeQrKupon}
          onClose={() => setActiveQrKupon(null)}
          couponName={activeQrKupon.kupon.nama}
          uniqueCode={activeQrKupon.kodeUnik}
          poin={activeQrKupon.kupon.poin}
          status={activeQrKupon.status}
          deskripsi={activeQrKupon.kupon.deskripsi}
        />
      )}
    </div>
  );
}
