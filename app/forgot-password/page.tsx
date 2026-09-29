"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Mail,
  MessageSquare,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useActionState, useState } from "react";
import { TransitionLink } from "@/app/components/shared/PageTransitionProvider";
import { requestResetAction } from "@/app/forgot-password/action";

export default function ForgotPasswordPage() {
  const [method, setMethod] = useState<"username" | "email">("username");
  const [value, setValue] = useState("");
  const [state, formAction, isPending] = useActionState(
    requestResetAction,
    null,
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isPending) {
      e.preventDefault();
      return;
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral-50 text-neutral-900 selection:bg-primary-200 overflow-hidden font-sans">
      {/* LEFT SIDE: Beautiful Environmental Branding (hidden on mobile) */}
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
              Atur Ulang Kata Sandi Anda
            </h1>
            <p className="text-primary-200/90 text-sm leading-relaxed">
              Kami mempermudah pemulihan akses akun Anda. Cukup gunakan username
              atau email terdaftar untuk menerima instruksi pemulihan aman.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-primary-300/80">
          &copy; {new Date().getFullYear()} PT. Indofood Sukses Makmur Tbk —
          Noodle Division Banjarmasin. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Forgot Password Form */}
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
                Lupa Password
              </h2>
              <p className="text-xs text-neutral-500">
                Pilih metode pemulihan dan masukkan data akun Anda.
              </p>
            </div>

            {/* Success State */}
            {state?.success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3"
              >
                <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-sm mb-1">
                    Permintaan Terkirim!
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
            )}

            {/* Need Admin Assistance State */}
            {!state?.success && state?.contactAdmin && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-start gap-3"
              >
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block text-sm mb-1">
                    Hubungi Admin
                  </span>
                  <p className="text-xs leading-relaxed">{state.message}</p>
                  <a
                    href="https://wa.me/6282251510087"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors duration-200 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Hubungi via WhatsApp</span>
                  </a>
                </div>
              </motion.div>
            )}

            {/* Standard Form */}
            {(!state?.success || state?.error) && (
              <form
                onSubmit={handleSubmit}
                action={formAction}
                className="space-y-6"
              >
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

                {/* Method selector tabs */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                    Metode Pemulihan
                  </span>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setMethod("username");
                        setValue("");
                      }}
                      className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        method === "username"
                          ? "bg-white text-primary-700 shadow-xs"
                          : "text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      NIK / Username
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMethod("email");
                        setValue("");
                      }}
                      className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        method === "email"
                          ? "bg-white text-primary-700 shadow-xs"
                          : "text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      Email
                    </button>
                  </div>
                </div>

                {/* Input Method field */}
                <input type="hidden" name="method" value={method} />

                <div className="space-y-1.5">
                  <label
                    htmlFor="value"
                    className="text-xs font-bold text-neutral-700 uppercase tracking-wider block"
                  >
                    {method === "username"
                      ? "Masukkan NIK / Username"
                      : "Masukkan Email"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      {method === "username" ? (
                        <User className="w-4.5 h-4.5" />
                      ) : (
                        <Mail className="w-4.5 h-4.5" />
                      )}
                    </div>
                    <input
                      id="value"
                      name="value"
                      type={method === "username" ? "text" : "email"}
                      required
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-sm transition-all focus:outline-none focus:ring-2 focus:border-primary-600 focus:ring-primary-600/15"
                      placeholder={
                        method === "username"
                          ? "Contoh: 12345678 atau budi.santoso"
                          : "Contoh: budi@gmail.com"
                      }
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
                      <span>Memproses Permintaan...</span>
                    </>
                  ) : (
                    <>
                      <span>Kirim Link Reset Password</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-[10px] text-neutral-400 text-center w-full max-w-xs mx-auto lg:hidden pt-4 border-t border-neutral-100">
          &copy; {new Date().getFullYear()} PT. Indofood Sukses Makmur Tbk.
        </div>
      </div>
    </div>
  );
}
