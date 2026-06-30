import fs from "node:fs";
import path from "node:path";
import { notInArray } from "drizzle-orm";
import { db } from "@/db";
import { nasabah, users } from "@/db/schema";

export async function seedNasabah() {
  console.log(
    "🌱 Seeding nasabah profiles and calculating consistent points & credit balances...",
  );

  await db.delete(nasabah);

  // Get all users that are not admin or superadmin
  const listUsers = await db.query.users.findMany({
    where: notInArray(users.role, ["admin", "superadmin"]),
  });

  const _banks = ["BCA", "BRI", "Mandiri", "BNI", "BSI", "BTN"];
  const _addresses = [
    "Jl. Ahmad Yani KM 1, Banjarmasin",
    "Jl. Hasan Basry No. 42, Banjarmasin",
    "Jl. Pramuka Raya No. 12, Banjarmasin",
    "Jl. Gatot Subroto No. 88, Banjarmasin",
    "Jl. Sultan Adam No. 5, Banjarmasin",
  ];

  // Parse CSV users for birthdates
  const csvUsersMap = new Map<string, string>();
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
      const birthdate = parts[2].trim();

      // Normalize birthdate from MM/DD/YYYY to YYYY-MM-DD
      const dateParts = birthdate.split("/");
      if (dateParts.length === 3) {
        const normalized = `${dateParts[2]}-${dateParts[0].padStart(2, "0")}-${dateParts[1].padStart(2, "0")}`;
        csvUsersMap.set(nik, normalized);
      }
    }
  } catch (error) {
    console.error(
      "⚠️ Error reading or parsing users CSV in nasabah seed:",
      error,
    );
  }

  const data = [];
  for (let i = 0; i < listUsers.length; i++) {
    const user = listUsers[i];

    let poin = 0;
    let kredit = 0;

    // Hardcode values for mandatory demo users to be 100% consistent with their seeded transactions
    if (user.username === "budi.santoso") {
      poin = 200; // 700 earned - 500 redeemed
      kredit = 0;
    } else if (user.username === "warmiendo.demo") {
      poin = 0;
      kredit = 50000; // 115000 earned - 65000 (30k + 20k + 15k) withdrawn
    } else if (user.username === "banksampah.demo") {
      poin = 0;
      kredit = 40000; // 90000 earned - 50000 (40k + 10k) withdrawn
    }

    // Determine NIK and Tanggal Lahir
    let nik = "";
    let tanggalLahir = "";
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (user.username === "budi.santoso") {
      nik = "637101000000000";
      tanggalLahir = "1995-08-17";
      latitude = -3.32;
      longitude = 114.593;
    } else if (user.username === "warmiendo.demo") {
      nik = "637102000000000";
      tanggalLahir = "1990-08-17";
      latitude = -3.32426;
      longitude = 114.59102;
    } else if (user.username === "banksampah.demo") {
      nik = "637103000000000";
      tanggalLahir = "1985-08-17";
      latitude = -3.29826;
      longitude = 114.58602;
    } else {
      // It's a CSV user, username is their NIK
      nik = user.username;
      tanggalLahir = csvUsersMap.get(user.username) || "1990-01-01";
    }

    data.push({
      userId: user.id,
      nik,
      tanggalLahir,
      noTelepon: null, // Emptied/nullable as requested
      alamat: null, // Emptied/nullable as requested
      jenisBank: null, // Emptied/nullable as requested
      noRekening: null, // Emptied/nullable as requested
      poin,
      kredit,
      latitude,
      longitude,
    });
  }

  if (data.length > 0) {
    await db.insert(nasabah).values(data);
  }

  console.log(`✅ Seeded ${data.length} nasabah profiles successfully`);
}
