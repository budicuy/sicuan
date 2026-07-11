import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { jenisSampahEnum } from "@/db/schema/setor-sampah";

export const poinSampah = pgTable("poin_sampah", {
  id: serial("id").primaryKey(),
  jenisSampah: jenisSampahEnum("jenis_sampah").notNull().unique(), // e.g. "Paper Cup", "Etiket", "Karton"
  pointPerKg: integer("point_per_kg").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertPoinSampahSchema = createInsertSchema(poinSampah);
export const selectPoinSampahSchema = createSelectSchema(poinSampah);

export type PoinSampah = typeof poinSampah.$inferSelect;
export type NewPoinSampah = typeof poinSampah.$inferInsert;
