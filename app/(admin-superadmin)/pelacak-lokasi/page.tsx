"use client";

import {
  ExternalLink,
  Loader2,
  MapPin,
  Phone,
  Recycle,
  RefreshCw,
  Search,
  ShoppingBag,
  User,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FeedbackModal } from "@/app/components/shared/FeedbackModal";
import { DynamicLocationTrackerMap } from "@/app/components/shared/maps/DynamicMaps";
import type { TrackedNasabah } from "@/app/components/shared/maps/LocationTrackerMap";
import { getTrackedNasabahLocations } from "./action";

type RoleFilter = "semua" | "konsumen" | "warmindo" | "bank-sampah";

export default function PelacakLokasiPage() {
  const [locations, setLocations] = useState<TrackedNasabah[]>([]);
  const [summary, setSummary] = useState({
    totalTracked: 0,
    totalNasabah: 0,
    konsumenCount: 0,
    warmindoCount: 0,
    bankSampahCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedNasabah, setSelectedNasabah] = useState<TrackedNasabah | null>(
    null,
  );

  // Filters
  const [activeRole, setActiveRole] = useState<RoleFilter>("semua");
  const [searchQuery, setSearchQuery] = useState("");

  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const showFeedback = useCallback(
    (type: "success" | "error", title: string, message: string) => {
      setFeedback({ isOpen: true, type, title, message });
    },
    [],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTrackedNasabahLocations();
      if (res.success && res.data) {
        setLocations(res.data.locations);
        setSummary(res.data.summary);
      } else {
        showFeedback(
          "error",
          "Gagal Memuat Data",
          res.message || "Terjadi kesalahan saat memuat peta pelacak.",
        );
      }
    } catch {
      showFeedback(
        "error",
        "Error Koneksi",
        "Gagal terhubung ke server saat memuat lokasi nasabah.",
      );
    } finally {
      setLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return locations.filter((item) => {
      const matchesRole = activeRole === "semua" || item.role === activeRole;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q) ||
        item.alamat?.toLowerCase().includes(q) ||
        item.noTelepon?.toLowerCase().includes(q);

      return matchesRole && matchesSearch;
    });
  }, [locations, activeRole, searchQuery]);

  const getRoleStyle = (role: string) => {
    switch (role) {
      case "bank-sampah":
        return {
          label: "Bank Sampah",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: Recycle,
          dotColor: "bg-emerald-500",
        };
      case "warmindo":
        return {
          label: "Warmindo",
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          icon: ShoppingBag,
          dotColor: "bg-amber-500",
        };
      default:
        return {
          label: "Konsumen",
          badge: "bg-blue-50 text-blue-700 border-blue-200",
          icon: User,
          dotColor: "bg-blue-500",
        };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
              <MapPin className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Peta Pelacak Lokasi
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Melacak titik koordinat lokasi mitra Bank Sampah, Warmindo, dan
            Nasabah Konsumen yang telah mengatur lokasi di profil.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 shadow-2xs transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-neutral-500 ${loading ? "animate-spin" : ""}`}
          />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block truncate">
              Total Terlacak
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-neutral-900 font-mono">
                {summary.totalTracked}
              </span>
              <span className="text-[10px] text-neutral-400">
                / {summary.totalNasabah} nasabah
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Recycle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block truncate">
              Bank Sampah
            </span>
            <span className="text-lg font-black text-emerald-700 font-mono mt-0.5 block">
              {summary.bankSampahCount} Lokasi
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block truncate">
              Mitra Warmindo
            </span>
            <span className="text-lg font-black text-amber-700 font-mono mt-0.5 block">
              {summary.warmindoCount} Lokasi
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block truncate">
              Konsumen
            </span>
            <span className="text-lg font-black text-blue-700 font-mono mt-0.5 block">
              {summary.konsumenCount} Lokasi
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl p-3 border border-neutral-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveRole("semua")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRole === "semua"
                ? "bg-neutral-900 text-white shadow-2xs"
                : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Semua ({summary.totalTracked})
          </button>
          <button
            type="button"
            onClick={() => setActiveRole("bank-sampah")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRole === "bank-sampah"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <Recycle className="w-3.5 h-3.5" />
            <span>Bank Sampah ({summary.bankSampahCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveRole("warmindo")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRole === "warmindo"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Warmindo ({summary.warmindoCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveRole("konsumen")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRole === "konsumen"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Konsumen ({summary.konsumenCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, alamat, no telp..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Main Split Layout: Peta & Daftar Nasabah */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Peta Interaktif (7 / 12 kolom) */}
        <div className="lg:col-span-8 order-2 lg:order-1">
          {loading ? (
            <div className="h-[600px] w-full rounded-3xl border border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center gap-2 text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <span className="text-xs font-semibold">
                Memuat Peta Pelacak...
              </span>
            </div>
          ) : (
            <DynamicLocationTrackerMap
              locations={filteredLocations}
              selectedId={selectedNasabah?.id ?? null}
              onSelect={(nasabah) => setSelectedNasabah(nasabah)}
              height="620px"
            />
          )}
        </div>

        {/* Panel Samping Daftar Nasabah (5 / 12 kolom) */}
        <div className="lg:col-span-4 order-1 lg:order-2 bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-3 flex flex-col max-h-[620px]">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 shrink-0">
            <div>
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Daftar Lokasi Mitra
              </h3>
              <p className="text-[10.5px] text-neutral-400">
                Klik kartu untuk fokus ke marker peta
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-lg">
              {filteredLocations.length} hasil
            </span>
          </div>

          {/* List Scrollable */}
          <div className="overflow-y-auto flex-1 space-y-2.5 pr-1 divide-y divide-neutral-100">
            {filteredLocations.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 space-y-2">
                <MapPin className="w-8 h-8 mx-auto text-neutral-300" />
                <p className="text-xs font-semibold">
                  Tidak ada titik lokasi ditemukan.
                </p>
                <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                  Pastikan nasabah telah memperbarui titik lokasi koordinat di
                  halaman profilnya.
                </p>
              </div>
            ) : (
              filteredLocations.map((item) => {
                const isSelected = selectedNasabah?.id === item.id;
                const roleInfo = getRoleStyle(item.role);
                const RoleIcon = roleInfo.icon;
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;

                return (
                  <div
                    key={item.id}
                    className={`pt-2.5 first:pt-0 p-3 rounded-2xl transition-all border ${
                      isSelected
                        ? "bg-primary-50/40 border-primary-300 shadow-xs"
                        : "hover:bg-neutral-50/80 border-transparent hover:border-neutral-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedNasabah(item)}
                      className="w-full text-left bg-transparent border-0 p-0 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${roleInfo.dotColor} shrink-0`}
                            ></span>
                            <h4 className="text-xs font-bold text-neutral-900 truncate">
                              {item.name}
                            </h4>
                          </div>
                          <p className="text-[10px] text-neutral-400 font-mono mt-0.5 ml-3.5 truncate">
                            @{item.username}
                          </p>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold rounded-full border uppercase tracking-wider shrink-0 ${roleInfo.badge}`}
                        >
                          <RoleIcon className="w-2.5 h-2.5" />
                          {roleInfo.label}
                        </span>
                      </div>

                      {item.alamat && (
                        <p className="text-[11px] text-neutral-500 mt-2 line-clamp-1 ml-3.5">
                          📍 {item.alamat}
                        </p>
                      )}
                    </button>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-neutral-100/70 text-[10px] ml-3.5">
                      {item.noTelepon ? (
                        <button
                          type="button"
                          onClick={() => {
                            window.open(
                              `https://wa.me/${item.noTelepon?.replace(/^0/, "62")}`,
                              "_blank",
                            );
                          }}
                          className="text-primary-600 hover:text-primary-700 font-mono flex items-center gap-1 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{item.noTelepon}</span>
                        </button>
                      ) : (
                        <span className="text-neutral-400 font-mono">
                          {item.latitude.toFixed(4)},{" "}
                          {item.longitude.toFixed(4)}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => window.open(mapsUrl, "_blank")}
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 font-semibold hover:underline bg-transparent border-0 p-0 cursor-pointer"
                      >
                        <span>Google Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}
