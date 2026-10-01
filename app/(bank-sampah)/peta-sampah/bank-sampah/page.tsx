import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { PetaVisualGambarAlur } from "@/app/components/shared/PetaVisualGambarAlur";

export const metadata = {
  title: "Peta Visual Alur Sampah & Reward - Bank Sampah Tipe A | SICUAN",
  description:
    "Visual gambar perjalanan alur sampah dari mitra komunitas hingga pengolahan baling industri dan pencairan dana operasional Indofood.",
};

export default async function PetaSampahBankSampahPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  let userName: string | undefined;

  if (token) {
    try {
      const payload = decodeJwt(token) as { name?: string };
      userName = payload.name;
    } catch {
      // ignore
    }
  }

  return <PetaVisualGambarAlur userRole="bank-sampah" userName={userName} />;
}
