"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { nasabah, penukaranRewardWarmindo } from "@/db/schema";

export type ValidatorState = {
  success: boolean;
  message?: string;
  kuponData?: {
    id: number;
    kodeUnik: string;
    status: string;
    tanggalGunakan: string | null;
    createdAt: string;
    rewardNama: string;
    pemilikNama: string;
    biayaPoin: number;
  };
};

export async function getKuponDetailForValidation(
  kodeUnik: string,
): Promise<ValidatorState> {
  try {
    const penukaran = await db
      .select({
        id: penukaranRewardWarmindo.id,
        kodeUnik: penukaranRewardWarmindo.nomorResi,
        status: penukaranRewardWarmindo.status,
        createdAt: penukaranRewardWarmindo.createdAt,
        rewardNama: penukaranRewardWarmindo.namaReward,
        pemilikNama: nasabah.name,
        biayaPoin: penukaranRewardWarmindo.poinDipotong,
      })
      .from(penukaranRewardWarmindo)
      .innerJoin(nasabah, eq(penukaranRewardWarmindo.userId, nasabah.id))
      .where(eq(penukaranRewardWarmindo.nomorResi, kodeUnik))
      .limit(1);

    if (penukaran.length === 0) {
      return {
        success: false,
        message: "Voucher / Reward tidak ditemukan atau tidak valid.",
      };
    }

    const item = penukaran[0];
    return {
      success: true,
      kuponData: {
        id: item.id,
        kodeUnik: item.kodeUnik || kodeUnik,
        status: item.status === "berhasil" ? "aktif" : item.status,
        tanggalGunakan: null,
        createdAt: item.createdAt.toISOString(),
        rewardNama: item.rewardNama,
        pemilikNama: item.pemilikNama,
        biayaPoin: Number(item.biayaPoin),
      },
    };
  } catch (error) {
    console.error("Error fetching validation detail:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat memproses voucher.",
    };
  }
}

export async function markKuponAsUsed(
  id: number,
): Promise<{ success: boolean; message: string }> {
  try {
    await db
      .update(penukaranRewardWarmindo)
      .set({
        catatanAdmin: "Telah digunakan / ditukarkan di merchant",
        updatedAt: new Date(),
      })
      .where(eq(penukaranRewardWarmindo.id, id));

    revalidatePath("/kupon-validasi");
    return {
      success: true,
      message: "Voucher / Reward berhasil diverifikasi dan digunakan.",
    };
  } catch (error) {
    console.error("Error marking coupon as used:", error);
    return { success: false, message: "Gagal memproses penukaran voucher." };
  }
}
