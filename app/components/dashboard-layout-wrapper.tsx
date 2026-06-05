"use client";

import {
  Bell,
  ChevronDown,
  Coins,
  FileText,
  Folder,
  LayoutDashboard,
  LogOut,
  Menu,
  Recycle,
  Settings,
  ShoppingBag,
  Star,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
  user: {
    name: string;
    role: string;
    username: string;
  } | null;
  onLogout: () => Promise<void>;
}

export function DashboardLayoutWrapper({
  children,
  user,
  onLogout,
}: DashboardLayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const standardMenuItems = [
    { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
    ...(user?.role !== "admin" && user?.role !== "superadmin"
      ? [
          {
            href: "/dashboard/laporan",
            label: "Laporan Setoran",
            icon: FileText,
          },
        ]
      : []),
  ];

  const laporanMenuItems = [
    {
      href: "/dashboard/laporan/bank-sampah",
      label: "Setoran Bank Sampah",
      icon: Coins,
    },
    {
      href: "/dashboard/laporan/warmiendo",
      label: "Setoran Warmiendo",
      icon: ShoppingBag,
    },
    {
      href: "/dashboard/laporan/konsumen",
      label: "Setoran Konsumen",
      icon: User,
    },
  ];

  const masterMenuItems = [
    { href: "/dashboard/users", label: "Data User", icon: User },
    { href: "/dashboard/nasabah", label: "Data Nasabah", icon: Coins },
    { href: "/dashboard/ekspedisi", label: "Data Ekspedisi", icon: FileText },
    { href: "/dashboard/harga-sampah", label: "Harga Sampah", icon: Settings },
    { href: "/dashboard/raw-material", label: "Raw Material", icon: Recycle },
    { href: "/dashboard/kupon", label: "Master Kupon", icon: Star },
  ];

  const otherMenuItems = [
    {
      href: "/dashboard/setor-sampah",
      label: "Setor Sampah",
      icon: ShoppingBag,
    },
    {
      href: "/dashboard/tukar-kupon",
      label: "Tukar Kupon",
      icon: Star,
    },
    {
      href: "/dashboard/pencairan-dana",
      label: "Pencairan Dana",
      icon: Coins,
    },
    { href: "/dashboard/profil", label: "Profil Saya", icon: User },
  ];

  const adminMenuItems = [
    { href: "/dashboard/pencairan", label: "Pencairan Dana", icon: Coins },
  ];

  const isMasterPathActive = masterMenuItems.some(
    (item) => pathname === item.href,
  );
  const [masterOpen, setMasterOpen] = useState(isMasterPathActive);

  const isLaporanPathActive = laporanMenuItems.some(
    (item) => pathname === item.href,
  );
  const [laporanOpen, setLaporanOpen] = useState(isLaporanPathActive);

  // Sync open state on navigation
  useEffect(() => {
    if (isMasterPathActive) {
      setMasterOpen(true);
    }
  }, [isMasterPathActive]);

  useEffect(() => {
    if (isLaporanPathActive) {
      setLaporanOpen(true);
    }
  }, [isLaporanPathActive]);

  const activeMenuItem =
    standardMenuItems.find((item) => pathname === item.href) ||
    laporanMenuItems.find((item) => pathname === item.href) ||
    masterMenuItems.find((item) => pathname === item.href) ||
    otherMenuItems.find((item) => pathname === item.href) ||
    adminMenuItems.find((item) => pathname === item.href);

  const activeTitle = activeMenuItem ? activeMenuItem.label : "Dashboard";

  const _getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "superadmin":
        return "bg-red-100 text-red-700 border-red-200";
      case "admin":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "warmiendo":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "bank-sampah":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  const renderNavLinks = (isMobile = false) => {
    const handleLinkClick = () => {
      if (isMobile) {
        setSidebarOpen(false);
      }
    };

    return (
      <div className="space-y-1.5">
        {/* 1. Standard Items */}
        {standardMenuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-primary-50 text-primary-700 font-semibold border border-primary-100 shadow-xs"
                  : "text-neutral-600 hover:text-primary-600 hover:bg-primary-50/50"
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-primary-600" : "text-neutral-400"}`}
              />
              {item.label}
            </Link>
          );
        })}

        {/* Laporan Setoran Collapsible (Admin/Superadmin only) */}
        {(user?.role === "superadmin" || user?.role === "admin") && (
          <div>
            <button
              type="button"
              onClick={() => setLaporanOpen(!laporanOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all border-0 cursor-pointer ${
                isLaporanPathActive
                  ? "bg-neutral-50/80 text-primary-700 font-semibold"
                  : "text-neutral-600 hover:text-primary-600 hover:bg-primary-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText
                  className={`w-4.5 h-4.5 shrink-0 ${isLaporanPathActive ? "text-primary-600" : "text-neutral-400"}`}
                />
                <span>Setoran Sampah</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${laporanOpen ? "rotate-180" : ""}`}
              />
            </button>

            {laporanOpen && (
              <div className="pl-6 mt-1.5 space-y-1 border-l border-neutral-200 ml-6">
                {laporanMenuItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${
                        isActive
                          ? "bg-primary-50 text-primary-700 font-semibold border border-primary-100/50"
                          : "text-neutral-500 hover:text-primary-600 hover:bg-primary-50/30"
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-primary-600" : "text-neutral-400"}`}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Pencairan Dana for Admin/Superadmin (Outside Master Data) */}
        {(user?.role === "superadmin" || user?.role === "admin") && (
          <Link
            href="/dashboard/pencairan"
            onClick={handleLinkClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
              pathname === "/dashboard/pencairan"
                ? "bg-primary-50 text-primary-700 font-semibold border border-primary-100 shadow-xs"
                : "text-neutral-600 hover:text-primary-600 hover:bg-primary-50/50"
            }`}
          >
            <Coins
              className={`w-4.5 h-4.5 shrink-0 ${pathname === "/dashboard/pencairan" ? "text-primary-600" : "text-neutral-400"}`}
            />
            Pencairan Dana
          </Link>
        )}

        {/* 2. Collapsible Master Data (Admin/Superadmin only) */}
        {(user?.role === "superadmin" || user?.role === "admin") && (
          <div>
            <button
              type="button"
              onClick={() => setMasterOpen(!masterOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all border-0 cursor-pointer ${
                isMasterPathActive
                  ? "bg-neutral-50/80 text-primary-700 font-semibold"
                  : "text-neutral-600 hover:text-primary-600 hover:bg-primary-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Folder
                  className={`w-4.5 h-4.5 shrink-0 ${isMasterPathActive ? "text-primary-600" : "text-neutral-400"}`}
                />
                <span>Master Data</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${masterOpen ? "rotate-180" : ""}`}
              />
            </button>

            {masterOpen && (
              <div className="pl-6 mt-1.5 space-y-1 border-l border-neutral-200 ml-6">
                {masterMenuItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${
                        isActive
                          ? "bg-primary-50 text-primary-700 font-semibold border border-primary-100/50"
                          : "text-neutral-500 hover:text-primary-600 hover:bg-primary-50/30"
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-primary-600" : "text-neutral-400"}`}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. Customer-only Items */}
        {user?.role !== "superadmin" &&
          user?.role !== "admin" &&
          otherMenuItems
            .filter((item) => {
              if (item.href === "/dashboard/pencairan-dana") {
                return (
                  user?.role === "warmiendo" || user?.role === "bank-sampah"
                );
              }
              if (item.href === "/dashboard/tukar-kupon") {
                return (
                  user?.role !== "warmiendo" && user?.role !== "bank-sampah"
                );
              }
              return true;
            })
            .map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-primary-50 text-primary-700 font-semibold border border-primary-100 shadow-xs"
                      : "text-neutral-600 hover:text-primary-600 hover:bg-primary-50/50"
                  }`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-primary-600" : "text-neutral-400"}`}
                  />
                  {item.label}
                </Link>
              );
            })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-neutral-100 text-neutral-900 font-sans">
      {/* 1. MOBILE SIDEBAR DRAWER (Overlay & Slide panel) */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop overlay */}
        <button
          type="button"
          aria-label="Close sidebar"
          className="absolute inset-0 w-full h-full bg-neutral-900/40 backdrop-blur-sm border-0 cursor-default block p-0"
          onClick={() => setSidebarOpen(false)}
        />

        {/* Drawer Panel */}
        <div
          className={`absolute top-0 bottom-0 left-0 w-72 bg-white text-neutral-800 p-6 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out transform border-r border-neutral-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white">
                  <Recycle className="w-5 h-5 animate-spin-slow" />
                </div>
                <span className="text-lg font-bold tracking-tight text-neutral-900">
                  SICUAN
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="pt-4">{renderNavLinks(true)}</nav>
          </div>

          {/* Sidebar Footer for Mobile Drawer */}
          <div className="border-t border-neutral-100 pt-4 mt-6 space-y-3">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
              <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center shadow-xs shrink-0">
                {user?.name?.slice(0, 2).toUpperCase() || "US"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-neutral-800 truncate leading-tight">
                  {user?.name || "Pengguna Demo"}
                </p>
                <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block mt-0.5">
                  {user?.role || "Nasabah"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-all font-semibold cursor-pointer border-0 w-full text-left"
            >
              <LogOut className="w-4 h-4 shrink-0 text-red-500" />
              Keluar Sistem
            </button>
          </div>
        </div>
      </div>

      {/* 2. DESKTOP PERMANENT SIDEBAR */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-white text-neutral-800 p-6 shrink-0 fixed top-0 bottom-0 left-0 border-r border-neutral-200 shadow-xs">
        <div className="space-y-8">
          {/* Logo Area */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-md">
              <Recycle className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-neutral-900">
                SICUAN
              </span>
              <p className="text-[8px] text-neutral-500 tracking-wider uppercase font-medium leading-none mt-0.5">
                Dashboard Portal
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">{renderNavLinks(false)}</nav>
        </div>

        {/* Sidebar Footer for Desktop */}
        <div className="border-t border-neutral-100 pt-4 mt-6 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
            <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center shadow-xs shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() || "US"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-neutral-800 truncate leading-tight">
                {user?.name || "Pengguna Demo"}
              </p>
              <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block mt-0.5">
                {user?.role || "Nasabah"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-all font-semibold cursor-pointer border-0 w-full text-left"
          >
            <LogOut className="w-4.5 h-4.5 shrink-0 text-red-500" />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Header / Topbar (Mobile Only) */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-xs lg:hidden">
          <div className="flex items-center gap-4">
            {/* Hamburger for mobile */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-sm sm:text-base text-neutral-850 tracking-tight">
              {activeTitle}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button
              type="button"
              className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors relative"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full animate-pulse" />
            </button>
          </div>
        </header>

        {/* Dashboard inner child views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">{children}</main>
      </div>
    </div>
  );
}
