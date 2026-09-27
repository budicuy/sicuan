"use client";

import {
  ExternalLink,
  MapPin,
  Phone,
  Recycle,
  ShoppingBag,
  User,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { createCustomMarkerIcon } from "./LeafletIcons";

export interface TrackedNasabah {
  id: number;
  name: string;
  username: string;
  role: "konsumen" | "warmindo" | "bank-sampah";
  status: string;
  noTelepon?: string | null;
  alamat?: string | null;
  latitude: number;
  longitude: number;
  poin?: number | null;
  totalSetoranCount?: number;
  totalBeratKg?: number;
}

interface LocationTrackerMapProps {
  locations: TrackedNasabah[];
  selectedId?: number | null;
  onSelect?: (nasabah: TrackedNasabah) => void;
  height?: string;
}

const DEFAULT_CENTER: [number, number] = [-3.316694, 114.590111];

function MapTrackerController({
  locations,
  selectedId,
}: {
  locations: TrackedNasabah[];
  selectedId?: number | null;
}) {
  const map = useMap();

  // Focus to selected location
  useEffect(() => {
    if (!selectedId) return;
    const target = locations.find((l) => l.id === selectedId);
    if (
      target &&
      !Number.isNaN(target.latitude) &&
      !Number.isNaN(target.longitude)
    ) {
      map.flyTo([target.latitude, target.longitude], 16, {
        duration: 1.2,
      });
    }
  }, [selectedId, locations, map]);

  // Initial fit bounds to cover all markers
  useEffect(() => {
    if (locations.length > 0) {
      const validPoints = locations.filter(
        (l) => !Number.isNaN(l.latitude) && !Number.isNaN(l.longitude),
      );
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(
          validPoints.map((p) => [p.latitude, p.longitude] as [number, number]),
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [locations, map]);

  return null;
}

export default function LocationTrackerMap({
  locations,
  selectedId,
  onSelect,
  height = "600px",
}: LocationTrackerMapProps) {
  const validLocations = useMemo(() => {
    return locations.filter(
      (l) =>
        l.latitude !== null &&
        l.longitude !== null &&
        !Number.isNaN(l.latitude) &&
        !Number.isNaN(l.longitude),
    );
  }, [locations]);

  const initialCenter: [number, number] = useMemo(() => {
    if (validLocations.length > 0) {
      return [validLocations[0].latitude, validLocations[0].longitude];
    }
    return DEFAULT_CENTER;
  }, [validLocations]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "bank-sampah":
        return {
          label: "Bank Sampah",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: Recycle,
        };
      case "warmindo":
        return {
          label: "Warmindo",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: ShoppingBag,
        };
      default:
        return {
          label: "Konsumen",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: User,
        };
    }
  };

  return (
    <div
      className="relative rounded-3xl overflow-hidden border border-neutral-200/80 shadow-md z-0"
      style={{ height }}
    >
      <MapContainer
        center={initialCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapTrackerController
          locations={validLocations}
          selectedId={selectedId}
        />

        {validLocations.map((item) => {
          const roleInfo = getRoleBadge(item.role);
          const RoleIcon = roleInfo.icon;
          const isSelected = selectedId === item.id;
          const markerIcon = createCustomMarkerIcon(
            item.role,
            isSelected ? item.name : undefined,
          );

          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;

          return (
            <Marker
              key={item.id}
              position={[item.latitude, item.longitude]}
              icon={markerIcon}
              eventHandlers={{
                click: () => onSelect?.(item),
              }}
            >
              <Popup className="custom-leaflet-popup min-w-64">
                <div className="p-1 space-y-2.5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-neutral-100 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        @{item.username}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold rounded-full border uppercase tracking-wider ${roleInfo.bg}`}
                    >
                      <RoleIcon className="w-2.5 h-2.5" />
                      {roleInfo.label}
                    </span>
                  </div>

                  {/* Info details */}
                  <div className="space-y-1.5 text-[11px] text-neutral-600">
                    {item.alamat && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3 h-3 text-neutral-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{item.alamat}</span>
                      </div>
                    )}

                    {item.noTelepon && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                        <a
                          href={`https://wa.me/${item.noTelepon.replace(/^0/, "62")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-600 hover:underline font-mono text-[10.5px]"
                        >
                          {item.noTelepon}
                        </a>
                      </div>
                    )}

                    {item.role === "konsumen" &&
                      item.poin !== undefined &&
                      item.poin !== null && (
                        <div className="bg-neutral-50 px-2 py-1 rounded-lg text-[10px] font-semibold text-neutral-700">
                          Saldo Poin:{" "}
                          <span className="font-bold text-primary-600">
                            {item.poin} Poin
                          </span>
                        </div>
                      )}

                    {item.totalSetoranCount !== undefined && (
                      <div className="bg-neutral-50 px-2 py-1 rounded-lg text-[10px] font-semibold text-neutral-700">
                        Total Setoran:{" "}
                        <span className="font-bold text-neutral-900">
                          {item.totalSetoranCount} kali
                        </span>
                        {item.totalBeratKg !== undefined &&
                          item.totalBeratKg > 0 && (
                            <span> ({item.totalBeratKg.toFixed(1)} kg)</span>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-1.5 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[9.5px] font-mono text-neutral-400">
                      {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                    </span>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-2xs"
                    >
                      <span>Google Maps</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Counter Pill di pojok kanan atas (agar tidak menimpa tombol zoom Leaflet di kiri atas) */}
      <div className="absolute top-3 right-3 z-1000 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-2xl border border-neutral-200/80 shadow-md text-xs font-bold text-neutral-800 flex items-center gap-2 pointer-events-none">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>{validLocations.length} Titik Lokasi Terlacak</span>
      </div>
    </div>
  );
}
