import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { jenisSampahEnum } from "@/db/schema/setor-sampah";

export const poinSampahWarmindo = pgTable("poin_sampah_warmindo", {
  id: serial("id").primaryKey(),
  jenisSampah: jenisSampahEnum("jenis_sampah").notNull().unique(), // "Paper Cup", "Etiket", "Karton"
  poinPer100Gram: integer("poin_per_100_gram").notNull().default(10), // Default: 10 poin per 100 gram

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertPoinSampahWarmindoSchema =
  createInsertSchema(poinSampahWarmindo);
export const selectPoinSampahWarmindoSchema =
  createSelectSchema(poinSampahWarmindo);

export type PoinSampahWarmindo = typeof poinSampahWarmindo.$inferSelect;
export type NewPoinSampahWarmindo = typeof poinSampahWarmindo.$inferInsert;
