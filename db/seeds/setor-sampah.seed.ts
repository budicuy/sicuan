import { sql } from "drizzle-orm";
import { db } from "@/db";
import { setorSampah } from "@/db/schema";

export async function seedSetorSampah() {
  console.log("🌱 Seeding setor sampah (khusus Bank Sampah)...");

  await db.delete(setorSampah);

  // ── 1. DATA REAL: TPS 3R Sidoarjo (Agustus 2026) ───────────────────────────
  const bsSidoarjo = await db.query.nasabah.findFirst({
    where: (nasabah, { eq }) => eq(nasabah.username, "banksampah.sidoarjo"),
  });

  if (bsSidoarjo) {
    await db.insert(setorSampah).values([
      {
        nomorSetor: "1/B/NDL/BJM/16/08/2026",
        userId: bsSidoarjo.id,
        jenisSampah: "Etiket" as const,
        beratKg: 4.5,
        beratAiKg: null,
        tanggalSetor: "2026-08-16",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51421-92b1bb0a-25fb-4d3c-b347-66d582a1b44d.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51421-ae690869-3d52-4436-b09f-32a279e779e8.webp",
          "/api/media/setor-sampah/setoran-bukti-tambahan/51421-d2c63e6c-f7d9-4a0f-9e6f-9eb1d01701a8.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-16T05:24:06.654Z"),
        updatedAt: new Date("2026-09-16T05:24:39.745Z"),
      },
      {
        nomorSetor: "2/B/NDL/BJM/16/08/2026",
        userId: bsSidoarjo.id,
        jenisSampah: "Paper Cup" as const,
        beratKg: 4.0,
        beratAiKg: null,
        tanggalSetor: "2026-08-16",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51421-4148c9f0-7201-4207-810e-33995bab3ec4.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51421-4ab4b35f-6e05-4367-912c-f08c7d49c391.webp",
          "/api/media/setor-sampah/setoran-bukti-tambahan/51421-ebf0c385-2eeb-437f-a6fb-60be4d35231c.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-16T05:25:36.972Z"),
        updatedAt: new Date("2026-09-16T05:26:00.532Z"),
      },
    ]);
    console.log("✅ Seeded setoran TPS 3R Sidoarjo — Agustus 2026 (2 setoran)");
  } else {
    console.warn(
      "⚠️ User banksampah.sidoarjo tidak ditemukan, skip setoran Sidoarjo.",
    );
  }

  // ── 2. DATA REAL: Bank Sampah Banjarbaru / TPS 3R Gotong Royong (Agustus 2026)
  const bsBanjarbaru = await db.query.nasabah.findFirst({
    where: (nasabah, { eq }) => eq(nasabah.username, "banksampah.banjarbaru"),
  });

  if (bsBanjarbaru) {
    await db.insert(setorSampah).values([
      {
        nomorSetor: "3/B/NDL/BJM/21/09/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Etiket" as const,
        beratKg: 3.0,
        beratAiKg: 1.0,
        tanggalSetor: "2026-08-01",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51420-b2931e93-a480-401c-81d9-572daa1b3e39.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51420-2c5175f4-7c0d-46a0-956f-cf0b5e61bc83.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-21T01:33:19.717Z"),
        updatedAt: new Date("2026-09-21T01:42:37.954Z"),
      },
      {
        nomorSetor: "4/B/NDL/BJM/21/09/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Etiket" as const,
        beratKg: 2.1,
        beratAiKg: 2.1,
        tanggalSetor: "2026-08-22",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51420-6806f8a9-57fd-46e3-b470-2eb9e1486277.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51420-a2b11f4d-3504-4ccf-b8fd-f80050b01a19.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-21T01:34:14.768Z"),
        updatedAt: new Date("2026-09-21T01:43:01.897Z"),
      },
      {
        nomorSetor: "5/B/NDL/BJM/21/09/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Etiket" as const,
        beratKg: 3.235,
        beratAiKg: 3.235,
        tanggalSetor: "2026-08-08",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51420-1728e9c6-bbd8-4a8f-9705-f2e8b5b2c009.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51420-08ac4e6c-22e5-4c5e-b3d5-ebf07325ba1b.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-21T01:34:43.768Z"),
        updatedAt: new Date("2026-09-21T01:43:20.221Z"),
      },
      {
        nomorSetor: "6/B/NDL/BJM/21/09/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Etiket" as const,
        beratKg: 2.86,
        beratAiKg: 2.86,
        tanggalSetor: "2026-08-15",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51420-5d6009d1-e07a-4fe0-b00f-5887d564803c.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51420-3d76ff4f-e412-4d52-b5e0-f59ccc2dbf1c.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-21T01:35:11.043Z"),
        updatedAt: new Date("2026-09-21T01:43:35.574Z"),
      },
      {
        nomorSetor: "7/B/NDL/BJM/21/09/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Paper Cup" as const,
        beratKg: 2.665,
        beratAiKg: 2.665,
        tanggalSetor: "2026-08-08",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51420-2b93703d-e3df-4045-89e8-e4d22e28cc0b.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51420-dfc0fe14-da8b-4db5-bda7-36ce08d7a115.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-21T01:35:58.215Z"),
        updatedAt: new Date("2026-09-21T01:43:56.311Z"),
      },
      {
        nomorSetor: "8/B/NDL/BJM/21/09/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Paper Cup" as const,
        beratKg: 2.65,
        beratAiKg: 2.65,
        tanggalSetor: "2026-08-01",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51420-cb32e995-1e67-44ed-a526-5a6c7f50006d.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51420-cd94ba99-d78a-474c-8d19-d71a87de376d.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-21T01:36:24.794Z"),
        updatedAt: new Date("2026-09-21T01:44:28.714Z"),
      },
      {
        nomorSetor: "9/B/NDL/BJM/21/09/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Paper Cup" as const,
        beratKg: 3.175,
        beratAiKg: 3.175,
        tanggalSetor: "2026-08-15",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51420-77f1b654-77cd-4390-a870-23835b148e29.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51420-bb7681dc-15b7-4ee4-a469-16ddf3a9f186.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-21T01:36:43.708Z"),
        updatedAt: new Date("2026-09-21T01:44:43.911Z"),
      },
      {
        nomorSetor: "10/B/NDL/BJM/21/09/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Paper Cup" as const,
        beratKg: 3.08,
        beratAiKg: 3.08,
        tanggalSetor: "2026-08-22",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51420-7e6da981-b44b-4731-96b3-b4c3a70b2c0e.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51420-fdcbff8a-0ae3-40d2-91fd-f5df7414ffa6.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-21T01:37:10.869Z"),
        updatedAt: new Date("2026-09-21T01:48:16.446Z"),
      },
      {
        nomorSetor: "11/B/NDL/BJM/21/09/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Karton" as const,
        beratKg: 6.925,
        beratAiKg: 6.925,
        tanggalSetor: "2026-08-08",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51420-df5775fa-bef2-4d38-90e1-db4012347df5.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51420-76d28b3d-5784-4763-9985-0206a51a4cc8.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-21T01:37:33.285Z"),
        updatedAt: new Date("2026-09-21T01:48:33.916Z"),
      },
      {
        nomorSetor: "12/B/NDL/BJM/21/09/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Karton" as const,
        beratKg: 7.845,
        beratAiKg: 7.845,
        tanggalSetor: "2026-08-01",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51420-7ca12908-8e32-4208-8e04-0191f4aa6a3f.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51420-5b791eaa-12b8-4298-9fc4-5a517bda663b.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-21T01:37:49.805Z"),
        updatedAt: new Date("2026-09-21T01:57:53.803Z"),
      },
      {
        nomorSetor: "13/B/NDL/BJM/21/09/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Karton" as const,
        beratKg: 3.755,
        beratAiKg: 3.755,
        tanggalSetor: "2026-08-15",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51420-c4664fb1-18d3-4d8f-bca0-3ca90cb89216.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51420-490a0e41-ad81-4c93-99dc-a496b4e638e8.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-21T01:38:11.222Z"),
        updatedAt: new Date("2026-09-21T01:48:56.480Z"),
      },
      {
        nomorSetor: "14/B/NDL/BJM/21/09/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Karton" as const,
        beratKg: 2.86,
        beratAiKg: 2.86,
        tanggalSetor: "2026-08-22",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51420-3ec77cde-0992-4e2c-b6f5-c8ad33962c04.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51420-8441ebc3-c64c-43d2-9f7d-f20daa1a93f4.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-21T01:38:28.372Z"),
        updatedAt: new Date("2026-09-21T01:49:09.631Z"),
      },
      {
        nomorSetor: "15/B/NDL/BJM/21/09/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Karton" as const,
        beratKg: 5.72,
        beratAiKg: 5.12,
        tanggalSetor: "2026-08-01",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51420-653ac16b-3f7b-42ee-b656-4421ae2e9cce.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51420-6f4b0717-304f-4ade-a8b3-3b42877ad414.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-21T02:03:32.655Z"),
        updatedAt: new Date("2026-09-21T02:05:08.330Z"),
      },
      {
        nomorSetor: "16/B/NDL/BJM/21/09/2026",
        userId: bsBanjarbaru.id,
        jenisSampah: "Karton" as const,
        beratKg: 4.35,
        beratAiKg: 4.35,
        tanggalSetor: "2026-08-01",
        fotoTimbangan:
          "/api/media/setor-sampah/setoran-timbangan/51420-f75428a7-56da-498a-aa61-0e8007bb768d.webp",
        fotoBuktiTambahan: [
          "/api/media/setor-sampah/setoran-bukti-tambahan/51420-10a58fe2-ac6d-4a38-a969-2f8bf23678f5.webp",
        ],
        catatan: null,
        totalPoin: 0,
        status: "diterima" as const,
        kategoriNasabah: "bank-sampah" as const,
        metodeSetor: null,
        createdAt: new Date("2026-09-21T02:04:28.190Z"),
        updatedAt: new Date("2026-09-21T02:05:17.069Z"),
      },
    ]);
    console.log(
      "✅ Seeded setoran Bank Sampah Banjarbaru — Agustus 2026 (14 setoran)",
    );
  } else {
    console.warn(
      "⚠️ User banksampah.banjarbaru tidak ditemukan, skip setoran Banjarbaru.",
    );
  }

  // Reset sequence to sync with the max id inserted
  await db.execute(
    sql`SELECT setval('setor_sampah_id_seq', (SELECT MAX(id) FROM setor_sampah))`,
  );

  console.log("✅ Seeded setor sampah khusus Bank Sampah successfully");
}
