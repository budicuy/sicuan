import fs from "node:fs";
import path from "node:path";
import argon2 from "argon2";
import { db } from "@/db";
import { type NewUser, users } from "@/db/schema";

interface CsvUser {
  nik: string;
  name: string;
  passwordString: string;
}

function parseCsv(): CsvUser[] {
  try {
    const csvPath = path.join(process.cwd(), "db/csv/datauser.csv");
    const lines = fs.readFileSync(csvPath, "utf-8").split("\n");
    const result: CsvUser[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",");
      if (parts.length < 3) continue;

      const nik = parts[0].trim();
      const name = parts[1].trim();
      const birthdate = parts[2].trim();

      if (!nik || !name || !birthdate) continue;

      // birthdate: MM/DD/YYYY → password: DDMMYY
      const dateParts = birthdate.split("/");
      let passwordString = "  ";

      if (dateParts.length === 3) {
        const [mm, dd, yyyy] = dateParts;
        passwordString = `${dd.padStart(2, "0")}${mm.padStart(2, "0")}${yyyy.substring(2)}`;
      }

      result.push({ nik, name, passwordString });
    }

    return result;
  } catch (error) {
    console.error("⚠️ Error reading or parsing users CSV:", error);
    return [];
  }
}

export async function seedUsers() {
  console.log("🌱 Seeding users table...");

  await db.delete(users);

  const hashSuperadmin = await argon2.hash("PasswordSuper123");
  const hashAdmin = await argon2.hash("PasswordAdmin456");
  const hashBudi = await argon2.hash("170895"); // DDMMYY dari 17/08/1995
  const hashDefault = await argon2.hash("Password123");

  const csvUsers = parseCsv();

  const usersToInsert: NewUser[] = [
    // 1. Superadmin
    {
      name: "SUPERADMIN SICUAN",
      username: "superadmin.sicuan",
      password: hashSuperadmin,
      email: "learning.budicuy@gmail.com",
      role: "superadmin",
      status: "Aktif",
    },
    // 2. Admin
    {
      name: "ADMIN SICUAN",
      username: "admin.banjarmasin",
      password: hashAdmin,
      email: "gaming.budicuy@gmail.com",
      role: "admin",
      status: "Aktif",
    },
    // 3. Budi Santoso (konsumen demo)
    {
      name: "Budi Santoso",
      username: "budi.santoso",
      password: hashBudi,
      email: "budi.santoso@gmail.com",
      role: "konsumen",
      status: "Aktif",
    },
    // 4. Mitra Warmindo
    {
      name: "Mitra Warmindo Demo",
      username: "warmindo.demo",
      password: hashDefault,
      email: "warmindo.demo@gmail.com",
      role: "warmindo",
      status: "Aktif",
    },
    {
      name: "Mitra Warmindo Berkah",
      username: "warmindo.berkah",
      password: hashDefault,
      email: "warmindo.berkah@gmail.com",
      role: "warmindo",
      status: "Aktif",
    },
    {
      name: "Mitra Warmindo Mandiri",
      username: "warmindo.mandiri",
      password: hashDefault,
      email: "warmindo.mandiri@gmail.com",
      role: "warmindo",
      status: "Aktif",
    },
    {
      name: "Mitra Warmindo Jaya",
      username: "warmindo.jaya",
      password: hashDefault,
      email: "warmindo.jaya@gmail.com",
      role: "warmindo",
      status: "Aktif",
    },
    {
      name: "Mitra Warmindo Sejahtera",
      username: "warmindo.sejahtera",
      password: hashDefault,
      email: "warmindo.sejahtera@gmail.com",
      role: "warmindo",
      status: "Aktif",
    },
    // 5. Mitra Bank Sampah
    {
      name: "Mitra Bank Sampah Demo",
      username: "banksampah.demo",
      password: hashDefault,
      email: "gaming.budicuy@gmail.com",
      role: "bank-sampah",
      status: "Aktif",
    },
    // New Bank Sampah 1
    {
      name: "Bank Sampah Banjarbaru / TPS 3R Gotong Royong",
      username: "banksampah.banjarbaru",
      password: hashDefault,
      email: "banksampah.banjarbaru@gmail.com",
      role: "bank-sampah",
      status: "Aktif",
    },
    // New Bank Sampah 2
    {
      name: "TPS 3R Sidoarjo",
      username: "banksampah.sidoarjo",
      password: hashDefault,
      email: "banksampah.sidoarjo@gmail.com",
      role: "bank-sampah",
      status: "Aktif",
    },
    // 6. CSV consumers
    ...csvUsers.map((u) => ({
      name: u.name,
      username: u.nik,
      password: hashDefault,
      email: null,
      role: "konsumen" as const,
      status: "Aktif" as const,
    })),
  ];

  const inserted = await db.insert(users).values(usersToInsert).returning();
  console.log(`✅ Seeded ${inserted.length} users successfully`);
}
