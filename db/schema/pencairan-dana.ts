import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { nasabah } from "@/db/schema/nasabah";

export const statusPencairanEnum = pgEnum("status_pencairan", [
  "pending",
  "berhasil",
  "ditolak",
]);

export const metodePembayaranEnum = pgEnum("metode_pembayaran", [
  "transfer",
  "tunai",
  "qris",
]);

export const pencairanDana = pgTable(
  "pencairan_dana",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => nasabah.id, { onDelete: "cascade" }),
    jumlah: integer("jumlah").notNull(),
    jenisBank: text("jenis_bank"), // nullable for transfer payment
    noRekening: text("no_rekening"), // nullable for transfer payment
    status: statusPencairanEnum("status").notNull().default("pending"),
    metodePembayaran: metodePembayaranEnum("metode_pembayaran")
      .notNull()
      .default("transfer"),
    keterangan: text("keterangan"), // catatan tambahan
    biayaTambahan: integer("biaya_tambahan").default(0).notNull(),
    catatanBiayaTambahan: text("catatan_biaya_tambahan"),
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
  },
  (table) => [
    index("pencairan_user_status_idx").on(table.userId, table.status),
  ],
);

export const insertPencairanDanaSchema = createInsertSchema(pencairanDana);
export const selectPencairanDanaSchema = createSelectSchema(pencairanDana);

export type PencairanDana = typeof pencairanDana.$inferSelect;
export type NewPencairanDana = typeof pencairanDana.$inferInsert;
