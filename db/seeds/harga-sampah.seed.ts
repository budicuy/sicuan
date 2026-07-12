import { db } from "@/db";
import { hargaSampah } from "@/db/schema";

export async function seedHargaSampah() {
  console.log("🌱 Seeding range harga sampah...");

  // Seed Harga Sampah (Range)
  // Karton:
  // - 1 s/d 5 kg: 20000
  // - 5 s/d 10 kg: 45000
  // - > 10 kg: 95000
  // Etiket:
  // - 1 s/d 5 kg: 22000
  // - 5 s/d 10 kg: 48000
  // - > 10 kg: 100000
  // Paper Cup:
  // - 1 s/d 5 kg: 25000
  // - 5 s/d 10 kg: 50000
  // - > 10 kg: 110000

  const hargaData: (typeof hargaSampah.$inferInsert)[] = [
    // Karton
    { jenisSampah: "Karton", minBerat: 1, maxBerat: 5, harga: 25000 },
    { jenisSampah: "Karton", minBerat: 5, maxBerat: 10, harga: 50000 },
    { jenisSampah: "Karton", minBerat: 10, maxBerat: 15, harga: 75000 },
    { jenisSampah: "Karton", minBerat: 15, maxBerat: 20, harga: 100000 },
    { jenisSampah: "Karton", minBerat: 20, maxBerat: 25, harga: 125000 },
    { jenisSampah: "Karton", minBerat: 25, maxBerat: null, harga: 150000 },

    // Etiket
    { jenisSampah: "Etiket", minBerat: 1, maxBerat: 5, harga: 25000 },
    { jenisSampah: "Etiket", minBerat: 5, maxBerat: 10, harga: 50000 },
    { jenisSampah: "Etiket", minBerat: 10, maxBerat: 15, harga: 75000 },
    { jenisSampah: "Etiket", minBerat: 15, maxBerat: 20, harga: 100000 },
    { jenisSampah: "Etiket", minBerat: 20, maxBerat: 25, harga: 125000 },
    { jenisSampah: "Karton", minBerat: 25, maxBerat: null, harga: 150000 },

    // Paper Cup
    { jenisSampah: "Paper Cup", minBerat: 1, maxBerat: 5, harga: 25000 },
    { jenisSampah: "Paper Cup", minBerat: 5, maxBerat: 10, harga: 50000 },
    { jenisSampah: "Paper Cup", minBerat: 10, maxBerat: 15, harga: 75000 },
    { jenisSampah: "Paper Cup", minBerat: 15, maxBerat: 20, harga: 100000 },
    { jenisSampah: "Paper Cup", minBerat: 20, maxBerat: 25, harga: 125000 },
    { jenisSampah: "Paper Cup", minBerat: 25, maxBerat: null, harga: 150000 },
  ];

  await db.delete(hargaSampah);
  await db.insert(hargaSampah).values(hargaData);
  console.log("✅ Seeded harga_sampah (range) successfully");
}
