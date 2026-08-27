"use server";

import { and, asc, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifyIsSuperadmin } from "@/app/lib/auth-actions";
import type { ActionState } from "@/app/types";
import { db } from "@/db";
import {
  insertPoinSampahWarmindoSchema,
  poinSampahWarmindo,
  rewardWarmindo,
} from "@/db/schema";

// ════════════════════════════════════════════════════════════════════════════
// 1. ATUR POIN WARMINDO
// ════════════════════════════════════════════════════════════════════════════

export async function getPoinWarmindo(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const offset = (page - 1) * limit;
  const search = params?.search ?? "";
  const sortBy = params?.sortBy ?? "id";
  const sortOrder = params?.sortOrder ?? "asc";

  let whereClause: SQL | undefined;
  if (search) {
    whereClause = or(ilike(poinSampahWarmindo.jenisSampah, `%${search}%`));
  }

  let orderColumn = asc(poinSampahWarmindo.id);
  if (sortBy === "jenisSampah") {
    orderColumn =
      sortOrder === "asc"
        ? asc(poinSampahWarmindo.jenisSampah)
        : desc(poinSampahWarmindo.jenisSampah);
  } else if (sortBy === "poinPer100Gram") {
    orderColumn =
      sortOrder === "asc"
        ? asc(poinSampahWarmindo.poinPer100Gram)
        : desc(poinSampahWarmindo.poinPer100Gram);
  }

  const [data, totalCount] = await Promise.all([
    db
      .select()
      .from(poinSampahWarmindo)
      .where(whereClause)
      .orderBy(orderColumn)
      .limit(limit)
      .offset(offset),
    db
      .select({ id: poinSampahWarmindo.id })
      .from(poinSampahWarmindo)
      .where(whereClause),
  ]);

  return { data, total: totalCount.length };
}

