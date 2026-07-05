import { eq } from "drizzle-orm";
import { db } from "@/db";
import { kupon, nasabah, penukaranKupon } from "@/db/schema";

export async function seedKupon() {
  console.log(
    "🌱 Seeding exactly 3 kupons and 3 penukaran kupon (different tiers)...",
  );

  // Define 3 kupons
  const kuponData = [
    {
      nama: "Voucher 25K",
      deskripsi:
        "Potongan Harga Rp. 25.000 untuk Belanja di Koperasi PT. Indofood",
      poin: 50,
      tier: "silver" as const,
    },
    {
      nama: "Voucher 75K",
      deskripsi:
        "Potongan Harga Rp. 75.000 untuk Belanja di Koperasi PT. Indofood",
      poin: 150,
      tier: "gold" as const,
    },
    {
      nama: "Voucher 150K",
      deskripsi:
        "Potongan Harga Rp. 150.000 untuk Belanja di Koperasi PT. Indofood",
      poin: 300,
      tier: "diamond" as const,
    },
  ];

  await db.delete(penukaranKupon);
  await db.delete(kupon);

  const insertedKupons = await db.insert(kupon).values(kuponData).returning();

  // Find Budi Santoso user
  const budi = await db.query.nasabah.findFirst({
    where: eq(nasabah.username, "budi.santoso"),
  });

  if (!budi) {
    throw new Error("User budi.santoso not found during kupon seeding!");
  }

  // Redeem each of the 3 kupons once for budi.santoso
  const penukaranData = insertedKupons.map((k, index) => {
    return {
      userId: budi.id,
      kuponId: k.id,
      kodeUnik: `KPN-DEMO-${k.tier.toUpperCase()}-${index + 1}`,
      status: "aktif",
      createdAt: new Date(),
    };
  });

  await db.insert(penukaranKupon).values(penukaranData);

  console.log(
    `✅ Seeded ${insertedKupons.length} kupons and ${penukaranData.length} penukaran kupon successfully`,
  );
}
