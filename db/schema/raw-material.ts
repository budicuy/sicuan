import {
  date,
  doublePrecision,
  pgEnum,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const rawMaterialKategoriEnum = pgEnum("raw_material_kategori", [
  "Cup",
  "Etiket",
  "Karton",
]);

export const rawMaterialKlasifikasiEnum = pgEnum("raw_material_klasifikasi", [
  "Cup Noodle (CN)",
  "Glass Noodle (GN)",
  "Normal Noodle (NN)",
]);

export const rawMaterial = pgTable("raw_material", {
  id: serial("id").primaryKey(),
  periode: date("periode").notNull(),
  kategori: rawMaterialKategoriEnum("kategori").notNull(),
  klasifikasi: rawMaterialKlasifikasiEnum("klasifikasi").notNull(),
  beratKg: doublePrecision("berat_kg").notNull(),
  beratGram: doublePrecision("berat_gram").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertRawMaterialSchema = createInsertSchema(rawMaterial);
export const selectRawMaterialSchema = createSelectSchema(rawMaterial);

export type RawMaterial = typeof rawMaterial.$inferSelect;
export type NewRawMaterial = typeof rawMaterial.$inferInsert;
