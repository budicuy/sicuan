import { db } from "../index";
import { hargaSampah } from "../schema";

export async function seedHargaSampah() {
  console.log("🌱 Seeding flat harga sampah for Karton, Etiket, Paper Cup...");

  const jenisTypes = ["Paper Cup", "Etiket", "Karton"];
  const periods: string[] = [];
  for (const year of [2024, 2025, 2026]) {
    for (let m = 1; m <= 12; m++) {
      periods.push(`${year}-${String(m).padStart(2, "0")}-01`);
    }
  }

  const data = [];
  for (const periode of periods) {
    for (const jenis of jenisTypes) {
      const hargaPerKg =
        jenis === "Paper Cup" ? 3000 : jenis === "Etiket" ? 2500 : 2000;
      const pointPerKg =
        jenis === "Paper Cup" ? 30 : jenis === "Etiket" ? 25 : 20;

      data.push({
        periode,
        jenisSampah: jenis,
        hargaPerKg,
        pointPerKg,
        beratMin: 1,
      });
    }
  }

  await db.delete(hargaSampah);
  await db.insert(hargaSampah).values(data);

  console.log(`✅ Seeded ${data.length} harga sampah records successfully`);
}
