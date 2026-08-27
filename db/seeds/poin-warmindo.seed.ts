import { db } from "@/db";
import { poinSampahWarmindo, rewardWarmindo } from "@/db/schema";

export async function seedPoinWarmindo() {
  console.log("🌱 Seeding master poin & reward warmindo...");

  const poinData: (typeof poinSampahWarmindo.$inferInsert)[] = [
    { jenisSampah: "Paper Cup", poinPer100Gram: 10 },
    { jenisSampah: "Etiket", poinPer100Gram: 10 },
    { jenisSampah: "Karton", poinPer100Gram: 10 },
  ];

  await db.delete(poinSampahWarmindo);
  await db.insert(poinSampahWarmindo).values(poinData);

  const rewardData: (typeof rewardWarmindo.$inferInsert)[] = [
    {
      nama: "Uang Tunai Rp 25.000",
      kategori: "uang",
      nominalUang: 25000,
      poin: 250,
      stok: 100,
      status: "aktif",
      deskripsi:
        "Pencairan reward tunai sebesar Rp 25.000 langsung ke rekening bank mitra.",
    },
    {
      nama: "Uang Tunai Rp 50.000",
      kategori: "uang",
      nominalUang: 50000,
      poin: 500,
      stok: 100,
      status: "aktif",
      deskripsi:
        "Pencairan reward tunai sebesar Rp 50.000 langsung ke rekening bank mitra.",
    },
    {
      nama: "Uang Tunai Rp 100.000",
      kategori: "uang",
      nominalUang: 100000,
      poin: 1000,
      stok: 100,
      status: "aktif",
      deskripsi:
        "Pencairan reward tunai sebesar Rp 100.000 langsung ke rekening bank mitra.",
    },
    {
      nama: "Kaos Eksklusif Mitra Indofood",
      kategori: "barang",
      nominalUang: null,
      poin: 300,
      stok: 50,
      status: "aktif",
      deskripsi:
        "Kaos polo eksklusif katun premium dengan logo bordir Indofood & SiCuan.",
    },
    {
      nama: "Wajan Penggorengan Deep Wok 32cm",
      kategori: "barang",
      nominalUang: null,
      poin: 750,
      stok: 30,
      status: "aktif",
      deskripsi:
        "Wajan anti lengket heavy duty untuk kebutuhan memasak di warung.",
    },
    {
      nama: "Kompor Gas Komersial 2 Tungku",
      kategori: "barang",
      nominalUang: null,
      poin: 2000,
      stok: 15,
      status: "aktif",
      deskripsi:
        "Kompor gas 2 tungku api biru efisien untuk operasional harian Warmindo.",
    },
  ];

  await db.delete(rewardWarmindo);
  await db.insert(rewardWarmindo).values(rewardData);

  console.log("✅ Seeded poin_sampah_warmindo & reward_warmindo successfully");
}
