"use server";

import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { nasabah, rewardTopKontributor, setorSampah, users } from "@/db/schema";

// ─── AUTH HELPER ────────────────────────────────────────────────────────────

async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    const decoded = decodeJwt(token) as {
      id: number;
      name: string;
      role: string;
    };
    if (decoded.role !== "admin" && decoded.role !== "superadmin") {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface TopContributorItem {
  rank: number;
  userId: number;
  name: string;
  username: string;
  role: "konsumen" | "warmindo";
  currentPoin: number;
  totalBeratKg: number;
  noTelepon: string | null;
  alamat: string | null;
  setoranCount: number;
  isRewarded: boolean;
  totalPoinDiberikan: number;
  rewardHistory: {
    id: number;
    poinReward: number;
    catatan: string | null;
    createdAt: Date;
    adminName: string;
  }[];
}

export interface MonthlyTopContributorsResult {
  year: number;
  month: number;
  roleFilter: "semua" | "konsumen" | "warmindo";
  contributors: TopContributorItem[];
  summary: {
    totalTopWeight: number;
    totalPointsRewarded: number;
    rewardedCount: number;
    topCandidateCount: number;
  };
}

// ─── 1. FETCH TOP 10 CONTRIBUTORS FOR A MONTH ────────────────────────────────

export async function getMonthlyTopContributors(
  year: number,
  month: number,
  roleFilter: "semua" | "konsumen" | "warmindo" = "semua",
): Promise<{
  success: boolean;
  data?: MonthlyTopContributorsResult;
  message?: string;
}> {
  const admin = await getAdminUser();
  if (!admin) {
    return {
      success: false,
      message: "Akses ditolak. Khusus Admin/Superadmin.",
    };
  }

  try {
    const startOfMonthStr = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonthStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // Target roles: konsumen and warmindo only
    const targetRoles: ("konsumen" | "warmindo")[] =
      roleFilter === "semua" ? ["konsumen", "warmindo"] : [roleFilter];

    // Ambil setoran sampah yang statusnya diterima pada bulan tersebut
    const setoranRecords = await db.query.setorSampah.findMany({
      where: and(
        eq(setorSampah.status, "diterima"),
        inArray(setorSampah.kategoriNasabah, targetRoles),
        gte(setorSampah.tanggalSetor, startOfMonthStr),
        lte(setorSampah.tanggalSetor, endOfMonthStr),
      ),
    });

    // Grouping berat dan count per userId
    const userStatsMap = new Map<
      number,
      { totalBerat: number; count: number }
    >();

    for (const s of setoranRecords) {
      const prev = userStatsMap.get(s.userId) || { totalBerat: 0, count: 0 };
      userStatsMap.set(s.userId, {
        totalBerat: prev.totalBerat + s.beratKg,
        count: prev.count + 1,
      });
    }

    // Urutkan berdasarkan total berat descending
    const sortedUserIds = Array.from(userStatsMap.entries())
      .map(([userId, stats]) => ({
        userId,
        totalBerat: stats.totalBerat,
        count: stats.count,
      }))
      .sort((a, b) => b.totalBerat - a.totalBerat);

    // Ambil maksimal 10 besar
    const top10 = sortedUserIds.slice(0, 10);

    if (top10.length === 0) {
      return {
        success: true,
        data: {
          year,
          month,
          roleFilter,
          contributors: [],
          summary: {
            totalTopWeight: 0,
            totalPointsRewarded: 0,
            rewardedCount: 0,
            topCandidateCount: 0,
          },
        },
      };
    }

    const topUserIds = top10.map((u) => u.userId);

    // Ambil data profil nasabah untuk top 10
    const nasabahList = await db.query.nasabah.findMany({
      where: inArray(nasabah.id, topUserIds),
    });

    // Ambil log reward yang pernah diberikan pada periode bulan & tahun ini
    const existingRewards = await db
      .select({
        id: rewardTopKontributor.id,
        userId: rewardTopKontributor.userId,
        poinReward: rewardTopKontributor.poinReward,
        catatan: rewardTopKontributor.catatan,
        createdAt: rewardTopKontributor.createdAt,
        adminName: users.name,
      })
      .from(rewardTopKontributor)
      .leftJoin(users, eq(users.id, rewardTopKontributor.adminId))
      .where(
        and(
          eq(rewardTopKontributor.periodeTahun, year),
          eq(rewardTopKontributor.periodeBulan, month),
          inArray(rewardTopKontributor.userId, topUserIds),
        ),
      );

    const contributors: TopContributorItem[] = [];

    let totalPointsRewarded = 0;
    let rewardedCount = 0;
    let totalTopWeight = 0;

    for (let i = 0; i < top10.length; i++) {
      const item = top10[i];
      const profile = nasabahList.find((n) => n.id === item.userId);
      if (!profile) continue;

      const userRewards = existingRewards
        .filter((r) => r.userId === item.userId)
        .map((r) => ({
          id: r.id,
          poinReward: r.poinReward,
          catatan: r.catatan,
          createdAt: r.createdAt,
          adminName: r.adminName || "Admin",
        }));

      const isRewarded = userRewards.length > 0;
      const userTotalRewardPoints = userRewards.reduce(
        (sum, r) => sum + r.poinReward,
        0,
      );

      if (isRewarded) {
        rewardedCount += 1;
        totalPointsRewarded += userTotalRewardPoints;
      }

      const cleanWeight = Math.round(item.totalBerat * 1000) / 1000;
      totalTopWeight += cleanWeight;

      contributors.push({
        rank: i + 1,
        userId: item.userId,
        name: profile.name,
        username: profile.username,
        role: profile.role as "konsumen" | "warmindo",
        currentPoin: profile.poin ?? 0,
        totalBeratKg: cleanWeight,
        noTelepon: profile.noTelepon,
        alamat: profile.alamat,
        setoranCount: item.count,
        isRewarded,
        totalPoinDiberikan: userTotalRewardPoints,
        rewardHistory: userRewards,
      });
    }

    return {
      success: true,
      data: {
        year,
        month,
        roleFilter,
        contributors,
        summary: {
          totalTopWeight: Math.round(totalTopWeight * 1000) / 1000,
          totalPointsRewarded,
          rewardedCount,
          topCandidateCount: contributors.length,
        },
      },
    };
  } catch (error) {
    console.error("Error in getMonthlyTopContributors:", error);
    return {
      success: false,
      message: "Gagal mengambil daftar 10 top kontributor.",
    };
  }
}

// ─── 2. GIVE REWARD POINTS TO TOP CONTRIBUTOR ────────────────────────────────

const giveRewardSchema = z.object({
  userId: z.number().int().positive(),
  periodeTahun: z.number().int().min(2020).max(2050),
  periodeBulan: z.number().int().min(1).max(12),
  kategori: z.enum(["konsumen", "warmindo"]),
  peringkat: z.number().int().min(1).max(20),
  totalBeratKg: z.number().nonnegative(),
  poinReward: z.number().int().min(1, "Jumlah poin reward minimal 1 poin"),
  catatan: z.string().optional().nullable(),
});

export async function giveRewardPointsAction(
  input: z.infer<typeof giveRewardSchema>,
) {
  const admin = await getAdminUser();
  if (!admin) {
    return {
      success: false,
      message: "Akses ditolak. Khusus Admin/Superadmin.",
    };
  }

  const parsed = giveRewardSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Data reward tidak valid.",
    };
  }

  const {
    userId,
    periodeTahun,
    periodeBulan,
    kategori,
    peringkat,
    totalBeratKg,
    poinReward,
    catatan,
  } = parsed.data;

  try {
    // Verifikasi user tujuan
    const targetNasabah = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, userId),
    });

    if (!targetNasabah) {
      return { success: false, message: "Nasabah tidak ditemukan." };
    }

    if (
      targetNasabah.role !== "konsumen" &&
      targetNasabah.role !== "warmindo"
    ) {
      return {
        success: false,
        message:
          "Reward hanya dapat diberikan kepada nasabah Konsumen atau Warmindo.",
      };
    }

    // Eksekusi transaksi database: Tambah poin nasabah + catat riwayat
    await db.transaction(async (tx) => {
      // 1. Tambah poin di tabel nasabah
      await tx
        .update(nasabah)
        .set({
          poin: sql`COALESCE(${nasabah.poin}, 0) + ${poinReward}`,
          updatedAt: new Date(),
        })
        .where(eq(nasabah.id, userId));

      // 2. Insert riwayat ke reward_top_kontributor
      await tx.insert(rewardTopKontributor).values({
        userId,
        adminId: admin.id,
        periodeBulan,
        periodeTahun,
        kategori,
        peringkat,
        totalBeratKg,
        poinReward,
        catatan:
          catatan && catatan.trim() !== ""
            ? catatan.trim()
            : `Reward Top Kontributor #${peringkat} Periode Bulan ${periodeBulan}/${periodeTahun}`,
      });
    });

    revalidatePath("/reward-top-kontributor");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/warmindo-dashboard");

    return {
      success: true,
      message: `Berhasil memberikan reward ${poinReward.toLocaleString("id-ID")} poin kepada ${targetNasabah.name} (#${peringkat})!`,
    };
  } catch (error) {
    console.error("Error in giveRewardPointsAction:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat memberikan reward poin.",
    };
  }
}

