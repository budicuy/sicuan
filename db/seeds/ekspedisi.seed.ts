import { db } from "@/db";
import { ekspedisi } from "@/db/schema";

export async function seedEkspedisi() {
  console.log("🌱 Seeding exactly 3 ekspedisi...");

  const data = [
    {
      namaVendor: "JNE Express",
      noTelepon: "02129278888",
      status: "Aktif",
    },
    {
      namaVendor: "J&T Express",
      noTelepon: "02180661888",
      status: "Aktif",
    },
    {
      namaVendor: "SiCepat Ekspres",
      noTelepon: "02150200050",
      status: "Aktif",
    },
  ];

  await db.delete(ekspedisi);
  await db.insert(ekspedisi).values(data);

  console.log(`✅ Seeded ${data.length} ekspedisi successfully`);
}
