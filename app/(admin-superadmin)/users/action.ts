"use server";

import argon2 from "argon2";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { insertUserSchema, users } from "@/db/schema";

export type ActionState = {
  success: boolean;
  errors?: Record<string, string[]>;
};

export async function getUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const offset = (page - 1) * limit;
  const search = params?.search ?? "";
  const role = params?.role ?? "";
  const status = params?.status ?? "";
  const sortBy = params?.sortBy ?? "id";
  const sortOrder = params?.sortOrder ?? "desc";

  const whereConditions = [];

  if (search) {
    whereConditions.push(
      or(
        ilike(users.name, `%${search}%`),
        ilike(users.username, `%${search}%`),
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

  if (status) {
    whereConditions.push(eq(users.status, status));
  }

  const queryCondition =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Get total count
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(queryCondition);
  const total = Number(countRes[0]?.count ?? 0);

  // Dynamic sorting
  let orderColumn = sortOrder === "desc" ? desc(users.id) : asc(users.id);
  if (sortBy === "name") {
    orderColumn = sortOrder === "desc" ? desc(users.name) : asc(users.name);
  } else if (sortBy === "username") {
    orderColumn =
      sortOrder === "desc" ? desc(users.username) : asc(users.username);
  } else if (sortBy === "role") {
    orderColumn = sortOrder === "desc" ? desc(users.role) : asc(users.role);
  } else if (sortBy === "status") {
    orderColumn = sortOrder === "desc" ? desc(users.status) : asc(users.status);
  }

  // Get data
  const data = await db
    .select()
    .from(users)
    .where(queryCondition)
    .orderBy(orderColumn)
    .limit(limit)
    .offset(offset);

  return { data, total };
}

// Form schema for validation
const userFormSchema = insertUserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export async function createUser(
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

  const parsed = userFormSchema.safeParse({
    name,
    username,
    password,
    role,
    status,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    // Check if username already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.username, parsed.data.username),
    });

    if (existing) {
      return {
        success: false,
        errors: { username: ["Username sudah terdaftar di sistem"] },
      };
    }

    // Hash password
    const hashedPassword = await argon2.hash(parsed.data.password);

    await db.insert(users).values({
      ...parsed.data,
      password: hashedPassword,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function updateUser(
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
    | "warmiendo"
    | "bank-sampah";
  const status = formData.get("status") as string;

  // For update, password can be optional if not changed
  const dataToUpdate = { name, username, role, status };

  // Validate fields except password if it's empty
  const updateSchema = userFormSchema.omit({ password: true });
  const parsed = updateSchema.safeParse(dataToUpdate);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    // Check if username is taken by another user
    const existing = await db.query.users.findFirst({
      where: eq(users.username, parsed.data.username),
    });

    if (existing && existing.id !== id) {
      return {
        success: false,
        errors: { username: ["Username sudah digunakan oleh user lain"] },
      };
    }

    let hashedPassword: string | undefined;
    if (password && password.trim() !== "") {
      hashedPassword = await argon2.hash(password);
    }

    await db
      .update(users)
      .set({
        ...parsed.data,
        ...(hashedPassword ? { password: hashedPassword } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, errors: { _form: ["Terjadi kesalahan server"] } };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function deleteUser(id: number): Promise<ActionState> {
  try {
    await db.delete(users).where(eq(users.id, id));
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, errors: { _form: ["Gagal menghapus user"] } };
  }
}
