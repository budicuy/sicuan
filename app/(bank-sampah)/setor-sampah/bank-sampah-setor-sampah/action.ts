"use server";

import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getAllActiveEkspedisi as getEkspedisiFn } from "@/app/(admin-superadmin)/ekspedisi/action";
import {
  readWeightFromImage,
  validateBeratTolerance,
} from "@/app/lib/gemini-weight-reader";
import { calculateSetoranReward } from "@/app/lib/pricing";
import { uploadImageToR2 } from "@/app/lib/r2";
import { db } from "@/db";
import {
  hargaSampah,
  nasabah,
  poinSampah,
  setorSampahBankSampah,
  setorSampahKonsumen,
  setorSampahWarmiendo,
  users,
} from "@/db/schema";

export interface SetoranType {
  id: number;
  nomorSetor: string;
  userId: number;
  jenisSampah: "Karton" | "Etiket" | "Paper Cup";
  beratKg: number;
  beratAiKg?: number | null;
  tanggalSetor: string;
  fotoTimbangan: string;
  fotoBuktiTambahan: string[];
  catatan?: string | null;
  totalPoin: number;
  status: "pending" | "diverifikasi" | "diserahkan" | "diterima" | "ditolak";
  metodeSetor?: string;
  ekspedisiId?: number | null;
  ekspedisi?: { id: number; namaVendor: string; noTelepon: string } | null;
  user?: { id: number; name: string; username: string; role: string } | null;
  totalKredit?: number;
  createdAt: Date;
  updatedAt: Date;
}

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
  status: "pending" | "diverifikasi" | "diserahkan" | "diterima" | "ditolak",
  ekspedisiId?: number,
  roleTarget: "konsumen" | "warmiendo" | "bank-sampah" = "konsumen",
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
    let item: SetoranType | undefined;
    if (roleTarget === "warmiendo") {
      item = await db.query.setorSampahWarmiendo.findFirst({
        where: eq(setorSampahWarmiendo.id, id),
      });
    } else if (roleTarget === "bank-sampah") {
      item = await db.query.setorSampahBankSampah.findFirst({
        where: eq(setorSampahBankSampah.id, id),
      });
    } else {
      item = await db.query.setorSampahKonsumen.findFirst({
        where: eq(setorSampahKonsumen.id, id),
      });
    }

    if (!item) {
      return { success: false, message: "Data setoran tidak ditemukan." };
    }

    if (status === "diverifikasi") {
      if (roleTarget !== "warmiendo") {
        return {
          success: false,
          message: "Aksi tidak didukung untuk tipe setoran ini.",
        };
      }
      if (!ekspedisiId) {
        return {
          success: false,
          message: "Vendor ekspedisi penjemput wajib dipilih.",
        };
      }
      await db
        .update(setorSampahWarmiendo)
        .set({ status, ekspedisiId, updatedAt: new Date() })
        .where(eq(setorSampahWarmiendo.id, id));
    } else if (status === "diterima") {
      if (item.status === "diterima") {
        return {
          success: false,
          message: "Setoran ini sudah diterima sebelumnya.",
        };
      }

      // Hitung poin & kredit berdasarkan berat & tanggal setor
      const depositor = await db.query.users.findFirst({
        where: eq(users.id, item.userId),
      });

      const { totalPoin, totalKredit } = await calculateSetoranReward(
        item.jenisSampah,
        item.beratKg,
        depositor?.role ?? "konsumen",
      );

      // Update nasabah balance
      const existingProfile = await db.query.nasabah.findFirst({
        where: eq(nasabah.userId, item.userId),
      });

      if (existingProfile) {
        await db
          .update(nasabah)
          .set({
            poin: existingProfile.poin + totalPoin,
            kredit: existingProfile.kredit + totalKredit,
            updatedAt: new Date(),
          })
          .where(eq(nasabah.userId, item.userId));
      } else {
        await db.insert(nasabah).values({
          userId: item.userId,
          poin: totalPoin,
          kredit: totalKredit,
        });
      }

      if (roleTarget === "warmiendo") {
        await db
          .update(setorSampahWarmiendo)
          .set({ status, totalPoin, updatedAt: new Date() })
          .where(eq(setorSampahWarmiendo.id, id));
      } else if (roleTarget === "bank-sampah") {
        await db
          .update(setorSampahBankSampah)
          .set({ status, totalPoin, updatedAt: new Date() })
          .where(eq(setorSampahBankSampah.id, id));
      } else {
        await db
          .update(setorSampahKonsumen)
          .set({ status, totalPoin, updatedAt: new Date() })
          .where(eq(setorSampahKonsumen.id, id));
      }
    } else {
      if (roleTarget === "warmiendo") {
        await db
          .update(setorSampahWarmiendo)
          .set({ status, updatedAt: new Date() })
          .where(eq(setorSampahWarmiendo.id, id));
      } else if (roleTarget === "bank-sampah") {
        await db
          .update(setorSampahBankSampah)
          .set({ status, updatedAt: new Date() })
          .where(eq(setorSampahBankSampah.id, id));
      } else {
        await db
          .update(setorSampahKonsumen)
          .set({ status, updatedAt: new Date() })
          .where(eq(setorSampahKonsumen.id, id));
      }
    }

    revalidatePath("/laporan/konsumen");
    revalidatePath("/laporan/warmiendo");
    revalidatePath("/laporan/bank-sampah");
    revalidatePath("/setor-sampah");
    return { success: true, message: "Status setoran berhasil diperbarui." };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal memperbarui status: ${errorMsg}` };
  }
}

export async function handoverSetorSampahToEkspedisi(
  id: number,
): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "warmiendo") {
    return { success: false, message: "Akses ditolak." };
  }

  try {
    const item = await db.query.setorSampahWarmiendo.findFirst({
      where: eq(setorSampahWarmiendo.id, id),
    });

    if (!item) {
      return { success: false, message: "Data setoran tidak ditemukan." };
    }

    if (item.userId !== user.id) {
      return { success: false, message: "Akses ditolak." };
    }

    if (item.status !== "diverifikasi") {
      return {
        success: false,
        message: "Status setoran tidak valid untuk diserahkan ke ekspedisi.",
      };
    }

    await db
      .update(setorSampahWarmiendo)
      .set({ status: "diserahkan", updatedAt: new Date() })
      .where(eq(setorSampahWarmiendo.id, id));

    revalidatePath("/setor-sampah");
    revalidatePath("/laporan/warmiendo");
    return {
      success: true,
      message: "Berhasil menyerahkan sampah ke kurir ekspedisi.",
    };
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

// getHargaAktif is deprecated. Use calculateSetoranReward from @/app/lib/pricing instead.

// ── READ: Ambil setoran milik konsumen yang sedang login / list untuk admin ────────────────────
export async function getMySetoran({
  page = 1,
  limit = 50,
  search = "",
  jenisSampah = "",
  status = "",
  sortBy = "id",
  sortOrder = "desc",
  roleTarget,
}: {
  page?: number;
  limit?: number;
  search?: string;
  jenisSampah?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  roleTarget?: "konsumen" | "warmiendo" | "bank-sampah";
}): Promise<{
  data: SetoranType[];
  total: number;
  totalBerat: number;
  totalPoin: number;
  totalKredit: number;
}> {
  const user = await getCurrentUser();
  if (!user)
    return { data: [], total: 0, totalBerat: 0, totalPoin: 0, totalKredit: 0 };

  const isAdmin = user.role === "admin" || user.role === "superadmin";
  const offset = (page - 1) * limit;

  // Resolve target table based on role target or user role
  const resolvedRole =
    roleTarget ?? (user.role as "konsumen" | "warmiendo" | "bank-sampah");
  const isTargetWarmiendo = resolvedRole === "warmiendo";
  const isTargetBankSampah = resolvedRole === "bank-sampah";
  const _isTargetKonsumen = resolvedRole === "konsumen";

  let targetTable:
    | typeof setorSampahKonsumen
    | typeof setorSampahWarmiendo
    | typeof setorSampahBankSampah;
  if (isTargetWarmiendo) {
    targetTable = setorSampahWarmiendo;
  } else if (isTargetBankSampah) {
    targetTable = setorSampahBankSampah;
  } else {
    targetTable = setorSampahKonsumen;
  }

  // Build dynamic SQL/drizzle queries
  const filters: SQL[] = [];

  if (!isAdmin) {
    filters.push(eq(targetTable.userId, user.id));
  }

  if (jenisSampah && jenisSampah !== "Semua") {
    filters.push(
      eq(
        targetTable.jenisSampah,
        jenisSampah as "Karton" | "Etiket" | "Paper Cup",
      ),
    );
  }

  if (status && status !== "Semua") {
    filters.push(
      eq(targetTable.status, status as "pending" | "diterima" | "ditolak"),
    );
  }

  // search query filter
  let searchFilter: SQL | undefined;
  if (search) {
    searchFilter = or(
      ilike(targetTable.nomorSetor, `%${search}%`),
      ilike(targetTable.catatan, `%${search}%`),
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
  let orderColumn: SQL = desc(targetTable.id);
  if (sortBy === "beratKg") {
    orderColumn =
      sortOrder === "asc"
        ? asc(targetTable.beratKg)
        : desc(targetTable.beratKg);
  } else if (sortBy === "totalPoin") {
    orderColumn =
      sortOrder === "asc"
        ? asc(targetTable.totalPoin)
        : desc(targetTable.totalPoin);
  } else if (sortBy === "tanggalSetor") {
    orderColumn =
      sortOrder === "asc"
        ? asc(targetTable.tanggalSetor)
        : desc(targetTable.tanggalSetor);
  } else if (sortBy === "status") {
    orderColumn =
      sortOrder === "asc" ? asc(targetTable.status) : desc(targetTable.status);
  } else if (sortBy === "jenisSampah") {
    orderColumn =
      sortOrder === "asc"
        ? asc(targetTable.jenisSampah)
        : desc(targetTable.jenisSampah);
  } else if (sortBy === "nomorSetor") {
    orderColumn =
      sortOrder === "asc"
        ? asc(targetTable.nomorSetor)
        : desc(targetTable.nomorSetor);
  } else {
    orderColumn =
      sortOrder === "asc" ? asc(targetTable.id) : desc(targetTable.id);
  }

  let data: SetoranType[] = [];
  let countResult: {
    id: number;
    beratKg: number;
    totalPoin: number;
    jenisSampah: "Karton" | "Etiket" | "Paper Cup";
    tanggalSetor: string;
    userId: number;
  }[] = [];

  if (isTargetWarmiendo) {
    const [fetchedData, fetchedCount] = await Promise.all([
      db.query.setorSampahWarmiendo.findMany({
        where: combinedWhere,
        with: {
          user: true,
          ekspedisi: true,
        },
        orderBy: [orderColumn],
        limit,
        offset,
      }),
      db
        .select({
          id: targetTable.id,
          beratKg: targetTable.beratKg,
          totalPoin: targetTable.totalPoin,
          jenisSampah: targetTable.jenisSampah,
          tanggalSetor: targetTable.tanggalSetor,
          userId: targetTable.userId,
        })
        .from(targetTable)
        .where(combinedWhere),
    ]);
    data = fetchedData;
    countResult = fetchedCount;
  } else if (isTargetBankSampah) {
    const [fetchedData, fetchedCount] = await Promise.all([
      db.query.setorSampahBankSampah.findMany({
        where: combinedWhere,
        with: {
          user: true,
        },
        orderBy: [orderColumn],
        limit,
        offset,
      }),
      db
        .select({
          id: targetTable.id,
          beratKg: targetTable.beratKg,
          totalPoin: targetTable.totalPoin,
          jenisSampah: targetTable.jenisSampah,
          tanggalSetor: targetTable.tanggalSetor,
          userId: targetTable.userId,
        })
        .from(targetTable)
        .where(combinedWhere),
    ]);
    data = fetchedData;
    countResult = fetchedCount;
  } else {
    const [fetchedData, fetchedCount] = await Promise.all([
      db.query.setorSampahKonsumen.findMany({
        where: combinedWhere,
        with: {
          user: true,
        },
        orderBy: [orderColumn],
        limit,
        offset,
      }),
      db
        .select({
          id: targetTable.id,
          beratKg: targetTable.beratKg,
          totalPoin: targetTable.totalPoin,
          jenisSampah: targetTable.jenisSampah,
          tanggalSetor: targetTable.tanggalSetor,
          userId: targetTable.userId,
        })
        .from(targetTable)
        .where(combinedWhere),
    ]);
    data = fetchedData;
    countResult = fetchedCount;
  }

  // Ambil semua harga range dan master poin untuk pencarian lokal agar menghindari N+1 query
  const allRanges = await db.select().from(hargaSampah);
  const _allPoints = await db.select().from(poinSampah);

  const getHargaRangeLokal = (jenis: string, berat: number) => {
    const matched = allRanges.find(
      (r) =>
        r.jenisSampah === jenis &&
        berat >= r.minBerat &&
        (r.maxBerat === null || berat <= r.maxBerat),
    );
    return matched?.harga ?? 0;
  };

  const formattedData = data.map((item: SetoranType) => {
    const role = item.user?.role ?? resolvedRole;
    const isMoneyReward = role === "warmiendo" || role === "bank-sampah";
    const totalKredit = isMoneyReward
      ? getHargaRangeLokal(item.jenisSampah, item.beratKg)
      : 0;
    return {
      ...item,
      totalKredit,
    };
  });

  const totalBerat = countResult.reduce(
    (sum: number, item: { beratKg: number }) => sum + (item.beratKg || 0),
    0,
  );
  const totalPoin = countResult.reduce(
    (sum: number, item: { totalPoin: number }) => sum + (item.totalPoin || 0),
    0,
  );
  const totalKredit = countResult.reduce(
    (
      sum: number,
      item: { jenisSampah: string; beratKg: number; userId: number },
    ) => {
      const userObj = data.find((d) => d.userId === item.userId)?.user;
      const role = userObj?.role ?? resolvedRole;
      const isMoneyReward = role === "warmiendo" || role === "bank-sampah";
      const price = isMoneyReward
        ? getHargaRangeLokal(item.jenisSampah, item.beratKg)
        : 0;
      return sum + price;
    },
    0,
  );

  return {
    data: formattedData,
    total: countResult.length,
    totalBerat,
    totalPoin,
    totalKredit,
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
  const metodeSetor = (formData.get("metodeSetor") as string) || "langsung";
  const requestManualValidation =
    formData.get("requestManualValidation") === "true";

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

  // Hitung poin & kredit berdasarkan harga & poin aktif
  const { totalPoin, totalKredit } = await calculateSetoranReward(
    jenisSampah,
    beratKg,
    user.role,
  );

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

  // Insert ke database sesuai peran user
  try {
    const isEkspedisi = metodeSetor === "ekspedisi";
    const isPending = isEkspedisi || requestManualValidation;
    const baseValues = {
      nomorSetor,
      userId: user.id,
      jenisSampah: jenisSampah as "Karton" | "Etiket" | "Paper Cup",
      beratKg,
      beratAiKg: beratAiKgRaw ? Number.parseFloat(beratAiKgRaw) : null,
      tanggalSetor,
      fotoTimbangan: fotoTimbanganUrl,
      fotoBuktiTambahan: fotoBuktiUrls,
      catatan,
      totalPoin: isPending ? 0 : totalPoin,
      status: (isPending ? "pending" : "diterima") as
        | "pending"
        | "diverifikasi"
        | "diserahkan"
        | "diterima"
        | "ditolak",
    };

    if (user.role === "warmiendo") {
      await db.insert(setorSampahWarmiendo).values({
        ...baseValues,
        metodeSetor: metodeSetor as "langsung" | "ekspedisi",
      });
    } else if (user.role === "bank-sampah") {
      await db.insert(setorSampahBankSampah).values(baseValues);
    } else {
      await db.insert(setorSampahKonsumen).values(baseValues);
    }

    if (!isPending) {
      // Update nasabah balance
      const existingProfile = await db.query.nasabah.findFirst({
        where: eq(nasabah.userId, user.id),
      });

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
    }
  } catch (err) {
    console.error("Insert setor sampah atau update nasabah gagal:", err);
    return {
      success: false,
      errors: { _form: ["Terjadi kesalahan server. Coba lagi."] },
    };
  }

  revalidatePath("/setor-sampah");
  return { success: true };
}

export async function getAllActiveEkspedisi() {
  return getEkspedisiFn();
}

// ── Re-ekspor fungsi Bank Sampah untuk kelola setoran Warmiendo ──────────────
export {
  bankSampahTerimaSetoran,
  bankSampahVerifySetoran,
  getSetoranWarmiendoForBankSampah,
} from "@/app/(warmiendo)/setor-sampah/warmiendo-setor-sampah/action";
