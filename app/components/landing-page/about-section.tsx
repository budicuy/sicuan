"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";

export function AboutSection() {
  return (
    <section
      id="tentang-kami"
      className="py-24 bg-white border-b border-neutral-200/60 scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Kiri: Logo dengan Radial Glow */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            {/* Glow Background */}
            <div
              className="absolute w-80 h-80 sm:w-110 sm:h-110 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse duration-8000"
              style={{
                background:
                  "radial-gradient(circle, rgba(22,163,74,0.1) 0%, rgba(34,197,94,0.05) 50%, rgba(255,255,255,0) 75%)",
              }}
            />

            {/* Logo Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-64 h-64 sm:w-96 sm:h-96 flex items-center justify-center"
            >
              <Image
                src="/logo.png"
                alt="SICUAN Recycle Logo"
                width={384}
                height={384}
                className="object-contain drop-shadow-[0_15px_30px_rgba(22,163,74,0.12)] hover:scale-105 transition-transform duration-500 ease-out"
                priority
              />
            </motion.div>
          </div>

          {/* Kanan: Konten Informasi */}
          <div className="lg:col-span-6 space-y-6">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-bold border border-primary-200/50 shadow-xs"
            >
              Tentang Kami
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight"
            >
              Sistem Informasi{" "}
              <span className="text-primary-600"> Cerdas </span>
              Ubah <span className="text-primary-600">Anorganik</span> Jadi
              <span className="text-primary-600"> Nilai.</span>{" "}
              <span className="text-primary-900">(SICUAN)</span>
            </motion.h2>

            {/* Deskripsi */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-neutral-600 text-base sm:text-lg leading-relaxed font-normal"
            >
              <span className="font-semibold text-neutral-900">SICUAN</span>{" "}
              lahir dari keinginan untuk mengatasi krisis sampah di lingkungan
              operasional PT Indofood Banjarmasin. Bukan sekadar tempat
              pembuangan, kami adalah ekosistem yang mengubah limbah menjadi
              nilai ekonomi sambil menjaga kelestarian alam.
            </motion.p>

            {/* Visi & Nilai Kami Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-neutral-100"
            >
              <div className="space-y-2">
                <h4 className="text-base font-bold text-neutral-900">
                  Visi Kami
                </h4>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Menjadi pusat pengelolaan sampah anorganik PT. Indofood di
                  cabang Banjarmasin, yang mengubah limbah menjadi peluang
                  ekonomi.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-bold text-neutral-900">
                  Nilai Kami
                </h4>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Berkomitmen pada keberlanjutan, inovasi, dan pemberdayaan
                  masyarakat, kami mengubah sampah menjadi sumber daya yang
                  berharga.
                </p>
              </div>
            </motion.div>

            {/* Link Aksi */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="pt-4"
            >
              <a
                href="#fitur"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold transition-colors group cursor-pointer"
              >
                <span>Kenali Kami Lebih Dalam</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
