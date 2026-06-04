"use client";

import { Recycle } from "lucide-react";
import { motion } from "motion/react";

export function SplashScreen() {
  return (
    <motion.div
      key="splash"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-primary-950 text-white select-none"
      exit={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
      transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-20 h-20 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-xl shadow-primary-600/30 mb-6"
      >
        <Recycle className="w-12 h-12 animate-spin-slow" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-3xl font-extrabold tracking-widest text-white flex items-center gap-2"
      >
        SICUAN
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="text-xs text-primary-300 uppercase tracking-widest mt-2"
      >
        Ubah Anorganik Jadi Nilai
      </motion.p>
    </motion.div>
  );
}
