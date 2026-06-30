"use client";

import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Layers,
  MapPin,
  Menu,
  Navigation,
  Scale,
} from "lucide-react";

interface Setoran {
  id: number;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  status: string;
  tanggalSetor: string;
  metodeSetor: string;
}

interface LocationInfo {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  alamat: string;
}

interface PetaSampahContentProps {
  setoran: Setoran[];
  warmiendo: LocationInfo;
  bankSampah: LocationInfo | null;
}

const indofood = {
  name: "Pabrik PT. Indofood",
  latitude: -3.5495692587301937,
  longitude: 114.73002728210881,
  alamat: "Kawasan Industri, Banjarmasin",
};

const indofoodCoords: [number, number] = [
  indofood.latitude,
  indofood.longitude,
];

// MapViewUpdater updates the center and bounds of the leaflet map to fit selected coordinates
function MapViewUpdater({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const timer = setTimeout(() => {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [points, map]);
  return null;
}

// MapFocusController pans and zooms to the selected coordinate when selectedSetorId changes
function MapFocusController({
  selectedSetorId,
  targetCoords,
}: {
  selectedSetorId: number | null;
  targetCoords: [number, number];
}) {
  const map = useMap();
  useEffect(() => {
    if (selectedSetorId && targetCoords) {
      const timer = setTimeout(() => {
        map.setView(targetCoords, 16, { animate: true });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedSetorId, targetCoords, map]);
  return null;
}

export function PetaSampahContent({
  setoran,
  warmiendo,
  bankSampah,
}: PetaSampahContentProps) {
  const [selectedSetorId, setSelectedSetorId] = useState<number | null>(
    setoran.length > 0 ? setoran[0].id : null,
  );
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const selectedSetoran = setoran.find((s) => s.id === selectedSetorId);

  // Setup default coords if not available
  const warmiendoCoords = useMemo<[number, number]>(() => {
    const wLat = warmiendo.latitude ?? -3.32426;
    const wLng = warmiendo.longitude ?? 114.59102;
    return [wLat, wLng];
  }, [warmiendo.latitude, warmiendo.longitude]);

  const bankSampahCoords = useMemo<[number, number]>(() => {
    const bLat = bankSampah?.latitude ?? -3.29826;
    const bLng = bankSampah?.longitude ?? 114.58602;
    return [bLat, bLng];
  }, [bankSampah]);

  // Determine current waste location based on status
  const isReceived = selectedSetoran?.status === "diterima";
  const isHandedOver = selectedSetoran?.status === "diserahkan";

  const wasteCoords: [number, number] = isReceived
    ? indofoodCoords
    : isHandedOver
      ? bankSampahCoords
      : warmiendoCoords;

  // Determine bounds for zoom - only updates when coordinates change (reference remains stable on card select click)
  const allPoints = useMemo(() => {
    return [warmiendoCoords, bankSampahCoords, indofoodCoords];
  }, [warmiendoCoords, bankSampahCoords]);

  // Helper function to create beautiful div icon
  const getMarkerIcon = (
    type: "warmiendo" | "banksampah" | "trash" | "indofood",
    status?: string,
  ) => {
    let color = "#3b82f6"; // Blue
    let iconHtml = "";

    if (type === "warmiendo") {
      color = "#3560f4"; // Sleek Dark Blue
      iconHtml = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <title>Mitra Warmiendo Icon</title>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      `;
    } else if (type === "banksampah") {
      color = "#059669"; // Emerald
      iconHtml = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <title>Bank Sampah Icon</title>
          <path d="M3 21h18"/>
          <path d="M3 10h18"/>
          <path d="M5 6h14"/>
          <path d="M4 10v11"/>
          <path d="M20 10v11"/>
          <path d="M8 14v3"/>
          <path d="M12 14v3"/>
          <path d="M16 14v3"/>
        </svg>
      `;
    } else if (type === "indofood") {
      color = "#6366f1"; // Indigo
      iconHtml = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <title>Pabrik Indofood Icon</title>
          <path d="M2 20h20"/>
          <path d="M20 18v-8l-4 4v-4l-4 4V4L2 20h18Z"/>
        </svg>
      `;
    } else {
      // Trash location
      if (status === "diterima" || status === "diserahkan") {
        color = "#10b981"; // Green
        iconHtml = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <title>Trash Received Icon</title>
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        `;
      } else if (status === "ditolak") {
        color = "#ef4444"; // Red
        iconHtml = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <title>Trash Rejected Icon</title>
            <circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>
          </svg>
        `;
      } else {
        color = "#f59e0b"; // Orange/Amber
        iconHtml = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <title>Trash Pending Icon</title>
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" x2="10" y1="11" y2="17"/>
            <line x1="14" x2="14" y1="11" y2="17"/>
          </svg>
        `;
      }
    }

    const isTrash = type === "trash";
    const pulseShadow = isTrash
      ? `<span class="absolute inline-flex h-12 w-12 animate-ping rounded-full opacity-25" style="background-color: ${color};"></span>`
      : "";

    return L.divIcon({
      html: `
        <div class="relative flex flex-col items-center">
          ${pulseShadow}
          <div class="relative flex items-center justify-center w-10 h-10 rounded-2xl border-2 border-white shadow-xl text-white transition-transform hover:scale-110 duration-200" style="background-color: ${color};">
            ${iconHtml}
          </div>
          <div class="w-2.5 h-2.5 -mt-1.5 rotate-45 border-r border-b border-white/20 shadow-md" style="background-color: ${color};"></div>
        </div>
      `,
      className: "custom-div-icon-wrapper",
      iconSize: [44, 44],
      iconAnchor: [22, 38],
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "diterima":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" /> Diterima
          </span>
        );
      case "diserahkan":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
            <Navigation className="w-3 h-3" /> Diserahkan
          </span>
        );
      case "diverifikasi":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-100 uppercase tracking-wider">
            <Clock className="w-3 h-3" /> Diverifikasi
          </span>
        );
      case "ditolak":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-700 border border-red-100 uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3" /> Ditolak
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-screen w-full relative bg-neutral-50">
      {/* Floating Toggle Button for Collapsed Panel */}
      {isCollapsed && (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="absolute top-4 left-4 z-[1000] w-12 h-12 bg-white/95 backdrop-blur-md rounded-2xl border border-neutral-200 shadow-2xl flex items-center justify-center text-neutral-700 hover:bg-neutral-50 transition-all hover:scale-105 active:scale-95"
          title="Tampilkan Panel Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Floating Card Menu (Sidebar) */}
      <div
        className={`absolute top-4 left-4 right-4 md:right-auto md:w-96 z-[1000] max-h-[45vh] md:max-h-[calc(100%-2rem)] flex flex-col bg-white/95 backdrop-blur-md border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform ${
          isCollapsed
            ? "-translate-y-120 md:translate-y-0 md:-translate-x-110 opacity-0 pointer-events-none"
            : "translate-y-0 translate-x-0 opacity-100"
        }`}
      >
        {/* Card Header */}
        <div className="p-5 pb-3 flex justify-between items-center bg-white/50 border-b border-neutral-100">
          <div>
            <h1 className="text-sm font-black text-neutral-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-600 animate-pulse" />{" "}
              Pelacakan Peta Sampah
            </h1>
            <p className="text-[10px] text-neutral-450 mt-0.5">
              Lihat alur pengiriman sampah dari Warmiendo Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="w-7 h-7 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-750 transition-colors active:scale-95 border-0 cursor-pointer"
            title="Sembunyikan Panel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 bg-neutral-50/50 border-b border-neutral-100">
          <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            Daftar Setoran Sampah
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative min-h-0 scrollbar-thin">
          {setoran.length > 0 ? (
            setoran.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSetorId(s.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex flex-col gap-2 ${
                  selectedSetorId === s.id
                    ? "border-primary-600 bg-primary-50/40 shadow-xs"
                    : "border-neutral-200 bg-white hover:bg-neutral-50/50"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-extrabold text-[10px] text-neutral-800 tracking-tight block">
                    {s.nomorSetor}
                  </span>
                  {getStatusBadge(s.status)}
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[9px] text-neutral-500 pt-1.5 border-t border-neutral-100/50 w-full">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{s.jenisSampah}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Scale className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="font-bold text-neutral-750">
                      {s.beratKg} Kg
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>
                      {new Date(s.tanggalSetor).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Navigation className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="capitalize">{s.metodeSetor}</span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200">
              <MapPin className="w-8 h-8 text-neutral-300 mb-2" />
              <p className="text-xs font-semibold text-neutral-500">
                Belum ada data setoran.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Map Container - Full Size */}
      <div className="w-full h-full">
        <MapContainer
          center={warmiendoCoords}
          zoom={12}
          zoomControl={false}
          attributionControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <ZoomControl position="topright" />

          <MapFocusController
            selectedSetorId={selectedSetorId}
            targetCoords={wasteCoords}
          />

          <MapViewUpdater points={allPoints} />

          {/* Marker 1: Warmiendo */}
          <Marker position={warmiendoCoords} icon={getMarkerIcon("warmiendo")}>
            <Popup>
              <div className="p-1">
                <h4 className="font-extrabold text-neutral-900 text-sm">
                  {warmiendo.name} (Lokasi Anda)
                </h4>
                <p className="text-xs text-neutral-500 mt-1">
                  {warmiendo.alamat}
                </p>
                <div className="mt-2 text-[10px] text-primary-600 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Titik Awal Setoran Sampah
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Marker 2: Bank Sampah */}
          {bankSampah && (
            <Marker
              position={bankSampahCoords}
              icon={getMarkerIcon("banksampah")}
            >
              <Popup>
                <div className="p-1">
                  <h4 className="font-extrabold text-emerald-800 text-sm">
                    {bankSampah.name} (Tempat Pengolahan)
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    {bankSampah.alamat}
                  </p>
                  <div className="mt-2 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pusat Pengolahan &
                    Bank Sampah
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marker 4: Pabrik Indofood */}
          <Marker position={indofoodCoords} icon={getMarkerIcon("indofood")}>
            <Popup>
              <div className="p-1">
                <h4 className="font-extrabold text-indigo-800 text-sm">
                  {indofood.name} (Tujuan Akhir)
                </h4>
                <p className="text-xs text-neutral-500 mt-1">
                  {indofood.alamat}
                </p>
                <div className="mt-2 text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Penerimaan Raw Material
                  Daur Ulang
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Route 1: Warmiendo -> Bank Sampah */}
          {bankSampah && (
            <Polyline
              positions={[warmiendoCoords, bankSampahCoords]}
              pathOptions={{
                color: isHandedOver || isReceived ? "#10b981" : "#a3a3a3",
                weight: 4,
                dashArray: isHandedOver || isReceived ? "none" : "6, 8",
                opacity: 0.8,
              }}
            />
          )}

          {/* Route 2: Bank Sampah -> Pabrik Indofood */}
          {bankSampah && (
            <Polyline
              positions={[bankSampahCoords, indofoodCoords]}
              pathOptions={{
                color: isReceived ? "#6366f1" : "#a3a3a3",
                weight: 4,
                dashArray: isReceived ? "none" : "6, 8",
                opacity: 0.8,
              }}
            />
          )}

          {/* Marker 3: Dynamic Trash Location */}
          {selectedSetoran && (
            <Marker
              position={wasteCoords}
              icon={getMarkerIcon("trash", selectedSetoran.status)}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-extrabold text-neutral-900 text-sm">
                      Posisi Sampah Saat Ini
                    </h4>
                    <span className="text-[9px] font-bold text-neutral-450 uppercase">
                      {selectedSetoran.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-1.5">
                    Sampah dari setoran{" "}
                    <strong>{selectedSetoran.nomorSetor}</strong> saat ini
                    berada di:
                  </p>
                  <p className="text-xs font-bold text-neutral-800 mt-1 bg-neutral-50 border border-neutral-100 p-1.5 rounded-lg">
                    {isReceived
                      ? "Pabrik PT. Indofood"
                      : isHandedOver
                        ? bankSampah?.name
                        : warmiendo.name}
                  </p>
                  <div className="border-t border-neutral-100 my-2" />
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-neutral-500">
                    <div>Jenis: {selectedSetoran.jenisSampah}</div>
                    <div className="text-right">
                      Berat: {selectedSetoran.beratKg} Kg
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Legend Overlay */}
        <div className="hidden sm:block absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm border border-neutral-200 p-4 rounded-xl shadow-lg text-[10px] space-y-2.5 min-w-[160px] animate-fade-in">
          <div className="font-extrabold text-neutral-800 tracking-wider uppercase border-b border-neutral-100 pb-1.5">
            Legenda Peta
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-primary-600 border border-white flex items-center justify-center text-white shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>Mitra Warmiendo (Asal)</title>
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            </span>
            <span className="text-neutral-600 font-medium">
              Mitra Warmiendo (Asal)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 border border-white flex items-center justify-center text-white shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>Bank Sampah (Tujuan)</title>
                <path d="M3 21h18" />
                <path d="M3 10h18" />
                <path d="M4 10v11" />
              </svg>
            </span>
            <span className="text-neutral-600 font-medium">
              Bank Sampah (Pengolahan)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-md bg-indigo-650 border border-white flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: "#6366f1" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>Pabrik Indofood (Akhir)</title>
                <path d="M2 20h20" />
                <path d="M20 18v-8l-4 4v-4l-4 4V4L2 20h18Z" />
              </svg>
            </span>
            <span className="text-neutral-600 font-medium">
              Pabrik Indofood (Akhir)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-500 border border-white flex items-center justify-center text-white shrink-0 animate-pulse">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>Lokasi Sampah (Aktif)</title>
                <path d="M3 6h18" />
                <path d="M19 6v14" />
                <line x1="10" x2="10" y1="11" y2="17" />
              </svg>
            </span>
            <span className="text-neutral-600 font-medium">
              Lokasi Sampah (Aktif)
            </span>
          </div>
          <div className="border-t border-neutral-100 pt-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 border-t-2 border-dashed border-neutral-400 shrink-0"></span>
              <span className="text-neutral-500">Rencana Pengiriman</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-emerald-500 shrink-0"></span>
              <span className="text-emerald-600 font-bold">
                Sampai di Bank Sampah
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-0.5 bg-indigo-500 shrink-0"
                style={{ backgroundColor: "#6366f1" }}
              ></span>
              <span
                className="text-indigo-650 font-bold"
                style={{ color: "#6366f1" }}
              >
                Sampai di PT. Indofood
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Legend (Super Compact, Horizontal Row) */}
        <div className="block sm:hidden absolute bottom-3 left-3 right-3 z-[1000] bg-white/90 backdrop-blur-xs border border-neutral-200 px-3 py-1.5 rounded-lg shadow-md text-[8px] flex items-center justify-between gap-1 overflow-x-auto scrollbar-none animate-fade-in">
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2 h-2 rounded-xs bg-primary-600"></span>
            <span className="text-neutral-500 font-bold">Warmiendo</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2 h-2 rounded-xs bg-emerald-600"></span>
            <span className="text-neutral-500 font-bold">Bank Sampah</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className="w-2 h-2 rounded-xs bg-indigo-500"
              style={{ backgroundColor: "#6366f1" }}
            ></span>
            <span className="text-neutral-500 font-bold">Indofood</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 animate-pulse">
            <span className="w-2 h-2 rounded-xs bg-amber-500"></span>
            <span className="text-neutral-500 font-bold">Aktif</span>
          </div>
        </div>
      </div>
    </div>
  );
}
