"use client";

interface StatsBarProps {
  stats: {
    recycled: number;
    rewards: number;
    partners: number;
    co2: number;
  };
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <section className="bg-primary-950 text-white py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-grid-pattern pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-white/10">
          <div className="p-4">
            <span className="text-[11px] font-bold text-primary-400 uppercase tracking-widest block">
              Total Sampah Didaur Ulang
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold mt-2 block tracking-tight tabular-nums">
              {stats.recycled.toLocaleString("id-ID")} Kg
            </span>
            <p className="text-xs text-neutral-400 mt-1">
              Kemasan Anorganik Produk
            </p>
          </div>

          <div className="p-4 pt-8 lg:pt-4">
            <span className="text-[11px] font-bold text-primary-400 uppercase tracking-widest block">
              Reward Dana Dibayarkan
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold mt-2 block tracking-tight tabular-nums text-emerald-400">
              Rp {stats.rewards.toLocaleString("id-ID")}
            </span>
            <p className="text-xs text-neutral-400 mt-1">
              Ke Seluruh Lapisan Mitra
            </p>
          </div>

          <div className="p-4 pt-8 lg:pt-4">
            <span className="text-[11px] font-bold text-primary-400 uppercase tracking-widest block">
              Mitra Terverifikasi
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold mt-2 block tracking-tight tabular-nums">
              {stats.partners} Mitra
            </span>
            <p className="text-xs text-neutral-400 mt-1">
              Warmiendo &amp; Bank Sampah
            </p>
          </div>

          <div className="p-4 pt-8 lg:pt-4">
            <span className="text-[11px] font-bold text-primary-400 uppercase tracking-widest block">
              Pengurangan Emisi Karbon
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold mt-2 block tracking-tight text-primary-300 tabular-nums">
              {stats.co2.toFixed(3)} Ton
            </span>
            <p className="text-xs text-neutral-400 mt-1">
              Ekuivalen Penyerapan CO₂
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
