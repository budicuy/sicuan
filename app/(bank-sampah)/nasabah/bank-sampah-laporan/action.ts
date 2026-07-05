"use server";

import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { setorSampah } from "@/db/schema";

export type SetoranReportItem = {
  id: number;
  nomorSetor: string;
  userId: number;
  jenisSampah: string;
  beratKg: number;
  tanggalSetor: string;
  catatan: string | null;
  totalPoin: number; // Rupiah cash amount
  status: string;
  createdAt: Date;
  user: {
    name: string;
    role: string;
    username: string;
  } | null;
};

export async function getLaporanSetoranNasabah(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  jenisSampah?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const offset = (page - 1) * limit;
  const search = params?.search ?? "";
  const role = params?.role ?? "";
  const jenisSampah = params?.jenisSampah ?? "";
  const sortBy = params?.sortBy ?? "id";
  const sortOrder = params?.sortOrder ?? "desc";

  try {
    // 1. Fetch all setoran from database
    const setoran = await db.query.setorSampah.findMany({
      where: inArray(setorSampah.kategoriNasabah, ["konsumen", "warmiendo"]),
      with: { user: true },
      orderBy: [desc(setorSampah.id)],
    });

    // 2. Map into a unified list
    let merged: SetoranReportItem[] = setoran.map((s) => ({
      id: s.id,
      nomorSetor: s.nomorSetor,
      userId: s.userId,
      jenisSampah: s.jenisSampah,
      beratKg: s.beratKg,
      tanggalSetor: s.tanggalSetor,
      catatan: s.catatan,
      totalPoin: s.totalPoin, // Rupiah amount
      status: s.status,
      createdAt: s.createdAt,
      user: s.user
        ? {
            name: s.user.name,
            role: s.user.role,
            username: s.user.username,
          }
        : null,
    }));

    // 3. Apply filters in memory
    if (search) {
      const q = search.toLowerCase();
      merged = merged.filter(
        (s) =>
          s.nomorSetor.toLowerCase().includes(q) ||
          s.user?.name?.toLowerCase().includes(q) ||
          s.catatan?.toLowerCase().includes(q),
      );
    }

    if (role && role !== "Semua") {
      merged = merged.filter(
        (s) => s.user?.role?.toLowerCase() === role.toLowerCase(),
      );
    }

    if (jenisSampah && jenisSampah !== "Semua") {
      merged = merged.filter((s) => s.jenisSampah === jenisSampah);
    }

    // 4. Calculate aggregates of the FILTERED list
    const summary = merged.reduce(
      (acc, curr) => {
        acc.totalBerat += curr.beratKg;
        acc.totalKredit += curr.totalPoin;
        return acc;
      },
      { totalBerat: 0, totalKredit: 0 },
    );

    // 5. Apply sorting
    merged.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        const nameA = a.user?.name ?? "";
        const nameB = b.user?.name ?? "";
        comparison = nameA.localeCompare(nameB);
      } else if (sortBy === "beratKg") {
        comparison = a.beratKg - b.beratKg;
      } else if (sortBy === "totalPoin" || sortBy === "totalKredit") {
        comparison = a.totalPoin - b.totalPoin;
      } else if (sortBy === "tanggalSetor") {
        comparison =
          new Date(a.tanggalSetor).getTime() -
          new Date(b.tanggalSetor).getTime();
      } else if (sortBy === "jenisSampah") {
        comparison = a.jenisSampah.localeCompare(b.jenisSampah);
      } else {
        comparison = a.id - b.id;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    const total = merged.length;
    const paginated = merged.slice(offset, offset + limit);

    return {
      data: paginated,
      total,
      totalBerat: summary.totalBerat,
      totalKredit: summary.totalKredit,
    };
  } catch (error) {
    console.error("Error generating nasabah setoran report:", error);
    return {
      data: [],
      total: 0,
      totalBerat: 0,
      totalKredit: 0,
    };
  }
}
