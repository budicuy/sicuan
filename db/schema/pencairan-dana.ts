import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { nasabah } from "@/db/schema/nasabah";

export const pencairanDana = pgTable("pencairan_dana", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => nasabah.id, { onDelete: "cascade" }),
  jumlah: integer("jumlah").notNull(),
  jenisBank: text("jenis_bank"), // nullable for tunai payment
  noRekening: text("no_rekening"), // nullable for tunai payment
  status: text("status").notNull().default("pending"), // "pending", "berhasil", or "ditolak"
  metodePembayaran: text("metode_pembayaran").notNull().default("transfer"), // "tunai" | "transfer" | "qris"
  keterangan: text("keterangan"), // catatan tambahan
  ttdPenyerahUrl: text("ttd_penyerah_url"), // TTD mitra (uploaded when submitting)
  buktiTransfer: text("bukti_transfer"), // proof photo uploaded by admin (only for transfer/qris)
  periodeBulan: integer("periode_bulan"), // 1-indexed month (1-12) for the billing period
  periodeTahun: integer("periode_tahun"), // year for the billing period
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertPencairanDanaSchema = createInsertSchema(pencairanDana);
export const selectPencairanDanaSchema = createSelectSchema(pencairanDana);

export type PencairanDana = typeof pencairanDana.$inferSelect;
export type NewPencairanDana = typeof pencairanDana.$inferInsert;
