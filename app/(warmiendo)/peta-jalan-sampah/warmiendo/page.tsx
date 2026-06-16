import type { Metadata } from "next";
import { PetaJalanSampahContent } from "@/app/components/shared/PetaJalanSampahContent";

export const metadata: Metadata = {
  title: "Peta Jalan Sampah - Warmiendo Dashboard | SICUAN",
  description:
    "Lihat bagaimana sampah karton dan kemasan mi instan dari Warmindo Anda dikelola kembali menjadi bahan baku baru.",
};

export default function PetaJalanSampahWarmiendoPage() {
  return <PetaJalanSampahContent />;
}
