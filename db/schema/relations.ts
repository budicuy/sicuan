import { relations } from "drizzle-orm";
import { buktiPembayaran } from "@/db/schema/bukti-pembayaran";
import { ekspedisi } from "@/db/schema/ekspedisi";
import { nasabah, users } from "@/db/schema/nasabah";
import { pencairanDana } from "@/db/schema/pencairan-dana";
import {
  penukaranRewardWarmindo,
  rewardWarmindo,
} from "@/db/schema/reward-warmindo";
import { setorSampah } from "@/db/schema/setor-sampah";

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(nasabah, {
    fields: [users.id],
    references: [nasabah.id],
  }),
}));

export const nasabahRelations = relations(nasabah, ({ one, many }) => ({
  user: one(users, {
    fields: [nasabah.id],
    references: [users.id],
  }),
  setorSampah: many(setorSampah),
  penukaranRewardWarmindo: many(penukaranRewardWarmindo),
}));

export const setorSampahRelations = relations(setorSampah, ({ one }) => ({
  user: one(nasabah, {
    fields: [setorSampah.userId],
    references: [nasabah.id],
  }),
  ekspedisi: one(ekspedisi, {
    fields: [setorSampah.ekspedisiId],
    references: [ekspedisi.id],
  }),
  bankSampah: one(nasabah, {
    fields: [setorSampah.bankSampahId],
    references: [nasabah.id],
  }),
}));

export const pencairanDanaRelations = relations(pencairanDana, ({ one }) => ({
  user: one(nasabah, {
    fields: [pencairanDana.userId],
    references: [nasabah.id],
  }),
  buktiPembayaran: one(buktiPembayaran, {
    fields: [pencairanDana.id],
    references: [buktiPembayaran.pencairanDanaId],
  }),
}));

export const buktiPembayaranRelations = relations(
  buktiPembayaran,
  ({ one }) => ({
    user: one(nasabah, {
      fields: [buktiPembayaran.userId],
      references: [nasabah.id],
    }),
    pencairanDana: one(pencairanDana, {
      fields: [buktiPembayaran.pencairanDanaId],
      references: [pencairanDana.id],
    }),
  }),
);

export const rewardWarmindoRelations = relations(
  rewardWarmindo,
  ({ many }) => ({
    penukaran: many(penukaranRewardWarmindo),
  }),
);

export const penukaranRewardWarmindoRelations = relations(
  penukaranRewardWarmindo,
  ({ one }) => ({
    user: one(nasabah, {
      fields: [penukaranRewardWarmindo.userId],
      references: [nasabah.id],
    }),
    reward: one(rewardWarmindo, {
      fields: [penukaranRewardWarmindo.rewardId],
      references: [rewardWarmindo.id],
    }),
  }),
);
