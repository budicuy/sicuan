import { db } from "../index";
import { hargaSampah } from "../schema";

export async function seedHargaSampah() {
  console.log("🌱 Seeding 100 harga sampah...");

  const jenisTypes = ["Paper Cup", "Plastik", "Karton"];
  // periode: hari pertama tiap bulan dalam format YYYY-MM-DD
  const periods: string[] = [];
  for (const year of [2024, 2025, 2026]) {
    for (let m = 1; m <= 12; m++) {
      periods.push(`${year}-${String(m).padStart(2, "0")}-01`);
    }
  }

  const data = [];
  let count = 0;

  for (const periode of periods) {
    for (const jenis of jenisTypes) {
      if (count >= 100) break;

      const monthIndex = Number(periode.split("-")[1]) - 1;
      const year = Number(periode.split("-")[0]);
      const baseHarga =
        jenis === "Plastik" ? 4500 : jenis === "Paper Cup" ? 3000 : 2000;
      const priceVariation =
        monthIndex * 50 + (year === 2026 ? 300 : year === 2025 ? 150 : 0);
      const hargaPerKg = baseHarga + priceVariation;
      const pointPerKg = Math.round(hargaPerKg / 100);

      data.push({
        periode,
        jenisSampah: jenis,
        hargaPerKg,
        pointPerKg,
        beratMin: 1,
      });
      count++;
    }
    if (count >= 100) break;
  }

  await db.insert(hargaSampah).values(data).onConflictDoNothing();

  console.log(`✅ Seeded ${data.length} harga sampah`);
}
