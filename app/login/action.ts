"use server";

import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { nasabah } from "@/db/schema";

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

function dateMatches(input: string, stored: string): boolean {
  const cleanedInput = input.trim().replace(/-/g, "/");
  const cleanedStored = stored.trim().replace(/-/g, "/");

  if (cleanedInput === cleanedStored) return true;

  const storedParts = cleanedStored.split("/");
  if (storedParts.length !== 3) return false;

  // stored is YYYY/MM/DD
  const storedYear = parseInt(storedParts[0], 10);
  const storedMonth = parseInt(storedParts[1], 10);
  const storedDay = parseInt(storedParts[2], 10);

  // Check format: DDMMYY (e.g. 240368 or 020302)
  if (/^\d{6}$/.test(cleanedInput)) {
    const day = parseInt(cleanedInput.substring(0, 2), 10);
    const month = parseInt(cleanedInput.substring(2, 4), 10);
    const year2D = parseInt(cleanedInput.substring(4, 6), 10);

    if (
      day === storedDay &&
      month === storedMonth &&
      year2D === storedYear % 100
    ) {
      return true;
    }
  }

  const inputParts = cleanedInput.split("/");
  if (inputParts.length !== 3) return false;

  const p0 = parseInt(inputParts[0], 10);
  const p1 = parseInt(inputParts[1], 10);
  const p2 = parseInt(inputParts[2], 10);

  if (Number.isNaN(p0) || Number.isNaN(p1) || Number.isNaN(p2)) return false;

  // check Format A: DD/MM/YYYY or MM/DD/YYYY
  if (p2 > 1000) {
    if (p0 === storedDay && p1 === storedMonth && p2 === storedYear)
      return true;
    if (p0 === storedMonth && p1 === storedDay && p2 === storedYear)
      return true;
  }

  // check Format B: YYYY/MM/DD
  if (p0 > 1000) {
    if (p0 === storedYear && p1 === storedMonth && p2 === storedDay)
      return true;
    if (p0 === storedYear && p1 === storedDay && p2 === storedMonth)
      return true;
  }

  return false;
}

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
    let user = null;
    let isNasabahAuth = false;

    // 1. Check if username is a NIK in nasabah table directly
    const userRecords = await db
      .select()
      .from(nasabah)
      .where(eq(nasabah.nik, username.trim()))
      .limit(1);

    if (userRecords.length > 0) {
      const potentialUser = userRecords[0];
      const storedBirthdate = potentialUser.tanggalLahir;
      if (storedBirthdate && dateMatches(password, storedBirthdate)) {
        user = potentialUser;
        isNasabahAuth = true;
      }
    }

    // 2. Fallback: standard username + password login
    if (!isNasabahAuth) {
      const userRecords = await db
        .select()
        .from(nasabah)
        .where(eq(nasabah.username, username.trim()))
        .limit(1);

      if (userRecords.length > 0) {
        const potentialUser = userRecords[0];
        const passwordMatch = await argon2.verify(
          potentialUser.password,
          password,
        );
        if (passwordMatch) {
          user = potentialUser;
        }
      }
    }

    if (!user) {
      return {
        success: false,
        error: "NIK/Username atau Tanggal Lahir/Password salah",
      };
    }

    // 3. Check if user is active
    if (user.status !== "Aktif") {
      return {
        success: false,
        error: "Akun Anda dinonaktifkan. Silakan hubungi admin.",
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
