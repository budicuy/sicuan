import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { PetaVisualGambarAlur } from "@/app/components/shared/PetaVisualGambarAlur";

export const metadata = {
  title: "Peta Visual Alur Sampah & Reward - Bank Sampah Tipe B | SICUAN",
  description:
    "Visual gambar perjalanan alur operasi armada mobile jemput bola 4 segmen dan reward insentif khusus Bank Sampah Tipe B.",
};

export default async function PetaSampahBankSampahBPage() {
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

  return <PetaVisualGambarAlur userRole="bank-sampah-b" userName={userName} />;
}
