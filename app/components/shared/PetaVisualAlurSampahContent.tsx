"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ChevronRight,
  Coins,
  Compass,
  Download,
  Gift,
  Pause,
  Play,
  Printer,
  Recycle,
  RotateCcw,
  Store,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";
import { TourGuide } from "@/app/components/shared/TourGuide";
import type {
  PetaWaypoint,
  RolePetaSpasialResult,
} from "@/app/lib/peta-sampah-user-service";

interface PetaVisualAlurSampahContentProps {
  data: RolePetaSpasialResult;
}

// Tour Guide Steps
const tourSteps = [
  {
    element: "#tour-peta-header",
    popover: {
      title: "Peta Alur Perjalanan Sampah & Reward",
      description:
        "Visualisasi geografis interaktif yang memetakan rantai perjalanan sampah dari lokasi Anda hingga bermuara ke Pabrik PT Indofood dan sentra pencairan reward.",
      side: "bottom" as const,
    },
  },
  {
    element: "#tour-peta-actions",
    popover: {
      title: "Tombol Cetak PDF & Simulasi",
      description:
        "Gunakan tombol di sini untuk mengunduh/mencetak peta dalam format PDF atau menjalankan simulasi animasi alur perjalanan sampah secara otomatis.",
      side: "left" as const,
    },
  },
  {
    element: "#tour-peta-canvas",
    popover: {
      title: "Peta Visual Interaktif",
      description:
        "Peta menampilkan marker bernomor 1 sampai 5 yang saling terhubung garis rute logistik. Klik marker mana saja untuk melihat detail proses dan cuan yang dihasilkan.",
      side: "top" as const,
    },
  },
  {
    element: "#tour-peta-stepper",
    popover: {
      title: "Navigasi Tahapan Alur",
      description:
        "Klik tahapan 1 hingga 5 pada panel ini untuk mengarahkan kamera peta langsung ke titik perjalanan terkait beserta penjelasannya.",
      side: "top" as const,
    },
  },
];

