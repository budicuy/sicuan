"use server";

import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export type ResetPasswordState = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function resetPasswordAction(
  token: string | null,
  _prevState: ResetPasswordState | null,
  formData: FormData,
): Promise<ResetPasswordState> {
  if (!token) {
    return {
      success: false,
      error: "Token tidak valid atau tidak ditemukan.",
    };
  }

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return {
      success: false,
      error: "Semua kolom wajib diisi.",
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: "Kata sandi baru minimal harus 6 karakter.",
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: "Konfirmasi kata sandi baru tidak cocok.",
    };
  }

  try {
    // Look up the user with this token
    const userRecord = await db.query.users.findFirst({
      where: eq(users.resetToken, token),
    });

    if (!userRecord) {
      return {
        success: false,
        error: "Link reset password tidak valid atau sudah pernah digunakan.",
      };
    }

    // Check expiration
    if (
      userRecord.resetTokenExpires &&
      userRecord.resetTokenExpires < new Date()
    ) {
      return {
        success: false,
        error: "Link reset password sudah kadaluarsa (batas waktu 1 jam).",
      };
    }

    // Hash the new password
    const hashedPassword = await argon2.hash(password);

    // Update password and invalidate the token (one-time use)
    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userRecord.id));

    return {
      success: true,
      message:
        "Kata sandi Anda berhasil diperbarui. Silakan login kembali dengan kata sandi baru Anda.",
    };
  } catch (error) {
    console.error("Gagal mereset password:", error);
    return {
      success: false,
      error: "Terjadi kesalahan server saat memperbarui kata sandi.",
    };
  }
}
