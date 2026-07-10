"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { TransitionLink } from "@/app/components/shared/PageTransitionProvider";

interface NavbarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const NAV_LINKS = [
  { href: "#tentang-kami", label: "Tentang Kami" },
  { href: "#fitur", label: "Fitur Utama" },
  { href: "#mitra", label: "Skema Kemitraan" },
  // { href: "#kalkulator", label: "Kalkulator Reward" },
  { href: "#alur", label: "Alur Setoran" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar({ mobileMenuOpen, setMobileMenuOpen }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document
      .getElementById(id.replace("#", ""))
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${
        scrolled || mobileMenuOpen
          ? "border-neutral-200/50 glassmorphism shadow-md shadow-primary-950/5 py-0"
          : "border-transparent bg-transparent shadow-none py-2"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shadow-xs">
            <Image
              src="/logo.png"
              alt="SICUAN Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-primary-950 flex items-center gap-1.5">
              SICUAN
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium border border-primary-200">
                Official
              </span>
            </span>
            <p className="hidden md:block text-[9px] text-neutral-500 font-medium tracking-wider uppercase leading-none mt-0.5">
              Sistem Informasi Cerdas Ubah Anorganik Jadi Nilai
            </p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-neutral-700">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="relative py-2 hover:text-primary-600 transition-colors group"
            >
              {label}
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <TransitionLink
            id="nav-login-btn"
            href="/login"
            className="text-sm font-semibold text-primary-700 hover:text-primary-800 px-4 py-2 transition-colors rounded-lg hover:bg-primary-100/50"
          >
            Masuk
          </TransitionLink>
          <TransitionLink
            id="nav-register-btn"
            href="/register"
            className="text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg shadow-sm shadow-primary-600/10 hover:shadow-primary-600/20 transition-all duration-200"
          >
            Mulai Setor
          </TransitionLink>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 bg-white px-4 py-6 space-y-4 animate-fade-in">
          <nav className="flex flex-col gap-4 font-medium text-neutral-700 items-start">
            {NAV_LINKS.map(({ href, label }) => (
              <button
                type="button"
                key={href}
                onClick={() => scrollTo(href)}
                className="hover:text-primary-600 py-1 transition-colors text-left w-full cursor-pointer"
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="h-px bg-neutral-200 w-full my-4" />
          <div className="flex flex-col gap-2">
            <TransitionLink
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg border border-neutral-200 font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors block"
            >
              Masuk
            </TransitionLink>
            <TransitionLink
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 shadow-sm transition-colors block"
            >
              Mulai Setor
            </TransitionLink>
          </div>
        </div>
      )}
    </header>
  );
}
