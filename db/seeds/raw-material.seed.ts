import { db } from "@/db";
import { rawMaterial } from "@/db/schema";

export async function seedRawMaterial() {
  console.log("🌱 Seeding raw material by period/category/classification...");

  const combinations = [
    {
      kategori: "Cup" as const,
      klasifikasi: "Cup Noodle (CN)" as const,
      baseWeight: 12.2,
    },
    {
      kategori: "Etiket" as const,
      klasifikasi: "Cup Noodle (CN)" as const,
      baseWeight: 6.1,
    },
    {
      kategori: "Etiket" as const,
      klasifikasi: "Glass Noodle (GN)" as const,
      baseWeight: 7.3,
    },
    {
      kategori: "Etiket" as const,
      klasifikasi: "Normal Noodle (NN)" as const,
      baseWeight: 8.6,
    },
    {
      kategori: "Karton" as const,
      klasifikasi: "Cup Noodle (CN)" as const,
      baseWeight: 260.0,
    },
    {
      kategori: "Karton" as const,
      klasifikasi: "Glass Noodle (GN)" as const,
      baseWeight: 290.0,
    },
    {
      kategori: "Karton" as const,
      klasifikasi: "Normal Noodle (NN)" as const,
      baseWeight: 330.0,
    },
  ];

  const periods: string[] = [];
  for (const year of [2024, 2025, 2026]) {
    for (let m = 1; m <= 12; m++) {
      periods.push(`${year}-${String(m).padStart(2, "0")}-01`);
    }
  }

  const seedData: {
    periode: string;
    kategori: "Cup" | "Etiket" | "Karton";
    klasifikasi: "Cup Noodle (CN)" | "Glass Noodle (GN)" | "Normal Noodle (NN)";
    beratKg: number;
    beratGram: number;
  }[] = [];
  let count = 0;

  for (const periode of periods) {
    if (count >= 100) break;

    const [yearStr, monthStr] = periode.split("-");
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const variation =
      monthIndex * 0.5 + (year === 2026 ? 2.0 : year === 2025 ? 1.0 : 0);

    for (const comb of combinations) {
      if (count >= 100) break;

      const scale = comb.kategori === "Karton" ? 10 : 0.1;
      const beratGram = Number(
        (comb.baseWeight + variation * scale).toFixed(2),
      );
      const beratKg = Number((beratGram / 1000).toFixed(4));

      seedData.push({
        periode,
        kategori: comb.kategori,
        klasifikasi: comb.klasifikasi,
        beratKg,
        beratGram,
      });
      count++;
    }
  }

  await db.insert(rawMaterial).values(seedData).onConflictDoNothing();

  console.log(`✅ Seeded ${seedData.length} raw material records`);
}
