import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const hargaSampah = pgTable("harga_sampah", {
  id: serial("id").primaryKey(),
  jenisSampah: text("jenis_sampah").notNull(), // e.g. "Paper Cup", "Etiket", "Karton"
  minBerat: doublePrecision("berat_min").notNull(),
  maxBerat: doublePrecision("berat_max"), // null means no upper limit (e.g. > 10 kg)
  harga: integer("harga").notNull(),

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
