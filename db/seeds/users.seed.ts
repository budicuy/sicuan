import argon2 from "argon2";
import { db } from "../index";
import { users } from "../schema";

export async function seedUsers() {
  console.log("🌱 Seeding 100 users...");

  const defaultPasswordHash = await argon2.hash("Password123");

  const _roles = [
    "superadmin",
    "admin",
    "konsumen",
    "warmiendo",
    "bank-sampah",
  ] as const;

  const firstNames = [
    "Budi",
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
  ];

  const lastNames = [
    "Santoso",
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
    "Pane",
    "Batubara",
    "Tanjung",
    "Daulay",
    "Regar",
  ];

  const data = [];

  // Seed fixed admin users first for safety
  data.push(
    {
      name: "Superadmin Sicuan",
      username: "superadmin.sicuan",
      password: defaultPasswordHash,
      role: "superadmin" as const,
      status: "Aktif",
    },
    {
      name: "Admin Banjarmasin",
      username: "admin.banjarmasin",
      password: defaultPasswordHash,
      role: "admin" as const,
      status: "Aktif",
    },
  );

  // Generate 98 random users to reach 100 users total
  for (let i = 1; i <= 98; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 3) % lastNames.length];
    const name = `${firstName} ${lastName}`;
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}`;

    // Distribute roles: i % 10 === 0 -> admin, i % 3 === 0 -> konsumen, i % 3 === 1 -> warmiendo, else -> bank-sampah
    let role:
      | "superadmin"
      | "admin"
      | "konsumen"
      | "warmiendo"
      | "bank-sampah" = "konsumen";
    if (i % 12 === 0) {
      role = "admin";
    } else if (i % 3 === 0) {
      role = "konsumen";
    } else if (i % 3 === 1) {
      role = "warmiendo";
    } else {
      role = "bank-sampah";
    }

    data.push({
      name,
      username,
      password: defaultPasswordHash,
      role,
      status: i % 15 === 0 ? "Nonaktif" : "Aktif",
    });
  }

  await db.insert(users).values(data).onConflictDoNothing();

  console.log(`✅ Seeded ${data.length} users`);
}
