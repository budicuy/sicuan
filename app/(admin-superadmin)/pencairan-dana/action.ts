"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { uploadImageToR2 } from "@/app/lib/r2";
import { db } from "@/db";
import {
  buktiPembayaran,
  nasabah,
  pencairanDana,
  setorSampahBankSampah,
  setorSampahWarmiendo,
  users,
} from "@/db/schema";
import type { DataSampahItem } from "@/db/schema/bukti-pembayaran";

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const payload = decodeJwt(token) as {
      id: number;
      name: string;
      role: string;
      username: string;
    };
    return payload;
  } catch {
    return null;
  }
}

export type ActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function getDisbursementData() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "warmiendo" && user.role !== "bank-sampah")) {
    return { success: false, message: "Akses ditolak" };
  }

  const profile = await db.query.nasabah.findFirst({
    where: eq(nasabah.userId, user.id),
  });

  return {
    success: true,
    data: {
      kredit: profile?.kredit ?? 0,
      jenisBank: profile?.jenisBank || "",
      noRekening: profile?.noRekening || "",
      user: {
        name: user.name,
        role: user.role,
      },
    },
  };
}

export async function requestDisbursement(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "warmiendo" && user.role !== "bank-sampah")) {
    return { success: false, message: "Akses ditolak" };
  }

  const jumlahStr = formData.get("jumlah") as string;
  const jumlah = Number.parseInt(jumlahStr, 10);
  const metodePembayaran =
    (formData.get("metodePembayaran") as string) || "transfer";
  const keterangan = (formData.get("keterangan") as string) || "";
  const ttdPenyerahBase64 = (formData.get("ttdPenyerah") as string) || "";

  if (Number.isNaN(jumlah) || jumlah <= 0) {
    return {
      success: false,
      message: "Validasi gagal",
      errors: { jumlah: ["Jumlah pencairan harus berupa angka positif"] },
    };
  }

  if (jumlah < 10000) {
    return {
      success: false,
      message: "Validasi gagal",
      errors: { jumlah: ["Minimal pencairan adalah Rp 10.000"] },
    };
  }

  // Validate TTD is uploaded
  if (!ttdPenyerahBase64) {
    return {
      success: false,
      message: "Validasi gagal",
      errors: { ttdPenyerah: ["Tanda tangan wajib diunggah"] },
    };
  }

  // Get nasabah profile
  const profile = await db.query.nasabah.findFirst({
    where: eq(nasabah.userId, user.id),
  });

  if (!profile) {
    return {
      success: false,
      message:
        "Profil nasabah tidak ditemukan. Harap lengkapi profil Anda terlebih dahulu.",
    };
  }

  // For non-cash: validate bank account
  if (metodePembayaran !== "tunai") {
    if (!profile.jenisBank || !profile.noRekening) {
      return {
        success: false,
        message:
          "Informasi rekening bank belum diisi. Silakan lengkapi di menu Profil Saya.",
        errors: {
          _form: ["Informasi rekening bank tidak lengkap"],
        },
      };
    }
  }

  if (profile.kredit < jumlah) {
    return {
      success: false,
      message: `Saldo kredit tidak mencukupi. Saldo Anda saat ini Rp ${profile.kredit.toLocaleString("id-ID")}`,
      errors: { jumlah: ["Saldo kredit tidak mencukupi"] },
    };
  }

  try {
    // 1. Upload TTD mitra to R2
    const uuid = randomUUID();
    const ttdPenyerahUrl = await uploadImageToR2(
      ttdPenyerahBase64,
      "ttd-penyerah",
      `${user.id}-${uuid}`,
    );

    // 2. Deduct from nasabah credit
    await db
      .update(nasabah)
      .set({
        kredit: profile.kredit - jumlah,
        updatedAt: new Date(),
      })
      .where(eq(nasabah.userId, user.id));

    // 3. Insert disbursement log (defaults to "pending")
    await db.insert(pencairanDana).values({
      userId: user.id,
      jumlah,
      jenisBank:
        metodePembayaran !== "tunai" ? (profile.jenisBank ?? "") : null,
      noRekening:
        metodePembayaran !== "tunai" ? (profile.noRekening ?? "") : null,
      status: "pending",
      metodePembayaran,
      keterangan: keterangan || null,
      ttdPenyerahUrl,
    });

    revalidatePath("/pencairan-dana");
    return {
      success: true,
      message: `Pencairan dana sebesar Rp ${jumlah.toLocaleString("id-ID")} berhasil diajukan dan sedang menunggu verifikasi admin.`,
    };
  } catch (error) {
    console.error("Disbursement error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat memproses pencairan dana.",
    };
  }
}

