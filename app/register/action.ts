"use server";

import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { nasabah } from "@/db/schema";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Nama lengkap minimal 2 karakter" })
    .trim(),
  username: z
    .string()
    .min(3, { message: "Username minimal 3 karakter" })
    .regex(/^[a-zA-Z0-9._-]+$/, {
      message:
        "Username hanya boleh mengandung huruf, angka, titik, underscore, dan hyphen",
    })
    .trim(),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
  role: z.enum(["konsumen", "warmiendo", "bank-sampah"]),
  nik: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  email: z
    .unknown()
    .refine((val) => typeof val === "string" && val.trim() !== "", {
      message: "Email wajib diisi",
    })
    .transform((val) => val as string)
    .refine((val) => z.string().email().safeParse(val).success, {
      message: "Format email tidak valid",
    })
    .transform((val) => val.trim()),
  noTelepon: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
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
  errors?: Record<string, string[]>;
  user?: {
    name: string;
    username: string;
    role: string;
  };
};

export async function registerAction(
  _prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const validation = registerSchema.safeParse({
    name: formData.get("name") as string,
    username: formData.get("username") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
    nik: (formData.get("nik") as string) || null,
    email: (formData.get("email") as string) || undefined,
    noTelepon: (formData.get("noTelepon") as string) || null,
  });

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors)[0]?.[0] || "Validasi gagal";
    return {
      success: false,
      error: firstError,
      errors: fieldErrors as Record<string, string[]>,
    };
  }

  const { name, username, password, role, nik, email, noTelepon } =
    validation.data;

  try {
    // 1. Check if username already exists
    const existingUser = await db.query.nasabah.findFirst({
      where: eq(nasabah.username, username.toLowerCase()),
    });

    if (existingUser) {
      return {
        success: false,
        error: "Username sudah terdaftar di sistem",
        errors: { username: ["Username sudah terdaftar di sistem"] },
      };
    }

    // 2. Check if NIK already exists (if provided)
    if (nik) {
      const existingNik = await db.query.nasabah.findFirst({
        where: eq(nasabah.nik, nik),
      });

      if (existingNik) {
        return {
          success: false,
          error: "NIK sudah terdaftar di sistem",
          errors: { nik: ["NIK sudah terdaftar di sistem"] },
        };
      }
    }

    // 3. Hash password
    const hashedPassword = await argon2.hash(password);

    // 4. Insert into database
    const [insertedUser] = await db
      .insert(nasabah)
      .values({
        name,
        username: username.toLowerCase(),
        password: hashedPassword,
        role,
        status: "Aktif",
        nik,
        email,
        noTelepon,
        poin: 0,
      })
      .returning();

    if (!insertedUser) {
      return {
        success: false,
        error: "Gagal membuat akun. Silakan coba lagi.",
      };
    }

    // 5. Automatically log in user by creating token
    const token = await signToken({
      id: insertedUser.id,
      username: insertedUser.username,
      name: insertedUser.name,
      role: insertedUser.role,
    });

    // 6. Set auth cookie
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
        name: insertedUser.name,
        username: insertedUser.username,
        role: insertedUser.role,
      },
    };
  } catch (error) {
    console.error("Register Action Server Error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan server. Silakan coba lagi.",
    };
  }
}
