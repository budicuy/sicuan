"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

export const DynamicLocationPickerMap = dynamic(
  () => import("./LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 w-full rounded-2xl border border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center gap-2 text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <span className="text-xs font-semibold">Memuat Peta Interaktif...</span>
      </div>
    ),
  },
);

export const DynamicLocationTrackerMap = dynamic(
  () => import("./LocationTrackerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full rounded-3xl border border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center gap-3 text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="text-sm font-semibold">
          Memuat Peta Pelacak Lokasi...
        </span>
      </div>
    ),
  },
);
