import L from "leaflet";

/**
 * Creates custom HTML/SVG Pin Markers for Leaflet maps to avoid missing asset issues in Next.js
 */
export function createCustomMarkerIcon(
  role: "konsumen" | "warmindo" | "bank-sampah" | "picker" | "default",
  label?: string,
) {
  let bgColor = "bg-primary-600";
  let ringColor = "border-primary-400";
  let iconSvg = "";

  switch (role) {
    case "konsumen":
      bgColor = "bg-blue-600";
      ringColor = "border-blue-300";
      iconSvg = `<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`;
      break;
    case "warmindo":
      bgColor = "bg-amber-600";
      ringColor = "border-amber-300";
      iconSvg = `<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>`;
      break;
    case "bank-sampah":
      bgColor = "bg-emerald-600";
      ringColor = "border-emerald-300";
      iconSvg = `<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>`;
      break;
    case "picker":
      bgColor = "bg-rose-600";
      ringColor = "border-rose-300";
      iconSvg = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`;
      break;
    default:
      bgColor = "bg-neutral-800";
      ringColor = "border-neutral-400";
      iconSvg = `<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path></svg>`;
  }

  const html = `
    <div class="relative flex flex-col items-center group -translate-x-1/2 -translate-y-full">
      <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${bgColor} border-2 border-white ring-2 ${ringColor} transition-transform transform group-hover:scale-110">
        ${iconSvg}
      </div>
      <div class="w-1.5 h-2 bg-neutral-800 rounded-b-full -mt-0.5 shadow-xs"></div>
      ${
        label
          ? `<span class="mt-1 px-1.5 py-0.5 text-[9px] font-bold text-neutral-800 bg-white/95 rounded shadow-sm border border-neutral-200 whitespace-nowrap">${label}</span>`
          : ""
      }
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-leaflet-marker",
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -36],
  });
}
