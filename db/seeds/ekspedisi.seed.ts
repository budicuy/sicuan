import { db } from "@/db";
import { ekspedisi } from "@/db/schema";

export async function seedEkspedisi() {
  console.log("🌱 Seeding exactly 3 ekspedisi...");

  const data = [
    {
      namaVendor: "Gojek",
      noTelepon: "02129278888",
      status: "Aktif",
    },
    {
      namaVendor: "Grab",
      noTelepon: "02180661888",
      status: "Aktif",
    },
    {
      namaVendor: "Gosend",
      noTelepon: "02150200050",
      status: "Aktif",
    },
  ];

  await db.delete(ekspedisi);
  await db.insert(ekspedisi).values(data);

  console.log(`✅ Seeded ${data.length} ekspedisi successfully`);
}