export async function updatePoinWarmindo(
  id: number,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const isSuperadmin = await verifyIsSuperadmin();
  if (!isSuperadmin) {
    return {
      success: false,
      errors: {
        _form: ["Hanya Superadmin yang berhak mengubah master poin Warmindo."],
      },
    };
  }

  const rawData = {
    jenisSampah: formData.get("jenisSampah"),
    poinPer100Gram: Number(formData.get("poinPer100Gram")),
  };

  const parsed = insertPoinSampahWarmindoSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await db
      .update(poinSampahWarmindo)
      .set({
        poinPer100Gram: parsed.data.poinPer100Gram,
        updatedAt: new Date(),
      })
      .where(eq(poinSampahWarmindo.id, id));

    revalidatePath("/poin-warmindo");
    return { success: true };
  } catch (error) {
    console.error("Gagal update poin warmindo:", error);
    return {
      success: false,
      errors: { _form: ["Terjadi kesalahan saat memperbarui data poin."] },
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 2. ATUR REWARD WARMINDO (Barang & Uang)
// ════════════════════════════════════════════════════════════════════════════

export async function getRewardWarmindo(params?: {
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
  const sortBy = params?.sortBy ?? "id";
  const sortOrder = params?.sortOrder ?? "desc";

  const filters: SQL[] = [];

  if (kategori && kategori !== "Semua") {
    filters.push(eq(rewardWarmindo.kategori, kategori as "barang" | "uang"));
  }

  if (status && status !== "Semua") {
    filters.push(eq(rewardWarmindo.status, status as "aktif" | "nonaktif"));
  }

  let searchFilter: SQL | undefined;
  if (search) {
    searchFilter = or(
      ilike(rewardWarmindo.nama, `%${search}%`),
      ilike(rewardWarmindo.deskripsi, `%${search}%`),
    );
  }

  const combinedWhere =
    filters.length > 0
      ? searchFilter
        ? and(...filters, searchFilter)
        : and(...filters)
      : searchFilter;

  let orderColumn = desc(rewardWarmindo.id);
  if (sortBy === "nama") {
    orderColumn =
      sortOrder === "asc"
        ? asc(rewardWarmindo.nama)
        : desc(rewardWarmindo.nama);
  } else if (sortBy === "poin") {
    orderColumn =
      sortOrder === "asc"
        ? asc(rewardWarmindo.poin)
        : desc(rewardWarmindo.poin);
  } else if (sortBy === "kategori") {
    orderColumn =
      sortOrder === "asc"
        ? asc(rewardWarmindo.kategori)
        : desc(rewardWarmindo.kategori);
  }

  const [data, totalCount] = await Promise.all([
    db
      .select()
      .from(rewardWarmindo)
      .where(combinedWhere)
      .orderBy(orderColumn)
      .limit(limit)
      .offset(offset),
    db
      .select({ id: rewardWarmindo.id })
      .from(rewardWarmindo)
      .where(combinedWhere),
  ]);

  return { data, total: totalCount.length };
}

const rewardFormSchema = z.object({
  nama: z.string().min(2, "Nama reward minimal 2 karakter"),
  kategori: z.enum(["barang", "uang"]),
  deskripsi: z.string().optional().default(""),
  poin: z.number().int().positive("Poin harus bilangan bulat positif"),
  nominalUang: z.number().int().nonnegative().optional().nullable(),
  stok: z.number().int().nonnegative().default(100),
  status: z.enum(["aktif", "nonaktif"]).default("aktif"),
  gambar: z.string().optional().nullable(),
});

export async function createRewardWarmindo(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const isSuperadmin = await verifyIsSuperadmin();
  if (!isSuperadmin) {
    return {
      success: false,
      errors: {
        _form: ["Hanya Superadmin yang berhak menambah reward Warmindo."],
      },
    };
  }

  const kategori = formData.get("kategori") as "barang" | "uang";
  const nominalUangRaw = formData.get("nominalUang");
  const nominalUang =
    kategori === "uang" && nominalUangRaw
      ? Number.parseInt(nominalUangRaw as string, 10)
      : null;

  const rawData = {
    nama: formData.get("nama") as string,
    kategori,
    deskripsi: (formData.get("deskripsi") as string) || "",
    poin: Number.parseInt(formData.get("poin") as string, 10),
    nominalUang,
    stok: Number.parseInt((formData.get("stok") as string) || "100", 10),
    status: (formData.get("status") as "aktif" | "nonaktif") || "aktif",
    gambar: (formData.get("gambar") as string) || null,
  };

  const parsed = rewardFormSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await db.insert(rewardWarmindo).values({
      nama: parsed.data.nama,
      kategori: parsed.data.kategori,
      deskripsi: parsed.data.deskripsi,
      poin: parsed.data.poin,
      nominalUang: parsed.data.nominalUang,
      stok: parsed.data.stok,
      status: parsed.data.status,
      gambar: parsed.data.gambar,
    });

    revalidatePath("/poin-warmindo");
    return { success: true };
  } catch (error) {
    console.error("Gagal membuat reward warmindo:", error);
    return {
      success: false,
      errors: { _form: ["Terjadi kesalahan server saat menyimpan reward."] },
    };
  }
}

export async function updateRewardWarmindo(
  id: number,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const isSuperadmin = await verifyIsSuperadmin();
  if (!isSuperadmin) {
    return {
      success: false,
      errors: {
        _form: ["Hanya Superadmin yang berhak mengubah reward Warmindo."],
      },
    };
  }

  const kategori = formData.get("kategori") as "barang" | "uang";
  const nominalUangRaw = formData.get("nominalUang");
  const nominalUang =
    kategori === "uang" && nominalUangRaw
      ? Number.parseInt(nominalUangRaw as string, 10)
      : null;

  const rawData = {
    nama: formData.get("nama") as string,
    kategori,
    deskripsi: (formData.get("deskripsi") as string) || "",
    poin: Number.parseInt(formData.get("poin") as string, 10),
    nominalUang,
    stok: Number.parseInt((formData.get("stok") as string) || "100", 10),
    status: (formData.get("status") as "aktif" | "nonaktif") || "aktif",
    gambar: (formData.get("gambar") as string) || null,
  };

  const parsed = rewardFormSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await db
      .update(rewardWarmindo)
      .set({
        nama: parsed.data.nama,
        kategori: parsed.data.kategori,
        deskripsi: parsed.data.deskripsi,
        poin: parsed.data.poin,
        nominalUang: parsed.data.nominalUang,
        stok: parsed.data.stok,
        status: parsed.data.status,
        gambar: parsed.data.gambar,
        updatedAt: new Date(),
      })
      .where(eq(rewardWarmindo.id, id));

    revalidatePath("/poin-warmindo");
    return { success: true };
  } catch (error) {
    console.error("Gagal update reward warmindo:", error);
    return {
      success: false,
      errors: { _form: ["Terjadi kesalahan server saat memperbarui reward."] },
    };
  }
}

export async function deleteRewardWarmindo(id: number): Promise<ActionState> {
  const isSuperadmin = await verifyIsSuperadmin();
  if (!isSuperadmin) {
    return {
      success: false,
      errors: {
        _form: ["Hanya Superadmin yang berhak menghapus reward Warmindo."],
      },
    };
  }

  try {
    await db.delete(rewardWarmindo).where(eq(rewardWarmindo.id, id));
    revalidatePath("/poin-warmindo");
    return { success: true };
  } catch (error) {
    console.error("Gagal menghapus reward warmindo:", error);
    return {
      success: false,
      errors: { _form: ["Gagal menghapus data reward warmindo."] },
    };
  }
}
