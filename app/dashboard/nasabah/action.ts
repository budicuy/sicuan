"use server";

import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { insertNasabahSchema, nasabah, users } from "@/db/schema";

export type ActionState = {
  success: boolean;
  errors?: Record<string, string[]>;
};

export async function getNasabah(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const offset = (page - 1) * limit;
  const search = params?.search ?? "";
  const role = params?.role ?? "";
  const sortBy = params?.sortBy ?? "id";
  const sortOrder = params?.sortOrder ?? "desc";

  const whereConditions = [];

  if (search) {
    whereConditions.push(
      or(
        ilike(users.name, `%${search}%`),
        ilike(nasabah.nik, `%${search}%`),
        ilike(nasabah.noTelepon, `%${search}%`),
        ilike(nasabah.alamat, `%${search}%`),
      ),
    );
  }

  if (role) {
    whereConditions.push(
      eq(
        users.role,
        role as
          | "superadmin"
          | "admin"
          | "konsumen"
          | "warmiendo"
          | "bank-sampah",
      ),
    );
  }

  const queryCondition =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Count query
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(nasabah)
    .innerJoin(users, eq(nasabah.userId, users.id))
    .where(queryCondition);
  const total = Number(countRes[0]?.count ?? 0);

  // Dynamic sorting
  let orderColumn = sortOrder === "desc" ? desc(nasabah.id) : asc(nasabah.id);
  if (sortBy === "name") {
    orderColumn = sortOrder === "desc" ? desc(users.name) : asc(users.name);
  } else if (sortBy === "nik") {
    orderColumn = sortOrder === "desc" ? desc(nasabah.nik) : asc(nasabah.nik);
  } else if (sortBy === "noTelepon") {
    orderColumn =
      sortOrder === "desc" ? desc(nasabah.noTelepon) : asc(nasabah.noTelepon);
  } else if (sortBy === "alamat") {
    orderColumn =
      sortOrder === "desc" ? desc(nasabah.alamat) : asc(nasabah.alamat);
  } else if (sortBy === "jenisBank") {
    orderColumn =
      sortOrder === "desc" ? desc(nasabah.jenisBank) : asc(nasabah.jenisBank);
  }

  // Data query
  const data = await db
    .select({
      id: nasabah.id,
      userId: nasabah.userId,
      nik: nasabah.nik,
      tanggalLahir: nasabah.tanggalLahir,
      noTelepon: nasabah.noTelepon,
      alamat: nasabah.alamat,
      jenisBank: nasabah.jenisBank,
      noRekening: nasabah.noRekening,
      user: {
        name: users.name,
        username: users.username,
        role: users.role,
      },
    })
    .from(nasabah)
    .innerJoin(users, eq(nasabah.userId, users.id))
    .where(queryCondition)
    .orderBy(orderColumn)
    .limit(limit)
    .offset(offset);

  return { data, total };
}

export async function getAvailableUsers() {
  return db.query.users.findMany({
    orderBy: users.name,
  });
}

const nasabahFormSchema = insertNasabahSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export async function createNasabah(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userIdStr = formData.get("userId") as string;
  const nik = formData.get("nik") as string;
  const tanggalLahir = formData.get("tanggalLahir") as string;
  const noTelepon = formData.get("noTelepon") as string;
  const alamat = formData.get("alamat") as string;
  const jenisBank = formData.get("jenisBank") as string;
  const noRekening = formData.get("noRekening") as string;

  const userId = Number.parseInt(userIdStr, 10);
  const parsed = nasabahFormSchema.safeParse({
    userId,
    nik: nik || null,
    tanggalLahir: tanggalLahir || null,
    noTelepon: noTelepon || null,
    alamat: alamat || null,
    jenisBank: jenisBank || null,
    noRekening: noRekening || null,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    // Check if user already has a nasabah profile
    const existing = await db.query.nasabah.findFirst({
      where: eq(nasabah.userId, parsed.data.userId),
    });

    if (existing) {
      return {
        success: false,
        errors: { userId: ["User ini sudah memiliki profil Nasabah Bank"] },
      };
    }

    await db.insert(nasabah).values(parsed.data);
  } catch (error) {
    console.error("Error creating nasabah:", error);
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/dashboard/nasabah");
  return { success: true };
}

export async function updateNasabah(
  id: number,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userIdStr = formData.get("userId") as string;
  const nik = formData.get("nik") as string;
  const tanggalLahir = formData.get("tanggalLahir") as string;
  const noTelepon = formData.get("noTelepon") as string;
  const alamat = formData.get("alamat") as string;
  const jenisBank = formData.get("jenisBank") as string;
  const noRekening = formData.get("noRekening") as string;

  const userId = Number.parseInt(userIdStr, 10);
  const parsed = nasabahFormSchema.safeParse({
    userId,
    nik: nik || null,
    tanggalLahir: tanggalLahir || null,
    noTelepon: noTelepon || null,
    alamat: alamat || null,
    jenisBank: jenisBank || null,
    noRekening: noRekening || null,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    // Check if user already has a nasabah profile (and it belongs to someone else)
    const existing = await db.query.nasabah.findFirst({
      where: eq(nasabah.userId, parsed.data.userId),
    });

    if (existing && existing.id !== id) {
      return {
        success: false,
        errors: {
          userId: ["User ini sudah memiliki profil Nasabah Bank lain"],
        },
      };
    }

    await db
      .update(nasabah)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(nasabah.id, id));
  } catch (error) {
    console.error("Error updating nasabah:", error);
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/dashboard/nasabah");
  return { success: true };
}

export async function deleteNasabah(id: number): Promise<ActionState> {
  try {
    await db.delete(nasabah).where(eq(nasabah.id, id));
    revalidatePath("/dashboard/nasabah");
    return { success: true };
  } catch (error) {
    console.error("Error deleting nasabah:", error);
    return {
      success: false,
      errors: { _form: ["Gagal menghapus profil nasabah"] },
    };
  }
}
