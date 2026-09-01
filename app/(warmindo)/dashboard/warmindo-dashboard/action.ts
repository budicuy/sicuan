"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  nasabah,
  penukaranRewardWarmindo,
  setorSampah,
  videoPost,
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
  if (!user || user.role !== "warmindo") {
    return { success: false, message: "Akses ditolak" };
  }

  const [profile, mySetoran, myRewardClaims, activeMedia] = await Promise.all([
    db.query.nasabah.findFirst({
      where: eq(nasabah.id, user.id),
    }),
    db.query.setorSampah.findMany({
      where: and(
        eq(setorSampah.userId, user.id),
        eq(setorSampah.kategoriNasabah, "warmindo"),
      ),
      orderBy: [desc(setorSampah.createdAt)],
    }),
    db.query.penukaranRewardWarmindo.findMany({
      where: eq(penukaranRewardWarmindo.userId, user.id),
      orderBy: [desc(penukaranRewardWarmindo.createdAt)],
    }),
    db.query.videoPost.findMany({
      where: eq(videoPost.isActive, true),
      orderBy: [asc(videoPost.urutan), asc(videoPost.id)],
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

  const totalRewardBerhasil = myRewardClaims.filter(
    (r) => r.status === "berhasil",
  ).length;
  const totalRewardPending = myRewardClaims.filter(
    (r) => r.status === "pending",
  ).length;

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
    },
    mediaItems: activeMedia.map((m) => ({
      id: m.id,
      tipe: m.tipe,
      mediaUrl: m.mediaUrl || m.videoUrl || "",
    })),
    video: activeMedia[0]
      ? {
          videoUrl: activeMedia[0].mediaUrl || activeMedia[0].videoUrl,
          judul: activeMedia[0].judul,
          deskripsi: activeMedia[0].deskripsi,
        }
      : null,
    metrics: {
      totalSetoranKg: Math.round(totalSetoranKg * 100) / 100,
      totalSetoranPending,
      totalSetoranDiterima,
      totalRewardBerhasil,
      totalRewardPending,
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
    recentReward: myRewardClaims.slice(0, 5).map((r) => ({
      id: r.id,
      namaReward: r.namaReward,
      kategori: r.kategori,
      poinDipotong: r.poinDipotong,
      nominalUang: r.nominalUang,
      status: r.status,
      createdAt: r.createdAt,
    })),
  };
}
