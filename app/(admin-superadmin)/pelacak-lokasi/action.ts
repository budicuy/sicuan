"use server";

import { and, inArray, isNotNull, sql } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import type { TrackedNasabah } from "@/app/components/shared/maps/LocationTrackerMap";
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

export async function getTrackedNasabahLocations() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return { success: false, message: "Akses ditolak" };
  }

  try {
    // 1. Ambil semua nasabah yang SUDAH set lokasi (latitude & longitude IS NOT NULL)
    // dan memiliki role konsumen, warmindo, atau bank-sampah
    const trackedRecords = await db
      .select({
        id: nasabah.id,
        name: nasabah.name,
        username: nasabah.username,
        role: nasabah.role,
        status: nasabah.status,
        noTelepon: nasabah.noTelepon,
        alamat: nasabah.alamat,
        latitude: nasabah.latitude,
        longitude: nasabah.longitude,
        poin: nasabah.poin,
      })
      .from(nasabah)
      .where(
        and(
          isNotNull(nasabah.latitude),
          isNotNull(nasabah.longitude),
          inArray(nasabah.role, ["konsumen", "warmindo", "bank-sampah"]),
        ),
      )
      .orderBy(nasabah.name);

    // 2. Ambil ringkasan setoran untuk masing-masing nasabah yang terlacak
    const userIds = trackedRecords.map((r) => r.id);
    const setoranStatsMap = new Map<
      number,
      { count: number; totalBerat: number }
    >();

    if (userIds.length > 0) {
      const setoranStats = await db
        .select({
          userId: setorSampah.userId,
          count: sql<number>`count(*)`.mapWith(Number),
          totalBerat:
            sql<number>`coalesce(sum(${setorSampah.beratKg}), 0)`.mapWith(
              Number,
            ),
        })
        .from(setorSampah)
        .where(inArray(setorSampah.userId, userIds))
        .groupBy(setorSampah.userId);

      for (const s of setoranStats) {
        setoranStatsMap.set(s.userId, {
          count: s.count,
          totalBerat: s.totalBerat,
        });
      }
    }

    // 3. Gabungkan data
    const locations: TrackedNasabah[] = trackedRecords.map((r) => {
      const stats = setoranStatsMap.get(r.id);
      return {
        id: r.id,
        name: r.name,
        username: r.username,
        role: r.role as "konsumen" | "warmindo" | "bank-sampah",
        status: r.status,
        noTelepon: r.noTelepon,
        alamat: r.alamat,
        latitude: r.latitude as number,
        longitude: r.longitude as number,
        poin: r.poin,
        totalSetoranCount: stats?.count ?? 0,
        totalBeratKg: stats?.totalBerat ?? 0,
      };
    });

    // 4. Hitung ringkasan total user di sistem vs yang terlacak
    const [totalUsersCount] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(nasabah)
      .where(inArray(nasabah.role, ["konsumen", "warmindo", "bank-sampah"]));

    const summary = {
      totalTracked: locations.length,
      totalNasabah: totalUsersCount?.count ?? locations.length,
      konsumenCount: locations.filter((l) => l.role === "konsumen").length,
      warmindoCount: locations.filter((l) => l.role === "warmindo").length,
      bankSampahCount: locations.filter((l) => l.role === "bank-sampah").length,
    };

    return {
      success: true,
      data: {
        locations,
        summary,
      },
    };
  } catch (error) {
    console.error("Error fetching tracked nasabah locations:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat mengambil data lokasi nasabah.",
    };
  }
}
