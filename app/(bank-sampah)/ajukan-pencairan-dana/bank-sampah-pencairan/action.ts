"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  sendPencairanNotifToAdmins,
  sendPencairanPengajuanNotifToUser,
} from "@/app/lib/email";
import { getHargaForTotalBerat, getHargaRange } from "@/app/lib/pricing";
import { uploadImageToR2 } from "@/app/lib/r2";
import { db } from "@/db";
import {
  buktiPembayaran,
  nasabah,
  pencairanDana,
  setorSampah,
} from "@/db/schema";

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

import type { ActionState } from "@/app/types";

// Hitung total kredit akumulatif bank-sampah untuk bulan & tahun tertentu
async function calcMonthlyKredit(
  userId: number,
  year: number,
  month: number, // 1-indexed
): Promise<{
  kredit: number;
  dataSampah: { jenis: string; beratKg: number; kredit: number }[];
}> {
  const startOfMonthStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endOfMonthStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const records = await db.query.setorSampah.findMany({
    where: and(
      eq(setorSampah.userId, userId),
      eq(setorSampah.kategoriNasabah, "bank-sampah"),
      eq(setorSampah.status, "diterima"),
      gte(setorSampah.tanggalSetor, startOfMonthStr),
      lte(setorSampah.tanggalSetor, endOfMonthStr),
    ),
  });

  const wasteMap: Record<string, number> = {};
  for (const r of records) {
    wasteMap[r.jenisSampah] = (wasteMap[r.jenisSampah] || 0) + r.beratKg;
  }

  const totalBerat = records.reduce((sum, r) => sum + r.beratKg, 0);
  const totalKredit = await getHargaForTotalBerat(totalBerat);

  const dataSampah: { jenis: string; beratKg: number; kredit: number }[] = [];
  const entries = Object.entries(wasteMap);
  for (let i = 0; i < entries.length; i++) {
    const [jenis, berat] = entries[i];
    let proportionalKredit = 0;
    if (i === entries.length - 1) {
      const sumAllocated = dataSampah.reduce((sum, d) => sum + d.kredit, 0);
      proportionalKredit = Math.max(0, totalKredit - sumAllocated);
    } else {
      proportionalKredit =
        totalBerat > 0 ? Math.round((berat / totalBerat) * totalKredit) : 0;
    }
    dataSampah.push({ jenis, beratKg: berat, kredit: proportionalKredit });
  }

  return { kredit: totalKredit, dataSampah };
}

async function getMonthDisbursement(
  userId: number,
  year: number,
  month: number, // 1-indexed
) {
  const disbursements = await db.query.pencairanDana.findMany({
    where: and(
      eq(pencairanDana.userId, userId),
      eq(pencairanDana.periodeTahun, year),
      eq(pencairanDana.periodeBulan, month),
    ),
    orderBy: [desc(pencairanDana.createdAt)],
  });

  // Filter hanya pending atau berhasil (diabaikan yang ditolak)
  const activeDisbursement = disbursements.find(
    (p) => p.status === "berhasil" || p.status === "pending",
  );

  return activeDisbursement ?? null;
}

// ─── EXPORTED ACTIONS ────────────────────────────────────────────────────────

const BULAN_NAMES = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export interface PeriodItem {
  key: string; // e.g. "2026-05"
  year: number;
  month: number;
  monthName: string;
  totalBeratKg: number;
  kredit: number;
  dataSampah: { jenis: string; beratKg: number; kredit: number }[];
  statusPencairan: "belum_dicairkan" | "pending" | "berhasil" | "ditolak";
  isCurrentMonth: boolean;
  canWithdraw: boolean;
  disbursement: {
    id: number;
    jumlah: number;
    status: string;
    metodePembayaran: string;
    createdAt: Date;
    keterangan: string | null;
    buktiTransfer: string | null;
    buktiPembayaranId?: number | null;
    ttdPenyerahUrl?: string | null;
  } | null;
}

/**
 * Mengambil daftar periode (bulan & tahun) yang HANYA memiliki setoran riil
 * untuk nasabah bank-sampah yang sedang login.
 */
