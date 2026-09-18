import { db } from "@/db";
import { poinSampahWarmindo } from "@/db/schema";

export async function seedPoinWarmindo() {
  console.log("🌱 Seeding master poin warmindo...");

  const poinData: (typeof poinSampahWarmindo.$inferInsert)[] = [
    { jenisSampah: "Paper Cup", poinPer100Gram: 10 },
    { jenisSampah: "Etiket", poinPer100Gram: 10 },
    { jenisSampah: "Karton", poinPer100Gram: 10 },
  ];

  await db.delete(poinSampahWarmindo);
  await db.insert(poinSampahWarmindo).values(poinData);

  console.log("✅ Seeded poin_sampah_warmindo successfully");
}
