import { db } from "@/db";
import { rawMaterial } from "@/db/schema";

export async function seedRawMaterial() {
  console.log("🌱 Seeding raw material (1 baris per bulan)...");

  // Hapus semua data lama
  await db.delete(rawMaterial);

  // 1 baris per bulan — semua kategori dalam satu record
  await db.insert(rawMaterial).values([
    {
      periode: "2026-06-01",
      // Etiket
      etiketNnGram: 3000,
      etiketGnGram: 3000,
      etiketCnGram: 2000,
      // Karton
      kartonNnGram: 4000,
      kartonGnGram: 3000,
      kartonCnGram: 3000,
      // Cup / Paper Cup
      cupCnGram: 4000,
    },
    {
      periode: "2026-07-01",
      // Etiket
      etiketNnGram: 3500,
      etiketGnGram: 3200,
      etiketCnGram: 2200,
      // Karton
      kartonNnGram: 4500,
      kartonGnGram: 3500,
      kartonCnGram: 3200,
      // Cup / Paper Cup
      cupCnGram: 4200,
    },
  ]);

  console.log("✅ Seeded raw material records untuk Juni & Juli 2026");
}
