import fs from "node:fs";
import path from "node:path";
import argon2 from "argon2";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function seedUsers() {
  console.log("🌱 Seeding users from CSV and mandatory users...");

  // Hashing passwords for mandatory users
  const hashSuperadmin = await argon2.hash("PasswordSuper123");
  const hashAdmin = await argon2.hash("PasswordAdmin456");
  const hashBudi = await argon2.hash("BudiSetorSampah88");
  const hashDefault = await argon2.hash("Password123");

  const data = [
    {
      name: "Superadmin Sicuan",
      username: "superadmin.sicuan",
      password: hashSuperadmin,
      role: "superadmin" as const,
      status: "Aktif",
    },
    {
      name: "Admin Banjarmasin",
      username: "admin.banjarmasin",
      password: hashAdmin,
      role: "admin" as const,
      status: "Aktif",
    },
    {
      name: "Budi Santoso",
      username: "budi.santoso",
      password: hashBudi,
      role: "konsumen" as const,
      status: "Aktif",
    },
    {
      name: "Mitra Warmiendo Demo",
      username: "warmiendo.demo",
      password: hashDefault,
      role: "warmiendo" as const,
      status: "Aktif",
    },
    {
      name: "Mitra Bank Sampah Demo",
      username: "banksampah.demo",
      password: hashDefault,
      role: "bank-sampah" as const,
      status: "Aktif",
    },
  ];

  // Parse CSV users
  try {
    const csvPath = path.join(process.cwd(), "db/csv/datauser.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n");

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",");
      if (parts.length < 3) continue;

      const nik = parts[0].trim();
      const name = parts[1].trim();
      const birthdate = parts[2].trim();

      if (!nik || !name || !birthdate) continue;

      data.push({
        name,
        username: nik,
        password: hashDefault, // Use hashDefault to optimize speed (Argon2 is slow)
        role: "konsumen" as const,
        status: "Aktif",
      });
    }
  } catch (error) {
    console.error("⚠️ Error reading or parsing users CSV:", error);
  }

  // Clear existing users before seeding to ensure complete consistency
  await db.delete(users);
  await db.insert(users).values(data);

  console.log(`✅ Seeded ${data.length} users successfully`);
}
