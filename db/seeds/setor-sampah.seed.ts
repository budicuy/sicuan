import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  pencairanDana,
  setorSampahBankSampah,
  setorSampahKonsumen,
  setorSampahWarmiendo,
  users,
} from "@/db/schema";

export async function seedSetorSampah() {
  console.log(
    "🌱 Seeding setor sampah for Konsumen, Warmiendo, and Bank Sampah tables...",
  );

  await db.delete(pencairanDana);
  await db.delete(setorSampahKonsumen);
  await db.delete(setorSampahWarmiendo);
  await db.delete(setorSampahBankSampah);

  // Get active users
  const budi = await db.query.users.findFirst({
    where: eq(users.username, "budi.santoso"),
  });
  const warmiendo = await db.query.users.findFirst({
    where: eq(users.username, "warmiendo.demo"),
  });
  const bankSampah = await db.query.users.findFirst({
    where: eq(users.username, "banksampah.demo"),
  });
  const activeEkspedisi = await db.query.ekspedisi.findMany();

  if (!budi || !warmiendo || !bankSampah) {
    throw new Error("Mandatory users not found during setor-sampah seeding!");
  }

  const jneId = activeEkspedisi[0]?.id || null;

  // Placeholder image
  const placeholderImage = "https://placehold.co/600x400";

  // 1. Seed budi.santoso setoran (POIN) -> masuk ke setoran_konsumen
  const budiSetoran = [
    {
      nomorSetor: `Setoran Budi Santoso – 1 Juni 2026`,
      userId: budi.id,
      jenisSampah: "Karton" as const,
      beratKg: 10,
      beratAiKg: 10,
      tanggalSetor: "2026-06-01",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 200,
      status: "diterima" as const,
    },
    {
      nomorSetor: `Setoran Budi Santoso – 2 Juni 2026`,
      userId: budi.id,
      jenisSampah: "Etiket" as const,
      beratKg: 8,
      beratAiKg: 8,
      tanggalSetor: "2026-06-02",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 200,
      status: "diterima" as const,
    },
    {
      nomorSetor: `Setoran Budi Santoso – 3 Juni 2026`,
      userId: budi.id,
      jenisSampah: "Paper Cup" as const,
      beratKg: 10,
      beratAiKg: 10,
      tanggalSetor: "2026-06-03",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 300,
      status: "diterima" as const,
    },
  ];

  await db.insert(setorSampahKonsumen).values(budiSetoran);

  // 2. Seed warmiendo.demo setoran (Kredit) -> masuk ke setoran_warmiendo
  const warmiendoSetoran = [
    {
      nomorSetor: `Setoran Mitra Warmiendo Demo – 1 Juni 2026`,
      userId: warmiendo.id,
      jenisSampah: "Karton" as const,
      beratKg: 10,
      beratAiKg: 10,
      tanggalSetor: "2026-06-01",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 0,
      status: "diterima" as const,
      metodeSetor: "langsung",
    },
    {
      nomorSetor: `Setoran Mitra Warmiendo Demo – 2 Juni 2026`,
      userId: warmiendo.id,
      jenisSampah: "Etiket" as const,
      beratKg: 20,
      beratAiKg: 20,
      tanggalSetor: "2026-06-02",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 0,
      status: "diterima" as const,
      metodeSetor: "langsung",
    },
    {
      nomorSetor: `Setoran Mitra Warmiendo Demo – 3 Juni 2026`,
      userId: warmiendo.id,
      jenisSampah: "Paper Cup" as const,
      beratKg: 15,
      beratAiKg: 15,
      tanggalSetor: "2026-06-03",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 0,
      status: "diterima" as const,
      metodeSetor: "ekspedisi",
      ekspedisiId: jneId,
    },
  ];

  await db.insert(setorSampahWarmiendo).values(warmiendoSetoran);

  // Seed warmiendo.demo withdrawals (Pencairan)
  const warmiendoPencairan = [
    {
      userId: warmiendo.id,
      jumlah: 30000,
      jenisBank: "BCA",
      noRekening: "1234567890",
      status: "berhasil",
      buktiTransfer: placeholderImage,
    },
    {
      userId: warmiendo.id,
      jumlah: 20000,
      jenisBank: "BCA",
      noRekening: "1234567890",
      status: "berhasil",
      buktiTransfer: placeholderImage,
    },
    {
      userId: warmiendo.id,
      jumlah: 15000,
      jenisBank: "BCA",
      noRekening: "1234567890",
      status: "pending",
    },
  ];

  await db.insert(pencairanDana).values(warmiendoPencairan);

  // 3. Seed banksampah.demo setoran (Kredit) -> masuk ke setoran_bank_sampah
  const bankSampahSetoran = [
    {
      nomorSetor: `Setoran Mitra Bank Sampah Demo – 1 Juni 2026`,
      userId: bankSampah.id,
      jenisSampah: "Karton" as const,
      beratKg: 15,
      beratAiKg: 15,
      tanggalSetor: "2026-06-01",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 300,
      status: "diterima" as const,
    },
    {
      nomorSetor: `Setoran Mitra Bank Sampah Demo – 2 Juni 2026`,
      userId: bankSampah.id,
      jenisSampah: "Paper Cup" as const,
      beratKg: 20,
      beratAiKg: 20,
      tanggalSetor: "2026-06-02",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 600,
      status: "diterima" as const,
    },
  ];

  await db.insert(setorSampahBankSampah).values(bankSampahSetoran);

  // Seed banksampah.demo withdrawals (Pencairan)
  const bankSampahPencairan = [
    {
      userId: bankSampah.id,
      jumlah: 40000,
      jenisBank: "BRI",
      noRekening: "0987654321",
      status: "berhasil",
      buktiTransfer: placeholderImage,
    },
    {
      userId: bankSampah.id,
      jumlah: 10000,
      jenisBank: "BRI",
      noRekening: "0987654321",
      status: "pending",
    },
  ];

  await db.insert(pencairanDana).values(bankSampahPencairan);

  console.log("✅ Seeded split setoran and pencairan successfully");
}
