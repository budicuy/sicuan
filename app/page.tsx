"use client";

import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { AlurSection } from "@/app/components/landing-page/alur-section";
import { CalculatorSection } from "@/app/components/landing-page/calculator-section";
import { FaqSection } from "@/app/components/landing-page/faq-section";
import { FeaturesSection } from "@/app/components/landing-page/features-section";
import { Footer } from "@/app/components/landing-page/footer";
import { HeroSection } from "@/app/components/landing-page/hero-section";
import { LoginSection } from "@/app/components/landing-page/login-section";
import { MitraSection } from "@/app/components/landing-page/mitra-section";
import { Navbar } from "@/app/components/landing-page/navbar";
import { ScrollProgress } from "@/app/components/landing-page/ScrollProgress";
import { TRASH_TYPES } from "@/app/components/landing-page/shared-data";
import { SplashScreen } from "@/app/components/landing-page/splash-screen";
import { StatsBar } from "@/app/components/landing-page/stats-bar";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState("konsumen");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    const lastShown = localStorage.getItem("sicuan_splash_last_shown");
    const today = new Date().toDateString();
    if (lastShown === today) {
      setShowSplash(false);
    } else {
      localStorage.setItem("sicuan_splash_last_shown", today);
      const timer = setTimeout(() => setShowSplash(false), 2200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Calculator state
  const [calcRole, setCalcRole] = useState("konsumen");
  const [calcTrash, setCalcTrash] = useState("plastik");
  const [calcWeight, setCalcWeight] = useState(10);
  const [calcResult, setCalcResult] = useState({ points: 0, cash: 0 });

  useEffect(() => {
    const selectedTrash = TRASH_TYPES.find((t) => t.id === calcTrash);
    if (!selectedTrash) return;
    const multiplier = calcRole === "bank-sampah" ? 1.1 : 1;
    setCalcResult({
      points: Math.round(selectedTrash.points * calcWeight),
      cash: Math.round(selectedTrash.price * calcWeight * multiplier),
    });
  }, [calcRole, calcTrash, calcWeight]);

  // Live stats animation
  const [stats, setStats] = useState({
    recycled: 12450,
    rewards: 37350000,
    partners: 142,
    co2: 9.3,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        recycled: prev.recycled + Math.floor(Math.random() * 3) + 1,
        rewards: prev.rewards + (Math.floor(Math.random() * 3) + 1) * 3500,
        partners: prev.partners + (Math.random() > 0.95 ? 1 : 0),
        co2: parseFloat((prev.co2 + 0.002).toFixed(3)),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      {!showSplash && (
        <div className="relative flex flex-col min-h-dvh bg-primary-50 text-neutral-900 font-sans selection:bg-primary-200 selection:text-primary-900 overflow-x-hidden bg-grid-pattern pt-20 w-full max-w-full">
          <ScrollProgress />
          {/* Background decorations */}
          <div className="absolute top-0 left-1/4 w-125 h-125 bg-primary-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-200 right-10 w-150 h-150 bg-secondary-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

          <Navbar
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />
          <HeroSection />
          <StatsBar stats={stats} />
          <FeaturesSection />
          <MitraSection
            activeRoleTab={activeRoleTab}
            setActiveRoleTab={setActiveRoleTab}
          />
          <CalculatorSection
            calcRole={calcRole}
            setCalcRole={setCalcRole}
            calcTrash={calcTrash}
            setCalcTrash={setCalcTrash}
            calcWeight={calcWeight}
            setCalcWeight={setCalcWeight}
            calcResult={calcResult}
          />
          <AlurSection />
          <LoginSection />
          <FaqSection faqOpen={faqOpen} setFaqOpen={setFaqOpen} />
          <Footer />
        </div>
      )}
    </>
  );
}
