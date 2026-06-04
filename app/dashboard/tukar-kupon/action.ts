"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/db";
import { kupon, penukaranKupon, setorSampah } from "@/db/schema";

export type ActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const payload = decodeJwt(token) as {
      id: number;
      name: string;
      role: string;
      username: string;
    };
    return payload;
  } catch {
    return null;
  }
}

export async function getKonsumenPoints() {
  const user = await getCurrentUser();
  if (!user || user.role !== "konsumen") {
    return 0;
  }

  // Calculate total points from diterima setoran
  const totalSetoranPoinRes = await db
    .select({ total: sql<number>`sum(total_poin)` })
    .from(setorSampah)
    .where(
      and(eq(setorSampah.userId, user.id), eq(setorSampah.status, "diterima")),
    );
  const totalEarned = Number(totalSetoranPoinRes[0]?.total ?? 0);

  // Calculate points spent on coupon redemptions
  const penukaranList = await db
    .select({ poin: kupon.poin })
    .from(penukaranKupon)
    .innerJoin(kupon, eq(penukaranKupon.kuponId, kupon.id))
    .where(eq(penukaranKupon.userId, user.id));

  const totalSpent = penukaranList.reduce((sum, item) => sum + item.poin, 0);

  return Math.max(0, totalEarned - totalSpent);
}

export async function getAvailableCoupons() {
  return db.select().from(kupon).orderBy(desc(kupon.poin));
}

export async function getRedemptionHistory() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db
    .select({
      id: penukaranKupon.id,
      createdAt: penukaranKupon.createdAt,
      kodeUnik: penukaranKupon.kodeUnik,
      status: penukaranKupon.status,
      tanggalGunakan: penukaranKupon.tanggalGunakan,
      kupon: {
        nama: kupon.nama,
        deskripsi: kupon.deskripsi,
        poin: kupon.poin,
        tier: kupon.tier,
      },
    })
    .from(penukaranKupon)
    .innerJoin(kupon, eq(penukaranKupon.kuponId, kupon.id))
    .where(eq(penukaranKupon.userId, user.id))
    .orderBy(desc(penukaranKupon.createdAt));
}

// Generate randomized coupon code (e.g. SCN-XXXXXX-YYYYYY)
function generateRandomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment1 = Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  const segment2 = Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  return `SCN-${segment1}-${segment2}`;
}

export async function redeemCoupon(kuponId: number): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "konsumen") {
    return {
      success: false,
      message: "Akses ditolak. Silakan login sebagai konsumen.",
    };
  }

  try {
    // Check coupon exists and cost
    const targetKupon = await db.query.kupon.findFirst({
      where: eq(kupon.id, kuponId),
    });

    if (!targetKupon) {
      return { success: false, message: "Kupon tidak ditemukan." };
    }

    // Get current balance
    const currentPoints = await getKonsumenPoints();

    if (currentPoints < targetKupon.poin) {
      return {
        success: false,
        message: `Poin Anda tidak mencukupi. Dibutuhkan ${targetKupon.poin} poin, poin Anda saat ini ${currentPoints} poin.`,
      };
    }

    const uniqueCode = generateRandomCode();

    // Insert redemption transaction directly since neon-http doesn't support interactive transactions
    await db.insert(penukaranKupon).values({
      userId: user.id,
      kuponId: targetKupon.id,
      kodeUnik: uniqueCode,
      status: "aktif",
    });

    revalidatePath("/dashboard/tukar-kupon");
    return {
      success: true,
      message: `Berhasil menukarkan kupon ${targetKupon.nama}!`,
    };
  } catch (error) {
    console.error("Redemption error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat menukarkan kupon.",
    };
  }
}