// ─── 3. FETCH FULL REWARD HISTORY ────────────────────────────────────────────

export interface RewardHistoryRow {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  adminName: string;
  periodeBulan: number;
  periodeTahun: number;
  peringkat: number;
  totalBeratKg: number;
  poinReward: number;
  catatan: string | null;
  createdAt: Date;
}

export async function getRewardHistoryList(
  year?: number,
  month?: number,
): Promise<{ success: boolean; data?: RewardHistoryRow[]; message?: string }> {
  const admin = await getAdminUser();
  if (!admin) {
    return { success: false, message: "Akses ditolak." };
  }

  try {
    const conditions = [];
    if (year) {
      conditions.push(eq(rewardTopKontributor.periodeTahun, year));
    }
    if (month) {
      conditions.push(eq(rewardTopKontributor.periodeBulan, month));
    }

    const rows = await db
      .select({
        id: rewardTopKontributor.id,
        userId: rewardTopKontributor.userId,
        userName: nasabah.name,
        userRole: nasabah.role,
        adminName: users.name,
        periodeBulan: rewardTopKontributor.periodeBulan,
        periodeTahun: rewardTopKontributor.periodeTahun,
        peringkat: rewardTopKontributor.peringkat,
        totalBeratKg: rewardTopKontributor.totalBeratKg,
        poinReward: rewardTopKontributor.poinReward,
        catatan: rewardTopKontributor.catatan,
        createdAt: rewardTopKontributor.createdAt,
      })
      .from(rewardTopKontributor)
      .leftJoin(nasabah, eq(nasabah.id, rewardTopKontributor.userId))
      .leftJoin(users, eq(users.id, rewardTopKontributor.adminId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(rewardTopKontributor.createdAt))
      .limit(100);

    const history: RewardHistoryRow[] = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName || "Nasabah",
      userRole: r.userRole || "konsumen",
      adminName: r.adminName || "Admin",
      periodeBulan: r.periodeBulan,
      periodeTahun: r.periodeTahun,
      peringkat: r.peringkat,
      totalBeratKg: Math.round(r.totalBeratKg * 1000) / 1000,
      poinReward: r.poinReward,
      catatan: r.catatan,
      createdAt: r.createdAt,
    }));

    return {
      success: true,
      data: history,
    };
  } catch (error) {
    console.error("Error in getRewardHistoryList:", error);
    return {
      success: false,
      message: "Gagal mengambil riwayat reward.",
    };
  }
}
