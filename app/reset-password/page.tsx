"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState, useState } from "react";
import { TransitionLink } from "@/app/components/shared/PageTransitionProvider";
import { resetPasswordAction } from "@/app/reset-password/action";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Bind token to action
  const resetActionWithToken = resetPasswordAction.bind(null, token);
  const [state, formAction, isPending] = useActionState(
    resetActionWithToken,
    null,
  );

  if (!token) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-sm mb-1">
            Token Tidak Ditemukan
          </span>
          <p className="text-xs leading-relaxed">
            Link reset password tidak valid atau tidak menyertakan token
            verifikasi. Silakan minta link reset password baru.
          </p>
          <TransitionLink
            href="/forgot-password"
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
          >
            Minta Link Baru <ArrowRight className="w-3.5 h-3.5" />
          </TransitionLink>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {state?.success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3"
        >
          <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm mb-1">
              Password Berhasil Diubah!
            </span>
            <p className="text-xs leading-relaxed">{state.message}</p>
            <TransitionLink
              href="/login"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Masuk Sekarang <ArrowRight className="w-3.5 h-3.5" />
            </TransitionLink>
          </div>
        </motion.div>
      ) : (
        <form action={formAction} className="space-y-5">
          {state?.error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{state.error}</span>
            </motion.div>
          )}

          {/* New Password Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
            >
              Kata Sandi Baru
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
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-neutral-200 text-sm transition-all focus:outline-none focus:ring-2 focus:border-primary-600 focus:ring-primary-600/15"
                placeholder="Masukkan kata sandi baru"
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

          {/* Confirm New Password Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
            >
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-neutral-200 text-sm transition-all focus:outline-none focus:ring-2 focus:border-primary-600 focus:ring-primary-600/15"
                placeholder="Ulangi kata sandi baru"
              />
            </div>
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
                <span>Memperbarui Kata Sandi...</span>
              </>
            ) : (
              <>
                <span>Perbarui Kata Sandi</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex bg-neutral-50 text-neutral-900 selection:bg-primary-200 overflow-hidden font-sans">
      {/* LEFT SIDE: Beautiful Environmental Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-tr from-primary-950 via-primary-900 to-emerald-850 text-white p-12 relative flex-col justify-between overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

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
                PT. Indofood Sukses Makmur Tbk
              </p>
            </div>
          </TransitionLink>
        </div>

        <div className="relative z-10 my-auto py-12 max-w-md space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              Tentukan Kata Sandi Baru Anda
            </h1>
            <p className="text-primary-200/90 text-sm leading-relaxed">
              Buat kata sandi yang kuat dan aman untuk akun Anda. Jangan gunakan
              kata sandi yang mudah ditebak.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-primary-300/80">
          &copy; {new Date().getFullYear()} PT. Indofood Sukses Makmur Tbk —
          Noodle Division Banjarmasin. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Reset Password Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 relative overflow-y-auto">
        <div className="flex justify-between items-center w-full mb-8 lg:mb-0">
          <TransitionLink
            href="/login"
            className="flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-primary-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Halaman Masuk
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

        <div className="my-auto max-w-md w-full mx-auto py-8 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-2">
                Ubah Kata Sandi
              </h2>
              <p className="text-xs text-neutral-500">
                Masukkan kata sandi baru untuk akun SICUAN Anda.
              </p>
            </div>

            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
                </div>
              }
            >
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>

        <div className="text-[10px] text-neutral-400 text-center w-full max-w-xs mx-auto lg:hidden pt-4 border-t border-neutral-100">
          &copy; {new Date().getFullYear()} PT. Indofood Sukses Makmur Tbk.
        </div>
      </div>
    </div>
  );
}
