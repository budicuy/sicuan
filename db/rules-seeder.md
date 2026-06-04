# Drizzle ORM Seeder Rules

## Folder Structure

Always follow this exact structure — no deviation:

```
app/
└── db/
    └── seeds/
        ├── index.ts          # export urutan eksekusi seeders
        ├── seed.ts           # runner script (main entry point)
        ├── [entity].seed.ts  # satu file per entitas
        └── [entity].seed.ts
```

---

## ID Convention

- ALWAYS use **auto-increment integer** as primary key in seeder data — NEVER hardcode UUID
- NEVER set `id` field manually di data seed — biarkan database yang generate
- Schema harus menggunakan `serial("id").primaryKey()` atau `integer("id").primaryKey().generatedAlwaysAsIdentity()`

```ts
// ✅ BENAR — tidak set id sama sekali
const data = [
  { name: "Admin", email: "admin@example.com" },
  { name: "Budi", email: "budi@example.com" },
];

// ❌ SALAH — jangan hardcode id
const data = [
  { id: 1, name: "Admin", email: "admin@example.com" },
];
```

---

## Seeder File Rules (`[entity].seed.ts`)

Setiap file seeder WAJIB mengikuti template ini:

```ts
import { db } from "../index";
import { tableName } from "../schema";

export async function seed[Entity]() {
  console.log("🌱 Seeding [entity]...");

  const data = [
    // data tanpa id — auto increment
  ];

  await db
    .insert(tableName)
    .values(data)
    .onConflictDoNothing(); // WAJIB — supaya idempotent

  console.log(`✅ Seeded ${data.length} [entity]`);
}
```

### Wajib diikuti:
- Nama fungsi: `seed` + PascalCase nama entitas (contoh: `seedUsers`, `seedPosts`)
- Nama file: `[entity].seed.ts` (contoh: `users.seed.ts`, `posts.seed.ts`)
- Selalu gunakan `.onConflictDoNothing()` — seeder harus **idempotent**
- Selalu log progress dengan emoji `🌱` sebelum dan `✅` sesudah
- Export fungsi sebagai **named export**, bukan default export

---

## Index File Rules (`seeds/index.ts`)

```ts
import { seed[Entity1] } from "./[entity1].seed";
import { seed[Entity2] } from "./[entity2].seed";

// URUTAN WAJIB: parent table dulu sebelum child table (ikuti foreign key)
// Contoh: users harus sebelum posts, posts sebelum comments
export const seeders = [
  seed[Entity1], // parent
  seed[Entity2], // child yang punya FK ke Entity1
];
```

### Aturan urutan:
1. Tabel tanpa foreign key → paling pertama
2. Tabel dengan FK ke tabel lain → setelah tabel yang direferensikan
3. Junction/pivot table (many-to-many) → paling terakhir

---

## Runner File Rules (`seeds/seed.ts`)

WAJIB menggunakan template ini persis — jangan dimodifikasi strukturnya:

```ts
import { seeders } from "./index";

async function main() {
  console.log("🚀 Starting database seeding...\n");

  try {
    for (const seeder of seeders) {
      await seeder();
    }
    console.log("\n🎉 All seeds completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
```

---

## Data Guidelines

### Data minimal (production-safe seed):
- Hanya data yang benar-benar dibutuhkan sistem (akun admin, config default, lookup data)
- Tidak boleh mengandung data personal atau sensitif asli

### Data development (boleh pakai Faker):
- Gunakan `@faker-js/faker` untuk data acak
- Tetap tanpa hardcode `id`

```ts
import { faker } from "@faker-js/faker";

const fakeData = Array.from({ length: 20 }, () => ({
  // tanpa id
  name: faker.person.fullName(),
  email: faker.internet.email(),
}));
```

### Password & data sensitif:
- WAJIB hash password sebelum insert menggunakan **argon2** — JANGAN bcrypt atau plain text
- JANGAN simpan plain text password di seeder
- Install: `npm install argon2`

```ts
import argon2 from "argon2";

const password = await argon2.hash("secret123");
const data = [{ email: "admin@example.com", password }];
```

---

## package.json Scripts

Selalu tambahkan scripts ini:

```json
{
  "scripts": {
    "db:seed": "tsx src/db/seeds/seed.ts",
    "db:migrate:seed": "npm run db:migrate && npm run db:seed"
  }
}
```

---

