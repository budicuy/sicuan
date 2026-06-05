"use client";

import {
  CheckCircle2,
  Coins,
  Loader2,
  Recycle,
  Scale,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { getDashboardData } from "./action";

interface DashboardData {
  success: boolean;
  role: string;
  name: string;
  metrics?: {
    totalSetoranKg?: number;
    totalSetoranPending?: number;
    totalSetoranDiterima?: number;
    totalPencairanBerhasil?: number;
    totalPencairanPending?: number;
  };
  profile?: {
    poin: number;
    kredit: number;
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
  recentPencairan?: {
    id: number;
    jumlah: number;
    status: string;
    createdAt: string | Date;
  }[];
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading || !mounted || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-sm font-semibold text-neutral-500">
          Memuat dashboard Anda...
        </p>
      </div>
    );
  }

  const name = data.name;
  const hasCompositionData = data.composition?.some((c) => c.value > 0);
  const hasHistoryData = data.setoranHistory && data.setoranHistory.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Welcome Board */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20 shrink-0">
            <Coins className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Halo Mitra, <span className="text-primary-600">{name}</span>!
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Dashboard Kemitraan Bank Sampah SICUAN — Cairkan reward tunai dari
              kontribusi Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance Card */}
        <div className="bg-gradient-to-tr from-primary-950 via-primary-900 to-emerald-850 text-white rounded-2xl p-5 shadow-md relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 sm:col-span-2">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-[10px] font-bold text-primary-300 uppercase tracking-widest block">
            KREDIT CAIR SEBAGAI UANG
          </span>
          <div className="flex justify-between items-end mt-4">
            <div>
              <span className="text-[9px] text-primary-200">
                Saldo Kredit Tersedia
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5">
                Rp {data.profile?.kredit?.toLocaleString("id-ID") ?? 0}
              </h2>
            </div>
            <Coins className="w-8 h-8 text-emerald-400 shrink-0 mb-1" />
          </div>
        </div>

        {/* Total Setoran */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div>
            <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider text-neutral-405 block">
              Total Setoran
            </span>
            <h2 className="text-xl font-black text-neutral-800 tracking-tight mt-1.5">
              {data.metrics?.totalSetoranKg ?? 0} Kg
            </h2>
          </div>
          <div className="w-9 h-9 rounded-xl bg-neutral-50 border border-neutral-200/50 flex items-center justify-center text-neutral-500 shrink-0">
            <Scale className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Total Pencairan */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div>
            <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider text-neutral-405 block">
              Cair Berhasil
            </span>
            <h2 className="text-xl font-black text-neutral-800 tracking-tight mt-1.5 text-emerald-600">
              Rp{" "}
              {data.metrics?.totalPencairanBerhasil?.toLocaleString("id-ID") ??
                0}
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
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between h-[320px]">
          <h3 className="font-bold text-xs text-neutral-800 border-b border-neutral-100 pb-3 mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary-600" />
            Riwayat Volume Setoran Kemitraan (Kg)
          </h3>
          {hasHistoryData ? (
            <div className="flex-1 w-full h-full">
              <ResponsiveContainer width="100%" height={240} minWidth={0}>
                <AreaChart
                  data={data.setoranHistory}
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
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col min-h-[320px]">
          <h3 className="font-bold text-xs text-neutral-800 border-b border-neutral-100 pb-3 mb-4">
            Komposisi Bahan Disetor
          </h3>
          {hasCompositionData ? (
            <div className="flex-1 w-full relative flex flex-col items-center justify-center">
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height={170} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={data.composition}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data.composition?.map((entry) => (
                        <Cell key={`donut-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Kg`, "Berat"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-3 border-t border-neutral-100 grid grid-cols-3 gap-2 text-center text-xs w-full">
                {data.composition?.map((entry) => (
                  <div key={entry.name} className="space-y-1">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-500 font-medium">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="truncate max-w-[80px]">
                        {entry.name}
                      </span>
                    </div>
                    <p className="font-extrabold text-neutral-800">
                      {entry.value} Kg
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {data.recentSetoran && data.recentSetoran.length > 0 ? (
                  data.recentSetoran.map((s) => (
                    <tr key={s.id}>
                      <td
                        className="py-2.5 font-semibold text-neutral-850 truncate max-w-[120px]"
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

        {/* Recent withdrawals */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-neutral-850 flex items-center gap-1.5 pb-2 border-b border-neutral-100">
            <Coins className="w-4 h-4 text-emerald-650" />
            Pencairan Dana Terakhir
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-neutral-400 border-b border-neutral-100">
                  <th className="pb-2 font-semibold">Tanggal</th>
                  <th className="pb-2 font-semibold">Nominal</th>
                  <th className="pb-2 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {data.recentPencairan && data.recentPencairan.length > 0 ? (
                  data.recentPencairan.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 text-neutral-550">
                        {new Date(p.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2.5 font-bold text-neutral-800">
                        Rp {p.jumlah.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider ${
                            p.status === "berhasil"
                              ? "bg-emerald-50 text-emerald-700"
                              : p.status === "ditolak"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {p.status}
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
                      Belum ada pencairan dana.
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
