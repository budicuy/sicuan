"use server";

import { and, desc, eq, gte, lte } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getHargaRange } from "@/app/lib/pricing";
import { db } from "@/db";
import { nasabah, pencairanDana, setorSampah } from "@/db/schema";

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

async function getWarmiendoMonthlyCredit(userId: number): Promise<number> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const startOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
  const endOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const records = await db.query.setorSampah.findMany({
    where: and(
      eq(setorSampah.userId, userId),
      eq(setorSampah.kategoriNasabah, "warmiendo"),
      eq(setorSampah.status, "diterima"),
      gte(setorSampah.tanggalSetor, startOfMonthStr),
      lte(setorSampah.tanggalSetor, endOfMonthStr),
    ),
  });

  const wasteMap: Record<string, number> = {};
  for (const r of records) {
    wasteMap[r.jenisSampah] = (wasteMap[r.jenisSampah] || 0) + r.beratKg;
  }

  let dynamicKredit = 0;
  for (const [jenis, berat] of Object.entries(wasteMap)) {
    const harga = await getHargaRange(jenis, berat);
    dynamicKredit += harga;
  }

  const startOfMonthDate = new Date(currentYear, currentMonth, 1);
  const endOfMonthDate = new Date(currentYear, currentMonth + 1, 1);

  const myDisbursements = await db.query.pencairanDana.findMany({
    where: and(
      eq(pencairanDana.userId, userId),
      gte(pencairanDana.createdAt, startOfMonthDate),
      lte(pencairanDana.createdAt, endOfMonthDate),
    ),
  });

  const totalWithdrawn = myDisbursements
    .filter((p) => p.status === "berhasil" || p.status === "pending")
    .reduce((sum, p) => sum + p.jumlah, 0);

  return Math.max(0, dynamicKredit - totalWithdrawn);
}

export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user || user.role !== "warmiendo") {
    return { success: false, message: "Akses ditolak" };
  }

  const [profile, mySetoran, myPencairan, currentKredit] = await Promise.all([
    db.query.nasabah.findFirst({
      where: eq(nasabah.id, user.id),
    }),
    db.query.setorSampah.findMany({
      where: and(
        eq(setorSampah.userId, user.id),
        eq(setorSampah.kategoriNasabah, "warmiendo"),
      ),
      orderBy: [desc(setorSampah.createdAt)],
    }),
    db.query.pencairanDana.findMany({
      where: eq(pencairanDana.userId, user.id),
      orderBy: [desc(pencairanDana.createdAt)],
    }),
    getWarmiendoMonthlyCredit(user.id),
  ]);

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
      kredit: currentKredit,
    },
    metrics: {
      totalSetoranKg: Math.round(totalSetoranKg * 10) / 10,
      totalSetoranPending,
      totalSetoranDiterima,
      totalPencairanBerhasil,
      totalPencairanPending,
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
