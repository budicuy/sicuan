import { db } from "../index";
import { kupon } from "../schema";

export async function seedKupon() {
  console.log("🌱 Seeding 100 kupon...");

  const tiers = ["silver", "gold", "diamond"] as const;
  const prefixes: Record<string, string[]> = {
    silver: ["Diskon", "Cashback", "Gratis", "Potongan", " hemat"],
    gold: ["Premium", "Eksklusif", "VIP", "Special", "Loyalitas"],
    diamond: ["Ultimate", "Elite", "Platinum", "Royale", "Grand"],
  };
  const suffixes = [
    "Belanja",
    "Pengaturan",
    "Nasabah",
    "Paket",
    "Layanan",
    "Pengiriman",
  ];
  const warna: Record<string, string[]> = {
    silver: ["#9ca3af", "#b0b7c3", "#c4cdd7", "#6b7280", "#9ca3af"],
    gold: ["#f59e0b", "#d97706", "#b45309", "#fbbf24", "#f59e0b"],
    diamond: ["#3b82f6", "#0ea5e9", "#6366f1", "#22d3ee", "#3b82f6"],
  };
  const deskripsiTemplates: Record<string, string[]> = {
    silver: [
      "Kupon diskon untuk transaksi ringan",
      "Cashback kecil untuk nasabah baru",
      "Potongan ongkir dasar",
      "Hadiah gratisan bulanan",
      "Penghematan minimal per transaksi",
    ],
    gold: [
      "Paket eksklusif untuk nasabah setia",
      "Diskon besar untuk pembelian besar",
      "Cashback premium",
      "Layanan prioritas",
      "Bonus poin bulanan",
    ],
    diamond: [
      "Paket ultimate untuk high-value nasabah",
      "Diskon maksimal unlimited",
      "Cashback elite + VIP",
      "Layanan royal + dedicated support",
      "Bonus grand untuk transaksi besar",
    ],
  };

  const data = [];
  for (let i = 1; i <= 100; i++) {
    const tier = tiers[i % 3];
    const prefixList = prefixes[tier];
    const suffixList = suffixes;
    const _warnaList = warna[tier];
    const deskripsiList = deskripsiTemplates[tier];

    const prefix = prefixList[i % prefixList.length];
    const suffix = suffixList[i % suffixList.length];
    const nama = `${prefix} ${suffix} ${i}`;
    const deskripsi = deskripsiList[i % deskripsiList.length];
    const poin =
      tier === "silver"
        ? 50 + (i % 50)
        : tier === "gold"
          ? 150 + (i % 150)
          : 300 + (i % 300);
    data.push({
      nama,
      deskripsi,
      poin: Number.parseFloat(poin.toFixed(2)),
      tier,
    });
  }

  await db.insert(kupon).values(data).onConflictDoNothing();

  console.log(`✅ Seeded ${data.length} kupon`);
}
