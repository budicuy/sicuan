import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "@/db/schema/users";

export const nasabah = pgTable("nasabah", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  nik: text("nik"),
  tanggalLahir: text("tanggal_lahir"),
  noTelepon: text("no_telepon"),
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
