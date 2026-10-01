import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { PetaVisualGambarAlur } from "@/app/components/shared/PetaVisualGambarAlur";

export const metadata = {
  title: "Peta Visual Alur Sampah & Reward - Konsumen | SICUAN",
  description:
    "Visual gambar perjalanan alur sampah kemasan rumah tangga menuju drop point dan pencairan reward saldo e-wallet atau voucher.",
};

export default async function PetaSampahKonsumenPage() {
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

  return <PetaVisualGambarAlur userRole="konsumen" userName={userName} />;
}
