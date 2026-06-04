import type { PgEnum } from "drizzle-orm/pg-core";
import {
  doublePrecision,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const kuponTierEnum = pgEnum("kupon_tier", [
  "silver",
  "gold",
  "diamond",
]) as PgEnum<["silver", "gold", "diamond"]>;

export const kupon = pgTable("kupon", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  deskripsi: text("deskripsi").notNull(),
  poin: doublePrecision("poin").notNull(),
  tier: kuponTierEnum("tier").notNull(),
  colorCode: text("color_code").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertKuponSchema = createInsertSchema(kupon);
export const selectKuponSchema = createSelectSchema(kupon);

export type Kupon = typeof kupon.$inferSelect;
export type NewKupon = typeof kupon.$inferInsert;
