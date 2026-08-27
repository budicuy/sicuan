"use client";

import {
  CheckCircle2,
  Coins,
  Gift,
  Recycle,
  Scale,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboardData } from "@/app/(warmindo)/dashboard/warmindo-dashboard/action";
import { AnimatedCounter } from "@/app/components/shared/AnimatedCounter";
import { TourGuide } from "@/app/components/shared/TourGuide";
import { VideoBanner } from "@/app/components/shared/VideoBanner";

const dashboardSteps = [
  {
    element: "#tour-warmindo-dashboard-welcome",
    popover: {
      title: "Selamat Datang Mitra!",
      description:
        "Ini adalah Dashboard Kemitraan Warmindo Anda. Pantau status setoran dan saldo poin hasil daur ulang sampah kemasan PT. Indofood.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-warmindo-dashboard-points",
    popover: {
      title: "Saldo Poin Reward",
      description:
        "Menampilkan akumulasi poin reward Anda (10 poin / 100 gram). Poin ini dapat Anda tukarkan menjadi Uang Tunai atau Hadiah Barang kapan saja.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-warmindo-dashboard-metrics",
    popover: {
      title: "Metrik Kemitraan",
      description:
        "Menampilkan total volume sampah yang disetor serta status klaim reward Anda secara ringkas.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-warmindo-dashboard-performance",
    popover: {
      title: "Grafik Riwayat Setoran",
      description:
        "Grafik ini memvisualisasikan tren volume setoran sampah (dalam kilogram) yang Anda lakukan setiap bulannya.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-warmindo-dashboard-composition",
    popover: {
      title: "Komposisi Bahan Sampah",
      description:
        "Grafik lingkaran ini mengelompokkan sampah yang Anda kirimkan berdasarkan jenisnya (Karton, Etiket, Paper Cup).",
      side: "top" as const,
    },
  },
  {
    element: "#tour-warmindo-dashboard-history",
    popover: {
      title: "Riwayat Transaksi Terbaru",
      description:
        "Tabel ini menunjukkan aktivitas setoran sampah dan penukaran reward terbaru Anda beserta statusnya.",
      side: "top" as const,
    },
  },
];

interface DashboardData {
  success: boolean;
  role: string;
  name: string;
  video?: {
    videoUrl: string;
    judul: string;
    deskripsi?: string | null;
  } | null;
  metrics?: {
    totalSetoranKg?: number;
    totalSetoranPending?: number;
    totalSetoranDiterima?: number;
    totalRewardBerhasil?: number;
    totalRewardPending?: number;
  };
  profile?: {
    poin: number;
  };
  composition?: { name: string; value: number; color: string }[];
  setoranHistory?: {
    date: string;
    Volume: number;
    Poin: number;
  }[];
  recentSetoran?: {
    id: number;
    nomorSetor: string;
    jenisSampah: string;
    beratKg: number;
    status: string;
    tanggalSetor: string;
  }[];
  recentReward?: {
    id: number;
    namaReward: string;
    kategori: string;
    poinDipotong: number;
    nominalUang?: number | null;
    status: string;
    createdAt: string | Date;
  }[];
}

export default function DashboardPage() {
  const [_mounted, setMounted] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [_loading, setLoading] = useState(true);

  const [_isTourActive, setIsTourActive] = useState(false);
  const savedStateRef = useRef<typeof data | null>(null);

  const handleTourStart = () => {
    savedStateRef.current = data;
    setIsTourActive(true);
    setData({
      success: true,
      role: "warmindo",
      name: "Warmindo Bakti Jaya (Demo)",
      metrics: {
        totalSetoranKg: 85,
        totalSetoranPending: 15,
        totalSetoranDiterima: 70,
        totalRewardBerhasil: 3,
        totalRewardPending: 1,
      },
      profile: {
        poin: 3500,
      },
      composition: [
        { name: "Karton", value: 45, color: "#f59e0b" },
        { name: "Etiket", value: 25, color: "#10b981" },
        { name: "Paper Cup", value: 15, color: "#3b82f6" },
      ],
      setoranHistory: [
        { date: "Mei", Volume: 15, Poin: 1500 },
        { date: "Juni", Volume: 35, Poin: 3500 },
        { date: "Juli", Volume: 85, Poin: 8500 },
      ],
      recentSetoran: [
        {
          id: 1,
          nomorSetor: "SIMULASI-W01",
          jenisSampah: "Karton",
          beratKg: 10.0,
          status: "pending",
          tanggalSetor: new Date().toISOString().split("T")[0],
        },
        {
          id: 2,
          nomorSetor: "SIMULASI-W02",
          jenisSampah: "Etiket",
          beratKg: 5.0,
          status: "diterima",
          tanggalSetor: new Date().toISOString().split("T")[0],
        },
      ],
      recentReward: [
        {
          id: 1,
          namaReward: "Uang Tunai Rp 50.000",
          kategori: "uang",
          poinDipotong: 500,
          nominalUang: 50000,
          status: "pending",
          createdAt: new Date(),
        },
      ],
    });
  };

  const handleTourEnd = () => {
    setIsTourActive(false);
    setData(savedStateRef.current as typeof data);
  };

  const loadData = useCallback(() => {
    setLoading(true);
    getDashboardData().then((res) => {
      if (res.success) {
        setData(res as DashboardData);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [loadData]);

  const name = data?.name ?? "-";
  const hasCompositionData =
    data?.composition?.some((c) => c.value > 0) ?? false;
  const hasHistoryData =
    (data?.setoranHistory && data.setoranHistory.length > 0) ?? false;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <TourGuide
        steps={dashboardSteps}
        onStart={handleTourStart}
        onEnd={handleTourEnd}
      />

      {/* Welcome Board */}
      <div
        id="tour-warmindo-dashboard-welcome"
        className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20 shrink-0">
            <Gift className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Halo Mitra, <span className="text-primary-600">{name}</span>!
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Dashboard Kemitraan Warmindo SICUAN — Dapatkan 10 poin per 100
              gram dan tukarkan dengan hadiah pilihan.
            </p>
          </div>
        </div>

        <Link
          href="/tukar-reward"
          className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 hover:scale-[1.02]"
        >
          <Sparkles className="w-4 h-4" /> Tukar Poin Reward
        </Link>
      </div>

      {/* Active Video Banner Display */}
      {data?.video?.videoUrl && (
        <VideoBanner
          videoUrl={data.video.videoUrl}
          judul={data.video.judul}
          deskripsi={data.video.deskripsi}
          autoPlay
        />
      )}

      {/* Metrics Grid */}
      <div
        id="tour-warmindo-dashboard-metrics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Point Balance Card */}
        <div
          id="tour-warmindo-dashboard-points"
          className="bg-linear-to-tr from-primary-950 via-primary-900 to-amber-900 text-white rounded-2xl p-5 shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 sm:col-span-2"
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
            SALDO POIN TERSEDIA
          </span>
          <div className="flex justify-between items-end mt-4">
            <div>
              <span className="text-[9px] text-primary-200">
                10 Poin per 100 gram sampah terverifikasi
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5">
                <AnimatedCounter value={data?.profile?.poin ?? 0} />{" "}
                <span className="text-lg font-bold text-amber-300">Poin</span>
              </h2>
            </div>
            <Coins className="w-8 h-8 text-amber-400 shrink-0 mb-1" />
          </div>
        </div>

        {/* Total Setoran */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div>
            <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
              Total Setoran
            </span>
            <h2 className="text-xl font-black text-neutral-800 tracking-tight mt-1.5">
              <AnimatedCounter
                value={data?.metrics?.totalSetoranKg ?? 0}
                suffix=" Kg"
              />
            </h2>
          </div>
          <div className="w-9 h-9 rounded-xl bg-neutral-50 border border-neutral-200/50 flex items-center justify-center text-neutral-500 shrink-0">
            <Scale className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Total Reward Diklaim */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div>
            <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
              Reward Berhasil
            </span>
            <h2 className="text-xl font-black tracking-tight mt-1.5 text-emerald-600">
              <AnimatedCounter
                value={data?.metrics?.totalRewardBerhasil ?? 0}
                suffix=" Klaim"
              />
            </h2>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Chart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* History Chart */}
        <div
          id="tour-warmindo-dashboard-performance"
          className="lg:col-span-8 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between h-80"
        >
          <h3 className="font-bold text-xs text-neutral-800 border-b border-neutral-100 pb-3 mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary-600" />
            Riwayat Volume Setoran Kemitraan (Kg)
          </h3>
          {hasHistoryData ? (
            <div className="flex-1 w-full h-full">
              <ResponsiveContainer width="100%" height={240} minWidth={0}>
                <AreaChart
                  data={data?.setoranHistory}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="mitraGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={9}
                    tickLine={false}
                  />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      fontSize: "10px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Volume"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#mitraGrad)"
                    name="Berat (Kg)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50/50 rounded-2xl p-6 text-center">
              <ShoppingBag className="w-8 h-8 text-neutral-300 mb-2" />
              <p className="text-xs font-semibold text-neutral-500">
                Belum ada riwayat setoran kemitraan.
              </p>
            </div>
          )}
        </div>

        {/* Waste Composition */}
        <div
          id="tour-warmindo-dashboard-composition"
          className="lg:col-span-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col min-h-80"
        >
          <h3 className="font-bold text-xs text-neutral-800 border-b border-neutral-100 pb-3 mb-4">
            Komposisi Bahan Disetor
          </h3>
          {hasCompositionData ? (
            <div className="flex-1 w-full relative flex flex-col items-center justify-center">
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height={170} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={data?.composition}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data?.composition?.map((entry) => (
                        <Cell key={`donut-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Kg`, "Berat"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-3 border-t border-neutral-100 grid grid-cols-3 gap-2 text-center text-xs w-full">
                {data?.composition?.map((entry) => (
                  <div key={entry.name} className="space-y-1">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-500 font-medium">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="truncate max-w-20">{entry.name}</span>
                    </div>
                    <p className="font-extrabold text-neutral-800">
                      <AnimatedCounter value={entry.value} suffix=" Kg" />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50/50 rounded-2xl p-6 text-center">
              <Recycle className="w-8 h-8 text-neutral-300 mb-2" />
              <p className="text-xs font-semibold text-neutral-500">
                Kategori kosong.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tables Row */}
      <div
        id="tour-warmindo-dashboard-history"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Recent setoran */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-neutral-850 flex items-center gap-1.5 pb-2 border-b border-neutral-100">
            <ShoppingBag className="w-4 h-4 text-primary-650" />
            Setoran Sampah Terakhir
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-neutral-400 border-b border-neutral-100">
                  <th className="pb-2 font-semibold">Nomor</th>
                  <th className="pb-2 font-semibold">Jenis</th>
                  <th className="pb-2 font-semibold">Berat</th>
                  <th className="pb-2 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {data?.recentSetoran && data.recentSetoran.length > 0 ? (
                  data.recentSetoran.map((s) => (
                    <tr key={s.id}>
                      <td
                        className="py-2.5 font-semibold text-neutral-850 truncate max-w-30"
                        title={s.nomorSetor}
                      >
                        {s.nomorSetor}
                      </td>
                      <td className="py-2.5 text-neutral-600">
                        {s.jenisSampah}
                      </td>
                      <td className="py-2.5 font-bold text-neutral-800">
                        {s.beratKg} Kg
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider ${
                            s.status === "diterima"
                              ? "bg-emerald-50 text-emerald-700"
                              : s.status === "ditolak"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-4 text-center text-neutral-400"
                    >
                      Belum ada setoran.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Reward Redemptions */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <h3 className="font-bold text-xs text-neutral-850 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-emerald-650" />
              Penukaran Reward Terakhir
            </h3>
            <Link
              href="/tukar-reward"
              className="text-[10px] text-primary-600 font-bold hover:underline"
            >
              Lihat Semua
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-neutral-400 border-b border-neutral-100">
                  <th className="pb-2 font-semibold">Hadiah</th>
                  <th className="pb-2 font-semibold">Poin</th>
                  <th className="pb-2 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {data?.recentReward && data.recentReward.length > 0 ? (
                  data.recentReward.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 font-bold text-neutral-800">
                        <span className="block truncate max-w-36">
                          {r.namaReward}
                        </span>
                        <span className="text-[9px] font-normal text-neutral-500">
                          {new Date(r.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono font-bold text-neutral-700">
                        {r.poinDipotong} Poin
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider ${
                            r.status === "berhasil"
                              ? "bg-emerald-50 text-emerald-700"
                              : r.status === "ditolak"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-4 text-center text-neutral-400"
                    >
                      Belum ada penukaran reward.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
