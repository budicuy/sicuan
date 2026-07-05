import {
  date,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "@/db/schema/nasabah";
import { jenisSampahEnum, statusSetorEnum } from "@/db/schema/setoran_konsumen";

export const setorSampahBankSampah = pgTable("setoran_bank_sampah", {
  id: serial("id").primaryKey(),
  nomorSetor: text("nomor_setor").notNull(),
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

export const insertSetorSampahBankSampahSchema = createInsertSchema(
  setorSampahBankSampah,
);

export const selectSetorSampahBankSampahSchema = createSelectSchema(
  setorSampahBankSampah,
);
