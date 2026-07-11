"use client";

import { ArrowRight, Leaf } from "lucide-react";
import { motion } from "motion/react";
import {
  MINI_CARDS,
  type MiniCardData,
} from "@/app/components/landing-page/shared-data";
import { TransitionLink } from "@/app/components/shared/PageTransitionProvider";

// ─── Mini Card Component ──────────────────────────────────────────────────────
function MiniCard({ card }: { card: MiniCardData }) {
  const IconComponent = card.icon;
  return (
    <div
      className={`${card.cardBg} backdrop-blur-md border ${card.cardBorder} rounded-2xl p-4 flex flex-col justify-between shadow-lg h-35 w-full text-white transition-all duration-300 hover:shadow-lg group overflow-hidden relative`}
    >
      {/* Glow dot */}
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${card.glowColor} to-transparent blur-md rounded-full -z-10 group-hover:scale-125 transition-transform duration-500`}
      />

      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center`}
          >
            <IconComponent
              className={`w-4 h-4 ${card.iconColor} group-hover:scale-110 transition-transform duration-300`}
            />
          </div>
          <div>
            <h5 className="text-[11px] font-bold text-white truncate max-w-31.25 leading-tight">
              {card.title}
            </h5>
            {card.subtitle && (
              <p className="text-[9px] text-white/70 truncate max-w-31.25 mt-0.5">
                {card.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[9px] font-semibold text-white/60 uppercase tracking-wider block">
          Volume / Status
        </p>
        <p className="text-sm font-extrabold text-white tracking-tight mt-0.5">
          {card.value}
        </p>
        {card.trend && (
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-[9px] ${card.trendColor} font-semibold`}>
              {card.trend}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 3D Ticker Visual ─────────────────────────────────────────────────────────
function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
      className="lg:col-span-5 relative mt-6 lg:mt-0 overflow-hidden w-full"
    >
      <div className="relative mx-auto max-w-110 lg:max-w-none h-145 overflow-hidden flex items-center justify-center isolate">
        {/* Ambient glows */}
        <div className="absolute top-10 left-10 w-48 h-48 rounded-full bg-primary-600/5 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-56 h-56 rounded-full bg-emerald-500/10 blur-[90px] pointer-events-none" />

        {/* 3D Perspective Grid */}
        <div className="w-full lg:w-[125%] h-full lg:h-[125%] flex gap-4 perspective-[1000px] transform-3d justify-center items-center">
          <div className="grid grid-cols-3 gap-3 w-full max-w-140 transform-[rotateX(15deg)_rotateY(-18deg)_rotateZ(4deg)_scale(0.95)]">
            {/* Column 1 – Scroll Up */}
            <div className="h-150 relative flex flex-col gap-3 py-1 select-none">
              <div className="flex flex-col gap-3 animate-ticker-up hover:[animation-play-state:paused] cursor-pointer">
                {[MINI_CARDS[0], MINI_CARDS[3], MINI_CARDS[6]].map(
                  (card, idx) => (
                    <MiniCard key={`col1-1-${card.id}-${idx}`} card={card} />
                  ),
                )}
                {[MINI_CARDS[0], MINI_CARDS[3], MINI_CARDS[6]].map(
                  (card, idx) => (
                    <MiniCard key={`col1-2-${card.id}-${idx}`} card={card} />
                  ),
                )}
              </div>
            </div>

            {/* Column 2 – Scroll Down */}
            <div className="h-150 relative flex flex-col gap-3 py-1 select-none">
              <div className="flex flex-col gap-3 animate-ticker-down hover:[animation-play-state:paused] cursor-pointer">
                {[MINI_CARDS[1], MINI_CARDS[4], MINI_CARDS[7]].map(
                  (card, idx) => (
                    <MiniCard key={`col2-1-${card.id}-${idx}`} card={card} />
                  ),
                )}
                {[MINI_CARDS[1], MINI_CARDS[4], MINI_CARDS[7]].map(
                  (card, idx) => (
                    <MiniCard key={`col2-2-${card.id}-${idx}`} card={card} />
                  ),
                )}
              </div>
            </div>

            {/* Column 3 – Scroll Up */}
            <div className="h-150 relative flex flex-col gap-3 py-1 select-none">
              <div className="flex flex-col gap-3 animate-ticker-up hover:[animation-play-state:paused] cursor-pointer">
                {[MINI_CARDS[2], MINI_CARDS[5], MINI_CARDS[8]].map(
                  (card, idx) => (
                    <MiniCard key={`col3-1-${card.id}-${idx}`} card={card} />
                  ),
                )}
                {[MINI_CARDS[2], MINI_CARDS[5], MINI_CARDS[8]].map(
                  (card, idx) => (
                    <MiniCard key={`col3-2-${card.id}-${idx}`} card={card} />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fade overlays */}
        <div className="absolute top-0 left-0 right-0 h-36 bg-linear-to-b from-primary-50 via-primary-50/90 to-transparent z-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-linear-to-t from-primary-50 via-primary-50/90 to-transparent z-40 pointer-events-none" />
      </div>
    </motion.div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
export function HeroSection() {
  return (
    <section className="relative pt-12 pb-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, filter: "blur(8px)", y: 15 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold border border-primary-200/60 shadow-sm mx-auto lg:mx-0"
            >
              <Leaf className="w-3.5 h-3.5 text-primary-600 animate-pulse" />
              <span>Program Keberlanjutan Lingkungan Perusahaan</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, filter: "blur(12px)", y: 25 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 leading-[1.1]"
            >
              Sistem Informasi
              <span className="text-primary-600"> Cerdas </span>
              Ubah <span className="text-primary-600">Anorganik</span> Jadi
              <span className="text-primary-600"> Nilai.</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="text-lg text-neutral-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed"
            >
              SICUAN menghubungkan Konsumen, Mitra Warmindo, dan Bank Sampah di
              Banjarmasin untuk mengumpulkan kemasan produk makanan. Setor
              limbah Anda, kumpulkan poin/rupiah, dan bantu wujudkan bumi yang
              lebih hijau.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, filter: "blur(8px)", y: 15 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <TransitionLink
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-600/20 hover:shadow-primary-600/35 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                Mulai Setor Sekarang
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </TransitionLink>
              <a
                href="#mitra"
                className="w-full sm:w-auto px-8 py-4 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 font-bold transition-all duration-300 flex items-center justify-center gap-2 hover:border-neutral-400"
              >
                Pelajari Skema Reward
              </a>
            </motion.div>

            {/* Stats inline */}
            <motion.div
              initial={{ opacity: 0, filter: "blur(8px)", y: 15 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
              className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-200/80 max-w-xl mx-auto lg:mx-0"
            >
              <div>
                <h4 className="text-xl font-bold text-primary-950">100%</h4>
                <p className="text-xs text-neutral-500">Aman & Terpercaya</p>
              </div>
              <div>
                <h4 className="text-xl font-bold text-primary-950">Rp 0</h4>
                <p className="text-xs text-neutral-500">Biaya Administrasi</p>
              </div>
              <div>
                <h4 className="text-xl font-bold text-primary-950">1-2 Hari</h4>
                <p className="text-xs text-neutral-500">Pencairan Cepat</p>
              </div>
            </motion.div>
          </div>

          {/* 3D Ticker Visual */}
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
