"use client";

import dynamic from "next/dynamic";

interface Setoran {
  id: string;
  nomorSetor: string;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  status: string;
  senderType: "warmindo" | "konsumen" | "bank-sampah";
  senderName: string;
  senderCoords: [number, number];
  senderAlamat: string;
}

interface LocationInfo {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  alamat: string;
}

interface IndofoodInfo {
  name: string;
  latitude: number;
  longitude: number;
  alamat: string;
}

interface PetaSampahAdminWrapperProps {
  setoran: Setoran[];
  bankSampah: LocationInfo | null;
  indofood: IndofoodInfo;
}

const PetaSampahAdminContent = dynamic(
  () =>
    import("@/app/components/admin/PetaSampahAdminContent").then(
      (mod) => mod.PetaSampahAdminContent,
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

export default function PetaSampahAdminWrapper({
  setoran,
  bankSampah,
  indofood,
}: PetaSampahAdminWrapperProps) {
  return (
    <PetaSampahAdminContent
      setoran={setoran}
      bankSampah={bankSampah}
      indofood={indofood}
    />
  );
}
