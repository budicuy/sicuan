import { notInArray } from "drizzle-orm";
import { db } from "../index";
import { nasabah, users } from "../schema";

export async function seedNasabah() {
  console.log(
    "🌱 Seeding nasabah profiles and calculating consistent points & credit balances...",
  );

  await db.delete(nasabah);

  // Get all users that are not admin or superadmin
  const listUsers = await db.query.users.findMany({
    where: notInArray(users.role, ["admin", "superadmin"]),
  });

  const banks = ["BCA", "BRI", "Mandiri", "BNI", "BSI", "BTN"];
  const addresses = [
    "Jl. Ahmad Yani KM 1, Banjarmasin",
    "Jl. Hasan Basry No. 42, Banjarmasin",
    "Jl. Pramuka Raya No. 12, Banjarmasin",
    "Jl. Gatot Subroto No. 88, Banjarmasin",
    "Jl. Sultan Adam No. 5, Banjarmasin",
  ];

  const data = [];
  for (let i = 0; i < listUsers.length; i++) {
    const user = listUsers[i];
    const bank = banks[i % banks.length];
    const address = addresses[i % addresses.length];
    const birthDate = `19${75 + (i % 25)}-08-17`;

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

    data.push({
      userId: user.id,
      nik: `63710${1000000000 + i}`,
      tanggalLahir: birthDate,
      noTelepon: `081234567${String(100 + i)}`,
      alamat: address,
      jenisBank: bank,
      noRekening: `1002003${String(1000 + i)}`,
      poin,
      kredit,
    });
  }

  if (data.length > 0) {
    await db.insert(nasabah).values(data);
  }

  console.log(`✅ Seeded ${data.length} nasabah profiles successfully`);
}
