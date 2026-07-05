import {
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// ── Nasabah (Database Level Table) ───────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "superadmin",
  "admin",
  "konsumen",
  "warmiendo",
  "bank-sampah",
]);

export const nasabah = pgTable("nasabah", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull(),
  status: text("status").notNull().default("Aktif"),

  // Profile / Nasabah fields
  nik: text("nik"),
  tanggalLahir: text("tanggal_lahir"),
  noTelepon: text("no_telepon"),
  email: text("email"),
  alamat: text("alamat"),
  jenisBank: text("jenis_bank"),
  noRekening: text("no_rekening"),
  poin: integer("poin").notNull().default(0),
  kredit: integer("kredit").notNull().default(0),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertNasabahSchema = createInsertSchema(nasabah);
export const selectNasabahSchema = createSelectSchema(nasabah);

export type Nasabah = typeof nasabah.$inferSelect;
export type NewNasabah = typeof nasabah.$inferInsert;
