"use client";

import {
  Bell,
  ChevronDown,
  Coins,
  FileText,
  Folder,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
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

const IconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Coins,
  FileText,
  ShoppingBag,
  User,
  Folder,
  Settings,
  Recycle,
  Star,
};

function getIcon(name: string): LucideIcon {
  return IconMap[name] || Recycle;
}

export interface MenuItem {
  href: string;
  label: string;
  icon: string;
}

interface SidebarLayoutProps {
  children: React.ReactNode;
  user: {
    name: string;
    role: string;
    username: string;
  } | null;
  onLogout: () => Promise<void>;
  menuItems: MenuItem[];
  collapsibleSections?: {
    label: string;
    icon: string;
    items: MenuItem[];
  }[];
}

export function SidebarLayout({
  children,
  user,
  onLogout,
  menuItems,
  collapsibleSections = [],
}: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Find active item
  const activeMenuItem =
    menuItems.find((item) => pathname === item.href) ||
    collapsibleSections
      .flatMap((sec) => sec.items)
      .find((item) => pathname === item.href);

  const activeTitle = activeMenuItem ? activeMenuItem.label : "Dashboard";

  // Section open states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Proactively open collapsible sections if one of their sub-items is active
    const initialOpenStates: Record<string, boolean> = {};
    for (const sec of collapsibleSections) {
      const isSubitemActive = sec.items.some((item) => pathname === item.href);
      if (isSubitemActive) {
        initialOpenStates[sec.label] = true;
      }
    }
    setOpenSections((prev) => {
      const needsUpdate = Object.keys(initialOpenStates).some(
        (key) => !prev[key],
      );
      if (needsUpdate) {
        return { ...prev, ...initialOpenStates };
      }
      return prev;
    });
  }, [pathname, collapsibleSections]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderNavLinks = (isMobile = false) => {
    const handleLinkClick = () => {
      if (isMobile) {
        setSidebarOpen(false);
      }
    };

    return (
      <div className="space-y-1.5">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = getIcon(item.icon);
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

        {/* Collapsible Sections */}
        {collapsibleSections.map((sec) => {
          const isSectionActive = sec.items.some(
            (item) => pathname === item.href,
          );
          const isOpen = !!openSections[sec.label];
          const SecIcon = getIcon(sec.icon);

          return (
            <div key={sec.label} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleSection(sec.label)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all border-0 cursor-pointer ${
                  isSectionActive
                    ? "bg-neutral-50/80 text-primary-700 font-semibold"
                    : "text-neutral-600 hover:text-primary-600 hover:bg-primary-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <SecIcon
                    className={`w-4.5 h-4.5 shrink-0 ${isSectionActive ? "text-primary-600" : "text-neutral-400"}`}
                  />
                  <span>{sec.label}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <div className="pl-6 mt-1.5 space-y-1 border-l border-neutral-200 ml-6">
                  {sec.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = getIcon(item.icon);
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
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-neutral-100 text-neutral-900 font-sans">
      {/* MOBILE SIDEBAR DRAWER */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          type="button"
          aria-label="Close sidebar"
          className="absolute inset-0 w-full h-full bg-neutral-900/40 backdrop-blur-sm border-0 cursor-default block p-0"
          onClick={() => setSidebarOpen(false)}
        />

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

            <nav className="pt-4">{renderNavLinks(true)}</nav>
          </div>

          <div className="border-t border-neutral-100 pt-4 mt-6 space-y-3">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
              <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center shadow-xs shrink-0">
                {user?.name?.slice(0, 2).toUpperCase() || "US"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-neutral-800 truncate leading-tight">
                  {user?.name || "Pengguna"}
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

      {/* DESKTOP PERMANENT SIDEBAR */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-white text-neutral-800 p-6 shrink-0 fixed top-0 bottom-0 left-0 border-r border-neutral-200 shadow-xs">
        <div className="space-y-8">
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

          <nav className="space-y-1.5">{renderNavLinks(false)}</nav>
        </div>

        <div className="border-t border-neutral-100 pt-4 mt-6 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
            <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center shadow-xs shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() || "US"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-neutral-800 truncate leading-tight">
                {user?.name || "Pengguna"}
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

      {/* MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-xs lg:hidden">
          <div className="flex items-center gap-4">
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">{children}</main>
      </div>
    </div>
  );
}
