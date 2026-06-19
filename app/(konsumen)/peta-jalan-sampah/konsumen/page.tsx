import type { Metadata } from "next";
import { PetaJalanSampahContent } from "@/app/components/shared/PetaJalanSampahContent";

export const metadata: Metadata = {
  title: "Peta Jalan Sampah - Konsumen Dashboard | SICUAN",
  description:
    "Simulasikan pergerakan sampah yang Anda pilah di rumah tangga dan lihat dampak positifnya bagi kelestarian lingkungan.",
};

export default function PetaJalanSampahKonsumenPage() {
  return <PetaJalanSampahContent userRole="konsumen" />;
}
