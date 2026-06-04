import argon2 from "argon2";
import { db } from "../index";
import { users } from "../schema";

export async function seedUsers() {
  console.log("🌱 Seeding users...");

  const data = [
    {
      name: "Superadmin Sicuan",
      username: "superadmin.sicuan",
      password: await argon2.hash("PasswordSuper123"),
      role: "superadmin" as const,
      status: "Aktif",
    },
    {
      name: "Admin Banjarmasin",
      username: "admin.banjarmasin",
      password: await argon2.hash("PasswordAdmin456"),
      role: "admin" as const,
      status: "Aktif",
    },
    {
      name: "Budi Santoso",
      username: "budi.santoso",
      password: await argon2.hash("BudiSetorSampah88"),
      role: "konsumen" as const,
      status: "Aktif",
    },
    {
      name: "Warmiendo Ipul",
      username: "warmiendo.ipul",
      password: await argon2.hash("WarmindoBerkah77"),
      role: "warmiendo" as const,
      status: "Aktif",
    },
    {
      name: "TPS Banjarmasin",
      username: "tps.banjarmasin",
      password: await argon2.hash("BankSampahPeduli99"),
      role: "bank-sampah" as const,
      status: "Aktif",
    },
  ];

  await db.insert(users).values(data).onConflictDoNothing();

  console.log(`✅ Seeded ${data.length} users`);
}
