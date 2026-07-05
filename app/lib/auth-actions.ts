"use server";

import { decodeJwt } from "jose";
import { cookies } from "next/headers";

export interface UserSession {
  id: number;
  username: string;
  name: string;
  role: string;
}

export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;

    return decodeJwt(token) as UserSession;
  } catch (error) {
    console.error("Error retrieving user session:", error);
    return null;
  }
}

export async function verifyIsSuperadmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "superadmin";
}
