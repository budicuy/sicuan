import fs from "node:fs/promises";
import path from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

import { uploadImageToR2 } from "@/app/lib/r2";
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

  // Hapus seeder reward lama
  console.log("🗑️ Menghapus data reward warmindo lama...");
  await db.delete(rewardWarmindo);

  // Baca file gambar dari folder dummy
  const dummyDir = path.join(process.cwd(), "dummy");
  const files = (await fs.readdir(dummyDir)).filter((f) =>
    /\.(jpe?g|png|webp)$/i.test(f),
  );

  console.log(`📦 Ditemukan ${files.length} file gambar di folder dummy.`);

  const rewardItems: (typeof rewardWarmindo.$inferInsert)[] = [];

  for (const file of files) {
    const filePath = path.join(dummyDir, file);
    const fileBuffer = await fs.readFile(filePath);

    // Format nama reward dari nama file
    const baseName = path.parse(file).name;
    const namaReward = baseName.replace(/[_-]/g, " ").trim();
    const slug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    console.log(`⬆️ Mengunggah ${file} ke Cloudflare R2...`);
    let gambarUrl: string | null = null;
    try {
      gambarUrl = await uploadImageToR2(fileBuffer, "reward-warmindo", slug);
      console.log(`✅ Berhasil diunggah: ${gambarUrl}`);
    } catch (err) {
      console.error(`❌ Gagal upload ${file} ke R2:`, err);
    }

    rewardItems.push({
      nama: namaReward,
      kategori: "barang",
      nominalUang: null,
      poin: 100,
      stok: 1,
      status: "aktif",
      deskripsi: "",
      gambar: gambarUrl,
    });
  }

  if (rewardItems.length > 0) {
    await db.insert(rewardWarmindo).values(rewardItems);
    console.log(
      `🎉 Berhasil memasukkan ${rewardItems.length} reward baru ke database!`,
    );
  }

  console.log("✅ Seeded poin_sampah_warmindo & reward_warmindo successfully");
}
