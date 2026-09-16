"use server";

import { asc, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyIsSuperadmin } from "@/app/lib/auth-actions";
import type { ActionState } from "@/app/types";
import { db } from "@/db";
import {
  insertPoinSampahWarmindoSchema,
  poinSampahWarmindo,
} from "@/db/schema";

// ════════════════════════════════════════════════════════════════════════════
// MASTER POIN WARMINDO (Konversi Tarif Poin Sampah)
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
