import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { nasabah } from "./nasabah";

export const ekspedisi = pgTable("ekspedisi", {
  id: serial("id").primaryKey(),
  namaVendor: text("nama_vendor").notNull(),
  noTelepon: text("no_telepon").notNull(),
  status: text("status").notNull().default("Aktif"),
  tipe: text("tipe").notNull().default("reguler"), // 'reguler' | 'bank-sampah-b'
  bankSampahId: integer("bank_sampah_id").references(() => nasabah.id, {
    onDelete: "set null",
  }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertEkspedisiSchema = createInsertSchema(ekspedisi);
export const selectEkspedisiSchema = createSelectSchema(ekspedisi);

export type Ekspedisi = typeof ekspedisi.$inferSelect;
export type NewEkspedisi = typeof ekspedisi.$inferInsert;
