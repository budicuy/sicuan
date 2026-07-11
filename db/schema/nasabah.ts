import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// ── Role & Status Enums ──────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "superadmin",
  "admin",
  "konsumen",
  "warmindo",
  "bank-sampah",
]);

export const statusUserEnum = pgEnum("status_user", ["Aktif", "Nonaktif"]);

// ── Users Table (Authentication & System Identity) ───────────────────────────

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    email: text("email"),
    role: userRoleEnum("role").notNull(),
    status: statusUserEnum("status").notNull().default("Aktif"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("users_username_idx").on(table.username),
    index("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
  ],
);

// ── Nasabah Table (Profile details linked 1-to-1 with Users) ───────────────────

export const nasabah = pgTable(
  "nasabah",
  {
    id: integer("id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    username: text("username").notNull().unique(),
    role: userRoleEnum("role").notNull(),
    status: statusUserEnum("status").notNull().default("Aktif"),

    nik: text("nik"),
    tanggalLahir: text("tanggal_lahir"),
    noTelepon: text("no_telepon"),
    email: text("email"),
    alamat: text("alamat"),
    jenisBank: text("jenis_bank"),
    noRekening: text("no_rekening"),
    poin: integer("poin"), // NULL = bukan konsumen (tidak memiliki poin)
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("nasabah_username_idx").on(table.username),
    index("nasabah_email_idx").on(table.email),
    index("nasabah_role_idx").on(table.role),
  ],
);

export const insertUsersSchema = createInsertSchema(users);
export const selectUsersSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const insertNasabahSchema = createInsertSchema(nasabah);
export const selectNasabahSchema = createSelectSchema(nasabah);
export type Nasabah = typeof nasabah.$inferSelect;
export type NewNasabah = typeof nasabah.$inferInsert;