export async function getBankSampahPeriodsWithSetoran() {
  const user = await getCurrentUser();
  if (!user || user.role !== "bank-sampah") {
    return { success: false, message: "Akses ditolak" };
  }

  const profile = await db.query.nasabah.findFirst({
    where: eq(nasabah.id, user.id),
  });

  // Ambil semua setoran bank-sampah yang statusnya diterima
  const setoranRecords = await db.query.setorSampah.findMany({
    where: and(
      eq(setorSampah.userId, user.id),
      eq(setorSampah.kategoriNasabah, "bank-sampah"),
      eq(setorSampah.status, "diterima"),
    ),
  });

  // Ambil juga semua pencairan dana yang pernah dicatat untuk user ini
  const allDisbursements = await db.query.pencairanDana.findMany({
    where: eq(pencairanDana.userId, user.id),
    orderBy: [desc(pencairanDana.createdAt)],
  });

  // Kumpulkan hanya periode unik yang benar-benar ada setoran
  const periodMap = new Map<string, { year: number; month: number }>();

  for (const record of setoranRecords) {
    const dateStr =
      typeof record.tanggalSetor === "string"
        ? record.tanggalSetor
        : new Date(record.tanggalSetor).toISOString().slice(0, 10);
    const [yStr, mStr] = dateStr.split("-");
    const y = Number.parseInt(yStr, 10);
    const m = Number.parseInt(mStr, 10);
    if (!Number.isNaN(y) && !Number.isNaN(m)) {
      const key = `${y}-${String(m).padStart(2, "0")}`;
      if (!periodMap.has(key)) {
        periodMap.set(key, { year: y, month: m });
      }
    }
  }

  // Jika ada pencairan yang tercatat di database namun setorannya sudah ada
  for (const d of allDisbursements) {
    if (d.periodeTahun && d.periodeBulan) {
      const key = `${d.periodeTahun}-${String(d.periodeBulan).padStart(2, "0")}`;
      if (!periodMap.has(key)) {
        periodMap.set(key, { year: d.periodeTahun, month: d.periodeBulan });
      }
    }
  }

  // Urutkan periode dari yang paling baru ke terlama
  const sortedKeys = Array.from(periodMap.keys()).sort((a, b) =>
    b.localeCompare(a),
  );

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const periods: PeriodItem[] = [];

  for (const key of sortedKeys) {
    const periodInfo = periodMap.get(key);
    if (!periodInfo) continue;
    const { year, month } = periodInfo;
    const { kredit, dataSampah } = await calcMonthlyKredit(
      user.id,
      year,
      month,
    );
    const totalBerat = dataSampah.reduce((s, d) => s + d.beratKg, 0);

    const disbursementsInPeriod = allDisbursements.filter(
      (d) => d.periodeTahun === year && d.periodeBulan === month,
    );

    const activeDisbursement = disbursementsInPeriod.find(
      (d) => d.status === "berhasil" || d.status === "pending",
    );
    const latestDisbursement =
      activeDisbursement || disbursementsInPeriod[0] || null;

    let statusPencairan:
      | "belum_dicairkan"
      | "pending"
      | "berhasil"
      | "ditolak" = "belum_dicairkan";
    if (latestDisbursement) {
      statusPencairan = latestDisbursement.status as
        | "pending"
        | "berhasil"
        | "ditolak";
    }

    let buktiPembayaranId: number | null = null;
    if (latestDisbursement) {
      const doc = await db.query.buktiPembayaran.findFirst({
        where: eq(buktiPembayaran.pencairanDanaId, latestDisbursement.id),
      });
      if (doc) {
        buktiPembayaranId = doc.id;
      }
    }

    const isCurrentMonth = year === currentYear && month === currentMonth;
    const canWithdraw =
      (statusPencairan === "belum_dicairkan" ||
        statusPencairan === "ditolak") &&
      kredit > 0 &&
      !isCurrentMonth;

    periods.push({
      key,
      year,
      month,
      monthName: BULAN_NAMES[month] || `Bulan ${month}`,
      totalBeratKg: Math.round(totalBerat * 100) / 100,
      kredit,
      dataSampah,
      statusPencairan,
      isCurrentMonth,
      canWithdraw,
      disbursement: latestDisbursement
        ? {
            id: latestDisbursement.id,
            jumlah: latestDisbursement.jumlah,
            status: latestDisbursement.status,
            metodePembayaran: latestDisbursement.metodePembayaran,
            createdAt: latestDisbursement.createdAt,
            keterangan: latestDisbursement.keterangan || null,
            buktiTransfer: latestDisbursement.buktiTransfer || null,
            buktiPembayaranId,
            ttdPenyerahUrl: latestDisbursement.ttdPenyerahUrl || null,
          }
        : null,
    });
  }

  let totalKreditTersedia = 0;
  let totalKreditDicairkan = 0;
  let totalBeratKg = 0;

  for (const p of periods) {
    if (
      p.statusPencairan === "belum_dicairkan" ||
      p.statusPencairan === "ditolak"
    ) {
      totalKreditTersedia += p.kredit;
    } else if (p.statusPencairan === "berhasil") {
      totalKreditDicairkan += p.disbursement?.jumlah ?? p.kredit;
    }
    totalBeratKg += p.totalBeratKg;
  }

  return {
    success: true,
    data: {
      periods,
      profile: profile
        ? {
            id: profile.id,
            name: profile.name,
            role: profile.role,
            jenisBank: profile.jenisBank || "",
            noRekening: profile.noRekening || "",
            alamat: profile.alamat || "",
            noTelepon: profile.noTelepon || "",
            idPelanggan: `SPK-${String(user.id).padStart(3, "0")}`,
          }
        : null,
      summary: {
        totalKreditTersedia,
        totalKreditDicairkan,
        totalBeratKg: Math.round(totalBeratKg * 100) / 100,
        totalPeriode: periods.length,
      },
    },
  };
}

