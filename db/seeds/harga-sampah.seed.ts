import { db } from "@/db";
import { hargaSampah } from "@/db/schema";

export async function seedHargaSampah() {
  console.log("🌱 Seeding range harga sampah...");

  const hargaData: (typeof hargaSampah.$inferInsert)[] = [
    // Karton
    { jenisSampah: "Karton", minBerat: 1, maxBerat: 5, harga: 25000 },
    { jenisSampah: "Karton", minBerat: 5, maxBerat: 10, harga: 50000 },
    { jenisSampah: "Karton", minBerat: 10, maxBerat: 15, harga: 75000 },
    { jenisSampah: "Karton", minBerat: 15, maxBerat: 20, harga: 100000 },
    { jenisSampah: "Karton", minBerat: 20, maxBerat: 25, harga: 125000 },
    { jenisSampah: "Karton", minBerat: 25, maxBerat: 30, harga: 150000 },
    { jenisSampah: "Karton", minBerat: 30, maxBerat: null, harga: 200000 },

    // Etiket
    { jenisSampah: "Etiket", minBerat: 1, maxBerat: 5, harga: 25000 },
    { jenisSampah: "Etiket", minBerat: 5, maxBerat: 10, harga: 50000 },
    { jenisSampah: "Etiket", minBerat: 10, maxBerat: 15, harga: 75000 },
    { jenisSampah: "Etiket", minBerat: 15, maxBerat: 20, harga: 100000 },
    { jenisSampah: "Etiket", minBerat: 20, maxBerat: 25, harga: 125000 },
    { jenisSampah: "Etiket", minBerat: 25, maxBerat: 30, harga: 150000 },
    { jenisSampah: "Etiket", minBerat: 30, maxBerat: null, harga: 200000 },

    // Paper Cup
    { jenisSampah: "Paper Cup", minBerat: 1, maxBerat: 5, harga: 25000 },
    { jenisSampah: "Paper Cup", minBerat: 5, maxBerat: 10, harga: 50000 },
    { jenisSampah: "Paper Cup", minBerat: 10, maxBerat: 15, harga: 75000 },
    { jenisSampah: "Paper Cup", minBerat: 15, maxBerat: 20, harga: 100000 },
    { jenisSampah: "Paper Cup", minBerat: 20, maxBerat: 25, harga: 125000 },
    { jenisSampah: "Paper Cup", minBerat: 25, maxBerat: 30, harga: 150000 },
    { jenisSampah: "Paper Cup", minBerat: 30, maxBerat: null, harga: 200000 },
  ];

  await db.delete(hargaSampah);
  await db.insert(hargaSampah).values(hargaData);
  console.log("✅ Seeded harga_sampah (range) successfully");
}
