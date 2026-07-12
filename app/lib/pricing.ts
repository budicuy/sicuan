import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { hargaSampah, poinSampah } from "@/db/schema";

/**
 * Mendapatkan nilai poin per kg untuk jenis sampah tertentu dari master data poin.
 */
export async function getPoinPerKg(jenis: string): Promise<number> {
  try {
    const result = await db
      .select({ pointPerKg: poinSampah.pointPerKg })
      .from(poinSampah)
      .where(
        eq(poinSampah.jenisSampah, jenis as "Karton" | "Etiket" | "Paper Cup"),
      )
      .limit(1);

    return result[0]?.pointPerKg ?? 0;
  } catch (error) {
    console.error("Error getting poin per kg:", error);
    return 0;
  }
}

/**
 * Mendapatkan harga tebus flat untuk jenis sampah dan berat tertentu berdasarkan range berat.
 */
export async function getHargaRange(
  jenis: string,
  berat: number,
): Promise<number> {
  try {
    const result = await db
      .select({ harga: hargaSampah.harga })
      .from(hargaSampah)
      .where(
        and(
          eq(
            hargaSampah.jenisSampah,
            jenis as "Karton" | "Etiket" | "Paper Cup",
          ),
          lte(hargaSampah.minBerat, berat),
          or(isNull(hargaSampah.maxBerat), gte(hargaSampah.maxBerat, berat)),
        ),
      )
      .limit(1);

    return result[0]?.harga ?? 0;
  } catch (error) {
    console.error("Error getting harga range:", error);
    return 0;
  }
}

/**
 * Menghitung total poin dan kredit uang dari setoran sampah.
 * Kredit uang hanya diberikan untuk mitra warmindo dan bank-sampah.
 */
export async function calculateSetoranReward(
  jenis: string,
  berat: number,
  role: string,
): Promise<{ totalPoin: number; totalKredit: number }> {
  if (role === "bank-sampah") {
    return { totalPoin: 0, totalKredit: 0 };
  }

  const isWarmindo = role === "warmindo";
  const pointPerKg = isWarmindo ? 0 : await getPoinPerKg(jenis);
  const totalPoin = isWarmindo ? 0 : Math.floor(berat * pointPerKg);

  const isMoneyReward = role === "warmindo";
  const totalKredit = isMoneyReward ? await getHargaRange(jenis, berat) : 0;

  return { totalPoin, totalKredit };
}
