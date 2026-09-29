"use client";

import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Gift,
  History,
  Loader2,
  MapPin,
  Medal,
  Phone,
  RefreshCw,
  Scale,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Trophy,
  User,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { TourGuide } from "@/app/components/shared/TourGuide";
import {
  getMonthlyTopContributors,
  getRewardHistoryList,
  giveRewardPointsAction,
  type MonthlyTopContributorsResult,
  type RewardHistoryRow,
  type TopContributorItem,
} from "./action";

const BULAN_OPTIONS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

const PRESET_POINTS = [100, 250, 500, 1000, 2500];

const tourSteps = [
  {
    element: "#tour-reward-header",
    popover: {
      title: "Reward Top Kontributor",
      description:
        "Halaman khusus bagi Admin/Superadmin untuk memberikan reward poin apresiasi secara manual kepada 10 kontributor teraktif bulanan (Konsumen & Warmindo).",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-reward-filters",
    popover: {
      title: "Filter Periode & Kategori Mitra",
      description:
        "Pilih bulan, tahun, dan kategori mitra (Semua, Konsumen, atau Warmindo) untuk menampilkan data peringkat 10 besar setoran sampah.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-reward-kpi",
    popover: {
      title: "Statistik Apresiasi",
      description:
        "Pantau total poin yang telah dihadiahkan, rasio kontributor yang sudah menerima reward, serta total volume sampah yang dikumpulkan 10 besar.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-reward-list",
    popover: {
      title: "Peringkat 10 Besar & Aksi Reward",
      description:
        "Lihat kontributor teratas dengan medali peringkat dan klik tombol 'Beri Reward Poin' untuk menghadiahkan poin tambahan ke akun mitra.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-reward-history-btn",
    popover: {
      title: "Riwayat Pemberian Reward",
      description:
        "Lihat catatan riwayat seluruh pemberian poin yang pernah dilakukan oleh admin untuk keperluan audit internal.",
      side: "left" as const,
    },
  },
];

export default function RewardTopKontributorPage() {
  const currentDate = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(
    currentDate.getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    currentDate.getMonth() + 1,
  );
  const [roleFilter, setRoleFilter] = useState<
    "semua" | "konsumen" | "warmindo"
  >("semua");
  const [searchQuery, setSearchQuery] = useState("");

  const [activeTab, setActiveTab] = useState<"leaderboard" | "history">(
    "leaderboard",
  );

  // Data states
  const [data, setData] = useState<MonthlyTopContributorsResult | null>(null);
  const [historyList, setHistoryList] = useState<RewardHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modal State
  const [selectedTarget, setSelectedTarget] =
    useState<TopContributorItem | null>(null);
  const [poinInput, setPoinInput] = useState<number>(500);
  const [catatanInput, setCatatanInput] = useState("");
  const [isSubmitting, startSubmitTransition] = useTransition();

  // Feedback State
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

  // Load Leaderboard Data
  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMonthlyTopContributors(
        selectedYear,
        selectedMonth,
        roleFilter,
      );
      if (res.success && res.data) {
        setData(res.data);
      } else {
        showFeedback(
          "error",
          "Gagal Memuat Data",
          res.message || "Gagal memuat 10 top kontributor.",
        );
      }
    } catch (err) {
      console.error(err);
      showFeedback("error", "Kesalahan", "Terjadi gangguan saat memuat data.");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, roleFilter, showFeedback]);

  // Load History Data
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await getRewardHistoryList(selectedYear, selectedMonth);
      if (res.success && res.data) {
        setHistoryList(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  // Filtered contributors based on search query
  const filteredContributors = useMemo(() => {
    if (!data?.contributors) return [];
    if (!searchQuery.trim()) return data.contributors;
    const q = searchQuery.toLowerCase();
    return data.contributors.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.alamat?.toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  // Year options list
  const yearOptions = useMemo(() => {
    const curY = new Date().getFullYear();
    return [curY + 1, curY, curY - 1, curY - 2];
  }, []);

  // Open Modal
  const handleOpenRewardModal = (target: TopContributorItem) => {
    setSelectedTarget(target);
    setPoinInput(500);
    const monthLabel =
      BULAN_OPTIONS.find((b) => b.value === selectedMonth)?.label ||
      selectedMonth;
    setCatatanInput(
      `Apresiasi Top Kontributor #${target.rank} Periode ${monthLabel} ${selectedYear}`,
    );
  };

  // Submit Reward Action
  const handleSubmitReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget) return;

    if (!poinInput || poinInput <= 0) {
      showFeedback(
        "error",
        "Poin Tidak Valid",
        "Jumlah poin reward harus lebih besar dari 0.",
      );
      return;
    }

    startSubmitTransition(async () => {
      const res = await giveRewardPointsAction({
        userId: selectedTarget.userId,
        periodeTahun: selectedYear,
        periodeBulan: selectedMonth,
        kategori: selectedTarget.role,
        peringkat: selectedTarget.rank,
        totalBeratKg: selectedTarget.totalBeratKg,
        poinReward: poinInput,
        catatan: catatanInput,
      });

      if (res.success) {
        showFeedback("success", "Reward Berhasil Diberikan!", res.message);
        setSelectedTarget(null);
        loadLeaderboard();
        if (activeTab === "history") {
          loadHistory();
        }
      } else {
        showFeedback(
          "error",
          "Gagal Memberikan Reward",
          res.message || "Terjadi kesalahan.",
        );
      }
    });
  };

  // Helper formatting
  const formatBerat = (val: number) => {
    return (Math.round(val * 1000) / 1000).toString();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <TourGuide steps={tourSteps} />

      <FeedbackModal
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* ── HEADER BANNER ── */}
      <div
        id="tour-reward-header"
        className="relative overflow-hidden bg-linear-to-r from-amber-600 via-amber-700 to-amber-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl"
      >
        <div className="absolute top-[-30%] right-[-10%] w-[45%] h-[150%] bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-amber-100 border border-white/20">
              <Trophy className="w-3.5 h-3.5 text-amber-200" />
              <span>Apresiasi Kinerja Mitra</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Reward 10 Top Kontributor
            </h1>
            <p className="text-amber-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Pantau mitra <strong>Konsumen</strong> dan{" "}
              <strong>Warmindo</strong> dengan kontribusi sampah kemasan
              Indofood terbesar di setiap bulan. Admin dapat memberikan reward
              poin secara manual sebagai bentuk apresiasi langsung.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              id="tour-reward-history-btn"
              type="button"
              onClick={() =>
                setActiveTab((prev) =>
                  prev === "leaderboard" ? "history" : "leaderboard",
                )
              }
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                activeTab === "history"
                  ? "bg-white text-amber-900 border-white shadow-md"
                  : "bg-white/15 hover:bg-white/25 text-white border-white/20"
              }`}
            >
              <History className="w-4 h-4" />
              <span>
                {activeTab === "history"
                  ? "Tutup Riwayat"
                  : "Riwayat Pemberian Reward"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                loadLeaderboard();
                if (activeTab === "history") loadHistory();
              }}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all cursor-pointer disabled:opacity-50"
              title="Segarkan Data"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── FILTER PERIODE & KATEGORI ── */}
      <div
        id="tour-reward-filters"
        className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4"
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Period selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs font-bold text-neutral-700">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Periode:</span>
            </div>

            {/* Bulan */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3.5 py-2 rounded-2xl bg-white border border-neutral-200 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer shadow-2xs"
            >
              {BULAN_OPTIONS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>

            {/* Tahun */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3.5 py-2 rounded-2xl bg-white border border-neutral-200 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer shadow-2xs"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100/80 p-1 rounded-2xl self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setRoleFilter("semua")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleFilter === "semua"
                  ? "bg-white text-neutral-900 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Semua Mitra
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("konsumen")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleFilter === "konsumen"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-neutral-500 hover:text-blue-700"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Konsumen
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("warmindo")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleFilter === "warmindo"
                  ? "bg-white text-amber-700 shadow-2xs"
                  : "text-neutral-500 hover:text-amber-700"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Warmindo
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau username..."
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── KPI STATISTICS ── */}
      <div
        id="tour-reward-kpi"
        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
      >
        {/* KPI 1 */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Total Poin Diberikan
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600 mt-2">
            {data?.summary.totalPointsRewarded.toLocaleString("id-ID") ?? 0}
          </p>
          <p className="text-[10px] text-neutral-400 mt-0.5">
            Poin reward periode ini
          </p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Mitra Diberi Reward
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-900 mt-2">
            {data?.summary.rewardedCount ?? 0}{" "}
            <span className="text-xs font-bold text-neutral-400">
              / {data?.summary.topCandidateCount ?? 0}
            </span>
          </p>
          <p className="text-[10px] text-neutral-400 mt-0.5">
            Dari 10 besar kontributor
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Volume Sampah 10 Besar
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-900 mt-2">
            {data?.summary.totalTopWeight
              ? formatBerat(data.summary.totalTopWeight)
              : 0}{" "}
            <span className="text-xs font-semibold text-neutral-500">kg</span>
          </p>
          <p className="text-[10px] text-neutral-400 mt-0.5">
            Akumulasi setoran diterima
          </p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Peringkat #1 Teratas
            </span>
            <div className="w-8 h-8 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center justify-center text-yellow-600">
              <Medal className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm sm:text-base font-black text-neutral-900 mt-2 truncate">
            {data?.contributors[0]?.name || "Belum Ada"}
          </p>
          <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
            {data?.contributors[0]
              ? `${formatBerat(data.contributors[0].totalBeratKg)} kg setoran`
              : "Menunggu data setoran"}
          </p>
        </div>
      </div>

      {/* ── TAB CONTENT: LEADERBOARD OR RIWAYAT ── */}
      {activeTab === "history" ? (
        /* PANEL RIWAYAT PEMBERIAN REWARD */
        <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                <span>Riwayat Log Pemberian Reward Poin</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Mencatat semua transaksi pemberian reward poin manual oleh admin
                untuk periode {selectedMonth}/{selectedYear}.
              </p>
            </div>
            <span className="text-xs font-bold text-neutral-500 px-3 py-1 bg-neutral-100 rounded-full">
              {historyList.length} Transaksi Tercatat
            </span>
          </div>

          {historyLoading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              <p className="text-xs font-medium">Memuat riwayat reward...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400">
                <Gift className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-neutral-700">
                Belum Ada Riwayat Reward
              </p>
              <p className="text-xs text-neutral-400 max-w-sm">
                Belum ada pemberian reward poin manual yang tercatat pada
                periode bulan {selectedMonth} tahun {selectedYear}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Penerima</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Peringkat</th>
                    <th className="py-3 px-3">Total Setoran</th>
                    <th className="py-3 px-3">Poin Reward</th>
                    <th className="py-3 px-4">Catatan</th>
                    <th className="py-3 px-3">Admin Pemberi</th>
                    <th className="py-3 px-4">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {historyList.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-neutral-800">
                        {row.userName}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            row.userRole === "warmindo"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {row.userRole}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-extrabold text-neutral-700">
                          #{row.peringkat}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-neutral-600">
                        {formatBerat(row.totalBeratKg)} kg
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-amber-600">
                        +{row.poinReward.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-neutral-600 max-w-xs truncate">
                        {row.catatan || "-"}
                      </td>
                      <td className="py-3 px-3 font-semibold text-neutral-700">
                        {row.adminName}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-neutral-400 font-mono">
                        {new Date(row.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* DAFTAR 10 TOP KONTRIBUTOR LEADERBOARD */
        <div id="tour-reward-list" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>
                Peringkat 10 Kontributor Teraktif (
                {BULAN_OPTIONS.find((b) => b.value === selectedMonth)?.label}{" "}
                {selectedYear})
              </span>
            </h2>
            <span className="text-xs font-bold text-neutral-500">
              {filteredContributors.length} Mitra Tampil
            </span>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-16 border border-neutral-200/80 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
              <Loader2 className="w-7 h-7 animate-spin text-amber-600" />
              <p className="text-xs font-semibold text-neutral-500">
                Menghitung volume setoran 10 besar kontributor...
              </p>
            </div>
          ) : filteredContributors.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-dashed border-neutral-300 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-800">
                  Tidak Ada Kontributor Terdata
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-md">
                  Belum ada setoran sampah berstatus diterima untuk mitra{" "}
                  <strong>
                    {roleFilter === "semua"
                      ? "Konsumen & Warmindo"
                      : roleFilter === "warmindo"
                        ? "Warmindo"
                        : "Konsumen"}
                  </strong>{" "}
                  pada periode bulan ini.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredContributors.map((c) => {
                const isGold = c.rank === 1;
                const isSilver = c.rank === 2;
                const isBronze = c.rank === 3;

                return (
                  <div
                    key={c.userId}
                    className={`bg-white rounded-3xl p-5 border transition-all shadow-xs flex flex-col justify-between ${
                      isGold
                        ? "border-amber-300 bg-linear-to-b from-amber-50/40 via-white to-white ring-2 ring-amber-400/20"
                        : isSilver
                          ? "border-slate-300 bg-linear-to-b from-slate-50/30 to-white"
                          : isBronze
                            ? "border-orange-300 bg-linear-to-b from-orange-50/30 to-white"
                            : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div>
                      {/* Card Header: Rank Badge & Role */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100">
                        <div className="flex items-center gap-3">
                          {/* Rank Medal */}
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-xs shrink-0 ${
                              isGold
                                ? "bg-amber-500 text-white ring-4 ring-amber-100"
                                : isSilver
                                  ? "bg-slate-400 text-white ring-4 ring-slate-100"
                                  : isBronze
                                    ? "bg-orange-500 text-white ring-4 ring-orange-100"
                                    : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                            }`}
                          >
                            {isGold ? (
                              <Trophy className="w-5 h-5 text-white" />
                            ) : (
                              <span>#{c.rank}</span>
                            )}
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-neutral-900 leading-snug">
                              {c.name}
                            </h3>
                            <p className="text-[11px] text-neutral-400 font-mono">
                              @{c.username}
                            </p>
                          </div>
                        </div>

                        {/* Role Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            c.role === "warmindo"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {c.role === "warmindo" ? (
                            <ShoppingBag className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          <span>{c.role}</span>
                        </span>
                      </div>

                      {/* Konten Statistik Kontribusi */}
                      <div className="grid grid-cols-2 gap-2.5 my-3.5">
                        <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                            Total Setoran Bulan Ini
                          </span>
                          <p className="text-sm font-black text-neutral-900 mt-0.5">
                            {formatBerat(c.totalBeratKg)}{" "}
                            <span className="text-xs font-semibold text-neutral-500">
                              kg
                            </span>
                          </p>
                          <span className="text-[9.5px] text-neutral-400">
                            {c.setoranCount} kali setoran diterima
                          </span>
                        </div>

                        <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                            Saldo Poin Saat Ini
                          </span>
                          <p className="text-sm font-black text-amber-600 mt-0.5">
                            {c.currentPoin.toLocaleString("id-ID")}{" "}
                            <span className="text-xs font-semibold text-neutral-500">
                              Poin
                            </span>
                          </p>
                          <span className="text-[9.5px] text-neutral-400">
                            Dompet reward aktif
                          </span>
                        </div>
                      </div>

                      {/* Detail Kontak & Alamat */}
                      <div className="space-y-1 text-xs text-neutral-600 pb-3">
                        {c.noTelepon && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <a
                              href={`https://wa.me/${c.noTelepon.replace(/^0/, "62")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:underline font-mono text-[11px]"
                            >
                              {c.noTelepon}
                            </a>
                          </div>
                        )}
                        {c.alamat && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                            <span className="text-[11px] line-clamp-1 text-neutral-500">
                              {c.alamat}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer: Status Reward & Tombol Beri Poin */}
                    <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
                      {c.isRewarded ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            Diberi +
                            {c.totalPoinDiberikan.toLocaleString("id-ID")} Poin
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-500 rounded-xl text-xs font-medium">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Belum Diberi Reward</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenRewardModal(c)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                          c.isRewarded
                            ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200"
                            : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 hover:shadow-amber-600/30"
                        }`}
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>
                          {c.isRewarded ? "Tambah Reward" : "Beri Reward Poin"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL BERI REWARD POIN ── */}
      {selectedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    Beri Reward Poin Manual
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Apresiasi kontributor #{selectedTarget.rank} bulanan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTarget(null)}
                className="p-1 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Profile Card */}
            <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-neutral-900">
                    {selectedTarget.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                      selectedTarget.role === "warmindo"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {selectedTarget.role}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                  @{selectedTarget.username} &bull; Peringkat #
                  {selectedTarget.rank}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">
                  Total Setoran
                </span>
                <span className="text-xs font-black text-neutral-900">
                  {formatBerat(selectedTarget.totalBeratKg)} kg
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReward} className="space-y-4">
              {/* Presets */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                  Pilihan Poin Cepat
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_POINTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPoinInput(preset)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        poinInput === preset
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                          : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200"
                      }`}
                    >
                      +{preset.toLocaleString("id-ID")} Poin
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input Poin */}
              <div className="space-y-1.5">
                <label
                  htmlFor="poinReward"
                  className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
                >
                  Jumlah Poin Reward
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="poinReward"
                    type="number"
                    min={1}
                    value={poinInput || ""}
                    onChange={(e) => setPoinInput(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                    placeholder="Contoh: 500"
                    required
                  />
                </div>
              </div>

              {/* Saldo Simulation */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
                <span>Saldo Poin Saat Ini:</span>
                <span className="font-mono font-bold">
                  {selectedTarget.currentPoin.toLocaleString("id-ID")} Poin
                </span>
              </div>
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900 flex items-center justify-between">
                <span>Saldo Setelah Diberi Reward:</span>
                <span className="font-mono font-black text-emerald-700">
                  {(
                    selectedTarget.currentPoin + (poinInput || 0)
                  ).toLocaleString("id-ID")}{" "}
                  Poin
                </span>
              </div>

              {/* Catatan / Pesan */}
              <div className="space-y-1.5">
                <label
                  htmlFor="catatan"
                  className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
                >
                  Catatan / Pesan Apresiasi (Opsional)
                </label>
                <textarea
                  id="catatan"
                  rows={2}
                  value={catatanInput}
                  onChange={(e) => setCatatanInput(e.target.value)}
                  placeholder="Contoh: Apresiasi Top Kontributor #1 Periode Agustus 2026"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setSelectedTarget(null)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !poinInput || poinInput <= 0}
                  className="flex-1 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Reward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
