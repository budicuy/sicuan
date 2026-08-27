"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { ActionState } from "@/app/types";
import { db } from "@/db";
import { nasabah, penukaranRewardWarmindo, rewardWarmindo } from "@/db/schema";

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

export async function getWarmindoRewardData() {
  const user = await getCurrentUser();
  if (!user || user.role !== "warmindo") {
    return {
      success: false,
      userPoin: 0,
      userProfile: null,
      rewards: [],
      history: [],
    };
  }

  try {
    const [userProfile, rewards, history] = await Promise.all([
      db.query.nasabah.findFirst({
        where: eq(nasabah.id, user.id),
      }),
      db.query.rewardWarmindo.findMany({
        where: eq(rewardWarmindo.status, "aktif"),
        orderBy: [desc(rewardWarmindo.poin)],
      }),
      db.query.penukaranRewardWarmindo.findMany({
        where: eq(penukaranRewardWarmindo.userId, user.id),
        orderBy: [desc(penukaranRewardWarmindo.id)],
      }),
    ]);

    return {
      success: true,
      userPoin: userProfile?.poin ?? 0,
      userProfile: userProfile
        ? {
            id: userProfile.id,
            name: userProfile.name,
            jenisBank: userProfile.jenisBank,
            noRekening: userProfile.noRekening,
            alamat: userProfile.alamat,
          }
        : null,
      rewards,
      history,
    };
  } catch (error) {
    console.error("Gagal mengambil data reward warmindo:", error);
    return {
      success: false,
      userPoin: 0,
      userProfile: null,
      rewards: [],
      history: [],
    };
  }
}

export async function submitTukarReward(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "warmindo") {
    return {
      success: false,
      errors: {
        _form: ["Sesi login tidak valid atau Anda bukan mitra Warmindo."],
      },
    };
  }

  const rewardIdRaw = formData.get("rewardId");
  if (!rewardIdRaw) {
    return {
      success: false,
      errors: { _form: ["Reward yang ingin ditukar belum dipilih."] },
    };
  }

  const rewardId = Number.parseInt(rewardIdRaw as string, 10);
  const catatan = (formData.get("catatan") as string) || null;
  const jenisBank = (formData.get("jenisBank") as string) || null;
  const noRekening = (formData.get("noRekening") as string) || null;
  const atasNama = (formData.get("atasNama") as string) || null;
  const alamatPengiriman = (formData.get("alamatPengiriman") as string) || null;

  try {
    // 1. Ambil data reward & profil user
    const [reward, userProfile] = await Promise.all([
      db.query.rewardWarmindo.findFirst({
        where: and(
          eq(rewardWarmindo.id, rewardId),
          eq(rewardWarmindo.status, "aktif"),
        ),
      }),
      db.query.nasabah.findFirst({
        where: eq(nasabah.id, user.id),
      }),
    ]);

    if (!reward) {
      return {
        success: false,
        errors: { _form: ["Reward tidak ditemukan atau sudah tidak aktif."] },
      };
    }

    const userPoin = userProfile?.poin ?? 0;
    if (userPoin < reward.poin) {
      return {
        success: false,
        errors: {
          _form: [
            `Poin Anda tidak mencukupi (${userPoin.toLocaleString("id-ID")} dari ${reward.poin.toLocaleString("id-ID")} poin yang dibutuhkan).`,
          ],
        },
      };
    }

    if (reward.stok <= 0) {
      return {
        success: false,
        errors: { _form: ["Stok reward ini sedang habis."] },
      };
    }

    // Validasi form sesuai kategori
    if (reward.kategori === "uang") {
      if (!jenisBank || !noRekening || !atasNama) {
        return {
          success: false,
          errors: {
            _form: [
              "Informasi Bank, Nomor Rekening, dan Atas Nama wajib diisi untuk reward uang tunai.",
            ],
          },
        };
      }
    } else {
      if (!alamatPengiriman) {
        return {
          success: false,
          errors: {
            _form: ["Alamat pengiriman barang wajib diisi."],
          },
        };
      }
    }

    // 2. Potong poin user
    await db
      .update(nasabah)
      .set({
        poin: sql`${nasabah.poin} - ${reward.poin}`,
        updatedAt: new Date(),
      })
      .where(eq(nasabah.id, user.id));

    // 3. Kurangi stok reward jika bukan uang
    if (reward.kategori === "barang") {
      await db
        .update(rewardWarmindo)
        .set({
          stok: sql`${rewardWarmindo.stok} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(rewardWarmindo.id, reward.id));
    }

    // 4. Catat pengajuan penukaran reward
    await db.insert(penukaranRewardWarmindo).values({
      userId: user.id,
      rewardId: reward.id,
      namaReward: reward.nama,
      kategori: reward.kategori,
      poinDipotong: reward.poin,
      nominalUang: reward.nominalUang,
      status: "pending",
      jenisBank,
      noRekening,
      atasNama,
      alamatPengiriman,
      catatan,
    });

    revalidatePath("/tukar-reward");
    revalidatePath("/dashboard/warmindo-dashboard");
    revalidatePath("/penukaran-reward-warmindo");
    return { success: true };
  } catch (error) {
    console.error("Gagal menukar reward warmindo:", error);
    return {
      success: false,
      errors: { _form: ["Terjadi kesalahan saat memproses penukaran reward."] },
    };
  }
}
