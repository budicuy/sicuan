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

export async function getDisbursementData() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "warmiendo" && user.role !== "bank-sampah")) {
    return { success: false, message: "Akses ditolak" };
  }

  const profile = await db.query.nasabah.findFirst({
    where: eq(nasabah.userId, user.id),
  });

  // Calculate monthly waste data
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const startOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
  const endOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  let setoranList: { jenisSampah: string; beratKg: number }[] = [];
  if (user.role === "bank-sampah") {
    const records = await db.query.setorSampahBankSampah.findMany({
      where: and(
        eq(setorSampahBankSampah.userId, user.id),
        eq(setorSampahBankSampah.status, "diterima"),
        gte(setorSampahBankSampah.tanggalSetor, startOfMonthStr),
        lte(setorSampahBankSampah.tanggalSetor, endOfMonthStr),
      ),
    });
    setoranList = records.map((r) => ({
      jenisSampah: r.jenisSampah,
      beratKg: r.beratKg,
    }));
  } else if (user.role === "warmiendo") {
    const records = await db.query.setorSampahWarmiendo.findMany({
      where: and(
        eq(setorSampahWarmiendo.userId, user.id),
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
    where: eq(nasabah.userId, user.id),
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

  if (profile.kredit < jumlah) {
    return {
      success: false,
      message: `Saldo kredit tidak mencukupi. Saldo Anda saat ini Rp ${profile.kredit.toLocaleString("id-ID")}`,
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

    // 2. Deduct from nasabah credit
    await db
      .update(nasabah)
      .set({ kredit: profile.kredit - jumlah, updatedAt: new Date() })
      .where(eq(nasabah.userId, user.id));

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
    .select()
    .from(pencairanDana)
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
