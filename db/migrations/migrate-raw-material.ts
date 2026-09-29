/**
 * Migration: Konsolidasi tabel raw_material dari 7-baris-per-periode
 * menjadi 1-baris-per-bulan dengan kolom flat per kategori x klasifikasi.
 *
 * Jalankan: bun db/migrations/migrate-raw-material.ts
 */

import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL must be specified");

const sql = neon(DATABASE_URL);

interface OldRow {
  id: number;
  periode: string;
  kategori: string;
  klasifikasi: string;
  berat_gram: number;
}

interface NewRow {
  periode: string;
  etiket_nn_gram: number;
  etiket_gn_gram: number;
  etiket_cn_gram: number;
  karton_nn_gram: number;
  karton_gn_gram: number;
  karton_cn_gram: number;
  cup_cn_gram: number;
}

async function migrate() {
  console.log("🚀 Memulai migrasi tabel raw_material...");

  // ── 1. Baca semua data lama ───────────────────────────────────────────────
  const oldData = (await sql`
    SELECT id, periode::text, kategori, klasifikasi, berat_gram
    FROM raw_material
    ORDER BY periode ASC
  `) as OldRow[];

  console.log(`📦 Ditemukan ${oldData.length} baris data lama.`);

  // ── 2. Kelompokkan per BULAN (YYYY-MM-01) ────────────────────────────────
  // Untuk setiap bulan ambil nilai terakhir per kombinasi (overwrite)
  const monthMap: Record<string, NewRow> = {};

  for (const row of oldData) {
    // Normalisasi ke hari pertama bulan
    // Query sudah cast ke ::text jadi selalu string "YYYY-MM-DD"
    const periodeStr = (row.periode as string).substring(0, 10);
    const monthKey = `${periodeStr.substring(0, 7)}-01`;

    if (!monthMap[monthKey]) {
      monthMap[monthKey] = {
        periode: monthKey,
        etiket_nn_gram: 0,
        etiket_gn_gram: 0,
        etiket_cn_gram: 0,
        karton_nn_gram: 0,
        karton_gn_gram: 0,
        karton_cn_gram: 0,
        cup_cn_gram: 0,
      };
    }

    const entry = monthMap[monthKey];
    const kat = row.kategori;
    const klas = row.klasifikasi;
    const gram = Number(row.berat_gram);

    if (kat === "Etiket" && klas === "Normal Noodle (NN)")
      entry.etiket_nn_gram = gram;
    else if (kat === "Etiket" && klas === "Glass Noodle (GN)")
      entry.etiket_gn_gram = gram;
    else if (kat === "Etiket" && klas === "Cup Noodle (CN)")
      entry.etiket_cn_gram = gram;
    else if (kat === "Karton" && klas === "Normal Noodle (NN)")
      entry.karton_nn_gram = gram;
    else if (kat === "Karton" && klas === "Glass Noodle (GN)")
      entry.karton_gn_gram = gram;
    else if (kat === "Karton" && klas === "Cup Noodle (CN)")
      entry.karton_cn_gram = gram;
    else if (kat === "Cup" && klas === "Cup Noodle (CN)")
      entry.cup_cn_gram = gram;
  }

  const months = Object.values(monthMap);
  console.log(
    `🗓️  Ditemukan ${months.length} bulan unik: ${Object.keys(monthMap).join(", ")}`,
  );

  // ── 3. Buat tabel baru dengan schema yang sudah diperbarui ────────────────
  console.log("🏗️  Membuat tabel raw_material_new...");
  await sql`
    CREATE TABLE IF NOT EXISTS raw_material_new (
      id         SERIAL PRIMARY KEY,
      periode    DATE NOT NULL,
      etiket_nn_gram DOUBLE PRECISION NOT NULL DEFAULT 0,
      etiket_gn_gram DOUBLE PRECISION NOT NULL DEFAULT 0,
      etiket_cn_gram DOUBLE PRECISION NOT NULL DEFAULT 0,
      karton_nn_gram DOUBLE PRECISION NOT NULL DEFAULT 0,
      karton_gn_gram DOUBLE PRECISION NOT NULL DEFAULT 0,
      karton_cn_gram DOUBLE PRECISION NOT NULL DEFAULT 0,
      cup_cn_gram    DOUBLE PRECISION NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT raw_material_new_periode_unique UNIQUE (periode)
    )
  `;

  // ── 4. Insert data yang sudah ditransformasi ──────────────────────────────
  console.log("💾 Menginsert data yang sudah dikonsolidasi...");
  for (const row of months) {
    await sql`
      INSERT INTO raw_material_new
        (periode, etiket_nn_gram, etiket_gn_gram, etiket_cn_gram,
         karton_nn_gram, karton_gn_gram, karton_cn_gram, cup_cn_gram)
      VALUES
        (${row.periode}, ${row.etiket_nn_gram}, ${row.etiket_gn_gram}, ${row.etiket_cn_gram},
         ${row.karton_nn_gram}, ${row.karton_gn_gram}, ${row.karton_cn_gram}, ${row.cup_cn_gram})
    `;
    console.log(`  ✅ Inserted periode ${row.periode}`);
  }

  // ── 5. Drop tabel lama, rename tabel baru ────────────────────────────────
  console.log("🔄 Mengganti tabel lama dengan tabel baru...");
  await sql`DROP TABLE raw_material`;
  await sql`ALTER TABLE raw_material_new RENAME TO raw_material`;
  await sql`ALTER TABLE raw_material RENAME CONSTRAINT raw_material_new_periode_unique TO raw_material_periode_unique`;

  // ── 6. Hapus enum lama yang tidak dipakai ────────────────────────────────
  console.log("🗑️  Menghapus enum lama...");
  await sql`DROP TYPE IF EXISTS raw_material_kategori`;
  await sql`DROP TYPE IF EXISTS raw_material_klasifikasi`;

  console.log("🎉 Migrasi berhasil!");
  console.log(
    `   ${months.length} baris tersimpan (dari ${oldData.length} baris lama)`,
  );
}

migrate().catch((err) => {
  console.error("❌ Migrasi gagal:", err);
  process.exit(1);
});
