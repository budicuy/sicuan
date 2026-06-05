import { eq } from "drizzle-orm";
import { db } from "../db";
import { hargaSampah, nasabah, setorSampah, users } from "../db/schema";

async function main() {
  console.log(
    "🔄 Synchronizing points and credits for seeded nasabah records...",
  );

  // 1. Get all nasabah profiles
  const profiles = await db.select().from(nasabah);
  console.log(`Found ${profiles.length} profiles to process.`);

  // 2. Loop profiles and calculate
  for (const profile of profiles) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, profile.userId),
    });

    if (!user) continue;

    // Get all accepted deposits
    const deposits = await db
      .select()
      .from(setorSampah)
      .where(eq(setorSampah.userId, user.id));

    let totalPoints = 0;
    let totalCredit = 0;

    for (const dep of deposits) {
      if (dep.status === "diterima") {
        totalPoints += dep.totalPoin;

        if (user.role === "warmiendo" || user.role === "bank-sampah") {
          // Get price of category
          const activePriceRes = await db
            .select({ hargaPerKg: hargaSampah.hargaPerKg })
            .from(hargaSampah)
            .where(eq(hargaSampah.jenisSampah, dep.jenisSampah))
            .orderBy(desc(hargaSampah.periode))
            .limit(1);

          const hargaPerKg = activePriceRes[0]?.hargaPerKg ?? 2000; // default to 2000 if not found
          totalCredit += Math.floor(dep.beratKg * hargaPerKg);
        }
      }
    }

    // Update nasabah
    await db
      .update(nasabah)
      .set({
        poin: totalPoints,
        kredit: totalCredit,
        updatedAt: new Date(),
      })
      .where(eq(nasabah.id, profile.id));

    console.log(
      `Updated user @${user.username} (Role: ${user.role}) -> Poin: ${totalPoints}, Kredit: Rp ${totalCredit}`,
    );
  }

  console.log("✅ Synchronization completed!");
  process.exit(0);
}

// Simple desc helper
function desc(column: unknown) {
  return {
    mapWith: () => {},
    asc: false,
    column,
  };
}

main().catch((err) => {
  console.error("Sync error:", err);
  process.exit(1);
});
