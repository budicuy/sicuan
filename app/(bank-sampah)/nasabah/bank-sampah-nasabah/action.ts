"use server";

import argon2 from "argon2";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/app/types";
import { db } from "@/db";
import { insertNasabahSchema, nasabah } from "@/db/schema";

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
    or(eq(nasabah.role, "konsumen"), eq(nasabah.role, "warmiendo")),
  );

  if (search) {
    whereConditions.push(
      or(
        ilike(nasabah.name, `%${search}%`),
        ilike(nasabah.nik, `%${search}%`),
        ilike(nasabah.noTelepon, `%${search}%`),
        ilike(nasabah.alamat, `%${search}%`),
      ),
    );
  }

  if (role) {
    whereConditions.push(eq(nasabah.role, role as "konsumen" | "warmiendo"));
  }

  const queryCondition = and(...whereConditions);

  // Count query
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(nasabah)
    .where(queryCondition);
  const total = Number(countRes[0]?.count ?? 0);

  // Dynamic sorting
  let orderColumn = sortOrder === "desc" ? desc(nasabah.id) : asc(nasabah.id);
  if (sortBy === "name") {
    orderColumn = sortOrder === "desc" ? desc(nasabah.name) : asc(nasabah.name);
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
      userId: nasabah.id,
      nik: nasabah.nik,
      tanggalLahir: nasabah.tanggalLahir,
      noTelepon: nasabah.noTelepon,
      alamat: nasabah.alamat,
      jenisBank: nasabah.jenisBank,
      noRekening: nasabah.noRekening,
      email: nasabah.email,
      name: nasabah.name,
      username: nasabah.username,
      role: nasabah.role,
    })
    .from(nasabah)
    .where(queryCondition)
    .orderBy(orderColumn)
    .limit(limit)
    .offset(offset);

  // Map to nested format for frontend compatibility
  const mappedData = data.map((d) => ({
    id: d.id,
    userId: d.userId,
    nik: d.nik,
    tanggalLahir: d.tanggalLahir,
    noTelepon: d.noTelepon,
    alamat: d.alamat,
    jenisBank: d.jenisBank,
    noRekening: d.noRekening,
    email: d.email,
    user: {
      name: d.name,
      username: d.username,
      role: d.role,
    },
  }));

  return { data: mappedData, total };
}

const nasabahFormSchema = insertNasabahSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  username: true,
  password: true,
  role: true,
  status: true,
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
  const email = formData.get("email") as string;

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
    email: email || null,
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
    await db.insert(nasabah).values({
      name: name.trim(),
      username: username,
      password: hashedPassword,
      role: "konsumen",
      status: "Aktif",
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
  const email = formData.get("email") as string;

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
    email: email || null,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    // Update user account details direttament
    await db
      .update(nasabah)
      .set({
        name: name.trim(),
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
    // Deleting the user directly
    await db.delete(nasabah).where(eq(nasabah.id, id));

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
