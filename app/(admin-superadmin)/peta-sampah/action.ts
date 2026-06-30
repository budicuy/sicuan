"use server";

import { and, desc, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import {
  setorSampahBankSampah,
  setorSampahKonsumen,
  setorSampahWarmiendo,
} from "@/db/schema";

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

  // 1. Ambil semua users dan nasabah untuk memetakan koordinat pengirim
  const allUsers = await db.query.users.findMany();
  const allNasabah = await db.query.nasabah.findMany();

  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const nasabahMap = new Map(allNasabah.map((n) => [n.userId, n]));

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
  const [setoranWarmiendo, setoranKonsumen, setoranBankSampah] =
    await Promise.all([
      db.query.setorSampahWarmiendo.findMany({
        where: getFilterConditions(setorSampahWarmiendo),
        orderBy: [desc(setorSampahWarmiendo.createdAt)],
      }),
      db.query.setorSampahKonsumen.findMany({
        where: getFilterConditions(setorSampahKonsumen),
        orderBy: [desc(setorSampahKonsumen.createdAt)],
      }),
      db.query.setorSampahBankSampah.findMany({
        where: getFilterConditions(setorSampahBankSampah),
        orderBy: [desc(setorSampahBankSampah.createdAt)],
      }),
    ]);

  // Temukan bank sampah default untuk rute
  const bankSampahUser = allUsers.find((u) => u.role === "bank-sampah");
  const bankSampahNasabah = bankSampahUser
    ? nasabahMap.get(bankSampahUser.id)
    : null;
  const bankSampahInfo = bankSampahUser
    ? {
        id: bankSampahUser.id,
        name: bankSampahUser.name,
        latitude: bankSampahNasabah?.latitude ?? -3.29826,
        longitude: bankSampahNasabah?.longitude ?? 114.58602,
        alamat: bankSampahNasabah?.alamat ?? "Jl. Hasan Basry, Banjarmasin",
      }
    : null;

  // Gabungkan semua setoran
  const combinedSetoran = [
    ...setoranWarmiendo.map((s) => {
      const u = userMap.get(s.userId);
      const n = nasabahMap.get(s.userId);
      return {
        id: `warmiendo-${s.id}`,
        nomorSetor: s.nomorSetor,
        jenisSampah: s.jenisSampah,
        beratKg: s.beratKg,
        tanggalSetor: s.tanggalSetor,
        status: s.status,
        senderType: "warmiendo" as const,
        senderName: u?.name ?? "Mitra Warmiendo",
        senderCoords: [n?.latitude ?? -3.32426, n?.longitude ?? 114.59102] as [
          number,
          number,
        ],
        senderAlamat: n?.alamat ?? "Jl. Sultan Adam, Banjarmasin",
        createdAt: s.createdAt,
      };
    }),
    ...setoranKonsumen.map((s) => {
      const u = userMap.get(s.userId);
      const n = nasabahMap.get(s.userId);
      return {
        id: `konsumen-${s.id}`,
        nomorSetor: s.nomorSetor,
        jenisSampah: s.jenisSampah,
        beratKg: s.beratKg,
        tanggalSetor: s.tanggalSetor,
        status: s.status,
        senderType: "konsumen" as const,
        senderName: u?.name ?? "Nasabah Konsumen",
        senderCoords: [n?.latitude ?? -3.32, n?.longitude ?? 114.593] as [
          number,
          number,
        ],
        senderAlamat: n?.alamat ?? "Jl. Ahmad Yani, Banjarmasin",
        createdAt: s.createdAt,
      };
    }),
    ...setoranBankSampah.map((s) => {
      const u = userMap.get(s.userId);
      const n = nasabahMap.get(s.userId);
      return {
        id: `banksampah-${s.id}`,
        nomorSetor: s.nomorSetor,
        jenisSampah: s.jenisSampah,
        beratKg: s.beratKg,
        tanggalSetor: s.tanggalSetor,
        status: s.status,
        senderType: "bank-sampah" as const,
        senderName: u?.name ?? "Mitra Bank Sampah",
        senderCoords: [n?.latitude ?? -3.29826, n?.longitude ?? 114.58602] as [
          number,
          number,
        ],
        senderAlamat: n?.alamat ?? "Jl. Hasan Basry, Banjarmasin",
        createdAt: s.createdAt,
      };
    }),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

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
