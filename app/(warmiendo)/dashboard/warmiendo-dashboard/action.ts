"use server";

import { desc, eq } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { nasabah, pencairanDana, setorSampahWarmiendo } from "@/db/schema";

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
  if (!user || user.role !== "warmiendo") {
    return { success: false, message: "Akses ditolak" };
  }

  const [profile, mySetoran, myPencairan] = await Promise.all([
    db.query.nasabah.findFirst({
      where: eq(nasabah.userId, user.id),
    }),
    db.query.setorSampahWarmiendo.findMany({
      where: eq(setorSampahWarmiendo.userId, user.id),
      orderBy: [desc(setorSampahWarmiendo.createdAt)],
    }),
    db.query.pencairanDana.findMany({
      where: eq(pencairanDana.userId, user.id),
      orderBy: [desc(pencairanDana.createdAt)],
    }),
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
      kredit: profile?.kredit ?? 0,
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
