"use client";

import { Recycle } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export function SplashScreen() {
  const [percent, setPercent] = useState(0);
  const letters = Array.from("SICUAN").map((char, index) => ({
    id: `${char}-${index}`,
    char,
  }));

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      let start = 0;
      const end = 100;
      const duration = 1600;
      const stepTime = duration / end;

      const timer = setInterval(() => {
        start += 1;
        setPercent(start);
        if (start === end) {
          clearInterval(timer);
        }
      }, stepTime);

      return () => clearInterval(timer);
    }, 200);
    return () => clearTimeout(delayTimer);
  }, []);

  // Prevent scroll shifting and horizontal scrollbar bounce on mobile during splash screen
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring" as const, damping: 12, stiffness: 100 },
    },
  };

  return (
    <motion.div
      key="splash"
      className="fixed inset-0 z-100 flex items-center justify-center select-none overflow-hidden"
    >
      {/* Top Panel (Slides Up on exit) */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1/2 bg-[#030e06] z-0"
        exit={{ y: "-100%" }}
        transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
      />

      {/* Bottom Panel (Slides Down on exit) */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#030e06] z-0"
        exit={{ y: "100%" }}
        transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
      />

      {/* Content Container (Fades out on exit) */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center w-full h-full"
        exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Background Grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none -z-20" />

        {/* Ambient moving glows */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary-500/10 blur-[100px] -z-10 animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-[120px] -z-10 animate-pulse [animation-delay:1.5s] pointer-events-none" />

        {/* Pulsing Outer Ring Container for Logo */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Expanded Pulsing Ripples */}
          <div className="absolute w-28 h-28 rounded-full border border-primary-500/20 animate-ping [animation-duration:2.5s]" />
          <div className="absolute w-36 h-36 rounded-full border border-primary-500/10 animate-ping [animation-duration:3.5s] [animation-delay:0.5s]" />

          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-22 h-22 rounded-2xl bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white shadow-2xl shadow-primary-600/30 z-10 border border-primary-400/20"
          >
            <Recycle className="w-12 h-12 animate-spin-slow" />
          </motion.div>
        </div>

        {/* Letter-by-letter Header */}
        <motion.h1
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-4xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-100 to-primary-300 flex items-center justify-center pl-[0.25em]"
        >
          {letters.map((item) => (
            <motion.span key={item.id} variants={letterVariants}>
              {item.char}
            </motion.span>
          ))}
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-xs text-primary-300 uppercase tracking-[0.4em] mt-3 font-semibold pl-[0.4em]"
        >
          Ubah Anorganik Jadi Nilai
        </motion.p>

        {/* Progress Bar Wrapper */}
        <div className="flex flex-col items-center gap-3 mt-12">
          <div className="w-56 h-1.5 bg-primary-950 rounded-full overflow-hidden relative border border-white/5 shadow-inner">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.6, ease: "easeInOut", delay: 0.2 }}
              className="h-full splash-progress-rainbow rounded-full absolute left-0 top-0"
            />
          </div>

          {/* Numeric Counter */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.3 }}
            className="text-[10px] font-mono tracking-widest text-primary-200"
          >
            LOADING {percent}%
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}
