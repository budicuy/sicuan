"use server";

import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyIsSuperadmin } from "@/app/lib/auth-actions";
import type { ActionState } from "@/app/types";
import { db } from "@/db";
import { ekspedisi, insertEkspedisiSchema } from "@/db/schema";

export async function getEkspedisi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const offset = (page - 1) * limit;
  const search = params?.search ?? "";
  const status = params?.status ?? "";
  const sortBy = params?.sortBy ?? "id";
  const sortOrder = params?.sortOrder ?? "desc";

  const whereConditions = [];

  if (search) {
    whereConditions.push(
      or(
        ilike(ekspedisi.namaVendor, `%${search}%`),
        ilike(ekspedisi.noTelepon, `%${search}%`),
      ),
    );
  }

  if (status) {
    whereConditions.push(eq(ekspedisi.status, status));
  }

  const queryCondition =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Get total count
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(ekspedisi)
    .where(queryCondition);
  const total = Number(countRes[0]?.count ?? 0);

  // Dynamic sorting
  let orderColumn =
    sortOrder === "desc" ? desc(ekspedisi.id) : asc(ekspedisi.id);
  if (sortBy === "namaVendor") {
    orderColumn =
      sortOrder === "desc"
        ? desc(ekspedisi.namaVendor)
        : asc(ekspedisi.namaVendor);
  } else if (sortBy === "noTelepon") {
    orderColumn =
      sortOrder === "desc"
        ? desc(ekspedisi.noTelepon)
        : asc(ekspedisi.noTelepon);
  } else if (sortBy === "status") {
    orderColumn =
      sortOrder === "desc" ? desc(ekspedisi.status) : asc(ekspedisi.status);
  }

  // Get data
  const data = await db
    .select()
    .from(ekspedisi)
    .where(queryCondition)
    .orderBy(orderColumn)
    .limit(limit)
    .offset(offset);

  return { data, total };
}

const ekspedisiFormSchema = insertEkspedisiSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export async function createEkspedisi(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const namaVendor = formData.get("namaVendor") as string;
  const noTelepon = formData.get("noTelepon") as string;
  const status = formData.get("status") as string;

  const parsed = ekspedisiFormSchema.safeParse({
    namaVendor,
    noTelepon,
    status,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.insert(ekspedisi).values(parsed.data);
  } catch (error) {
    console.error("Error creating ekspedisi:", error);
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/dashboard/ekspedisi");
  return { success: true };
}

export async function updateEkspedisi(
  id: number,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const namaVendor = formData.get("namaVendor") as string;
  const noTelepon = formData.get("noTelepon") as string;
  const status = formData.get("status") as string;

  const parsed = ekspedisiFormSchema.safeParse({
    namaVendor,
    noTelepon,
    status,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db
      .update(ekspedisi)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(ekspedisi.id, id));
  } catch (error) {
    console.error("Error updating ekspedisi:", error);
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/dashboard/ekspedisi");
  return { success: true };
}

export async function deleteEkspedisi(id: number): Promise<ActionState> {
  if (!(await verifyIsSuperadmin())) {
    return {
      success: false,
      errors: {
        _form: ["Akses ditolak. Hanya Superadmin yang dapat menghapus data."],
      },
    };
  }
  try {
    await db.delete(ekspedisi).where(eq(ekspedisi.id, id));
    revalidatePath("/dashboard/ekspedisi");
    return { success: true };
  } catch (error) {
    console.error("Error deleting ekspedisi:", error);
    return { success: false, errors: { _form: ["Gagal menghapus ekspedisi"] } };
  }
}

export async function getAllActiveEkspedisi() {
  return db
    .select()
    .from(ekspedisi)
    .where(eq(ekspedisi.status, "Aktif"))
    .orderBy(asc(ekspedisi.namaVendor));
}
