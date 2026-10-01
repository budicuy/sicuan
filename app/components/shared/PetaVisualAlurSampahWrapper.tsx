"use client";

import dynamic from "next/dynamic";
import type { RolePetaSpasialResult } from "@/app/lib/peta-sampah-user-service";

interface PetaVisualAlurSampahWrapperProps {
  data: RolePetaSpasialResult;
}

const PetaVisualAlurSampahContent = dynamic(
  () =>
    import("@/app/components/shared/PetaVisualAlurSampahContent").then(
      (mod) => mod.PetaVisualAlurSampahContent,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[620px] w-full items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Memuat visualisasi peta alur sampah...
          </p>
        </div>
      </div>
    ),
  },
);

export function PetaVisualAlurSampahWrapper({
  data,
}: PetaVisualAlurSampahWrapperProps) {
  return <PetaVisualAlurSampahContent data={data} />;
}
