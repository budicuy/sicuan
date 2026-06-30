"use client";

import dynamic from "next/dynamic";

interface Setoran {
  id: number;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  status: string;
  metodeSetor: string;
}

interface LocationInfo {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  alamat: string;
}

interface PetaSampahWrapperProps {
  warmiendo: LocationInfo;
  bankSampah: LocationInfo | null;
  setoran: Setoran[];
}

const PetaSampahContent = dynamic(
  () =>
    import("@/app/components/warmiendo/PetaSampahContent").then(
      (mod) => mod.PetaSampahContent,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center bg-neutral-50 rounded-2xl border border-neutral-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-neutral-500">Memuat peta...</p>
        </div>
      </div>
    ),
  },
);

export default function PetaSampahWrapper({
  warmiendo,
  bankSampah,
  setoran,
}: PetaSampahWrapperProps) {
  return (
    <PetaSampahContent
      warmiendo={warmiendo}
      bankSampah={bankSampah}
      setoran={setoran}
    />
  );
}
