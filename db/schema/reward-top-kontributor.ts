import {
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "@/db/schema/nasabah";

export const rewardTopKontributor = pgTable(
  "reward_top_kontributor",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    adminId: integer("admin_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    periodeBulan: integer("periode_bulan").notNull(), // 1 - 12
    periodeTahun: integer("periode_tahun").notNull(), // e.g. 2026
    kategori: text("kategori").notNull(), // "konsumen" | "warmindo"
    peringkat: integer("peringkat").notNull(), // 1 - 10
    totalBeratKg: doublePrecision("total_berat_kg").notNull().default(0),
    poinReward: integer("poin_reward").notNull(),
    catatan: text("catatan"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("reward_kontributor_periode_idx").on(
      table.periodeTahun,
      table.periodeBulan,
    ),
    index("reward_kontributor_user_idx").on(table.userId),
    index("reward_kontributor_admin_idx").on(table.adminId),
  ],
);

export const insertRewardTopKontributorSchema =
  createInsertSchema(rewardTopKontributor);
export const selectRewardTopKontributorSchema =
  createSelectSchema(rewardTopKontributor);
export type RewardTopKontributor = typeof rewardTopKontributor.$inferSelect;
export type NewRewardTopKontributor = typeof rewardTopKontributor.$inferInsert;
