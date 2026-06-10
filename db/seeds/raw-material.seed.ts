import { db } from "@/db";
import { rawMaterial } from "@/db/schema";

export async function seedRawMaterial() {
  console.log("🌱 Seeding raw material only for June 2026...");

  // Clear old raw material data
  await db.delete(rawMaterial);

  const dates = [
    "2026-06-01",
    "2026-06-08",
    "2026-06-15",
    "2026-06-22",
    "2026-06-29",
  ];
  const seedData = [];

  for (const dateStr of dates) {
    // Karton
    seedData.push({
      periode: dateStr,
      kategori: "Karton" as const,
      klasifikasi: "Cup Noodle (CN)" as const,
      beratKg: 3.0,
      beratGram: 3000.0,
    });
    seedData.push({
      periode: dateStr,
      kategori: "Karton" as const,
      klasifikasi: "Glass Noodle (GN)" as const,
      beratKg: 3.0,
      beratGram: 3000.0,
    });
    seedData.push({
      periode: dateStr,
      kategori: "Karton" as const,
      klasifikasi: "Normal Noodle (NN)" as const,
      beratKg: 4.0,
      beratGram: 4000.0,
    });

    // Etiket
    seedData.push({
      periode: dateStr,
      kategori: "Etiket" as const,
      klasifikasi: "Cup Noodle (CN)" as const,
      beratKg: 2.0,
      beratGram: 2000.0,
    });
    seedData.push({
      periode: dateStr,
      kategori: "Etiket" as const,
      klasifikasi: "Glass Noodle (GN)" as const,
      beratKg: 3.0,
      beratGram: 3000.0,
    });
    seedData.push({
      periode: dateStr,
      kategori: "Etiket" as const,
      klasifikasi: "Normal Noodle (NN)" as const,
      beratKg: 3.0,
      beratGram: 3000.0,
    });

    // Cup
    seedData.push({
      periode: dateStr,
      kategori: "Cup" as const,
      klasifikasi: "Cup Noodle (CN)" as const,
      beratKg: 4.0,
      beratGram: 4000.0,
    });
    seedData.push({
      periode: dateStr,
      kategori: "Cup" as const,
      klasifikasi: "Glass Noodle (GN)" as const,
      beratKg: 4.0,
      beratGram: 4000.0,
    });
    seedData.push({
      periode: dateStr,
      kategori: "Cup" as const,
      klasifikasi: "Normal Noodle (NN)" as const,
      beratKg: 4.0,
      beratGram: 4000.0,
    });
  }

  await db.insert(rawMaterial).values(seedData);
  console.log(`✅ Seeded ${seedData.length} raw material records`);
}