export async function getDisbursementHistory() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db
    .select()
    .from(pencairanDana)
    .where(eq(pencairanDana.userId, user.id))
    .orderBy(desc(pencairanDana.createdAt));
}

// ── ADMIN / SUPERADMIN OPERATIONS ───────────────────────────────────────────

export async function getAllDisbursementsForAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    throw new Error("Unauthorized");
  }

  return db
    .select({
      id: pencairanDana.id,
      userId: pencairanDana.userId,
      jumlah: pencairanDana.jumlah,
      jenisBank: pencairanDana.jenisBank,
      noRekening: pencairanDana.noRekening,
      status: pencairanDana.status,
      metodePembayaran: pencairanDana.metodePembayaran,
      keterangan: pencairanDana.keterangan,
      ttdPenyerahUrl: pencairanDana.ttdPenyerahUrl,
      buktiTransfer: pencairanDana.buktiTransfer,
      createdAt: pencairanDana.createdAt,
      user: {
        name: users.name,
        username: users.username,
        role: users.role,
      },
      buktiPembayaranId: buktiPembayaran.id,
    })
    .from(pencairanDana)
    .innerJoin(users, eq(pencairanDana.userId, users.id))
    .leftJoin(
      buktiPembayaran,
      eq(pencairanDana.id, buktiPembayaran.pencairanDanaId),
    )
    .orderBy(desc(pencairanDana.createdAt));
}

export async function approveDisbursement(
  id: number,
  buktiTransferBase64: string,
): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return { success: false, message: "Akses ditolak" };
  }

  if (!buktiTransferBase64) {
    return {
      success: false,
      message: "Bukti transfer berupa foto wajib diunggah",
    };
  }

  try {
    const request = await db.query.pencairanDana.findFirst({
      where: eq(pencairanDana.id, id),
    });

    if (!request) {
      return {
        success: false,
        message: "Permintaan pencairan tidak ditemukan",
      };
    }

    if (request.status !== "pending") {
      return {
        success: false,
        message: "Permintaan sudah diproses sebelumnya",
      };
    }

    // Upload proof to R2
    const uuid = randomUUID();
    const buktiUrl = await uploadImageToR2(
      buktiTransferBase64,
      "transfer",
      `${request.userId}-${uuid}`,
    );

    await db
      .update(pencairanDana)
      .set({
        status: "berhasil",
        buktiTransfer: buktiUrl,
      })
      .where(eq(pencairanDana.id, id));

    revalidatePath("/pencairan-dana");
    return {
      success: true,
      message: "Permintaan pencairan dana berhasil disetujui.",
    };
  } catch (error) {
    console.error("Error approving disbursement:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat menyetujui pencairan.",
    };
  }
}

/**
 * Approve cash disbursement — no proof photo required,
 * admin uploads their TTD instead when generating the document.
 */
export async function approveDisbursementCash(
  id: number,
): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return { success: false, message: "Akses ditolak" };
  }

  try {
    const request = await db.query.pencairanDana.findFirst({
      where: eq(pencairanDana.id, id),
    });

    if (!request) {
      return {
        success: false,
        message: "Permintaan pencairan tidak ditemukan",
      };
    }

    if (request.status !== "pending") {
      return {
        success: false,
        message: "Permintaan sudah diproses sebelumnya",
      };
    }

    await db
      .update(pencairanDana)
      .set({ status: "berhasil" })
      .where(eq(pencairanDana.id, id));

    revalidatePath("/pencairan-dana");
    return {
      success: true,
      message: "Pencairan tunai berhasil disetujui.",
    };
  } catch (error) {
    console.error("Error approving cash disbursement:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat menyetujui pencairan tunai.",
    };
  }
}

export async function rejectDisbursement(
  id: number,
): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return { success: false, message: "Akses ditolak" };
  }

  try {
    const request = await db.query.pencairanDana.findFirst({
      where: eq(pencairanDana.id, id),
    });

    if (!request) {
      return {
        success: false,
        message: "Permintaan pencairan tidak ditemukan",
      };
    }

    if (request.status !== "pending") {
      return {
        success: false,
        message: "Permintaan sudah diproses sebelumnya",
      };
    }

    // Refund to nasabah
    const profile = await db.query.nasabah.findFirst({
      where: eq(nasabah.userId, request.userId),
    });

    if (profile) {
      await db
        .update(nasabah)
        .set({
          kredit: profile.kredit + request.jumlah,
          updatedAt: new Date(),
        })
        .where(eq(nasabah.userId, request.userId));
    }

    await db
      .update(pencairanDana)
      .set({ status: "ditolak" })
      .where(eq(pencairanDana.id, id));

    revalidatePath("/pencairan-dana");
    return {
      success: true,
      message:
        "Permintaan pencairan dana berhasil ditolak dan saldo dikembalikan.",
    };
  } catch (error) {
    console.error("Error rejecting disbursement:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat menolak pencairan.",
    };
  }
}

