import type { Metadata } from "next";
import { PetaJalanSampahContent } from "@/app/components/shared/PetaJalanSampahContent";

export const metadata: Metadata = {
  title: "Peta Jalan Sampah - Admin Dashboard | SICUAN",
  description:
    "Simulasikan dan pantau alur sirkularitas sampah anorganik dari hulu ke hilir untuk mengoptimalkan penanganan sampah di ekosistem SICUAN.",
};

export default function PetaJalanSampahAdminPage() {
  return <PetaJalanSampahContent userRole="admin" />;
}
