import argon2 from "argon2";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function seedUsers() {
  console.log("🌱 Seeding 55 users (5 mandatory + 50 random)...");

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

  const firstNames = [
    "Andi",
    "Siti",
    "Dewi",
    "Eko",
    "Joko",
    "Rudi",
    "Slamet",
    "Agus",
    "Heri",
    "Rina",
    "Santi",
    "Mega",
    "Lina",
    "Dian",
    "Ari",
    "Dani",
    "Hadi",
    "Indra",
    "Taufik",
    "Ahmad",
    "Muhammad",
    "Ali",
    "Hasan",
    "Husin",
    "Umar",
    "Abu",
    "Anas",
    "Yusuf",
    "Ibrahim",
    "Dewo",
  ];

  const lastNames = [
    "Wijaya",
    "Susanto",
    "Saputra",
    "Pratama",
    "Hidayat",
    "Kurniawan",
    "Setyawan",
    "Budiman",
    "Gunawan",
    "Sari",
    "Lestari",
    "Wulandari",
    "Rahayu",
    "Utami",
    "Putri",
    "Kartika",
    "Fitriani",
    "Ningsih",
    "Amalia",
    "Siregar",
    "Nasution",
    "Ginting",
    "Harahap",
    "Lubis",
  ];

  // Generate 50 random users
  for (let i = 1; i <= 50; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 3) % lastNames.length];
    const name = `${firstName} ${lastName}`;
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}`;

    // Random role distribution among non-admin/superadmin roles
    let role: "konsumen" | "warmiendo" | "bank-sampah" = "konsumen";
    if (i % 3 === 0) {
      role = "konsumen";
    } else if (i % 3 === 1) {
      role = "warmiendo";
    } else {
      role = "bank-sampah";
    }

    data.push({
      name,
      username,
      password: hashDefault,
      role,
      status: "Aktif",
    });
  }

  // Clear existing users before seeding to ensure complete consistency
  await db.delete(users);
  await db.insert(users).values(data);

  console.log(`✅ Seeded ${data.length} users successfully`);
}
