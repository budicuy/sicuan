"use server";

import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  readWeightFromImage,
  validateBeratTolerance,
} from "@/app/lib/gemini-weight-reader";
import { uploadImageToR2 } from "@/app/lib/r2";
import { db } from "@/db";
import { hargaSampah, nasabah, setorSampah } from "@/db/schema";

export type ActionState = {
  success: boolean;
  errors?: Record<string, string[]>;
};

export async function getCurrentUserRole(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

async function getCurrentUser(): Promise<{
  id: number;
  name: string;
  role: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const payload = decodeJwt(token) as {
      id: number;
      name: string;
      role: string;
    };
    return payload;
  } catch {
    return null;
  }
}

export async function updateSetorSampahStatus(
  id: number,
  status: "pending" | "diterima" | "ditolak",
): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return {
      success: false,
      message:
        "Akses ditolak. Hanya admin/superadmin yang dapat mengubah status.",
    };
  }

  try {
    await db.update(setorSampah).set({ status }).where(eq(setorSampah.id, id));

    revalidatePath("/dashboard/laporan");
    return { success: true, message: "Status setoran berhasil diperbarui." };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal memperbarui status: ${errorMsg}` };
  }
}

// ── Helper: format tanggal Indonesia ────────────────────────────────────────

function formatTanggalIndo(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Helper: ambil harga sampah aktif bulan ini ──────────────────────────────

async function getHargaAktif(
  jenis: string,
): Promise<{ hargaPerKg: number; pointPerKg: number } | null> {
  const result = await db
    .select({
      hargaPerKg: hargaSampah.hargaPerKg,
      pointPerKg: hargaSampah.pointPerKg,
    })
    .from(hargaSampah)
    .where(eq(hargaSampah.jenisSampah, jenis))
    .orderBy(desc(hargaSampah.periode))
    .limit(1);

  return result[0] ?? null;
}

// ── READ: Ambil setoran milik konsumen yang sedang login ────────────────────
export async function getMySetoran({
  page = 1,
  limit = 50,
  search = "",
  jenisSampah = "",
  status = "",
  sortBy = "id",
  sortOrder = "desc",
}: {
  page?: number;
  limit?: number;
  search?: string;
  jenisSampah?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<{
  data: (typeof setorSampah.$inferSelect)[];
  total: number;
  totalBerat: number;
  totalPoin: number;
}> {
  const user = await getCurrentUser();
  if (!user) return { data: [], total: 0, totalBerat: 0, totalPoin: 0 };

  const isAdmin = user.role === "admin" || user.role === "superadmin";
  const offset = (page - 1) * limit;

  // Build dynamic SQL/drizzle queries
  const filters: SQL[] = [];

  if (!isAdmin) {
    filters.push(eq(setorSampah.userId, user.id));
  }

  if (jenisSampah && jenisSampah !== "Semua") {
    filters.push(
      eq(
        setorSampah.jenisSampah,
        jenisSampah as "Karton" | "Etiket" | "Paper Cup",
      ),
    );
  }

  if (status && status !== "Semua") {
    filters.push(
      eq(setorSampah.status, status as "pending" | "diterima" | "ditolak"),
    );
  }

  // search query filter
  let searchFilter: SQL | undefined;
  if (search) {
    searchFilter = or(
      ilike(setorSampah.nomorSetor, `%${search}%`),
      ilike(setorSampah.catatan, `%${search}%`),
    );
  }

  const combinedWhere =
    filters.length > 0
      ? searchFilter
        ? and(...filters, searchFilter)
        : and(...filters)
      : searchFilter
        ? searchFilter
        : undefined;

  // Sorting
  let orderColumn: SQL = desc(setorSampah.id);
  if (sortBy === "beratKg") {
    orderColumn =
      sortOrder === "asc"
        ? asc(setorSampah.beratKg)
        : desc(setorSampah.beratKg);
  } else if (sortBy === "totalPoin") {
    orderColumn =
      sortOrder === "asc"
        ? asc(setorSampah.totalPoin)
        : desc(setorSampah.totalPoin);
  } else if (sortBy === "tanggalSetor") {
    orderColumn =
      sortOrder === "asc"
        ? asc(setorSampah.tanggalSetor)
        : desc(setorSampah.tanggalSetor);
  } else if (sortBy === "status") {
    orderColumn =
      sortOrder === "asc" ? asc(setorSampah.status) : desc(setorSampah.status);
  } else if (sortBy === "jenisSampah") {
    orderColumn =
      sortOrder === "asc"
        ? asc(setorSampah.jenisSampah)
        : desc(setorSampah.jenisSampah);
  } else if (sortBy === "nomorSetor") {
    orderColumn =
      sortOrder === "asc"
        ? asc(setorSampah.nomorSetor)
        : desc(setorSampah.nomorSetor);
  } else {
    orderColumn =
      sortOrder === "asc" ? asc(setorSampah.id) : desc(setorSampah.id);
  }

  const [data, countResult] = await Promise.all([
    db.query.setorSampah.findMany({
      where: combinedWhere,
      with: isAdmin ? { user: true } : undefined,
      orderBy: [orderColumn],
      limit,
      offset,
    }),
    db
      .select({
        id: setorSampah.id,
        beratKg: setorSampah.beratKg,
        totalPoin: setorSampah.totalPoin,
      })
      .from(setorSampah)
      .where(combinedWhere),
  ]);

  const totalBerat = countResult.reduce(
    (sum, item) => sum + (item.beratKg || 0),
    0,
  );
  const totalPoin = countResult.reduce(
    (sum, item) => sum + (item.totalPoin || 0),
    0,
  );

  return {
    data,
    total: countResult.length,
    totalBerat,
    totalPoin,
  };
}

// ── VALIDATE AI: Validasi berat dari foto timbangan ─────────────────────────

export async function validateFotoTimbangan(
  imageBase64: string,
  beratInputKg: number,
): Promise<{
  success: boolean;
  berat: number;
  message: string;
}> {
  let aiResult: { success: boolean; berat: number; message: string };
  try {
    aiResult = await readWeightFromImage(imageBase64);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    return {
      success: false,
      berat: 0,
      message: `Gagal memproses gambar timbangan: ${errorMsg}`,
    };
  }

  if (!aiResult.success) {
    return {
      success: false,
      berat: 0,
      message: `${aiResult.message} (Detail: Pastikan API Key GEMINI_API_KEY sudah diset dengan benar di env dan gambar tidak terlalu besar)`,
    };
  }

  const isValid = await validateBeratTolerance(beratInputKg, aiResult.berat);

  if (!isValid) {
    return {
      success: false,
      berat: aiResult.berat,
      message: `Berat yang terdeteksi tidak sesuai dengan input berat. Terdeteksi ${aiResult.berat} kg, namun Anda menginput ${beratInputKg} kg (toleransi ±200 gram). Silakan upload ulang gambar bukti timbangan yang jelas.`,
    };
  }

  return {
    success: true,
    berat: aiResult.berat,
    message: "Berat berhasil divalidasi.",
  };
}

// ── CREATE: Submit setoran sampah ───────────────────────────────────────────

export async function createSetorSampah(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      errors: { _form: ["Sesi login tidak valid. Silakan login ulang."] },
    };
  }

  // Ambil data form
  const jenisSampah = formData.get("jenisSampah") as string;
  const beratKgRaw = formData.get("beratKg") as string;
  const tanggalSetor = formData.get("tanggalSetor") as string;
  const catatan = (formData.get("catatan") as string) || null;
  const fotoTimbanganBase64 = formData.get("fotoTimbanganBase64") as string;
  const beratAiKgRaw = formData.get("beratAiKg") as string; // sudah divalidasi di client
  const fotoBuktiBase64List = formData.getAll("fotoBuktiBase64[]") as string[];

  // Validasi
  if (
    !jenisSampah ||
    !["Karton", "Etiket", "Paper Cup"].includes(jenisSampah)
  ) {
    return {
      success: false,
      errors: { jenisSampah: ["Jenis sampah tidak valid"] },
    };
  }

  const beratKg = Number.parseFloat(beratKgRaw);
  if (Number.isNaN(beratKg) || beratKg <= 0) {
    return {
      success: false,
      errors: { beratKg: ["Berat harus lebih dari 0 kg"] },
    };
  }

  if (!tanggalSetor) {
    return {
      success: false,
      errors: { tanggalSetor: ["Tanggal setor harus diisi"] },
    };
  }

  if (!fotoTimbanganBase64) {
    return {
      success: false,
      errors: { fotoTimbangan: ["Foto timbangan wajib diambil"] },
    };
  }

  if (fotoBuktiBase64List.length < 1) {
    return {
      success: false,
      errors: { fotoBukti: ["Minimal 1 foto bukti tambahan"] },
    };
  }

  if (fotoBuktiBase64List.length > 3) {
    return {
      success: false,
      errors: { fotoBukti: ["Maksimal 3 foto bukti tambahan"] },
    };
  }

  // Hitung poin berdasarkan harga aktif
  const hargaAktif = await getHargaAktif(jenisSampah);
  const pointPerKg = hargaAktif?.pointPerKg ?? 0;
  const totalPoin = Math.floor(beratKg * pointPerKg);

  // Generate nomor setor: "Setoran [Nama User] – [Tanggal]"
  const tanggalFormatted = formatTanggalIndo(new Date(tanggalSetor));
  const nomorSetor = `Setoran ${user.name} – ${tanggalFormatted}`;

  // Upload foto timbangan ke R2
  let fotoTimbanganUrl: string;
  try {
    const uuid = randomUUID();
    fotoTimbanganUrl = await uploadImageToR2(
      fotoTimbanganBase64,
      "timbangan",
      `${user.id}-${uuid}`,
    );
  } catch (err) {
    console.error("Upload foto timbangan gagal:", err);
    return {
      success: false,
      errors: {
        fotoTimbangan: ["Gagal mengupload foto timbangan. Coba lagi."],
      },
    };
  }

  // Upload foto bukti tambahan ke R2
  const fotoBuktiUrls: string[] = [];
  try {
    for (const base64 of fotoBuktiBase64List) {
      const uuid = randomUUID();
      const url = await uploadImageToR2(base64, "bukti", `${user.id}-${uuid}`);
      fotoBuktiUrls.push(url);
    }
  } catch (err) {
    console.error("Upload foto bukti gagal:", err);
    return {
      success: false,
      errors: { fotoBukti: ["Gagal mengupload foto bukti. Coba lagi."] },
    };
  }

  // Insert ke database
  try {
    await db.insert(setorSampah).values({
      nomorSetor,
      userId: user.id,
      jenisSampah: jenisSampah as "Karton" | "Etiket" | "Paper Cup",
      beratKg,
      beratAiKg: beratAiKgRaw ? Number.parseFloat(beratAiKgRaw) : null,
      tanggalSetor,
      fotoTimbangan: fotoTimbanganUrl,
      fotoBuktiTambahan: fotoBuktiUrls,
      catatan,
      totalPoin,
      status: "diterima",
    });

    // Update nasabah balance
    const existingProfile = await db.query.nasabah.findFirst({
      where: eq(nasabah.userId, user.id),
    });

    const isMoneyReward =
      user.role === "warmiendo" || user.role === "bank-sampah";
    const totalKredit = isMoneyReward
      ? Math.floor(beratKg * (hargaAktif?.hargaPerKg ?? 0))
      : 0;

    if (existingProfile) {
      await db
        .update(nasabah)
        .set({
          poin: existingProfile.poin + totalPoin,
          kredit: existingProfile.kredit + totalKredit,
          updatedAt: new Date(),
        })
        .where(eq(nasabah.userId, user.id));
    } else {
      await db.insert(nasabah).values({
        userId: user.id,
        poin: totalPoin,
        kredit: totalKredit,
      });
    }
  } catch (err) {
    console.error("Insert setor sampah atau update nasabah gagal:", err);
    return {
      success: false,
      errors: { _form: ["Terjadi kesalahan server. Coba lagi."] },
    };
  }

  revalidatePath("/dashboard/setor-sampah");
  return { success: true };
}
