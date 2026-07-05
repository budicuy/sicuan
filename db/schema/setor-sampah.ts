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
import { ekspedisi } from "@/db/schema/ekspedisi";
import { nasabah } from "@/db/schema/nasabah";

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

export const kategoriNasabahEnum = pgEnum("kategori_nasabah", [
  "konsumen",
  "warmiendo",
  "bank-sampah",
]);

export const setorSampah = pgTable("setor_sampah", {
  id: serial("id").primaryKey(),
  nomorSetor: text("nomor_setor").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => nasabah.id, { onDelete: "cascade" }),
  jenisSampah: jenisSampahEnum("jenis_sampah").notNull(),
  beratKg: doublePrecision("berat_kg").notNull(),
  beratAiKg: doublePrecision("berat_ai_kg"),
  tanggalSetor: date("tanggal_setor").notNull(),
  fotoTimbangan: text("foto_timbangan").notNull(),
  fotoBuktiTambahan: text("foto_bukti_tambahan").array().notNull().default([]),
  catatan: text("catatan"),
  totalPoin: integer("total_poin").notNull().default(0),
  status: statusSetorEnum("status").notNull().default("diterima"),

  // Optional fields for warmiendo category
  metodeSetor: text("metode_setor"), // "ekspedisi" | "langsung"
  ekspedisiId: integer("ekspedisi_id").references(() => ekspedisi.id, {
    onDelete: "set null",
  }),

  // Table differentiator with enum type
  kategoriNasabah: kategoriNasabahEnum("kategori_nasabah")
    .notNull()
    .default("konsumen"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertSetorSampahSchema = createInsertSchema(setorSampah);
export const selectSetorSampahSchema = createSelectSchema(setorSampah);

export type SetorSampah = typeof setorSampah.$inferSelect;
export type NewSetorSampah = typeof setorSampah.$inferInsert;
