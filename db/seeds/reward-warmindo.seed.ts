import fs from "node:fs/promises";
import path from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

import { uploadImageToR2 } from "@/app/lib/r2";
import { db } from "@/db";
import { rewardWarmindo } from "@/db/schema";

export const latestRewardWarmindoData = [
  {
    nama: "WALL CLOCK",
    kategori: "barang" as const,
    deskripsi: "",
    poin: 2750,
    nominalUang: null,
    stok: 4,
    gambar: "/api/media/setor-sampah/reward-warmindo/wall-clock.webp",
    status: "aktif" as const,
    fileDummy: "WALL-CLOCK.jpeg",
    slug: "wall-clock",
  },
  {
    nama: "WAIST BAG",
    kategori: "barang" as const,
    deskripsi: "",
    poin: 4000,
    nominalUang: null,
    stok: 29,
    gambar: "/api/media/setor-sampah/reward-warmindo/waist-bag.webp",
    status: "aktif" as const,
    fileDummy: "WAIST-BAG.jpeg",
    slug: "waist-bag",
  },
  {
    nama: "SPUNBOUND BAG",
    kategori: "barang" as const,
    deskripsi: "",
    poin: 100,
    nominalUang: null,
    stok: 100,
    gambar: "/api/media/setor-sampah/reward-warmindo/spunbound-bag.webp",
    status: "aktif" as const,
    fileDummy: "SPUNBOUND-BAG.jpeg",
    slug: "spunbound-bag",
  },
  {
    nama: "SLING BAG",
    kategori: "barang" as const,
    deskripsi: "",
    poin: 4000,
    nominalUang: null,
    stok: 97,
    gambar: "/api/media/setor-sampah/reward-warmindo/sling-bag.webp",
    status: "aktif" as const,
    fileDummy: "SLING-BAG.jpeg",
    slug: "sling-bag",
  },
  {
    nama: "SARAMI GELAS PIN",
    kategori: "barang" as const,
    deskripsi: "",
    poin: 25,
    nominalUang: null,
    stok: 100,
    gambar: "/api/media/setor-sampah/reward-warmindo/sarami-gelas-pin.webp",
    status: "aktif" as const,
    fileDummy: "SARAMI-GELAS-PIN.jpeg",
    slug: "sarami-gelas-pin",
  },
  {
    nama: "RAMEN SPOON",
    kategori: "barang" as const,
    deskripsi: "",
    poin: 150,
    nominalUang: null,
    stok: 200,
    gambar: "/api/media/setor-sampah/reward-warmindo/ramen-spoon.webp",
    status: "aktif" as const,
    fileDummy: "RAMEN-SPOON.jpeg",
    slug: "ramen-spoon",
  },
  {
    nama: "POP MIE GELAS",
    kategori: "barang" as const,
    deskripsi: "",
    poin: 900,
    nominalUang: null,
    stok: 50,
    gambar: "/api/media/setor-sampah/reward-warmindo/pop-mie-gelas.webp",
    status: "aktif" as const,
    fileDummy: "POP-MIE-GELAS.jpeg",
    slug: "pop-mie-gelas",
  },
  {
    nama: "NOTE BOOK",
    kategori: "barang" as const,
    deskripsi: "",
    poin: 150,
    nominalUang: null,
    stok: 100,
    gambar: "/api/media/setor-sampah/reward-warmindo/note-book.webp",
    status: "aktif" as const,
    fileDummy: "NOTE-BOOK.jpeg",
    slug: "note-book",
  },
  {
    nama: "HAND HELD FAN VERSI 1",
    kategori: "barang" as const,
    deskripsi: "",
    poin: 100,
    nominalUang: null,
    stok: 50,
    gambar:
      "/api/media/setor-sampah/reward-warmindo/hand-held-fan-versi-1.webp",
    status: "aktif" as const,
    fileDummy: "HAND-HELD-FAN_VERSI-1.jpeg",
    slug: "hand-held-fan-versi-1",
  },
  {
    nama: "HAND HELD FAN VERSI 2",
    kategori: "barang" as const,
    deskripsi: "",
    poin: 100,
    nominalUang: null,
    stok: 30,
    gambar:
      "/api/media/setor-sampah/reward-warmindo/hand-held-fan-versi-2.webp",
    status: "aktif" as const,
    fileDummy: "HAND-HELD-FAN-VERSI-2.jpeg",
    slug: "hand-held-fan-versi-2",
  },
  {
    nama: "CHOPSTICKS",
    kategori: "barang" as const,
    deskripsi: "",
    poin: 600,
    nominalUang: null,
    stok: 50,
    gambar: "/api/media/setor-sampah/reward-warmindo/chopsticks.webp",
    status: "aktif" as const,
    fileDummy: "CHOPSTICKS.jpeg",
    slug: "chopsticks",
  },
];

export async function seedRewardWarmindo() {
  console.log("🌱 Seeding reward warmindo terbaru...");

  // Hapus data reward warmindo lama
  console.log("🗑️ Menghapus data reward warmindo lama...");
  await db.delete(rewardWarmindo);

  const dummyDir = path.join(process.cwd(), "dummy");
  const rewardItems: (typeof rewardWarmindo.$inferInsert)[] = [];

  for (const item of latestRewardWarmindoData) {
    let gambarUrl = item.gambar;

    // Jika file dummy ada, coba upload ke R2 jika belum terupload
    try {
      const filePath = path.join(dummyDir, item.fileDummy);
      const fileBuffer = await fs.readFile(filePath);
      console.log(`⬆️ Mengunggah ${item.fileDummy} ke Cloudflare R2...`);
      const uploadedUrl = await uploadImageToR2(
        fileBuffer,
        "reward-warmindo",
        item.slug,
      );
      if (uploadedUrl) {
        gambarUrl = uploadedUrl;
        console.log(`✅ Berhasil diunggah: ${gambarUrl}`);
      }
    } catch {
      console.log(`ℹ️ Menggunakan path gambar yang ada: ${gambarUrl}`);
    }

    rewardItems.push({
      nama: item.nama,
      kategori: item.kategori,
      nominalUang: item.nominalUang,
      poin: item.poin,
      stok: item.stok,
      status: item.status,
      deskripsi: item.deskripsi,
      gambar: gambarUrl,
    });
  }

  if (rewardItems.length > 0) {
    await db.insert(rewardWarmindo).values(rewardItems);
    console.log(
      `🎉 Berhasil memasukkan ${rewardItems.length} reward warmindo terbaru ke database!`,
    );
  }

  console.log("✅ Seeded reward_warmindo successfully");
}
