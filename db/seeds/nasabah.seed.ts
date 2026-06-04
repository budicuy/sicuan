import { inArray } from "drizzle-orm";
import { db } from "../index";
import { nasabah, users } from "../schema";

export async function seedNasabah() {
  console.log("🌱 Seeding 100 nasabah...");

  const listUsers = await db.query.users.findMany({
    where: inArray(users.role, ["konsumen", "warmiendo", "bank-sampah"]),
  });

  const banks = ["BCA", "BRI", "Mandiri", "BNI", "BSI", "BTN"];
  const addresses = [
    "Jl. Ahmad Yani KM 1",
    "Jl. Hasan Basry",
    "Jl. Pramuka",
    "Jl. Gatot Subroto",
    "Jl. Sultan Adam",
    "Jl. Sungai Lulut",
    "Jl. Belitung Darat",
    "Jl. Cemara Raya",
  ];

  const data = [];
  for (let i = 0; i < Math.min(listUsers.length, 100); i++) {
    const user = listUsers[i];
    const bank = banks[i % banks.length];
    const address = `${addresses[i % addresses.length]} No. ${10 + i}, Banjarmasin`;
    const birthDate = `19${75 + (i % 25)}-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}`;

    data.push({
      userId: user.id,
      nik: `63710${1000000000 + i}`,
      tanggalLahir: birthDate,
      noTelepon: `081234567${String(100 + i)}`,
      alamat: address,
      jenisBank: bank,
      noRekening: `1002003${String(1000 + i)}`,
    });
  }

  if (data.length > 0) {
    await db.insert(nasabah).values(data).onConflictDoNothing();
  }

  console.log(`✅ Seeded ${data.length} nasabah`);
}
