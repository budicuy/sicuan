"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Building2,
  Eye,
  EyeOff,
  Leaf,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { getActiveMediaSlider } from "@/app/(admin-superadmin)/video-post/action";
import { MediaSlider } from "@/app/components/shared/MediaSlider";
import {
  TransitionLink,
  usePageTransition,
} from "@/app/components/shared/PageTransitionProvider";
import { loginAction } from "@/app/login/action";
import type { VideoPost } from "@/app/types";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mediaItems, setMediaItems] = useState<VideoPost[]>([]);
  const _router = useRouter();
  const { transitionTo } = usePageTransition();

  // Use React 19 useActionState to bind the server action
  const [state, formAction, isPending] = useActionState(loginAction, null);

  useEffect(() => {
    getActiveMediaSlider().then(setMediaItems);
  }, []);

  // Redirect directly to dashboard when server action returns success
  useEffect(() => {
    if (state?.success) {
      transitionTo("/dashboard");
    }
  }, [state, transitionTo]);

  return (
    <div className="h-screen w-screen flex bg-neutral-50 text-neutral-900 selection:bg-primary-200 overflow-hidden font-sans">
      {/* LEFT SIDE: Compact, No-Scroll World-Class Ecosystem & Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 h-full bg-linear-to-br from-slate-950 via-primary-950 to-emerald-950 text-white p-8 xl:p-12 relative flex-col justify-between overflow-hidden select-none">
        {/* Background Grid Pattern & Ambient Glows */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <TransitionLink href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white border border-white p-2 flex items-center justify-center shadow-md group-hover:scale-105 transition-all duration-300">
              <Image
                src="/logo.png"
                alt="SICUAN Logo"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                SICUAN
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 tracking-wide uppercase">
                  Official
                </span>
              </span>
              <p className="text-[8px] text-primary-300 font-semibold tracking-wider uppercase leading-none mt-0.5">
                PT. Indofood Sukses Makmur Tbk
              </p>
            </div>
          </TransitionLink>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-[10px] text-primary-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sistem Sirkular Aktif</span>
          </div>
        </div>

        {/* Center Hero & Value Proposition */}
        <div className="relative z-10 my-auto py-4 max-w-lg space-y-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-500/20 border border-primary-400/30 text-emerald-300 text-[11px] font-bold tracking-wide">
              <Sparkles className="w-3 h-3" />
              <span>SICUAN - PT. INDOFOOD</span>
            </div>
            <h1 className="text-2xl xl:text-3xl font-black tracking-tight leading-tight text-white">
              Sistem Informasi Cerdas <br />
              <span className="bg-linear-to-r from-emerald-400 via-primary-300 to-amber-300 bg-clip-text text-transparent">
                Ubah Anorganik Jadi Nilai
              </span>
            </h1>
            <p className="text-primary-100/85 text-xs leading-relaxed">
              Integrasi cerdas pengelolaan sampah kemasan produk Indofood
              (Karton, Etiket Plastik, dan Paper Cup) untuk mewujudkan masa
              depan bebas limbah.
            </p>
          </div>

          {/* 3 User Roles / Pathways Highlight */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold tracking-widest text-primary-300 uppercase block">
              3 Ekosistem Kemitraan SICUAN
            </span>
            <div className="grid grid-cols-3 gap-2">
              {/* Konsumen */}
              <div className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors backdrop-blur-sm group">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-1.5 group-hover:scale-105 transition-transform">
                  <User className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-white">Konsumen</h4>
                <p className="text-[9px] text-primary-200/80 mt-0.5 leading-snug">
                  Daur ulang kemasan dan dapatkan reward.
                </p>
              </div>

              {/* Warmindo */}
              <div className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors backdrop-blur-sm group">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-1.5 group-hover:scale-105 transition-transform">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-white">Warmindo</h4>
                <p className="text-[9px] text-amber-200/80 mt-0.5 leading-snug">
                  Kelola kemasan dan raih berbagai hadiah.
                </p>
              </div>

              {/* Bank Sampah */}
              <div className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors backdrop-blur-sm group">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 mb-1.5 group-hover:scale-105 transition-transform">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-white">Bank Sampah</h4>
                <p className="text-[9px] text-sky-200/80 mt-0.5 leading-snug">
                  Pusat pengumpulan dan verifikasi kemasan.
                </p>
              </div>
            </div>
          </div>

          {/* System Guarantees & Features */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-between gap-2 text-[10px] text-primary-200">
            <div className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Verifikasi AI Otomatis</span>
            </div>
            <div className="h-3 w-px bg-white/15" />
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-400 shrink-0" />
              <span>Enkripsi SSL 256-Bit</span>
            </div>
            <div className="h-3 w-px bg-white/15" />
            <div className="flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Zero Waste</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Division Info */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-primary-300/80">
          <span>
            &copy; {new Date().getFullYear()} PT. Indofood Sukses Makmur Tbk
          </span>
          <span className="text-[9px] font-medium text-emerald-300/90">
            Noodle Division Banjarmasin
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: Elegant Card Login Container with Background Grid */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between p-6 sm:p-10 xl:p-12 relative overflow-y-auto overflow-x-hidden bg-neutral-100/50">
        {/* Background Grid Pattern & Ambient Glows behind the Card */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-72 h-72 bg-primary-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar with back to home link */}
        <div className="relative z-10 flex justify-between items-center w-full mb-4 lg:mb-0">
          <TransitionLink
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-primary-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Beranda
          </TransitionLink>
          <div className="lg:hidden w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shadow-xs">
            <Image
              src="/logo.png"
              alt="SICUAN Logo"
              width={18}
              height={18}
              className="object-contain"
            />
          </div>
        </div>

        {/* Elevated White Login Card */}
        <div className="relative z-10 my-auto max-w-md w-full mx-auto p-6 sm:p-8 bg-white rounded-3xl border border-neutral-200 shadow-xl shadow-neutral-900/5 space-y-4">
          <div className="space-y-4">
            {/* Heading */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
                Masuk ke Akun
              </h2>
              <p className="text-xs text-neutral-500">
                Masukkan NIK &amp; tanggal lahir (atau username &amp; kata
                sandi) Anda untuk mengakses layanan.
              </p>
            </div>

            {/* Form */}
            <form action={formAction} className="space-y-3.5">
              {/* Server Validation Alert */}
              {state?.error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5"
                >
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Gagal Masuk</span>
                    {state.error}
                  </div>
                </motion.div>
              )}

              {/* Media Slider Foto & Video SICUAN (16:9 Aspect Ratio) */}
              {mediaItems.length > 0 && (
                <div className="rounded-2xl overflow-hidden shadow-xs border border-neutral-200">
                  <MediaSlider items={mediaItems} autoPlay />
                </div>
              )}

              {/* Username Field */}
              <div className="space-y-1">
                <label
                  htmlFor="username"
                  className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
                >
                  NIK / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50/60 border border-neutral-200 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:border-primary-600 focus:ring-primary-600/15"
                    placeholder="Masukkan NIK atau username Anda"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="text-xs font-bold text-neutral-700 uppercase tracking-wider"
                  >
                    Tanggal Lahir / Kata Sandi
                  </label>
                  <TransitionLink
                    href="/forgot-password"
                    className="text-xs text-primary-600 hover:text-primary-700 font-semibold transition-colors cursor-pointer bg-transparent border-0 p-0"
                  >
                    Lupa Password?
                  </TransitionLink>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-neutral-50/60 border border-neutral-200 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:border-primary-600 focus:ring-primary-600/15"
                    placeholder="Contoh: 240368 atau password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    title={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Keep logged in check */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-offset-0 accent-primary-600"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-xs text-neutral-600 select-none cursor-pointer"
                >
                  Biarkan saya tetap masuk
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 px-5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed group text-sm"
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center text-xs text-neutral-500 pt-1">
                Belum memiliki akun?{" "}
                <TransitionLink
                  href="/register"
                  className="text-primary-600 hover:text-primary-700 font-bold hover:underline"
                >
                  Daftar Sekarang
                </TransitionLink>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom mobile disclaimer */}
        <div className="relative z-10 text-[10px] text-neutral-400 text-center w-full max-w-xs mx-auto lg:hidden pt-3 border-t border-neutral-200/60">
          &copy; {new Date().getFullYear()} PT. Indofood Sukses Makmur Tbk.
        </div>
      </div>
    </div>
  );
}
