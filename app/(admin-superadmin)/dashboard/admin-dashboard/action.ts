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

export async function getDashboardData() {
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
    // ADMIN / SUPERADMIN DASHBOARD DATA

    // 1. Get total count of nasabah (non-admin users)
    const countNasabahRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(nasabah)
      .where(inArray(nasabah.role, ["konsumen", "warmiendo", "bank-sampah"]));
    const totalNasabahCount = Number(countNasabahRes[0]?.count ?? 0);

    // 2. Get total count of users with role in ['konsumen', 'warmiendo', 'bank-sampah']
    const countUsersRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(nasabah)
      .where(inArray(nasabah.role, ["konsumen", "warmiendo", "bank-sampah"]));
    const totalUsers = Number(countUsersRes[0]?.count ?? 0);

    // 3. Get total weights and counts of setoran (pending/diterima/ditolak) via aggregation
    const [
      resWeight,
      resTodayWeight,
      pendingCount,
      ditolakCount,
      compList,
      userWeights,
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
    ]);

    const totalSetoranKg = Number(resWeight[0]?.totalWeight ?? 0);
    const totalSetoranTodayKg = Number(resTodayWeight[0]?.totalWeight ?? 0);
    const totalPendingSetoran = Number(pendingCount[0]?.count ?? 0);
    const totalDitolakSetoran = Number(ditolakCount[0]?.count ?? 0);

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
      total: Math.round(c.total * 10) / 10,
      percentage: `${Math.round((c.total / totalWeightContributors) * 1000) / 10}%`,
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

    return {
      success: true,
      role: user.role,
      name: user.name,
      metrics: {
        totalNasabahCount,
        totalUsers,
        totalSetoranKg: Math.round(totalSetoranKg * 10) / 10,
        totalSetoranTodayKg: Math.round(totalSetoranTodayKg * 10) / 10,
        totalPendingSetoran,
        totalDitolakSetoran,
      },
      composition: [
        {
          name: "Karton",
          value: Math.round(composition.Karton * 10) / 10,
          color: "#f59e0b",
        },
        {
          name: "Etiket (Plastik)",
          value: Math.round(composition.Etiket * 10) / 10,
          color: "#2563eb",
        },
        {
          name: "Paper Cup",
          value: Math.round(composition["Paper Cup"] * 10) / 10,
          color: "#10b981",
        },
      ],
      topContributors: formattedContributors,
      allNasabahCount: totalNasabahCount,
    };
  } else {
    // CLIENT SIDE (KONSUMEN / WARMIENDO / BANK SAMPAH)
    const mySetoran = (await db.query.setorSampah.findMany({
      where: and(
        eq(setorSampah.userId, user.id),
        eq(
          setorSampah.kategoriNasabah,
          user.role as "konsumen" | "warmiendo" | "bank-sampah",
        ),
      ),
      with: { ekspedisi: true },
      orderBy: [desc(setorSampah.createdAt)],
    })) as unknown as SetoranType[];

    const myPencairan = await db.query.pencairanDana.findMany({
      where: eq(pencairanDana.userId, user.id),
      orderBy: [desc(pencairanDana.createdAt)],
    });

    const myKupon = await db.query.penukaranKupon.findMany({
      where: eq(penukaranKupon.userId, user.id),
      orderBy: [desc(penukaranKupon.createdAt)],
    });

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

    const totalKuponDitukar = myKupon.length;

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
        kredit: profile?.kredit ?? 0,
      },
      metrics: {
        totalSetoranKg: Math.round(totalSetoranKg * 10) / 10,
        totalSetoranPending,
        totalSetoranDiterima,
        totalPencairanBerhasil,
        totalPencairanPending,
        totalKuponDitukar,
      },
      composition: [
        {
          name: "Karton",
          value: Math.round(composition.Karton * 10) / 10,
          color: "#f59e0b",
        },
        {
          name: "Etiket (Plastik)",
          value: Math.round(composition.Etiket * 10) / 10,
          color: "#2563eb",
        },
        {
          name: "Paper Cup",
          value: Math.round(composition["Paper Cup"] * 10) / 10,
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