// ── BUKTI PEMBAYARAN ─────────────────────────────────────────────────────────

export interface CreateBuktiPembayaranInput {
  pencairanDanaId: number;
  userId: number;
  namaBankSampah: string;
  idPelanggan: string;
  nama: string;
  alamat?: string;
  noTelepon?: string;
  periodeBulan: string;
  periodeTahun: number;
  kategoriSumber: string;
  dataSampah: DataSampahItem[];
  totalBeratKg: number;
  tarifDasar: number;
  biayaTambahan: number;
  totalTagihan: number;
  metodePembayaran: string;
  keterangan?: string;
  ttdPenerimaBase64: string; // admin TTD (right side)
  namaPenyerah?: string;
  jabatanPenyerah?: string;
  namaPenerima?: string;
  jabatanPenerima?: string;
}

function generateNomorDokumen(
  urutan: number,
  bulanRomawi: string,
  tahun: number,
): string {
  const num = String(urutan).padStart(3, "0");
  return `${num} / BPPS / NDL / BJM / ${bulanRomawi} / ${tahun}`;
}

const BULAN_ROMAWI: Record<string, string> = {
  Januari: "I",
  Februari: "II",
  Maret: "III",
  April: "IV",
  Mei: "V",
  Juni: "VI",
  Juli: "VII",
  Agustus: "VIII",
  September: "IX",
  Oktober: "X",
  November: "XI",
  Desember: "XII",
};

export async function createBuktiPembayaran(
  input: CreateBuktiPembayaranInput,
): Promise<{ success: boolean; message: string; docId?: number }> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return { success: false, message: "Akses ditolak" };
  }

  if (!input.ttdPenerimaBase64) {
    return {
      success: false,
      message: "Tanda tangan penerima (admin) wajib diunggah",
    };
  }

  try {
    // 1. Get mitra TTD from pencairanDana record
    const pencairan = await db.query.pencairanDana.findFirst({
      where: eq(pencairanDana.id, input.pencairanDanaId),
    });

    // 2. Count existing docs this month/year for sequential numbering
    const existingCount = await db
      .select({ id: buktiPembayaran.id })
      .from(buktiPembayaran);

    const urutan = existingCount.length + 1;
    const bulanRomawi = BULAN_ROMAWI[input.periodeBulan] ?? "I";
    const nomorDokumen = generateNomorDokumen(
      urutan,
      bulanRomawi,
      input.periodeTahun,
    );

    // 3. Upload admin TTD to R2
    const uuid = randomUUID();
    const ttdPenerimaUrl = await uploadImageToR2(
      input.ttdPenerimaBase64,
      "ttd-penerima",
      `admin-${user.id}-${uuid}`,
    );

    // 4. Insert buktiPembayaran record
    const [newDoc] = await db
      .insert(buktiPembayaran)
      .values({
        nomorDokumen,
        pencairanDanaId: input.pencairanDanaId,
        userId: input.userId,
        namaBankSampah: input.namaBankSampah,
        idPelanggan: input.idPelanggan,
        nama: input.nama,
        alamat: input.alamat ?? null,
        noTelepon: input.noTelepon ?? null,
        periodeBulan: input.periodeBulan,
        periodeTahun: input.periodeTahun,
        kategoriSumber: input.kategoriSumber,
        dataSampah: input.dataSampah,
        totalBeratKg: input.totalBeratKg,
        tarifDasar: input.tarifDasar,
        biayaTambahan: input.biayaTambahan,
        totalTagihan: input.totalTagihan,
        metodePembayaran: input.metodePembayaran,
        keterangan: input.keterangan ?? null,
        ttdPenyerahUrl: pencairan?.ttdPenyerahUrl ?? null,
        ttdPenerimaUrl,
        namaPenyerah: input.namaPenyerah ?? null,
        jabatanPenyerah: input.jabatanPenyerah ?? null,
        namaPenerima: input.namaPenerima ?? null,
        jabatanPenerima: input.jabatanPenerima ?? null,
        status: "final",
      })
      .returning({ id: buktiPembayaran.id });

    // If the disbursement is cash, we can auto-transition the pencairanDana status to berhasil
    if (pencairan && pencairan.metodePembayaran === "tunai") {
      await db
        .update(pencairanDana)
        .set({ status: "berhasil" })
        .where(eq(pencairanDana.id, input.pencairanDanaId));
    }

    revalidatePath("/pencairan-dana");
    return {
      success: true,
      message: `Dokumen ${nomorDokumen} berhasil dibuat.`,
      docId: newDoc.id,
    };
  } catch (error) {
    console.error("Error creating bukti pembayaran:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat membuat dokumen.",
    };
  }
}

