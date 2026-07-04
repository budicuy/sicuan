"use server";

import argon2 from "argon2";
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

  // Enforce role is either konsumen or warmiendo for Bank Sampah view
  whereConditions.push(
    or(eq(users.role, "konsumen"), eq(users.role, "warmiendo")),
  );

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
    whereConditions.push(eq(users.role, role as "konsumen" | "warmiendo"));
  }

  const queryCondition = and(...whereConditions);

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

const nasabahFormSchema = insertNasabahSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export async function createNasabah(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name") as string;
  const nik = formData.get("nik") as string;
  const tanggalLahir = formData.get("tanggalLahir") as string;
  const noTelepon = formData.get("noTelepon") as string;
  const alamat = formData.get("alamat") as string;
  const jenisBank = formData.get("jenisBank") as string;
  const noRekening = formData.get("noRekening") as string;

  if (!name || name.trim().length < 2) {
    return {
      success: false,
      errors: { name: ["Nama lengkap minimal harus 2 karakter"] },
    };
  }

  const parsed = nasabahFormSchema.safeParse({
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
    // Generate random username and password for the user record
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const username = `nsb_${name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")}_${randomSuffix}`;
    const randomPassword =
      Math.random().toString(36) + Math.random().toString(36);
    const hashedPassword = await argon2.hash(randomPassword);

    // Create user account, defaulting to role 'konsumen'
    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        username: username,
        password: hashedPassword,
        role: "konsumen",
        status: "Aktif",
      })
      .returning();

    if (!newUser) {
      throw new Error("Gagal membuat user baru");
    }

    // Create nasabah profile
    await db.insert(nasabah).values({
      userId: newUser.id,
      ...parsed.data,
    });
  } catch (error) {
    console.error("Error creating nasabah by bank-sampah:", error);
    return {
      success: false,
      errors: { _form: ["Terjadi kesalahan server saat menyimpan data"] },
    };
  }

  revalidatePath("/nasabah/bank-sampah-nasabah");
  return { success: true };
}

export async function updateNasabah(
  id: number,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name") as string;
  const nik = formData.get("nik") as string;
  const tanggalLahir = formData.get("tanggalLahir") as string;
  const noTelepon = formData.get("noTelepon") as string;
  const alamat = formData.get("alamat") as string;
  const jenisBank = formData.get("jenisBank") as string;
  const noRekening = formData.get("noRekening") as string;

  if (!name || name.trim().length < 2) {
    return {
      success: false,
      errors: { name: ["Nama lengkap minimal harus 2 karakter"] },
    };
  }

  const parsed = nasabahFormSchema.safeParse({
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
    // Get existing nasabah profile
    const existing = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, id),
    });

    if (!existing) {
      return {
        success: false,
        errors: { _form: ["Data nasabah tidak ditemukan"] },
      };
    }

    // Update user account details (only name, preserving role)
    await db
      .update(users)
      .set({
        name: name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.userId));

    // Update nasabah profile details
    await db
      .update(nasabah)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(nasabah.id, id));
  } catch (error) {
    console.error("Error updating nasabah by bank-sampah:", error);
    return {
      success: false,
      errors: { _form: ["Terjadi kesalahan server saat memperbarui data"] },
    };
  }

  revalidatePath("/nasabah/bank-sampah-nasabah");
  return { success: true };
}

export async function deleteNasabah(id: number): Promise<ActionState> {
  try {
    const existing = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, id),
    });

    if (!existing) {
      return {
        success: false,
        errors: { _form: ["Data nasabah tidak ditemukan"] },
      };
    }

    // Deleting the user will automatically cascade delete the nasabah profile
    await db.delete(users).where(eq(users.id, existing.userId));

    revalidatePath("/nasabah/bank-sampah-nasabah");
    return { success: true };
  } catch (error) {
    console.error("Error deleting nasabah by bank-sampah:", error);
    return {
      success: false,
      errors: { _form: ["Gagal menghapus data nasabah"] },
    };
  }
}
