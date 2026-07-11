"use server";

import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getAllActiveEkspedisi as getEkspedisiFn } from "@/app/(admin-superadmin)/ekspedisi/action";
import {
  sendReceiptNotifToDepositor,
  sendSetoranNotifToAdmins,
} from "@/app/lib/email";
import {
  readWeightFromImage,
  validateBeratTolerance,
} from "@/app/lib/gemini-weight-reader";
import { calculateSetoranReward } from "@/app/lib/pricing";
import { uploadImageToR2 } from "@/app/lib/r2";
import type { ActionState, SetoranType } from "@/app/types";
import { db } from "@/db";
import { hargaSampah, nasabah, setorSampah } from "@/db/schema";

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
  _ekspedisiId?: number,
  roleTarget: "konsumen" | "warmindo" | "bank-sampah" = "konsumen",
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
    const item = await db.query.setorSampah.findFirst({
      where: eq(setorSampah.id, id),
    });

    if (!item) {
      return {
        success: false,
        message: "Data setoran tidak ditemukan.",
      };
    }

    if (item.status === "diterima") {
      return {
        success: false,
        message: "Setoran ini sudah diterima sebelumnya.",
      };
    }

    // Hitung poin & kredit berdasarkan berat & tanggal setor
    const depositor = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, item.userId),
    });

    const { totalPoin, totalKredit } = await calculateSetoranReward(
      item.jenisSampah,
      item.beratKg,
      depositor?.role ?? "konsumen",
    );

    // Update nasabah balance directly
    await db
      .update(nasabah)
      .set({
        poin: sql`${nasabah.poin} + ${totalPoin}`,
        updatedAt: new Date(),
      })
      .where(eq(nasabah.id, item.userId));

    // Update status setoran ke diterima
    await db
      .update(setorSampah)
      .set({
        status,
        totalPoin: totalPoin,
        updatedAt: new Date(),
      })
      .where(eq(setorSampah.id, id));

    revalidatePath(`/laporan/${roleTarget}`);
    return { success: true, message: "Status setoran berhasil diperbarui." };
  } catch (error) {
    console.error("Gagal memperbarui status setoran:", error);
    return { success: false, message: "Terjadi kesalahan server." };
  }
}

export async function assignEkspedisiToSetoran(
  id: number,
  ekspedisiId: number,
): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return { success: false, message: "Akses ditolak." };
  }

  try {
    const item = await db.query.setorSampah.findFirst({
      where: eq(setorSampah.id, id),
    });

    if (!item) {
      return { success: false, message: "Data setoran tidak ditemukan." };
    }

    await db
      .update(setorSampah)
      .set({
        ekspedisiId,
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(setorSampah.id, id));

    revalidatePath("/laporan/warmindo");
    return { success: true, message: "Ekspedisi berhasil dipetakan." };
  } catch (error) {
    console.error("Gagal memetakan ekspedisi:", error);
    return { success: false, message: "Terjadi kesalahan server." };
  }
}

export async function readWeightAndVerify(
  id: number,
  base64Photo: string,
  roleTarget: "konsumen" | "warmindo" | "bank-sampah" = "konsumen",
): Promise<{
  success: boolean;
  message: string;
  weightFromAi?: number;
  isMatch?: boolean;
}> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return { success: false, message: "Akses ditolak" };
  }

  try {
    const item = await db.query.setorSampah.findFirst({
      where: eq(setorSampah.id, id),
    });

    if (!item) {
      return { success: false, message: "Setoran tidak ditemukan." };
    }

    const aiWeightResult = await readWeightFromImage(base64Photo);
    if (!aiWeightResult.success) {
      return {
        success: false,
        message:
          aiWeightResult.message ||
          "AI gagal membaca angka timbangan dari gambar.",
      };
    }

    const aiWeight = aiWeightResult.berat;
    const isMatch = await validateBeratTolerance(item.beratKg, aiWeight);

    const updatePayload: Partial<typeof setorSampah.$inferInsert> = {
      beratAiKg: aiWeight,
      updatedAt: new Date(),
    };

    if (isMatch) {
      updatePayload.status = "diverifikasi";
    }

    await db
      .update(setorSampah)
      .set(updatePayload)
      .where(eq(setorSampah.id, id));

    revalidatePath(`/laporan/${roleTarget}`);

    return {
      success: true,
      message: isMatch
        ? "Verifikasi AI sukses. Hasil timbangan cocok."
        : "Verifikasi AI sukses, tetapi timbangan tidak cocok dengan input.",
      weightFromAi: aiWeight,
      isMatch,
    };
  } catch (err) {
    console.error("AI verification failed:", err);
    return {
      success: false,
      message: `Terjadi kesalahan saat memproses gambar: ${String(err)}`,
    };
  }
}

