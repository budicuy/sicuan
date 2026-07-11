"use server";

import argon2 from "argon2";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifyIsSuperadmin } from "@/app/lib/auth-actions";
import type { ActionState } from "@/app/types";
import { db } from "@/db";
import { nasabah, users } from "@/db/schema";

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
        ilike(users.username, `%${search}%`),
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
          | "warmindo"
          | "bank-sampah",
      ),
    );
  }

  const queryCondition =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Count query joining users and nasabah
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .innerJoin(nasabah, eq(users.id, nasabah.id))
    .where(queryCondition);
  const total = Number(countRes[0]?.count ?? 0);

  // Dynamic sorting
  let orderColumn = sortOrder === "desc" ? desc(users.id) : asc(users.id);
  if (sortBy === "name") {
    orderColumn = sortOrder === "desc" ? desc(users.name) : asc(users.name);
  } else if (sortBy === "username") {
    orderColumn =
      sortOrder === "desc" ? desc(users.username) : asc(users.username);
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

  // Data query - inner join users and nasabah
  const data = await db
    .select({
      id: users.id,
      userId: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
      status: users.status,
      nik: nasabah.nik,
      tanggalLahir: nasabah.tanggalLahir,
      noTelepon: nasabah.noTelepon,
      email: nasabah.email,
      alamat: nasabah.alamat,
      jenisBank: nasabah.jenisBank,
      noRekening: nasabah.noRekening,
      poin: nasabah.poin,
    })
    .from(users)
    .innerJoin(nasabah, eq(users.id, nasabah.id))
    .where(queryCondition)
    .orderBy(orderColumn)
    .limit(limit)
    .offset(offset);

  // Map to frontend-friendly nested structure
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
const userFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Nama lengkap minimal 2 karakter" })
    .trim(),
  username: z
    .string()
    .min(3, { message: "Username minimal 3 karakter" })
    .trim(),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
  role: z.enum(["superadmin", "admin", "konsumen", "warmindo", "bank-sampah"]),
  status: z.enum(["Aktif", "Nonaktif"]).default("Aktif"),
  nik: z.string().nullable().optional(),
  tanggalLahir: z.string().nullable().optional(),
  noTelepon: z.string().nullable().optional(),
  email: z
    .string()
    .email({ message: "Format email tidak valid" })
    .nullable()
    .optional()
    .or(z.literal("")),
  alamat: z.string().nullable().optional(),
  jenisBank: z.string().nullable().optional(),
  noRekening: z.string().nullable().optional(),
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
    | "warmindo"
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
    // Check if username already exists in users table
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, parsed.data.username),
    });

    if (existingUser) {
      return {
        success: false,
        errors: { username: ["Username sudah terdaftar di sistem"] },
      };
    }

    // Hash password
    const hashedPassword = await argon2.hash(parsed.data.password);

    // Insert user and profile using a transaction
    await db.transaction(async (tx) => {
      const [usr] = await tx
        .insert(users)
        .values({
          name: parsed.data.name,
          username: parsed.data.username,
          password: hashedPassword,
          email: parsed.data.email || null,
          role: parsed.data.role,
          status: parsed.data.status as any,
        })
        .returning();

      if (!usr) {
        throw new Error("Gagal membuat user");
      }

      await tx.insert(nasabah).values({
        id: usr.id,
        name: parsed.data.name,
        username: parsed.data.username,
        role: parsed.data.role,
        status: parsed.data.status as any,
        nik: parsed.data.nik,
        tanggalLahir: parsed.data.tanggalLahir,
        noTelepon: parsed.data.noTelepon,
        email: parsed.data.email,
        alamat: parsed.data.alamat,
        jenisBank: parsed.data.jenisBank,
        noRekening: parsed.data.noRekening,
        poin: parsed.data.role === "konsumen" ? 0 : null,
      });
    });
  } catch (error) {
    console.error("Error creating nasabah:", error);
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/nasabah");
  return { success: true };
}

export async function updateNasabah(
  id: number,
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
    | "warmindo"
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
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, parsed.data.username),
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

    // Update user and profile using a transaction
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          name: parsed.data.name,
          username: parsed.data.username,
          email: parsed.data.email || null,
          role: parsed.data.role,
          status: parsed.data.status as any,
          ...(hashedPassword ? { password: hashedPassword } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));

      await tx
        .update(nasabah)
        .set({
          name: parsed.data.name,
          username: parsed.data.username,
          role: parsed.data.role,
          status: parsed.data.status as any,
          nik: parsed.data.nik,
          tanggalLahir: parsed.data.tanggalLahir,
          noTelepon: parsed.data.noTelepon,
          email: parsed.data.email,
          alamat: parsed.data.alamat,
          jenisBank: parsed.data.jenisBank,
          noRekening: parsed.data.noRekening,
          updatedAt: new Date(),
        })
        .where(eq(nasabah.id, id));
    });
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
    // Deleting user will cascade delete nasabah profile
    await db.delete(users).where(eq(users.id, id));

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
