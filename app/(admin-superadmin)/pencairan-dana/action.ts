"use server";

import { randomUUID } from "node:crypto";
import { renderToStream } from "@react-pdf/renderer";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import React from "react";
import sharp from "sharp";
import { BuktiPembayaranDocument } from "@/app/components/shared/BuktiPembayaranDocument";
import { sendPencairanSelesaiNotifToUser } from "@/app/lib/email";
import { getHargaRange } from "@/app/lib/pricing";
import { uploadImageToR2 } from "@/app/lib/r2";
import { db } from "@/db";
import {
  buktiPembayaran,
  nasabah,
  pencairanDana,
  setorSampah,
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

export async function getAdminName() {
  const user = await getCurrentUser();
  return user?.name || "Admin";
}

async function getBankSampahMonthlyCredit(userId: number): Promise<number> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const startOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
  const endOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const records = await db.query.setorSampah.findMany({
    where: and(
      eq(setorSampah.userId, userId),
      eq(setorSampah.kategoriNasabah, "bank-sampah"),
      eq(setorSampah.status, "diterima"),
      gte(setorSampah.tanggalSetor, startOfMonthStr),
      lte(setorSampah.tanggalSetor, endOfMonthStr),
    ),
  });

  const setoranList = records.map((r) => ({
    jenisSampah: r.jenisSampah,
    beratKg: r.beratKg,
  }));

  const wasteMap: Record<string, number> = {};
  for (const item of setoranList) {
    wasteMap[item.jenisSampah] =
      (wasteMap[item.jenisSampah] || 0) + item.beratKg;
  }

  let dynamicKredit = 0;
  for (const [jenis, berat] of Object.entries(wasteMap)) {
    const harga = await getHargaRange(jenis, berat);
    dynamicKredit += harga;
  }

  const startOfMonthDate = new Date(currentYear, currentMonth, 1);
  const endOfMonthDate = new Date(currentYear, currentMonth + 1, 1);

  const myDisbursements = await db.query.pencairanDana.findMany({
    where: and(
      eq(pencairanDana.userId, userId),
      gte(pencairanDana.createdAt, startOfMonthDate),
      lte(pencairanDana.createdAt, endOfMonthDate),
    ),
  });

  const totalWithdrawn = myDisbursements
    .filter((p) => p.status === "berhasil" || p.status === "pending")
    .reduce((sum, p) => sum + p.jumlah, 0);

  return Math.max(0, dynamicKredit - totalWithdrawn);
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
    where: eq(nasabah.id, user.id),
  });

  let credit = profile?.kredit ?? 0;
  if (user.role === "bank-sampah") {
    credit = await getBankSampahMonthlyCredit(user.id);
  }

  return {
    success: true,
    data: {
      kredit: credit,
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
    where: eq(nasabah.id, user.id),
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

  let credit = profile.kredit;
  if (user.role === "bank-sampah") {
    credit = await getBankSampahMonthlyCredit(user.id);
  }

  if (credit < jumlah) {
    return {
      success: false,
      message: `Saldo kredit tidak mencukupi. Saldo Anda saat ini Rp ${credit.toLocaleString("id-ID")}`,
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

    // 2. Deduct from user credit (skip for bank-sampah)
    if (user.role !== "bank-sampah") {
      await db
        .update(nasabah)
        .set({
          kredit: sql`${nasabah.kredit} - ${jumlah}`,
          updatedAt: new Date(),
        })
        .where(eq(nasabah.id, user.id));
    }

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
        name: nasabah.name,
        username: nasabah.username,
        role: nasabah.role,
      },
      buktiPembayaranId: buktiPembayaran.id,
    })
    .from(pencairanDana)
    .innerJoin(nasabah, eq(pencairanDana.userId, nasabah.id))
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

    // Refund to user
    const targetUser = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, request.userId),
    });

    if (targetUser && targetUser.role !== "bank-sampah") {
      await db
        .update(nasabah)
        .set({
          kredit: sql`${nasabah.kredit} + ${request.jumlah}`,
          updatedAt: new Date(),
        })
        .where(eq(nasabah.id, request.userId));
    }

    await db
      .update(pencairanDana)
      .set({ status: "ditolak" })
      .where(eq(pencairanDana.id, id));

    // Kirim notif email ke nasabah (fire-and-forget)
    if (targetUser?.email) {
      sendPencairanSelesaiNotifToUser({
        userEmail: targetUser.email,
        userName: targetUser.name,
        jumlah: request.jumlah,
        metode: request.metodePembayaran,
        status: "ditolak",
      }).catch((err) =>
        console.error("[Email notif pencairan ditolak] Gagal kirim:", err),
      );
    }

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
  buktiTransferBase64?: string;
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

    // Transition pencairanDana status to berhasil and save transfer proof if provided
    if (pencairan) {
      if (pencairan.metodePembayaran === "tunai") {
        await db
          .update(pencairanDana)
          .set({ status: "berhasil" })
          .where(eq(pencairanDana.id, input.pencairanDanaId));
      } else if (input.buktiTransferBase64) {
        const uuidProof = randomUUID();
        const buktiTransferUrl = await uploadImageToR2(
          input.buktiTransferBase64,
          "transfer",
          `${input.userId}-${uuidProof}`,
        );
        await db
          .update(pencairanDana)
          .set({
            status: "berhasil",
            buktiTransfer: buktiTransferUrl,
          })
          .where(eq(pencairanDana.id, input.pencairanDanaId));
      }
    }

    // Kirim notif email ke nasabah beserta lampiran PDF secara asynchronous (fire-and-forget)
    const targetUser = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, input.userId),
    });
    if (targetUser?.email) {
      getBuktiPembayaranPdfBase64(newDoc.id)
        .then((pdfRes) => {
          if (pdfRes.success && pdfRes.pdfBase64) {
            sendPencairanSelesaiNotifToUser({
              userEmail: targetUser.email || "",
              userName: targetUser.name,
              jumlah: input.totalTagihan,
              metode: input.metodePembayaran,
              status: "berhasil",
              buktiTransferUrl: pencairan?.buktiTransfer ?? null,
              pdfBase64: pdfRes.pdfBase64,
              pdfFileName: pdfRes.fileName,
            }).catch((err) =>
              console.error(
                "[Email notif pencairan selesai] Gagal kirim:",
                err,
              ),
            );
          }
        })
        .catch((err) => {
          console.error("Gagal generate PDF untuk lampiran email:", err);
        });
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
        name: nasabah.name,
        username: nasabah.username,
        role: nasabah.role,
      },
    })
    .from(buktiPembayaran)
    .innerJoin(nasabah, eq(buktiPembayaran.userId, nasabah.id))
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
  const targetUser = await db.query.nasabah.findFirst({
    where: eq(nasabah.id, userId),
  });
  if (!targetUser) {
    return { success: false, message: "User tidak ditemukan" };
  }

  // 2. Fetch nasabah profile
  const profile = await db.query.nasabah.findFirst({
    where: eq(nasabah.id, userId),
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

  const records = await db.query.setorSampah.findMany({
    where: and(
      eq(setorSampah.userId, userId),
      eq(
        setorSampah.kategoriNasabah,
        targetUser.role as "konsumen" | "warmiendo" | "bank-sampah",
      ),
      eq(setorSampah.status, "diterima"),
      gte(setorSampah.tanggalSetor, startOfMonthStr),
      lte(setorSampah.tanggalSetor, endOfMonthStr),
    ),
  });
  const setoranList = records.map((r) => ({
    jenisSampah: r.jenisSampah,
    beratKg: r.beratKg,
  }));

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

async function convertWebPToPngBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pngBuffer = await sharp(buffer).png().toBuffer();

    return `data:image/png;base64,${pngBuffer.toString("base64")}`;
  } catch (err) {
    console.error("Error converting WebP to PNG for PDF:", err);
    return null;
  }
}

