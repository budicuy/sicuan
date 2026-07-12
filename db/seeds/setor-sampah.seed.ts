import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { setorSampah, users } from "@/db/schema";
import { nasabah } from "@/db/schema/nasabah";

export async function seedSetorSampah() {
  console.log("🌱 Seeding setor sampah for unified table...");

  await db.delete(setorSampah);

  // Get active users
  const budi = await db.query.users.findFirst({
    where: eq(users.username, "budi.santoso"),
  });
  const warmindo = await db.query.users.findFirst({
    where: eq(users.username, "warmindo.demo"),
  });
  const bankSampah = await db.query.users.findFirst({
    where: eq(users.username, "banksampah.demo"),
  });

  if (!budi || !warmindo || !bankSampah) {
    throw new Error("Mandatory users not found during setor-sampah seeding!");
  }

  // Seed real setoran: Rosiana Dwi Hastuti (NIK 50023152)
  const rosiana = await db.query.users.findFirst({
    where: eq(users.username, "50023152"),
  });

  if (rosiana) {
    const rosianaSetoran = [
      {
        nomorSetor: "1/K/NDL/BJM/09/07/2026",
        userId: rosiana.id,
        jenisSampah: "Etiket" as const,
        beratKg: 0.45,
        beratAiKg: 0.45,
        tanggalSetor: "2026-07-09",
        fotoTimbangan:
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-timbangan/26667-b51af805-ab6a-46b7-a093-8d37652c32e9.webp",
        fotoBuktiTambahan: [
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-timbangan/26667-b51af805-ab6a-46b7-a093-8d37652c32e9.webp",
        ],
        totalPoin: 11,
        status: "diterima" as const,
        kategoriNasabah: "konsumen" as const,
        metodeSetor: "langsung" as const,
        createdAt: new Date("2026-07-09T07:20:53.346Z"),
        updatedAt: new Date("2026-07-09T07:20:53.346Z"),
      },
    ];
    await db.insert(setorSampah).values(rosianaSetoran);

    // Sync points to nasabah table
    await db
      .update(nasabah)
      .set({
        poin: sql`${nasabah.poin} + 11`,
      })
      .where(eq(nasabah.id, rosiana.id));

    console.log(
      "✅ Seeded setoran Rosiana Dwi Hastuti (50023152) & disinkronkan 11 poin",
    );
  } else {
    console.warn("⚠️ User Rosiana (50023152) tidak ditemukan, skip setoran.");
  }

  // ── DATA REAL: TPS 3R Sidoarjo (SPK-001) ──────────────────────────────────
  // Dokumen: Mei 2026 | Tunai | Sampling produk 1 dus
  // Plastik Kemasan: 2 kg → Total Tagihan: Rp25.000
  const bsSidoarjo = await db.query.nasabah.findFirst({
    where: (nasabah, { eq }) => eq(nasabah.username, "banksampah.sidoarjo"),
  });

  if (bsSidoarjo) {
    await db.insert(setorSampah).values([
      {
        nomorSetor: "2/B/NDL/BJM/01/05/2026",
        userId: bsSidoarjo.id,
        jenisSampah: "Etiket" as const, // Plastik Kemasan (Etiket = jenis plastik di enum)
        beratKg: 2.0,
        beratAiKg: 2.0,
        tanggalSetor: "2026-05-01",
        fotoTimbangan:
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-timbangan/8139-7dd34e57-069c-4a5d-9bd9-1dd2dcc9fc25.webp",
        fotoBuktiTambahan: [
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-bukti-tambahan/8139-1df2f2c9-c943-4a9a-ac95-cff35a0eb59d-1.webp",
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-bukti-tambahan/8139-1df2f2c9-c943-4a9a-ac95-cff35a0eb59d-2.webp",
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-bukti-tambahan/8139-1df2f2c9-c943-4a9a-ac95-cff35a0eb59d-3.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: "langsung",
        createdAt: new Date("2026-05-01T08:00:00.000Z"),
        updatedAt: new Date("2026-05-01T08:00:00.000Z"),
      },
    ]);
    console.log("✅ Seeded setoran TPS 3R Sidoarjo (SPK-001) — Mei 2026");
  } else {
    console.warn(
      "⚠️ User banksampah.sidoarjo tidak ditemukan, skip setoran SPK-001.",
    );
  }

  // ── DATA REAL: Bank Sampah Banjarbaru / TPS 3R Gotong Royong (SPK-002) ────
  // Dokumen: Mei 2026 | Tunai | Sampling produk 1 dus
  // Plastik Kemasan: 14.98 kg | Paper Cup: 15.01 kg | Karton: 1.50 kg
  // Total: 31.49 kg → Total Tagihan: Rp200.000
  const bsBanjarbaru = await db.query.nasabah.findFirst({
    where: (nasabah, { eq }) => eq(nasabah.username, "banksampah.banjarbaru"),
  });

  if (bsBanjarbaru) {
    await db.insert(setorSampah).values([
      {
        nomorSetor: "3/B/NDL/BJM/01/05/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Etiket" as const, // Plastik Kemasan
        beratKg: 14.98,
        beratAiKg: 14.98,
        tanggalSetor: "2026-05-01",
        fotoTimbangan:
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-timbangan/9766-3c0f792a-f9c0-4793-b982-fdb2a2f76c80.webp",
        fotoBuktiTambahan: [
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-bukti-tambahan/9766-c8da98c2-6bdd-4e71-b780-75162c8fd262-1.webp",
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-bukti-tambahan/9766-c8da98c2-6bdd-4e71-b780-75162c8fd262-2.webp",
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-bukti-tambahan/9766-c8da98c2-6bdd-4e71-b780-75162c8fd262-3.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: "langsung",
        createdAt: new Date("2026-05-01T08:00:00.000Z"),
        updatedAt: new Date("2026-05-01T08:00:00.000Z"),
      },
      {
        nomorSetor: "4/B/NDL/BJM/01/05/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Paper Cup" as const,
        beratKg: 15.01,
        beratAiKg: 15.01,
        tanggalSetor: "2026-05-01",
        fotoTimbangan:
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-timbangan/9766-3c0f792a-f9c0-4793-b982-fdb2a2f76c80.webp",
        fotoBuktiTambahan: [
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-bukti-tambahan/9766-c8da98c2-6bdd-4e71-b780-75162c8fd262-1.webp",
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-bukti-tambahan/9766-c8da98c2-6bdd-4e71-b780-75162c8fd262-2.webp",
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-bukti-tambahan/9766-c8da98c2-6bdd-4e71-b780-75162c8fd262-3.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: "langsung",
        createdAt: new Date("2026-05-01T08:10:00.000Z"),
        updatedAt: new Date("2026-05-01T08:10:00.000Z"),
      },
      {
        nomorSetor: "5/B/NDL/BJM/01/05/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Karton" as const,
        beratKg: 1.5,
        beratAiKg: 1.5,
        tanggalSetor: "2026-05-01",
        fotoTimbangan:
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-timbangan/9766-3c0f792a-f9c0-4793-b982-fdb2a2f76c80.webp",
        fotoBuktiTambahan: [
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-bukti-tambahan/9766-c8da98c2-6bdd-4e71-b780-75162c8fd262-1.webp",
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-bukti-tambahan/9766-c8da98c2-6bdd-4e71-b780-75162c8fd262-2.webp",
          "https://pub-2b4d39fb7c2c4418a4af69873887c95e.r2.dev/setor-sampah/setoran-bukti-tambahan/9766-c8da98c2-6bdd-4e71-b780-75162c8fd262-3.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: "langsung",
        createdAt: new Date("2026-05-01T08:20:00.000Z"),
        updatedAt: new Date("2026-05-01T08:20:00.000Z"),
      },
    ]);
    console.log(
      "✅ Seeded setoran Bank Sampah Banjarbaru (SPK-002) — Mei 2026 (3 item: Plastik 14.98kg + Paper Cup 15.01kg + Karton 1.50kg)",
    );
  } else {
    console.warn(
      "⚠️ User banksampah.banjarbaru tidak ditemukan, skip setoran SPK-002.",
    );
  }

  console.log("✅ Seeded split setoran and pencairan successfully");
}
