import {
  date,
  doublePrecision,
  pgTable,
  serial,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * Tabel raw_material — 1 baris per bulan.
 * Setiap baris menyimpan berat standar (gram) untuk semua kombinasi
 * kategori × klasifikasi dalam satu periode bulan.
 *
 * Kategori:
 *   - Etiket  → NN (Normal Noodle), GN (Glass Noodle), CN (Cup Noodle)
 *   - Karton  → NN, GN, CN
 *   - Cup     → CN saja (Paper Cup / Cup Noodle)
 */
export const rawMaterial = pgTable(
  "raw_material",
  {
    id: serial("id").primaryKey(),
    /** Format YYYY-MM-01 — hari pertama bulan, unik per bulan */
    periode: date("periode").notNull(),

    // ── Etiket ────────────────────────────────────────────────────────────
    etiketNnGram: doublePrecision("etiket_nn_gram").notNull().default(0),
    etiketGnGram: doublePrecision("etiket_gn_gram").notNull().default(0),
    etiketCnGram: doublePrecision("etiket_cn_gram").notNull().default(0),

    // ── Karton ────────────────────────────────────────────────────────────
    kartonNnGram: doublePrecision("karton_nn_gram").notNull().default(0),
    kartonGnGram: doublePrecision("karton_gn_gram").notNull().default(0),
    kartonCnGram: doublePrecision("karton_cn_gram").notNull().default(0),

    // ── Cup / Paper Cup ───────────────────────────────────────────────────
    cupCnGram: doublePrecision("cup_cn_gram").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [unique("raw_material_periode_unique").on(t.periode)],
);

export const insertRawMaterialSchema = createInsertSchema(rawMaterial);
export const selectRawMaterialSchema = createSelectSchema(rawMaterial);

export type RawMaterial = typeof rawMaterial.$inferSelect;
export type NewRawMaterial = typeof rawMaterial.$inferInsert;
