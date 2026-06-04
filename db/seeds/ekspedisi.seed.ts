import { db } from "../index";
import { ekspedisi } from "../schema";

export async function seedEkspedisi() {
  console.log("🌱 Seeding 100 ekspedisi...");

  const adjectives = [
    "Cepat",
    "Kilat",
    "Aman",
    "Utama",
    "Jaya",
    "Sukses",
    "Lancar",
    "Mandiri",
    "Sentosa",
    "Prima",
  ];
  const nouns = [
    "Logistik",
    "Kargo",
    "Ekspres",
    "Trans",
    "Kurir",
    "Antaran",
    "Jasa",
    "Paket",
    "Distribusi",
    "Transport",
  ];

  const data = [];
  for (let i = 1; i <= 100; i++) {
    const adj = adjectives[i % adjectives.length];
    const noun = nouns[(i * 3) % nouns.length];
    const namaVendor = `${adj} ${noun} ${i}`;
    const noTelepon = `021888${String(1000 + i)}`;

    data.push({
      namaVendor,
      noTelepon,
      status: i % 12 === 0 ? "Nonaktif" : "Aktif",
    });
  }

  await db.insert(ekspedisi).values(data).onConflictDoNothing();

  console.log(`✅ Seeded ${data.length} ekspedisi`);
}
