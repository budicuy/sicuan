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
import { ekspedisi } from "./ekspedisi";
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

export const setorSampah = pgTable("setor_sampah", {
  id: serial("id").primaryKey(),
  nomorSetor: text("nomor_setor").notNull(), // "Setoran [Nama User] – [Tanggal]"
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  jenisSampah: jenisSampahEnum("jenis_sampah").notNull(),
  beratKg: doublePrecision("berat_kg").notNull(), // input user
  beratAiKg: doublePrecision("berat_ai_kg"), // hasil baca AI (nullable)
  tanggalSetor: date("tanggal_setor").notNull(),
  fotoTimbangan: text("foto_timbangan").notNull(), // R2 URL
  fotoBuktiTambahan: text("foto_bukti_tambahan").array().notNull().default([]), // R2 URLs array
  catatan: text("catatan"), // opsional
  totalPoin: integer("total_poin").notNull().default(0), // poin yang didapat
  status: statusSetorEnum("status").notNull().default("diterima"),
  metodeSetor: text("metode_setor").notNull().default("langsung"), // "langsung" atau "ekspedisi"
  ekspedisiId: integer("ekspedisi_id").references(() => ekspedisi.id, {
    onDelete: "set null",
  }),

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
