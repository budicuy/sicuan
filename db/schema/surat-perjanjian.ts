import {
  date,
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

export const statusSuratPerjanjianEnum = pgEnum("status_surat_perjanjian", [
  "aktif",
  "expired",
  "diarsipkan",
]);

export const suratPerjanjian = pgTable(
  "surat_perjanjian",
  {
    id: serial("id").primaryKey(),
    nomorSurat: text("nomor_surat").notNull().unique(),
    judul: text("judul").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => nasabah.id, { onDelete: "cascade" }),
    kategoriMitra: text("kategori_mitra").notNull(), // 'bank-sampah' | 'bank-sampah-b' | 'warmindo'
    fileUrl: text("file_url").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size"),
    tanggalMulai: date("tanggal_mulai").notNull(),
    tanggalBerakhir: date("tanggal_berakhir").notNull(),
    status: statusSuratPerjanjianEnum("status").notNull().default("aktif"),
    suratSebelumnyaId: integer("surat_sebelumnya_id"), // relasi ke surat lama yang diarsipkan
    catatan: text("catatan"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("surat_perjanjian_user_id_idx").on(table.userId),
    index("surat_perjanjian_status_idx").on(table.status),
    index("surat_perjanjian_kategori_idx").on(table.kategoriMitra),
    index("surat_perjanjian_tanggal_berakhir_idx").on(table.tanggalBerakhir),
  ],
);

export const insertSuratPerjanjianSchema = createInsertSchema(suratPerjanjian);
export const selectSuratPerjanjianSchema = createSelectSchema(suratPerjanjian);

export type SuratPerjanjian = typeof suratPerjanjian.$inferSelect;
export type NewSuratPerjanjian = typeof suratPerjanjian.$inferInsert;
