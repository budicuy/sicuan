import {
  date,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";

export const jenisSampahEnum = pgEnum("jenis_sampah", [
  "Karton",
  "Etiket",
  "Paper Cup",
]);

export const statusSetorEnum = pgEnum("status_setor", [
  "pending",
  "diverifikasi",
  "diserahkan",
  "diterima",
  "ditolak",
]);

export const setorSampahKonsumen = pgTable("setoran_konsumen", {
  id: serial("id").primaryKey(),
  nomorSetor: text("nomor_setor").notNull(), // "Setoran [Nama User] – [Tanggal]"
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  jenisSampah: jenisSampahEnum("jenis_sampah").notNull(),
  beratKg: doublePrecision("berat_kg").notNull(),
  beratAiKg: doublePrecision("berat_ai_kg"),
  tanggalSetor: date("tanggal_setor").notNull(),
  fotoTimbangan: text("foto_timbangan").notNull(),
  fotoBuktiTambahan: text("foto_bukti_tambahan").array().notNull().default([]),
  catatan: text("catatan"),
  totalPoin: integer("total_poin").notNull().default(0),
  status: statusSetorEnum("status").notNull().default("diterima"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertSetorSampahKonsumenSchema =
  createInsertSchema(setorSampahKonsumen);
export const selectSetorSampahKonsumenSchema =
  createSelectSchema(setorSampahKonsumen);
