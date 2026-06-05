"use server";

import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { hargaSampah, insertHargaSampahSchema } from "@/db/schema";

export type ActionState = {
  success: boolean;
  errors?: Record<string, string[]>;
};

export async function getHargaSampah(params?: {
  page?: number;
  limit?: number;
  search?: string;
  jenisSampah?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const offset = (page - 1) * limit;
  const search = params?.search ?? "";
  const jenisSampah = params?.jenisSampah ?? "";
  const sortBy = params?.sortBy ?? "id";
  const sortOrder = params?.sortOrder ?? "desc";

  const whereConditions = [];

  if (search) {
    whereConditions.push(
      or(
        ilike(hargaSampah.periode, `%${search}%`),
        ilike(hargaSampah.jenisSampah, `%${search}%`),
      ),
    );
  }

  if (jenisSampah) {
    whereConditions.push(eq(hargaSampah.jenisSampah, jenisSampah));
  }

  const queryCondition =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Get total count
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(hargaSampah)
    .where(queryCondition);
  const total = Number(countRes[0]?.count ?? 0);

  // Dynamic sorting
  let orderColumn =
    sortOrder === "desc" ? desc(hargaSampah.id) : asc(hargaSampah.id);
  if (sortBy === "periode") {
    orderColumn =
      sortOrder === "desc"
        ? desc(hargaSampah.periode)
        : asc(hargaSampah.periode);
  } else if (sortBy === "jenisSampah") {
    orderColumn =
      sortOrder === "desc"
        ? desc(hargaSampah.jenisSampah)
        : asc(hargaSampah.jenisSampah);
  } else if (sortBy === "hargaPerKg") {
    orderColumn =
      sortOrder === "desc"
        ? desc(hargaSampah.hargaPerKg)
        : asc(hargaSampah.hargaPerKg);
  } else if (sortBy === "pointPerKg") {
    orderColumn =
      sortOrder === "desc"
        ? desc(hargaSampah.pointPerKg)
        : asc(hargaSampah.pointPerKg);
  } else if (sortBy === "beratMin") {
    orderColumn =
      sortOrder === "desc"
        ? desc(hargaSampah.beratMin)
        : asc(hargaSampah.beratMin);
  }

  // Get data
  const data = await db
    .select()
    .from(hargaSampah)
    .where(queryCondition)
    .orderBy(orderColumn)
    .limit(limit)
    .offset(offset);

  return { data, total };
}

const hargaFormSchema = insertHargaSampahSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export async function createHargaSampah(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const periodeRaw = formData.get("periode") as string;
  const periode = periodeRaw ? `${periodeRaw}-01` : "";
  const jenisSampah = formData.get("jenisSampah") as string;
  const hargaPerKg = Number.parseInt(formData.get("hargaPerKg") as string, 10);
  const pointPerKg = Number.parseInt(formData.get("pointPerKg") as string, 10);
  const beratMin = Number.parseInt(formData.get("beratMin") as string, 10);

  const parsed = hargaFormSchema.safeParse({
    periode,
    jenisSampah,
    hargaPerKg,
    pointPerKg,
    beratMin,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.insert(hargaSampah).values(parsed.data);
  } catch (error) {
    console.error("Error creating harga sampah:", error);
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/harga-sampah");
  return { success: true };
}

export async function updateHargaSampah(
  id: number,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const periodeRaw = formData.get("periode") as string;
  const periode = periodeRaw ? `${periodeRaw}-01` : "";
  const jenisSampah = formData.get("jenisSampah") as string;
  const hargaPerKg = Number.parseInt(formData.get("hargaPerKg") as string, 10);
  const pointPerKg = Number.parseInt(formData.get("pointPerKg") as string, 10);
  const beratMin = Number.parseInt(formData.get("beratMin") as string, 10);

  const parsed = hargaFormSchema.safeParse({
    periode,
    jenisSampah,
    hargaPerKg,
    pointPerKg,
    beratMin,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db
      .update(hargaSampah)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(hargaSampah.id, id));
  } catch (error) {
    console.error("Error updating harga sampah:", error);
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/harga-sampah");
  return { success: true };
}

export async function deleteHargaSampah(id: number): Promise<ActionState> {
  try {
    await db.delete(hargaSampah).where(eq(hargaSampah.id, id));
    revalidatePath("/harga-sampah");
    return { success: true };
  } catch (error) {
    console.error("Error deleting harga sampah:", error);
    return {
      success: false,
      errors: { _form: ["Gagal menghapus harga sampah"] },
    };
  }
}
