"use server";

import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyIsSuperadmin } from "@/app/lib/auth-actions";
import type { ActionState } from "@/app/types";
import { db } from "@/db";
import { hargaSampah, insertHargaSampahSchema } from "@/db/schema";

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
    whereConditions.push(or(ilike(hargaSampah.jenisSampah, `%${search}%`)));
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
  if (sortBy === "jenisSampah") {
    orderColumn =
      sortOrder === "desc"
        ? desc(hargaSampah.jenisSampah)
        : asc(hargaSampah.jenisSampah);
  } else if (sortBy === "minBerat") {
    orderColumn =
      sortOrder === "desc"
        ? desc(hargaSampah.minBerat)
        : asc(hargaSampah.minBerat);
  } else if (sortBy === "maxBerat") {
    orderColumn =
      sortOrder === "desc"
        ? desc(hargaSampah.maxBerat)
        : asc(hargaSampah.maxBerat);
  } else if (sortBy === "harga") {
    orderColumn =
      sortOrder === "desc" ? desc(hargaSampah.harga) : asc(hargaSampah.harga);
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
  const jenisSampah = formData.get("jenisSampah") as string;
  const minBerat = Number.parseFloat(formData.get("minBerat") as string);
  const maxBeratRaw = formData.get("maxBerat") as string;
  const maxBerat = maxBeratRaw ? Number.parseFloat(maxBeratRaw) : null;
  const harga = Number.parseInt(formData.get("harga") as string, 10);

  const parsed = hargaFormSchema.safeParse({
    jenisSampah,
    minBerat,
    maxBerat,
    harga,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  if (maxBerat !== null && minBerat >= maxBerat) {
    return {
      success: false,
      errors: {
        minBerat: ["Berat minimum harus kurang dari berat maksimum"],
        maxBerat: ["Berat maksimum harus lebih dari berat minimum"],
      },
    };
  }

  const categories = ["Karton", "Etiket", "Paper Cup"];

  try {
    for (const cat of categories) {
      const overlaps = await db
        .select()
        .from(hargaSampah)
        .where(
          and(
            eq(hargaSampah.jenisSampah, cat),
            maxBerat !== null ? lt(hargaSampah.minBerat, maxBerat) : undefined,
            or(
              isNull(hargaSampah.maxBerat),
              gt(hargaSampah.maxBerat, minBerat),
            ),
          ),
        );

      if (overlaps.length > 0) {
        return {
          success: false,
          errors: {
            _form: [
              `Range berat bertubrukan (overlap) dengan range harga yang sudah ada untuk kategori "${cat}".`,
            ],
          },
        };
      }
    }

    const insertData = categories.map((cat) => ({
      jenisSampah: cat,
      minBerat,
      maxBerat,
      harga,
    }));

    await db.insert(hargaSampah).values(insertData);
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
  const jenisSampah = formData.get("jenisSampah") as string;
  const minBerat = Number.parseFloat(formData.get("minBerat") as string);
  const maxBeratRaw = formData.get("maxBerat") as string;
  const maxBerat = maxBeratRaw ? Number.parseFloat(maxBeratRaw) : null;
  const harga = Number.parseInt(formData.get("harga") as string, 10);

  const parsed = hargaFormSchema.safeParse({
    jenisSampah,
    minBerat,
    maxBerat,
    harga,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  if (maxBerat !== null && minBerat >= maxBerat) {
    return {
      success: false,
      errors: {
        minBerat: ["Berat minimum harus kurang dari berat maksimum"],
        maxBerat: ["Berat maksimum harus lebih dari berat minimum"],
      },
    };
  }

  try {
    const overlaps = await db
      .select()
      .from(hargaSampah)
      .where(
        and(
          eq(hargaSampah.jenisSampah, jenisSampah),
          ne(hargaSampah.id, id),
          maxBerat !== null ? lt(hargaSampah.minBerat, maxBerat) : undefined,
          or(isNull(hargaSampah.maxBerat), gt(hargaSampah.maxBerat, minBerat)),
        ),
      );

    if (overlaps.length > 0) {
      return {
        success: false,
        errors: {
          _form: [
            "Range berat bertubrukan (overlap) dengan range harga yang sudah ada untuk jenis sampah ini.",
          ],
        },
      };
    }

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
  if (!(await verifyIsSuperadmin())) {
    return {
      success: false,
      errors: {
        _form: ["Akses ditolak. Hanya Superadmin yang dapat menghapus data."],
      },
    };
  }
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
