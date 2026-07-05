"use server";

import { and, desc, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { setorSampah } from "@/db/schema";

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

export async function getAdminPetaSampahData(month?: number, year?: number) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return { success: false, message: "Akses ditolak" };
  }

  // 1. Ambil semua nasabah untuk memetakan koordinat pengirim
  const allUsers = await db.query.nasabah.findMany();
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  // Setup default filter to current month and year if undefined
  const now = new Date();
  const filterMonth = month !== undefined ? month : now.getMonth() + 1; // 1-indexed
  const filterYear = year !== undefined ? year : now.getFullYear();

  // Helper function to build sql extract conditions
  const getFilterConditions = (table: { tanggalSetor: PgColumn }) => {
    const conds = [];
    if (filterMonth && filterMonth > 0 && filterMonth <= 12) {
      conds.push(
        sql`EXTRACT(MONTH FROM ${table.tanggalSetor}) = ${filterMonth}`,
      );
    }
    if (filterYear && filterYear > 0) {
      conds.push(sql`EXTRACT(YEAR FROM ${table.tanggalSetor}) = ${filterYear}`);
    }
    return conds.length > 0 ? and(...conds) : undefined;
  };

  // 2. Ambil data setoran dari ketiga kategori dengan filter efisien di DB
  const allSetoran = await db.query.setorSampah.findMany({
    where: getFilterConditions(setorSampah),
    orderBy: [desc(setorSampah.createdAt)],
  });

  // Temukan bank sampah default untuk rute
  const bankSampahUser = allUsers.find((u) => u.role === "bank-sampah");
  const bankSampahInfo = bankSampahUser
    ? {
        id: bankSampahUser.id,
        name: bankSampahUser.name,
        latitude: bankSampahUser.latitude ?? -3.29826,
        longitude: bankSampahUser.longitude ?? 114.58602,
        alamat: bankSampahUser.alamat ?? "Jl. Hasan Basry, Banjarmasin",
      }
    : null;

  // Gabungkan semua setoran
  const combinedSetoran = allSetoran.map((s) => {
    const u = userMap.get(s.userId);
    const defaultCoords: Record<string, [number, number]> = {
      warmiendo: [u?.latitude ?? -3.32426, u?.longitude ?? 114.59102],
      konsumen: [u?.latitude ?? -3.32, u?.longitude ?? 114.593],
      "bank-sampah": [u?.latitude ?? -3.29826, u?.longitude ?? 114.58602],
    };
    const defaultAlamat: Record<string, string> = {
      warmiendo: u?.alamat ?? "Jl. Sultan Adam, Banjarmasin",
      konsumen: u?.alamat ?? "Jl. Ahmad Yani, Banjarmasin",
      "bank-sampah": u?.alamat ?? "Jl. Hasan Basry, Banjarmasin",
    };
    const senderType = s.kategoriNasabah as
      | "konsumen"
      | "warmiendo"
      | "bank-sampah";
    const senderName =
      u?.name ??
      (senderType === "warmiendo"
        ? "Mitra Warmiendo"
        : senderType === "bank-sampah"
          ? "Mitra Bank Sampah"
          : "Nasabah Konsumen");

    return {
      id: `${s.kategoriNasabah}-${s.id}`,
      nomorSetor: s.nomorSetor,
      jenisSampah: s.jenisSampah,
      beratKg: s.beratKg,
      tanggalSetor: s.tanggalSetor,
      status: s.status,
      senderType,
      senderName,
      senderCoords: defaultCoords[senderType] || [
        u?.latitude ?? -3.32,
        u?.longitude ?? 114.593,
      ],
      senderAlamat: defaultAlamat[senderType] || (u?.alamat ?? "Banjarmasin"),
      createdAt: s.createdAt,
    };
  });

  return {
    success: true,
    setoran: combinedSetoran,
    bankSampah: bankSampahInfo,
    indofood: {
      name: "Pabrik PT. Indofood",
      latitude: -3.5495692587301937,
      longitude: 114.73002728210881,
      alamat: "Kawasan Industri, Banjarmasin",
    },
  };
}
