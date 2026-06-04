import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const ekspedisi = pgTable("ekspedisi", {
  id: serial("id").primaryKey(),
  namaVendor: text("nama_vendor").notNull(),
  noTelepon: text("no_telepon").notNull(),
  status: text("status").notNull().default("Aktif"),

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
