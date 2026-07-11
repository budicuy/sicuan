"use server";

import { and, desc, eq } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { nasabah, setorSampah } from "@/db/schema";

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
  if (!user || user.role !== "warmindo") {
    return { success: false, message: "Akses ditolak" };
  }

  // 1. Ambil data user warmindo (yang berisi koordinat & alamat)
  const warmindoUser = await db.query.nasabah.findFirst({
    where: eq(nasabah.id, user.id),
  });

  // 2. Ambil data bank sampah (yang berisi koordinat & alamat)
  const bankSampahUser = await db.query.nasabah.findFirst({
    where: eq(nasabah.role, "bank-sampah"),
  });

  // 3. Ambil data setoran sampah warmindo
  const mySetoran = await db.query.setorSampah.findMany({
    where: and(
      eq(setorSampah.userId, user.id),
      eq(setorSampah.kategoriNasabah, "warmindo"),
    ),
    orderBy: [desc(setorSampah.createdAt)],
  });

  return {
    success: true,
    warmindo: {
      id: user.id,
      name: user.name,
      latitude: warmindoUser?.latitude ?? -3.32426,
      longitude: warmindoUser?.longitude ?? 114.59102,
      alamat: warmindoUser?.alamat ?? "Jl. Sultan Adam, Banjarmasin",
    },
    bankSampah: bankSampahUser
      ? {
          id: bankSampahUser.id,
          name: bankSampahUser.name,
          latitude: bankSampahUser.latitude ?? -3.29826,
          longitude: bankSampahUser.longitude ?? 114.58602,
          alamat: bankSampahUser.alamat ?? "Jl. Hasan Basry, Banjarmasin",
        }
      : null,
    setoran: mySetoran.map((s) => ({
      id: s.id,
      nomorSetor: s.nomorSetor,
      jenisSampah: s.jenisSampah,
      beratKg: s.beratKg,
      tanggalSetor: s.tanggalSetor,
      status: s.status,
      metodeSetor: s.metodeSetor || "",
    })),
  };
}
