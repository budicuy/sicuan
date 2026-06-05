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
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  nik: z
    .string()
    .min(16, "NIK harus 16 digit")
    .max(16)
    .or(z.string().length(0))
    .nullable(),
  tanggalLahir: z.string().or(z.string().length(0)).nullable(),
  noTelepon: z
    .string()
    .min(10, "No telepon minimal 10 digit")
    .or(z.string().length(0))
    .nullable(),
  alamat: z
    .string()
    .min(5, "Alamat minimal 5 karakter")
    .or(z.string().length(0))
    .nullable(),
  jenisBank: z.string().or(z.string().length(0)).nullable(),
  noRekening: z.string().or(z.string().length(0)).nullable(),
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

export type ActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

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

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error("User tidak ditemukan");
    }

    let profile = await db.query.nasabah.findFirst({
      where: eq(nasabah.userId, userId),
    });

    // If profile doesn't exist, create an empty one
    if (!profile) {
      const inserted = await db
        .insert(nasabah)
        .values({
          userId: userId,
        })
        .returning();
      profile = inserted[0];
    }

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        status: user.status,
        nik: profile?.nik || "",
        tanggalLahir: profile?.tanggalLahir || "",
        noTelepon: profile?.noTelepon || "",
        alamat: profile?.alamat || "",
        jenisBank: profile?.jenisBank || "",
        noRekening: profile?.noRekening || "",
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
    };

    const parsed = profileSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validasi form gagal",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    // 1. Update user name
    await db
      .update(users)
      .set({
        name: parsed.data.name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 2. Update/Insert nasabah profile
    const existingProfile = await db.query.nasabah.findFirst({
      where: eq(nasabah.userId, userId),
    });

    if (existingProfile) {
      await db
        .update(nasabah)
        .set({
          nik: parsed.data.nik,
          tanggalLahir: parsed.data.tanggalLahir,
          noTelepon: parsed.data.noTelepon,
          alamat: parsed.data.alamat,
          jenisBank: parsed.data.jenisBank,
          noRekening: parsed.data.noRekening,
          updatedAt: new Date(),
        })
        .where(eq(nasabah.userId, userId));
    } else {
      await db.insert(nasabah).values({
        userId,
        nik: parsed.data.nik,
        tanggalLahir: parsed.data.tanggalLahir,
        noTelepon: parsed.data.noTelepon,
        alamat: parsed.data.alamat,
        jenisBank: parsed.data.jenisBank,
        noRekening: parsed.data.noRekening,
      });
    }

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
