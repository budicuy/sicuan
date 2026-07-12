"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SetoranType } from "@/app/types";
import { db } from "@/db";
import {
  nasabah,
  pencairanDana,
  penukaranKupon,
  setorSampah,
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

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}

export async function getDashboardData(
  selectedMonth?: number,
  selectedYear?: number,
) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Akses ditolak" };
  }

  // 1. Get user profile info
  const profile = await db.query.nasabah.findFirst({
    where: eq(nasabah.id, user.id),
  });

  const isMgmt = user.role === "admin" || user.role === "superadmin";

  if (isMgmt) {
    const currentMonth = selectedMonth ?? new Date().getMonth() + 1;
    const currentYear = selectedYear ?? new Date().getFullYear();

    const _startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const _startOfYear = new Date(currentYear, 0, 1);
    // 1. Get total count of nasabah (non-admin users)
    const countNasabahRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(nasabah)
      .where(inArray(nasabah.role, ["konsumen", "warmindo", "bank-sampah"]));
    const totalNasabahCount = Number(countNasabahRes[0]?.count ?? 0);

    // 2. Get total count of users with role in ['konsumen', 'warmindo', 'bank-sampah']
    const countUsersRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(nasabah)
      .where(inArray(nasabah.role, ["konsumen", "warmindo", "bank-sampah"]));
    const totalUsers = Number(countUsersRes[0]?.count ?? 0);

    const [
      resWeight,
      resTodayWeight,
      pendingCount,
      ditolakCount,
      compList,
      userWeights,
      resMonthWeight,
      kuponRedeemCount,
      cashoutSum,
      unverifiedSubmissions,
      resYearWeight,
      monthlyTrendsRes,
      yearlyTrendsRes,
      weeklyRes,
    ] = await Promise.all([
      // 1. Total weight received
      db
        .select({
          totalWeight: sql<number>`sum(${setorSampah.beratKg})`,
        })
        .from(setorSampah)
        .where(eq(setorSampah.status, "diterima")),

      // 2. Total weight today received
      db
        .select({
          totalWeight: sql<number>`sum(${setorSampah.beratKg})`,
        })
        .from(setorSampah)
        .where(
          and(
            eq(setorSampah.status, "diterima"),
            eq(
              setorSampah.tanggalSetor,
              new Date().toISOString().split("T")[0],
            ),
          ),
        ),

      // 3. Total pending counts
      db
        .select({ count: sql<number>`count(*)` })
        .from(setorSampah)
        .where(eq(setorSampah.status, "pending")),

      // 4. Total ditolak counts
      db
        .select({ count: sql<number>`count(*)` })
        .from(setorSampah)
        .where(eq(setorSampah.status, "ditolak")),

      // 5. Waste composition group by jenisSampah
      db
        .select({
          jenisSampah: setorSampah.jenisSampah,
          totalWeight: sql<number>`sum(${setorSampah.beratKg})`,
        })
        .from(setorSampah)
        .where(eq(setorSampah.status, "diterima"))
        .groupBy(setorSampah.jenisSampah),

      // 6. Top contributors sum of weights by user
      db
        .select({
          userId: setorSampah.userId,
          totalWeight: sql<number>`sum(${setorSampah.beratKg})`,
        })
        .from(setorSampah)
        .where(eq(setorSampah.status, "diterima"))
        .groupBy(setorSampah.userId),

      // 7. Total weight for selected month & year received
      db
        .select({
          totalWeight: sql<number>`sum(${setorSampah.beratKg})`,
        })
        .from(setorSampah)
        .where(
          and(
            eq(setorSampah.status, "diterima"),
            sql`extract(month from ${setorSampah.createdAt}) = ${currentMonth}`,
            sql`extract(year from ${setorSampah.createdAt}) = ${currentYear}`,
          ),
        ),

      // 8. Total coupons redeemed
      db
        .select({ count: sql<number>`count(*)` })
        .from(penukaranKupon),

      // 9. Total successful disbursements
      db
        .select({ total: sql<number>`sum(${pencairanDana.jumlah})` })
        .from(pencairanDana)
        .where(eq(pencairanDana.status, "berhasil")),

      // 10. Latest 5 unverified submissions (pending, diverifikasi, or diserahkan)
      db.query.setorSampah.findMany({
        columns: {
          id: true,
          nomorSetor: true,
          jenisSampah: true,
          beratKg: true,
          status: true,
          createdAt: true,
        },
        where: inArray(setorSampah.status, [
          "pending",
          "diverifikasi",
          "diserahkan",
        ]),
        orderBy: [desc(setorSampah.createdAt)],
        limit: 5,
        with: {
          user: {
            columns: {
              name: true,
              role: true,
            },
          },
        },
      }),

      // 11. Total weight for selected year received
      db
        .select({
          totalWeight: sql<number>`sum(${setorSampah.beratKg})`,
        })
        .from(setorSampah)
        .where(
          and(
            eq(setorSampah.status, "diterima"),
            sql`extract(year from ${setorSampah.createdAt}) = ${currentYear}`,
          ),
        ),

      // 12. Monthly trends for the selected year
      db
        .select({
          month: sql<number>`extract(month from ${setorSampah.createdAt})`,
          totalWeight: sql<number>`sum(${setorSampah.beratKg})`,
        })
        .from(setorSampah)
        .where(
          and(
            eq(setorSampah.status, "diterima"),
            sql`extract(year from ${setorSampah.createdAt}) = ${currentYear}`,
          ),
        )
        .groupBy(sql`extract(month from ${setorSampah.createdAt})`),

      // 13. Yearly trends (all years)
      db
        .select({
          year: sql<number>`extract(year from ${setorSampah.createdAt})`,
          totalWeight: sql<number>`sum(${setorSampah.beratKg})`,
        })
        .from(setorSampah)
        .where(eq(setorSampah.status, "diterima"))
        .groupBy(sql`extract(year from ${setorSampah.createdAt})`),

      // 14. Weekly data for the selected month & year
      db
        .select({
          createdAt: setorSampah.createdAt,
          beratKg: setorSampah.beratKg,
        })
        .from(setorSampah)
        .where(
          and(
            eq(setorSampah.status, "diterima"),
            sql`extract(month from ${setorSampah.createdAt}) = ${currentMonth}`,
            sql`extract(year from ${setorSampah.createdAt}) = ${currentYear}`,
          ),
        ),
    ]);

    const totalSetoranKg = Number(resWeight[0]?.totalWeight ?? 0);
    const totalSetoranTodayKg = Number(resTodayWeight[0]?.totalWeight ?? 0);
    const totalPendingSetoran = Number(pendingCount[0]?.count ?? 0);
    const totalDitolakSetoran = Number(ditolakCount[0]?.count ?? 0);
    const totalSetoranMonthKg = Number(resMonthWeight[0]?.totalWeight ?? 0);
    const totalKuponDitukar = Number(kuponRedeemCount[0]?.count ?? 0);
    const totalPencairanDana = Number(cashoutSum[0]?.total ?? 0);

    // Sum composition
    const composition = {
      Karton: 0,
      Etiket: 0,
      "Paper Cup": 0,
    };
    for (const c of compList) {
      const cat = c.jenisSampah as "Karton" | "Etiket" | "Paper Cup";
      if (composition[cat] !== undefined) {
        composition[cat] += Number(c.totalWeight ?? 0);
      }
    }

    const sortedUserIdsWithWeights = userWeights
      .map((w) => ({ userId: w.userId, total: Number(w.totalWeight ?? 0) }))
      .sort((a, b) => b.total - a.total);

    const top15Candidates = sortedUserIdsWithWeights.slice(0, 15);
    let topContributors: { name: string; role: string; total: number }[] = [];

    if (top15Candidates.length > 0) {
      const candidateIds = top15Candidates.map((c) => c.userId);
      const candidatesUsers = await db
        .select({
          id: nasabah.id,
          name: nasabah.name,
          role: nasabah.role,
        })
        .from(nasabah)
        .where(inArray(nasabah.id, candidateIds));

      const mappedCandidates = top15Candidates
        .map((c) => {
          const u = candidatesUsers.find((user) => user.id === c.userId);
          return {
            name: u?.name ?? "Pengguna Tidak Dikenal",
            role: u?.role ?? "konsumen",
            total: c.total,
          };
        })
        .filter((w) => w.role !== "admin" && w.role !== "superadmin");

      topContributors = mappedCandidates.slice(0, 10);
    }

    const totalWeightContributors =
      topContributors.reduce((sum, c) => sum + c.total, 0) || 1;
    const formattedContributors = topContributors.map((c, i) => ({
      rank: i + 1,
      name: c.name,
      total: Math.round(c.total * 100) / 100,
      percentage: `${Math.round((c.total / totalWeightContributors) * 10000) / 100}%`,
      color:
        [
          "bg-blue-600",
          "bg-emerald-500",
          "bg-indigo-500",
          "bg-cyan-500",
          "bg-purple-500",
          "bg-amber-500",
          "bg-rose-500",
          "bg-pink-500",
          "bg-violet-500",
          "bg-fuchsia-500",
        ][i] || "bg-neutral-500",
    }));

    const totalSetoranYearKg = Number(resYearWeight[0]?.totalWeight ?? 0);

    const monthLabels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Ags",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const monthlyTrends = monthLabels.map((label, index) => {
      const match = monthlyTrendsRes.find(
        (item) => Number(item.month) === index + 1,
      );
      return {
        name: label,
        Volume: Math.round(Number(match?.totalWeight ?? 0) * 100) / 100,
      };
    });

    const currentYearNum = currentYear;
    const last5Years = Array.from(
      { length: 5 },
      (_, i) => currentYearNum - 4 + i,
    );

    const yearlyTrends = last5Years.map((yearNum) => {
      const match = yearlyTrendsRes.find(
        (item) => Number(item.year) === yearNum,
      );
      return {
        name: String(yearNum),
        Volume: match
          ? Math.round(Number(match.totalWeight ?? 0) * 100) / 100
          : 0,
      };
    });

    const weeklyData = [0, 0, 0, 0, 0];
    for (const s of weeklyRes) {
      const day = new Date(s.createdAt).getDate();
      const weekIdx = Math.min(4, Math.floor((day - 1) / 7));
      weeklyData[weekIdx] += Number(s.beratKg);
    }
    const weeklyTrends = weeklyData.map((weight, index) => ({
      name: `Mng ${index + 1}`,
      Volume: Math.round(weight * 100) / 100,
    }));

    return {
      success: true,
      role: user.role,
      name: user.name,
      metrics: {
        totalNasabahCount,
        totalUsers,
        totalSetoranKg: Math.round(totalSetoranKg * 100) / 100,
        totalSetoranTodayKg: Math.round(totalSetoranTodayKg * 100) / 100,
        totalPendingSetoran,
        totalDitolakSetoran,
        totalSetoranMonthKg: Math.round(totalSetoranMonthKg * 100) / 100,
        totalSetoranYearKg: Math.round(totalSetoranYearKg * 100) / 100,
        totalKuponDitukar,
        totalPencairanDana,
      },
      composition: [
        {
          name: "Karton",
          value: Math.round(composition.Karton * 100) / 100,
          color: "#f59e0b",
        },
        {
          name: "Etiket (Plastik)",
          value: Math.round(composition.Etiket * 100) / 100,
          color: "#2563eb",
        },
        {
          name: "Paper Cup",
          value: Math.round(composition["Paper Cup"] * 100) / 100,
          color: "#10b981",
        },
      ],
      topContributors: formattedContributors,
      allNasabahCount: totalNasabahCount,
      unverifiedSubmissions: unverifiedSubmissions.map((s) => ({
        id: s.id,
        nomorSetor: s.nomorSetor,
        name: s.user?.name ?? "Pengguna Tidak Dikenal",
        role: s.user?.role ?? "konsumen",
        jenisSampah: s.jenisSampah,
        beratKg: s.beratKg,
        status: s.status,
        createdAt: s.createdAt,
      })),
      weeklyTrends,
      monthlyTrends,
      yearlyTrends,
    };
  } else {
    // CLIENT SIDE (KONSUMEN / WARMINDO / BANK SAMPAH)
    const mySetoran = (await db.query.setorSampah.findMany({
      columns: {
        id: true,
        nomorSetor: true,
        jenisSampah: true,
        beratKg: true,
        status: true,
        tanggalSetor: true,
        totalPoin: true,
        createdAt: true,
      },
      where: and(
        eq(setorSampah.userId, user.id),
        eq(
          setorSampah.kategoriNasabah,
          user.role as "konsumen" | "warmindo" | "bank-sampah",
        ),
      ),
      with: { ekspedisi: true },
      orderBy: [desc(setorSampah.createdAt)],
    })) as unknown as SetoranType[];

    const myPencairan = await db.query.pencairanDana.findMany({
      columns: {
        id: true,
        jumlah: true,
        status: true,
        createdAt: true,
      },
      where: eq(pencairanDana.userId, user.id),
      orderBy: [desc(pencairanDana.createdAt)],
    });

    const countKuponRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(penukaranKupon)
      .where(eq(penukaranKupon.userId, user.id));
    const totalKuponDitukar = Number(countKuponRes[0]?.count ?? 0);

    // Calculate metrics
    const totalSetoranKg = mySetoran
      .filter((s) => s.status === "diterima")
      .reduce((sum, s) => sum + s.beratKg, 0);

    const totalSetoranPending = mySetoran.filter(
      (s) => s.status === "pending",
    ).length;
    const totalSetoranDiterima = mySetoran.filter(
      (s) => s.status === "diterima",
    ).length;

    const totalPencairanBerhasil = myPencairan
      .filter((p) => p.status === "berhasil")
      .reduce((sum, p) => sum + p.jumlah, 0);
    const totalPencairanPending = myPencairan
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.jumlah, 0);

    // Composition
    const composition = {
      Karton: 0,
      Etiket: 0,
      "Paper Cup": 0,
    };
    for (const s of mySetoran) {
      if (s.status === "diterima") {
        const cat = s.jenisSampah as "Karton" | "Etiket" | "Paper Cup";
        if (composition[cat] !== undefined) {
          composition[cat] += s.beratKg;
        }
      }
    }

    // Daily history for the user's line charts
    // Group last 10 setoran
    const setoranHistory = mySetoran
      .filter((s) => s.status === "diterima")
      .slice(0, 10)
      .reverse()
      .map((s) => ({
        date: new Date(s.tanggalSetor).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        }),
        Volume: s.beratKg,
        Poin: s.totalPoin,
      }));

    return {
      success: true,
      role: user.role,
      name: user.name,
      profile: {
        poin: profile?.poin ?? 0,
      },
      metrics: {
        totalSetoranKg: Math.round(totalSetoranKg * 100) / 100,
        totalSetoranPending,
        totalSetoranDiterima,
        totalPencairanBerhasil,
        totalPencairanPending,
        totalKuponDitukar,
      },
      composition: [
        {
          name: "Karton",
          value: Math.round(composition.Karton * 100) / 100,
          color: "#f59e0b",
        },
        {
          name: "Etiket (Plastik)",
          value: Math.round(composition.Etiket * 100) / 100,
          color: "#2563eb",
        },
        {
          name: "Paper Cup",
          value: Math.round(composition["Paper Cup"] * 100) / 100,
          color: "#10b981",
        },
      ],
      setoranHistory,
      recentSetoran: mySetoran.slice(0, 5).map((s) => ({
        id: s.id,
        nomorSetor: s.nomorSetor,
        jenisSampah: s.jenisSampah,
        beratKg: s.beratKg,
        status: s.status,
        tanggalSetor: s.tanggalSetor,
      })),
      recentPencairan: myPencairan.slice(0, 5).map((p) => ({
        id: p.id,
        jumlah: p.jumlah,
        status: p.status,
        createdAt: p.createdAt,
      })),
    };
  }
}
