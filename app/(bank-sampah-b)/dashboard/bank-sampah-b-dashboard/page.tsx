"use client";

import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Factory,
  Gift,
  Layers,
  Plus,
  Scale,
  Sparkles,
  Store,
  Truck,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getDashboardDataB } from "@/app/(bank-sampah-b)/dashboard/bank-sampah-b-dashboard/action";
import { AnimatedCounter } from "@/app/components/shared/AnimatedCounter";
import {
  type MediaItem,
  MediaSlider,
} from "@/app/components/shared/MediaSlider";
import { TourGuide } from "@/app/components/shared/TourGuide";

const tourSteps = [
  {
    element: "#tour-bank-b-dash-banner",
    popover: {
      title: "Dashboard Bank Sampah Tipe B",
      description:
        "Selamat datang di portal operasional Bank Sampah Tipe B. Pantau saldo reward poin dan riwayat jemput sampah Anda di sini.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-bank-b-dash-kpis",
    popover: {
      title: "Ringkasan Statistik & Poin",
      description:
        "Melihat total saldo poin yang Anda kumpulkan, total kilogram sampah yang dijemput, dan aktivitas bulan berjalan.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-bank-b-dash-sumber",
    popover: {
      title: "Distribusi Sumber Sampah",
      description:
        "Memantau persentase dan volume sampah yang bersumber dari Warmindo, Karyawan, Factory Visit, dan Masyarakat.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-bank-b-dash-recent",
    popover: {
      title: "Penjemputan Terbaru",
      description:
        "Daftar setoran penjemputan sampah terbaru lengkap dengan sumber sampah dan perolehan poin instan.",
      side: "top" as const,
    },
  },
];

interface DashboardData {
  profile: {
    id: number;
    name: string;
    username: string;
    poin: number;
    alamat?: string | null;
    noTelepon?: string | null;
  };
  stats: {
    totalPoin: number;
    totalBeratKg: number;
    totalTransaksi: number;
    thisMonthBeratKg: number;
    thisMonthPoin: number;
  };
  composition: {
    Karton: number;
    Etiket: number;
    "Paper Cup": number;
  };
  sumberDistribution: {
    Warmindo: number;
    Karyawan: number;
    "Factory Visit": number;
    Masyarakat: number;
  };
  recentTransactions: Array<{
    id: number;
    nomorSetor: string;
    jenisSampah: string;
    beratKg: number;
    totalPoin: number;
    tanggalSetor: string;
    status: string;
    sumberSampah?: string | null;
    createdAt: Date;
  }>;
  activeMedia: MediaItem[];
}

export default function BankSampahBDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardDataB().then((res) => {
      if (res.success && res.data) {
        setData(res.data as DashboardData);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-neutral-200 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-neutral-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-neutral-200 rounded-3xl" />
          <div className="h-64 bg-neutral-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  const stats = data?.stats ?? {
    totalPoin: 0,
    totalBeratKg: 0,
    totalTransaksi: 0,
    thisMonthBeratKg: 0,
    thisMonthPoin: 0,
  };

  const sumber = data?.sumberDistribution ?? {
    Warmindo: 0,
    Karyawan: 0,
    "Factory Visit": 0,
    Masyarakat: 0,
  };

  const composition = data?.composition ?? {
    Karton: 0,
    Etiket: 0,
    "Paper Cup": 0,
  };

  const totalSumberKg = Object.values(sumber).reduce((a, b) => a + b, 0) || 1;
  const totalCompKg =
    Object.values(composition).reduce((a, b) => a + b, 0) || 1;

  const sumberConfig: {
    key: keyof typeof sumber;
    label: string;
    icon: typeof Store;
    barColor: string;
    badgeBg: string;
  }[] = [
    {
      key: "Warmindo",
      label: "Warmindo",
      icon: Store,
      barColor: "bg-amber-500",
      badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      key: "Karyawan",
      label: "Karyawan",
      icon: UserCheck,
      barColor: "bg-blue-500",
      badgeBg: "bg-blue-50 text-blue-800 border-blue-200",
    },
    {
      key: "Factory Visit",
      label: "Factory Visit",
      icon: Factory,
      barColor: "bg-purple-500",
      badgeBg: "bg-purple-50 text-purple-800 border-purple-200",
    },
    {
      key: "Masyarakat",
      label: "Masyarakat",
      icon: Users,
      barColor: "bg-emerald-500",
      badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <TourGuide steps={tourSteps} />

      {/* Banner */}
      <div
        id="tour-bank-b-dash-banner"
        className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl"
      >
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide">
              <Truck className="w-3.5 h-3.5" />
              <span>Bank Sampah Tipe B &bull; Unit Penjemputan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Halo, {data?.profile.name || "Mitra Bank Sampah"}!
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-xl">
              Fokus operasional Anda adalah menjemput limbah anorganik kemasan
              Indofood di berbagai titik sumber. Setiap kilogram setoran
              dikonversi langsung menjadi poin reward.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link
              href="/setor-sampah/bank-sampah-b-setor"
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Jemput Sampah Baru</span>
            </Link>
            <Link
              href="/tukar-reward/bank-sampah-b-tukar-reward"
              className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Gift className="w-4 h-4" />
              <span>Tukar Reward</span>
            </Link>
            <Link
              href="/laporan/bank-sampah-b-laporan"
              className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Laporan Setoran</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        id="tour-bank-b-dash-kpis"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Saldo Poin */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs relative overflow-hidden group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Total Poin Reward
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-neutral-900">
                <AnimatedCounter value={stats.totalPoin} />
              </span>
              <span className="text-xs font-bold text-amber-600">POIN</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Reward instan siap digunakan
            </p>
          </div>
          <Link
            href="/tukar-reward/bank-sampah-b-tukar-reward"
            className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <span>Tukar Hadiah</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Total Sampah Dijemput */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Total Dijemput
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900">
              <AnimatedCounter value={stats.totalBeratKg} />
            </span>
            <span className="text-xs font-bold text-emerald-600">KG</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Akumulasi berat diterima
          </p>
        </div>

        {/* Total Transaksi */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Total Transaksi
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900">
              <AnimatedCounter value={stats.totalTransaksi} />
            </span>
            <span className="text-xs font-bold text-teal-600">KALI</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Aktivitas penjemputan
          </p>
        </div>

        {/* Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Bulan Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900">
              <AnimatedCounter value={stats.thisMonthBeratKg} />
            </span>
            <span className="text-xs font-bold text-blue-600">KG</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">
            +{stats.thisMonthPoin} Poin bulan ini
          </p>
        </div>
      </div>

      {/* Two Column Section: Sumber Sampah & Komposisi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribusi Sumber Sampah */}
        <div
          id="tour-bank-b-dash-sumber"
          className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Distribusi Sumber Sampah
                </h3>
                <p className="text-xs text-neutral-500">
                  Volume jemput sampah berdasarkan lokasi asal
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {sumberConfig.map((item) => {
              const Icon = item.icon;
              const kg = Math.round((sumber[item.key] || 0) * 100) / 100;
              const pct = Math.round((kg / totalSumberKg) * 100);

              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-neutral-800">
                      <Icon className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900">
                        {kg} kg
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className={`h-full ${item.barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Komposisi Jenis Sampah */}
        <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Komposisi Jenis Sampah
                </h3>
                <p className="text-xs text-neutral-500">
                  Proporsi fraksi limbah kemasan Indofood
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {[
              {
                key: "Karton",
                label: "Karton",
                color: "bg-amber-600",
                desc: "Kardus & karton box",
              },
              {
                key: "Etiket",
                label: "Etiket Plastik",
                color: "bg-blue-600",
                desc: "Plastik kemasan Indomie",
              },
              {
                key: "Paper Cup",
                label: "Paper Cup",
                color: "bg-rose-600",
                desc: "Gelas kertas Pop Mie",
              },
            ].map((item) => {
              const kg =
                Math.round(
                  (composition[item.key as keyof typeof composition] || 0) *
                    100,
                ) / 100;
              const pct = Math.round((kg / totalCompKg) * 100);

              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-neutral-800">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{
                          backgroundColor: item.color.replace("bg-", ""),
                        }}
                      />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900">
                        {kg} kg
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div
        id="tour-bank-b-dash-recent"
        className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Riwayat Penjemputan Terbaru
              </h3>
              <p className="text-xs text-neutral-500">
                5 aktivitas jemput sampah terakhir Anda
              </p>
            </div>
          </div>
          <Link
            href="/laporan/bank-sampah-b-laporan"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
          >
            <span>Semua Riwayat</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {data?.recentTransactions && data.recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200/60">
                <tr>
                  <th className="py-3 px-4">No. Setor</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Sumber Sampah</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4">Berat</th>
                  <th className="py-3 px-4">Poin</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {data.recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-neutral-50/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                      {tx.nomorSetor}
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {tx.tanggalSetor}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-neutral-800 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full text-[10px]">
                        {tx.sumberSampah || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-800 font-bold">
                      {tx.jenisSampah}
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-900">
                      {tx.beratKg} kg
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-black text-emerald-600">
                        +{tx.totalPoin} Poin
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Diterima
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-400 text-xs">
            Belum ada aktivitas penjemputan sampah yang tercatat.
          </div>
        )}
      </div>

      {/* Media Slider */}
      {data?.activeMedia && data.activeMedia.length > 0 && (
        <div className="rounded-3xl overflow-hidden shadow-xs border border-neutral-200/80">
          <MediaSlider items={data.activeMedia} autoPlay />
        </div>
      )}
    </div>
  );
}
