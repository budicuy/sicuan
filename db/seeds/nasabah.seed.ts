import fs from "node:fs";
import path from "node:path";
import { db } from "@/db";
import type { NewNasabah } from "@/db/schema";
import { nasabah } from "@/db/schema";

interface CsvProfile {
  nik: string;
  tanggalLahir: string;
}

function parseCsvProfiles(): CsvProfile[] {
  try {
    const csvPath = path.join(process.cwd(), "db/csv/datauser.csv");
    const lines = fs.readFileSync(csvPath, "utf-8").split("\n");
    const result: CsvProfile[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",");
      if (parts.length < 3) continue;

      const nik = parts[0].trim();
      const birthdate = parts[2].trim();

      if (!nik || !birthdate) continue;

      // birthdate: MM/DD/YYYY → YYYY-MM-DD
      const dateParts = birthdate.split("/");
      let tanggalLahir = "1990-01-01";

      if (dateParts.length === 3) {
        const [mm, dd, yyyy] = dateParts;
        tanggalLahir = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
      }

      result.push({ nik, tanggalLahir });
    }

    return result;
  } catch (error) {
    console.error("⚠️ Error reading or parsing CSV for profiles:", error);
    return [];
  }
}

export async function seedNasabah() {
  console.log("🌱 Seeding nasabah profiles...");

  await db.delete(nasabah);

  // Ambil semua user yang sudah ada (diinsert oleh seedUsers)
  const allUsers = await db.query.users.findMany();
  const userMap = new Map(allUsers.map((u) => [u.username, u]));

  const profilesToInsert: NewNasabah[] = [];

  // 1. Superadmin
  const superadmin = userMap.get("superadmin.sicuan");
  if (superadmin) {
    profilesToInsert.push({
      id: superadmin.id,
      name: superadmin.name,
      username: superadmin.username,
      role: superadmin.role as "superadmin",
      status: superadmin.status as "Aktif",
      nik: null,
      tanggalLahir: null,
      noTelepon: null,
      email: "learning.budicuy@gmail.com",
      alamat: null,
      jenisBank: null,
      noRekening: null,
      poin: null,
      latitude: null,
      longitude: null,
    });
  }

  // 2. Admin
  const admin = userMap.get("admin.banjarmasin");
  if (admin) {
    profilesToInsert.push({
      id: admin.id,
      name: admin.name,
      username: admin.username,
      role: admin.role as "admin",
      status: admin.status as "Aktif",
      nik: null,
      tanggalLahir: null,
      noTelepon: null,
      email: "gaming.budicuy@gmail.com",
      alamat: null,
      jenisBank: null,
      noRekening: null,
      poin: null,
      latitude: null,
      longitude: null,
    });
  }

  // 3. Budi Santoso (konsumen demo)
  const budi = userMap.get("budi.santoso");
  if (budi) {
    profilesToInsert.push({
      id: budi.id,
      name: budi.name,
      username: budi.username,
      role: budi.role as "konsumen",
      status: budi.status as "Aktif",
      nik: "637101000000000",
      tanggalLahir: "1995-08-17",
      noTelepon: null,
      email: "budi.santoso@gmail.com",
      alamat: null,
      jenisBank: null,
      noRekening: null,
      poin: 0,
      latitude: -3.32,
      longitude: 114.593,
    });
  }

  // 4. Mitra Warmindo
  const warmindo = userMap.get("warmindo.demo");
  if (warmindo) {
    profilesToInsert.push({
      id: warmindo.id,
      name: warmindo.name,
      username: warmindo.username,
      role: warmindo.role as "warmindo",
      status: warmindo.status as "Aktif",
      nik: "637102000000000",
      tanggalLahir: "1990-08-17",
      noTelepon: null,
      email: "warmindo.demo@gmail.com",
      alamat: null,
      jenisBank: null,
      noRekening: null,
      poin: null,
      latitude: -3.32426,
      longitude: 114.59102,
    });
  }

  // 5. Mitra Bank Sampah
  const bankSampah = userMap.get("banksampah.demo");
  if (bankSampah) {
    profilesToInsert.push({
      id: bankSampah.id,
      name: bankSampah.name,
      username: bankSampah.username,
      role: bankSampah.role as "bank-sampah",
      status: bankSampah.status as "Aktif",
      nik: "637103000000000",
      tanggalLahir: "1985-08-17",
      noTelepon: null,
      email: "gaming.budicuy@gmail.com",
      alamat: null,
      jenisBank: "BCA",
      noRekening: "1234567890",
      poin: null,
      latitude: -3.29826,
      longitude: 114.58602,
    });
  }

  // New Bank Sampah 1 (Gotong Royong)
  const bsBanjarbaru = userMap.get("banksampah.banjarbaru");
  if (bsBanjarbaru) {
    profilesToInsert.push({
      id: bsBanjarbaru.id,
      name: bsBanjarbaru.name,
      username: bsBanjarbaru.username,
      role: "bank-sampah",
      status: "Aktif",
      nik: null,
      tanggalLahir: null,
      noTelepon: "081521617747",
      email: "banksampah.banjarbaru@gmail.com",
      alamat:
        "Jl. Trikora RT. 05 RW. 04 Kelurahan Loktabat Selatan Kec. Banjarbaru Selatan, Banjarbaru Kalimantan Selatan",
      jenisBank: "BNI",
      noRekening: "6123456789",
      poin: null,
      latitude: null,
      longitude: null,
    });
  }

  // New Bank Sampah 2 (Sidoarjo)
  const bsSidoarjo = userMap.get("banksampah.sidoarjo");
  if (bsSidoarjo) {
    profilesToInsert.push({
      id: bsSidoarjo.id,
      name: bsSidoarjo.name,
      username: bsSidoarjo.username,
      role: "bank-sampah",
      status: "Aktif",
      nik: null,
      tanggalLahir: null,
      noTelepon: null,
      email: "banksampah.sidoarjo@gmail.com",
      alamat:
        "Jl. Sidoarjo RT. 30 RW. 06 Kel. Syamsudin Noor Kec. Landasan Ulin Kota Banjarbaru Kalimantan Selatan",
      jenisBank: "BCA",
      noRekening: "923441123",
      poin: null,
      latitude: null,
      longitude: null,
    });
  }

  // 6. Profil konsumen dari CSV
  const csvProfiles = parseCsvProfiles();
  for (const p of csvProfiles) {
    const u = userMap.get(p.nik);
    if (!u) continue;
    profilesToInsert.push({
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role as "konsumen",
      status: u.status as "Aktif",
      nik: p.nik,
      tanggalLahir: p.tanggalLahir,
      noTelepon: null,
      email: null,
      alamat: null,
      jenisBank: null,
      noRekening: null,
      poin: 0,
      latitude: null,
      longitude: null,
    });
  }

  if (profilesToInsert.length > 0) {
    await db.insert(nasabah).values(profilesToInsert);
  }

  console.log(
    `✅ Seeded ${profilesToInsert.length} nasabah profiles successfully`,
  );
}
