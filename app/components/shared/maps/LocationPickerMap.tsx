"use client";

import {
  Crosshair,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { createCustomMarkerIcon } from "./LeafletIcons";

// Center default jika belum ada koordinat (Banjarmasin, Kalimantan Selatan)
const DEFAULT_CENTER: [number, number] = [-3.316694, 114.590111];
const DEFAULT_ZOOM = 13;

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  onChange?: (lat: number, lng: number) => void;
  readonly?: boolean;
  height?: string;
  zoom?: number;
}

// Subkomponen untuk menangani event klik pada peta
function MapClickHandler({
  onSelectLocation,
  enabled,
}: {
  onSelectLocation: (lat: number, lng: number) => void;
  enabled: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onSelectLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Subkomponen untuk sinkronisasi posisi view peta (pan / fly to)
function MapCenterController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center && !Number.isNaN(center[0]) && !Number.isNaN(center[1])) {
      map.flyTo(center, Math.max(map.getZoom(), 15), {
        duration: 1.2,
      });
    }
  }, [center, map]);
  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  readonly = false,
  height = "320px",
  zoom = DEFAULT_ZOOM,
}: LocationPickerMapProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [targetFlyCenter, setTargetFlyCenter] = useState<
    [number, number] | null
  >(null);

  const hasCoords =
    latitude !== null &&
    longitude !== null &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  const currentCenter: [number, number] = useMemo(() => {
    return hasCoords
      ? [latitude as number, longitude as number]
      : DEFAULT_CENTER;
  }, [hasCoords, latitude, longitude]);

  const markerIcon = useMemo(() => {
    return createCustomMarkerIcon("picker", "Titik Lokasi");
  }, []);

  const handleSelectCoords = useCallback(
    (lat: number, lng: number) => {
      if (readonly) return;
      setGeoError("");
      onChange?.(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
    },
    [onChange, readonly],
  );

  const handleGetCurrentLocation = () => {
    if (readonly) return;
    setGeoError("");

    if (!navigator.geolocation) {
      setGeoError("Browser Anda tidak mendukung deteksi lokasi (Geolocation).");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const roundedLat = Number(lat.toFixed(6));
        const roundedLng = Number(lng.toFixed(6));
        handleSelectCoords(roundedLat, roundedLng);
        setTargetFlyCenter([roundedLat, roundedLng]);
        setIsDetecting(false);
      },
      (err) => {
        console.error("Gagal mendapatkan lokasi GPS:", err);
        setIsDetecting(false);
        if (err.code === 1) {
          setGeoError("Izin akses lokasi ditolak oleh browser.");
        } else {
          setGeoError(
            "Gagal mendeteksi lokasi GPS. Silakan klik langsung pada peta.",
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleRecenter = () => {
    if (hasCoords) {
      setTargetFlyCenter([latitude as number, longitude as number]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Action bar di atas peta */}
      {!readonly && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-50 p-2.5 rounded-2xl border border-neutral-200">
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium">
            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>
              Klik pada peta atau geser marker untuk menentukan titik lokasi
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasCoords && (
              <>
                <button
                  type="button"
                  onClick={handleRecenter}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200 text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  title="Pusatkan ke marker"
                >
                  <Crosshair className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Pusatkan</span>
                </button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  title="Buka titik koordinat di Google Maps"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  <span>Buka di Google Maps</span>
                </a>
              </>
            )}

            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isDetecting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isDetecting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              <span>
                {isDetecting ? "Mencari GPS..." : "Gunakan Lokasi Saya"}
              </span>
            </button>
          </div>
        </div>
      )}

      {geoError && (
        <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-xl">
          ⚠️ {geoError}
        </p>
      )}

      {/* Map Container */}
      <div
        className="relative rounded-2xl overflow-hidden border border-neutral-200 shadow-inner z-0"
        style={{ height }}
      >
        <MapContainer
          center={currentCenter}
          zoom={hasCoords ? 15 : zoom}
          scrollWheelZoom={true}
          className="w-full h-full"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler
            onSelectLocation={handleSelectCoords}
            enabled={!readonly}
          />
          <MapCenterController center={targetFlyCenter} />

          {hasCoords && (
            <Marker
              position={[latitude as number, longitude as number]}
              icon={markerIcon}
              draggable={!readonly}
              eventHandlers={{
                dragend: (e) => {
                  if (readonly) return;
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  handleSelectCoords(pos.lat, pos.lng);
                },
              }}
            />
          )}
        </MapContainer>

        {/* Floating Koordinat Badge di pojok bawah peta */}
        <div className="absolute bottom-2.5 left-2.5 z-1000 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-neutral-200 shadow-md text-[10.5px] font-mono text-neutral-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          {hasCoords ? (
            <div className="flex items-center gap-2">
              <span>
                {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-sans font-bold hover:underline"
              >
                <span>Buka Google Maps</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          ) : (
            <span className="text-neutral-400 italic font-sans">
              Belum ada titik dipilih
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
