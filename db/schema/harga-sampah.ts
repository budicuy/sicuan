import {
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const hargaSampah = pgTable("harga_sampah", {
  id: serial("id").primaryKey(),
  periode: date("periode").notNull(), // format: YYYY-MM-DD (simpan hari-1 tiap bulan)
  jenisSampah: text("jenis_sampah").notNull(), // e.g. "Paper Cup", "Plastik", "Karton"
  hargaPerKg: integer("harga_per_kg").notNull(),
  pointPerKg: integer("point_per_kg").notNull(),
  beratMin: integer("berat_min").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertHargaSampahSchema = createInsertSchema(hargaSampah);
export const selectHargaSampahSchema = createSelectSchema(hargaSampah);

export type HargaSampah = typeof hargaSampah.$inferSelect;
export type NewHargaSampah = typeof hargaSampah.$inferInsert;
