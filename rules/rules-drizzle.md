Ini best practice struktur skema database dengan **Drizzle ORM**:

## Struktur Folder

```
app/
└── db/
    ├── index.ts          # koneksi database
    ├── schema/
    │   ├── index.ts      # re-export semua schema
    │   ├── users.ts
    │   ├── posts.ts
    │   └── relations.ts  # semua relasi
    └── migrations/       # auto-generated drizzle-kit
```

---

## `db/index.ts` — Koneksi

```ts
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be specified");
}

const client = neon(process.env.DATABASE_URL);
export const db = drizzle({ client, schema });
export type DB = typeof db;

---

## `db/schema/users.ts`

```ts
import { pgTable, text, timestamp, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Zod schema untuk validasi otomatis
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// TypeScript types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

---

## `db/schema/posts.ts`

```ts
import { pgTable, text, timestamp, serial, integer, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

export const postStatusEnum = pgEnum("post_status", ["draft", "published", "archived"]);

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  status: postStatusEnum("status").default("draft").notNull(),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

---

## `db/schema/relations.ts`

```ts
import { relations } from "drizzle-orm";
import { users } from "./users";
import { posts } from "./posts";

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

---

## `db/schema/index.ts`

```ts
export * from "./users";
export * from "./posts";
export * from "./relations";
```

---

## `drizzle.config.ts`

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

---

## Contoh Query

```ts
import { db } from "@/db";
import { users, posts } from "@/db/schema";
import { eq } from "drizzle-orm";

// Select dengan relasi
const result = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { posts: true },
});

// Insert
await db.insert(users).values({ name: "Budi", email: "budi@mail.com" });

// Update
await db.update(users)
  .set({ name: "Budi Santoso" })
  .where(eq(users.id, userId));
```

---

**Poin kunci best practice:**
- Pisah schema per entitas, relasi di file tersendiri
- Selalu export `$inferSelect` dan `$inferInsert` untuk type safety
- Gunakan `drizzle-zod` untuk validasi input otomatis
- `withTimezone: true` untuk timestamp agar konsisten
- Gunakan `serial()` untuk auto-increment ID, otomatis dikelola database