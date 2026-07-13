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

/**
 * Menghitung total harga pengelolaan bulanan berdasarkan berat total gabungan seluruh kategori sampah.
 * Mengikuti skema tiering baru:
 * - 1 - 5 kg = Rp 25.000
 * - >5 - 10 kg = Rp 50.000
 * - >10 - 20 kg = Rp 100.000
 * - >20 kg = Rp 150.000 + Rp 25.000 untuk setiap kelipatan 5 kg kelebihannya.
 */
export async function getHargaForTotalBerat(
  totalBerat: number,
): Promise<number> {
  try {
    if (totalBerat < 1) return 0;

    // Ambil semua range dari kategori Karton sebagai referensi master data
    const ranges = await db
      .select()
      .from(hargaSampah)
      .where(eq(hargaSampah.jenisSampah, "Karton"))
      .orderBy(hargaSampah.minBerat);

    const matchedRange = ranges.find(
      (r) =>
        totalBerat >= r.minBerat &&
        (r.maxBerat === null || totalBerat <= r.maxBerat),
    );

    if (!matchedRange) return 0;

    let finalPrice = matchedRange.harga;

    // Untuk berat > 20 kg (tier tertinggi): tambahkan Rp 25.000 untuk setiap kelipatan 5 kg di atas 20 kg
    if (matchedRange.minBerat === 20 && totalBerat > 20) {
      const excess = totalBerat - 20;
      const increments = Math.floor(excess / 5);
      finalPrice += increments * 25000;
    }

    return finalPrice;
  } catch (error) {
    console.error("Error getting harga for total berat:", error);
    return 0;
  }
}