export async function getBuktiPembayaranByPencairanId(pencairanDanaId: number) {
  return db.query.buktiPembayaran.findFirst({
    where: eq(buktiPembayaran.pencairanDanaId, pencairanDanaId),
  });
}

export async function getAllBuktiPembayaran() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    throw new Error("Unauthorized");
  }

  return db
    .select({
      id: buktiPembayaran.id,
      nomorDokumen: buktiPembayaran.nomorDokumen,
      namaBankSampah: buktiPembayaran.namaBankSampah,
      nama: buktiPembayaran.nama,
      totalTagihan: buktiPembayaran.totalTagihan,
      metodePembayaran: buktiPembayaran.metodePembayaran,
      periodeBulan: buktiPembayaran.periodeBulan,
      periodeTahun: buktiPembayaran.periodeTahun,
      status: buktiPembayaran.status,
      createdAt: buktiPembayaran.createdAt,
      user: {
        name: users.name,
        username: users.username,
        role: users.role,
      },
    })
    .from(buktiPembayaran)
    .innerJoin(users, eq(buktiPembayaran.userId, users.id))
    .orderBy(desc(buktiPembayaran.createdAt));
}

export async function getUserBuktiPembayaran() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db
    .select()
    .from(buktiPembayaran)
    .where(eq(buktiPembayaran.userId, user.id))
    .orderBy(desc(buktiPembayaran.createdAt));
}

export async function getNasabahProfileAndMonthlyWaste(
  userId: number,
  year: number,
  monthName: string,
) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  // 1. Fetch user to check role
  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!targetUser) {
    return { success: false, message: "User tidak ditemukan" };
  }

  // 2. Fetch nasabah profile
  const profile = await db.query.nasabah.findFirst({
    where: eq(nasabah.userId, userId),
  });

  const BULAN_INDEX: Record<string, number> = {
    Januari: 1,
    Februari: 2,
    Maret: 3,
    April: 4,
    Mei: 5,
    Juni: 6,
    Juli: 7,
    Agustus: 8,
    September: 9,
    Oktober: 10,
    November: 11,
    Desember: 12,
  };
  const monthNum = BULAN_INDEX[monthName] || new Date().getMonth() + 1;

  const startOfMonthStr = `${year}-${String(monthNum).padStart(2, "0")}-01`;
  const lastDay = new Date(year, monthNum, 0).getDate();
  const endOfMonthStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  let setoranList: { jenisSampah: string; beratKg: number }[] = [];
  if (targetUser.role === "bank-sampah") {
    const records = await db.query.setorSampahBankSampah.findMany({
      where: and(
        eq(setorSampahBankSampah.userId, userId),
        eq(setorSampahBankSampah.status, "diterima"),
        gte(setorSampahBankSampah.tanggalSetor, startOfMonthStr),
        lte(setorSampahBankSampah.tanggalSetor, endOfMonthStr),
      ),
    });
    setoranList = records.map((r) => ({
      jenisSampah: r.jenisSampah,
      beratKg: r.beratKg,
    }));
  } else if (targetUser.role === "warmiendo") {
    const records = await db.query.setorSampahWarmiendo.findMany({
      where: and(
        eq(setorSampahWarmiendo.userId, userId),
        eq(setorSampahWarmiendo.status, "diterima"),
        gte(setorSampahWarmiendo.tanggalSetor, startOfMonthStr),
        lte(setorSampahWarmiendo.tanggalSetor, endOfMonthStr),
      ),
    });
    setoranList = records.map((r) => ({
      jenisSampah: r.jenisSampah,
      beratKg: r.beratKg,
    }));
  }

  const wasteMap: Record<string, number> = {};
  for (const item of setoranList) {
    wasteMap[item.jenisSampah] =
      (wasteMap[item.jenisSampah] || 0) + item.beratKg;
  }

  const dataSampah = Object.entries(wasteMap).map(([jenis, berat]) => ({
    jenis,
    beratKg: berat,
    terlampir: true,
  }));

  return {
    success: true,
    data: {
      idPelanggan: `SPK-${String(userId).padStart(3, "0")}`,
      namaBankSampah:
        targetUser.role === "bank-sampah"
          ? `Bank Sampah ${targetUser.name}`
          : `Warmiendo ${targetUser.name}`,
      alamat: profile?.alamat || "",
      noTelepon: profile?.noTelepon || "",
      dataSampah,
      totalBeratKg: dataSampah.reduce((sum, s) => sum + s.beratKg, 0),
    },
  };
}
