import type { Metadata } from "next";
import { PetaJalanSampahContent } from "@/app/components/shared/PetaJalanSampahContent";

export const metadata: Metadata = {
  title: "Peta Jalan Sampah - Bank Sampah Dashboard | SICUAN",
  description:
    "Pelajari alur rantai pasok sampah anorganik dari nasabah hingga diolah menjadi produk bernilai ekonomi sirkular.",
};

export default function PetaJalanSampahBankSampahPage() {
  return <PetaJalanSampahContent userRole="bank-sampah" />;
}