export async function getMySetoran(params: {
  page?: number;
  limit?: number;
  search?: string;
  jenisSampah?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  roleTarget?: "konsumen" | "warmindo" | "bank-sampah";
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { data: [], total: 0, totalBerat: 0, totalPoin: 0, totalKredit: 0 };
  }

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const offset = (page - 1) * limit;
  const search = params?.search ?? "";
  const jenisSampah = params?.jenisSampah ?? "";
  const status = params?.status ?? "";
  const sortBy = params?.sortBy ?? "id";
  const sortOrder = params?.sortOrder ?? "desc";
  const roleTarget =
    params?.roleTarget ??
    (user.role as "konsumen" | "warmindo" | "bank-sampah");

  const isAdmin = user.role === "admin" || user.role === "superadmin";

  const filters: SQL[] = [eq(setorSampah.kategoriNasabah, roleTarget)];

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
      eq(
        setorSampah.status,
        status as
          | "pending"
          | "diverifikasi"
          | "diserahkan"
          | "diterima"
          | "ditolak",
      ),
    );
  }

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
  }

  const [fetchedData, fetchedCount] = await Promise.all([
    db.query.setorSampah.findMany({
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
        id: setorSampah.id,
        beratKg: setorSampah.beratKg,
        totalPoin: setorSampah.totalPoin,
        jenisSampah: setorSampah.jenisSampah,
        tanggalSetor: setorSampah.tanggalSetor,
        userId: setorSampah.userId,
      })
      .from(setorSampah)
      .where(combinedWhere),
  ]);

  const allRanges = await db.select().from(hargaSampah);

  const mappedData = fetchedData.map((s) => {
    const range = allRanges.find(
      (r) =>
        r.jenisSampah === s.jenisSampah &&
        s.beratKg >= r.minBerat &&
        (r.maxBerat === null || s.beratKg <= r.maxBerat),
    );
    const isMoneyReward =
      roleTarget === "warmindo" || roleTarget === "bank-sampah";
    const kreditVal = isMoneyReward ? (range?.harga ?? 0) : 0;

    return {
      id: s.id,
      nomorSetor: s.nomorSetor,
      userId: s.userId,
      jenisSampah: s.jenisSampah,
      beratKg: s.beratKg,
      beratAiKg: s.beratAiKg,
      tanggalSetor: s.tanggalSetor,
      fotoTimbangan: s.fotoTimbangan,
      fotoBuktiTambahan: s.fotoBuktiTambahan,
      catatan: s.catatan,
      totalPoin: s.totalPoin,
      status: s.status,
      metodeSetor: s.metodeSetor,
      ekspedisiId: s.ekspedisiId,
      ekspedisi: s.ekspedisi,
      user: s.user
        ? {
            id: s.user.id,
            name: s.user.name,
            username: s.user.username,
            role: s.user.role,
          }
        : null,
      totalKredit: kreditVal,
      kategoriNasabah: s.kategoriNasabah,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  });

  // Calculate aggregates of the full filtered list (fetchedCount) for correct summary
  let sumBerat = 0;
  let sumPoin = 0;
  let sumKredit = 0;

  for (const s of fetchedCount) {
    const range = allRanges.find(
      (r) =>
        r.jenisSampah === s.jenisSampah &&
        s.beratKg >= r.minBerat &&
        (r.maxBerat === null || s.beratKg <= r.maxBerat),
    );
    const isMoneyReward =
      roleTarget === "warmindo" || roleTarget === "bank-sampah";
    const kreditVal = isMoneyReward ? (range?.harga ?? 0) : 0;

    sumBerat += s.beratKg;
    sumPoin += s.totalPoin;
    sumKredit += kreditVal;
  }

  return {
    data: mappedData,
    total: fetchedCount.length,
    totalBerat: sumBerat,
    totalPoin: sumPoin,
    totalKredit: sumKredit,
  };
}

