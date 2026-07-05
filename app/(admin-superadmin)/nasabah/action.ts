"use server";

import argon2 from "argon2";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyIsSuperadmin } from "@/app/lib/auth-actions";
import { db } from "@/db";
import { insertNasabahSchema, nasabah } from "@/db/schema";

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
        ilike(nasabah.name, `%${search}%`),
        ilike(nasabah.username, `%${search}%`),
        ilike(nasabah.nik, `%${search}%`),
        ilike(nasabah.noTelepon, `%${search}%`),
        ilike(nasabah.alamat, `%${search}%`),
      ),
    );
  }

  if (role) {
    whereConditions.push(
      eq(
        nasabah.role,
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
    .where(queryCondition);
  const total = Number(countRes[0]?.count ?? 0);

  // Dynamic sorting
  let orderColumn = sortOrder === "desc" ? desc(nasabah.id) : asc(nasabah.id);
  if (sortBy === "name") {
    orderColumn = sortOrder === "desc" ? desc(nasabah.name) : asc(nasabah.name);
  } else if (sortBy === "username") {
    orderColumn =
      sortOrder === "desc" ? desc(nasabah.username) : asc(nasabah.username);
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

  // Data query - direct query to nasabah
  const data = await db
    .select({
      id: nasabah.id,
      userId: nasabah.id, // For backward compatibility with the frontend structure
      name: nasabah.name,
      username: nasabah.username,
      role: nasabah.role,
      status: nasabah.status,
      nik: nasabah.nik,
      tanggalLahir: nasabah.tanggalLahir,
      noTelepon: nasabah.noTelepon,
      email: nasabah.email,
      alamat: nasabah.alamat,
      jenisBank: nasabah.jenisBank,
      noRekening: nasabah.noRekening,
      poin: nasabah.poin,
      kredit: nasabah.kredit,
    })
    .from(nasabah)
    .where(queryCondition)
    .orderBy(orderColumn)
    .limit(limit)
    .offset(offset);

  // Map to frontend-friendly nested structure to keep frontend page changes minimal/safe
  const mappedData = data.map((d) => ({
    id: d.id,
    userId: d.userId,
    nik: d.nik,
    tanggalLahir: d.tanggalLahir,
    noTelepon: d.noTelepon,
    email: d.email,
    alamat: d.alamat,
    jenisBank: d.jenisBank,
    noRekening: d.noRekening,
    poin: d.poin,
    kredit: d.kredit,
    user: {
      name: d.name,
      username: d.username,
      role: d.role,
      status: d.status,
    },
  }));

  return { data: mappedData, total };
}

// Validation Schema
const userFormSchema = insertNasabahSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export async function createNasabah(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as
    | "superadmin"
    | "admin"
    | "konsumen"
    | "warmiendo"
    | "bank-sampah";
  const status = formData.get("status") as string;

  const nik = formData.get("nik") as string;
  const tanggalLahir = formData.get("tanggalLahir") as string;
  const noTelepon = formData.get("noTelepon") as string;
  const email = formData.get("email") as string;
  const alamat = formData.get("alamat") as string;
  const jenisBank = formData.get("jenisBank") as string;
  const noRekening = formData.get("noRekening") as string;

  // Validate all fields together
  const parsed = userFormSchema.safeParse({
    name,
    username,
    password,
    role,
    status,
    nik: nik || null,
    tanggalLahir: tanggalLahir || null,
    noTelepon: noTelepon || null,
    email: email || null,
    alamat: alamat || null,
    jenisBank: jenisBank || null,
    noRekening: noRekening || null,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    // Check if username already exists
    const existingUser = await db.query.nasabah.findFirst({
      where: eq(nasabah.username, parsed.data.username),
    });

    if (existingUser) {
      return {
        success: false,
        errors: { username: ["Username sudah terdaftar di sistem"] },
      };
    }

    // Hash password
    const hashedPassword = await argon2.hash(parsed.data.password);

    // Insert user langsung
    await db.insert(nasabah).values({
      ...parsed.data,
      password: hashedPassword,
    });
  } catch (error) {
    console.error("Error creating nasabah:", error);
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/nasabah");
  return { success: true };
}

export async function updateNasabah(
  id: number, // this is the user id now
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as
    | "superadmin"
    | "admin"
    | "konsumen"
    | "warmiendo"
    | "bank-sampah";
  const status = formData.get("status") as string;

  const nik = formData.get("nik") as string;
  const tanggalLahir = formData.get("tanggalLahir") as string;
  const noTelepon = formData.get("noTelepon") as string;
  const email = formData.get("email") as string;
  const alamat = formData.get("alamat") as string;
  const jenisBank = formData.get("jenisBank") as string;
  const noRekening = formData.get("noRekening") as string;

  // Validate fields (password is optional for update)
  const updateUserSchema = userFormSchema.omit({ password: true });
  const parsed = updateUserSchema.safeParse({
    name,
    username,
    role,
    status,
    nik: nik || null,
    tanggalLahir: tanggalLahir || null,
    noTelepon: noTelepon || null,
    email: email || null,
    alamat: alamat || null,
    jenisBank: jenisBank || null,
    noRekening: noRekening || null,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    // Check if username is taken by another user
    const existingUser = await db.query.nasabah.findFirst({
      where: eq(nasabah.username, parsed.data.username),
    });

    if (existingUser && existingUser.id !== id) {
      return {
        success: false,
        errors: { username: ["Username sudah digunakan oleh user lain"] },
      };
    }

    let hashedPassword: string | undefined;
    if (password && password.trim() !== "") {
      hashedPassword = await argon2.hash(password);
    }

    // Update user langsung
    await db
      .update(nasabah)
      .set({
        ...parsed.data,
        ...(hashedPassword ? { password: hashedPassword } : {}),
        updatedAt: new Date(),
      })
      .where(eq(nasabah.id, id));
  } catch (error) {
    console.error("Error updating nasabah:", error);
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/nasabah");
  return { success: true };
}

export async function deleteNasabah(id: number): Promise<ActionState> {
  if (!(await verifyIsSuperadmin())) {
    return {
      success: false,
      errors: {
        _form: ["Akses ditolak. Hanya Superadmin yang dapat menghapus data."],
      },
    };
  }
  try {
    await db.delete(nasabah).where(eq(nasabah.id, id));

    revalidatePath("/nasabah");
    return { success: true };
  } catch (error) {
    console.error("Error deleting nasabah:", error);
    return {
      success: false,
      errors: { _form: ["Gagal menghapus data nasabah"] },
    };
  }
}
