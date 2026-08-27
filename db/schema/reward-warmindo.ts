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

export const kategoriRewardWarmindoEnum = pgEnum("kategori_reward_warmindo", [
  "barang",
  "uang",
]);

export const statusPenukaranRewardWarmindoEnum = pgEnum(
  "status_penukaran_reward_warmindo",
  ["pending", "diproses", "berhasil", "ditolak"],
);

export const statusRewardWarmindoEnum = pgEnum("status_reward_warmindo", [
  "aktif",
  "nonaktif",
]);

export const rewardWarmindo = pgTable("reward_warmindo", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  kategori: kategoriRewardWarmindoEnum("kategori").notNull().default("barang"),
  deskripsi: text("deskripsi").notNull().default(""),
  poin: integer("poin").notNull(), // Jumlah poin yang dibutuhkan untuk menukar
  nominalUang: integer("nominal_uang"), // Nilai nominal rupiah jika kategori uang
  stok: integer("stok").notNull().default(100),
  gambar: text("gambar"),
  status: statusRewardWarmindoEnum("status").notNull().default("aktif"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const penukaranRewardWarmindo = pgTable(
  "penukaran_reward_warmindo",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => nasabah.id, { onDelete: "cascade" }),
    rewardId: integer("reward_id").references(() => rewardWarmindo.id, {
      onDelete: "set null",
    }),
    namaReward: text("nama_reward").notNull(),
    kategori: kategoriRewardWarmindoEnum("kategori").notNull(),
    poinDipotong: integer("poin_dipotong").notNull(),
    nominalUang: integer("nominal_uang"),
    status: statusPenukaranRewardWarmindoEnum("status")
      .notNull()
      .default("pending"),

    // Detail untuk kategori "uang"
    jenisBank: text("jenis_bank"),
    noRekening: text("no_rekening"),
    atasNama: text("atas_nama"),

    // Detail untuk kategori "barang"
    alamatPengiriman: text("alamat_pengiriman"),

    // Catatan
    catatan: text("catatan"),
    catatanAdmin: text("catatan_admin"),

    // Bukti pemenuhan reward
    buktiTransfer: text("bukti_transfer"), // Untuk kategori uang
    nomorResi: text("nomor_resi"), // Untuk kategori barang

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("penukaran_reward_user_idx").on(table.userId),
    index("penukaran_reward_status_idx").on(table.status),
  ],
);

export const insertRewardWarmindoSchema = createInsertSchema(rewardWarmindo);
export const selectRewardWarmindoSchema = createSelectSchema(rewardWarmindo);
export type RewardWarmindo = typeof rewardWarmindo.$inferSelect;
export type NewRewardWarmindo = typeof rewardWarmindo.$inferInsert;

export const insertPenukaranRewardWarmindoSchema = createInsertSchema(
  penukaranRewardWarmindo,
);
export const selectPenukaranRewardWarmindoSchema = createSelectSchema(
  penukaranRewardWarmindo,
);
export type PenukaranRewardWarmindo =
  typeof penukaranRewardWarmindo.$inferSelect;
export type NewPenukaranRewardWarmindo =
  typeof penukaranRewardWarmindo.$inferInsert;
