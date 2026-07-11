import { eq } from "drizzle-orm";
import { db } from "@/db";
import { setorSampah, users } from "@/db/schema";

export async function seedSetorSampah() {
  console.log("🌱 Seeding setor sampah for unified table...");

  await db.delete(setorSampah);

  // Get active users
  const budi = await db.query.users.findFirst({
    where: eq(users.username, "budi.santoso"),
  });
  const warmindo = await db.query.users.findFirst({
    where: eq(users.username, "warmindo.demo"),
  });
  const bankSampah = await db.query.users.findFirst({
    where: eq(users.username, "banksampah.demo"),
  });

  if (!budi || !warmindo || !bankSampah) {
    throw new Error("Mandatory users not found during setor-sampah seeding!");
  }

  // Seed real setoran: Rosiana Dwi Hastuti (NIK 50023152)
  const rosiana = await db.query.users.findFirst({
    where: eq(users.username, "50023152"),
  });

  if (rosiana) {
    const rosianaSetoran = [
      {
        nomorSetor: "1/B/NDL/BJM/09/07/2026",
        userId: rosiana.id,
        jenisSampah: "Etiket" as const,
        beratKg: 0.45,
        beratAiKg: 0.45,
        tanggalSetor: "2026-07-09",
        fotoTimbangan:
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-timbangan/26667-b51af805-ab6a-46b7-a093-8d37652c32e9.webp",
        fotoBuktiTambahan: [
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-timbangan/26667-b51af805-ab6a-46b7-a093-8d37652c32e9.webp",
        ],
        totalPoin: 11,
        status: "diterima" as const,
        kategoriNasabah: "konsumen" as const,
        metodeSetor: "langsung" as const,
        createdAt: new Date("2026-07-09T07:20:53.346Z"),
        updatedAt: new Date("2026-07-09T07:20:53.346Z"),
      },
    ];
    await db.insert(setorSampah).values(rosianaSetoran);
    console.log("✅ Seeded setoran Rosiana Dwi Hastuti (50023152)");
  } else {
    console.warn("⚠️ User Rosiana (50023152) tidak ditemukan, skip setoran.");
  }

  console.log("✅ Seeded split setoran and pencairan successfully");
}
