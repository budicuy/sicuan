"use server";

import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyIsSuperadmin } from "@/app/lib/auth-actions";
import type { ActionState } from "@/app/types";
import { db } from "@/db";
import { insertPoinSampahSchema, poinSampah } from "@/db/schema";

export async function getPoinSampah(params?: {
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
    whereConditions.push(or(ilike(poinSampah.jenisSampah, `%${search}%`)));
  }

  const queryCondition =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Get total count
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(poinSampah)
    .where(queryCondition);
  const total = Number(countRes[0]?.count ?? 0);

  // Dynamic sorting
  let orderColumn =
    sortOrder === "desc" ? desc(poinSampah.id) : asc(poinSampah.id);
  if (sortBy === "jenisSampah") {
    orderColumn =
      sortOrder === "desc"
        ? desc(poinSampah.jenisSampah)
        : asc(poinSampah.jenisSampah);
  } else if (sortBy === "pointPerKg") {
    orderColumn =
      sortOrder === "desc"
        ? desc(poinSampah.pointPerKg)
        : asc(poinSampah.pointPerKg);
  }

  // Get data
  const data = await db
    .select()
    .from(poinSampah)
    .where(queryCondition)
    .orderBy(orderColumn)
    .limit(limit)
    .offset(offset);

  return { data, total };
}

const poinFormSchema = insertPoinSampahSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export async function createPoinSampah(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const jenisSampah = formData.get("jenisSampah") as string;
  const pointPerKg = Number.parseInt(formData.get("pointPerKg") as string, 10);

  const parsed = poinFormSchema.safeParse({
    jenisSampah,
    pointPerKg,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  if (!(await verifyIsSuperadmin())) {
    return {
      success: false,
      errors: {
        _form: [
          "Akses ditolak. Hanya Superadmin yang dapat menambah master poin.",
        ],
      },
    };
  }

  try {
    // Check if configuration already exists for this jenis sampah
    const existing = await db.query.poinSampah.findFirst({
      where: eq(poinSampah.jenisSampah, parsed.data.jenisSampah),
    });
    if (existing) {
      return {
        success: false,
        errors: {
          jenisSampah: ["Master poin untuk jenis sampah ini sudah ada"],
        },
      };
    }

    await db.insert(poinSampah).values(parsed.data);
  } catch (error) {
    console.error("Error creating master poin:", error);
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/poin");
  return { success: true };
}

export async function updatePoinSampah(
  id: number,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const jenisSampah = formData.get("jenisSampah") as string;
  const pointPerKg = Number.parseInt(formData.get("pointPerKg") as string, 10);

  const parsed = poinFormSchema.safeParse({
    jenisSampah,
    pointPerKg,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db
      .update(poinSampah)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(poinSampah.id, id));
  } catch (error) {
    console.error("Error updating master poin:", error);
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/poin");
  return { success: true };
}

export async function deletePoinSampah(id: number): Promise<ActionState> {
  if (!(await verifyIsSuperadmin())) {
    return {
      success: false,
      errors: {
        _form: ["Akses ditolak. Hanya Superadmin yang dapat menghapus data."],
      },
    };
  }
  try {
    await db.delete(poinSampah).where(eq(poinSampah.id, id));
    revalidatePath("/poin");
    return { success: true };
  } catch (error) {
    console.error("Error deleting master poin:", error);
    return {
      success: false,
      errors: { _form: ["Gagal menghapus master poin"] },
    };
  }
}
