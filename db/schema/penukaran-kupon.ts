import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { kupon } from "@/db/schema/kupon";
import { nasabah } from "@/db/schema/nasabah";

export const penukaranKupon = pgTable("penukaran_kupon", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => nasabah.id, { onDelete: "cascade" }),
  kuponId: integer("kupon_id")
    .notNull()
    .references(() => kupon.id, { onDelete: "cascade" }),
  kodeUnik: text("kode_unik").notNull().unique(), // e.g., KPN-100050-YB or SCN-NNMX36-S0EQQR
  status: text("status").notNull().default("aktif"), // "aktif" or "digunakan"
  tanggalGunakan: timestamp("tanggal_gunakan", { withTimezone: true }), // when redeemed at merchant/validator scan
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertPenukaranKuponSchema = createInsertSchema(penukaranKupon);
export const selectPenukaranKuponSchema = createSelectSchema(penukaranKupon);

export type PenukaranKupon = typeof penukaranKupon.$inferSelect;
export type NewPenukaranKupon = typeof penukaranKupon.$inferInsert;
