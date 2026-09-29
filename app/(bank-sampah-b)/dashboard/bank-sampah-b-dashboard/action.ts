"use server";

import { and, desc, eq } from "drizzle-orm";
import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { nasabah, setorSampah, videoPost } from "@/db/schema";

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

export async function getDashboardDataB() {
  const user = await getCurrentUser();
  if (!user || user.role !== "bank-sampah-b") {
    return { success: false, message: "Akses ditolak" };
  }

  const [profile, mySetoran, activeMedia] = await Promise.all([
    db.query.nasabah.findFirst({
      where: eq(nasabah.id, user.id),
    }),
    db.query.setorSampah.findMany({
      where: and(
        eq(setorSampah.userId, user.id),
        eq(setorSampah.kategoriNasabah, "bank-sampah-b"),
      ),
      orderBy: [desc(setorSampah.createdAt)],
    }),
    db.query.videoPost.findMany({
      where: eq(videoPost.isActive, true),
      orderBy: [desc(videoPost.createdAt)],
    }),
  ]);

  const receivedSetoran = mySetoran.filter((s) => s.status === "diterima");

  // Total weight
  const totalBeratKg = receivedSetoran.reduce((sum, s) => sum + s.beratKg, 0);

  // Total points
  const totalPoin = profile?.poin ?? 0;

  // Monthly stats
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const startOfMonth = new Date(currentYear, currentMonth, 1);

  const thisMonthSetoran = receivedSetoran.filter(
    (s) => new Date(s.createdAt) >= startOfMonth,
  );
  const thisMonthBeratKg = thisMonthSetoran.reduce(
    (sum, s) => sum + s.beratKg,
    0,
  );
  const thisMonthPoin = thisMonthSetoran.reduce(
    (sum, s) => sum + s.totalPoin,
    0,
  );

  // Composition by waste type
  const composition = {
    Karton: 0,
    Etiket: 0,
    "Paper Cup": 0,
  };
  for (const s of receivedSetoran) {
    if (s.jenisSampah in composition) {
      composition[s.jenisSampah as keyof typeof composition] += s.beratKg;
    }
  }

  // Distribution by waste source (Sumber Sampah)
  const sumberDistribution = {
    Warmindo: 0,
    Karyawan: 0,
    "Factory Visit": 0,
    Masyarakat: 0,
  };
  for (const s of receivedSetoran) {
    const src = s.sumberSampah as keyof typeof sumberDistribution;
    if (src && src in sumberDistribution) {
      sumberDistribution[src] += s.beratKg;
    }
  }

  // Recent 5 transactions
  const recentTransactions = mySetoran.slice(0, 5).map((s) => ({
    id: s.id,
    nomorSetor: s.nomorSetor,
    jenisSampah: s.jenisSampah,
    beratKg: s.beratKg,
    totalPoin: s.totalPoin,
    tanggalSetor: s.tanggalSetor,
    status: s.status,
    sumberSampah: s.sumberSampah,
    createdAt: s.createdAt,
  }));

  return {
    success: true,
    data: {
      profile: {
        id: user.id,
        name: user.name,
        username: user.username,
        poin: totalPoin,
        alamat: profile?.alamat,
        noTelepon: profile?.noTelepon,
      },
      stats: {
        totalPoin,
        totalBeratKg: Math.round(totalBeratKg * 100) / 100,
        totalTransaksi: mySetoran.length,
        thisMonthBeratKg: Math.round(thisMonthBeratKg * 100) / 100,
        thisMonthPoin,
      },
      composition,
      sumberDistribution,
      recentTransactions,
      activeMedia,
    },
  };
}
