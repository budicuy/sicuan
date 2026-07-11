"use server";

import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { nasabah, users } from "@/db/schema";

const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100)
    .transform((v) => v.trim()),
  nik: z
    .string()
    .nullable()
    .transform((val) => (val ? val.trim() : ""))
    .refine((val) => val === "" || /^\d{16}$/.test(val), {
      message: "NIK harus berupa 16 digit angka",
    })
    .transform((val) => (val === "" ? null : val)),
  tanggalLahir: z
    .string()
    .nullable()
    .transform((val) => (val ? val.trim() : ""))
    .transform((val) => (val === "" ? null : val)),
  noTelepon: z
    .string()
    .nullable()
    .transform((val) => (val ? val.trim() : ""))
    .refine((val) => val === "" || /^\d{10,15}$/.test(val), {
      message: "Nomor telepon harus berupa 10 hingga 15 digit angka",
    })
    .transform((val) => (val === "" ? null : val)),
  alamat: z
    .string()
    .nullable()
    .transform((val) => (val ? val.trim() : ""))
    .refine((val) => val === "" || val.length >= 5, {
      message: "Alamat minimal 5 karakter",
    })
    .transform((val) => (val === "" ? null : val)),
  jenisBank: z
    .string()
    .nullable()
    .transform((val) => (val ? val.trim() : ""))
    .transform((val) => (val === "" ? null : val)),
  noRekening: z
    .string()
    .nullable()
    .transform((val) => (val ? val.trim() : ""))
    .transform((val) => (val === "" ? null : val)),
  email: z
    .string()
    .nullable()
    .transform((val) => (val ? val.trim() : ""))
    .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Format email tidak valid",
    })
    .transform((val) => (val === "" ? null : val)),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Password lama wajib diisi"),
    newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password baru wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

import type { ActionState } from "@/app/types";

// Helper function to get the current authenticated user's ID
async function getAuthenticatedUserId(): Promise<number> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) throw new Error("Unauthorized");

  const decoded = decodeJwt(token) as { id: number };
  return decoded.id;
}

// Fetch user profile and nasabah details
export async function getProfileData() {
  try {
    const userId = await getAuthenticatedUserId();

    const [profileData] = await db
      .select({
        id: nasabah.id,
        name: users.name,
        username: users.username,
        role: users.role,
        status: users.status,
        email: users.email,
        nik: nasabah.nik,
        tanggalLahir: nasabah.tanggalLahir,
        noTelepon: nasabah.noTelepon,
        alamat: nasabah.alamat,
        jenisBank: nasabah.jenisBank,
        noRekening: nasabah.noRekening,
      })
      .from(users)
      .innerJoin(nasabah, eq(nasabah.id, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!profileData) {
      throw new Error("User tidak ditemukan");
    }

    return {
      success: true,
      data: {
        id: profileData.id,
        name: profileData.name,
        username: profileData.username,
        role: profileData.role,
        status: profileData.status,
        nik: profileData.nik || "",
        tanggalLahir: profileData.tanggalLahir || "",
        noTelepon: profileData.noTelepon || "",
        alamat: profileData.alamat || "",
        jenisBank: profileData.jenisBank || "",
        noRekening: profileData.noRekening || "",
        email: profileData.email || "",
      },
    };
  } catch (error) {
    console.error("Error in getProfileData:", error);
    return {
      success: false,
      message: "Gagal mengambil data profil",
    };
  }
}

// Update profile details
export async function updateProfileData(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const userId = await getAuthenticatedUserId();

    const rawData = {
      name: formData.get("name") as string,
      nik: (formData.get("nik") as string) || null,
      tanggalLahir: (formData.get("tanggalLahir") as string) || null,
      noTelepon: (formData.get("noTelepon") as string) || null,
      alamat: (formData.get("alamat") as string) || null,
      jenisBank: (formData.get("jenisBank") as string) || null,
      noRekening: (formData.get("noRekening") as string) || null,
      email: (formData.get("email") as string) || null,
    };

    const parsed = profileSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validasi form gagal",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          name: parsed.data.name,
          email: parsed.data.email || null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      await tx
        .update(nasabah)
        .set({
          name: parsed.data.name,
          nik: parsed.data.nik,
          tanggalLahir: parsed.data.tanggalLahir,
          noTelepon: parsed.data.noTelepon,
          alamat: parsed.data.alamat,
          jenisBank: parsed.data.jenisBank,
          noRekening: parsed.data.noRekening,
          email: parsed.data.email,
          updatedAt: new Date(),
        })
        .where(eq(nasabah.id, userId));
    });

    revalidatePath("/dashboard/profil");
    return {
      success: true,
      message: "Profil berhasil diperbarui",
    };
  } catch (error) {
    console.error("Error in updateProfileData:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat memperbarui profil",
    };
  }
}

// Update password
export async function updatePassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const userId = await getAuthenticatedUserId();

    const rawData = {
      oldPassword: formData.get("oldPassword") as string,
      newPassword: formData.get("newPassword") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const parsed = passwordSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validasi password gagal",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    // Get current user from db to verify old password
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return {
        success: false,
        message: "User tidak ditemukan",
      };
    }

    // Verify old password
    const passwordMatch = await argon2.verify(
      user.password,
      parsed.data.oldPassword,
    );
    if (!passwordMatch) {
      return {
        success: false,
        message: "Password lama tidak sesuai",
        errors: {
          oldPassword: ["Password lama tidak sesuai"],
        },
      };
    }

    // Hash new password
    const hashedPassword = await argon2.hash(parsed.data.newPassword);

    // Update in database
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return {
      success: true,
      message: "Password berhasil diperbarui",
    };
  } catch (error) {
    console.error("Error in updatePassword:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat memperbarui password",
    };
  }
}
