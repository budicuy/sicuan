"use server";

import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyIsSuperadmin } from "@/app/lib/auth-actions";
import type { ActionState } from "@/app/types";
import { db } from "@/db";
import { rawMaterial } from "@/db/schema";

export async function getRawMaterial(params?: {
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
  const sortOrder = params?.sortOrder ?? "desc";

  const whereConditions = [];

  if (search) {
    whereConditions.push(ilike(rawMaterial.periode, `%${search}%`));
  }

  const queryCondition =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Hitung total baris
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(rawMaterial)
    .where(queryCondition);
  const total = Number(countRes[0]?.count ?? 0);

  // Sorting dinamis
  let orderColumn =
    sortOrder === "desc" ? desc(rawMaterial.id) : asc(rawMaterial.id);
  if (sortBy === "periode") {
    orderColumn =
      sortOrder === "desc"
        ? desc(rawMaterial.periode)
        : asc(rawMaterial.periode);
  }

  // Ambil data
  const data = await db
    .select()
    .from(rawMaterial)
    .where(queryCondition)
    .orderBy(orderColumn)
    .limit(limit)
    .offset(offset);

  return { data, total };
}

export async function saveRawMaterial(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Input dari <input type="month"> memberikan format YYYY-MM
  // Simpan sebagai YYYY-MM-01 (hari pertama bulan)
  const periodeRaw = formData.get("periode") as string;

  if (!periodeRaw || !/^\d{4}-\d{2}$/.test(periodeRaw)) {
    return {
      success: false,
      errors: {
        periode: ["Periode harus diisi dengan format bulan yang valid"],
      },
    };
  }

  const periode = `${periodeRaw}-01`; // YYYY-MM-01

  const etiket_nn = Number(formData.get("etiket_nn") || 0);
  const etiket_gn = Number(formData.get("etiket_gn") || 0);
  const etiket_cn = Number(formData.get("etiket_cn") || 0);
  const karton_nn = Number(formData.get("karton_nn") || 0);
  const karton_gn = Number(formData.get("karton_gn") || 0);
  const karton_cn = Number(formData.get("karton_cn") || 0);
  const cup_cn = Number(formData.get("cup_cn") || 0);

  try {
    // UPSERT — jika periode sudah ada, update; jika belum, insert
    await db
      .insert(rawMaterial)
      .values({
        periode,
        etiketNnGram: etiket_nn,
        etiketGnGram: etiket_gn,
        etiketCnGram: etiket_cn,
        kartonNnGram: karton_nn,
        kartonGnGram: karton_gn,
        kartonCnGram: karton_cn,
        cupCnGram: cup_cn,
      })
      .onConflictDoUpdate({
        target: rawMaterial.periode,
        set: {
          etiketNnGram: etiket_nn,
          etiketGnGram: etiket_gn,
          etiketCnGram: etiket_cn,
          kartonNnGram: karton_nn,
          kartonGnGram: karton_gn,
          kartonCnGram: karton_cn,
          cupCnGram: cup_cn,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("Error saving raw material:", error);
    return {
      success: false,
      errors: { _form: ["Terjadi kesalahan server saat menyimpan data"] },
    };
  }

  revalidatePath("/raw-material");
  return { success: true };
}

export async function deleteRawMaterial(id: number): Promise<ActionState> {
  if (!(await verifyIsSuperadmin())) {
    return {
      success: false,
      errors: {
        _form: ["Akses ditolak. Hanya Superadmin yang dapat menghapus data."],
      },
    };
  }
  try {
    await db.delete(rawMaterial).where(eq(rawMaterial.id, id));
    revalidatePath("/raw-material");
    return { success: true };
  } catch (error) {
    console.error("Error deleting raw material:", error);
    return {
      success: false,
      errors: { _form: ["Gagal menghapus data raw material"] },
    };
  }
}

export async function getRawMaterialByPeriod(periode: string) {
  try {
    return await db
      .select()
      .from(rawMaterial)
      .where(eq(rawMaterial.periode, periode))
      .limit(1);
  } catch (error) {
    console.error("Error fetching raw material by period:", error);
    return [];
  }
}
