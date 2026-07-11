import { db } from "@/db";
import { poinSampah } from "@/db/schema";

export async function seedPoinSampah() {
  console.log("🌱 Seeding master poin...");

  const poinData: (typeof poinSampah.$inferInsert)[] = [
    { jenisSampah: "Paper Cup", pointPerKg: 30 },
    { jenisSampah: "Etiket", pointPerKg: 25 },
    { jenisSampah: "Karton", pointPerKg: 20 },
  ];

  await db.delete(poinSampah);
  await db.insert(poinSampah).values(poinData);
  console.log("✅ Seeded poin_sampah successfully");
}
