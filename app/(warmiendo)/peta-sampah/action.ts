"use server";

import { desc, eq } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { nasabah, setorSampahWarmiendo, users } from "@/db/schema";

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return decodeJwt(token) as {
      id: number;
      name: string;
      role: string;
      username: string;
    };
  } catch {
    return null;
  }
}

export async function getPetaSampahData() {
  const user = await getCurrentUser();
  if (!user || user.role !== "warmiendo") {
    return { success: false, message: "Akses ditolak" };
  }

  // 1. Ambil data nasabah warmiendo
  const warmiendoNasabah = await db.query.nasabah.findFirst({
    where: eq(nasabah.userId, user.id),
  });

  // 2. Ambil data bank sampah
  const bankSampahUser = await db.query.users.findFirst({
    where: eq(users.role, "bank-sampah"),
  });

  let bankSampahNasabah = null;
  if (bankSampahUser) {
    bankSampahNasabah = await db.query.nasabah.findFirst({
      where: eq(nasabah.userId, bankSampahUser.id),
    });
  }

  // 3. Ambil data setoran sampah warmiendo
  const mySetoran = await db.query.setorSampahWarmiendo.findMany({
    where: eq(setorSampahWarmiendo.userId, user.id),
    orderBy: [desc(setorSampahWarmiendo.createdAt)],
  });

  return {
    success: true,
    warmiendo: {
      id: user.id,
      name: user.name,
      latitude: warmiendoNasabah?.latitude ?? -3.32426,
      longitude: warmiendoNasabah?.longitude ?? 114.59102,
      alamat: warmiendoNasabah?.alamat ?? "Jl. Sultan Adam, Banjarmasin",
    },
    bankSampah: bankSampahUser
      ? {
          id: bankSampahUser.id,
          name: bankSampahUser.name,
          latitude: bankSampahNasabah?.latitude ?? -3.29826,
          longitude: bankSampahNasabah?.longitude ?? 114.58602,
          alamat: bankSampahNasabah?.alamat ?? "Jl. Hasan Basry, Banjarmasin",
        }
      : null,
    setoran: mySetoran.map((s) => ({
      id: s.id,
      nomorSetor: s.nomorSetor,
      jenisSampah: s.jenisSampah,
      beratKg: s.beratKg,
      tanggalSetor: s.tanggalSetor,
      status: s.status,
      metodeSetor: s.metodeSetor,
    })),
  };
}
