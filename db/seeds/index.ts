import * as fs from "node:fs";
import * as path from "node:path";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appSettings,
  buktiPembayaran,
  ekspedisi,
  hargaSampah,
  nasabah,
  pencairanDana,
  penukaranRewardWarmindo,
  poinSampah,
  poinSampahWarmindo,
  rawMaterial,
  rewardTopKontributor,
  rewardWarmindo,
  setorSampah,
  users,
  videoPost,
} from "@/db/schema";

interface SeederJsonPayload {
  exportedAt: string;
  totalRecords: number;
  tables: {
    appSettings: Record<string, unknown>[];
    users: Record<string, unknown>[];
    nasabah: Record<string, unknown>[];
    ekspedisi: Record<string, unknown>[];
    hargaSampah: Record<string, unknown>[];
    poinSampah: Record<string, unknown>[];
    poinSampahWarmindo: Record<string, unknown>[];
    rawMaterial: Record<string, unknown>[];
    setorSampah: Record<string, unknown>[];
    pencairanDana: Record<string, unknown>[];
    buktiPembayaran: Record<string, unknown>[];
    rewardWarmindo: Record<string, unknown>[];
    penukaranRewardWarmindo: Record<string, unknown>[];
    rewardTopKontributor: Record<string, unknown>[];
    videoPost: Record<string, unknown>[];
  };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function toDate(val: unknown): Date | null {
  if (!val) return null;
  return new Date(val as string | number);
}

export async function seedDatabaseFromJson(customPath?: string) {
  const jsonPath =
    customPath ||
    path.join(process.cwd(), "db/seeds/data/production-data.json");

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`File seeder JSON tidak ditemukan di: ${jsonPath}`);
  }

  console.log(`📖 Membaca data seeder dari: ${jsonPath}`);
  const rawContent = fs.readFileSync(jsonPath, "utf-8");
  const payload = JSON.parse(rawContent) as SeederJsonPayload;

  console.log(`📦 Terdeteksi ${payload.totalRecords} record siap di-seed.`);

  // 1. Bersihkan data secara berurutan sesuai relasi foreign key
  console.log("🧹 Mengosongkan data lama...");
  await db.delete(buktiPembayaran);
  await db.delete(pencairanDana);
  await db.delete(setorSampah);
  await db.delete(penukaranRewardWarmindo);
  await db.delete(rewardTopKontributor);
  await db.delete(rewardWarmindo);
  await db.delete(nasabah);
  await db.delete(users);
  await db.delete(ekspedisi);
  await db.delete(hargaSampah);
  await db.delete(poinSampah);
  await db.delete(poinSampahWarmindo);
  await db.delete(rawMaterial);
  await db.delete(videoPost);
  await db.delete(appSettings);

  // 2. Insert tabel tanpa FK
  console.log("🌱 Seeding app_settings...");
  if (payload.tables.appSettings.length > 0) {
    await db.insert(appSettings).values(
      payload.tables.appSettings.map((row) => ({
        ...row,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
      })) as unknown as (typeof appSettings.$inferInsert)[],
    );
  }

  console.log("🌱 Seeding ekspedisi...");
  if (payload.tables.ekspedisi.length > 0) {
    await db.insert(ekspedisi).values(
      payload.tables.ekspedisi.map((row) => ({
        ...row,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
      })) as unknown as (typeof ekspedisi.$inferInsert)[],
    );
  }

  console.log("🌱 Seeding harga_sampah...");
  if (payload.tables.hargaSampah.length > 0) {
    await db.insert(hargaSampah).values(
      payload.tables.hargaSampah.map((row) => ({
        ...row,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
      })) as unknown as (typeof hargaSampah.$inferInsert)[],
    );
  }

  console.log("🌱 Seeding poin_sampah...");
  if (payload.tables.poinSampah.length > 0) {
    await db.insert(poinSampah).values(
      payload.tables.poinSampah.map((row) => ({
        ...row,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
      })) as unknown as (typeof poinSampah.$inferInsert)[],
    );
  }

  console.log("🌱 Seeding poin_sampah_warmindo...");
  if (payload.tables.poinSampahWarmindo.length > 0) {
    await db.insert(poinSampahWarmindo).values(
      payload.tables.poinSampahWarmindo.map((row) => ({
        ...row,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
      })) as unknown as (typeof poinSampahWarmindo.$inferInsert)[],
    );
  }

  console.log("🌱 Seeding raw_material...");
  if (payload.tables.rawMaterial.length > 0) {
    await db.insert(rawMaterial).values(
      payload.tables.rawMaterial.map((row) => ({
        ...row,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
      })) as unknown as (typeof rawMaterial.$inferInsert)[],
    );
  }

  console.log("🌱 Seeding master_reward (rewardWarmindo)...");
  if (payload.tables.rewardWarmindo.length > 0) {
    await db.insert(rewardWarmindo).values(
      payload.tables.rewardWarmindo.map((row) => ({
        ...row,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
      })) as unknown as (typeof rewardWarmindo.$inferInsert)[],
    );
  }

  console.log("🌱 Seeding video_post...");
  if (payload.tables.videoPost.length > 0) {
    await db.insert(videoPost).values(
      payload.tables.videoPost.map((row) => ({
        ...row,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
      })) as unknown as (typeof videoPost.$inferInsert)[],
    );
  }

  // 3. Seeding users (batch 100)
  console.log(`🌱 Seeding users (${payload.tables.users.length} baris)...`);
  const userChunks = chunkArray(payload.tables.users, 100);
  for (const chunk of userChunks) {
    await db.insert(users).values(
      chunk.map((row) => ({
        ...row,
        resetTokenExpires: toDate(row.resetTokenExpires),
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
      })) as unknown as (typeof users.$inferInsert)[],
    );
  }

  // 4. Seeding nasabah (batch 100)
  console.log(`🌱 Seeding nasabah (${payload.tables.nasabah.length} baris)...`);
  const nasabahChunks = chunkArray(payload.tables.nasabah, 100);
  for (const chunk of nasabahChunks) {
    await db.insert(nasabah).values(
      chunk.map((row) => ({
        ...row,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
      })) as unknown as (typeof nasabah.$inferInsert)[],
    );
  }

  // 5. Seeding setor_sampah
  console.log(
    `🌱 Seeding setor_sampah (${payload.tables.setorSampah.length} baris)...`,
  );
  if (payload.tables.setorSampah.length > 0) {
    const setorChunks = chunkArray(payload.tables.setorSampah, 100);
    for (const chunk of setorChunks) {
      await db.insert(setorSampah).values(
        chunk.map((row) => ({
          ...row,
          createdAt: toDate(row.createdAt),
          updatedAt: toDate(row.updatedAt),
        })) as unknown as (typeof setorSampah.$inferInsert)[],
      );
    }
  }

  // 6. Seeding pencairan_dana
  console.log("🌱 Seeding pencairan_dana...");
  if (payload.tables.pencairanDana.length > 0) {
    await db.insert(pencairanDana).values(
      payload.tables.pencairanDana.map((row) => ({
        ...row,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
      })) as unknown as (typeof pencairanDana.$inferInsert)[],
    );
  }

  // 7. Seeding bukti_pembayaran
  console.log("🌱 Seeding bukti_pembayaran...");
  if (payload.tables.buktiPembayaran.length > 0) {
    await db.insert(buktiPembayaran).values(
      payload.tables.buktiPembayaran.map((row) => ({
        ...row,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
      })) as unknown as (typeof buktiPembayaran.$inferInsert)[],
    );
  }

  // 8. Seeding penukaran_reward
  if (payload.tables.penukaranRewardWarmindo?.length > 0) {
    console.log("🌱 Seeding penukaran_reward...");
    await db.insert(penukaranRewardWarmindo).values(
      payload.tables.penukaranRewardWarmindo.map((row) => ({
        ...row,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
      })) as unknown as (typeof penukaranRewardWarmindo.$inferInsert)[],
    );
  }

  // 9. Seeding reward_top_kontributor
  if (payload.tables.rewardTopKontributor?.length > 0) {
    console.log("🌱 Seeding reward_top_kontributor...");
    await db.insert(rewardTopKontributor).values(
      payload.tables.rewardTopKontributor.map((row) => ({
        ...row,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
      })) as unknown as (typeof rewardTopKontributor.$inferInsert)[],
    );
  }

  // 10. Reset sequence ID serial PostgreSQL agar tidak bentrok
  console.log("🔄 Mereset sequence auto-increment serial di database...");
  const tablesWithSerial = [
    "users",
    "ekspedisi",
    "harga_sampah",
    "poin_sampah",
    "poin_sampah_warmindo",
    "raw_material",
    "master_reward",
    "video_post",
    "setor_sampah",
    "pencairan_dana",
    "bukti_pembayaran",
    "penukaran_reward",
    "reward_top_kontributor",
  ];

  for (const tbl of tablesWithSerial) {
    try {
      await db.execute(
        sql.raw(
          `SELECT setval(pg_get_serial_sequence('${tbl}', 'id'), COALESCE(MAX(id), 1)) FROM "${tbl}";`,
        ),
      );
    } catch {
      // Abaikan jika sequence berbeda atau tidak ada
    }
  }

  console.log("🎉 Seeding database dari JSON selesai dengan sempurna!");
}
