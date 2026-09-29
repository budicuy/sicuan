"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { sendResetPasswordEmail } from "@/app/lib/email";
import { db } from "@/db";
import { nasabah, users } from "@/db/schema";

export type ForgotPasswordState = {
  success: boolean;
  message?: string;
  error?: string;
  contactAdmin?: boolean;
};

export async function requestResetAction(
  _prevState: ForgotPasswordState | null,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const method = formData.get("method") as string; // "username" | "email"
  const value = ((formData.get("value") as string) || "").trim();

  if (!value) {
    return {
      success: false,
      error: "Masukkan data yang diperlukan.",
    };
  }

  try {
    let userRecord = null;

    if (method === "username") {
      // 1. Coba cari berdasarkan NIK di tabel nasabah terlebih dahulu
      const nasabahRecord = await db.query.nasabah.findFirst({
        where: eq(nasabah.nik, value),
      });

      if (nasabahRecord) {
        userRecord = await db.query.users.findFirst({
          where: eq(users.id, nasabahRecord.id),
        });
      }

      // 2. Jika tidak ditemukan lewat NIK, coba cari berdasarkan username
      if (!userRecord) {
        userRecord = await db.query.users.findFirst({
          where: eq(users.username, value),
        });
      }

      if (!userRecord) {
        return {
          success: false,
          error: "NIK atau Username tidak ditemukan.",
        };
      }

      if (!userRecord.email || userRecord.email.trim() === "") {
        return {
          success: false,
          contactAdmin: true,
          message:
            "Email belum di-set pada akun Anda. Silakan hubungi admin untuk melakukan reset password.",
        };
      }
    } else if (method === "email") {
      userRecord = await db.query.users.findFirst({
        where: eq(users.email, value),
      });

      if (!userRecord) {
        return {
          success: false,
          error: "Email tidak ditemukan.",
        };
      }
    } else {
      return {
        success: false,
        error: "Metode tidak valid.",
      };
    }

    // Generate random token (32 bytes = 64 characters hex)
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to DB
    await db
      .update(users)
      .set({
        resetToken: token,
        resetTokenExpires: expires,
      })
      .where(eq(users.id, userRecord.id));

    const emailDest = userRecord.email;
    if (!emailDest || emailDest.trim() === "") {
      return {
        success: false,
        error: "Email tidak ditemukan atau belum di-set untuk akun Anda.",
      };
    }

    // Send email
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "http";
    const resetLink = `${protocol}://${host}/reset-password?token=${token}`;

    await sendResetPasswordEmail({
      email: emailDest,
      name: userRecord.name,
      resetLink,
    });

    // Mask email for display
    const emailParts = emailDest.split("@");
    const maskedEmail = `${emailParts[0].substring(0, 3)}***@${emailParts[1]}`;

    return {
      success: true,
      message: `Link reset password telah dikirim ke email Anda (${maskedEmail}). Silakan periksa kotak masuk atau spam email Anda.`,
    };
  } catch (error) {
    console.error("Gagal melakukan permintaan reset password:", error);
    return {
      success: false,
      error: "Terjadi kesalahan server. Silakan coba lagi nanti.",
    };
  }
}