export async function submitSetorSampah(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, errors: { _form: ["Sesi tidak valid."] } };
  }

  const jenisSampah = formData.get("jenisSampah") as string;
  const beratKgRaw = formData.get("beratKg") as string;
  const beratAiKgRaw = formData.get("beratAiKg") as string;
  const tanggalSetor = formData.get("tanggalSetor") as string;
  const fotoTimbanganBase64 = formData.get("fotoTimbangan") as string;
  const fotoBuktiTambahanBase64 = formData.getAll(
    "fotoBuktiTambahan",
  ) as string[];
  const catatan = (formData.get("catatan") as string) || null;
  const metodeSetor = (formData.get("metodeSetor") as string) || "langsung";

  if (!jenisSampah || !beratKgRaw || !tanggalSetor || !fotoTimbanganBase64) {
    return {
      success: false,
      errors: {
        _form: ["Semua data input timbangan dan tanggal wajib diisi."],
      },
    };
  }

  const beratKg = Number.parseFloat(beratKgRaw);
  if (Number.isNaN(beratKg) || beratKg <= 0) {
    return {
      success: false,
      errors: { beratKg: ["Berat sampah harus berupa angka positif."] },
    };
  }

  try {
    const uuid = randomUUID();
    const fotoTimbanganUrl = await uploadImageToR2(
      fotoTimbanganBase64,
      "setoran-timbangan",
      `${user.id}-${uuid}`,
    );

    const fotoBuktiUrls: string[] = [];
    let count = 1;
    for (const base64 of fotoBuktiTambahanBase64) {
      if (base64 && base64.trim() !== "") {
        const url = await uploadImageToR2(
          base64,
          "setoran-bukti-tambahan",
          `${user.id}-${uuid}-${count}`,
        );
        fotoBuktiUrls.push(url);
        count++;
      }
    }

    const { totalPoin, totalKredit } = await calculateSetoranReward(
      jenisSampah,
      beratKg,
      user.role,
    );

    const isPending = user.role === "konsumen" || user.role === "warmindo";

    // Query next sequence value for auto-increment ID
    const nextValResult = await db.execute<{ nextval: string }>(
      sql`SELECT nextval('setor_sampah_id_seq')`,
    );
    const nextId = nextValResult.rows[0]?.nextval
      ? Number.parseInt(nextValResult.rows[0].nextval as string, 10)
      : 1;

    const dateParts = tanggalSetor.split("-");
    const tahun = dateParts[0] || "2026";
    const bulan = dateParts[1] || "01";
    const tanggal = dateParts[2] || "01";

    const roleToCode: Record<string, string> = {
      "bank-sampah": "K",
      warmindo: "W",
      konsumen: "B",
    };
    const code = roleToCode[user.role] || "B";
    const nomorSetorFormatted = `${nextId}/${code}/NDL/BJM/${tanggal}/${bulan}/${tahun}`;

    const baseValues = {
      id: nextId,
      nomorSetor: nomorSetorFormatted,
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
      kategoriNasabah: user.role as "konsumen" | "warmindo" | "bank-sampah",
      metodeSetor:
        user.role === "warmindo"
          ? (metodeSetor as "langsung" | "ekspedisi")
          : null,
    };

    await db.insert(setorSampah).values(baseValues);

    if (!isPending) {
      // Update nasabah balance directly
      await db
        .update(nasabah)
        .set({
          poin: sql`${nasabah.poin} + ${totalPoin}`,
          updatedAt: new Date(),
        })
        .where(eq(nasabah.id, user.id));
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

// ── BANK SAMPAH: Verifikasi setoran Warmindo & tugaskan ekspedisi ────────────

export async function bankSampahVerifySetoran(
  id: number,
  ekspedisiId: number,
): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "bank-sampah") {
    return {
      success: false,
      message:
        "Akses ditolak. Hanya Bank Sampah yang dapat memverifikasi setoran Warmindo.",
    };
  }

  try {
    const item = await db.query.setorSampah.findFirst({
      where: eq(setorSampah.id, id),
    });

    if (!item) {
      return { success: false, message: "Data setoran tidak ditemukan." };
    }

    if (item.status !== "pending") {
      return {
        success: false,
        message: "Setoran ini tidak dalam status pending untuk diverifikasi.",
      };
    }

    if (!ekspedisiId) {
      return {
        success: false,
        message: "Vendor ekspedisi penjemput wajib dipilih.",
      };
    }

    await db
      .update(setorSampah)
      .set({ status: "diverifikasi", ekspedisiId, updatedAt: new Date() })
      .where(eq(setorSampah.id, id));

    revalidatePath("/setor-sampah");
    revalidatePath("/laporan/warmindo");
    revalidatePath("/laporan/bank-sampah");
    return {
      success: true,
      message:
        "Setoran berhasil diverifikasi dan ekspedisi penjemput telah ditugaskan.",
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal memverifikasi setoran: ${errorMsg}`,
    };
  }
}

// ── BANK SAMPAH: Terima dan finalisasi setoran Warmindo ─────────────────────

export async function bankSampahTerimaSetoran(
  id: number,
): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "bank-sampah") {
    return {
      success: false,
      message:
        "Akses ditolak. Hanya Bank Sampah yang dapat menerima setoran Warmindo.",
    };
  }

  try {
    const item = await db.query.setorSampah.findFirst({
      where: eq(setorSampah.id, id),
    });

    if (!item) {
      return { success: false, message: "Data setoran tidak ditemukan." };
    }

    if (item.status !== "diserahkan") {
      return {
        success: false,
        message:
          "Setoran ini belum dalam status diserahkan — tunggu konfirmasi penyerahan dari Warmindo.",
      };
    }

    // Hitung reward berdasarkan berat & jenis sampah
    const depositor = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, item.userId),
    });

    const { totalPoin, totalKredit } = await calculateSetoranReward(
      item.jenisSampah,
      item.beratKg,
      depositor?.role ?? "warmindo",
    );

    // Update saldo nasabah Warmindo
    await db
      .update(nasabah)
      .set({
        poin: sql`${nasabah.poin} + ${totalPoin}`,
        updatedAt: new Date(),
      })
      .where(eq(nasabah.id, item.userId));

    // Update status setoran ke diterima
    await db
      .update(setorSampah)
      .set({ status: "diterima", totalPoin, updatedAt: new Date() })
      .where(eq(setorSampah.id, id));

    revalidatePath("/setor-sampah");
    revalidatePath("/laporan/warmindo");
    revalidatePath("/laporan/bank-sampah");
    return {
      success: true,
      message:
        "Setoran Warmindo berhasil diterima dan insentif telah dikreditkan ke akun nasabah.",
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal menerima setoran: ${errorMsg}`,
    };
  }
}

