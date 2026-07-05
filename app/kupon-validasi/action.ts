"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { kupon, nasabah, penukaranKupon } from "@/db/schema";

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
        id: penukaranKupon.id,
        kodeUnik: penukaranKupon.kodeUnik,
        status: penukaranKupon.status,
        tanggalGunakan: penukaranKupon.tanggalGunakan,
        createdAt: penukaranKupon.createdAt,
        rewardNama: kupon.nama,
        pemilikNama: nasabah.name,
        biayaPoin: kupon.poin,
      })
      .from(penukaranKupon)
      .innerJoin(kupon, eq(penukaranKupon.kuponId, kupon.id))
      .innerJoin(nasabah, eq(penukaranKupon.userId, nasabah.id))
      .where(eq(penukaranKupon.kodeUnik, kodeUnik))
      .limit(1);

    if (penukaran.length === 0) {
      return {
        success: false,
        message: "Kupon tidak ditemukan atau tidak valid.",
      };
    }

    const item = penukaran[0];
    return {
      success: true,
      kuponData: {
        id: item.id,
        kodeUnik: item.kodeUnik,
        status: item.status,
        tanggalGunakan: item.tanggalGunakan
          ? item.tanggalGunakan.toISOString()
          : null,
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
      message: "Terjadi kesalahan server saat memproses kupon.",
    };
  }
}

export async function markKuponAsUsed(
  id: number,
): Promise<{ success: boolean; message: string }> {
  try {
    await db
      .update(penukaranKupon)
      .set({
        status: "digunakan",
        tanggalGunakan: new Date(),
      })
      .where(eq(penukaranKupon.id, id));

    revalidatePath("/kupon-validasi");
    return {
      success: true,
      message: "Kupon berhasil ditandai telah digunakan.",
    };
  } catch (error) {
    console.error("Error marking coupon as used:", error);
    return { success: false, message: "Gagal memproses penukaran kupon." };
  }
}
