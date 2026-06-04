import { eq } from "drizzle-orm";
import { db } from "../index";
import { setorSampah, users } from "../schema";

export async function seedSetorSampah() {
  console.log("🌱 Seeding setor sampah...");

  // Ambil user konsumen yang ada
  const konsumenUsers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, "konsumen"))
    .limit(10);

  if (konsumenUsers.length === 0) {
    console.log("⚠ Tidak ada user konsumen. Skip seeding setor sampah.");
    return;
  }

  const jenisOptions = ["Karton", "Etiket", "Paper Cup"] as const;
  const statusOptions = [
    "diterima",
    "diterima",
    "diterima",
    "pending",
    "ditolak",
  ] as const;

  // Placeholder R2 URL (dalam production akan diisi URL asli)
  const placeholderR2 = "https://placeholder.r2.dev/setor-sampah/sample.webp";

  const data: {
    nomorSetor: string;
    userId: number;
    jenisSampah: "Karton" | "Etiket" | "Paper Cup";
    beratKg: number;
    beratAiKg: number;
    tanggalSetor: string;
    fotoTimbangan: string;
    fotoBuktiTambahan: string[];
    catatan: string | null;
    totalPoin: number;
    status: "pending" | "diterima" | "ditolak";
  }[] = [];

  const months = [0, 1, 2, 3, 4, 5]; // 6 bulan terakhir
  let count = 0;

  for (const user of konsumenUsers) {
    for (const monthOffset of months) {
      if (count >= 50) break;

      const date = new Date();
      date.setMonth(date.getMonth() - monthOffset);
      date.setDate(Math.floor(Math.random() * 28) + 1);
      const tanggalSetor = date.toISOString().split("T")[0];
      const tanggalFormatted = date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const jenis =
        jenisOptions[Math.floor(Math.random() * jenisOptions.length)];
      const beratKg = Number((Math.random() * 9 + 1).toFixed(2)); // 1–10 kg
      const beratAiKg = Number(
        (beratKg + (Math.random() * 0.3 - 0.15)).toFixed(2),
      ); // ±150gr variation
      const pointPerKg =
        jenis === "Paper Cup" ? 30 : jenis === "Etiket" ? 25 : 20;
      const totalPoin = Math.floor(beratKg * pointPerKg);
      const status =
        statusOptions[Math.floor(Math.random() * statusOptions.length)];

      data.push({
        nomorSetor: `Setoran ${user.name} – ${tanggalFormatted}`,
        userId: user.id,
        jenisSampah: jenis,
        beratKg,
        beratAiKg,
        tanggalSetor,
        fotoTimbangan: placeholderR2,
        fotoBuktiTambahan: [placeholderR2, placeholderR2],
        catatan: count % 3 === 0 ? "Sampah sudah dipilah sebelumnya." : null,
        totalPoin,
        status,
      });
      count++;
    }
    if (count >= 50) break;
  }

  await db.insert(setorSampah).values(data).onConflictDoNothing();

  console.log(`✅ Seeded ${data.length} setor sampah records`);
}