// ── BANK SAMPAH: Ambil daftar setoran Warmindo yang perlu dikelola ──────────

export async function getSetoranWarmindoForBankSampah({
  page = 1,
  limit = 20,
  status = "",
}: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{
  data: SetoranType[];
  total: number;
}> {
  const user = await getCurrentUser();
  if (!user || user.role !== "bank-sampah") {
    return { data: [], total: 0 };
  }

  const offset = (page - 1) * limit;
  const filters: SQL[] = [eq(setorSampah.kategoriNasabah, "warmindo")];

  if (status && status !== "Semua") {
    filters.push(
      eq(
        setorSampah.status,
        status as
          | "pending"
          | "diverifikasi"
          | "diserahkan"
          | "diterima"
          | "ditolak",
      ),
    );
  }

  const combinedWhere = filters.length > 0 ? and(...filters) : undefined;

  const [data, countResult] = await Promise.all([
    db.query.setorSampah.findMany({
      where: combinedWhere,
      with: {
        user: true,
        ekspedisi: true,
      },
      orderBy: [desc(setorSampah.id)],
      limit,
      offset,
    }),
    db.select({ id: setorSampah.id }).from(setorSampah).where(combinedWhere),
  ]);

  return {
    data: data as unknown as SetoranType[],
    total: countResult.length,
  };
}

// ── CLIENT: Handover / serahkan setoran Warmindo ke ekspedisi ──────────

export async function handoverSetorSampahToEkspedisi(
  id: number,
): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "warmindo") {
    return { success: false, message: "Akses ditolak." };
  }

  try {
    const item = await db.query.setorSampah.findFirst({
      where: eq(setorSampah.id, id),
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
      .update(setorSampah)
      .set({ status: "diserahkan", updatedAt: new Date() })
      .where(eq(setorSampah.id, id));

    revalidatePath("/setor-sampah");
    revalidatePath("/laporan/warmindo");
    return {
      success: true,
      message: "Berhasil menyerahkan sampah ke kurir ekspedisi.",
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal memperbarui status: ${errorMsg}` };
  }
}

// ── CLIENT: Validasi foto timbangan via Gemini ─────────────────────────

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
    const isCleanError =
      aiResult.message === "sampah bukan produk indofood" ||
      aiResult.message === "sampah harus diletakkan di atas timbangan" ||
      aiResult.message === "berat sampah tidak logis";
    return {
      success: false,
      berat: 0,
      message: isCleanError
        ? aiResult.message
        : `${aiResult.message} (Detail: Pastikan API Key GEMINI_API_KEY sudah diset dengan benar di env dan gambar tidak terlalu besar)`,
    };
  }

  const isValid = await validateBeratTolerance(beratInputKg, aiResult.berat);

  if (!isValid) {
    return {
      success: false,
      berat: aiResult.berat,
      message: `Berat yang terdeteksi tidak sesuai dengan input berat. Terdeteksi ${aiResult.berat} kg, namun Anda menginput ${beratInputKg} kg. Silakan upload ulang gambar bukti timbangan yang jelas.`,
    };
  }

  return {
    success: true,
    berat: aiResult.berat,
    message: "Berat berhasil divalidasi.",
  };
}

// ── CLIENT: Submit / create setoran dari Warmindo / Konsumen / Bank Sampah ──────────

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

  // Query next sequence value for auto-increment ID
  const nextValResult = await db.execute<{ nextval: string }>(
    sql`SELECT nextval('setor_sampah_id_seq')`,
  );
  const nextId = nextValResult.rows[0]?.nextval
    ? Number.parseInt(nextValResult.rows[0].nextval as string, 10)
    : 1;

  const dateParts = tanggalSetor.split("-");
  const tahun = dateParts[0] || "2026";
  const bulan = dateParts[1] || "01";
  const tanggal = dateParts[2] || "01";

  const roleToCode: Record<string, string> = {
    "bank-sampah": "K",
    warmindo: "W",
    konsumen: "B",
  };
  const code = roleToCode[user.role] || "B";
  const nomorSetor = `${nextId}/${code}/NDL/BJM/${tanggal}/${bulan}/${tahun}`;

  // Upload foto timbangan ke R2
  let fotoTimbanganUrl: string;
  try {
    const uuid = randomUUID();
    fotoTimbanganUrl = await uploadImageToR2(
      fotoTimbanganBase64,
      "setoran-timbangan",
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
      if (base64 && base64.trim() !== "") {
        const uuid = randomUUID();
        const url = await uploadImageToR2(
          base64,
          "setoran-bukti-tambahan",
          `${user.id}-${uuid}`,
        );
        fotoBuktiUrls.push(url);
      }
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
      id: nextId,
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
      kategoriNasabah: user.role as "konsumen" | "warmindo" | "bank-sampah",
      metodeSetor:
        user.role === "warmindo"
          ? (metodeSetor as "langsung" | "ekspedisi")
          : null,
    };

    await db.insert(setorSampah).values(baseValues);

    // Kirim notifikasi email ke admin (di-await untuk menjamin pengiriman pada Vercel Serverless)
    try {
      await sendSetoranNotifToAdmins({
        nomorSetor,
        nasabahName: user.name,
        nasabahRole: user.role,
        jenisSampah,
        beratKg,
        tanggalSetor,
        catatan,
        status: baseValues.status,
        fotoTimbanganBase64,
        fotoBuktiBase64List,
      });
    } catch (err) {
      console.error("Gagal mengirim email notifikasi setoran ke admin:", err);
    }

    // Ambil data detail nasabah untuk mendapatkan email
    const userDetail = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, user.id),
    });

    // Kirim notifikasi email tanda terima ke nasabah (di-await untuk menjamin pengiriman pada Vercel Serverless)
    if (userDetail?.email) {
      try {
        await sendReceiptNotifToDepositor({
          email: userDetail.email,
          name: user.name,
          role: user.role,
          nomorSetor,
          jenisSampah,
          beratKg,
          tanggalSetor,
          catatan: catatan || undefined,
          status: baseValues.status,
        });
      } catch (err) {
        console.error(
          "Gagal mengirim email tanda terima setoran ke nasabah:",
          err,
        );
      }
    }

    if (!isPending) {
      // Update nasabah balance directly
      await db
        .update(nasabah)
        .set({
          poin: sql`${nasabah.poin} + ${totalPoin}`,
          updatedAt: new Date(),
        })
        .where(eq(nasabah.id, user.id));
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
