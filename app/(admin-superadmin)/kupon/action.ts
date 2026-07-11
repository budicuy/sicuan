"use server";

import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyIsSuperadmin } from "@/app/lib/auth-actions";
import type { ActionState } from "@/app/types";
import { db } from "@/db";
import { insertKuponSchema, kupon } from "@/db/schema";

const kuponFormSchema = insertKuponSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export async function getKupon(params?: {
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
    whereConditions.push(
      or(
        ilike(kupon.nama, `%${search}%`),
        ilike(kupon.deskripsi, `%${search}%`),
      ),
    );
  }

  const queryCondition =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(kupon)
    .where(queryCondition);
  const total = Number(countRes[0]?.count ?? 0);

  let orderColumn = sortOrder === "desc" ? desc(kupon.id) : asc(kupon.id);
  if (sortBy === "nama") {
    orderColumn = sortOrder === "desc" ? desc(kupon.nama) : asc(kupon.nama);
  } else if (sortBy === "poin") {
    orderColumn = sortOrder === "desc" ? desc(kupon.poin) : asc(kupon.poin);
  }

  const data = await db
    .select()
    .from(kupon)
    .where(queryCondition)
    .orderBy(orderColumn)
    .limit(limit)
    .offset(offset);

  return { data, total };
}

export async function createKupon(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const nama = formData.get("nama") as string;
  const deskripsi = formData.get("deskripsi") as string;
  const poinRaw = formData.get("poin") as string;

  const poin = poinRaw ? Number.parseFloat(poinRaw) : 0;

  const parsed = kuponFormSchema.safeParse({
    nama,
    deskripsi,
    poin,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.insert(kupon).values(parsed.data);
  } catch (error) {
    console.error("Error creating kupon:", error);
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/kupon");
  return { success: true };
}

export async function updateKupon(
  id: number,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const nama = formData.get("nama") as string;
  const deskripsi = formData.get("deskripsi") as string;
  const poinRaw = formData.get("poin") as string;

  const poin = poinRaw ? Number.parseFloat(poinRaw) : 0;

  const parsed = kuponFormSchema.safeParse({
    nama,
    deskripsi,
    poin,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db
      .update(kupon)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(kupon.id, id));
  } catch (error) {
    console.error("Error updating kupon:", error);
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/kupon");
  return { success: true };
}

export async function deleteKupon(id: number): Promise<ActionState> {
  if (!(await verifyIsSuperadmin())) {
    return {
      success: false,
      errors: {
        _form: ["Akses ditolak. Hanya Superadmin yang dapat menghapus data."],
      },
    };
  }
  try {
    await db.delete(kupon).where(eq(kupon.id, id));
    revalidatePath("/kupon");
    return { success: true };
  } catch (error) {
    console.error("Error deleting kupon:", error);
    return {
      success: false,
      errors: { _form: ["Gagal menghapus kupon"] },
    };
  }
}
