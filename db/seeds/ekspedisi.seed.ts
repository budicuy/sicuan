import { db } from "@/db";
import { ekspedisi } from "@/db/schema";

export async function seedEkspedisi() {
  console.log("🌱 Seeding exactly 3 ekspedisi...");

  const data = [
    {
      namaVendor: "Gojek",
      noTelepon: "-",
      status: "Aktif",
    },
    {
      namaVendor: "Grab",
      noTelepon: "-",
      status: "Aktif",
    },
    {
      namaVendor: "Gosend",
      noTelepon: "-",
      status: "Aktif",
    },
    {
      namaVendor: "Internal Delivery",
      noTelepon: "0882022007234",
      status: "Aktif",
    },
  ];

  await db.delete(ekspedisi);
  await db.insert(ekspedisi).values(data);

  console.log(`✅ Seeded ${data.length} ekspedisi successfully`);
}
