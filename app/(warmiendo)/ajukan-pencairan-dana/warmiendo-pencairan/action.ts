"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
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

export type ActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

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

export async function getDisbursementData() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "warmiendo" && user.role !== "bank-sampah")) {
    return { success: false, message: "Akses ditolak" };
  }

  const profile = await db.query.nasabah.findFirst({
    where: eq(nasabah.id, user.id),
  });

  // Calculate monthly waste data
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
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
    // 1. Upload mitra TTD to R2
    const uuid = randomUUID();
    const ttdPenyerahUrl = await uploadImageToR2(
      ttdPenyerahBase64,
      "ttd-penyerah",
      `${user.id}-${uuid}`,
    );

    // 2. Deduct from user credit (skip for bank-sampah role)
    if (user.role !== "bank-sampah") {
      await db
        .update(nasabah)
        .set({
          kredit: sql`${nasabah.kredit} - ${jumlah}`,
          updatedAt: new Date(),
        })
        .where(eq(nasabah.id, user.id));
    }

    // 3. Insert disbursement log
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

    revalidatePath("/ajukan-pencairan-dana/warmiendo-pencairan");
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
