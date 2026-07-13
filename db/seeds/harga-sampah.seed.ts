import { db } from "@/db";
import { hargaSampah } from "@/db/schema";

export async function seedHargaSampah() {
  console.log("🌱 Seeding range harga sampah...");

  const hargaData: (typeof hargaSampah.$inferInsert)[] = [
    // Karton
    { jenisSampah: "Karton", minBerat: 1, maxBerat: 5, harga: 25000 },
    { jenisSampah: "Karton", minBerat: 5, maxBerat: 10, harga: 50000 },
    { jenisSampah: "Karton", minBerat: 10, maxBerat: 20, harga: 100000 },
    { jenisSampah: "Karton", minBerat: 20, maxBerat: null, harga: 150000 },

    // Etiket
    { jenisSampah: "Etiket", minBerat: 1, maxBerat: 5, harga: 25000 },
    { jenisSampah: "Etiket", minBerat: 5, maxBerat: 10, harga: 50000 },
    { jenisSampah: "Etiket", minBerat: 10, maxBerat: 20, harga: 100000 },
    { jenisSampah: "Etiket", minBerat: 20, maxBerat: null, harga: 150000 },

    // Paper Cup
    { jenisSampah: "Paper Cup", minBerat: 1, maxBerat: 5, harga: 25000 },
    { jenisSampah: "Paper Cup", minBerat: 5, maxBerat: 10, harga: 50000 },
    { jenisSampah: "Paper Cup", minBerat: 10, maxBerat: 20, harga: 100000 },
    { jenisSampah: "Paper Cup", minBerat: 20, maxBerat: null, harga: 150000 },
  ];

  await db.delete(hargaSampah);
  await db.insert(hargaSampah).values(hargaData);
  console.log("✅ Seeded harga_sampah (range) successfully");
}
