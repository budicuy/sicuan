"use client";

import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldAlert,
  TrendingUp,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import {
  TransitionLink,
  usePageTransition,
} from "@/app/components/shared/PageTransitionProvider";
import { registerAction } from "@/app/register/action";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nik, setNik] = useState("");
  const [email, setEmail] = useState("");
  const [noTelepon, setNoTelepon] = useState("");

  const { transitionTo } = usePageTransition();

  // Use React 19 useActionState to bind the server action
  const [state, formAction, isPending] = useActionState(registerAction, null);

  // Redirect directly to dashboard when server action returns success
  useEffect(() => {
    if (state?.success) {
      transitionTo("/dashboard");
    }
  }, [state, transitionTo]);

  return (
    <div className="min-h-screen flex bg-neutral-50 text-neutral-900 selection:bg-primary-200 overflow-hidden font-sans">
      {/* LEFT SIDE: Beautiful Environmental Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-tr from-primary-950 via-primary-900 to-emerald-850 text-white p-12 relative flex-col justify-between overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <TransitionLink href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/logo.png"
                alt="SICUAN Logo"
                width={24}
                height={24}
                className="object-contain"
              />
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
          </TransitionLink>
        </div>

        {/* Center Illustration & Dynamic Info Card */}
        <div className="relative z-10 my-auto py-12 max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              Mulai Langkah Baikmu Bersama SICUAN
            </h1>
            <p className="text-primary-200/90 text-sm leading-relaxed">
              Daftarkan diri Anda untuk menyetorkan sampah kemasan Indofood,
              dapatkan poin reward menarik atau cairkan saldo tunai secara mudah
              dan cepat.
            </p>
          </div>

          {/* Environmental Commitment Card */}
          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold tracking-widest text-primary-300 uppercase">
                Registrasi Mudah
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                Cepat &amp; Aman
              </span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-white/10 text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white">
                Sistem Akun Terpadu
              </h3>
            </div>
            <p className="text-xs text-primary-100/90 leading-relaxed mb-4">
              Dengan membuat akun, Anda dapat melacak riwayat transaksi setoran,
              penukaran kupon reward, dan mengelola rekening pencairan dana
              dalam satu tempat.
            </p>
            <div className="h-px bg-white/10 my-3" />
            <div className="flex items-center justify-between text-[11px] text-primary-200">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />{" "}
                Pencatatan Otomatis
              </span>
              <span className="flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" /> Indofood
                Lestari
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

      {/* RIGHT SIDE: Elegant Responsive Register Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 relative overflow-y-auto max-h-screen">
        {/* Top bar with back to home link */}
        <div className="flex justify-between items-center w-full mb-6">
          <TransitionLink
            href="/login"
            className="flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-primary-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Sudah punya akun? Masuk
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

        {/* Register Form Container */}
        <div className="my-auto max-w-md w-full mx-auto py-4 space-y-6">
          <div className="space-y-4">
            {/* Heading */}
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900">
                Pendaftaran Akun
              </h2>
              <p className="text-xs text-neutral-500">
                Lengkapi formulir di bawah ini untuk membuat akun baru Anda.
              </p>
            </div>

            {/* Form */}
            <form action={formAction} className="space-y-4">
              {/* Server Validation Alert */}
              {state?.error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5"
                >
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Gagal Mendaftar</span>
                    {state.error}
                  </div>
                </motion.div>
              )}

              {/* Hidden input to pass role value as konsumen */}
              <input type="hidden" name="role" value="konsumen" />

              {/* Nama Lengkap Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
                >
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-sm transition-all focus:outline-none focus:ring-2 focus:border-primary-600 focus:ring-primary-600/15"
                    placeholder="Masukkan nama lengkap Anda"
                  />
                </div>
              </div>

              {/* Email Field (Required) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-sm transition-all focus:outline-none focus:ring-2 focus:border-primary-600 focus:ring-primary-600/15"
                    placeholder="Contoh: nasabah@email.com"
                  />
                </div>
              </div>

              {/* Username Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
                >
                  Username
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-sm transition-all focus:outline-none focus:ring-2 focus:border-primary-600 focus:ring-primary-600/15"
                    placeholder="Contoh: budi.santoso"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
                >
                  Kata Sandi
                </label>
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
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-neutral-200 text-sm transition-all focus:outline-none focus:ring-2 focus:border-primary-600 focus:ring-primary-600/15"
                    placeholder="Password minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* NIK Field (Optional) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="nik"
                  className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between"
                >
                  <span>NIK (Nomor Induk Kependudukan)</span>
                  <span className="text-[10px] text-neutral-400 font-normal lowercase italic">
                    opsional
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Shield className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="nik"
                    name="nik"
                    type="text"
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-sm transition-all focus:outline-none focus:ring-2 focus:border-primary-600 focus:ring-primary-600/15"
                    placeholder="Masukkan 16 digit NIK Anda (opsional)"
                  />
                </div>
              </div>

              {/* No Telepon Field (Optional) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="noTelepon"
                  className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between"
                >
                  <span>No. Telepon</span>
                  <span className="text-[10px] text-neutral-400 font-normal lowercase italic">
                    opsional
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="noTelepon"
                    name="noTelepon"
                    type="tel"
                    value={noTelepon}
                    onChange={(e) => setNoTelepon(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-sm transition-all focus:outline-none focus:ring-2 focus:border-primary-600 focus:ring-primary-600/15"
                    placeholder="Contoh: 08123456789 (opsional)"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 px-5 mt-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed group text-sm"
              >
                {isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mendaftarkan Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Daftar Akun Baru</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom mobile disclaimer */}
        <div className="text-[10px] text-neutral-400 text-center w-full max-w-xs mx-auto lg:hidden pt-4">
          &copy; {new Date().getFullYear()} PT. Indofood CBP Sukses Makmur Tbk.
        </div>
      </div>
    </div>
  );
}