export async function getDisbursementDataForMonth(
  year: number,
  month: number, // 1-indexed
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "bank-sampah") {
    return { success: false, message: "Akses ditolak" };
  }

  // Bulan berjalan belum bisa dicairkan
  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  const profile = await db.query.nasabah.findFirst({
    where: eq(nasabah.id, user.id),
  });

  const { kredit, dataSampah } = await calcMonthlyKredit(user.id, year, month);
  const pencairanAktif = await getMonthDisbursement(user.id, year, month);

  let ttdPenerimaUrl: string | null = null;
  if (pencairanAktif) {
    const doc = await db.query.buktiPembayaran.findFirst({
      where: eq(buktiPembayaran.pencairanDanaId, pencairanAktif.id),
    });
    if (doc) {
      ttdPenerimaUrl = doc.ttdPenerimaUrl;
    }
  }

  return {
    success: true,
    data: {
      kredit,
      isCurrentMonth,
      sudahDicairkan: pencairanAktif !== null,
      pencairanAktif: pencairanAktif
        ? {
            id: pencairanAktif.id,
            jumlah: pencairanAktif.jumlah,
            status: pencairanAktif.status,
            metodePembayaran: pencairanAktif.metodePembayaran,
            createdAt: pencairanAktif.createdAt,
            keterangan: pencairanAktif.keterangan || "",
            biayaTambahan: pencairanAktif.biayaTambahan,
            catatanBiayaTambahan: pencairanAktif.catatanBiayaTambahan,
            ttdPenyerahUrl: pencairanAktif.ttdPenyerahUrl || null,
            ttdPenerimaUrl: ttdPenerimaUrl,
          }
        : null,
      jenisBank: profile?.jenisBank || "",
      noRekening: profile?.noRekening || "",
      alamat: profile?.alamat || "",
      noTelepon: profile?.noTelepon || "",
      idPelanggan: `SPK-${String(user.id).padStart(3, "0")}`,
      dataSampah,
      totalBeratKg: dataSampah.reduce((s, d) => s + d.beratKg, 0),
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    },
  };
}

// Legacy getDisbursementData (untuk warmindo compatibility)
export async function getDisbursementData() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "warmindo" && user.role !== "bank-sampah")) {
    return { success: false, message: "Akses ditolak" };
  }

  if (user.role === "bank-sampah") {
    const now = new Date();
    return getDisbursementDataForMonth(now.getFullYear(), now.getMonth() + 1);
  }

  const profile = await db.query.nasabah.findFirst({
    where: eq(nasabah.id, user.id),
  });

  const credit = await getWarmindoMonthlyCredit(user.id);

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