export async function getBuktiPembayaranPdfBase64(docId: number) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const doc = await db.query.buktiPembayaran.findFirst({
    where: eq(buktiPembayaran.id, docId),
  });

  if (!doc) {
    return { success: false, message: "Dokumen tidak ditemukan" };
  }

  // Access control: only the owner or admin/superadmin can access
  const canAccess =
    doc.userId === user.id ||
    user.role === "admin" ||
    user.role === "superadmin";

  if (!canAccess) {
    return { success: false, message: "Akses ditolak" };
  }

  // Convert WebP signature images from Cloudflare R2 to PNG base64 data URLs
  // because @react-pdf/renderer does not support rendering WebP format out of the box.
  let penyerahPng: string | null = null;
  if (doc.ttdPenyerahUrl) {
    penyerahPng = await convertWebPToPngBase64(doc.ttdPenyerahUrl);
  }

  let penerimaPng: string | null = null;
  if (doc.ttdPenerimaUrl) {
    penerimaPng = await convertWebPToPngBase64(doc.ttdPenerimaUrl);
  }

  const data = {
    nomorDokumen: doc.nomorDokumen,
    tanggal: doc.createdAt,
    namaBankSampah: doc.namaBankSampah,
    idPelanggan: doc.idPelanggan,
    nama: doc.nama,
    alamat: doc.alamat,
    noTelepon: doc.noTelepon,
    periodeBulan: doc.periodeBulan,
    periodeTahun: doc.periodeTahun,
    kategoriSumber: doc.kategoriSumber,
    dataSampah: doc.dataSampah as DataSampahItem[],
    totalBeratKg: doc.totalBeratKg,
    tarifDasar: doc.tarifDasar,
    biayaTambahan: doc.biayaTambahan,
    totalTagihan: doc.totalTagihan,
    metodePembayaran: doc.metodePembayaran,
    keterangan: doc.keterangan,
    ttdPenyerahUrl: penyerahPng || doc.ttdPenyerahUrl,
    ttdPenerimaUrl: penerimaPng || doc.ttdPenerimaUrl,
    namaPenyerah: doc.namaPenyerah,
    jabatanPenyerah: doc.jabatanPenyerah,
    namaPenerima: doc.namaPenerima,
    jabatanPenerima: doc.jabatanPenerima,
  };

  const element = React.createElement(BuktiPembayaranDocument, { data });
  // biome-ignore lint/suspicious/noExplicitAny: react-pdf renderToStream requires its own element type
  const stream = await renderToStream(element as any);

  const chunks: Uint8Array[] = [];
  // biome-ignore lint/suspicious/noExplicitAny: node stream chunk type
  for await (const chunk of stream as any) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  const pdfBase64 = buffer.toString("base64");

  const fileName = `Bukti-Pembayaran-${doc.nomorDokumen.replace(/\//g, "-")}.pdf`;

  return {
    success: true,
    pdfBase64,
    fileName,
  };
}
