"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { uploadImageToR2 } from "@/app/lib/r2";
import type { ActionState } from "@/app/types";
import { db } from "@/db";
import { nasabah, penukaranRewardWarmindo } from "@/db/schema";

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

export async function getPenukaranRewardList(params?: {
  page?: number;
  limit?: number;
  search?: string;
  kategori?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const offset = (page - 1) * limit;
  const search = params?.search ?? "";
  const kategori = params?.kategori ?? "";
  const status = params?.status ?? "";

  const filters: SQL[] = [];

  if (kategori && kategori !== "Semua") {
    filters.push(
      eq(penukaranRewardWarmindo.kategori, kategori as "barang" | "uang"),
    );
  }

  if (status && status !== "Semua") {
    filters.push(
      eq(
        penukaranRewardWarmindo.status,
        status as "pending" | "diproses" | "berhasil" | "ditolak",
      ),
    );
  }

  let searchFilter: SQL | undefined;
  if (search) {
    searchFilter = or(
      ilike(penukaranRewardWarmindo.namaReward, `%${search}%`),
      ilike(penukaranRewardWarmindo.catatan, `%${search}%`),
      ilike(penukaranRewardWarmindo.atasNama, `%${search}%`),
      ilike(penukaranRewardWarmindo.noRekening, `%${search}%`),
    );
  }

  const combinedWhere =
    filters.length > 0
      ? searchFilter
        ? and(...filters, searchFilter)
        : and(...filters)
      : searchFilter;

  const [data, totalCount] = await Promise.all([
    db.query.penukaranRewardWarmindo.findMany({
      where: combinedWhere,
      with: {
        user: true,
      },
      orderBy: [desc(penukaranRewardWarmindo.id)],
      limit,
      offset,
    }),
    db
      .select({ id: penukaranRewardWarmindo.id })
      .from(penukaranRewardWarmindo)
      .where(combinedWhere),
  ]);

  return { data, total: totalCount.length };
}

export async function approvePenukaranReward(
  id: number,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return { success: false, errors: { _form: ["Akses ditolak."] } };
  }

  const item = await db.query.penukaranRewardWarmindo.findFirst({
    where: eq(penukaranRewardWarmindo.id, id),
  });

  if (!item) {
    return {
      success: false,
      errors: { _form: ["Data pengajuan reward tidak ditemukan."] },
    };
  }

  if (item.status === "berhasil" || item.status === "ditolak") {
    return {
      success: false,
      errors: { _form: ["Pengajuan ini sudah difinalisasi sebelumnya."] },
    };
  }

  const catatanAdmin = (formData.get("catatanAdmin") as string) || null;
  const nomorResi = (formData.get("nomorResi") as string) || null;
  const buktiTransferBase64 = (formData.get("buktiTransfer") as string) || null;

  try {
    let buktiTransferUrl = item.buktiTransfer;
    if (buktiTransferBase64 && buktiTransferBase64.trim() !== "") {
      const uuid = randomUUID();
      buktiTransferUrl = await uploadImageToR2(
        buktiTransferBase64,
        "bukti-transfer-reward",
        `reward-${id}-${uuid}`,
      );
    }

    await db
      .update(penukaranRewardWarmindo)
      .set({
        status: "berhasil",
        buktiTransfer: buktiTransferUrl,
        nomorResi: nomorResi ?? item.nomorResi,
        catatanAdmin,
        updatedAt: new Date(),
      })
      .where(eq(penukaranRewardWarmindo.id, id));

    revalidatePath("/penukaran-reward-warmindo");
    revalidatePath("/tukar-reward");
    revalidatePath("/dashboard/warmindo-dashboard");
    return { success: true };
  } catch (error) {
    console.error("Gagal menyetujui penukaran reward:", error);
    return {
      success: false,
      errors: { _form: ["Terjadi kesalahan saat memproses persetujuan."] },
    };
  }
}

export async function rejectPenukaranReward(
  id: number,
  alasan: string,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return { success: false, errors: { _form: ["Akses ditolak."] } };
  }

  const item = await db.query.penukaranRewardWarmindo.findFirst({
    where: eq(penukaranRewardWarmindo.id, id),
  });

  if (!item) {
    return {
      success: false,
      errors: { _form: ["Data pengajuan reward tidak ditemukan."] },
    };
  }

  if (item.status === "berhasil" || item.status === "ditolak") {
    return {
      success: false,
      errors: { _form: ["Pengajuan ini sudah difinalisasi sebelumnya."] },
    };
  }

  try {
    // 1. Update status to ditolak
    await db
      .update(penukaranRewardWarmindo)
      .set({
        status: "ditolak",
        catatanAdmin: alasan,
        updatedAt: new Date(),
      })
      .where(eq(penukaranRewardWarmindo.id, id));

    // 2. Refund points to user
    await db
      .update(nasabah)
      .set({
        poin: sql`${nasabah.poin} + ${item.poinDipotong}`,
        updatedAt: new Date(),
      })
      .where(eq(nasabah.id, item.userId));

    revalidatePath("/penukaran-reward-warmindo");
    revalidatePath("/tukar-reward");
    revalidatePath("/dashboard/warmindo-dashboard");
    return { success: true };
  } catch (error) {
    console.error("Gagal menolak penukaran reward:", error);
    return {
      success: false,
      errors: { _form: ["Gagal menolak pengajuan reward."] },
    };
  }
}
