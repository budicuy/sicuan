import { eq } from "drizzle-orm";
import { db } from "@/db";
import { kupon, penukaranKupon, users } from "@/db/schema";

export async function seedKupon() {
  console.log(
    "🌱 Seeding exactly 3 kupons and 3 penukaran kupon (different tiers)...",
  );

  // Define 3 kupons
  const kuponData = [
    {
      nama: "Voucher Belanja Indomaret",
      deskripsi: "Diskon belanja Rp10.000 di seluruh gerai Indomaret",
      poin: 50,
      tier: "silver" as const,
    },
    {
      nama: "Voucher Diskon BBM Pertamina",
      deskripsi: "Potongan harga BBM Rp30.000 di SPBU Pertamina",
      poin: 150,
      tier: "gold" as const,
    },
    {
      nama: "E-Wallet OVO Saldo Rp100k",
      deskripsi: "Top up saldo OVO gratis senilai Rp100.000",
      poin: 300,
      tier: "diamond" as const,
    },
  ];

  await db.delete(penukaranKupon);
  await db.delete(kupon);

  const insertedKupons = await db.insert(kupon).values(kuponData).returning();

  // Find Budi Santoso user
  const budi = await db.query.users.findFirst({
    where: eq(users.username, "budi.santoso"),
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
