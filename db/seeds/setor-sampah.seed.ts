import { eq } from "drizzle-orm";
import { db } from "@/db";
import { nasabah, setorSampah } from "@/db/schema";

export async function seedSetorSampah() {
  console.log("🌱 Seeding setor sampah for unified table...");

  await db.delete(setorSampah);

  // Get active users
  const budi = await db.query.nasabah.findFirst({
    where: eq(nasabah.username, "budi.santoso"),
  });
  const warmiendo = await db.query.nasabah.findFirst({
    where: eq(nasabah.username, "warmiendo.demo"),
  });
  const bankSampah = await db.query.nasabah.findFirst({
    where: eq(nasabah.username, "banksampah.demo"),
  });
  const activeEkspedisi = await db.query.ekspedisi.findMany();

  if (!budi || !warmiendo || !bankSampah) {
    throw new Error("Mandatory users not found during setor-sampah seeding!");
  }

  const jneId = activeEkspedisi[0]?.id || null;

  // Placeholder image
  const placeholderImage = "https://placehold.co/600x400";

  // 1. Seed budi.santoso setoran (POIN) -> masuk ke setor_sampah
  // Untuk selain warmiendo, metode setor adalah "langsung"
  const budiSetoran = [
    {
      nomorSetor: "1/B/NDL/BJM/01/06/2026",
      userId: budi.id,
      jenisSampah: "Karton" as const,
      beratKg: 10,
      beratAiKg: 10,
      tanggalSetor: "2026-06-01",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 200,
      status: "diterima" as const,
      kategoriNasabah: "konsumen" as const,
      metodeSetor: "langsung" as const,
    },
    {
      nomorSetor: "2/B/NDL/BJM/02/06/2026",
      userId: budi.id,
      jenisSampah: "Etiket" as const,
      beratKg: 8,
      beratAiKg: 8,
      tanggalSetor: "2026-06-02",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 200,
      status: "diterima" as const,
      kategoriNasabah: "konsumen" as const,
      metodeSetor: "langsung" as const,
    },
    {
      nomorSetor: "3/B/NDL/BJM/03/06/2026",
      userId: budi.id,
      jenisSampah: "Paper Cup" as const,
      beratKg: 10,
      beratAiKg: 10,
      tanggalSetor: "2026-06-03",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 300,
      status: "diterima" as const,
      kategoriNasabah: "konsumen" as const,
      metodeSetor: "langsung" as const,
    },
  ];

  await db.insert(setorSampah).values(budiSetoran);

  // 2. Seed warmiendo.demo setoran (Kredit) -> masuk ke setor_sampah
  // Untuk warmiendo, metode setor adalah hanya via "ekspedisi"
  const warmiendoSetoran = [
    {
      nomorSetor: "4/W/NDL/BJM/01/06/2026",
      userId: warmiendo.id,
      jenisSampah: "Karton" as const,
      beratKg: 10,
      beratAiKg: 10,
      tanggalSetor: "2026-06-01",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 0,
      status: "diterima" as const,
      metodeSetor: "ekspedisi" as const,
      ekspedisiId: jneId,
      kategoriNasabah: "warmiendo" as const,
    },
    {
      nomorSetor: "5/W/NDL/BJM/02/06/2026",
      userId: warmiendo.id,
      jenisSampah: "Etiket" as const,
      beratKg: 20,
      beratAiKg: 20,
      tanggalSetor: "2026-06-02",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 0,
      status: "diterima" as const,
      metodeSetor: "ekspedisi" as const,
      ekspedisiId: jneId,
      kategoriNasabah: "warmiendo" as const,
    },
    {
      nomorSetor: "6/W/NDL/BJM/03/06/2026",
      userId: warmiendo.id,
      jenisSampah: "Paper Cup" as const,
      beratKg: 15,
      beratAiKg: 15,
      tanggalSetor: "2026-06-03",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 0,
      status: "diterima" as const,
      metodeSetor: "ekspedisi" as const,
      ekspedisiId: jneId,
      kategoriNasabah: "warmiendo" as const,
    },
  ];

  await db.insert(setorSampah).values(warmiendoSetoran);

  // 3. Seed banksampah.demo setoran (Kredit) -> masuk ke setor_sampah
  // Untuk selain warmiendo, metode setor adalah "langsung"
  const bankSampahSetoran = [
    {
      nomorSetor: "7/K/NDL/BJM/01/06/2026",
      userId: bankSampah.id,
      jenisSampah: "Karton" as const,
      beratKg: 15,
      beratAiKg: 15,
      tanggalSetor: "2026-06-01",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 300,
      status: "diterima" as const,
      kategoriNasabah: "bank-sampah" as const,
      metodeSetor: "langsung" as const,
    },
    {
      nomorSetor: "8/K/NDL/BJM/02/06/2026",
      userId: bankSampah.id,
      jenisSampah: "Paper Cup" as const,
      beratKg: 20,
      beratAiKg: 20,
      tanggalSetor: "2026-06-02",
      fotoTimbangan: placeholderImage,
      fotoBuktiTambahan: [placeholderImage],
      totalPoin: 600,
      status: "diterima" as const,
      kategoriNasabah: "bank-sampah" as const,
      metodeSetor: "langsung" as const,
    },
  ];

  await db.insert(setorSampah).values(bankSampahSetoran);

  console.log("✅ Seeded split setoran and pencairan successfully");
}
