"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
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

export async function getKonsumenRewardData() {
  const user = await getCurrentUser();
  if (!user || user.role !== "konsumen") {
    return {
      success: false,
      userPoin: 0,
      userProfile: null,
      rewards: [],
      history: [],
    };
  }

  try {
    const [profile, rewards, history] = await Promise.all([
      db.query.nasabah.findFirst({
        where: eq(nasabah.id, user.id),
        columns: {
          id: true,
          name: true,
          poin: true,
          jenisBank: true,
          noRekening: true,
          alamat: true,
        },
      }),
      db.query.rewardWarmindo.findMany({
        where: and(
          eq(rewardWarmindo.status, "aktif"),
          inArray(rewardWarmindo.targetAudience, ["semua", "konsumen"]),
        ),
        orderBy: [desc(rewardWarmindo.poin)],
      }),
      db.query.penukaranRewardWarmindo.findMany({
        where: eq(penukaranRewardWarmindo.userId, user.id),
        orderBy: [desc(penukaranRewardWarmindo.createdAt)],
      }),
    ]);

    return {
      success: true,
      userPoin: profile?.poin ?? 0,
      userProfile: profile
        ? {
            id: profile.id,
            name: profile.name,
            jenisBank: profile.jenisBank,
            noRekening: profile.noRekening,
            alamat: profile.alamat,
          }
        : null,
      rewards,
      history,
    };
  } catch (error) {
    console.error("Gagal mengambil data reward konsumen:", error);
    return {
      success: false,
      userPoin: 0,
      userProfile: null,
      rewards: [],
      history: [],
    };
  }
}

const claimSchema = z.object({
  rewardId: z.number().int().positive(),
  jenisBank: z.string().optional().nullable(),
  noRekening: z.string().optional().nullable(),
  atasNama: z.string().optional().nullable(),
  alamatPengiriman: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
});

export async function submitTukarRewardKonsumen(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "konsumen") {
    return {
      success: false,
      errors: { _form: ["Akses ditolak. Silakan login sebagai konsumen."] },
    };
  }

  const rawRewardId = formData.get("rewardId");
  const rewardId = Number(rawRewardId);
  const rawData = {
    rewardId,
    jenisBank: (formData.get("jenisBank") as string) || null,
    noRekening: (formData.get("noRekening") as string) || null,
    atasNama: (formData.get("atasNama") as string) || null,
    alamatPengiriman: (formData.get("alamatPengiriman") as string) || null,
    catatan: (formData.get("catatan") as string) || null,
  };

  const parsed = claimSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    // 1. Ambil data reward
    const reward = await db.query.rewardWarmindo.findFirst({
      where: and(
        eq(rewardWarmindo.id, rewardId),
        eq(rewardWarmindo.status, "aktif"),
        inArray(rewardWarmindo.targetAudience, ["semua", "konsumen"]),
      ),
    });

    if (!reward) {
      return {
        success: false,
        errors: { _form: ["Reward tidak ditemukan atau sudah tidak aktif."] },
      };
    }

    // 2. Cek stok jika kategori barang atau voucher
    if (
      (reward.kategori === "barang" || reward.kategori === "voucher") &&
      reward.stok <= 0
    ) {
      return {
        success: false,
        errors: { _form: ["Maaf, stok reward ini sudah habis."] },
      };
    }

    // 3. Ambil data profil nasabah & poin aktif
    const profile = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, user.id),
    });

    const userPoin = profile?.poin ?? 0;
    if (userPoin < reward.poin) {
      return {
        success: false,
        errors: {
          _form: [
            `Poin Anda tidak mencukupi. Anda memiliki ${userPoin} poin, namun dibutuhkan ${reward.poin} poin.`,
          ],
        },
      };
    }

    // 4. Validasi spesifik kategori
    if (reward.kategori === "uang") {
      if (
        !parsed.data.jenisBank ||
        !parsed.data.noRekening ||
        !parsed.data.atasNama
      ) {
        return {
          success: false,
          errors: {
            _form: [
              "Untuk reward uang tunai, data rekening tujuan wajib diisi lengkap.",
            ],
          },
        };
      }
    } else if (reward.kategori === "barang") {
      if (!parsed.data.alamatPengiriman) {
        return {
          success: false,
          errors: {
            _form: [
              "Untuk reward barang fisik, alamat pengiriman wajib diisi.",
            ],
          },
        };
      }
    }

    // 5. Potong poin nasabah
    await db
      .update(nasabah)
      .set({
        poin: Math.max(0, userPoin - reward.poin),
        updatedAt: new Date(),
      })
      .where(eq(nasabah.id, user.id));

    // 6. Potong stok reward jika barang atau voucher
    if (reward.kategori === "barang" || reward.kategori === "voucher") {
      await db
        .update(rewardWarmindo)
        .set({
          stok: Math.max(0, reward.stok - 1),
          updatedAt: new Date(),
        })
        .where(eq(rewardWarmindo.id, reward.id));
    }

    // 7. Simpan pengajuan penukaran reward
    await db.insert(penukaranRewardWarmindo).values({
      userId: user.id,
      rewardId: reward.id,
      namaReward: reward.nama,
      kategori: reward.kategori,
      poinDipotong: reward.poin,
      nominalUang: reward.kategori === "uang" ? reward.nominalUang : null,
      status: "pending",
      kategoriNasabah: "konsumen",
      jenisBank: parsed.data.jenisBank,
      noRekening: parsed.data.noRekening,
      atasNama: parsed.data.atasNama,
      alamatPengiriman: parsed.data.alamatPengiriman,
      catatan: parsed.data.catatan,
    });

    revalidatePath("/tukar-kupon");
    revalidatePath("/penukaran-reward-warmindo");

    return {
      success: true,
      message: `Penukaran reward "${reward.nama}" berhasil diajukan! Poin Anda telah dipotong sebesar ${reward.poin} poin.`,
    };
  } catch (error) {
    console.error("Gagal memproses penukaran reward konsumen:", error);
    return {
      success: false,
      errors: {
        _form: ["Terjadi kesalahan server saat mengajukan penukaran reward."],
      },
    };
  }
}
