"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  sendPencairanNotifToAdmins,
  sendPencairanPengajuanNotifToUser,
} from "@/app/lib/email";
import { getHargaRange } from "@/app/lib/pricing";
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

  const dataSampah: { jenis: string; beratKg: number; kredit: number }[] = [];
  let totalKredit = 0;
  for (const [jenis, berat] of Object.entries(wasteMap)) {
    const harga = await getHargaRange(jenis, berat);
    totalKredit += harga;
    dataSampah.push({ jenis, beratKg: berat, kredit: harga });
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

// Legacy getDisbursementData (untuk warmiendo compatibility)
export async function getDisbursementData() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "warmiendo" && user.role !== "bank-sampah")) {
    return { success: false, message: "Akses ditolak" };
  }

  if (user.role === "bank-sampah") {
    const now = new Date();
    return getDisbursementDataForMonth(now.getFullYear(), now.getMonth() + 1);
  }

  const profile = await db.query.nasabah.findFirst({
    where: eq(nasabah.id, user.id),
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const startOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
  const endOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const records = await db.query.setorSampah.findMany({
    where: and(
      eq(setorSampah.userId, user.id),
      eq(setorSampah.kategoriNasabah, user.role),
      eq(setorSampah.status, "diterima"),
      gte(setorSampah.tanggalSetor, startOfMonthStr),
      lte(setorSampah.tanggalSetor, endOfMonthStr),
    ),
  });

  const wasteMap: Record<string, number> = {};
  for (const r of records) {
    wasteMap[r.jenisSampah] = (wasteMap[r.jenisSampah] || 0) + r.beratKg;
  }

  const dataSampah = Object.entries(wasteMap).map(([jenis, berat]) => ({
    jenis,
    beratKg: berat,
    terlampir: true,
  }));

  return {
    success: true,
    data: {
      kredit: profile?.kredit ?? 0,
      jenisBank: profile?.jenisBank || "",
      noRekening: profile?.noRekening || "",
      alamat: profile?.alamat || "",
      noTelepon: profile?.noTelepon || "",
      idPelanggan: `SPK-${String(user.id).padStart(3, "0")}`,
      dataSampah,
      totalBeratKg: dataSampah.reduce((sum, item) => sum + item.beratKg, 0),
      user: {
        id: user.id,
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

  // Untuk bank-sampah: cek pencairan sudah ada di bulan tsb, dan hitung kredit dinamis
  if (user.role === "bank-sampah" && selectedYear > 0 && selectedMonth > 0) {
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
        message: `Pencairan bulan ${selectedMonth}/${selectedYear} sudah pernah dilakukan.`,
        errors: { _form: ["Bulan ini sudah memiliki pengajuan pencairan"] },
      };
    }

    const { kredit } = await calcMonthlyKredit(
      user.id,
      selectedYear,
      selectedMonth,
    );
    if (kredit < jumlah) {
      return {
        success: false,
        message: `Kredit bulan ini tidak mencukupi. Total kredit bulan ini Rp ${kredit.toLocaleString("id-ID")}`,
        errors: { jumlah: ["Kredit bulan ini tidak mencukupi"] },
      };
    }
  } else if (user.role !== "bank-sampah") {
    if (profile.kredit < jumlah) {
      return {
        success: false,
        message: `Saldo kredit tidak mencukupi. Saldo Anda saat ini Rp ${profile.kredit.toLocaleString("id-ID")}`,
        errors: { jumlah: ["Saldo kredit tidak mencukupi"] },
      };
    }
  }

  try {
    const uuid = randomUUID();
    const ttdPenyerahUrl = await uploadImageToR2(
      ttdPenyerahBase64,
      "ttd-penyerah",
      `${user.id}-${uuid}`,
    );

    // Untuk warmiendo: potong kredit dari kolom. Bank-sampah: skip (dinamis)
    if (user.role !== "bank-sampah") {
      await db
        .update(nasabah)
        .set({
          kredit: sql`${nasabah.kredit} - ${jumlah}`,
          updatedAt: new Date(),
        })
        .where(eq(nasabah.id, user.id));
    }

    const now = new Date();
    const finalMonth = selectedMonth > 0 ? selectedMonth : now.getMonth() + 1;
    const finalYear = selectedYear > 0 ? selectedYear : now.getFullYear();

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
      ttdPenyerahUrl: pencairanDana.ttdPenyerahUrl,
      buktiTransfer: pencairanDana.buktiTransfer,
      createdAt: pencairanDana.createdAt,
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
