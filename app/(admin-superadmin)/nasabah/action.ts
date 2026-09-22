"use server";

import argon2 from "argon2";
import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser, verifyIsSuperadmin } from "@/app/lib/auth-actions";
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

    // Check if NIK already exists in nasabah table (if filled)
    if (parsed.data.nik && parsed.data.nik.trim() !== "") {
      const existingNik = await db.query.nasabah.findFirst({
        where: eq(nasabah.nik, parsed.data.nik.trim()),
      });
      if (existingNik) {
        return {
          success: false,
          errors: { nik: ["NIK sudah terdaftar di sistem"] },
        };
      }
    }

    // Check if Email already exists in users table (if filled)
    if (parsed.data.email && parsed.data.email.trim() !== "") {
      const emailLower = parsed.data.email.trim().toLowerCase();
      const existingEmail = await db.query.users.findFirst({
        where: eq(users.email, emailLower),
      });
      if (existingEmail) {
        return {
          success: false,
          errors: { email: ["Email sudah terdaftar di sistem"] },
        };
      }
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
          status: parsed.data.status as "Aktif" | "Nonaktif",
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
        status: parsed.data.status as "Aktif" | "Nonaktif",
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

    // Check if NIK is taken by another nasabah
    if (parsed.data.nik && parsed.data.nik.trim() !== "") {
      const existingNik = await db.query.nasabah.findFirst({
        where: and(eq(nasabah.nik, parsed.data.nik.trim()), ne(nasabah.id, id)),
      });
      if (existingNik) {
        return {
          success: false,
          errors: { nik: ["NIK sudah digunakan oleh nasabah lain"] },
        };
      }
    }

    // Check if Email is taken by another user
    if (parsed.data.email && parsed.data.email.trim() !== "") {
      const emailLower = parsed.data.email.trim().toLowerCase();
      const existingEmail = await db.query.users.findFirst({
        where: and(eq(users.email, emailLower), ne(users.id, id)),
      });
      if (existingEmail) {
        return {
          success: false,
          errors: { email: ["Email sudah digunakan oleh user lain"] },
        };
      }
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
          status: parsed.data.status as "Aktif" | "Nonaktif",
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
          status: parsed.data.status as "Aktif" | "Nonaktif",
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

export async function bulkDeleteNasabah(ids: number[]): Promise<ActionState> {
  if (!(await verifyIsSuperadmin())) {
    return {
      success: false,
      errors: {
        _form: ["Akses ditolak. Hanya Superadmin yang dapat menghapus data."],
      },
    };
  }

  if (!ids || ids.length === 0) {
    return {
      success: false,
      errors: {
        _form: ["Tidak ada data nasabah yang dipilih untuk dihapus."],
      },
    };
  }

  try {
    const currentUser = await getCurrentUser();
    // Cegah user superadmin menghapus dirinya sendiri jika tidak sengaja terpilih
    const validIds = currentUser
      ? ids.filter((id) => id !== currentUser.id)
      : ids;

    if (validIds.length === 0) {
      return {
        success: false,
        errors: {
          _form: ["Anda tidak dapat menghapus akun Anda sendiri."],
        },
      };
    }

    // Deleting users will cascade delete nasabah profiles
    await db.delete(users).where(inArray(users.id, validIds));

    revalidatePath("/nasabah");
    return { success: true };
  } catch (error) {
    console.error("Error bulk deleting nasabah:", error);
    return {
      success: false,
      errors: { _form: ["Gagal menghapus data nasabah yang dipilih"] },
    };
  }
}

/**
 * Mengambil seluruh data nasabah untuk diekspor (tanpa batas paginasi).
 */
export async function getAllNasabahForExport(params?: {
  search?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
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
    .orderBy(orderColumn);

  return data.map((d) => ({
    id: d.id,
    userId: d.userId,
    nik: d.nik,
    tanggalLahir: d.tanggalLahir,
    noTelepon: d.noTelepon,
    email: d.email,
    alamat: d.alamat,
    jenisBank: d.jenisBank,
    noRekening: d.noRekening,
    poin: d.poin ?? 0,
    user: {
      name: d.name,
      username: d.username,
      role: d.role,
      status: d.status,
    },
  }));
}

export interface ImportBatchResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: {
    rowNumber: number;
    username: string;
    name: string;
    reason: string;
  }[];
}

/**
 * Mengimpor baris data nasabah hasil parsing Excel secara massal.
 */
export async function importNasabahBatch(
  records: {
    rowNumber: number;
    name: string;
    username: string;
    password?: string;
    role: string;
    status: string;
    nik?: string;
    tanggalLahir?: string;
    noTelepon?: string;
    email?: string;
    jenisBank?: string;
    noRekening?: string;
    alamat?: string;
  }[],
): Promise<ImportBatchResult> {
  const result: ImportBatchResult = {
    success: false,
    totalRows: records.length,
    successCount: 0,
    failedCount: 0,
    errors: [],
  };

  if (!records || records.length === 0) {
    return result;
  }

  const seenUsernamesInBatch = new Set<string>();
  const seenNiksInBatch = new Set<string>();
  const seenEmailsInBatch = new Set<string>();

  for (const record of records) {
    const rowNum = record.rowNumber;
    const name = record.name?.trim() || "";
    const username = record.username?.trim().toLowerCase() || "";
    const password = record.password?.trim() || "";
    const role = record.role?.trim().toLowerCase();
    const status = record.status === "Nonaktif" ? "Nonaktif" : "Aktif";
    const cleanNik = record.nik?.trim() || "";
    const cleanEmail = record.email?.trim().toLowerCase() || "";

    // Validasi field wajib
    if (!name || name.length < 2) {
      result.failedCount++;
      result.errors.push({
        rowNumber: rowNum,
        username: username || "-",
        name: name || "-",
        reason: "Nama lengkap wajib diisi minimal 2 karakter.",
      });
      continue;
    }

    if (!username || username.length < 3) {
      result.failedCount++;
      result.errors.push({
        rowNumber: rowNum,
        username: username || "-",
        name,
        reason: "Username wajib diisi minimal 3 karakter.",
      });
      continue;
    }

    if (!password || password.length < 6) {
      result.failedCount++;
      result.errors.push({
        rowNumber: rowNum,
        username,
        name,
        reason: "Password wajib diisi minimal 6 karakter.",
      });
      continue;
    }

    const validRoles = [
      "superadmin",
      "admin",
      "konsumen",
      "warmindo",
      "bank-sampah",
    ];
    if (!validRoles.includes(role)) {
      result.failedCount++;
      result.errors.push({
        rowNumber: rowNum,
        username,
        name,
        reason: `Role '${role}' tidak valid. Pilihan role: konsumen, warmindo, bank-sampah, admin, superadmin.`,
      });
      continue;
    }

    // Validasi email jika diisi
    if (cleanEmail !== "") {
      const emailParsed = z.string().email().safeParse(cleanEmail);
      if (!emailParsed.success) {
        result.failedCount++;
        result.errors.push({
          rowNumber: rowNum,
          username,
          name,
          reason: `Format email '${record.email}' tidak valid.`,
        });
        continue;
      }
    }

    // Cek duplikasi di dalam batch file CSV itu sendiri
    if (seenUsernamesInBatch.has(username)) {
      result.failedCount++;
      result.errors.push({
        rowNumber: rowNum,
        username,
        name,
        reason: `Username '${username}' duplikat di dalam file CSV.`,
      });
      continue;
    }

    if (cleanNik && seenNiksInBatch.has(cleanNik)) {
      result.failedCount++;
      result.errors.push({
        rowNumber: rowNum,
        username,
        name,
        reason: `NIK '${cleanNik}' duplikat di dalam file CSV.`,
      });
      continue;
    }

    if (cleanEmail && seenEmailsInBatch.has(cleanEmail)) {
      result.failedCount++;
      result.errors.push({
        rowNumber: rowNum,
        username,
        name,
        reason: `Email '${cleanEmail}' duplikat di dalam file CSV.`,
      });
      continue;
    }

    // Cek duplikasi username, NIK, dan email di database
    try {
      const existing = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (existing) {
        result.failedCount++;
        result.errors.push({
          rowNumber: rowNum,
          username,
          name,
          reason: `Username '${username}' sudah terdaftar di sistem.`,
        });
        continue;
      }

      if (cleanNik) {
        const existingNik = await db.query.nasabah.findFirst({
          where: eq(nasabah.nik, cleanNik),
        });
        if (existingNik) {
          result.failedCount++;
          result.errors.push({
            rowNumber: rowNum,
            username,
            name,
            reason: `NIK '${cleanNik}' sudah terdaftar di sistem.`,
          });
          continue;
        }
      }

      if (cleanEmail) {
        const existingEmail = await db.query.users.findFirst({
          where: eq(users.email, cleanEmail),
        });
        if (existingEmail) {
          result.failedCount++;
          result.errors.push({
            rowNumber: rowNum,
            username,
            name,
            reason: `Email '${cleanEmail}' sudah terdaftar di sistem.`,
          });
          continue;
        }
      }

      // Hash password dengan argon2
      const hashedPassword = await argon2.hash(password);

      // Simpan user dan profil nasabah ke database
      await db.transaction(async (tx) => {
        const [usr] = await tx
          .insert(users)
          .values({
            name,
            username,
            password: hashedPassword,
            email: cleanEmail || null,
            role: role as
              | "superadmin"
              | "admin"
              | "konsumen"
              | "warmindo"
              | "bank-sampah",
            status: status as "Aktif" | "Nonaktif",
          })
          .returning();

        if (!usr) {
          throw new Error("Gagal membuat user");
        }

        await tx.insert(nasabah).values({
          id: usr.id,
          name,
          username,
          role: role as
            | "superadmin"
            | "admin"
            | "konsumen"
            | "warmindo"
            | "bank-sampah",
          status: status as "Aktif" | "Nonaktif",
          nik: cleanNik || null,
          tanggalLahir: record.tanggalLahir || null,
          noTelepon: record.noTelepon || null,
          email: cleanEmail || null,
          alamat: record.alamat || null,
          jenisBank: record.jenisBank || null,
          noRekening: record.noRekening || null,
          poin: role === "konsumen" ? 0 : null,
        });
      });

      seenUsernamesInBatch.add(username);
      if (cleanNik) seenNiksInBatch.add(cleanNik);
      if (cleanEmail) seenEmailsInBatch.add(cleanEmail);
      result.successCount++;
    } catch (err) {
      console.error(`Gagal menyimpan baris ${rowNum}:`, err);
      result.failedCount++;
      result.errors.push({
        rowNumber: rowNum,
        username,
        name,
        reason: `Gagal menyimpan ke database: ${String(err)}`,
      });
    }
  }

  if (result.successCount > 0) {
    result.success = true;
    revalidatePath("/nasabah");
  }

  return result;
}
