import {
  doublePrecision,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { pencairanDana } from "@/db/schema/pencairan-dana";
import { users } from "@/db/schema/users";

export interface DataSampahItem {
  jenis: string;
  beratKg: number;
  terlampir: boolean;
}

export const buktiPembayaran = pgTable("bukti_pembayaran", {
  id: serial("id").primaryKey(),
  nomorDokumen: text("nomor_dokumen").notNull().unique(),
  pencairanDanaId: integer("pencairan_dana_id").references(
    () => pencairanDana.id,
    { onDelete: "set null" },
  ),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Identitas Pelanggan
  namaBankSampah: text("nama_bank_sampah").notNull(),
  idPelanggan: text("id_pelanggan").notNull(),
  nama: text("nama").notNull(),
  alamat: text("alamat"),
  noTelepon: text("no_telepon"),

  // Periode & Kategori
  periodeBulan: text("periode_bulan").notNull(), // e.g. "Mei"
  periodeTahun: integer("periode_tahun").notNull(), // e.g. 2026
  // kategori sumber: "bank_sampah_induk" | "tps_3r" | "bank_sampah_unit"
  kategoriSumber: text("kategori_sumber")
    .notNull()
    .default("bank_sampah_induk"),

  // Data Berat Sampah — JSON array of DataSampahItem
  dataSampah: json("data_sampah").$type<DataSampahItem[]>().notNull(),
  totalBeratKg: doublePrecision("total_berat_kg").notNull(),

  // Rincian Pembayaran
  tarifDasar: integer("tarif_dasar").notNull().default(0),
  biayaTambahan: integer("biaya_tambahan").notNull().default(0),
  totalTagihan: integer("total_tagihan").notNull(),

  // Metode Pembayaran: "tunai" | "transfer" | "qris"
  metodePembayaran: text("metode_pembayaran").notNull().default("transfer"),
  keterangan: text("keterangan"),

  // Tanda Tangan (URL ke R2)
  ttdPenyerahUrl: text("ttd_penyerah_url"), // uploaded by mitra
  ttdPenerimaUrl: text("ttd_penerima_url"), // uploaded by admin

  // Nama penandatangan
  namaPenyerah: text("nama_penyerah"),
  jabatanPenyerah: text("jabatan_penyerah"),
  namaPenerima: text("nama_penerima"),
  jabatanPenerima: text("jabatan_penerima"),

  // Status: "draft" | "final"
  status: text("status").notNull().default("draft"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertBuktiPembayaranSchema = createInsertSchema(buktiPembayaran);
export const selectBuktiPembayaranSchema = createSelectSchema(buktiPembayaran);

export type BuktiPembayaran = typeof buktiPembayaran.$inferSelect;
export type NewBuktiPembayaran = typeof buktiPembayaran.$inferInsert;
