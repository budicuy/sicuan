import fs from "node:fs";
import path from "node:path";
import argon2 from "argon2";
import { db } from "@/db";
import { type NewNasabah, nasabah } from "@/db/schema";

interface CsvUser {
  nik: string;
  name: string;
  passwordString: string;
  tanggalLahir: string; // YYYY-MM-DD
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

      // birthdate: MM/DD/YYYY → password: DDMMYY, tanggalLahir: YYYY-MM-DD
      const dateParts = birthdate.split("/");
      let passwordString = "Password123";
      let tanggalLahir = "1990-01-01";

      if (dateParts.length === 3) {
        const [mm, dd, yyyy] = dateParts;
        passwordString = `${dd.padStart(2, "0")}${mm.padStart(2, "0")}${yyyy.substring(2)}`;
        tanggalLahir = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
      }

      result.push({ nik, name, passwordString, tanggalLahir });
    }

    return result;
  } catch (error) {
    console.error("⚠️ Error reading or parsing users CSV:", error);
    return [];
  }
}

export async function seedNasabah() {
  console.log("🌱 Seeding merged nasabah table...");

  // Clear existing nasabah
  await db.delete(nasabah);

  // Parse CSV
  const csvUsers = parseCsv();

  // Password hashes
  const hashSuperadmin = await argon2.hash("PasswordSuper123");
  const hashAdmin = await argon2.hash("PasswordAdmin456");
  const hashBudi = await argon2.hash("170895"); // DDMMYY dari 17/08/1995
  const hashDefault = await argon2.hash("Password123");

  // Create list of all nasabah rows
  const dataToInsert: NewNasabah[] = [
    {
      name: "Superadmin Sicuan",
      username: "superadmin.sicuan",
      password: hashSuperadmin,
      role: "superadmin" as const,
      status: "Aktif",
      email: "learning.budicuy@gmail.com",
      nik: null,
      tanggalLahir: null,
      noTelepon: null,
      alamat: null,
      jenisBank: null,
      noRekening: null,
      poin: 0,
      kredit: 0,
      latitude: null,
      longitude: null,
    },
    {
      name: "Admin Banjarmasin",
      username: "admin.banjarmasin",
      password: hashAdmin,
      role: "admin" as const,
      status: "Aktif",
      email: "gaming.budicuy@gmail.com",
      nik: null,
      tanggalLahir: null,
      noTelepon: null,
      alamat: null,
      jenisBank: null,
      noRekening: null,
      poin: 0,
      kredit: 0,
      latitude: null,
      longitude: null,
    },
    {
      name: "Budi Santoso",
      username: "budi.santoso",
      password: hashBudi,
      role: "konsumen" as const,
      status: "Aktif",
      email: "budi.santoso@gmail.com",
      nik: "637101000000000",
      tanggalLahir: "1995-08-17",
      noTelepon: null,
      alamat: null,
      jenisBank: null,
      noRekening: null,
      poin: 200, // 700 earned - 500 redeemed
      kredit: 0,
      latitude: -3.32,
      longitude: 114.593,
    },
    {
      name: "Mitra Warmiendo Demo",
      username: "warmiendo.demo",
      password: hashDefault,
      role: "warmiendo" as const,
      status: "Aktif",
      email: "warmiendo.demo@gmail.com",
      nik: "637102000000000",
      tanggalLahir: "1990-08-17",
      noTelepon: null,
      alamat: null,
      jenisBank: null,
      noRekening: null,
      poin: 0,
      kredit: 50000, // 115000 earned - 65000 withdrawn
      latitude: -3.32426,
      longitude: 114.59102,
    },
    {
      name: "Mitra Bank Sampah Demo",
      username: "banksampah.demo",
      password: hashDefault,
      role: "bank-sampah" as const,
      status: "Aktif",
      email: "gaming.budicuy@gmail.com",
      nik: "637103000000000",
      tanggalLahir: "1985-08-17",
      noTelepon: null,
      alamat: null,
      jenisBank: "BCA",
      noRekening: "1234567890",
      poin: 0,
      kredit: 40000, // 90000 earned - 50000 withdrawn
      latitude: -3.29826,
      longitude: 114.58602,
    },
  ];

  console.log(
    `🔑 Using single cached hash for ${csvUsers.length} consumer passwords...`,
  );
  for (const u of csvUsers) {
    dataToInsert.push({
      name: u.name,
      username: u.nik,
      password: hashDefault,
      role: "konsumen" as const,
      status: "Aktif",
      email: null,
      nik: u.nik,
      tanggalLahir: u.tanggalLahir,
      noTelepon: null,
      alamat: null,
      jenisBank: null,
      noRekening: null,
      poin: 0,
      kredit: 0,
      latitude: null,
      longitude: null,
    });
  }

  // Insert all nasabah (which now holds all profile information)
  await db.insert(nasabah).values(dataToInsert);
  console.log(`✅ Seeded ${dataToInsert.length} merged nasabah successfully`);
}
