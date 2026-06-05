"use server";

import { desc, eq } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

  // 1. Get user profile/nasabah info
  const profile = await db.query.nasabah.findFirst({
    where: eq(nasabah.userId, user.id),
  });

  const isMgmt = user.role === "admin" || user.role === "superadmin";

  if (isMgmt) {
    // ADMIN / SUPERADMIN DASHBOARD DATA
    const allUsers = await db.query.users.findMany();
    const allNasabah = await db.query.nasabah.findMany();
    const allSetoran = await db.query.setorSampah.findMany({
      orderBy: [desc(setorSampah.createdAt)],
    });
    const _allPencairan = await db.query.pencairanDana.findMany();

    // Metrics
    const totalUsers = allUsers.filter(
      (u) =>
        u.role === "konsumen" ||
        u.role === "warmiendo" ||
        u.role === "bank-sampah",
    ).length;
    const totalSetoranKg = allSetoran
      .filter((s) => s.status === "diterima")
      .reduce((sum, s) => sum + s.beratKg, 0);

    const today = new Date().toISOString().split("T")[0];
    const totalSetoranTodayKg = allSetoran
      .filter((s) => s.status === "diterima" && s.tanggalSetor === today)
      .reduce((sum, s) => sum + s.beratKg, 0);

    const totalPendingSetoran = allSetoran.filter(
      (s) => s.status === "pending",
    ).length;
    const totalDitolakSetoran = allSetoran.filter(
      (s) => s.status === "ditolak",
    ).length;

    // Waste composition
    const composition = {
      Karton: 0,
      Etiket: 0,
      "Paper Cup": 0,
    };
    for (const s of allSetoran) {
      if (s.status === "diterima") {
        const cat = s.jenisSampah as "Karton" | "Etiket" | "Paper Cup";
        if (composition[cat] !== undefined) {
          composition[cat] += s.beratKg;
        }
      }
    }

    // Top contributors calculation
    const userWeights: Record<
      number,
      { name: string; role: string; total: number }
    > = {};
    for (const u of allUsers) {
      userWeights[u.id] = { name: u.name, role: u.role, total: 0 };
    }
    for (const s of allSetoran) {
      if (s.status === "diterima" && userWeights[s.userId]) {
        userWeights[s.userId].total += s.beratKg;
      }
    }
    const topContributors = Object.values(userWeights)
      .filter(
        (w) => w.total > 0 && w.role !== "admin" && w.role !== "superadmin",
      )
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

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
        totalNasabahCount: allNasabah.length,
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
      allNasabahCount: allNasabah.length,
    };
  } else {
    // CLIENT SIDE (KONSUMEN / WARMIENDO / BANK SAMPAH)
    const mySetoran = await db.query.setorSampah.findMany({
      where: eq(setorSampah.userId, user.id),
      orderBy: [desc(setorSampah.createdAt)],
    });

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
    // Group last 7 setoran
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
