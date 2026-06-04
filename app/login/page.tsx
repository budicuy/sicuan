"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Leaf,
  Lock,
  Recycle,
  Shield,
  ShieldAlert,
  TrendingUp,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { loginAction } from "./action";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Use React 19 useActionState to bind the server action
  const [state, formAction, isPending] = useActionState(loginAction, null);

  // Trigger success screen when server action returns success
  useEffect(() => {
    if (state?.success) {
      setLoginSuccess(true);
    }
  }, [state]);

  return (
    <div className="min-h-screen flex bg-neutral-50 text-neutral-900 selection:bg-primary-200 overflow-hidden font-sans">
      {/* LEFT SIDE: Beautiful Interactive Environmental Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-primary-950 via-primary-900 to-emerald-850 text-white p-12 relative flex-col justify-between overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-600/30 group-hover:scale-105 transition-transform duration-300">
              <Recycle className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
                SICUAN
                <span className="text-[10px] bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full font-medium border border-primary-500/30">
                  Official Portal
                </span>
              </span>
              <p className="text-[9px] text-primary-300 font-medium tracking-wider uppercase leading-none mt-0.5">
                PT. Indofood CBP Sukses Makmur Tbk
              </p>
            </div>
          </Link>
        </div>

        {/* Center Illustration & Dynamic Info Card */}
        <div className="relative z-10 my-auto py-12 max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              Sistem Informasi Cerdas Ubah Anorganik Jadi Nilai
            </h1>
            <p className="text-primary-200/90 text-sm leading-relaxed">
              Gabung bersama ribuan mitra dan konsumen dalam mendaur ulang
              limbah kemasan produk Indofood menjadi poin reward atau dana tunai
              langsung.
            </p>
          </div>

          {/* Environmental Commitment Card */}
          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold tracking-widest text-primary-300 uppercase">
                Keamanan &amp; Transparansi
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                SSL Secured
              </span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-white/10 text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white">
                Sistem Autentikasi SICUAN
              </h3>
            </div>
            <p className="text-xs text-primary-100/90 leading-relaxed mb-4">
              Akses akun Anda dilindungi dengan enkripsi tingkat tinggi demi
              menjaga keamanan data profil, histori setoran, saldo reward, dan
              rekening bank Anda.
            </p>
            <div className="h-px bg-white/10 my-3" />
            <div className="flex items-center justify-between text-[11px] text-primary-200">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />{" "}
                Real-time tracking
              </span>
              <span className="flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" /> Zero Waste
                Initiative
              </span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10 text-xs text-primary-300/80">
          &copy; {new Date().getFullYear()} PT. Indofood CBP Sukses Makmur Tbk —
          Noodle Division Banjarmasin. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Elegant Responsive Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 relative overflow-y-auto">
        {/* Top bar with back to home link */}
        <div className="flex justify-between items-center w-full mb-8 lg:mb-0">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-primary-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Beranda
          </Link>
          <div className="lg:hidden w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-md">
            <Recycle className="w-5 h-5 animate-spin-slow" />
          </div>
        </div>

        {/* Login Container */}
        <div className="my-auto max-w-md w-full mx-auto py-8 space-y-8">
          {/* Success screen overlay */}
          <AnimatePresence mode="wait">
            {loginSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-8 space-y-6"
              >
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                    Autentikasi Berhasil!
                  </h2>
                  <p className="text-sm text-neutral-500 max-w-xs mx-auto">
                    Selamat datang kembali,{" "}
                    <span className="font-semibold text-primary-700">
                      {state?.user?.name}
                    </span>
                    . Anda berhasil masuk sebagai{" "}
                    <span className="font-bold capitalize">
                      {state?.user?.role}
                    </span>
                    .
                  </p>
                </div>

                {/* Simulated Dashboard Loading */}
                <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 flex items-center gap-3 text-left">
                  <div className="w-2 h-2 rounded-full bg-primary-600 animate-ping" />
                  <span className="text-xs font-medium text-primary-800">
                    Mengarahkan Anda ke panel dashboard pribadi...
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setLoginSuccess(false)}
                  className="text-xs font-bold text-neutral-400 hover:text-neutral-600 transition-colors block mx-auto underline cursor-pointer text-center bg-transparent border-0"
                >
                  Keluar dari Simulasi
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Heading */}
                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900">
                    Masuk ke Akun
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Masukkan username dan kata sandi Anda untuk mengakses
                    layanan.
                  </p>
                </div>

                {/* Form */}
                <form action={formAction} className="space-y-5">
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

                  {/* Info helper showing credentials */}
                  <div className="p-3 bg-neutral-100 rounded-xl border border-neutral-200/50 text-[10px] text-neutral-600 space-y-1">
                    <span className="font-bold block text-neutral-700 text-xs mb-1">
                      Akun Demo untuk Uji Coba:
                    </span>
                    <div>
                      •{" "}
                      <span className="font-medium text-neutral-700">
                        superadmin.sicuan
                      </span>{" "}
                      (Pass:{" "}
                      <span className="font-medium text-neutral-700">
                        PasswordSuper123
                      </span>
                      )
                    </div>
                    <div>
                      •{" "}
                      <span className="font-medium text-neutral-700">
                        admin.banjarmasin
                      </span>{" "}
                      (Pass:{" "}
                      <span className="font-medium text-neutral-700">
                        PasswordAdmin456
                      </span>
                      )
                    </div>
                    <div>
                      •{" "}
                      <span className="font-medium text-neutral-700">
                        budi.santoso
                      </span>{" "}
                      (Pass:{" "}
                      <span className="font-medium text-neutral-700">
                        BudiSetorSampah88
                      </span>
                      )
                    </div>
                  </div>

                  {/* Username Field */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="username"
                      className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
                    >
                      Username / ID Pengguna
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
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-sm transition-all focus:outline-none focus:ring-2 focus:border-primary-600 focus:ring-primary-600/15"
                        placeholder="Masukkan username Anda"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label
                        htmlFor="password"
                        className="text-xs font-bold text-neutral-700 uppercase tracking-wider"
                      >
                        Kata Sandi
                      </label>
                      <button
                        type="button"
                        onClick={(e) => e.preventDefault()}
                        className="text-xs text-primary-600 hover:text-primary-700 font-semibold transition-colors cursor-pointer bg-transparent border-0 p-0"
                      >
                        Lupa Password?
                      </button>
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
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-neutral-200 text-sm transition-all focus:outline-none focus:ring-2 focus:border-primary-600 focus:ring-primary-600/15"
                        placeholder="Masukkan kata sandi Anda"
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
                    className="w-full py-3.5 px-5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed group text-sm"
                  >
                    {isPending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Memverifikasi Akun...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk ke Dashboard</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom mobile disclaimer */}
        <div className="text-[10px] text-neutral-400 text-center w-full max-w-xs mx-auto lg:hidden pt-4 border-t border-neutral-100">
          &copy; {new Date().getFullYear()} PT. Indofood CBP Sukses Makmur Tbk.
        </div>
      </div>
    </div>
  );
}