async function getWarmindoMonthlyCredit(userId: number): Promise<number> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const startOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
  const endOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const records = await db.query.setorSampah.findMany({
    where: and(
      eq(setorSampah.userId, userId),
      eq(setorSampah.kategoriNasabah, "warmindo"),
      eq(setorSampah.status, "diterima"),
      gte(setorSampah.tanggalSetor, startOfMonthStr),
      lte(setorSampah.tanggalSetor, endOfMonthStr),
    ),
  });

  const wasteMap: Record<string, number> = {};
  for (const r of records) {
    wasteMap[r.jenisSampah] = (wasteMap[r.jenisSampah] || 0) + r.beratKg;
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

export async function requestDisbursement(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "warmindo" && user.role !== "bank-sampah")) {
    return { success: false, message: "Akses ditolak" };
  }

  const jumlahStr = formData.get("jumlah") as string;
  const jumlah = Number.parseInt(jumlahStr, 10);
  const metodePembayaran =
    (formData.get("metodePembayaran") as string) || "transfer";
  const keterangan = (formData.get("keterangan") as string) || "";
  const biayaTambahanStr = formData.get("biayaTambahan") as string;
  const biayaTambahan = biayaTambahanStr
    ? Number.parseInt(biayaTambahanStr, 10)
    : 0;
  const catatanBiayaTambahan =
    (formData.get("catatanBiayaTambahan") as string) || null;
  const ttdPenyerahBase64 = (formData.get("ttdPenyerah") as string) || "";
  const selectedYear = Number.parseInt(
    (formData.get("selectedYear") as string) || "0",
    10,
  );
  const selectedMonth = Number.parseInt(
    (formData.get("selectedMonth") as string) || "0",
    10,
  );

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

  if (!ttdPenyerahBase64) {
    return {
      success: false,
      message: "Validasi gagal",
      errors: { ttdPenyerah: ["Tanda tangan wajib diunggah"] },
    };
  }

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

  if (metodePembayaran !== "tunai") {
    if (!profile.jenisBank || !profile.noRekening) {
      return {
        success: false,
        message:
          "Informasi rekening bank belum diisi. Silakan lengkapi di menu Profil Saya.",
        errors: { _form: ["Informasi rekening bank tidak lengkap"] },
      };
    }
  }

  let finalJumlah = 0;

  // Untuk bank-sampah: cek pencairan sudah ada di bulan tsb, dan hitung kredit dinamis
  if (user.role === "bank-sampah") {
    if (
      !selectedYear ||
      !selectedMonth ||
      selectedYear < 2020 ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      return {
        success: false,
        message: "Periode bulan & tahun tidak valid.",
        errors: { _form: ["Periode pencairan tidak valid"] },
      };
    }

    // Blokir pencairan untuk bulan yang sedang berjalan
    const now = new Date();
    const isCurrentMonth =
      selectedYear === now.getFullYear() &&
      selectedMonth === now.getMonth() + 1;
    if (isCurrentMonth) {
      return {
        success: false,
        message:
          "Pencairan untuk bulan berjalan belum bisa dilakukan. Silakan ajukan di awal bulan berikutnya.",
        errors: { _form: ["Bulan berjalan belum bisa dicairkan"] },
      };
    }

    const existing = await getMonthDisbursement(
      user.id,
      selectedYear,
      selectedMonth,
    );
    if (existing) {
      return {
        success: false,
        message: `Pencairan bulan ${selectedMonth}/${selectedYear} sudah pernah diajukan.`,
        errors: {
          _form: ["Periode ini sudah memiliki pengajuan pencairan aktif"],
        },
      };
    }

    // Hitung kredit di backend — JANGAN PERCAYA INPUT JUMLAH DARI FRONTEND
    const { kredit, dataSampah } = await calcMonthlyKredit(
      user.id,
      selectedYear,
      selectedMonth,
    );

    if (kredit <= 0 || dataSampah.length === 0) {
      return {
        success: false,
        message:
          "Tidak ada data setoran yang valid untuk dicairkan pada periode ini.",
        errors: {
          _form: ["Tidak ada setoran yang dapat dicairkan pada periode ini"],
        },
      };
    }

    // Tetapkan jumlah secara mutlak dari kredit hasil hitungan backend
    finalJumlah = kredit;
  } else if (user.role === "warmindo") {
    const credit = await getWarmindoMonthlyCredit(user.id);
    const baseKredit = jumlah - biayaTambahan;
    if (credit < baseKredit) {
      return {
        success: false,
        message: `Saldo kredit tidak mencukupi. Saldo Anda saat ini Rp ${credit.toLocaleString("id-ID")}`,
        errors: { jumlah: ["Saldo kredit tidak mencukupi"] },
      };
    }
    finalJumlah = jumlah;
  }

  try {
    const uuid = randomUUID();
    const ttdPenyerahUrl = await uploadImageToR2(
      ttdPenyerahBase64,
      "ttd-penyerah",
      `${user.id}-${uuid}`,
    );

    const now = new Date();
    const finalMonth = selectedMonth > 0 ? selectedMonth : now.getMonth() + 1;
    const finalYear = selectedYear > 0 ? selectedYear : now.getFullYear();

    await db.insert(pencairanDana).values({
      userId: user.id,
      jumlah: finalJumlah,
      jenisBank:
        metodePembayaran !== "tunai" ? (profile.jenisBank ?? "") : null,
      noRekening:
        metodePembayaran !== "tunai" ? (profile.noRekening ?? "") : null,
      status: "pending" as "pending" | "berhasil" | "ditolak",
      metodePembayaran: metodePembayaran as "tunai" | "transfer",
      keterangan: keterangan || null,
      biayaTambahan,
      catatanBiayaTambahan,
      ttdPenyerahUrl,
      periodeBulan: finalMonth,
      periodeTahun: finalYear,
    });

    // Kirim notif email ke semua admin/superadmin (di-await untuk menjamin pengiriman pada Vercel Serverless)
    try {
      await sendPencairanNotifToAdmins({
        nasabahName: user.name,
        nasabahRole: user.role,
        jumlah,
        metode: metodePembayaran,
        jenisBank: profile.jenisBank ?? null,
        noRekening: profile.noRekening ?? null,
        keterangan: keterangan || null,
        tanggal: new Date(),
      });
    } catch (err) {
      console.error("[Email notif pencairan ke admin] Gagal kirim:", err);
    }

    // Kirim notifikasi email tanda terima pengajuan pencairan ke nasabah (di-await untuk menjamin pengiriman pada Vercel Serverless)
    if (profile.email) {
      try {
        await sendPencairanPengajuanNotifToUser({
          userEmail: profile.email,
          userName: user.name,
          jumlah,
          metode: metodePembayaran,
          jenisBank: profile.jenisBank,
          noRekening: profile.noRekening,
          tanggalPengajuan: new Date().toLocaleDateString("id-ID"),
        });
      } catch (err) {
        console.error("[Email notif pencairan ke nasabah] Gagal kirim:", err);
      }
    }

    revalidatePath("/ajukan-pencairan-dana/bank-sampah-pencairan");
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
    .select({
      id: pencairanDana.id,
      userId: pencairanDana.userId,
      jumlah: pencairanDana.jumlah,
      jenisBank: pencairanDana.jenisBank,
      noRekening: pencairanDana.noRekening,
      status: pencairanDana.status,
      metodePembayaran: pencairanDana.metodePembayaran,
      keterangan: pencairanDana.keterangan,
      biayaTambahan: pencairanDana.biayaTambahan,
      catatanBiayaTambahan: pencairanDana.catatanBiayaTambahan,
      ttdPenyerahUrl: pencairanDana.ttdPenyerahUrl,
      buktiTransfer: pencairanDana.buktiTransfer,
      createdAt: pencairanDana.createdAt,
      periodeBulan: pencairanDana.periodeBulan,
      periodeTahun: pencairanDana.periodeTahun,
      buktiPembayaranId: buktiPembayaran.id,
    })
    .from(pencairanDana)
    .leftJoin(
      buktiPembayaran,
      eq(pencairanDana.id, buktiPembayaran.pencairanDanaId),
    )
    .where(eq(pencairanDana.userId, user.id))
    .orderBy(desc(pencairanDana.createdAt));
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
