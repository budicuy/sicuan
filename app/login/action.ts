"use server";

import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "../../db";
import { users } from "../../db/schema";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username wajib diisi" }).trim(),
  password: z.string().min(1, { message: "Password wajib diisi" }),
});

async function signToken(payload: {
  id: number;
  username: string;
  name: string;
  role: string;
}) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export type ActionState = {
  success: boolean;
  error?: string;
  user?: {
    name: string;
    username: string;
    role: string;
  };
};

export async function loginAction(
  _prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const validation = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!validation.success) {
    const firstError =
      validation.error.issues[0]?.message || "Input tidak valid";
    return {
      success: false,
      error: firstError,
    };
  }

  const { username, password } = validation.data;

  try {
    // 1. Fetch user from database
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.username, username.trim()))
      .limit(1);

    if (userRecords.length === 0) {
      return {
        success: false,
        error: "Username atau password salah",
      };
    }

    const user = userRecords[0];

    // 2. Check if user is active
    if (user.status !== "Aktif") {
      return {
        success: false,
        error: "Akun Anda dinonaktifkan. Silakan hubungi admin.",
      };
    }

    // 3. Verify password using argon2
    const passwordMatch = await argon2.verify(user.password, password);
    if (!passwordMatch) {
      return {
        success: false,
        error: "Username atau password salah",
      };
    }

    // 4. Generate JWT token
    const token = await signToken({
      id: Number(user.id),
      username: user.username,
      name: user.name,
      role: user.role,
    });

    // 5. Store in HTTP-Only cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return {
      success: true,
      user: {
        name: user.name,
        username: user.username,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Login Server Action Error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan sistem. Silakan coba lagi nanti.",
    };
  }
}