// Helper: Custom FlyTo controller when active step changes
function MapFlyController({
  activeCoords,
  zoom = 15,
}: {
  activeCoords: [number, number] | null;
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (activeCoords) {
      map.flyTo(activeCoords, zoom, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [activeCoords, map, zoom]);
  return null;
}

// Helper: Fit all bounds on load or reset
function MapBoundsFitter({
  points,
  triggerReset,
}: {
  points: [number, number][];
  triggerReset: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0 && triggerReset >= 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [points, map, triggerReset]);
  return null;
}

// Marker Icon Factory
function createCustomStepIcon(
  stepNumber: number,
  iconType: PetaWaypoint["iconType"],
  isActive: boolean,
) {
  const colors: Record<
    PetaWaypoint["iconType"],
    { bg: string; border: string; text: string; shadow: string }
  > = {
    source: {
      bg: "#2563eb",
      border: "#60a5fa",
      text: "#ffffff",
      shadow: "rgba(37, 99, 235, 0.4)",
    },
    truck: {
      bg: "#0284c7",
      border: "#38bdf8",
      text: "#ffffff",
      shadow: "rgba(2, 132, 199, 0.4)",
    },
    bank: {
      bg: "#059669",
      border: "#34d399",
      text: "#ffffff",
      shadow: "rgba(5, 150, 105, 0.4)",
    },
    factory: {
      bg: "#4f46e5",
      border: "#818cf8",
      text: "#ffffff",
      shadow: "rgba(79, 70, 229, 0.4)",
    },
    reward: {
      bg: "#d97706",
      border: "#fbbf24",
      text: "#ffffff",
      shadow: "rgba(217, 119, 6, 0.45)",
    },
  };

  const scheme = colors[iconType] || colors.source;
  const size = isActive ? 46 : 38;
  const pulseHtml = isActive
    ? `<span class="absolute -inset-1 rounded-full animate-ping opacity-75" style="background-color: ${scheme.bg};"></span>`
    : "";

  return L.divIcon({
    className: "custom-peta-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
    html: `
      <div class="relative flex items-center justify-center w-full h-full cursor-pointer select-none">
        ${pulseHtml}
        <div class="relative flex items-center justify-center rounded-full font-bold shadow-lg transition-transform duration-300"
             style="
               width: ${size}px;
               height: ${size}px;
               background-color: ${scheme.bg};
               border: 3px solid ${scheme.border};
               color: ${scheme.text};
               box-shadow: 0 4px 14px ${scheme.shadow};
               transform: ${isActive ? "scale(1.15)" : "scale(1)"};
             ">
          <span style="font-size: ${isActive ? "16px" : "13px"}; font-weight: 800; font-family: ui-sans-serif, system-ui, sans-serif;">
            ${stepNumber}
          </span>
        </div>
      </div>
    `,
  });
}

export function PetaVisualAlurSampahContent({
  data,
}: PetaVisualAlurSampahContentProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [resetCount, setResetCount] = useState<number>(0);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [selectedWaypoint, setSelectedWaypoint] = useState<PetaWaypoint>(
    data.waypoints[0],
  );

  const markerRefs = useRef<Record<number, L.Marker | null>>({});

  // Auto-play animation interval
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveStep((prev) => {
          const next = prev >= data.waypoints.length ? 1 : prev + 1;
          const targetWp = data.waypoints.find((w) => w.stepNumber === next);
          if (targetWp) setSelectedWaypoint(targetWp);
          return next;
        });
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, data.waypoints]);

  const handleStepClick = (step: PetaWaypoint) => {
    setActiveStep(step.stepNumber);
    setSelectedWaypoint(step);
    setIsPlaying(false);

    // Open popup on marker
    const marker = markerRefs.current[step.stepNumber];
    if (marker) {
      marker.openPopup();
    }
  };

  const handleNextStep = () => {
    const nextNum = activeStep >= data.waypoints.length ? 1 : activeStep + 1;
    const targetWp = data.waypoints.find((w) => w.stepNumber === nextNum);
    if (targetWp) handleStepClick(targetWp);
  };

  const handleResetView = () => {
    setResetCount((prev) => prev + 1);
    setIsPlaying(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReport = () => {
    const jsonContent = JSON.stringify(
      {
        aplikasi: "SICUAN - Sistem Pengelolaan Sampah PT Indofood",
        role: data.roleLabel,
        namaPengguna: data.userName,
        tanggalCetak: new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        totalJarakTempuh: `${data.totalDistanceKm} km`,
        estimasiRewardCuan: data.totalEstimasiCuan,
        alurPerjalanan: data.waypoints.map((w) => ({
          tahap: w.stepNumber,
          kategori: w.badge,
          judul: w.title,
          lokasi: w.locationName,
          alamat: w.address,
          koordinat: w.coords,
          prosesSampah: w.sampahFlow,
          keuntunganReward: w.rewardCuan,
        })),
      },
      null,
      2,
    );

    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `peta-alur-sampah-${data.role}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const polylineCoords = useMemo(() => {
    return data.routePolyline;
  }, [data.routePolyline]);

  const activeCoords = useMemo(() => {
    return selectedWaypoint ? selectedWaypoint.coords : null;
  }, [selectedWaypoint]);

  return (
    <div className="space-y-4">
      {/* Tour Guide System */}
      <TourGuide steps={tourSteps} />

      {/* ── TOP HEADER: ROLE TITLE & ACTION BUTTONS ── */}
      <div
        id="tour-peta-header"
        className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {data.roleLabel}
            </span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Total Rute: {data.totalDistanceKm} km
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
            Peta Visual Alur Perjalanan Sampah & Reward
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Visualisasi rute pengangkutan sampah kemasan dari {data.userName}{" "}
            menuju daur ulang dan sentra reward PT Indofood.
          </p>
        </div>

        {/* Action Controls */}
        <div
          id="tour-peta-actions"
          className="flex flex-wrap items-center gap-2"
        >
          {/* Play/Pause Simulation */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all shadow-sm ${
              isPlaying
                ? "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-500/20"
                : "bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/20"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                Jeda Tur
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Putar Rute
              </>
            )}
          </button>

          {/* Reset Zoom */}
          <button
            type="button"
            onClick={handleResetView}
            title="Tampilkan Seluruh Rute"
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700/60 shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5 text-neutral-500" />
            Reset Zoom
          </button>

          {/* Print PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            title="Cetak atau Unduh PDF Dokumen Rute"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-sm"
          >
            <Printer className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Cetak / PDF
          </button>

          {/* Download JSON Data */}
          <button
            type="button"
            onClick={handleDownloadReport}
            title="Unduh Data Koordinat dan Alur (JSON)"
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700/60 shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-neutral-500" />
            Ekspor Data
          </button>
        </div>
      </div>

      {/* ── STEPPER NAVIGATOR DOCK (HERO QUICK SELECTION) ── */}
      <div
        id="tour-peta-stepper"
        className="rounded-2xl border border-neutral-200/90 bg-white p-2.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {data.waypoints.map((step) => {
            const isCurrent = activeStep === step.stepNumber;
            return (
              <button
                key={step.stepNumber}
                type="button"
                onClick={() => handleStepClick(step)}
                className={`group flex flex-1 min-w-[150px] items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all ${
                  isCurrent
                    ? "bg-primary-50 ring-2 ring-primary-500/30 dark:bg-primary-950/40 dark:ring-primary-400/40"
                    : "hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold transition-transform ${
                    isCurrent
                      ? "bg-primary-600 text-white scale-105 shadow-md shadow-primary-500/25"
                      : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 group-hover:bg-neutral-300"
                  }`}
                >
                  {step.stepNumber}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isCurrent
                          ? "text-primary-700 dark:text-primary-300"
                          : "text-neutral-400"
                      }`}
                    >
                      {step.badge.split("/")[0]}
                    </span>
                  </div>
                  <p
                    className={`truncate text-xs font-semibold ${
                      isCurrent
                        ? "text-neutral-900 dark:text-white"
                        : "text-neutral-600 dark:text-neutral-300"
                    }`}
                  >
                    {step.title.split(":")[0]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN VISUAL MAP CONTAINER (LEAFLET INTERACTIVE FULL) ── */}
      <div
        id="tour-peta-canvas"
        className="relative h-[620px] w-full overflow-hidden rounded-2xl border border-neutral-300/80 bg-neutral-100 shadow-md dark:border-neutral-800 dark:bg-neutral-900"
      >
        <MapContainer
          center={data.userCoords}
          zoom={12}
          scrollWheelZoom={true}
          zoomControl={false}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomControl position="bottomleft" />

          {/* Dynamic FlyTo controller */}
          <MapFlyController activeCoords={activeCoords} zoom={15} />

          {/* Reset Zoom Fitter */}
          <MapBoundsFitter
            points={data.routePolyline}
            triggerReset={resetCount}
          />

          {/* Visual Route Polyline (Garis Rute Bersinar) */}
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: "#059669",
              weight: 5,
              opacity: 0.85,
              dashArray: "8, 12",
              lineCap: "round",
              lineJoin: "round",
            }}
          />

          {/* Glow Shadow Polyline Underneath */}
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: "#34d399",
              weight: 10,
              opacity: 0.35,
              lineCap: "round",
            }}
          />

          {/* Waypoint Markers (1 s/d 5) */}
          {data.waypoints.map((wp) => {
            const isCurrent = activeStep === wp.stepNumber;
            const icon = createCustomStepIcon(
              wp.stepNumber,
              wp.iconType,
              isCurrent,
            );

            return (
              <Marker
                key={wp.stepNumber}
                position={wp.coords}
                icon={icon}
                ref={(ref) => {
                  markerRefs.current[wp.stepNumber] = ref;
                }}
                eventHandlers={{
                  click: () => handleStepClick(wp),
                }}
              >
                <Popup className="custom-leaflet-popup min-w-[280px] max-w-[340px]">
                  <div className="p-1 space-y-2.5 font-sans">
                    {/* Popup Header */}
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary-100 px-2 py-0.5 text-[11px] font-bold text-primary-800">
                        Tahap {wp.stepNumber}: {wp.badge}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {wp.coords[0].toFixed(4)}, {wp.coords[1].toFixed(4)}
                      </span>
                    </div>

                    {/* Location & Title */}
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 leading-snug">
                        {wp.title}
                      </h4>
                      <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Store className="h-3 w-3 shrink-0 text-neutral-400" />
                        <span className="truncate">{wp.locationName}</span>
                      </p>
                      <p className="text-[11px] text-neutral-400 italic line-clamp-1 mt-0.5">
                        {wp.address}
                      </p>
                    </div>

                    {/* Sampah Flow Description */}
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200/80 p-2 text-xs text-emerald-950">
                      <div className="font-semibold text-emerald-800 flex items-center gap-1 mb-0.5">
                        <Recycle className="h-3.5 w-3.5 text-emerald-600" />
                        Alur Fisik Sampah:
                      </div>
                      <p className="text-emerald-900 text-[11px] leading-relaxed">
                        {wp.sampahFlow}
                      </p>
                    </div>

                    {/* Reward & Cuan Box */}
                    <div className="rounded-lg bg-amber-50 border border-amber-200/80 p-2 text-xs text-amber-950">
                      <div className="font-semibold text-amber-800 flex items-center gap-1 mb-0.5">
                        <Coins className="h-3.5 w-3.5 text-amber-600" />
                        Reward & Poin Tahap Ini:
                      </div>
                      <p className="text-amber-900 font-medium text-[11px]">
                        {wp.rewardCuan}
                      </p>
                    </div>

                    {/* Next Step Action */}
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full flex items-center justify-center gap-1 rounded-lg bg-neutral-900 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors shadow-sm"
                    >
                      <span>Lanjut Tahap Berikutnya</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* ── FLOATING DETAIL CARD OVERLAY (SELEKSI TAHAP AKTIF) ── */}
        <div className="absolute top-4 left-4 z-[400] max-w-sm w-full pointer-events-auto">
          <div className="rounded-2xl border border-neutral-200/90 bg-white/95 backdrop-blur-md p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900/95 transition-all">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white shadow-sm">
                  {selectedWaypoint.stepNumber}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  {selectedWaypoint.badge}
                </span>
              </div>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                {selectedWaypoint.metrics.label}:{" "}
                {selectedWaypoint.metrics.value}
              </span>
            </div>

            <div className="mt-2.5 space-y-2">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                {selectedWaypoint.title}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3">
                {selectedWaypoint.description}
              </p>
            </div>

            {/* Reward Highlight Badge */}
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/30 p-2.5 text-xs text-amber-900 dark:text-amber-300">
              <Gift className="h-4 w-4 shrink-0 text-amber-600 mt-0.5 dark:text-amber-400" />
              <div className="min-w-0">
                <span className="font-bold block text-[11px] text-amber-800 dark:text-amber-400">
                  Nilai Reward & Cuan:
                </span>
                <span className="text-xs font-medium leading-tight">
                  {selectedWaypoint.rewardCuan}
                </span>
              </div>
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  const prevNum =
                    activeStep <= 1 ? data.waypoints.length : activeStep - 1;
                  const prevWp = data.waypoints.find(
                    (w) => w.stepNumber === prevNum,
                  );
                  if (prevWp) handleStepClick(prevWp);
                }}
                className="text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              >
                &larr; Sebelumnya
              </button>
              <div className="flex gap-1">
                {data.waypoints.map((w) => (
                  <span
                    key={w.stepNumber}
                    className={`h-1.5 rounded-full transition-all ${
                      w.stepNumber === activeStep
                        ? "w-4 bg-primary-600"
                        : "w-1.5 bg-neutral-300 dark:bg-neutral-700"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                Selanjutnya &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* ── FLOATING MAP LEGEND (KANAN BAWAH) ── */}
        <div className="absolute bottom-4 right-4 z-[400] pointer-events-auto">
          <div className="rounded-xl border border-neutral-200/90 bg-white/95 backdrop-blur-md p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900/95 text-xs max-w-[220px]">
            <button
              type="button"
              onClick={() => setShowLegend(!showLegend)}
              className="flex w-full items-center justify-between font-bold text-neutral-800 dark:text-neutral-200"
            >
              <span className="flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-primary-600" />
                Legenda Rute
              </span>
              <span className="text-[10px] text-neutral-400">
                {showLegend ? "Sembunyikan" : "Tampilkan"}
              </span>
            </button>

            {showLegend && (
              <div className="mt-2.5 space-y-1.5 border-t border-neutral-100 pt-2 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-600 shrink-0" />
                  <span className="text-[11px] text-neutral-600 dark:text-neutral-300">
                    1. Titik Asal / Sumber
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-sky-600 shrink-0" />
                  <span className="text-[11px] text-neutral-600 dark:text-neutral-300">
                    2. Armada Ekspedisi
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-600 shrink-0" />
                  <span className="text-[11px] text-neutral-600 dark:text-neutral-300">
                    3. Bank Sampah Olah
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-indigo-600 shrink-0" />
                  <span className="text-[11px] text-neutral-600 dark:text-neutral-300">
                    4. Pabrik PT. Indofood
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-600 shrink-0" />
                  <span className="text-[11px] text-neutral-600 dark:text-neutral-300">
                    5. Sentra Reward / Cuan
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="h-0.5 w-4 bg-emerald-500 border border-dashed border-emerald-600 shrink-0" />
                  <span className="text-[10px] text-neutral-500">
                    Jalur Pengiriman Logistik
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RINGKASAN ALUR REWARD (5 KARTU KOMPAK DI BAWAH PETA) ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {data.waypoints.map((wp) => {
          const isCurrent = activeStep === wp.stepNumber;
          return (
            <button
              key={wp.stepNumber}
              type="button"
              onClick={() => handleStepClick(wp)}
              className={`text-left w-full cursor-pointer rounded-2xl border p-3.5 transition-all shadow-sm ${
                isCurrent
                  ? "border-primary-500 bg-primary-50/50 shadow-md ring-2 ring-primary-500/20 dark:bg-primary-950/20 dark:border-primary-400"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow dark:border-neutral-800 dark:bg-neutral-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white dark:bg-white dark:text-neutral-900">
                  {wp.stepNumber}
                </span>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                  {wp.actor.split(" ")[0]}
                </span>
              </div>
              <h4 className="mt-2 text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">
                {wp.title.split(":")[0]}
              </h4>
              <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                {wp.sampahFlow}
              </p>
              <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 line-clamp-1">
                  🎁 {wp.rewardCuan}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── PRINT-ONLY STYLING & TEMPLATE ── */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav,
          aside,
          header,
          button,
          .leaflet-control-zoom,
          .tour-guide-container,
          #tour-peta-actions,
          #tour-peta-stepper {
            display: none !important;
          }
          #tour-peta-canvas {
            height: 480px !important;
            border: 1px solid #ccc !important;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
